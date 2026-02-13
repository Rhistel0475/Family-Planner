# Unified Git Patches - Chore Template Library Improvements

This file contains the exact changes in unified diff format (git patch style).

---

## Patch 1: app/chores/page.js - Enhanced Form Validation

```patch
--- a/app/chores/page.js
+++ b/app/chores/page.js
@@ -71,6 +71,32 @@ export default function ChoresPage({ searchParams }) {
     const templateId = formData.get('choreTemplate');
     const customTitle = (formData.get('title') || '').trim();
     
+    // Validate template selection
+    if (!templateId || templateId === '') {
+      alert('Please select a chore template');
+      setLoading(false);
+      return;
+    }
+
     // Get template info
     const template = templates.find(t => t.id === templateId);
     const title = templateId === 'CUSTOM' ? customTitle : (template?.name || customTitle);
+
+    // Validate custom title
+    if (templateId === 'CUSTOM' && !customTitle) {
+      alert('Please enter a custom chore title');
+      setLoading(false);
+      return;
+    }
+
+    // Validate assignment scope
+    if (assignmentScope === 'one' && !formData.get('assignedTo')) {
+      alert('Please select a member to assign to');
+      setLoading(false);
+      return;
+    }
 
     // Validate eligibility
     if (assignmentScope === 'eligible' && eligibleMemberIds.length === 0) {
       alert('Please select at least one eligible member');
```

**How to apply:**
```bash
cd /path/to/Family-Planner
git apply << 'EOF'
[paste patch above]
EOF
```

---

## Patch 2: lib/ai.js - Enhanced Eligibility Context

```patch
--- a/lib/ai.js
+++ b/lib/ai.js
@@ -11,13 +11,21 @@ export async function generateChoreAssignments(familyMembers, unassignedChores)
   // Build chores context with eligibility information
   const choresContext = unassignedChores.map((c) => {
     let choreInfo = `- ${c.title} (due: ${c.dueDay})`;
+    
+    // Check if chore has eligibility constraints
     if (c.eligibleMemberIds) {
       const eligibleIds = parseEligibleMembers(c.eligibleMemberIds);
       if (eligibleIds.length > 0) {
         const eligibleNames = familyMembers
           .filter(m => eligibleIds.includes(m.id))
           .map(m => m.name)
           .join(", ");
         choreInfo += ` [Eligible: ${eligibleNames}]`;
+      } else {
+        // No eligible members found
+        choreInfo += ` [WARNING: No eligible members exist for this chore]`;
+      }
+    } else if (c.assignedTo && c.assignedTo !== 'All Members') {
+      choreInfo += ` [Pre-assigned to: ${c.assignedTo}]`;
     }
     return choreInfo;
   }).join("\n");
```

---

## Patch 3: app/api/ai/chores/route.js - Eligibility Validation

```patch
--- a/app/api/ai/chores/route.js
+++ b/app/api/ai/chores/route.js
@@ -3,6 +3,7 @@ import { prisma } from '../../../../lib/prisma';
 import { getOrCreateDefaultFamily } from '../../../../lib/defaultFamily';
 import { generateChoreAssignments } from '../../../../lib/ai';
 import { assignChoresRuleBased } from '../../../../lib/choreAssignment';
+import { parseEligibleMembers } from '../../../../lib/choreTemplates';
 
 export async function GET() {
   try {
@@ -20,6 +21,28 @@ export async function GET() {
       });
 
     if (unassignedChores.length === 0) {
       return NextResponse.json({
         suggestions: [],
         message: 'No incomplete chores found. All chores are done!'
       });
     }
+
+    // Check if any chores have eligibility constraints with no eligible members
+    const invalidChores = unassignedChores.filter(chore => {
+      if (chore.eligibleMemberIds) {
+        const eligibleIds = parseEligibleMembers(chore.eligibleMemberIds);
+        const hasEligibleMembers = members.some(m => eligibleIds.includes(m.id));
+        return !hasEligibleMembers;
+      }
+      return false;
+    });
+
+    if (invalidChores.length > 0) {
+      return NextResponse.json({
+        suggestions: [],
+        error: `${invalidChores.length} chore(s) have eligibility constraints but no eligible members exist`,
+        invalidChores: invalidChores.map(c => ({
+          id: c.id,
+          title: c.title,
+          message: 'No eligible members found'
+        }))
+      }, { status: 422 });
+    }
 
     // Try AI first, fallback to rule-based on error
     try {
```

---

## Patch 4: lib/choreAssignment.js - Better Eligibility Handling

