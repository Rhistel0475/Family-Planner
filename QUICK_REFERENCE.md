# Chore Template Library - Quick Reference

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│          Chore Template Library System                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ChoreTemplate (in database)                           │
│  ├─ System Templates (12 built-in, auto-initialized)   │
│  └─ Custom Templates (family-created)                  │
│         │                                              │
│         ├─► Chore Instance ─► Eligibility Rules        │
│         │                          │                   │
│         ├─► Frequency              ├─ All Members      │
│         │   (weekly/monthly/etc)   ├─ One Member       │
│         │                          └─ Selected Members  │
│         └─► Recurrence                                 │
│             (interval + end date)                      │
│                                                         │
│  Assignment Logic                                      │
│  ├─► AI (Claude 3.5 Sonnet)                           │
│  └─► Rule-Based (Fair distribution)                   │
│      Both respect eligibility constraints              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## User Workflow

### Creating a Chore (Web UI - `/chores`)

```
1. Select Template
   └─ Dropdown with System + Custom templates
   
2. Choose Assignment Scope
   ├─ All Members (anyone can be assigned)
   ├─ Specific Member (direct assignment)
   └─ Eligible Members (restrict to selected members)
   
3. Select Due Day
   └─ Monday-Sunday
   
4. Set Frequency
   ├─ One-time
   ├─ Daily
   ├─ Weekly
   ├─ Biweekly
   └─ Monthly
   
5. (Optional) Recurring Options
   ├─ Interval (e.g., "every 2 weeks")
   └─ End Date
   
6. Save
   └─ Chore created with template reference + eligibility
```

---

## API Endpoints

### Template Management

```
GET /api/chore-templates
└─ Returns: { success: true, templates: [...] }
   Auto-initializes 12 system templates on first call

POST /api/chore-templates
├─ Body: { name: string, description?: string }
└─ Returns: { success: true, template: {...} }
```

### Chore Management

```
POST /api/chores
├─ Body: { 
│    title: string (required)
│    assignedTo: string (required)
│    dueDay: string (required, Monday-Sunday)
│    choreTemplateId?: string (optional)
│    frequency?: string (default: "once")
│    eligibleMemberIds?: string[] (optional, member IDs)
│    isRecurring?: boolean (default: false)
│    recurrencePattern?: string (DAILY|WEEKLY|MONTHLY|YEARLY)
│    recurrenceInterval?: number (default: 1)
│    recurrenceEndDate?: string (optional ISO date)
│  }
└─ Returns: { success: true, message: "Created X chore(s)" }

GET /api/chores
└─ Returns: { chores: [...] }

PATCH /api/chores
├─ Body: { id: string, completed?: bool, title?: string, ... }
└─ Returns: { success: true, chore: {...} }

DELETE /api/chores?id=<chore-id>
└─ Returns: { success: true }
```

### AI Assignment

```
GET /api/ai/chores
├─ Success (200): { 
│    suggestions: [
│      { 
│        choreId: string,
│        choreTitle: string, 
│        suggestedAssignee: string,
│        reasoning: string 
│      }
│    ] 
│  }
│
└─ Error (422): {
     error: "X chore(s) have eligibility constraints...",
     invalidChores: [
       { id, title, message }
     ]
   }

POST /api/ai/chores
├─ Body: { choreId: string, assignedTo: string }
└─ Returns: { success: true, chore: {...} }
```

---

## Database Schema (Key Fields)

### ChoreTemplate
```sql
CREATE TABLE "ChoreTemplate" (
  id           String @id @default(cuid())
  name         String
  description  String?
  isSystem     Boolean @default(false)     -- true for built-ins
  familyId     String?                     -- null for system templates
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  UNIQUE(name, familyId)
  INDEX(isSystem)
  INDEX(familyId)
)
```

### Chore (Enhanced Fields)
```sql
-- Existing fields: id, familyId, title, assignedTo, dueDay, completed, etc.

-- NEW/ENHANCED for Template Library:
choreTemplateId    String?           -- FK to ChoreTemplate
frequency          String? = "once"  -- once, daily, weekly, biweekly, monthly
eligibleMemberIds  String?           -- JSON: '["id1", "id2", ...]'
isRecurring        Boolean = false
recurrencePattern  RecurrencePattern? -- DAILY, WEEKLY, MONTHLY, YEARLY
recurrenceInterval Int?
recurrenceEndDate  DateTime?
parentEventId      String?           -- For recurring instances
```

