/**
 * Environment variable validation
 * This ensures all required environment variables are set before the app starts
 */

function validateEnv() {
  const required = ['DATABASE_URL'];
  const missing = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or deployment environment settings.'
    );
  }

  // Warn if AI features won't work
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      '⚠️  ANTHROPIC_API_KEY is not set. AI features will use fallback logic.'
    );
  }
}

// Run validation immediately when this module is imported
if (typeof window === 'undefined') {
  // Only validate on server-side
  validateEnv();
}

export { validateEnv };
