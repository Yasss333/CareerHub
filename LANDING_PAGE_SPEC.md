# CareerHub Landing Page — Build & Merge Specification

> **Purpose:** Paste this entire file into Google AI Studio, Replit, or bolt.ai to generate a
> production-quality landing page, then merge the output into the CareerHub app using Section 7.
> **Everything the generator needs is in here: exact colors, exact copy, exact tags/classes, configs.**

---

## 0. How to use this file

Ask the generator to produce **exactly three deliverables**:

| # | Deliverable | Destination in CareerHub |
|---|---|---|
| A | `Landing.tsx` (single self-contained React component, default export) | `apps/web/src/pages/Landing.tsx` (replaces existing) |
| B | A CSS block (verbatim, marked `/* ===== LANDING STYLES START ===== */ ... END ===== */`) | appended to `apps/web/src/index.css` |
| C | An HTML `<head>` block (fonts + meta) | merged into `apps/web/index.html` |

Prompt to give the generator (if it doesn't read this whole file automatically):

> "Using the specification below, generate deliverables A, B and C. Output complete, runnable code.
> Do not invent copy, colors, or sections that are not specified. Use only the libraries listed in Section 2."

---

## 1. Product context (what the page is marketing)

**CareerHub** — a unified placement-prep platform for college students. Four real modules:

1. **AlgoRank** — coding practice: 500+ DSA problems, in-browser execution (Python, JavaScript,
   C++, Java) with per-testcase verdicts (Accepted / Wrong Answer / Runtime Error), leaderboard, streaks,
   comments/discussions, playlists.
2. **AI Resume Builder** — ATS-friendly resumes, AI content suggestions, professional templates, PDF export.
3. **Senior Connect** — book 1-on-1 mentorship sessions with seniors/alumni: published availability slots,
   slot booking, session workflow, feedback.
4. **AI Mock Interviews** — AI-generated questions, evaluation and feedback.

**Audience:** students preparing for placements (India-style prep culture — Striver / CodeHelp /
takeyouforward.com are the design references: confident, content-first, bold headlines, code-centric visuals).

**Routes the page must link to (already exist in the app):**

- `/landing` → this landing page (also the default route `*` redirects here)
- `/login` → Log In
- `/register` → Get Started / Sign Up
- Section anchors: `#features`, `#how-it-works`, `#stories`, `#faq`

No API calls. The landing page is fully static and public.

---

## 2. Hard technical constraints

- **React 18 + TypeScript (.tsx), built with Vite.**
- **Tailwind CSS** (utility classes in JSX). Custom animations go in CSS (Section 4.2), not in
  `tailwind.config.js` (the config is legacy — the app runs Tailwind v4 via `@tailwindcss/vite`).
- **Allowed imports only:**
  ```tsx
  import { Link } from 'react-router-dom'
  import { useState, useEffect, useRef } from 'react'
  import { Button } from '@/components/ui/button'        // shadcn
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
  import { Badge } from '@/components/ui/badge'
  import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
  // lucide-react icons (only these exist-check style — any lucide icon is fine):
  // ArrowRight, CheckCircle, Code, FileText, Users, Target, Zap, Star, Menu, X,
  // Trophy, Gauge, Calendar, MessageSquare, Shield, Play, ChevronDown, Sparkles,
  // Youtube, Linkedin, Twitter, Instagram, Terminal, Check
  ```
- **NO new npm packages.** No framer-motion, no gsap, no axios, no external images/fonts CDNs
  other than Google Fonts for Inter/JetBrains Mono. All visuals are built with CSS/HTML only
  (no `<img src="https://...">`; avatars are initials circles; logo is a CSS square).
- **File must be self-contained:** all data arrays (features, steps, testimonials, FAQ) declared
  inside the component file with TypeScript interfaces.
- **Styling scope:** the page root element carries `className="landing ..."` — all custom CSS from
  4.2 is scoped under `.landing` so it cannot leak into the rest of the app.
- **Fixed dark theme:** the landing renders identically in the app's light AND dark mode (it does
  not use `bg-background` / `text-foreground` semantic tokens for its sections). Reason: the app
  defaults to light theme, but the design (like the current landing and both reference sites) is dark.
