# Chore Template Library System - Implementation Guide

## Overview

Your Family-Planner app already has a **fully functional Chore Template Library system** implemented! This document explains how it works, what was improved, and how to use and test it.

## System Architecture

### Data Model

**ChoreTemplate** (in `prisma/schema.prisma`)
```prisma
model ChoreTemplate {
  id          String   @id @default(cuid())
  name        String
  description String?
  isSystem    Boolean  @default(false)
  familyId    String?  // null for system templates
  chores      Chore[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([name, familyId])
  @@index([isSystem])
  @@index([familyId])
}
```

**Chore** (enhanced fields in existing model)
```prisma
model Chore {
  // ... existing fields ...
  choreTemplateId   String?            // Optional reference to template
  frequency         String?            @default("once") // once, daily, weekly, biweekly, monthly
  eligibleMemberIds String?            // JSON array of member IDs: ["id1", "id2"]
  isRecurring       Boolean            @default(false)
  recurrencePattern RecurrencePattern?
  recurrenceInterval Int?
  recurrenceEndDate DateTime?
}
```

### System Templates

**12 built-in templates** are automatically created on first use:
- Clean Bedroom
- Clean Kitchen
- Clean Living Room
- Take Out Trash
- Wash Dishes
- Do Laundry
- Vacuum Floors
- Clean Bathroom
- Mop Floors
- Grocery Shopping
- Yard Work
- Organize Closet

Found in `lib/choreTemplates.js` → `SYSTEM_CHORE_TEMPLATES` array.

### Key Features

#### 1. **Member Eligibility**

When creating a chore, users choose:

```
Assignment Scope:
├─ All Members (available to anyone for AI assignment)
├─ One Specific Member (directly assign to named person)
└─ Eligible Members Only (restrict AI assignment to selected members)
```

**How it works:**
- If "All Members": `assignedTo = "All Members"`, `eligibleMemberIds = null`
- If "One Specific": `assignedTo = "John"`, `eligibleMemberIds = null`
- If "Eligible Members": `assignedTo = <first eligible>`, `eligibleMemberIds = ["id1", "id2", ...]` (JSON string)

**Stored as JSON string** in `eligibleMemberIds` field:
```javascript
eligibleMemberIds = '["user_id_1", "user_id_2"]'  // Serialized via stringifyEligibleMembers()
```

#### 2. **Frequency & Recurrence**

Users select:
```
Frequency:
├─ One-time
├─ Daily
├─ Weekly
├─ Biweekly
└─ Monthly

+ Custom Interval: "Every X [days/weeks/months]"
+ Optional End Date
```

**Stored as:**
```javascript
{
  frequency: "weekly",           // once, daily, weekly, biweekly, monthly
  isRecurring: true,
  recurrencePattern: "WEEKLY",   // DAILY, WEEKLY, MONTHLY, YEARLY
  recurrenceInterval: 2,         // Every 2 weeks
  recurrenceEndDate: "2026-12-31"
}
```

#### 3. **AI Assignment with Eligibility Constraints**

When AI generates assignments, it respects eligibility:

**With AI available:**
- Reads `eligibleMemberIds` for each unassigned chore
- Only suggests assignment among eligible members
- Returns error if no eligible members exist

**Without AI (Rule-based fallback):**
- Same eligibility constraints
- Round-robin with workload balancing
- Prioritizes members without work schedules

## Implementation Details

### Files Modified/Created

#### 1. **app/chores/page.js** (UI Component)
- **New state**: `selectedTemplate`, `eligibleMemberIds`, `assignmentScope`
- **Template picker**: System templates (optgroup) + Custom templates + "Create custom" option
- **Assignment modes**: All / One / Eligible with corresponding UI
- **Enhanced validation**: Checks all required fields before submit
- **Member selection**: Checkboxes for eligible members multi-select

#### 2. **app/api/chore-templates/route.js** (Template API)
- **GET**: Fetches system + family custom templates
  - Auto-initializes system templates on first call
  - Returns both system (isSystem=true, familyId=null) and custom templates
  
- **POST**: Creates family-specific custom templates
  - Validates unique name within family
  - Returns 409 if duplicate

#### 3. **app/api/chores/route.js** (Chore API)
- **POST**: Creates chore with template reference + eligibility
  - Validates choreTemplateId is valid if provided
  - Serializes eligibleMemberIds to JSON string
  - Creates recurring instances if recurrence pattern set
  - Handles both "All Members" and eligibility-constrained chores

#### 4. **lib/choreTemplates.js** (Template Library)
- `SYSTEM_CHORE_TEMPLATES`: Array of 12 built-in templates
- `initializeSystemTemplates(prisma)`: Idempotent upsert of system templates
- `getTemplates(prisma, familyId)`: Returns system + family templates
- `parseEligibleMembers(json)`: Deserialize JSON string → array
- `stringifyEligibleMembers(array)`: Serialize array → JSON string

