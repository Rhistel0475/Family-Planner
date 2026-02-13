# Chore Board Setup - Implementation Guide

## ✅ Completed Implementation

### 1. **Database Schema** (`prisma/schema.prisma`)
Added new models and enums:
- `ChoreBoard` model - Stores configuration for each predefined chore
- `FrequencyType` enum - ONE_TIME, DAILY, WEEKLY, BIWEEKLY, MONTHLY, CUSTOM
- `EligibilityMode` enum - ALL, SELECTED

### 2. **API Endpoint** (`app/api/chore-board/route.js`)
- **GET**: Fetches all board settings with auto-initialization
  - Returns board settings for all 12 predefined chores
  - Auto-creates default settings on first load
  - Enriches data with member labels
  
- **PATCH**: Saves all board settings at once
  - Validates recurring/frequency rules
  - Validates custom frequency >= 1 day
  - Validates eligibility mode requirements
  - Uses upsert for seamless updates

### 3. **Frontend Components**

#### `/app/chores/board/page.js` (Client Component)
- Cork-board styled UI with post-it notes
- Accordion-style expand/collapse for each chore
- Configuration controls:
  - **Recurring toggle** - Enable/disable recurring
  - **Frequency dropdown** - Select frequency (Daily, Weekly, Biweekly, Monthly, Custom)
  - **Custom days input** - When frequency is "Custom"
  - **Default assignee** - Single-select dropdown (optional, AI can override)
  - **Eligibility mode** - Radio buttons (ALL or SELECTED)
  - **Member checkboxes** - When mode is SELECTED
  
- Status line shows: "Recurring: Weekly • Default: Beth • Eligible: All"
- **Save All Settings** button persists changes
- Full validation with user-friendly error messages
- Smooth animations and transitions

#### `/app/chores/board/board.module.css`
- Cork board background (tan/brown gradient)
- Post-it note styling:
  - Subtle shadows
  - Deterministic card rotation (-2° to +2°)
  - Responsive grid (3-4 cols desktop, 2 tablet, 1 mobile)
  - Hover effects with scale and shadow
  
- Accessibility:
  - Keyboard navigation support
  - Focus-visible states
  - Reduced motion support
  - Proper label association

#### Updated `/app/chores/page.js`
- Added "📋 Chore Board Setup" link/button
- New styles for title bar layout
- Users can navigate between Add Chore and Board Setup

### 4. **Utilities** (`lib/boardChores.js`)
- `PREDEFINED_CHORES` - 12 hardcoded indoor chores with stable keys:
  - clean_kitchen, clean_bathroom, clean_bedroom, clean_living_room
  - vacuum, sweep_mop, dishes, laundry, dusting
  - trash (take out), wipe_counters, declutter

- Helper functions:
  - `getStatusString()` - Generates compact status display
  - `getRotationAngle()` - Deterministic rotation per chore

---

## 🚀 Database Migration Steps

### Option A: Using Supabase Console (Recommended for local dev)

1. **Open Supabase Dashboard**
   - Navigate to: https://app.supabase.com
   - Select your project
   - Go to SQL Editor

2. **Create Migration**
   - Click "New Query"
   - Copy the entire contents of `/prisma/migrations/add_chore_board.sql`
   - Click "Run"
   - Verify success (should show: `✓ Success`)

3. **Verify Tables Created**
   - Go to "Table Editor"
   - You should see new `ChoreBoard` table with columns:
     - id, familyId, templateKey, title
     - isRecurring, frequencyType, customEveryDays
     - eligibilityMode, eligibleMemberIds (JSON[]string array)
     - defaultAssigneeMemberId, createdAt, updatedAt

### Option B: Using psql Command (if you have CLI access)

```bash
psql postgresql://[user]:[password]@aws-1-us-east-1.pooler.supabase.com:6543/postgres \
  -f prisma/migrations/add_chore_board.sql
```

### Option C: Manual SQL Execution

Run these commands individually in Supabase SQL editor:

