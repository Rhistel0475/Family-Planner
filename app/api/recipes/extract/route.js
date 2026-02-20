import { NextResponse } from 'next/server';

const MAX_BODY_SIZE = 1024 * 1024; // 1MB
const FETCH_TIMEOUT_MS = 10000;   // 10s

function isValidUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

function findRecipeInJsonLd(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  const type = parsed['@type'];
  if (type === 'Recipe') return parsed;
  if (Array.isArray(type) && type.includes('Recipe')) return parsed;
  if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
    const found = parsed['@graph'].find(
      (item) => item && (item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe')))
    );
    if (found) return found;
  }
  return null;
}

function normalizeIngredients(recipeIngredient) {
  if (!recipeIngredient) return '';
  if (Array.isArray(recipeIngredient)) {
    return recipeIngredient.map((s) => String(s).trim()).filter(Boolean).join('\n');
  }
  return String(recipeIngredient).trim();
}

function normalizeInstructions(recipeInstructions) {
  if (!recipeInstructions) return '';
  if (Array.isArray(recipeInstructions)) {
    return recipeInstructions
      .map((step) => {
        if (typeof step === 'string') return step.trim();
        if (step && typeof step === 'object' && step.text) return String(step.text).trim();
        if (step && typeof step === 'object' && step.name) return String(step.name).trim();
        return '';
      })
      .filter(Boolean)
      .join('\n\n');
  }
  return String(recipeInstructions).trim();
}

export async function POST(request) {
  let url;
  try {
    const body = await request.json();
    url = typeof body.url === 'string' ? body.url.trim() : '';
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }
  if (!isValidUrl(url)) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  let html;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'FamilyPlanner/1.0 (Recipe Import)'
      }
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not load page (${res.status})` },
        { status: 422 }
      );
    }
    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Page too large to process' },
        { status: 422 }
      );
    }
    html = await res.text();
    if (html.length > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Page too large to process' },
        { status: 422 }
      );
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out' }, { status: 422 });
    }
    return NextResponse.json(
      { error: 'Could not fetch URL' },
      { status: 422 }
    );
  }

  const ldJsonRegex = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let recipe = null;

  while ((match = ldJsonRegex.exec(html)) !== null) {
    const raw = match[1].trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const candidate = findRecipeInJsonLd(parsed);
      if (candidate) {
        recipe = candidate;
        break;
      }
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const c = findRecipeInJsonLd(item);
          if (c) {
            recipe = c;
            break;
          }
        }
        if (recipe) break;
      }
    } catch {
      continue;
    }
  }

  if (!recipe) {
    return NextResponse.json(
      { error: 'No recipe data found on this page. Try entering the recipe manually.' },
      { status: 422 }
    );
  }

  const name = recipe.name ? String(recipe.name).trim() : '';
  const ingredients = normalizeIngredients(recipe.recipeIngredient);
  const instructions = normalizeInstructions(recipe.recipeInstructions);

  if (!name && !ingredients && !instructions) {
    return NextResponse.json(
      { error: 'Recipe data was found but name, ingredients, and instructions were empty.' },
      { status: 422 }
    );
  }

  return NextResponse.json({
    name: name || 'Imported Recipe',
    ingredients: ingredients || '',
    instructions: instructions || ''
  });
}
