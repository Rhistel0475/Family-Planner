# Family Planner — Plan & Roadmap

This document tracks the build plan for the Family Planner app (Next.js + Prisma + Postgres/Supabase).
It’s organized by phases so we can ship in small, testable increments.

---

## Current State Summary

### ✅ Completed Phases
- **Supabase Postgres + Prisma connected**
  - Migrations running
  - Prisma client generating successfully
- **Family Members**
  - Add / Edit / Delete
  - Avatar + color support
  - Undo delete (toast)
  - API validation + default family creation
- **Week View Board (Dnd-kit)**
  - Drag chores across days
  - Drag events across days
  - Optimistic UI + undo on move
  - Mobile-friendly handling
- **Chores**
  - Create / assign (member or “All Members”)
  - Completion toggle
  - Delete chore
  - Weekly display and completion progress indicators
- **Events**
  - CRUD route improvements (GET/POST/PATCH/DELETE)
  - Server-side validation for title + start/end time logic
  - `startsAt`/`endsAt` supported in route (with validation)

**Phase 1 — Foundation (DONE ✅)**
- Database connected (Supabase Postgres + Prisma)
- Family Members CRUD with avatars and colors
- Chores CRUD with completion tracking
- Weekly board UI with drag & drop
- Basic toast notifications

**Phase 1.5 — Stabilization (DONE ✅)**
- Prisma schema consistency verified
- API routes standardized (GET/POST/PATCH/DELETE)
- Event validation and date handling
- Migration cleanup and reconciliation

**Phase 2 — Events UX Upgrade (DONE ✅)**
- Event form with time ranges and presets
- Category badges and location support
- Click-to-edit functionality
- Enhanced event display on week board

**Phase 3 — Performance & Data Scoping (DONE ✅)**
- Date range filtering for events API
- Date range filtering for chores API
- Optimized week navigation data fetching
- Reduced client-side filtering

**Phase 4 — Work Hours on Member Page (DONE ✅)**
- Working hours field in FamilyMember schema
- UI for setting working hours (presets + custom)
- Work blocks displayed on week board
- Separate "Work" section visualization

**Phase 5 — Dashboard & Quality of Life (DONE ✅)**
- Dashboard summary page with today's overview
- Today's events, chores, and overdue items
- Weekly completion progress tracking
- Enhanced empty states with helpful tips
- Keyboard navigation and accessibility improvements

**Phase 6 — Recurrence System (DONE ✅)**
- Virtual instance generation (Option B - Best Practice)
- Support for DAILY, WEEKLY, MONTHLY, YEARLY patterns
- Recurrence intervals and end dates
- UI for creating recurring events

### 🚀 Next Up
- **Phase 7 — Auth & Multi-Family** (FUTURE)
  - User authentication
  - Multi-family support
  - Family invitations

---

## Product Goals

### Primary Goal
A simple family “weekly board” that makes it easy to:
- Track chores by day and assignee
- Track events by day with real start/end times
- Filter the board by a family member
- Quickly add items without friction

### UX Requirements
- Fast load (avoid pulling all history)
- Simple forms with guardrails
- Visible delete actions where appropriate
- Clean, readable weekly layout

---

## Roadmap

## Phase 1 — Foundation (DONE ✅)
**Ship a working board with data persistence**
- [x] DB connected (Supabase + Prisma)
- [x] Migrations working
- [x] Family Members CRUD
- [x] Chores CRUD + completion
- [x] Weekly board UI
- [x] Drag & drop for chores/events
- [x] Basic toast notifications

---

## Phase 1.5 — Stabilization / Consistency (DONE ✅)
**Lock the schema + routes + UI into a consistent model**

### Prisma
- [x] Ensure `schema.prisma` contains ONLY Prisma schema (no JS/CSS fragments)
- [x] Confirm `Event` fields are correct: `startsAt`, `endsAt`, optional metadata fields
- [x] Confirm enums align with UI and route:
  - `EventType`
  - `EventCategory` (if used)
- [x] Remove / reconcile any partial migration folders (e.g. blank timestamp folders)

### API
- [x] Confirm `/api/schedule` supports:
  - GET (optionally by date range)
  - POST (title + startsAt required, endsAt optional, validate endsAt > startsAt)
  - PATCH (partial updates, validate dates)
  - DELETE (by `?id=...`)