- **TypeScript:** typed arrays, no unused imports (`npx tsc --noEmit` must pass).
- **Code style:** semicolons at statement end, single quotes for strings (matches existing file).

---

## 3. Design system

### 3.1 Color palette (exact values — use these hex codes)

**Page surfaces (fixed dark):**

| Token | Hex | Usage |
|---|---|---|
| `--ln-bg` | `#05050B` | page background |
| `--ln-bg-alt` | `#0A0A12` | alternating section background |
| `--ln-bg-hero` | `#07070F` | hero base (under glows) |
| `--ln-card` | `#12121C` | card background |
| `--ln-card-2` | `#161622` | card hover / inner panels |
| `--ln-border` | `#242433` | default borders (1px) |
| `--ln-border-strong` | `#32324A` | hover borders, code window frame |
| `--ln-nav` | `rgba(5,5,11,0.75)` | sticky navbar after scroll (with `backdrop-blur-xl`) |

**Text:**

| Token | Hex | Usage |
|---|---|---|
| `--ln-text` | `#FFFFFF` | headings |
| `--ln-text-body` | `#C7C7D6` | body copy |
| `--ln-text-muted` | `#9A9AAE` | secondary copy, nav links |
| `--ln-text-dim` | `#6E6E85` | footnotes, footer bottom |

**Accents (brand + module colors):**

| Token | Hex | Usage |
|---|---|---|
| `--ln-violet` | `#8B5CF6` | primary accent, brand |
| `--ln-purple` | `#A855F7` | gradient end |
| `--ln-indigo` | `#6366F1` | gradient start, glows |
| `--ln-blue` | `#3B82F6` | links, AlgoRank accent |
| `--ln-sky` | `#60A5FA` | gradient text start |
| `--ln-lilac` | `#A78BFA` | gradient text middle |
| `--ln-pink` | `#F472B6` | gradient text end |
| `--ln-emerald` | `#10B981` | success, Interview accent, check icons |
| `--ln-amber` | `#F59E0B` | stars, warnings |
| `--ln-cyan` | `#22D3EE` | Resume accent |
| `--ln-orange` | `#F97316` | Senior Connect accent |
| `--ln-red` | `#EF4444` | Senior Connect gradient end |

**Module gradient pairs (feature cards / icons):**

| Module | Gradient (Tailwind classes) |
|---|---|
| AlgoRank | `from-violet-500 to-indigo-500` |
| AI Resume Builder | `from-blue-500 to-cyan-400` |
| Senior Connect | `from-orange-500 to-red-500` |
| AI Mock Interviews | `from-emerald-500 to-green-400` |

### 3.2 Gradients (exact CSS strings)

```css
--ln-grad-brand:  linear-gradient(135deg, #6366F1 0%, #8B5CF6 45%, #A855F7 100%);  /* CTA buttons */
--ln-grad-text:   linear-gradient(90deg, #60A5FA 0%, #A78BFA 50%, #F472B6 100%);   /* headline text */
--ln-grad-text-2: linear-gradient(90deg, #6366F1 0%, #A855F7 100%);                /* section headings */
--ln-grad-border: linear-gradient(135deg, rgba(99,102,241,.6), rgba(168,85,247,.25)); /* badge/chip border */
--ln-hero-bg:     radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,.28), transparent 60%),
                  radial-gradient(ellipse 50% 40% at 85% 20%, rgba(168,85,247,.18), transparent 65%),
                  #07070F;
```

**Glow blobs (hero):** two absolutely-positioned `div`s, `w-[420px] h-[420px] rounded-full blur-[130px]`,
one `bg-indigo-600 opacity-30` top-left, one `bg-purple-600 opacity-25` bottom-right, `pointer-events-none`.

### 3.3 Typography

- **Font:** `Inter` (body/UI), `JetBrains Mono` (code mock only). Loaded in `index.html` (4.1);
  `--font-inter` already defined by the app.
- **Scale (Tailwind classes):**

