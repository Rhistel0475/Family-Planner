# Family Planner — Plan & Roadmap

This document tracks the build plan for the Family Planner app (Next.js + Prisma + Postgres/Supabase).
It’s organized by phases so we can ship in small, testable increments.

---

## Current State Summary (as of now)

### ✅ Completed
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

### 🔄 In Progress / Recently Changed
- Prisma schema cleanup and consistency checks
- Event category enum + event time fields alignment between:
  - Prisma schema
  - API route
  - UI forms (Schedule + Quick Add)

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

## Phase 1.5 — Stabilization / Consistency (NEXT 🔄)
**Lock the schema + routes + UI into a consistent model**

### Prisma
- [ ] Ensure `schema.prisma` contains ONLY Prisma schema (no JS/CSS fragments)
- [ ] Confirm `Event` fields are correct: `startsAt`, `endsAt`, optional metadata fields
- [ ] Confirm enums align with UI and route:
  - `EventType`
  - `EventCategory` (if used)
- [ ] Remove / reconcile any partial migration folders (e.g. blank timestamp folders)

### API
- [ ] Confirm `/api/schedule` supports:
  - GET (optionally by date range)
  - POST (title + startsAt required, endsAt optional, validate endsAt > startsAt)
  - PATCH (partial updates, validate dates)
  - DELETE (by `?id=...`)
- [ ] Confirm `/api/chores` supports expected PATCH updates (dueDay, completion)

### UI
- [ ] Remove “Work hours” from Schedule page (work belongs on Member page)
- [ ] Confirm event delete button is visible and consistent everywhere

---

## Phase 2 — Events UX Upgrade (HIGH PRIORITY ⏭)
**Make events feel real (time + type + category presets)**

### Event Form Requirements
- [ ] Event must support:
  - Start date
  - Start time
  - End time (optional but recommended)
- [ ] Add dropdown presets for common event types:
  - Doctor Appointment
  - Dentist Appointment
  - School Event
  - Practice
  - Game
  - Church
  - Family Event
  - Other (custom)
- [ ] Allow “Custom name” to override preset (or add details)
- [ ] Optional fields:
  - Location
  - Notes/description

### Display Requirements (Week Board)
- [ ] Event card shows:
  - Time range (e.g. `4:30 PM–6:00 PM`)
  - Title
  - Category badge
  - Location (optional)
- [ ] Clicking an event opens edit modal
- [ ] Delete icon/button visible on each event entry

---

## Phase 3 — Performance & Data Scoping (IMPORTANT 🚀)
**Stop fetching entire history; fetch only what we need**

### API improvements
- [ ] Update schedule GET to accept:
  - `?start=YYYY-MM-DD&end=YYYY-MM-DD`
- [ ] Update Prisma query to filter by `startsAt` range
- [ ] Mirror same behavior for chores if needed (optional)

### UI improvements
- [ ] Week navigation triggers range fetch
- [ ] Reduce client-side filtering

---

## Phase 4 — Work Hours on Member Page (FEATURE ⏭)
**Move “Work Hours” into Family Members, not Schedule**

### Data model
- [ ] Add `workingHours` (string or structured) to `FamilyMember` (already exists in schema)
- [ ] Create UI on member edit modal:
  - Example: `Mon 9-5, Tue 9-5 ...` (phase 1)
  - Future: structured per-day (phase 2)

### Week board
- [ ] Show work blocks derived from member working hours (optional)
- [ ] Work display should be non-event “background” or separate “Work” block

---

## Phase 5 — Dashboard & Quality of Life (NICE TO HAVE ✅)
- [ ] `/dashboard` summary:
  - Today’s events
  - Today’s chores
  - Overdue chores
  - Weekly completion progress
- [ ] Better empty states and inline help tips
- [ ] Keyboard-friendly controls and accessibility checks

---

## Phase 6 — Recurrence System (ADVANCED)
Choose one approach:

### Option A (Simple)
Store recurring as duplicated instances (limited range)
- Pros: simple
- Cons: can bloat DB

### Option B (Best Practice)
Store recurrence rule, generate instances virtually per week
- Pros: clean DB
- Cons: more logic

**Decision pending.**

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

