# Family-Planner

A starter **smart family planner** project using **Next.js** that is ready to deploy on **Vercel**.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy to Vercel

### Option A: Vercel dashboard (recommended)
1. Push this repository to GitHub/GitLab/Bitbucket.
2. In Vercel, click **Add New... → Project**.
3. Import this repository.
4. Keep the detected framework as **Next.js**.
5. Click **Deploy**.

### Option B: Vercel CLI
```bash
npm install -g vercel
vercel
```

For production deployment:
```bash
vercel --prod
```

## Included setup
- Next.js app router scaffold (`app/`)
- `vercel.json` configured for Next.js framework and region selection
- `npm` scripts for local development and production build

## Recommended next features
- Shared calendar events with recurrence
- Chore assignment and completion tracking
- Meal planning and grocery list generation
- Smart scheduling suggestions