| Element | Classes |
|---|---|
| Hero H1 | `text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]` |
| Section H2 | `text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight` |
| Section sub | `mt-4 text-lg sm:text-xl text-[#9A9AAE] max-w-2xl mx-auto` |
| Card title | `text-xl font-semibold` |
| Body | `text-base sm:text-lg leading-relaxed text-[#C7C7D6]` |
| Eyebrow/badge | `text-xs sm:text-sm font-semibold uppercase tracking-[0.18em]` |
| Stat number | `text-3xl sm:text-4xl lg:text-5xl font-extrabold` |
| Stat label | `mt-1 text-sm text-[#9A9AAE]` |

### 3.4 Radius, spacing, shadows

- Cards: `rounded-2xl border border-[#242433] bg-[#12121C]`; hover: `border-[#32324A] bg-[#161622]`.
- Buttons (CTA): `rounded-full px-7 py-6 text-base font-semibold` (shadcn `Button size="lg"` + custom gradient).
- Section vertical rhythm: `py-20 sm:py-28`.
- Content container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- Card shadows: `shadow-[0_10px_40px_-15px_rgba(99,102,241,0.35)]` on primary CTA only.
- Chip/pill: `rounded-full border border-[#242433] bg-[#12121C]/60 px-4 py-2 text-sm text-[#C7C7D6]`.

### 3.5 Theme tokens (reference only — do NOT use in landing sections)

The app's canonical theme lives in `apps/web/src/index.css` (`--background`, `--primary`, etc. —
violet/purple oklch values, light + dark). The landing intentionally ignores these and uses the
fixed hex palette above so it looks identical in both app themes.

---

## 4. Exact config snippets to merge

### 4.1 `apps/web/index.html` — head block

```html
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#05050B" />
  <meta name="description" content="CareerHub — practice 500+ DSA problems with in-browser execution, build an AI-powered resume, book mentorship sessions and give AI mock interviews. All in one platform." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
  <title>CareerHub — Practice Coding, Build Resumes, Crack Interviews</title>
</head>
```

### 4.2 `apps/web/src/index.css` — append at the end of the file

```css
/* ===== LANDING STYLES START ===== */
.landing {
  background: #05050b;
  color: #ffffff;
  font-family: "Inter", var(--font-inter), system-ui, sans-serif;
  overflow-x: hidden;
}
.landing .ln-text-gradient {
  background: linear-gradient(90deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.landing .ln-text-gradient-2 {
  background: linear-gradient(90deg, #6366f1 0%, #a855f7 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.landing .ln-btn-primary {
  background-image: linear-gradient(135deg, #6366f1 0%, #8b5cf6 45%, #a855f7 100%);
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}
.landing .ln-btn-primary:hover {
  transform: translateY(-2px);
  filter: brightness(1.08);
  box-shadow: 0 12px 40px -12px rgba(139, 92, 246, 0.7);
}
.landing .ln-hero-bg { background: var(--ln-hero-bg, #07070f); }

/* scroll reveal */
.landing [data-reveal] {
  opacity: 0;
  transform: translateY(26px);
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
.landing [data-reveal].ln-visible { opacity: 1; transform: translateY(0); }

/* trusted-by marquee */
.landing .ln-marquee { display: flex; width: max-content; animation: ln-marquee 32s linear infinite; }
.landing .ln-marquee:hover { animation-play-state: paused; }
@keyframes ln-marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

/* floating code window */
.landing .ln-float { animation: ln-float 7s ease-in-out infinite; }
@keyframes ln-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-14px); }
}

/* hairline divider between steps */
.landing .ln-hairline {
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.5), rgba(168, 85, 247, 0.05));
}

/* focus visibility for keyboard users */
.landing a:focus-visible,
.landing button:focus-visible,
.landing summary:focus-visible {
  outline: 2px solid #8b5cf6;
  outline-offset: 3px;
  border-radius: 6px;
}

@media (prefers-reduced-motion: reduce) {
  .landing .ln-marquee,
  .landing .ln-float { animation: none; }
  .landing [data-reveal] { opacity: 1; transform: none; transition: none; }
}
/* ===== LANDING STYLES END ===== */
```

### 4.3 `apps/web/src/App.tsx` — route (already present; keep exactly as is)

```tsx
<Route path="/landing" element={<Landing />} />
// ...
<Route path="*" element={<Navigate to="/landing" replace />} />
```

No App.tsx change is required when replacing `src/pages/Landing.tsx`.

---

## 5. Page structure — section-by-section (exact copy + tags)