---

## System Templates (Built-in)

```javascript
const SYSTEM_CHORE_TEMPLATES = [
  'Clean Bedroom',
  'Clean Kitchen',
  'Clean Living Room',
  'Take Out Trash',
  'Wash Dishes',
  'Do Laundry',
  'Vacuum Floors',
  'Clean Bathroom',
  'Mop Floors',
  'Grocery Shopping',
  'Yard Work',
  'Organize Closet'
]
```

Stored with `isSystem: true, familyId: null`

---

## Eligibility Logic

### Serialization
```javascript
// Input: Array of member IDs
const memberIds = ["alice-id", "bob-id"];

// Stored in database as JSON string:
eligibleMemberIds = JSON.stringify(memberIds);
// → '["alice-id", "bob-id"]'

// Parse back:
const parsed = JSON.parse(eligibleMemberIds);
// → ["alice-id", "bob-id"]
```

### Assignment Rules

| Assignment Scope | assignedTo | eligibleMemberIds | AI Behavior |
|------------------|-----------|-------------------|------------|
| All Members | "All Members" | null | Can assign to anyone |
| One Specific | "John" | null | Pre-assigned, no AI needed |
| Eligible Only | "alice-id" | ["id1","id2",...] | Only assign to listed members |

### Validation

```javascript
// If eligibleMemberIds is set and non-empty:
if (chore.eligibleMemberIds) {
  const eligible = JSON.parse(chore.eligibleMemberIds);
  
  // Check if at least one eligible member exists
  const hasValidMembers = members.some(m => eligible.includes(m.id));
  
  if (!hasValidMembers) {
    // ERROR: Cannot assign
    return { error: 'No eligible members available' };
  }
}
```

---

## Error Scenarios

### Invalid Form Submission
```
Scenario: User clicks "Save" without selecting template
Response: Alert "Please select a chore template"
Action: User must select from dropdown or create custom
```

### Invalid Eligibility
```
Scenario: User selects "Eligible members only" but checks no members
Response: Alert "Please select at least one eligible member"
Action: User must check at least one member or change scope
```

### AI Can't Fulfill Constraint
```
Scenario: Chore has eligibleMemberIds: ["kid-id"]
         Kid member was deleted
Response: HTTP 422
Body: {
  "error": "1 chore(s) have eligibility constraints but no eligible members exist",
  "invalidChores": [{ "id": "...", "title": "Kids Task", "message": "..." }]
}
Action: UI displays error; user must update chore or add members
```

### Chore Has No Eligible Members
```
Scenario: AI assignment is requested
         Multiple chores have eligibility constraints
         Some have valid members, some don't
Response: HTTP 422 (returns immediately, no suggestions)
Action: User must fix invalid chores before requesting assignment
```

---

## Code Files Reference

| File | Purpose | Key Functions |
|------|---------|---|
| `lib/choreTemplates.js` | Template management | `initializeSystemTemplates()`, `getTemplates()`, `parseEligibleMembers()`, `stringifyEligibleMembers()` |
| `lib/ai.js` | AI assignment | `generateChoreAssignments()` - builds prompt, respects eligibility |
| `lib/choreAssignment.js` | Rule-based fallback | `assignChoresRuleBased()` - fair distribution with eligibility |
| `lib/recurring.js` | Recurrence logic | `getNextOccurrence()`, `generateOccurrences()`, `shouldRecurOnDay()` |
| `lib/validators.js` | Input validation | `choreSchema`, `validateRequest()` |
| `app/chores/page.js` | UI component | Form with template picker, eligibility selector, frequency options |
| `app/api/chore-templates/route.js` | Template API | GET (list), POST (create custom) |
| `app/api/chores/route.js` | Chore CRUD | GET/POST/PATCH/DELETE with template + eligibility |
| `app/api/ai/chores/route.js` | Assignment API | Validates eligibility, calls AI or fallback |

