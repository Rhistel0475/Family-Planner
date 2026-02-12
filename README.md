# Family-Planner

A starter **smart family planner** project using **Next.js** that is ready to deploy on **Vercel**.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Common Ubuntu Git setup fixes

If you see:
- `fatal: not a git repository (or any of the parent directories): .git`
- `cd: ~/Family-Planner: No such file or directory`

you are likely not in the correct project folder yet.

### 1) Find the repository folder
```bash
find ~ -maxdepth 3 -type d -name "Family-Planner" 2>/dev/null
```

### 2) Change into the real path returned above
```bash
cd /path/from/find
```

### 3) Confirm you're inside a Git repository
```bash
git rev-parse --is-inside-work-tree
```

### 4) Configure and verify Git remote
```bash
git remote set-url origin https://github.com/Rhistel0475/Family-Planner.git
git remote -v
```

### 5) Push your active branch (replace with real branch name)
```bash
git branch --show-current
git push -u origin main
```

> Note: Do not type placeholders like `<your-branch>` literally in shell commands.


## GitHub authentication error (`Invalid username or token`)

GitHub no longer supports account passwords for Git over HTTPS.
Use either a **Personal Access Token (PAT)** or **SSH keys**.

### Option A: HTTPS with PAT
1. Create a token in GitHub: **Settings → Developer settings → Personal access tokens**.
2. Give it repo access (`repo` scope for classic tokens).
3. Retry clone and use:
   - **Username**: your GitHub username (not email)
   - **Password**: your PAT token

```bash
git clone https://github.com/Rhistel0475/Family-Planner.git
```

To avoid typing credentials repeatedly on Ubuntu:
```bash
git config --global credential.helper store
```

### Option B: SSH (recommended long-term)
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
```

Add the printed key to GitHub: **Settings → SSH and GPG keys → New SSH key**, then test:
```bash
ssh -T git@github.com
git clone git@github.com:Rhistel0475/Family-Planner.git
```

### Why `cd Family-Planner` failed after clone
If authentication fails, cloning never completes, so the `Family-Planner` folder is not created.


## Fixing Vercel error: `Could not read package.json`

If Vercel shows:

```
Expected ',' or '}' after property value in JSON
```

it means the deployed commit contains invalid JSON in `package.json`.

Use these checks locally before pushing:

```bash
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json is valid')"
python -m json.tool package.json >/dev/null && echo "json syntax ok"
```

Then commit and redeploy the branch. If Vercel still shows the old failure, trigger a new deployment from the latest commit and disable stale cache for that deploy.

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