**Section order:** Navbar → Hero → Trusted-by marquee → Features → How It Works → Why CareerHub →
Testimonials → FAQ → Final CTA → Footer.

**Global rules for every section:**

```tsx
// section wrapper
<section id="features" className="py-20 sm:py-28 bg-[#0A0A12] scroll-mt-24">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* heading block */}
    <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16" data-reveal>
      <span className="inline-flex items-center gap-2 rounded-full border border-[#242433] bg-[#12121C] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#A78BFA]">
        Eyebrow Text
      </span>
      <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
        Section Heading in <span className="ln-text-gradient-2">gradient</span>
      </h2>
      <p className="mt-4 text-lg sm:text-xl text-[#9A9AAE] max-w-2xl mx-auto">Section sub-copy.</p>
    </div>
    {/* content ... data-reveal on cards, with inline style={{ transitionDelay: `${i * 80}ms` }} for stagger */}
  </div>
</section>
```

- Every major block gets `data-reveal`; stagger children with `transitionDelay` (index × 80ms).
- Odd sections: `bg-[#05050B]`; even sections: `bg-[#0A0A12]` (alternating rhythm).
- `scroll-mt-24` on all anchor sections (fixed navbar offset).

---

### 5.1 Navbar (fixed, blur-on-scroll, mobile menu)

**Copy:** logo `CareerHub`; links `Features`, `How It Works`, `Success Stories`, `FAQ`;
right side `Log In` (ghost) + `Get Started Free` (gradient).

```tsx
<nav className="fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b border-transparent">
  {/* scrolled state: className + 'bg-[rgba(5,5,11,0.75)] backdrop-blur-xl border-[#242433]' via useState */}
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
    {/* Logo: 36px rounded-lg ln-btn-primary square with "CH" + wordmark */}
    {/* Desktop: hidden md:flex gap-8 text-[#9A9AAE] hover:text-white transition-colors */}
    {/* CTAs, then hamburger button md:hidden aria-label="Toggle menu" */}
  </div>
  {/* Mobile panel: md:hidden, border-t border-[#242433] bg-[#05050B]/95 backdrop-blur-xl,
      full-width stacked links + full-width CTA */}
</nav>
```

- Scroll state: `useEffect` + `window.addEventListener('scroll', ...)` toggling `scrolled` at `scrollY > 24`.
- Close mobile menu when a link is clicked.
- Logo mark: `<div className="w-9 h-9 rounded-lg ln-btn-primary grid place-items-center text-sm font-bold">CH</div>`.

### 5.2 Hero (gradient text, glow blobs, CTA pair, stats, floating code-window mock)

```tsx
<section className="relative overflow-hidden pt-32 sm:pt-40 pb-20 ln-hero-bg">
  {/* glow blobs (3.2) */}
  <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-14 items-center">
    <div>
      {/* badge */}
      <span className="inline-flex items-center gap-2 rounded-full border border-[#32324A] bg-[#12121C]/80 px-4 py-1.5 text-sm font-medium text-[#C7C7D6]">
        <Sparkles className="w-4 h-4 text-[#A78BFA]" /> All-in-one career platform for students
      </span>
      {/* H1 */}
      <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
        Master coding, resumes &amp; interviews
        <br />
        <span className="ln-text-gradient">all in one platform.</span>
      </h1>
      {/* Sub */}
      <p className="mt-6 text-lg sm:text-xl text-[#C7C7D6] max-w-xl">
        CareerHub brings 500+ DSA problems with in-browser execution, an AI resume builder,
        AI mock interviews and 1-on-1 mentorship from seniors — into one place built for placements.
      </p>
      {/* CTAs */}
      <div className="mt-9 flex flex-col sm:flex-row gap-4">
        <Link to="/register"><Button size="lg" className="ln-btn-primary rounded-full px-8 text-base">
          Start for Free <ArrowRight className="w-5 h-5 ml-2" /></Button></Link>
        <a href="#how-it-works"><Button size="lg" variant="outline"
          className="rounded-full px-8 text-base border-[#32324A] bg-white/5 hover:bg-white/10 text-white">
          See how it works</Button></a>
      </div>
      <p className="mt-4 text-sm text-[#6E6E85]">Free forever for students · No credit card needed</p>
      {/* STATS (count-up, Section 6) */}
      <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-lg">
        <!-- 4 × stat cell: number (ln-text-gradient, data-count) + label -->
      </div>
    </div>
    {/* CODE WINDOW MOCK (right column) */}
  </div>
</section>
```