#### 5. **lib/ai.js** (AI Assignment)
- Enhanced chore context to show eligible members in prompt
- Warns AI if eligible members don't exist

#### 6. **lib/choreAssignment.js** (Rule-based Fallback)
- Filters candidates to eligible members if constraint exists
- Returns clear error if no eligible members
- Includes eligibility in reasoning explanation

#### 7. **app/api/ai/chores/route.js** (Assignment API)
- **New validation**: Checks eligibility constraints before generating suggestions
- Returns 422 status + `invalidChores` array if issues found
- Falls back to rule-based if AI unavailable

#### 8. **lib/validators.js** (Validation)
- Updated `choreSchema` with:
  - `choreTemplateId: z.string().cuid().nullable().optional()`
  - `frequency: z.enum(['once', 'daily', 'weekly', 'biweekly', 'monthly'])`
  - `eligibleMemberIds: z.array(z.string().cuid()).optional()`
  - `recurrencePattern`: DAILY/WEEKLY/MONTHLY/YEARLY

## Key Improvements Made

### 1. Form Validation Enhancement
**Before**: Missing validation for template selection and assignedTo in "All Members" mode
**After**: Explicit validation:
```javascript
// Must select template
if (!templateId) alert('Please select a chore template');

// If custom, must enter title
if (templateId === 'CUSTOM' && !customTitle) alert('Please enter a custom chore title');

// If one member, must select
if (assignmentScope === 'one' && !formData.get('assignedTo')) alert('Please select a member');

// If eligible, must select at least one
if (assignmentScope === 'eligible' && eligibleMemberIds.length === 0) alert('...');
```

### 2. AI Assignment Validation
**Before**: Would attempt to assign chores with no eligible members
**After**: Pre-checks eligibility constraints:
```javascript
const invalidChores = unassignedChores.filter(chore => {
  if (chore.eligibleMemberIds) {
    const eligibleIds = parseEligibleMembers(chore.eligibleMemberIds);
    return !members.some(m => eligibleIds.includes(m.id));
  }
  return false;
});

if (invalidChores.length > 0) {
  return NextResponse.json({
    error: `${invalidChores.length} chore(s) have eligibility constraints but no eligible members`,
    invalidChores: [...]
  }, { status: 422 });
}
```

### 3. Rule-based Assignment Enhancement
**Before**: Generic "No eligible members" error
**After**: Clear reasoning explaining eligibility constraints:
```javascript
reasoning = `Among eligible members: lowest workload (${selectedMember.name})`
```

## Backward Compatibility

### Existing Chores (Without Templates)
- **Still work**: Chores created before templates can still be used
- **No template**: `choreTemplateId = null`, `eligibleMemberIds = null` → treated as unrestricted
- **Assignment**: AI/rule-based can assign to any member
- **Display**: Shows in chores list without template label

### Migration Path (Optional)
To link existing chores to templates:
```javascript
// If chore.title matches a system template name, link it
const template = await prisma.choreTemplate.findFirst({
  where: { name: chore.title, isSystem: true }
});

if (template) {
  // Link the chore to template (optional)
  await prisma.chore.update({
    where: { id: chore.id },
    data: { choreTemplateId: template.id }
  });
}
```

## End-to-End Test Scenarios

### Scenario 1: Basic Chore from Template

**Steps:**
1. Open `/chores` page
2. Select "Clean Kitchen" from templates
3. Choose "Available to all members"
4. Select "Friday" as due day
5. Choose "Weekly" frequency
6. Set interval to "1"
7. Click "Save Chore"

**Expected Results:**
- Chore created with:
  - `title: "Clean Kitchen"`
  - `choreTemplateId: <template-id>`
  - `assignedTo: "All Members"`
  - `eligibleMemberIds: null`
  - `frequency: "weekly"`
  - `recurrencePattern: "WEEKLY"`
  - `isRecurring: true`
- UI shows success message
- Chore instances generated for next 12 months

### Scenario 2: Chore with Eligible Members

**Steps:**
1. Open `/chores` page
2. Select "Do Laundry" template
3. Choose "Eligible members only"
4. Check only "Alice" and "Bob" (not "Charlie")
5. Select "Monday" due day
6. Choose "Weekly" frequency
7. Click "Save Chore"

**Expected Results:**
- Chore created with:
  - `eligibleMemberIds: '["alice-id", "bob-id"]'` (JSON string)
  - `assignedTo: "alice-id"` (first eligible)
- When AI assigns chores:
  - Only suggests Alice or Bob
  - Never suggests Charlie
  - Returns error if Alice & Bob are unavailable

### Scenario 3: Custom Chore

