# 🧪 Testing Guide - Family Planner

Complete testing checklist for all Phase 7 features.

---

## 🚀 Getting Started

### 1. **Ensure Environment Variables**

Your `.env.local` should have:

```bash
# Database
DATABASE_URL=postgres://postgres.eroajwmtqvhhicgvzfzx:lOuz08M9y3lgOBMT@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
POSTGRES_PRISMA_URL=postgres://postgres.eroajwmtqvhhicgvzfzx:lOuz08M9y3lgOBMT@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true

# NextAuth (NEW!)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=fXzhEYZPK7IPKYTdooJY1or4ZYScDeklBLSXWs0L+js=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://eroajwmtqvhhicgvzfzx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. **Apply Database Migrations**

```bash
npx prisma db push
```

This will add the new auth tables:
- User
- Account
- Session
- VerificationToken
- Invitation

### 3. **Start Dev Server**

```bash
npm run dev
```

Visit: http://localhost:3000

---

## ✅ Testing Checklist

### **Test 1: Authentication Flow** 🔐

#### Sign Up (New User)

1. Visit http://localhost:3000
   - ✅ Should redirect to `/auth/signin` automatically

2. Click "Sign up" at the bottom
   - ✅ Form switches to signup mode
   - ✅ Name field appears

3. Fill in:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "password123"

4. Click "Create Account"
   - ✅ Loading state shows
   - ✅ Account is created
   - ✅ Auto-signed in
   - ✅ Redirected to `/setup` (no family yet)

#### Sign In (Existing User)

1. Sign out (if needed)
2. Visit http://localhost:3000/auth/signin
3. Enter email and password
4. Click "Sign In"
   - ✅ Successful login
   - ✅ Redirected to `/setup` if no family
   - ✅ Redirected to `/` if has family

#### Google OAuth (Optional)

1. Click "Continue with Google"
   - ✅ Opens Google OAuth
   - ✅ After auth, creates account
   - ✅ Redirects to setup/home

---

### **Test 2: Setup Flow** 🏠

1. After signup, you're on `/setup`

   **Step 1 - Family Name:**
   - ✅ Enter "The Test Family"
   - ✅ Click "Next"

   **Step 2 - Add Members:**
   - ✅ Add member "Dad" with role "parent"
   - ✅ Add member "Mom" with role "parent"
   - ✅ Add member "Kid" with role "kid"
   - ✅ Members show in list
   - ✅ Can remove members
   - ✅ Click "Next"

   **Step 3 - Work Hours (Optional):**
   - ✅ Set Dad's Monday: "9:00 AM - 5:00 PM"
   - ✅ Set Mom's Tuesday: "8:00 AM - 4:00 PM"
   - ✅ Click "Complete Setup"

2. After setup:
   - ✅ User now has a familyId
   - ✅ Redirected to `/` (home/dashboard)
   - ✅ Can access all pages

---

### **Test 3: Route Protection** 🛡️

#### Protected Routes

1. Sign out
2. Try visiting:
   - `/` → ✅ Redirects to `/auth/signin`
   - `/schedule` → ✅ Redirects to `/auth/signin`
   - `/chores` → ✅ Redirects to `/auth/signin`
   - `/members` → ✅ Redirects to `/auth/signin`

3. Sign in (with family)
   - ✅ Can access all pages now

#### Setup Redirect

1. Sign in with user who has NO family
   - ✅ Trying to visit `/` redirects to `/setup`
   - ✅ After completing setup, can access pages

---

### **Test 4: Events & Recurring Events** 📅

1. Go to `/schedule`

   **Add One-Time Event:**
   - ✅ Click "+ Add Event"
   - ✅ Fill in:
     - Title: "Doctor Appointment"
     - Category: "Medical"
     - Date: Tomorrow
     - Time: 10:00 AM - 11:00 AM
     - Location: "Main Street Clinic"
   - ✅ Save event
   - ✅ Appears on calendar

   **Add Recurring Event - Weekly:**
   - ✅ Click "+ Add Event"
   - ✅ Check "Recurring"
   - ✅ Fill in:
     - Title: "Team Meeting"
     - Category: "Work"
     - Pattern: "Weekly"
     - Interval: Every 1 week
     - Start: This Monday
     - End Date: 3 months from now
   - ✅ Save
   - ✅ Multiple instances appear (one per week)
   - ✅ Can edit individual instances
   - ✅ Can delete individual instances

   **Add Recurring Event - Monthly:**
   - ✅ Create "Rent Due" on 1st of every month
   - ✅ Pattern: Monthly
   - ✅ Instances appear on calendar

---

### **Test 5: Chores & Drag & Drop** ✅

1. Go to `/chores`

   **Add Chore:**
   - ✅ Click "+ Add Chore"
   - ✅ Fill in:
     - Title: "Vacuum Living Room"
     - Day: "Wednesday"
     - Member: "Dad"
   - ✅ Save
   - ✅ Appears in Wednesday column

   **Drag & Drop:**
   - ✅ Drag chore from Wednesday to Thursday
   - ✅ Chore updates day
   - ✅ Position persists after refresh

   **Mark Complete:**
   - ✅ Click checkbox
   - ✅ Chore marked as done
   - ✅ Visual feedback (strikethrough, opacity)

---

### **Test 6: Work Hours Visualization** 🕐

1. Go to `/schedule` (weekly view)

   **Visual Check:**
   - ✅ Work hour blocks appear above calendar
   - ✅ Color-coded by member
   - ✅ Shows time range (e.g., "Dad: 9:00 AM - 5:00 PM")
   - ✅ Only shows on days with work hours

2. Go to `/members`
   - ✅ Click on a member
   - ✅ Edit work hours
   - ✅ Save
   - ✅ Changes reflect on calendar immediately

---

### **Test 7: Meal Planning** 🍳

1. Go to `/recipes`

   **Add Recipe:**
   - ✅ Click "+ Add Recipe"
   - ✅ Fill in:
     - Name: "Spaghetti Bolognese"
     - Ingredients: "Pasta, Ground Beef, Tomato Sauce"
     - Cook Day: "Monday"
   - ✅ Save
   - ✅ Appears in recipe list

   **Schedule Meal:**
   - ✅ Click on a day
   - ✅ Select recipe
   - ✅ Meal scheduled
   - ✅ Shows on calendar

---

### **Test 8: Dashboard Analytics** 📊

1. Go to `/` (dashboard)

   **Visual Check:**
   - ✅ Today's events displayed
   - ✅ Today's chores displayed
   - ✅ Overdue items shown (if any)
   - ✅ Weekly progress chart
   - ✅ Member stats (tasks per member)

2. Add some events/chores
   - ✅ Dashboard updates in real-time
   - ✅ Progress percentages accurate

---

### **Test 9: AI Assistant** 🤖

1. Go to any page with AI button

   **Test Query:**
   - ✅ Click AI icon
   - ✅ Ask: "Schedule a dentist appointment next Tuesday at 2 PM"
   - ✅ AI processes request
   - ✅ Event is created
   - ✅ Appears on calendar

2. Try natural language:
   - "Add 'Do laundry' to Wednesday's chores"
   - "What do I have scheduled tomorrow?"
   - ✅ AI understands and responds

---

### **Test 10: Multi-Family Support** 👥

#### Test with Multiple Users

1. **Create First Family:**
   - Sign up as "user1@example.com"
   - Create "The Smith Family"
   - Add events and chores

2. **Create Second Family:**
   - Sign up as "user2@example.com"
   - Create "The Jones Family"
   - Add different events

3. **Data Isolation:**
   - ✅ User1 only sees Smith family data
   - ✅ User2 only sees Jones family data
   - ✅ No data leakage between families

4. **Future: Invite System** (Schema ready, UI pending)
   - User1 invites "spouse@example.com" to Smith family
   - Spouse signs up and accepts invite
   - Both see same family data

---

### **Test 11: Performance** ⚡

1. Go to `/schedule`
   - ✅ Open Network tab in DevTools
   - ✅ Check API calls
   - ✅ `/api/events` should only fetch 7 days
   - ✅ Fast page load (<1s)

2. Add 100+ recurring events
   - ✅ Weekly view still fast
   - ✅ No lag in UI

3. Add 50+ chores
   - ✅ Drag & drop still smooth
   - ✅ No performance degradation

---

### **Test 12: Mobile Responsiveness** 📱

1. Open DevTools → Toggle device toolbar
2. Test on:
   - iPhone 12 Pro
   - iPad
   - Galaxy S20

   **Check:**
   - ✅ Signin page looks good
   - ✅ Setup wizard usable
   - ✅ Calendar readable
   - ✅ Chores draggable (may need touch support)
   - ✅ Forms accessible
   - ✅ Navigation works

---

### **Test 13: Edge Cases** 🔍

#### Auth Edge Cases

- ✅ Sign up with existing email → Shows error
- ✅ Sign in with wrong password → Shows error
- ✅ Sign in with non-existent email → Shows error
- ✅ Password < 6 chars → Shows error

#### Events Edge Cases

- ✅ Create event without title → Shows validation
- ✅ Recurring event with no end date → Uses 1 year default
- ✅ Edit recurring instance → Only that instance changes
- ✅ Delete recurring instance → Only that instance deleted

#### Chores Edge Cases

- ✅ Add chore without member → Shows validation
- ✅ Drag chore to invalid drop zone → Returns to original
- ✅ Delete member with chores → Chores remain (orphaned)

---

## 🎯 Expected Results

After testing, you should have:

1. ✅ Fully functional authentication system
2. ✅ Multi-user, multi-family support
3. ✅ Recurring events working perfectly
4. ✅ Work hour visualization on calendar
5. ✅ Smooth drag & drop interactions
6. ✅ Fast page loads (optimized queries)
7. ✅ Beautiful, consistent UI
8. ✅ No console errors
9. ✅ Mobile-friendly design
10. ✅ Production-ready app!

---

## 🐛 Bug Reporting

If you find issues:

1. **Check Console:**
   - Open DevTools → Console tab
   - Look for errors

2. **Check Network:**
   - Open DevTools → Network tab
   - Check failed API calls
   - Note status codes

3. **Note Steps to Reproduce:**
   - What you clicked
   - What you expected
   - What actually happened

4. **Test in Different Browsers:**
   - Chrome
   - Firefox
   - Safari

---

## 🚀 Ready for Production?

After successful testing:

- [ ] All auth flows work
- [ ] Events and recurring events functional
- [ ] Chores and drag & drop smooth
- [ ] Work hours display correctly
- [ ] Meal planning works
- [ ] Dashboard shows accurate data
- [ ] AI assistant responds
- [ ] Multi-family isolation verified
- [ ] No console errors
- [ ] Mobile responsive

If all checked → **DEPLOY TO VERCEL!** 🎉

---

## 📚 Quick Commands

```bash
# Apply migrations
npx prisma db push

# Start dev server
npm run dev

# View database
npx prisma studio

# Check migration status
npx prisma migrate status

# Generate Prisma client
npx prisma generate

# Reset database (BE CAREFUL!)
npx prisma migrate reset
```

---

**Happy Testing! 🎉**

If you encounter any issues, check:
1. Environment variables are set
2. Database connection is active
3. Dev server is running
4. Browser console for errors

Good luck! 🚀