**Hero stats (exact values — `[placeholder]` items must be replaced or kept as-is for demo):**

| Value | Label | Notes |
|---|---|---|
| `500+` | DSA Problems | real |
| `4` | Code Languages | real (Python, JavaScript, C++, Java) |
| `4` | Career Modules | real |
| `10K+` | Students prepared | `[placeholder — no real user data yet]` |

**Code-window mock (pure CSS/HTML, no images):**

```tsx
<div className="ln-float rounded-2xl border border-[#32324A] bg-[#12121C] shadow-[0_25px_60px_-20px_rgba(99,102,241,0.45)] overflow-hidden">
  {/* title bar: 3 dots (#EF4444,#F59E0B,#10B981) + tabs "problem.py" | "tests" + right chip "Python 3.12" */}
  {/* body: <pre className="p-5 text-sm font-mono leading-relaxed text-[#C7C7D6]"> with syntax-colored spans
       (keywords #A78BFA, strings #6EE7B7, functions #60A5FA) showing a Two Sum solution: */}
</div>
```

Exact code to display inside `<pre>` (with colored spans):

```text
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        comp = target - num
        if comp in seen:
            return [seen[comp], i]
        seen[num] = i
```

Below the code, a result strip: `✓ Accepted` pill (`text-[#10B981] bg-emerald-500/10 border-emerald-500/30`)
plus small chips `2 ms` and `18.4 MB`.

### 5.3 Trusted-by marquee (social proof)

```tsx
<section className="py-10 border-y border-[#242433] bg-[#05050B] overflow-hidden">
  <p className="text-center text-xs sm:text-sm uppercase tracking-[0.22em] text-[#6E6E85] mb-6">
    Students here have cracked offers at
  </p>
  <div className="relative">
    <div className="ln-marquee gap-12 items-center text-[#9A9AAE]">
      {/* list rendered TWICE for seamless loop; each item: text-lg sm:text-xl font-semibold whitespace-nowrap opacity-70 hover:opacity-100 transition-opacity */}
    </div>
    {/* edge fade: absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#05050B] to-transparent (and right mirrored) */}
  </div>
</section>
```

**Marquee items (placeholder brand names — typical placement-prep context):**
`Google` `Microsoft` `Amazon` `Adobe` `Uber` `Walmart Labs` `Goldman Sachs` `Bloomberg` `Salesforce`

### 5.4 Features (4 module cards + 6 mini chips)

Heading: eyebrow `Everything you need` / H2 `One platform, <span class="ln-text-gradient-2">four career tools</span>` /
sub `Stop juggling five tabs — practice, resume, mentorship and interviews live together.`

**4 cards (grid `md:grid-cols-2`, `Card` with hover border + gradient tint overlay):**

| Icon | Module title (exact) | Description (exact) | Icon gradient |
|---|---|---|---|
| `Code` | `AlgoRank — Coding Practice` | `500+ DSA problems with real-time execution. Track your progress on the leaderboard and climb the ranks.` | `from-violet-500 to-indigo-500` |
| `FileText` | `AI Resume Builder` | `Create ATS-friendly resumes with AI suggestions. Export to PDF and get professional templates.` | `from-blue-500 to-cyan-400` |
| `Users` | `Senior Connect` | `Book 1-on-1 mentorship sessions with industry professionals. Get personalized career guidance.` | `from-orange-500 to-red-500` |
| `Target` | `AI Mock Interviews` | `Practice with AI-powered interviews. Get real-time feedback and improve your performance.` | `from-emerald-500 to-green-400` |

Card anatomy: icon tile `w-14 h-14 rounded-xl bg-gradient-to-r {pair} grid place-items-center mb-6 text-white`,
`CardTitle className="text-white text-xl"`, `CardDescription className="text-[#9A9AAE] leading-relaxed"`,
plus a bottom text-link row `Explore module →` (`text-sm font-semibold text-[#A78BFA]`).

