---
name: ui-polish
description: "Use in the final hours to make a prototype look polished. Contains Tailwind/CSS tricks, component patterns, animations, and quick visual upgrades that take 5 minutes but look like 5 hours of work."
---

# UI Polish — Make It Look Professional in 30 Minutes

## Philosophy
Judges form opinions in the first 5 seconds of seeing your app. These tricks maximize visual impact with minimal code.

## Priority Order (do these in sequence, stop when time runs out)

1. **Typography & spacing** (5 min) — biggest impact
2. **Color consistency** (5 min)
3. **Loading states** (5 min)
4. **One animation** (5 min)
5. **Dark mode** (10 min) — optional flex

---

## 1. Typography & Spacing (Instant Upgrade)

### The #1 mistake: everything is the same size
```css
/* Before: flat hierarchy */
.title { font-size: 18px; }
.subtitle { font-size: 16px; }
.body { font-size: 14px; }

/* After: clear hierarchy */
.title { font-size: 36px; font-weight: 700; letter-spacing: -0.02em; }
.subtitle { font-size: 18px; font-weight: 400; color: #6b7280; }
.body { font-size: 15px; line-height: 1.6; }
```

### Tailwind quick hierarchy:
```html
<h1 class="text-4xl font-bold tracking-tight text-gray-900">Main Title</h1>
<p class="text-lg text-gray-500 mt-2">Supporting description here</p>
<p class="text-sm text-gray-400 mt-4">Smaller detail text</p>
```

### Add breathing room:
```html
<!-- Before: cramped -->
<div class="p-2 space-y-1">

<!-- After: spacious and premium -->
<div class="p-8 space-y-6">
```

---

## 2. Color Consistency

### Pick ONE accent color and use it everywhere:
```javascript
// tailwind.config.js or just use these classes
const ACCENT = {
  bg: "bg-indigo-600",
  hover: "hover:bg-indigo-700",
  text: "text-indigo-600",
  light: "bg-indigo-50",
  border: "border-indigo-200",
  ring: "ring-indigo-500",
}
```

### Quick professional palette (Tailwind):
```html
<!-- Primary actions -->
<button class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
  Analyze
</button>

<!-- Secondary actions -->
<button class="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors">
  Cancel
</button>

<!-- Cards -->
<div class="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">

<!-- Page background -->
<main class="min-h-screen bg-gray-50">
```

### Status colors (consistent across app):
```html
<span class="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-medium">Success</span>
<span class="text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium">Pending</span>
<span class="text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium">Error</span>
```

---

## 3. Loading States (Shows Polish Instantly)

### Skeleton loader (looks professional):
```jsx
function Skeleton({ className }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

// Usage:
{loading ? (
  <div className="space-y-3">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-32 w-full" />
  </div>
) : (
  <ActualContent />
)}
```

### Spinner with text:
```jsx
function LoadingSpinner({ text = "Analyzing..." }) {
  return (
    <div className="flex items-center gap-3 text-gray-500">
      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      <span>{text}</span>
    </div>
  );
}
```

### Streaming text effect (for AI responses):
```jsx
function StreamingText({ text }) {
  return (
    <p className="whitespace-pre-wrap">
      {text}
      <span className="inline-block w-2 h-5 bg-indigo-600 animate-pulse ml-0.5" />
    </p>
  );
}
```

---

## 4. One Animation (Pick ONE, not all)

### Option A: Fade-in on load
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-in { animation: fadeIn 0.4s ease-out; }
```
```html
<div class="fade-in">Content appears smoothly</div>
```

### Option B: Smooth card hover
```html
<div class="transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer rounded-xl bg-white border p-6">
  Card content
</div>
```

### Option C: Number count-up (great for impact metrics)
```jsx
function CountUp({ target, duration = 1500 }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  
  return <span className="text-5xl font-bold text-indigo-600">{count.toLocaleString()}</span>;
}
```

### Option D: Typing effect for AI output
```jsx
function TypeWriter({ text, speed = 20 }) {
  const [displayed, setDisplayed] = useState('');
  
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text]);
  
  return <p className="font-mono">{displayed}<span className="animate-pulse">|</span></p>;
}
```

---

## 5. Quick Layout Patterns

### Hero / Landing Section
```html
<div class="max-w-4xl mx-auto text-center py-20 px-4">
  <h1 class="text-5xl font-bold tracking-tight text-gray-900">
    Your App Name
  </h1>
  <p class="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
    One-line description of what this does
  </p>
  <div class="mt-8">
    <button class="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors">
      Get Started
    </button>
  </div>
</div>
```

### Dashboard Layout
```html
<div class="min-h-screen bg-gray-50">
  <!-- Top bar -->
  <header class="bg-white border-b px-6 py-4 flex items-center justify-between">
    <h1 class="text-xl font-bold">App Name</h1>
    <div class="flex items-center gap-4">
      <span class="text-sm text-gray-500">Demo User</span>
    </div>
  </header>
  
  <!-- Content -->
  <main class="max-w-7xl mx-auto p-6">
    <!-- Metric cards -->
    <div class="grid grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-xl p-6 border">
        <p class="text-sm text-gray-500">Total</p>
        <p class="text-3xl font-bold mt-1">1,234</p>
      </div>
      <!-- ... more cards -->
    </div>
    
    <!-- Main content area -->
    <div class="grid grid-cols-3 gap-6">
      <div class="col-span-2 bg-white rounded-xl p-6 border">
        Main content
      </div>
      <div class="bg-white rounded-xl p-6 border">
        Sidebar
      </div>
    </div>
  </main>
</div>
```

### Chat Interface
```html
<div class="flex flex-col h-screen max-w-2xl mx-auto">
  <!-- Messages -->
  <div class="flex-1 overflow-y-auto p-4 space-y-4">
    <!-- User message -->
    <div class="flex justify-end">
      <div class="bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-br-md max-w-[80%]">
        User message here
      </div>
    </div>
    <!-- AI message -->
    <div class="flex justify-start">
      <div class="bg-gray-100 text-gray-900 px-4 py-2 rounded-2xl rounded-bl-md max-w-[80%]">
        AI response here
      </div>
    </div>
  </div>
  
  <!-- Input -->
  <div class="border-t p-4">
    <div class="flex gap-2">
      <input class="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Type a message..." />
      <button class="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors">Send</button>
    </div>
  </div>
</div>
```

---

## Quick Fixes Checklist (Last 30 minutes)

- [ ] Add `max-w-7xl mx-auto px-4` to page containers (prevents edge-to-edge text)
- [ ] Increase all padding by 50% (spacious = premium)
- [ ] Make primary button bigger: `px-6 py-3 text-lg`
- [ ] Add `rounded-xl` to all cards (softer = modern)
- [ ] Add `shadow-sm` to white cards on gray backgrounds
- [ ] Set body background to `bg-gray-50` or `bg-slate-50` (not pure white)
- [ ] Add `transition-colors` to all buttons
- [ ] Use `font-medium` or `font-semibold` for buttons (not default weight)
- [ ] Replace any default blue links with your accent color
- [ ] Add a favicon (even a simple emoji): `<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>">`