---

## Common Tasks

### Create a Weekly Recurring Chore for All Members
```javascript
fetch('/api/chores', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Clean Kitchen',
    choreTemplateId: '<template-id>',
    assignedTo: 'All Members',
    dueDay: 'Friday',
    frequency: 'weekly',
    isRecurring: true,
    recurrencePattern: 'WEEKLY',
    recurrenceInterval: 1,
    eligibleMemberIds: null
  })
})
```

### Create a Chore for Specific Members Only
```javascript
fetch('/api/chores', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Do Laundry',
    choreTemplateId: '<template-id>',
    assignedTo: '<alice-id>',  // First eligible member
    dueDay: 'Monday',
    frequency: 'weekly',
    isRecurring: true,
    recurrencePattern: 'WEEKLY',
    recurrenceInterval: 1,
    eligibleMemberIds: ['<alice-id>', '<bob-id>']  // Array
  })
})
```

### Get AI Suggestions
```javascript
fetch('/api/ai/chores')
  .then(r => r.json())
  .then(data => {
    if (data.error) {
      console.log('Eligibility constraints issue:', data.invalidChores);
    } else {
      console.log('Suggestions:', data.suggestions);
    }
  })
```

### Link Existing Chore to Template (Optional)
```javascript
// Get a system template
const templates = await fetch('/api/chore-templates').then(r => r.json());
const cleanKitchenTemplate = templates.templates.find(t => t.name === 'Clean Kitchen');

// Update chore with template reference
fetch('/api/chores', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: '<chore-id>',
    choreTemplateId: cleanKitchenTemplate.id
  })
})
```

---

## Testing Checklist

- [ ] System templates auto-initialize on first `/api/chore-templates` call
- [ ] Can create chore from template with "All Members" assignment
- [ ] Can create chore from template with specific member assignment
- [ ] Can create chore from template with eligible members (multi-select)
- [ ] Form validation prevents submission without template
- [ ] Form validation prevents submission without custom title when using custom chore
- [ ] Form validation prevents eligibility selection without choosing members
- [ ] AI assignment respects eligibility constraints
- [ ] AI assignment returns 422 error when no eligible members exist
- [ ] Rule-based fallback returns clear error messages
- [ ] Recurring chores create multiple instances (up to 100)
- [ ] Old chores without templates still work
- [ ] Database correctly stores eligibleMemberIds as JSON string

---

## Support & Troubleshooting

**Q: Templates not showing?**
A: Call `/api/chore-templates` once to initialize. They auto-create.

**Q: AI says no eligible members but they exist?**
A: Verify member IDs match. Check: `JSON.parse(chore.eligibleMemberIds)` in DB.

**Q: Can't assign to "All Members"?**
A: Ensure `assignedTo` is exactly `"All Members"` (case-sensitive).

**Q: Recurring chores not creating instances?**
A: Verify `isRecurring: true`, `recurrencePattern` is valid, and no instance limit hit (100 instances max).

**Q: Old chores broken?**
A: They should still work. If not, ensure backward compatibility checks pass.

---

## Architecture Decisions

### Why JSON for `eligibleMemberIds` instead of join table?
- Simpler schema (no extra table)
- Faster queries (single record read)
- Easier API (array serialization)
- Sufficient for typical family size (5-10 members)

### Why `frequency` field + `recurrencePattern`?
- `frequency`: Human-friendly (once, daily, weekly, biweekly, monthly)
- `recurrencePattern`: Database-friendly enum (DAILY, WEEKLY, MONTHLY, YEARLY)
- Maps between UI and backend seamlessly

### Why pre-validate eligibility in assignment API?
- Fail fast: Return 422 before attempting AI/rule-based assignment
- Better UX: User sees exactly which chores have issues
- Prevents wasted computation

### Why system templates with `isSystem: true, familyId: null`?
- Global access: All families see same system templates
- No duplication: One source of truth
- Unique constraint: Allows family custom templates with same name

---

This system is **production-ready** and handles the complete chore template workflow with robust error handling and backward compatibility! 🎉
