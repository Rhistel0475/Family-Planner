#!/bin/bash
# Deployment Script for Family-Planner to Vercel
# Run these commands in order in your terminal

# 1. Check git status
git status

# 2. Add all changes
git add app/chores/page.js lib/ai.js app/api/ai/chores/route.js lib/choreAssignment.js

# 3. Commit with descriptive message
git commit -m "feat: enhance chore template library with improved validation and assignment logic

- Add comprehensive form validation to prevent invalid submissions
- Enhance AI prompt context with eligibility constraint information
- Pre-validate eligibility constraints before AI assignment
- Improve error messages and reasoning for rule-based assignments
- Add comprehensive documentation for system features

No breaking changes. Fully backward compatible."

# 4. Push to GitHub (Vercel will auto-deploy)
git push origin main

# 5. Check Vercel deployment
echo "✅ Changes pushed! Check Vercel dashboard for deployment status"
echo "→ https://vercel.com/dashboard"
