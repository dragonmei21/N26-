---
name: pitch-prep
description: "Use when preparing the hackathon pitch deck and demo script. Contains the winning pitch structure, slide-by-slide guidance, storytelling framework, and demo flow planning."
---

# Pitch Prep — Winning Hackathon Presentations

## The Winning Structure (3-5 minutes total)

Most hackathon pitches are 3-5 minutes. Every second counts. Here's the proven structure:

### Slide Flow (8-10 slides max)

| # | Slide | Duration | Purpose |
|---|-------|----------|---------|
| 1 | **Hook / Problem** | 30s | Make them FEEL the pain |
| 2 | **Solution (one sentence)** | 15s | "We built X that does Y" |
| 3 | **Live Demo** | 60-90s | THE moment. Show, don't tell. |
| 4 | **How It Works** | 30s | Simple architecture / flow diagram |
| 5 | **Tech Stack** | 15s | What you used, why it's smart |
| 6 | **Impact / Results** | 30s | Numbers, metrics, before/after |
| 7 | **Business Case** (optional) | 20s | Who pays, market size |
| 8 | **Team** | 10s | Quick intro, relevant skills |
| 9 | **What's Next / Vision** | 15s | Where this goes if we keep building |

### Time Budget
- **3-minute pitch:** Skip slides 5, 7, 8. Be ruthless.
- **5-minute pitch:** Include everything, extend demo to 2 minutes.

---

## The Hook (Most Important Slide)

**Don't start with "Hi, we're Team X and we built..."**

Instead, start with ONE of these:

### Option A: The Shocking Stat
> "Every year, [LARGE NUMBER] people/businesses face [PROBLEM]. That's [RELATABLE COMPARISON]."

### Option B: The Story
> "Meet [PERSONA NAME]. She's a [ROLE] who spends [TIME] every week doing [PAINFUL TASK]..."

### Option C: The Question
> "What would you do if [SCENARIO]? That's exactly what [X MILLION PEOPLE] face every day."

### Option D: The Live Demonstration of Pain
> Actually show the current painful process before showing your solution.

---

## Demo Script Template

**Write this BEFORE building the pitch deck.**

```
DEMO FLOW:
1. Open [URL/APP] → Show landing page (2 sec)
2. Click [BUTTON] → "As a [USER], I want to [ACTION]" (narrate)
3. [INPUT SOMETHING] → Use realistic demo data, not "test123"
4. [SHOW RESULT] → THIS is the wow moment. Pause. Let it land.
5. [ONE MORE FEATURE] → "And not only that, but..." (bonus)
6. Back to slides.

BACKUP PLAN:
- Screenshots saved in /demo-backup/
- Screen recording at [LINK]
- Key phrase: "Let me show you what this looks like..."

DEMO DATA:
- User: [realistic name]
- Input: [realistic scenario]
- Expected output: [what judges will see]
```

---

## Slide Content Guide

### Slide 1: Problem
- **One** clear problem statement
- A number that shows SCALE
- An image or icon that evokes emotion
- NO: Long paragraphs, multiple problems, jargon

### Slide 2: Solution
- **One sentence.** Maximum two.
- Format: "We built [PRODUCT NAME] — [what it does] for [who]."
- Optional: Screenshot or mockup (small, not the focus yet)

### Slide 3: Demo
- Full screen. No slide template visible.
- Pre-load the app before presenting
- Use realistic data (not "John Doe" and "test@test.com")
- Narrate what you're doing: "Watch what happens when I..."

### Slide 4: How It Works
- Simple flow diagram: 3-5 boxes with arrows
- User → [Your App] → [AI/Logic] → Result
- Don't show code. Show the FLOW.
- Mention key tech only if impressive (e.g., "real-time RAG pipeline")

### Slide 5: Tech Stack (if time allows)
- Visual: icons of technologies used
- Mention case partner tech prominently (Microsoft Azure, etc.)
- Brief: "Built with Next.js, FastAPI, and Azure OpenAI"

### Slide 6: Impact
- **Before / After comparison** (most powerful)
- Concrete metrics: "Reduces X from 2 hours to 30 seconds"
- If no real metrics: projected impact with clear assumptions

### Slide 9: Vision
- End on AMBITION, not features
- "With more time, we'd add X, Y, Z"
- "This could scale to [BIGGER VISION]"
- Last words should be memorable

---

## Presentation Tips

### Delivery
- **One presenter for the narrative, one for the demo.** Don't pass the mic more than once.
- **Speak to the PROBLEM, not the TECH.** Judges remember stories, not architectures.
- **Pause after the demo.** Let the "wow" breathe. Don't immediately rush to next slide.
- **End with energy.** Your last sentence should be confident and forward-looking.

### Demo Tips
- Pre-load everything. No typing URLs on stage.
- Use browser zoom (Cmd/Ctrl +) so the audience can see
- Have demo data pre-filled (but appear to type it live)
- If something breaks: "Let me show you what happens here..." → switch to screenshots

### Q&A Preparation
Prepare answers for these common judge questions:
1. "How is this different from [existing solution]?"
2. "How would this scale?"
3. "What was the hardest technical challenge?"
4. "Who is the target user?"
5. "What would you do with more time?"
6. "How would you monetize this?"
7. "What data did you use?"

---

## When to Start Pitch Prep

| Hackathon Hour | Pitch Action |
|---------------|-------------|
| Hour 0 | Write the one-sentence solution |
| Hour 8 | Draft demo flow script |
| Hour 12 | Finalize which features are in the demo |
| Hour 16 | Pitch Lead goes full-time on slides |
| Hour 18 | First draft of slides complete |
| Hour 20 | Dry run #1 |
| Hour 22 | Dry run #2 (final) |
| Hour 24 | 🎤 Showtime |

---

## Asking Claude to Help with Pitch

Use these prompts:

### Generate pitch narrative:
```
We built [PRODUCT] for the [CASE PARTNER] challenge.
It solves [PROBLEM] by [HOW].
The key features are [1, 2, 3].
Write me a 3-minute pitch script following the Hook → Solution → Demo → Impact → Vision structure.
Make the hook emotional/compelling, not corporate.
```

### Generate slide content:
```
Create content for slide [N]: [SLIDE TYPE]
Keep text minimal (max 20 words per slide).
Suggest a visual element for each slide.
Tone: confident, ambitious, clear.
```

### Refine the pitch:
```
Here's my current pitch script: [PASTE]
Make it sharper. Cut filler words. Make the hook stronger.
Time target: [X] minutes.
```
