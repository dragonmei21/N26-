---
name: deploy-and-demo
description: "Use when preparing to deploy the app or set up the live demo. Contains one-command deploy recipes for Vercel/Railway/ngrok, pre-demo checklist, backup strategies, and presentation setup."
---

# Deploy & Demo — From Localhost to Stage

## Decision: How to Demo?

```
Do you need a public URL?
├─ NO (presenting from your laptop) → Just run locally
├─ YES (judges test on their devices) → Deploy or use ngrok
│
Deploy where?
├─ Frontend only (static/Next.js) → Vercel (fastest)
├─ Frontend + Python backend → Vercel + Railway
├─ Quick tunnel to localhost → ngrok (2 min setup)
└─ Everything in one place → Railway (both frontend + backend)
```

---

## Option 1: Run Locally + ngrok (Fastest, most reliable)

```bash
# Install ngrok
# macOS: brew install ngrok
# Linux: snap install ngrok
# Or: https://ngrok.com/download

# Start your app locally, then tunnel it:
ngrok http 3000  # for frontend on port 3000
# or
ngrok http 8000  # for backend on port 8000

# You get a public URL like: https://abc123.ngrok-free.app
# Share this URL for the demo
```

**Pro:** Most reliable. No deploy bugs. Works with any stack.
**Con:** Stops when your laptop closes. Free tier shows a warning page.

---

## Option 2: Vercel (Frontend / Next.js)

```bash
# One-time setup
npm i -g vercel
vercel login

# Deploy (from your frontend directory)
vercel --prod

# That's it. You get a URL like: https://your-app.vercel.app
```

### Environment variables:
```bash
# Set via CLI
vercel env add OPENAI_API_KEY production
vercel env add NEXT_PUBLIC_API_URL production

# Or set in vercel.com dashboard → Settings → Environment Variables
```

### For Next.js API routes (no separate backend needed):
```bash
# If your entire app is Next.js with API routes, just:
vercel --prod
# Everything deploys together
```

---

## Option 3: Railway (Python Backend)

```bash
# Install
npm i -g @railway/cli
railway login

# Init + deploy
railway init
railway up

# Set environment variables
railway variables set OPENAI_API_KEY=sk-...
```

### For FastAPI, add a `Procfile`:
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Or use `railway.toml`:
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
```

---

## Option 4: Streamlit Cloud (If using Streamlit)

```bash
# Push to GitHub, then:
# 1. Go to share.streamlit.io
# 2. Connect your repo
# 3. Deploy
# 4. Get URL like: https://your-app.streamlit.app

# Make sure you have a requirements.txt
pip freeze > requirements.txt
```

---

## Option 5: Docker (if nothing else works)

```dockerfile
# Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t hackathon-app .
docker run -p 8000:8000 --env-file .env hackathon-app
```

---

## Pre-Demo Checklist (30 minutes before)

### Technical Setup
- [ ] App is running (locally or deployed)
- [ ] Test the EXACT demo flow end-to-end
- [ ] API keys are working (not expired/rate-limited)
- [ ] Demo data is loaded / pre-populated
- [ ] WiFi connected and URL accessible
- [ ] Test on the presentation computer (not just yours)

### Browser Setup
- [ ] Open app in Chrome/Firefox (clear, no clutter)
- [ ] Zoom to 125-150% (so audience can read)
- [ ] Close ALL other tabs
- [ ] Turn off notifications (Do Not Disturb mode)
- [ ] Bookmark the demo URL for quick access
- [ ] If using DevTools for demo: dock to bottom, increase font size

### Presentation Setup
- [ ] Pitch deck loaded in presenter view
- [ ] Know how to switch between slides ↔ browser smoothly
- [ ] Test projector/screen connection
- [ ] Slide advancer / clicker working
- [ ] Laptop charged or plugged in

### Backup Plan
- [ ] Screenshots of every demo step saved in slides
- [ ] Screen recording of full demo flow (use OBS or QuickTime)
- [ ] Offline-capable? (If WiFi dies, does the demo still work?)
- [ ] Hotspot ready as WiFi backup

---

## Demo Flow Script Template

Write this down on paper and follow it exactly:

```
1. START: Slide 1 (title) — "Hi, we're [team], and we built [project]"
2. Slides 2-3 — Problem + Solution (30 seconds)
3. SWITCH TO BROWSER — "Let me show you how it works"
4. Demo Step 1: [Click X] → [Shows Y] — "As a [user], I..."
5. Demo Step 2: [Input Z] → [AI processes] — "Watch what happens..."
6. Demo Step 3: [Show result] → PAUSE — let the wow land
7. SWITCH BACK TO SLIDES — "Here's the tech behind this..."
8. Remaining slides (Impact, Team, Vision)
9. END: "Thank you — any questions?"
```

### Key Transitions:
- **Slides → Browser:** "Let me show you this in action" (Cmd+Tab or Alt+Tab)
- **Browser → Slides:** "Now let me walk you through how we built this" (Cmd+Tab)
- **If demo breaks:** "Let me show you what this looks like" → switch to screenshot slides

---

## Emergency: Demo Fails on Stage

### WiFi dies:
→ "We have a recording of the demo" → play screen recording
→ Or: switch to mobile hotspot, reload

### App crashes:
→ "Let me show you what this looks like" → advance to screenshot slides
→ NEVER: say "sorry" or "this was working 5 minutes ago"

### API rate limited:
→ Have cached/hardcoded responses ready
→ Quick fix: return mock data from API endpoint as fallback

### Wrong data appears:
→ Keep talking, narrate what SHOULD appear
→ "What you'd normally see here is..." → move to next step

---

## Quick Screen Recording (Backup Demo)

### macOS:
```bash
# QuickTime: File → New Screen Recording
# Or: Cmd + Shift + 5
```

### Linux:
```bash
# Install OBS or use:
sudo apt install simplescreenrecorder
```

### Any OS:
```bash
# Use a browser extension like Loom or Screencastify
# Or record directly in Zoom (share screen + record)
```

---

## Last-Minute Performance Tips

```bash
# If the app is slow:

# 1. Disable React strict mode (double-renders in dev)
# next.config.js: reactStrictMode: false

# 2. Use production build
npm run build && npm start  # instead of npm run dev

# 3. Pre-warm the API (make a test request before demo)
curl http://localhost:8000/api/health

# 4. Pre-cache AI responses
# Add a simple cache dict in your backend:
cache = {}
def get_response(query):
    if query in cache:
        return cache[query]
    response = call_openai(query)
    cache[query] = response
    return response
```
