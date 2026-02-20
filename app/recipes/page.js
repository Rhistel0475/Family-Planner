'use client';

import { useSearchParams } from 'next/navigation';
import { useTheme } from '../providers/ThemeProvider';
import Button from '../components/Button';
import { Label, Input, Select } from '../components/form';
import { MAIN_PADDING_WITH_NAV, CONTENT_WIDTH_FORM_NARROW } from '../../lib/layout';

export default function RecipesPage() {
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const saved = searchParams?.get('saved') === '1';
  const error = searchParams?.get('error') === '1';

  return (
    <main
      style={{
        ...styles.main,
        backgroundColor: theme.pageBackground,
        backgroundImage: theme.pageGradient || undefined,
        color: theme.card.text
      }}
    >
      <section
        style={{
          ...styles.card,
          background: theme.card.bg[1],
          border: `1px solid ${theme.card.border}`
        }}
      >
        <h1 style={styles.title}>Add Recipe Plan</h1>
        <p style={styles.subtitle}>Add meal ideas that can later feed grocery planning.</p>
        {saved && <p style={styles.success}>Recipe saved.</p>}
        {error && <p style={styles.error}>Please complete all fields.</p>}

        <form action="/api/recipes" method="POST">
          <Label>Recipe Name</Label>
          <Input name="name" placeholder="Chicken Alfredo" style={styles.inputSpacing} />

          <Label>Ingredients</Label>
          <Input name="ingredients" placeholder="Pasta, chicken, cream, garlic" style={styles.inputSpacing} />

          <Label>Cook Day</Label>
          <Select name="cookDay" defaultValue="Sunday" style={styles.inputSpacing}>
            <option>Monday</option>
            <option>Tuesday</option>
            <option>Wednesday</option>
            <option>Thursday</option>
            <option>Friday</option>
            <option>Saturday</option>
            <option>Sunday</option>
          </Select>

          <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '0.75rem' }}>
            Save Recipe
          </Button>
        </form>
      </section>
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
};
