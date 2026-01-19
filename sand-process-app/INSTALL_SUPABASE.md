# Install Supabase Package - Step by Step

## The Problem
Your console shows: `@supabase/supabase-js not installed`

This means the package isn't in your `node_modules` folder yet.

## Solution

### Method 1: Command Prompt (Easiest)

1. **Open Command Prompt** (Win+R, type `cmd`, press Enter)
   - NOT PowerShell - use regular Command Prompt

2. **Navigate to project:**
   ```bash
   cd "C:\Projects\Sand Process\sand-process-app"
   ```

3. **Install package:**
   ```bash
   npm install @supabase/supabase-js
   ```

4. **Wait for it to finish** (you'll see "added X packages")

5. **Restart your dev server:**
   - Stop it (Ctrl+C)
   - Start again: `npm start`

### Method 2: If npm is blocked

1. **Open Command Prompt as Administrator:**
   - Right-click Command Prompt → "Run as administrator"

2. **Run the same commands as Method 1**

### Method 3: Install all packages

If the above doesn't work, install everything:

```bash
cd "C:\Projects\Sand Process\sand-process-app"
npm install
```

This will install all packages including Supabase.

## Verify Installation

After installing, check:

1. **Look for the folder:**
   ```
   sand-process-app/node_modules/@supabase/supabase-js
   ```
   If this folder exists, the package is installed!

2. **Check browser console:**
   - You should see: `✅ Supabase package loaded successfully`
   - You should NOT see: `@supabase/supabase-js not installed`

3. **Check .env file:**
   - Make sure it's in `sand-process-app/.env` (not in parent folder)
   - Format:
     ```
     REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
     REACT_APP_SUPABASE_ANON_KEY=eyJhbGci...
     ```
   - No quotes, no spaces around `=`

## After Installation

1. **Restart dev server** (important!)
2. **Refresh browser**
3. **Check console** - should see success message
4. **Go to Orders page** - your 3 orders should appear!

## Still Not Working?

Check:
- Is `node_modules/@supabase` folder there?
- Did you restart the dev server after installing?
- Is `.env` file in the correct location?
- Are there any errors in the terminal when starting the server?