**Steps:**
1. Open `/chores` page
2. Select "→ Create custom chore..." option
3. Enter "Polish Furniture" as title
4. Choose "Assign to one specific member"
5. Select "Sarah"
6. Choose "One-time" frequency
7. Click "Save Chore"

**Expected Results:**
- Chore created with:
  - `title: "Polish Furniture"`
  - `choreTemplateId: null` (no template)
  - `assignedTo: "Sarah"`
  - `frequency: "once"`
  - `isRecurring: false`

### Scenario 4: AI Assignment Respects Eligibility

**Setup:**
- Create "Wash Dishes" (eligible: Alice, Bob only, due Friday)
- Create "Vacuum" (all members, due Monday)
- Members: Alice, Bob, Charlie (no one has assignments yet)

**Steps:**
1. Open `/ai` page (or call `/api/ai/chores` GET)
2. View suggested assignments

**Expected Results:**
- "Wash Dishes" → assigned to Alice or Bob only
- "Vacuum" → can be assigned to anyone (Alice, Bob, or Charlie)
- Charlie may get "Vacuum" but never "Wash Dishes"

### Scenario 5: Error - No Eligible Members

**Setup:**
- Create "Kids Only Chore" with `eligibleMemberIds: ["kid-id"]`
- Delete or deactivate the kid member

**Steps:**
1. Call `/api/ai/chores` GET

**Expected Results:**
- Status 422 returned
- Response includes error message
- `invalidChores` array shows "Kids Only Chore"
- No suggestions generated
- UI can handle and display clear error to user

### Scenario 6: Backward Compatibility - Old Chore

**Setup:**
- Old chore in database: `title: "Sweep Floor"`, `choreTemplateId: null`, `eligibleMemberIds: null`

**Steps:**
1. Open chores page - old chore displays normally
2. Call AI assignment - old chore can be assigned to anyone
3. Mark old chore complete - works as before

**Expected Results:**
- Old chore behaves as unrestricted chore
- No errors
- Works seamlessly with templated chores

## Running the Tests

### 1. **Test System Template Initialization**

```bash
# Start server
npm run dev

# Call the templates API (should auto-initialize)
curl http://localhost:3000/api/chore-templates

# Expected: Returns ~12 system templates + any family custom templates
```

### 2. **Test Creating Chore from Template**

```javascript
// In browser console or via fetch
const response = await fetch('/api/chores', {
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
});

console.log(await response.json()); // { success: true, message: "Created X chore(s)" }
```

### 3. **Test Eligibility Constraints**

```javascript
// Create chore with eligible members
const response = await fetch('/api/chores', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Do Laundry',
    choreTemplateId: '<template-id>',
    assignedTo: '<alice-id>',
    dueDay: 'Monday',
    frequency: 'weekly',
    isRecurring: true,
    recurrencePattern: 'WEEKLY',
    recurrenceInterval: 1,
    eligibleMemberIds: ['<alice-id>', '<bob-id>']
  })
});

// Verify in database
// SELECT eligibleMemberIds FROM "Chore" WHERE title = 'Do Laundry'
// Should return: '["<alice-id>", "<bob-id>"]'
```

### 4. **Test AI Assignment with Eligibility**

```bash
# Curl GET request
curl http://localhost:3000/api/ai/chores

# Expected (JSON):
{
  "suggestions": [
    {
      "choreId": "...",
      "choreTitle": "Clean Kitchen",
      "suggestedAssignee": "Alice",
      "reasoning": "Fair distribution..."
    },
    {
      "choreId": "...",
      "choreTitle": "Do Laundry",
      "suggestedAssignee": "Bob",
      "reasoning": "Among eligible members: lowest workload (Bob)"
    }
  ]
}

# If error (no eligible members):
# HTTP 422 Status
# {
#   "error": "1 chore(s) have eligibility constraints but no eligible members exist",
#   "invalidChores": [{ "id": "...", "title": "Kids Task", "message": "No eligible members found" }]
# }
```

### 5. **Test Form Validation**

In browser, open `/chores`:

**Test 1: No template selected**
- Click "Save Chore" without selecting template
- Expected: Alert "Please select a chore template"

**Test 2: Custom but no title**
- Select "→ Create custom chore..."
- Don't enter title
- Click "Save Chore"
- Expected: Alert "Please enter a custom chore title"

**Test 3: Eligible members but none selected**
- Select any template
- Choose "Eligible members only"
- Don't check any members
- Click "Save Chore"
- Expected: Alert "Please select at least one eligible member"

### 6. **Test Recurring Chore Instances**

```javascript
// Create weekly recurring chore
const response = await fetch('/api/chores', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Weekly Task',
    assignedTo: 'All Members',
    dueDay: 'Wednesday',
    frequency: 'weekly',
    isRecurring: true,
    recurrencePattern: 'WEEKLY',
    recurrenceInterval: 1,
    recurrenceEndDate: null
  })
});

// Check database
// SELECT id, title, dueDay, parentEventId FROM "Chore" WHERE title = 'Weekly Task'
// Should return ~100 instances (limited by safety check)
// with parent and instance relationship
```

