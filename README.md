# Family Planner 🏠

A comprehensive **smart family organization platform** built with Next.js, designed to help families coordinate schedules, manage chores, and plan together efficiently.

🔗 **Live Demo:** [family-planner-omega.vercel.app](https://family-planner-omega.vercel.app)

## ✨ Features

- 📅 **Shared Calendar** - Coordinate family events with recurring event support
- 🧹 **Chore Board** - Assign, track, and complete household tasks with drag-and-drop interface
- 📝 **Template Library** - Pre-built chore templates for common household tasks
- 🤖 **AI-Powered Suggestions** - Smart scheduling and task recommendations
- 👥 **Multi-User Support** - Separate profiles for each family member
- ⏰ **Recurring Events** - Set up repeating tasks and events automatically
- 📊 **Progress Tracking** - Monitor task completion and working hours

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Prisma ORM with PostgreSQL
- **AI Integration:** Anthropic Claude API
- **UI Features:** Drag-and-drop with @dnd-kit
- **Validation:** Zod schema validation
- **Deployment:** Vercel
- **Styling:** Modern CSS with responsive design

## 🏁 Quick Start

### Prerequisites
- Node.js 20.x
- npm or yarn
- PostgreSQL database (or use Vercel Postgres)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Rhistel0475/Family-Planner.git
cd Family-Planner
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` and add your database URL and API keys.

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Seed the database with templates (optional):
```bash
node seed-templates.js
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
Family-Planner/
├── app/              # Next.js app router pages and layouts
├── lib/              # Utility functions and shared code
├── prisma/           # Database schema and migrations
├── migrations/       # SQL migration files
└── docs/            # Additional documentation (see below)
```

## 📚 Documentation

Detailed guides are available in the repository:

- [Quick Reference Guide](QUICK_REFERENCE.md) - Common tasks and commands
- [Chore Board Setup](CHORE_BOARD_SETUP.md) - Configuring the chore system
- [Recurring Events Setup](RECURRING_EVENTS_SETUP.md) - Setting up recurring tasks
- [Template Library](CHORE_TEMPLATE_LIBRARY.md) - Pre-built chore templates
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - Production deployment guide
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md) - Technical implementation details
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions

## 🚢 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Rhistel0475/Family-Planner)

Or manually:

1. Push this repository to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel settings
4. Deploy

### Environment Variables

Create a `.env` file with the following:

```env
DATABASE_URL="postgresql://..."
ANTHROPIC_API_KEY="sk-ant-..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is private and not currently licensed for public use.

## 🔧 Development Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
```

## 📞 Support

For issues and questions, please [open an issue](https://github.com/Rhistel0475/Family-Planner/issues) on GitHub.

---

## 🛠️ Troubleshooting

### Common Git Setup Issues

If you encounter Git or GitHub authentication errors, see our detailed [Troubleshooting Guide](TROUBLESHOOTING.md) for solutions to:
- Git repository setup errors
- GitHub authentication with PAT or SSH
- Vercel deployment issues
- Pull request creation

### Quick Fixes

**Not in Git repository?**
```bash
find ~ -maxdepth 3 -type d -name "Family-Planner" 2>/dev/null
cd /path/from/find
```

**Vercel build failing?**
```bash
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json is valid')"
```

For detailed troubleshooting steps, please refer to the [full troubleshooting guide](TROUBLESHOOTING.md).
