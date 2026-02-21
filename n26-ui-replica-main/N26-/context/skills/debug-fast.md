---
name: debug-fast
description: "Use when something is broken and time is critical. Systematic debugging patterns for hackathon pressure: quick diagnosis, common pitfalls, rollback strategies, and 'just make it work' fixes."
---

# Debug Fast — 3AM Hackathon Emergency Fixes

## Rule #1: Don't debug for more than 15 minutes

If you've been stuck for 15 minutes:
1. **Revert** to the last working version (`git stash` or `git checkout .`)
2. **Simplify** — remove the feature that broke things
3. **Mock it** — hardcode the expected output and move on
4. **Ask for help** — another team member, a mentor, or Claude

---

## Quick Diagnosis Flowchart

```
Something is broken →
│
├─ Is there an error message?
│  ├─ YES → Read it. Google the EXACT message. Fix it.
│  └─ NO → Add console.log / print() everywhere. Find where it stops.
│
├─ Did it work before?
│  ├─ YES → What did you change? `git diff` → undo the change
│  └─ NO → It never worked. Start simpler.
│
├─ Is it a frontend or backend issue?
│  ├─ Check browser DevTools Console (F12) → frontend
│  ├─ Check terminal/server logs → backend
│  └─ Check Network tab → API connection issue
│
└─ Is it a data issue?
   ├─ Print the data at every step
   ├─ Check for null/undefined/NaN
   └─ Check data types (string "1" vs number 1)
```

---

## The 10 Most Common Hackathon Bugs

### 1. CORS Error
```
Access to fetch at 'http://localhost:8000' from origin 'http://localhost:3000' has been blocked by CORS
```
**Fix (FastAPI):**
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
```
**Fix (Express):**
```javascript
const cors = require('cors');
app.use(cors());
```

### 2. "Module not found" / Import Error
```bash
# Python
pip install <package> --break-system-packages
# or check you're in the right venv

# Node
npm install <package>
# or check you're in the right directory (where package.json is)
```

### 3. API Key Not Working
```bash
# Check .env file exists and has no spaces around =
OPENAI_API_KEY=sk-...   # ✅ correct
OPENAI_API_KEY = sk-... # ❌ spaces break it

# Python: make sure you load .env
from dotenv import load_dotenv
load_dotenv()  # ← must call this BEFORE using os.getenv()

# Next.js: prefix with NEXT_PUBLIC_ for client-side access
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. "Cannot read property of undefined"
```javascript
// The object is null/undefined. Add optional chaining:
data?.results?.map(...)  // instead of data.results.map(...)

// Or add a fallback:
const items = data?.results || []
```

### 5. Port Already in Use
```bash
# Find and kill the process
lsof -i :3000  # or :8000
kill -9 <PID>

# Or just use a different port
uvicorn main:app --port 8001
```

### 6. "hydration mismatch" (Next.js / React)
```javascript
// Usually caused by server/client rendering different content
// Quick fix: wrap in useEffect or use dynamic import
import dynamic from 'next/dynamic'
const Chart = dynamic(() => import('./Chart'), { ssr: false })
```

### 7. Database/File Not Found
```python
# Use absolute paths or Path objects
from pathlib import Path
BASE_DIR = Path(__file__).parent
data_path = BASE_DIR / "data" / "file.csv"
```

### 8. "fetch failed" / Network Error
```javascript
// Check: is the backend actually running?
// Check: is the URL correct? (http not https for localhost)
// Check: is the port correct?
// Quick test: open http://localhost:8000/docs in browser (FastAPI)
```

### 9. Python Package Conflicts
```bash
# Nuclear option (hackathon-appropriate):
pip install <package> --force-reinstall --break-system-packages

# Or create a fresh venv:
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### 10. "git merge conflict"
```bash
# Nuclear option for hackathons:
git checkout --theirs .  # accept all incoming changes
# or
git checkout --ours .    # keep all your changes
git add . && git commit -m "resolve conflicts"
```

---

## Emergency Debugging Commands

### Python
```python
# Print everything
import traceback
traceback.print_exc()

# Quick debug breakpoint
breakpoint()  # drops into pdb

# Check what's in a variable
print(f"DEBUG: {type(var)=}, {var=}")

# Check if API is responding
import requests
r = requests.get("http://localhost:8000/api/health")
print(r.status_code, r.json())
```

### JavaScript / React
```javascript
// Console debug
console.log('DEBUG:', JSON.stringify(data, null, 2))

// Check API response
fetch('http://localhost:8000/api/health')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error('API DOWN:', e))

// React: check if component renders
useEffect(() => { console.log('Component mounted, state:', state) }, [state])
```

### Network/API
```bash
# Test API from terminal
curl http://localhost:8000/api/health
curl -X POST http://localhost:8000/api/chat -H "Content-Type: application/json" -d '{"message":"test"}'

# Check what's listening
netstat -tlnp | grep -E '3000|8000'
```

---

## Git Emergency Commands

```bash
# See what changed
git diff
git status

# Undo all uncommitted changes (CAREFUL — destroys work)
git checkout .
git clean -fd

# Go back to last commit
git reset --hard HEAD

# Save current work temporarily
git stash
# ... try something ...
git stash pop  # get it back

# See recent commits (find a working version)
git log --oneline -10
git checkout <commit-hash>  # go back to that version
```

---

## The "Just Make It Work" Toolkit

When you can't fix a bug and time is running out:

| Problem | Hack Fix |
|---------|----------|
| API returns error sometimes | Wrap in try/catch, return hardcoded fallback |
| Feature is buggy | Remove it from the demo flow entirely |
| Real-time feature is slow | Pre-compute results, fake the real-time aspect |
| Auth doesn't work | Remove auth, hardcode a demo user |
| Database won't connect | Use a JSON file instead |
| Deployment fails | Demo from localhost + ngrok |
| Image upload broken | Use pre-loaded demo images |
| Chart doesn't render | Screenshot a working chart, embed as image |

---

## Asking Claude to Debug

```
I have this error: [PASTE FULL ERROR]
Here's the relevant code: [PASTE CODE]
This is a hackathon — I need the fastest fix, not the best architecture.
What changed: [WHAT YOU DID BEFORE IT BROKE]
```