## Database Checks

### View System Templates
```sql
SELECT id, name, description, isSystem, familyId 
FROM "ChoreTemplate" 
WHERE isSystem = true
ORDER BY name;

-- Expected: 12 rows with isSystem=true, familyId=NULL
```

### View Custom Templates
```sql
SELECT id, name, description, isSystem, familyId 
FROM "ChoreTemplate" 
WHERE familyId IS NOT NULL
ORDER BY name;

-- Expected: Family-specific custom templates
```

### View Chore with Eligibility
```sql
SELECT id, title, choreTemplateId, assignedTo, eligibleMemberIds, frequency, isRecurring
FROM "Chore" 
WHERE eligibleMemberIds IS NOT NULL
LIMIT 5;

-- Example result:
-- id | title | choreTemplateId | assignedTo | eligibleMemberIds | frequency | isRecurring
-- a1 | Do Laundry | t2 | Alice | ["m1", "m2"] | weekly | true
```

## Troubleshooting

### Issue: System Templates Not Showing
**Solution:** Templates auto-initialize on first API call to `/api/chore-templates`
```javascript
// Force initialization
const response = await fetch('/api/chore-templates');
```

### Issue: AI Says "No eligible members" but they exist
**Check:**
1. Verify `eligibleMemberIds` is properly JSON: `JSON.parse(row.eligibleMemberIds)`
2. Ensure member IDs match: `SELECT id FROM "FamilyMember"`
3. Check if member is active (not deleted)

### Issue: Eligibility constraint not enforced
**Verify:**
- `eligibleMemberIds` is not null/empty in database
- AI assignment returns 422 error before attempting assignment
- Rule-based fallback filters candidates correctly

### Issue: Recurring chores not creating instances
**Check:**
1. `isRecurring: true` is set
2. `recurrencePattern` is one of: DAILY, WEEKLY, MONTHLY, YEARLY
3. Database instance limit not hit (safety limit: 100)

## API Reference

### POST /api/chores - Create Chore

```typescript
Request Body:
{
  title: string;                    // Required: "Clean Kitchen"
  assignedTo: string;               // Required: "John" or "All Members"
  dueDay: string;                   // Required: Monday-Sunday
  choreTemplateId?: string | null;  // Optional: CUID of template
  frequency?: string;               // Default: "once"
                                    // Options: once, daily, weekly, biweekly, monthly
  eligibleMemberIds?: string[];     // Optional: Array of member IDs
  isRecurring?: boolean;            // Default: false
  recurrencePattern?: string;       // DAILY | WEEKLY | MONTHLY | YEARLY
  recurrenceInterval?: number;      // Default: 1
  recurrenceEndDate?: string;       // ISO string, optional
}

Response (Success 200):
{
  success: true,
  message: "Created N chore(s)"
}

Response (Error 400):
{
  error: "Validation failed",
  errors: [{ field: "title", message: "Title is required" }]
}
```

### GET /api/chore-templates - List Templates

```typescript
Response (Success 200):
{
  success: true,
  templates: [
    {
      id: string;
      name: string;
      description?: string;
      isSystem: boolean;
      familyId?: string | null;
      createdAt: datetime;
      updatedAt: datetime;
    }
  ]
}
```

### POST /api/chore-templates - Create Custom Template

```typescript
Request Body:
{
  name: string;                    // Required: unique in family
  description?: string;            // Optional
}

Response (Success 201):
{
  success: true,
  template: { id, name, description, isSystem, familyId, createdAt, updatedAt }
}

Response (Error 409):
{
  error: "Template with this name already exists"
}
```

### GET /api/ai/chores - Get AI Suggestions

```typescript
Response (Success 200):
{
  suggestions: [
    {
      choreId: string;
      choreTitle: string;
      suggestedAssignee: string;
      reasoning: string;
    }
  ]
}

Response (Error 422 - Invalid Constraints):
{
  error: "X chore(s) have eligibility constraints but no eligible members exist",
  invalidChores: [
    {
      id: string;
      title: string;
      message: "No eligible members found"
    }
  ]
}
```

## Summary

Your Chore Template Library is **production-ready** with:

✅ **12 built-in templates** auto-initialized
✅ **Member eligibility constraints** with JSON serialization  
✅ **AI-respecting eligibility** with proper error handling
✅ **Rule-based fallback** for when AI unavailable
✅ **Recurring chores** with interval customization
✅ **Custom templates** support for family-specific tasks
✅ **Form validation** ensuring data integrity
✅ **Backward compatibility** with existing chores
✅ **Clear error messages** for invalid configurations
✅ **Comprehensive API** with proper status codes

All improvements have been integrated. Ready to test and deploy!