**6 mini chips (grid `sm:grid-cols-2 lg:grid-cols-3 gap-4`, pill cards):**

| Icon | Text (exact) |
|---|---|
| `Terminal` | `Run Python, JavaScript, C++ & Java in your browser` |
| `Trophy` | `Leaderboard & daily streaks` |
| `Gauge` | `ATS resume scoring with instant feedback` |
| `Calendar` | `Book mentors by real available slots` |
| `MessageSquare` | `Problem discussions & comments on every question` |
| `Shield` | `Private by default — your data stays yours` |

### 5.5 How It Works (4 steps)

Heading: eyebrow `How it works` / H2 `From sign-up to offer in <span class="ln-text-gradient-2">4 simple steps</span>` /
sub `Start improving your career today — pick a path and go.`

Steps (grid `sm:grid-cols-2 lg:grid-cols-4 gap-8`; big ghost number + gradient square + connector hairline):

| # | Title (exact) | Description (exact) |
|---|---|---|
| `01` | `Create Your Profile` | `Sign up in seconds and set up your career profile. Add your skills, experience, and goals.` |
| `02` | `Choose Your Path` | `Practice coding problems, build your resume, or connect with mentors - your choice.` |
| `03` | `Track & Improve` | `Monitor your progress with detailed analytics. Get AI-powered insights to level up faster.` |
| `04` | `Land Your Dream Job` | `Apply with confidence using your polished resume and interview skills.` |

Step markup: ghost number `text-6xl font-extrabold text-[#161622]`, overlay gradient square
`w-9 h-9 rounded-lg ln-btn-primary` at `top-2 left-4`, title `text-lg font-semibold text-white`,
desc `text-[#9A9AAE]`; connector on `lg`: absolute `ln-hairline h-px top-5 right-[-2rem] w-16`.

### 5.6 Why CareerHub (3 differentiators)

Heading: eyebrow `Why CareerHub` / H2 `Built for students, <span class="ln-text-gradient-2">by students</span>`

| Icon | Title (exact) | Description (exact) |
|---|---|---|
| `Zap` | `Free forever for students` | `Core features stay free — no credit card, no trial countdown, no surprises.` |
| `CheckCircle` | `Everything in one tab` | `Stop juggling five tools. Practice, resume, mentorship and prep live together.` |
| `Sparkles` | `Made for placement timelines` | `Designed around real placement seasons — from 2nd year practice to final offers.` |

Layout: 3 columns `lg:grid-cols-3 gap-6`, compact cards with top border-tint gradient
(`before` pseudo or a `h-px w-full bg-gradient-to-r from-indigo-500/60 to-transparent` div inside card).

### 5.7 Testimonials (3 cards)

Heading: eyebrow `Success stories` / H2 `Real students, <span class="ln-text-gradient-2">real offers</span>` /
sub `Join thousands of developers who are already accelerating their career growth.`

**Copy (exact — `[placeholder]`: replace with real feedback when available):**

| Stars | Quote (exact) | Name | Role | Initials |
|---|---|---|---|---|
| 5 | `CareerHub helped me crack my dream job. The coding practice platform and mock interviews were game-changers.` | `Sarah Chen` `[placeholder]` | `Software Engineer at Google` | `SC` |
| 5 | `The mentorship sessions were invaluable. My mentor helped me negotiate a 40% higher salary.` | `Michael Rodriguez` `[placeholder]` | `Senior Developer at Meta` | `MR` |
| 5 | `AI Resume Builder saved me hours. The ATS optimization got me past all the filters.` | `Priya Sharma` `[placeholder]` | `Full Stack Developer at Amazon` | `PS` |

Card anatomy: 5 `Star` icons `w-4 h-4 text-[#F59E0B] fill-[#F59E0B]`, quote
`text-[#C7C7D6] italic leading-relaxed`, footer row with initials avatar
(`w-11 h-11 rounded-full ln-btn-primary grid place-items-center text-sm font-bold`), name
`font-semibold text-white text-sm`, role `text-sm text-[#9A9AAE]`.
Layout: `md:grid-cols-3 gap-6`.

### 5.8 FAQ (accordion — exact Q&A)

Heading: eyebrow `FAQ` / H2 `Questions? <span class="ln-text-gradient-2">Answered.</span>`