```sql
-- Create enums
CREATE TYPE "FrequencyType" AS ENUM ('ONE_TIME', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM');
CREATE TYPE "EligibilityMode" AS ENUM ('ALL', 'SELECTED');

-- Create ChoreBoard table
CREATE TABLE "ChoreBoard" (
    "id" TEXT PRIMARY KEY DEFAULT '',
    "familyId" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "frequencyType" "FrequencyType" NOT NULL DEFAULT 'ONE_TIME',
    "customEveryDays" INTEGER,
    "eligibilityMode" "EligibilityMode" NOT NULL DEFAULT 'ALL',
    "eligibleMemberIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "defaultAssigneeMemberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    UNIQUE("familyId", "templateKey"),
    FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "ChoreBoard_familyId_idx" ON "ChoreBoard"("familyId");
CREATE INDEX "ChoreBoard_templateKey_idx" ON "ChoreBoard"("templateKey");
```

---

## 🧪 Testing Checklist

### Local Development (before deployment)
- [ ] Navigate to http://localhost:3003/chores/board
- [ ] All 12 chores render as post-it notes
- [ ] Click on a card to expand/collapse (accordion works)
- [ ] Change "Recurring" toggle on/off
  - When OFF: frequency controls should be disabled/grayed
  - When ON: frequency dropdown should enable
- [ ] Change frequency to "Custom"
  - Input field for "Every N days" should appear
  - Try entering 1, 5, 30, 365
  - Validate >= 1 on save
- [ ] Select a default assignee from dropdown
  - Should show member name in status
- [ ] Change eligibility mode to "SELECTED"
  - Member checkboxes should appear
  - Select 2-3 members
  - Status should show "Eligible: 3"
- [ ] Click "Save All Settings"
  - Success message should appear
  - Settings should persist on reload

### Mobile Responsiveness
- [ ] Desktop (1200px+): 3-4 cards per row
- [ ] Tablet (768px-1100px): 2 cards per row
- [ ] Mobile (< 768px): 1 card per row

### Keyboard Navigation
- [ ] Tab through all controls
- [ ] Focus states clearly visible
- [ ] Enter/Space activates buttons and toggles

### Accessibility
- [ ] Screen reader navigates form properly
- [ ] All inputs have associated labels
- [ ] Color contrast sufficient

---

## 📋 Feature Overview

### What Gets Stored?
For each predefined chore, the ChoreBoard stores:

```json
{
  "templateKey": "clean_kitchen",
  "title": "Clean Kitchen",
  "isRecurring": true,
  "frequencyType": "WEEKLY",
  "customEveryDays": null,
  "defaultAssigneeMemberId": "member-id-123",
  "eligibilityMode": "SELECTED",
  "eligibleMemberIds": ["member-123", "member-456"]
}
```

### How It's Used
1. **Chore Board Setup**: Admins configure templates once
2. **Future Chore Creation**: When creating a chore, can reference these templates
3. **AI Assignment**: Can use eligibility constraints for intelligent assignment
4. **Recurring Jobs**: Frequency settings used to auto-generate instances

---

## 🔧 File Structure

```
app/
├── api/
│   └── chore-board/
│       └── route.js          # GET/PATCH ChoreBoard data
├── chores/
│   ├── page.js               # Updated with Board link
│   └── board/
│       ├── page.js           # Main ChoreBoard component
│       └── board.module.css   # Cork-board styling
└── ...

lib/
├── boardChores.js            # Predefined chores + utilities
├── prisma.js
└── ...

prisma/
├── schema.prisma             # Updated with ChoreBoard model
└── migrations/
    └── add_chore_board.sql   # SQL migration

```

---

## 🚀 Next Steps / Future Enhancements

1. **Apply Database Migration**
   - Follow steps above to create ChoreBoard table in Supabase
   - Then app will start persisting settings

2. **Connect to Chore Creation**
   - Update "Add Chore" form to populate from board settings
   - Use default assignee and frequency
   - Apply eligibility constraints

3. **Chore Instance Generation**
   - Create recurring chore instances based on frequency
   - Respect eligibility rules for assignment

4. **AI Integration**
   - Pass board settings to AI prompt
   - Use eligibility constraints for intelligent assignment

5. **Advanced Features**
   - Chore history/statistics
   - Per-member preferences override
   - Seasonal/custom schedules
   - Time-based rotation

---

## 📝 Notes

- **Graceful Degradation**: If ChoreBoard table doesn't exist yet, app still works (settings just won't persist)
- **Family Scoped**: All settings are per-family (familyId)
- **AI Friendly**: Settings include metadata useful for assignment algorithms
- **Extensible**: Easy to add more fields to ChoreBoard model later

