# Cro Metrics — AI UI Style Guide (LLM Instructions)

> **Purpose**: You are generating code and copy for a **React + Tailwind** project that must align with the **Cro Metrics (2025) brand**. Follow these rules exactly. When uncertain, default to simplicity, accessibility, and the tokens below.

---

## 0) Tech & Libraries (assume present)
- Framework: React (Vite or Next.js)
- Styling: Tailwind CSS mapped to CSS variables (tokens below)
- Icons: `lucide-react`
- Charts: `recharts`
- Fonts: **Montserrat** (all headings/body/UI) and **Caveat** (short callouts only)

If any dependency/config is missing, add it.

---

## 1) Design Tokens (CSS Variables)
If these don’t exist, create them in the global stylesheet and reference them in Tailwind config.

```css
:root {
  /* Blues */
  --cro-blue-800: #0F8AFF;
  --cro-blue-700: #2996FF;
  --cro-blue-500: #399EFF;
  --cro-blue-400: #61B1FF;
  --cro-blue-200: #9CCEFF;
  --cro-blue-100: #E0F0FF;

  /* Greens */
  --cro-green-700: #509A6A;
  --cro-green-600: #56A471;
  --cro-green-500: #57A773;
  --cro-green-400: #79B98F;
  --cro-green-200: #ABD3B9;
  --cro-green-100: #DEEDE3;

  /* Purple */
  --cro-purple-800: #484D6D;
  --cro-purple-700: #6D718A;
  --cro-purple-400: #A3A6B6;

  /* Platinum (neutrals) */
  --cro-plat-400: #D5DDD9;
  --cro-plat-300: #E3E8E6;
  --cro-plat-100: #F4F6F5;

  /* Yellow (normalized ladder; guide lists two 500s) */
  --cro-yellow-700: #C7870A;
  --cro-yellow-600: #F5B841;
  --cro-yellow-500: #F7C667;
  --cro-yellow-400: #FADCA0;
  --cro-yellow-100: #FCEDCF;

  /* Red (errors/destructive only) */
  --cro-red-600: #EB0000;
  --cro-red-500: #FF0000;
  --cro-red-300: #FFD6D6;

  /* Core */
  --cro-soft-black-700: #2F2B2F;
  --cro-white: #FFFFFF;

  /* Rounding */
  --radius: 1.5rem; /* 2xl */
}
Tailwind mapping: extend theme.colors.cro.* to these variables. Use container padding ~2rem.
2) Typography
    Load Montserrat (Regular/Medium/Bold/ExtraBold) and Caveat (Regular/Bold) via CSS import or local files; use Montserrat for everything, Caveat only for short callouts.
	•	Primary: Montserrat for everything (headings, body, UI).
	•	Callouts only: Caveat for short emphasis/labels. Never paragraphs.
	•	Weights: Montserrat Regular/Medium/Bold/ExtraBold; Caveat Regular/Bold.
	•	Sizes: Body 16px default. H1 ≈ 3× body, then H2–H6 scale down (e.g., 40/32/28/24/20px).
	•	One “title treatment” per page. Avoid ALL CAPS with Caveat.

3) Color & Accessibility Rules
	•	Primary actions: Blue-700/800 with white text that passes AA. If borderline, step one tint darker or add an outline.
	•	Surfaces: White background with Platinum-300 border, subtle shadow, rounded ≈ 1.5rem.
	•	Text: Default --cro-soft-black-700. Use Purple/Yellow/Green sparingly for emphasis.
	•	Red: only for errors/destructive actions/negative data. Never decorative.
	•	Prefer documented AA/AAA pairs. If a new combo appears, add a brief contrast check.
    Use documented AA/AAA pairs; AA18 combos only for ≥24px text or ≥18px bold.


4) Components (visual contracts)

Implement or reuse components with these contracts. Keep props simple and accessible.

Button
	•	Variants: primary (blue), secondary (white + platinum border), ghost (transparent blue text), danger (red).
	•	Shape: rounded ~1.5rem, medium font, subtle shadow.
	•	Focus: visible ring in Blue-700.
	•	Red is danger only.

Card / Surface
	•	White background, Platinum-300 border, 2xl rounding, small shadow.
	•	Optional header divider border-cro-plat-300.

Alert
	•	info: Blue-100 bg + Blue-400 border.
	•	warning: Yellow-100 bg + Yellow-600 border.
	•	error: Red-300 bg + Red-600 text/border.

Badge
	•	info Blue-100, success Green-100, warning Yellow-100; rounded-xl; 12px text.

Navbar
	•	White/blurred surface, Platinum-300 bottom border; restrained links.
	•	Primary CTA uses primary Button.

⸻

5) Charts (Recharts)
	•	Series palette (order): Blue-700, Green-600, Yellow-700, Purple-700, Green-500, Blue-400.
	•	Axes & grid: Platinum tones (axes stroke --cro-plat-400; grid --cro-plat-300 dashed).
	•	Lines 2px, no dots by default. Avoid rainbow palettes.

⸻

6) Voice & Microcopy
	•	Clarity over complexity; actionable > theoretical.
	•	Tone: sharp, insightful, human; confident yet adaptable.
	•	Light, honest asides only when they improve understanding.
	•	Use plain language in tooltips, empty states, and alerts.

⸻

7) Logo Handling (if used)
	•	Use approved logo/lockups only. Keep even padding.
	•	No stretching, gradients, strokes, multi-color modifications, or “filled gauge”.
	•	Prefer top-left placement.

⸻

8) Implementation Checklist (PR must pass)
	•	Primary buttons: Blue-700/800 with white text and AA contrast.
	•	Red appears only in errors/destructive states or negative data.
	•	Cards/surfaces: white bg, Platinum border, 2xl rounding.
	•	Typography: Montserrat everywhere; Caveat limited to short callouts.
	•	Charts: platinum axes/grid; series from the specified palette.
	•	Layout: simple, generous whitespace; no clutter/over-coloring.
	•	Focus states visible; keyboard nav works.

9) Minimal Stubs (encourage reuse)

button.tsx
type Variant = "primary" | "secondary" | "ghost" | "danger"
const base = "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
const styles = {
  primary: "bg-cro-blue-700 text-white hover:bg-cro-blue-800 focus-visible:ring-cro-blue-700",
  secondary:"bg-white text-cro-soft-black-700 border border-cro-plat-300 hover:bg-cro-plat-100 focus-visible:ring-cro-blue-700",
  ghost:    "bg-transparent text-cro-blue-700 hover:bg-cro-blue-100 focus-visible:ring-cro-blue-700",
  danger:   "bg-cro-red-600 text-white hover:bg-cro-red-500 focus-visible:ring-cro-red-600"
}

card.tsx
<div className="bg-white border border-cro-plat-300 rounded-2xl shadow-sm">{/* content */}</div>

alert.tsx
// info | warning | error → Blue-100 / Yellow-100 / Red-300 backgrounds

10) LLM Behaviors (enforce)
	•	Always import/use Montserrat. Never set Caveat for paragraphs or ALL CAPS.
	•	Never use red except for error/destructive patterns or negative data.
	•	Prefer white surfaces with platinum borders; keep corners ~1.5rem on key UI.
	•	Add comments requesting a contrast check when introducing new color combos.
	•	Keep decorative icons minimal (≤3 per view).

⸻

11) Conflicts

This file takes precedence. If local code disagrees, update it to match and note brand consistency + accessibility in the PR.
Collapse