Use shadcn `Accordion type="single" collapsible` in a `max-w-3xl mx-auto`; each item
`border-b border-[#242433]`, trigger `text-base sm:text-lg font-semibold text-white py-5`
with `ChevronDown` rotation, content `pb-5 text-[#9A9AAE] leading-relaxed`.

| # | Question (exact) | Answer (exact) |
|---|---|---|
| 1 | `What is CareerHub?` | `CareerHub is a unified prep platform that brings coding practice (500+ DSA problems), AI-assisted resume building, mentorship from seniors and AI mock interviews into a single place.` |
| 2 | `Is CareerHub free?` | `Yes. The core platform is free for students — no credit card required and no trial timer.` |
| 3 | `Which programming languages can I run?` | `Python, JavaScript, C++ and Java. Your code runs in a sandboxed environment right from your browser.` |
| 4 | `How does code execution work?` | `Every submission runs against the problem's test cases and gets an instant verdict — Accepted, Wrong Answer or Runtime Error — plus time and memory stats per test case.` |
| 5 | `How do mentorship sessions work?` | `Seniors publish their availability, you book an open slot, join the session and leave feedback afterwards — all inside CareerHub.` |
| 6 | `Is my resume data private?` | `Your resumes and profile are visible only to you. Nothing is shared publicly unless you choose to share it.` |

### 5.9 Final CTA

```tsx
<section className="relative overflow-hidden py-20 sm:py-28 bg-[#0A0A12]">
  {/* radial glow: absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(99,102,241,0.18),transparent_70%)] */}
  <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
      Ready to launch <span className="ln-text-gradient">your career?</span>
    </h2>
    <p className="mt-5 text-lg sm:text-xl text-[#9A9AAE]">
      Join thousands of developers who are already accelerating their career growth.
    </p>
    <div className="mt-9 flex flex-col sm:flex-row gap-4 justify-center">
      <Link to="/register"><Button size="lg" className="ln-btn-primary rounded-full px-8 text-base">
        Get Started Free <ArrowRight className="w-5 h-5 ml-2" /></Button></Link>
      <Link to="/login"><Button size="lg" variant="outline"
        className="rounded-full px-8 text-base border-[#32324A] bg-white/5 hover:bg-white/10 text-white">
        I already have an account</Button></Link>
    </div>
    {/* trust row: 3 × CheckCircle w-5 h-5 text-[#10B981] + label */}
    <!-- labels: "Free to start" · "No credit card required" · "Works on any device" -->
  </div>
</section>
```

### 5.10 Footer

```tsx
<footer className="border-t border-[#242433] bg-[#05050B] pt-14 pb-8">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* grid md:grid-cols-4 gap-10 */}
    {/* col 1: logo + blurb */}
    {/* col 2 "Product": Features, How It Works, Success Stories, FAQ  (anchors) */}
    {/* col 3 "Get started": Log In, Create account  (/login, /register) */}
    {/* col 4 "Company": About, Privacy, Terms, Contact  (href="#" — placeholder links) */}
    {/* social row: Youtube, Linkedin, Twitter, Instagram icons —
         w-9 h-9 rounded-lg border border-[#242433] hover:border-[#8B5CF6] hover:text-white text-[#9A9AAE] grid place-items-center transition-colors */}
    {/* bottom bar: border-t border-[#242433] mt-10 pt-6 flex justify-between text-sm text-[#6E6E85] */}
  </div>
</footer>
```

**Exact texts:**
- Blurb: `Your complete career development platform. From coding practice to mentorship.`
- Columns: `Product` / `Get started` / `Company`
- Bottom-left: `© 2026 CareerHub. All rights reserved.`
- Bottom-right: `Made for students, by students.`

---

## 6. Interaction & feature checklist (all required)

1. **Sticky navbar:** transparent at top → `bg-[rgba(5,5,11,0.75)] backdrop-blur-xl border-[#242433]`
   after scrolling past 24px (useState + scroll listener, cleaned up on unmount).
2. **Mobile menu:** hamburger (`Menu`/`X` icons) toggles a full-width panel; closes on link click and
   on `resize` to ≥ md (optional). `aria-label="Toggle menu"` on the button.
