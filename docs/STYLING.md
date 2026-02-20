# Styling and themes

This document describes the app’s styling approach and the Chores sub-theme.

## App-wide theme (post-it / cork)

- **Source:** `lib/themes.js` (`lightTheme` / `darkTheme`).
- **Used by:** Family, Setup, Schedule, AI, Recipes, Status, shared components (Modal, BottomNav, FilterBar, HamburgerMenu, Button, form primitives).
- **Tokens:** `pageBackground`, `pageGradient`, `card`, `hero`, `nav`, `button`, `input`, `toast`, etc. Use `useTheme()` and theme tokens instead of hardcoded hex so dark mode and consistency are preserved.

## Layout constants

- **Source:** `lib/layout.js`.
- **Tokens:** `MAIN_PADDING_WITH_NAV`, `MAIN_PADDING_CENTERED`, `CONTENT_WIDTH_FORM` (780), `CONTENT_WIDTH_FORM_NARROW` (560), `CONTENT_WIDTH_WIDE` (1200). Use these for main padding and content max-width so layout stays consistent.

## Chores sub-theme (distinct)

The **Chores** list and **Chore Board** use a **distinct sub-theme** on purpose:

- **Scope:** `app/chores/page.js`, `app/chores/board/page.js`, `app/chores/chores.module.css`, `app/chores/board/board.module.css`.
- **Look:** Brown gradient background (`#8b6f47` → `#a0826d`), cream post-it cards (`#fef3c7`), amber primary actions (`#f59e0b`), system font stack in the CSS modules.
- **Why separate:** Keeps the chore board visually distinct (cork + post-its) while the rest of the app uses the shared theme. Add/Edit chore flow uses the **shared** Modal and theme-based form components so that flow is consistent with the app.

Do not mix the Chores brown/amber palette with the main app theme elsewhere; keep it confined to the Chores area.

## Dashboard and Tailwind

- **Dashboard** (`app/dashboard/`, TodayOverview, WeekProgress, QuickActions, UpcomingChores) uses **Tailwind** (e.g. `text-gray-900`, `bg-blue-600`).
- **App theme in Tailwind:** `app/globals.css` defines an `@theme` block with app tokens (`--color-app-main`, `--color-app-page`, `--color-app-button-primary`, etc.). Use `bg-app-button-primary`, `text-app-card-text`, and similar classes in Tailwind components so the dashboard aligns with the rest of the app when desired.

## Shared components

- **Button:** `app/components/Button.js` — variants `primary`, `secondary`, `danger` from theme.
- **Modal:** `app/components/Modal.js` — theme-based; use for all modals (including Chores Add/Edit).
- **Form:** `app/components/form/` — `Label`, `Input`, `Select` using theme; use on forms across the app.
