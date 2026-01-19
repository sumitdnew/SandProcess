# Verify Your .env File

## Correct Format (Copy this exactly)

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-key-here
```

## What to Check

### ✅ CORRECT Examples:

```env
REACT_APP_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODUyNTYzOSwiZXhwIjoxOTU0MTAxMjM5fQ.abc123def456
```

### ❌ WRONG Examples:

**Has quotes:**
```env
REACT_APP_SUPABASE_URL="https://..."
REACT_APP_SUPABASE_ANON_KEY="eyJhbG..."
```

**Has spaces around =:**
```env
REACT_APP_SUPABASE_URL = https://...
REACT_APP_SUPABASE_ANON_KEY = eyJhbG...
```

**Missing REACT_APP_ prefix:**
```env
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJhbG...
```

**Has extra spaces or blank lines:**
```env
REACT_APP_SUPABASE_URL=https://...

REACT_APP_SUPABASE_ANON_KEY=eyJhbG...
```

## Quick Checklist

- [ ] File is named exactly `.env` (with dot at start)
- [ ] File is in `sand-process-app/` folder (not parent folder)
- [ ] No quotes around values
- [ ] No spaces before or after `=`
- [ ] Variable names start with `REACT_APP_`
- [ ] No blank lines between variables
- [ ] Values are on the same line as the variable name
- [ ] Dev server was restarted after creating/modifying file

## Test in Browser Console

After restarting server, check console for:

```
Supabase Config Check: {
  hasUrl: true,    ← Should be true
  hasKey: true,    ← Should be true
  urlLength: 40,   ← Should be > 0
  keyLength: 200,  ← Should be > 0
  envKeys: ['REACT_APP_SUPABASE_URL', 'REACT_APP_SUPABASE_ANON_KEY']
}
```

If `hasUrl: false` or `hasKey: false`, the env vars aren't loading!