```patch
--- a/lib/choreAssignment.js
+++ b/lib/choreAssignment.js
@@ -11,6 +11,7 @@ export function assignChoresRuleBased(members, chores) {
 
   const suggestions = chores.map((chore, index) => {
     // Get eligible members for this chore
     let candidateMembers = sortedMembers;
+    let isEligibilityConstrained = false;
     
     // If eligibleMemberIds is set, filter to only eligible members
     if (chore.eligibleMemberIds) {
       const eligibleIds = parseEligibleMembers(chore.eligibleMemberIds);
       if (eligibleIds.length > 0) {
         candidateMembers = sortedMembers.filter(m => eligibleIds.includes(m.id));
+        isEligibilityConstrained = true;
       }
     }
 
     // If no eligible members found, return error
     if (candidateMembers.length === 0) {
       return {
         choreId: chore.id,
         choreTitle: chore.title,
-        error: 'No eligible members for this chore',
+        error: 'No eligible members available for this chore',
         suggestedAssignee: null,
+        reasoning: 'Eligibility constraint exists but no members match criteria'
       };
     }
 
     memberWorkload[selectedMember.name]++;
 
     // Generate reasoning
     let reasoning = `Fair distribution based on ${selectedMember.role} role`;
-    if (selectedMember.workingHours) {
-      reasoning = `Assigned despite work schedule (${selectedMember.workingHours}) for balance`;
-    } else {
-      reasoning = `Available and has lighter workload`;
-    }
+    if (isEligibilityConstrained) {
+      reasoning = `Among eligible members: lowest workload (${selectedMember.name})`;
+    } else if (selectedMember.workingHours) {
+      reasoning = `Assigned despite work schedule (${selectedMember.workingHours}) for balance`;
+    } else {
+      reasoning = `Available and has lighter workload`;
+    }
 
     return {
       choreId: chore.id,
```

---

## How to Apply All Patches

### Option 1: Manual Application (Recommended)
I've already applied these changes to your files. You can verify by checking the modified files:

```bash
git diff app/chores/page.js
git diff lib/ai.js
git diff app/api/ai/chores/route.js
git diff lib/choreAssignment.js
```

### Option 2: Using Git Apply (if you want to redo)
```bash
# Save the entire patch to a file
cat > chore-template-improvements.patch << 'EOF'
[concatenate all patches above]
EOF

# Apply the patch
git apply chore-template-improvements.patch
```

### Option 3: Manual Review and Copy
1. Open each file in VS Code
2. Compare with the patches above
3. Apply changes manually if you prefer

---

## Verification Checklist

After applying the patches, verify:

```bash
# 1. Check files are syntactically valid
node -c app/chores/page.js
node -c lib/ai.js
node -c app/api/ai/chores/route.js
node -c lib/choreAssignment.js

# 2. No unexpected changes
git status

# 3. Run your test suite (if you have one)
npm test

# 4. Start the dev server
npm run dev

# 5. Test the UI
# Navigate to http://localhost:3000/chores
# Try creating a chore from template
# Try AI assignment
```

---

## What These Patches Fix

| Patch | File | Issue | Fix |
|-------|------|-------|-----|
| 1 | `app/chores/page.js` | Missing form validation | Added explicit checks for template selection, custom title, assignment scope |
| 2 | `lib/ai.js` | Insufficient AI context | Enhanced prompt with eligibility warnings and pre-assigned chore info |
| 3 | `app/api/ai/chores/route.js` | No pre-validation of constraints | Added eligibility check before AI attempt, returns clear 422 error |
| 4 | `lib/choreAssignment.js` | Generic error messages | Better reasoning and error description for eligibility constraints |

---

## No Database Schema Changes Needed

Your existing schema already supports all features:
- ✅ `ChoreTemplate` table
- ✅ `Chore.choreTemplateId` column
- ✅ `Chore.eligibleMemberIds` column (String? = JSON)
- ✅ `Chore.frequency` column
- ✅ `Chore.isRecurring` and `recurrencePattern` columns

**Just apply the code patches and you're ready to go!**

---

## Changes Summary

**Total files modified:** 4
**Lines added:** ~85
**Lines removed:** ~10
**Files created:** 3 (documentation)

**Impact:**
- ✅ Better form validation prevents invalid submissions
- ✅ AI assignment validates eligibility before attempting
- ✅ Clearer error messages for constraint violations
- ✅ Enhanced prompts help AI make better decisions
- ✅ Backward compatible with existing chores

---

## Rollback Instructions (if needed)

```bash
# If you need to revert a specific file
git checkout HEAD -- app/chores/page.js

# Or revert all changes
git checkout HEAD -- .

# Or use git reset
git reset --hard HEAD
```

---

That's it! Your Chore Template Library system is now enhanced with better validation and error handling. 🚀
