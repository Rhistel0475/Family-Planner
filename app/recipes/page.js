'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTheme } from '../providers/ThemeProvider';
import Button from '../components/Button';
import { Label, Input, Select } from '../components/form';
import { MAIN_PADDING_WITH_NAV, CONTENT_WIDTH_FORM_NARROW } from '../../lib/layout';

const COOK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function RecipesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const saved = searchParams?.get('saved') === '1';
  const error = searchParams?.get('error') === '1';

  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [cookDay, setCookDay] = useState('Sunday');
  const [sourceUrl, setSourceUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [pickingId, setPickingId] = useState(null);

  function refetchRecipes() {
    return fetch('/api/recipes')
      .then((res) => (res.ok ? res.json() : { recipes: [] }))
      .then((data) => setRecipes(Array.isArray(data.recipes) ? data.recipes : []))
      .catch(() => setRecipes([]));
  }

  useEffect(() => {
    refetchRecipes();
  }, [saved]);

  async function handleImport() {
    const url = importUrl.trim();
    if (!url) return;
    setImportError('');
    setImporting(true);
    try {
      const res = await fetch('/api/recipes/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error || 'Could not extract recipe. Try manual entry.');
        return;
      }
      setName(data.name || '');
      setIngredients(data.ingredients || '');
      setInstructions(data.instructions || '');
      setSourceUrl(url);
      setImportError('');
    } catch {
      setImportError('Could not fetch recipe. Try manual entry.');
    } finally {
      setImporting(false);
    }
  }

  function clearForm() {
    setName('');
    setIngredients('');
    setInstructions('');
    setSourceUrl('');
    setCookDay('Sunday');
    setEditingId(null);
  }

  function loadRecipeIntoForm(r, forReuse = false) {
    setName(r.name || '');
    setIngredients(r.ingredients || '');
    setInstructions(r.instructions || '');
    setSourceUrl(r.sourceUrl || '');
    setCookDay(r.cookDay || 'Sunday');
    setEditingId(forReuse ? null : r.id);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !ingredients.trim() || !cookDay) {
      router.push('/recipes?error=1');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch('/api/recipes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            name: name.trim(),
            ingredients: ingredients.trim(),
            instructions: instructions.trim() || null,
            sourceUrl: sourceUrl.trim() || null,
            cookDay
          })
        });
        if (res.ok) {
          clearForm();
          await refetchRecipes();
          router.push('/recipes?saved=1');
          return;
        }
        router.push('/recipes?error=1');
        return;
      }
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          ingredients: ingredients.trim(),
          cookDay,
          instructions: instructions.trim() || null,
          sourceUrl: sourceUrl.trim() || null
        })
      });
      if (res.ok || res.status === 201) {
        router.push('/recipes?saved=1');
        clearForm();
        await refetchRecipes();
        return;
      }
      router.push('/recipes?error=1');
    } catch {
      router.push('/recipes?error=1');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(recipeId) {
    if (deletingId) return;
    setDeletingId(recipeId);
    try {
      const res = await fetch(`/api/recipes?id=${encodeURIComponent(recipeId)}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        if (editingId === recipeId) clearForm();
        await refetchRecipes();
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetPickedForWeek(recipeId, pickedForWeek) {
    if (pickingId) return;
    setPickingId(recipeId);
    try {
      const res = await fetch('/api/recipes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recipeId, pickedForWeek })
      });
      if (res.ok) await refetchRecipes();
    } finally {
      setPickingId(null);
    }
  }

  const themeInput = theme?.input || {};
  const inputBorder = themeInput.border || theme?.card?.border;

  return (
    <main
      style={{
        ...styles.main,
        backgroundColor: theme.pageBackground,
        backgroundImage: theme.pageGradient || undefined,
        color: theme.card?.text || '#3f2d1d'
      }}
    >
      <section
        style={{
          ...styles.card,
          background: theme.card?.bg?.[1],
          border: `1px solid ${theme.card?.border}`
        }}
      >
        <h1 style={styles.title}>Recipe Library</h1>
        <p style={styles.subtitle}>Your recipes are stored here and used for meal planning and across the app. Import from a URL or add manually.</p>
        {saved && <p style={styles.success}>Recipe saved.</p>}
        {error && <p style={styles.error}>Please complete all fields.</p>}

        {/* Import from URL */}
        <div style={styles.section}>
          <Label>Import from URL</Label>
          <p style={styles.hint}>Paste a recipe page link (e.g. AllRecipes, BBC Good Food) to fill the form below.</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Input
              type="url"
              placeholder="https://..."
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              style={{ flex: 1 }}
              disabled={importing}
            />
            <Button
              type="button"
              variant="primary"
              onClick={handleImport}
              disabled={importing || !importUrl.trim()}
            >
              {importing ? 'Importing…' : 'Import recipe'}
            </Button>
          </div>
          {importError && <p style={styles.importError}>{importError}</p>}
        </div>

        {/* Recipe form */}
        <form onSubmit={handleSubmit} style={{ marginTop: '1.25rem' }}>
          <Label>Recipe Name</Label>
          <Input
            name="name"
            placeholder="Chicken Alfredo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.inputSpacing}
            required
          />

          <Label>Ingredients</Label>
          <textarea
            name="ingredients"
            placeholder="Pasta, chicken, cream, garlic (one per line or comma-separated)"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={4}
            required
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem',
              borderRadius: 6,
              border: `1px solid ${inputBorder}`,
              background: themeInput.bg || theme?.card?.bg?.[0],
              color: themeInput.text || theme?.card?.text,
              fontSize: '0.95rem',
              boxSizing: 'border-box',
              resize: 'vertical',
              ...styles.inputSpacing
            }}
          />

          <Label>Instructions (optional)</Label>
          <textarea
            name="instructions"
            placeholder="Step 1: ... Step 2: ..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem',
              borderRadius: 6,
              border: `1px solid ${inputBorder}`,
              background: themeInput.bg || theme?.card?.bg?.[0],
              color: themeInput.text || theme?.card?.text,
              fontSize: '0.95rem',
              boxSizing: 'border-box',
              resize: 'vertical',
              ...styles.inputSpacing
            }}
          />

          <Label>Cook Day</Label>
          <Select
            name="cookDay"
            value={cookDay}
            onChange={(e) => setCookDay(e.target.value)}
            style={styles.inputSpacing}
          >
            {COOK_DAYS.map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </Select>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <Button type="submit" variant="primary" style={{ flex: 1 }} disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Update Recipe' : 'Save Recipe'}
            </Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={clearForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </section>

      {/* This week's recipes */}
      {recipes.some((r) => r.pickedForWeek) && (
        <section
          style={{
            ...styles.card,
            marginTop: '1.5rem',
            background: theme.card?.bg?.[0],
            border: `1px solid ${theme.card?.border}`
          }}
        >
          <h2 style={styles.listTitle}>This week&apos;s recipes</h2>
          <p style={styles.hint}>Meal planning will use only these when you run it. Add or remove from the list below.</p>
          <ul style={styles.list}>
            {recipes.filter((r) => r.pickedForWeek).map((r) => (
              <li key={r.id} style={styles.listItem}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{r.name}</strong>
                  <span style={styles.cookDay}> — {r.cookDay}</span>
                  {r.instructions && (
                    <p style={styles.instructionsPreview}>{r.instructions.slice(0, 80)}{r.instructions.length > 80 ? '…' : ''}</p>
                  )}
                </div>
                <div style={styles.recipeActions}>
                  {r.sourceUrl && (
                    <a
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.sourceLink}
                    >
                      Source
                    </a>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={() => handleSetPickedForWeek(r.id, false)}
                    disabled={pickingId === r.id}
                  >
                    {pickingId === r.id ? '…' : 'Remove from week'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={() => loadRecipeIntoForm(r, false)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={() => loadRecipeIntoForm(r, true)}
                  >
                    Use for another day
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={() => handleDelete(r.id)}
                    disabled={deletingId === r.id}
                  >
                    {deletingId === r.id ? 'Deleting…' : 'Delete'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Saved recipes list */}
      {recipes.length > 0 && (
        <section
          style={{
            ...styles.card,
            marginTop: '1.5rem',
            background: theme.card?.bg?.[0],
            border: `1px solid ${theme.card?.border}`
          }}
        >
          <h2 style={styles.listTitle}>Saved Recipes</h2>
          <ul style={styles.list}>
            {recipes.map((r) => (
              <li key={r.id} style={styles.listItem}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{r.name}</strong>
                  {r.pickedForWeek && (
                    <span style={styles.weekBadge}> In this week</span>
                  )}
                  <span style={styles.cookDay}> — {r.cookDay}</span>
                  {r.instructions && (
                    <p style={styles.instructionsPreview}>{r.instructions.slice(0, 80)}{r.instructions.length > 80 ? '…' : ''}</p>
                  )}
                </div>
                <div style={styles.recipeActions}>
                  {r.pickedForWeek ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="small"
                      onClick={() => handleSetPickedForWeek(r.id, false)}
                      disabled={pickingId === r.id}
                    >
                      {pickingId === r.id ? '…' : 'Remove from week'}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      size="small"
                      onClick={() => handleSetPickedForWeek(r.id, true)}
                      disabled={pickingId === r.id}
                    >
                      {pickingId === r.id ? '…' : 'Add to this week'}
                    </Button>
                  )}
                  {r.sourceUrl && (
                    <a
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.sourceLink}
                    >
                      Source
                    </a>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={() => loadRecipeIntoForm(r, false)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={() => loadRecipeIntoForm(r, true)}
                  >
                    Use for another day
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={() => handleDelete(r.id)}
                    disabled={deletingId === r.id}
                  >
                    {deletingId === r.id ? 'Deleting…' : 'Delete'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

const styles = {
  main: {
    minHeight: '100vh',
    padding: MAIN_PADDING_WITH_NAV
  },
  card: {
    maxWidth: CONTENT_WIDTH_FORM_NARROW,
    margin: '0 auto',
    borderRadius: 10,
    boxShadow: '0 14px 24px rgba(70, 45, 11, 0.2)',
    padding: '1.2rem'
  },
  title: {
    marginBottom: '0.35rem'
  },
  subtitle: {
    marginBottom: '1rem'
  },
  section: {
    marginBottom: '0.5rem'
  },
  hint: {
    fontSize: '0.875rem',
    opacity: 0.85,
    marginBottom: '0.5rem'
  },
  inputSpacing: {
    marginBottom: '0.8rem'
  },
  success: {
    marginBottom: '0.8rem',
    padding: '0.5rem 0.6rem',
    borderRadius: 6,
    background: 'rgba(63, 152, 76, 0.15)',
    border: '1px solid rgba(44, 121, 57, 0.35)',
    color: '#1f602a'
  },
  error: {
    marginBottom: '0.8rem',
    padding: '0.5rem 0.6rem',
    borderRadius: 6,
    background: 'rgba(186, 62, 62, 0.12)',
    border: '1px solid rgba(186, 62, 62, 0.35)',
    color: '#8b1f1f'
  },
  importError: {
    marginBottom: '0.8rem',
    padding: '0.5rem 0.6rem',
    borderRadius: 6,
    background: 'rgba(186, 62, 62, 0.12)',
    border: '1px solid rgba(186, 62, 62, 0.35)',
    color: '#8b1f1f',
    fontSize: '0.9rem'
  },
  listTitle: {
    margin: '0 0 0.75rem 0',
    fontSize: '1.1rem'
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0
  },
  listItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '0.75rem 0',
    borderBottom: '1px solid rgba(0,0,0,0.08)'
  },
  cookDay: {
    fontWeight: 400,
    opacity: 0.85
  },
  weekBadge: {
    fontSize: '0.8rem',
    fontWeight: 600,
    opacity: 0.9,
    marginLeft: '0.35rem'
  },
  instructionsPreview: {
    margin: '0.35rem 0 0 0',
    fontSize: '0.85rem',
    opacity: 0.8,
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  sourceLink: {
    fontSize: '0.875rem',
    flexShrink: 0
  },
  recipeActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
    flexWrap: 'wrap'
  }
};
