# Check .env File Configuration

## Common Issues with .env Not Loading

### 1. File Location
The `.env` file MUST be in:
```
sand-process-app/.env
```
NOT in:
- ❌ `C:\Projects\Sand Process\.env` (parent folder)
- ❌ `sand-process-app\src\.env` (src folder)

### 2. File Format
Your `.env` file should look EXACTLY like this (no spaces, no quotes):

```env
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ CORRECT:
```env
REACT_APP_SUPABASE_URL=https://abc123.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYzEyMyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjM4NTI1NjM5LCJleHAiOjE5NTQxMDEyMzl9.abc123
```

❌ WRONG (has quotes):
```env
REACT_APP_SUPABASE_URL="https://abc123.supabase.co"
REACT_APP_SUPABASE_ANON_KEY="eyJhbGci..."
```

❌ WRONG (has spaces):
```env
REACT_APP_SUPABASE_URL = https://abc123.supabase.co
```

❌ WRONG (missing REACT_APP_ prefix):
```env
SUPABASE_URL=https://abc123.supabase.co
```

### 3. File Name
- Must be exactly `.env` (with the dot at the beginning)
- NOT `.env.txt` or `env` or `ENV`

### 4. Server Restart Required
**IMPORTANT**: After creating or modifying `.env`:
1. Stop your dev server (Ctrl+C)
2. Start it again (`npm start` or `START_SERVER.bat`)
3. React only reads `.env` when the server starts

### 5. Verify It's Loading

Check your browser console - you should see debug output like:
```
Supabase Config Check: {
  hasUrl: true,
  hasKey: true,
  urlLength: 40,
  keyLength: 200,
  envKeys: ['REACT_APP_SUPABASE_URL', 'REACT_APP_SUPABASE_ANON_KEY']
}
```

If `hasUrl` or `hasKey` is `false`, the env vars aren't loading.

## Quick Fix Steps

1. **Verify file location:**
   - Open File Explorer
   - Navigate to `C:\Projects\Sand Process\sand-process-app`
   - Look for `.env` file (might be hidden - enable "Show hidden files")

2. **Check file format:**
   - Open `.env` in a text editor (Notepad is fine)
   - Make sure it looks exactly like the CORRECT example above
   - No quotes, no spaces around `=`

3. **Restart dev server:**
   - Stop server (Ctrl+C)
   - Start again: `npm start` or `START_SERVER.bat`

4. **Check console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for "Supabase Config Check" message
   - Check if `hasUrl: true` and `hasKey: true`

## If Still Not Working

1. **Make sure .env is not in .gitignore** (it should be, but check it exists)

2. **Try renaming the file:**
   - Rename `.env` to `.env.backup`
   - Create a new `.env` file
   - Copy your keys again (no quotes, no spaces)

3. **Check for typos:**
   - `REACT_APP_SUPABASE_URL` (not `REACT_APP_SUPABASE_URI`)
   - `REACT_APP_SUPABASE_ANON_KEY` (not `REACT_APP_SUPABASE_KEY`)

4. **Verify keys are valid:**
   - Go to Supabase Dashboard → Settings → API
   - Copy URL and anon key again
   - Make sure they match exactly


