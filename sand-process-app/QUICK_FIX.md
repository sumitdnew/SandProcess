# Quick Fix for Orders Not Showing

## The Problem
Your orders aren't showing because:
1. **Supabase package is not installed** - The app is using a mock that returns empty data
2. **No .env file** - Even if package was installed, no credentials are configured

## Solution

### Step 1: Install Supabase Package

Open **Command Prompt** (not PowerShell) and run:

```bash
cd "C:\Projects\Sand Process\sand-process-app"
npm install @supabase/supabase-js
```

**OR** if npm is blocked, use:

```bash
cd "C:\Projects\Sand Process\sand-process-app"
cmd /c npm install @supabase/supabase-js
```

### Step 2: Create .env File

1. In `sand-process-app` folder, create a file named `.env` (with the dot at the beginning)
2. Add your Supabase credentials:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

**To get your credentials:**
- Go to your Supabase project dashboard
- Click Settings (gear icon) → API
- Copy "Project URL" and "anon public" key

### Step 3: Restart Dev Server

1. Stop your current dev server (Ctrl+C)
2. Start it again: `npm start`

### Step 4: Verify

After restarting:
- The console warnings about Supabase should be gone
- Orders should appear on the Orders page
- You should see your 3 seeded orders

## If Still Not Working

Check the browser console for:
- Any Supabase connection errors
- CORS errors
- Authentication errors

Make sure:
- Your Supabase project is active
- The database tables exist (run schema.sql if needed)
- Row Level Security (RLS) policies allow reading (the schema includes permissive policies)