3. **Smooth scrolling:** global `html { scroll-behavior: smooth }` already exists — just use
   `<a href="#section">`; every anchor section carries `scroll-mt-24`.
4. **Scroll-reveal:** one `IntersectionObserver` in `useEffect` observing all `[data-reveal]`
   elements (threshold `0.15`, `unobserve` after reveal); adds class `ln-visible`; staggered via inline
   `transitionDelay` (i × 80ms). Guard with `prefers-reduced-motion` (CSS already handles it).
5. **Count-up stats:** animate `0 → target` over ~1200ms with `requestAnimationFrame` ease-out when the
   stat enters view; support prefixes/suffixes (`500+`, `10K+`); if `prefers-reduced-motion`, set the
   final value instantly. Targets/labels exactly as in 5.2.
6. **Marquee:** list rendered twice, `ln-marquee` class (32s linear, pauses on hover) — CSS in 4.2.
7. **FAQ accordion:** shadcn `Accordion` single+collapsible with `ChevronDown` rotating
   (`data-[state=open]:rotate-180 transition-transform`).
8. **Hover states:** CTA buttons lift (`ln-btn-primary:hover`), cards shift border to `#32324A`
   and background to `#161622` (`transition-all duration-300`), footer icons tint violet.
9. **Keyboard/a11y:** semantic `<nav>/<section>/<footer>`, `aria-hidden="true"` on decorative glows/icons,
   visible focus ring (in 4.2), all icon-only buttons labeled.
10. **No horizontal scroll:** `overflow-x: hidden` on `.landing`; glow blobs `pointer-events-none`.
11. **Responsive:** test at 360px, 768px, 1024px, 1440px — hero stacks (`grid-cols-1` → `lg:grid-cols-2`),
    stats `grid-cols-2` → `sm:grid-cols-4`, features `md:grid-cols-2`, steps `sm→lg` 4-up.

---

## 7. Merge steps (in CareerHub)

1. Save deliverable **A** over `apps/web/src/pages/Landing.tsx` (keep `export default function Landing()`).
2. Append deliverable **B** to the end of `apps/web/src/index.css` (after the existing keyframes).
3. Replace the `<head>` contents in `apps/web/index.html` with deliverable **C**.
4. Confirm `App.tsx` routes from 4.3 are unchanged (they already exist).
5. Verify:
   ```bash
   cd apps/web
   npx tsc --noEmit        # must be clean
   npx vite build          # must succeed
   npm run dev             # then manually check:
   ```
   - `http://localhost:5173/landing` renders (and `/` redirects there when logged out)
   - `Log In` → `/login`, `Get Started Free` → `/register`
   - anchor links scroll to sections below the fixed navbar
   - mobile menu works at 360px width; no horizontal scrollbar
   - page looks identical with the app theme set to light (landing stays dark by design)
6. Update `CHANGELOG.md` (`### Added` → `- Rebuilt landing page per LANDING_PAGE_SPEC.md (...)`).

---

## 8. Banned practices (generator must not do these)

- ❌ No `framer-motion`, `gsap`, `axios`, `react-icons`, or any npm package not in Section 2.
- ❌ No external images (`unsplash`, `imgur`, remote SVGs) — CSS/HTML visuals only.
- ❌ No API calls, no `localStorage`, no auth logic on this page.
- ❌ No semantic `bg-background`/`text-foreground` on landing sections (fixed dark palette instead).
- ❌ No invented copy beyond this spec; no extra sections (no pricing table — the product has no billing).
- ❌ No `<a href="/login">` — use `<Link to="/login">` from react-router-dom for internal routes.
- ❌ No changes to `tailwind.config.js`, routing, or shared components.

---

## 9. Reference styles (why these decisions)

- **codehelp.in** — trusted-by proof strip, module/feature card grids, testimonial wall with
  initials + role, FAQ accordion, clear single-gradient CTA — all adopted above.
- **takeyouforward.com (Striver)** — dark minimal canvas, bold display headlines with gradient
  accent words, code-centric product visual, confident short copy — adopted as the visual base.
- **CareerHub itself** — palette, Inter font, shadcn components and violet/indigo brand gradient
  taken from `apps/web/src/index.css` and the existing landing so the page feels native to the app.