- [x] Confirm `/api/chores` supports expected PATCH updates (dueDay, completion)

### UI
- [x] Remove “Work hours” from Schedule page (work belongs on Member page)
- [x] Confirm event delete button is visible and consistent everywhere

---

## Phase 2 — Events UX Upgrade (DONE ✅)
**Make events feel real (time + type + category presets)**

### Event Form Requirements
- [x] Event must support:
  - Start date
  - Start time
  - End time (optional but recommended)
- [x] Add dropdown presets for common event types:
  - Doctor Appointment
  - Dentist Appointment
  - School Event
  - Practice
  - Game
  - Church
  - Family Event
  - Other (custom)
- [x] Allow “Custom name” to override preset (or add details)
- [x] Optional fields:
  - Location
  - Notes/description

### Display Requirements (Week Board)
- [x] Event card shows:
  - Time range (e.g. `4:30 PM–6:00 PM`)
  - Title
  - Category badge
  - Location (optional)
- [x] Clicking an event opens edit modal
- [x] Delete icon/button visible on each event entry

---

## Phase 3 — Performance & Data Scoping (DONE ✅)
**Stop fetching entire history; fetch only what we need**

### API improvements
- [x] Update schedule GET to accept:
  - `?start=YYYY-MM-DD&end=YYYY-MM-DD`
- [x] Update Prisma query to filter by `startsAt` range
- [x] Mirror same behavior for chores if needed (optional)

### UI improvements
- [x] Week navigation triggers range fetch
- [x] Reduce client-side filtering

---

## Phase 4 — Work Hours on Member Page (DONE ✅)
**Move “Work Hours” into Family Members, not Schedule**

### Data model
- [x] Add `workingHours` (string or structured) to `FamilyMember` (already exists in schema)
- [x] Create UI on member edit modal:
  - Example: `Mon 9-5, Tue 9-5 ...` (phase 1)
  - Future: structured per-day (phase 2)

### Week board
- [x] Show work blocks derived from member working hours (optional)
- [x] Work display should be non-event “background” or separate “Work” block

---

## Phase 5 — Dashboard & Quality of Life (DONE ✅)
- [x] `/dashboard` summary:
  - Today’s events
  - Today’s chores
  - Overdue chores
  - Weekly completion progress
- [x] Better empty states and inline help tips
- [x] Keyboard-friendly controls and accessibility checks

---

## Phase 6 — Recurrence System (DONE ✅)
**Decision: Option B (Best Practice) - Store recurrence rule, generate instances virtually**

### Implementation
- [x] Store recurrence rules in database (isRecurring, recurrencePattern, recurrenceInterval, recurrenceEndDate)
- [x] Generate instances virtually using `getOccurrencesInRange()` utility
- [x] API expands recurring events into occurrences on-the-fly when fetching with date ranges
- [x] UI supports creating recurring events (Schedule page with repeats dropdown and end date picker)
- [x] Supports DAILY, WEEKLY, MONTHLY, YEARLY patterns with intervals
- [x] Optional recurrence end date for finite recurring events

**Status:** Fully implemented and working. Recurring events are stored as rules and expanded into occurrences when needed, keeping the database clean while providing full functionality.

---

## Phase 7 — Auth & Multi-Family (FUTURE)
- [ ] Add authentication
- [ ] Each user has a `familyId`
- [ ] Invite spouse/family members
- [ ] Shared board per family

---

## Known Issues / Risks
- Prisma enum migrations in Postgres can fail if multiple values are added in one migration.
  - Preferred approach: split into multiple migrations or manually commit between changes if required.
- Avoid placing ANY non-Prisma content in `schema.prisma`.
- Keep schedule GET scoped to week range to prevent slow loads.

---

## Definition of Done (DoD)
A task is “Done” when:
- UI works on desktop and mobile
- API validates inputs
- DB schema is consistent
- No console errors
- Feature is reflected in this roadmap as checked ✅

---

## Notes for Contributors
- Prefer small PRs: 1 feature, 1 PR
- Keep UI consistent with existing styles
- Use optimistic UI patterns where possible
- Validate server-side even if UI validates

