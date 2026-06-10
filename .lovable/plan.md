## Goal
Make the dashboard and login feel modern and reactive, enlarge the logo, and stop printing "Sri Nagalakshmi Enterprises" as text next to a logo that already shows the name.

## 1. Design tokens (`src/styles.css`)
Extend `:root` with a small token set so the new look uses semantic variables, not hardcoded colors:
- `--brand-glow` — lighter indigo for hover/accents
- `--gradient-brand` — header gradient (deep indigo → violet)
- `--gradient-surface` — subtle page background tint
- `--shadow-elegant`, `--shadow-glow` — for cards / CTAs

## 2. SiteHeader (`src/components/SiteHeader.tsx`)
- Background: `--gradient-brand` instead of flat `bg-brand`, with a soft bottom shadow.
- Logo: bump from `h-12 w-12` → `h-14 w-14` (`h-16 w-16` on `md:`), white rounded tile, subtle ring.
- **Remove the duplicated text block** ("Sri Nagalakshmi Enterprises" + "FMCG Distributor"). Logo alone, with an `aria-label="Sri Nagalakshmi Enterprises"` on the `<Link>` for accessibility.
- Nav links: pill style with smooth `transition-all`, animated underline on hover, active state uses `bg-white/15` + soft glow.
- Logout: ghost button → red tint on hover.

## 3. Login (`src/routes/login.tsx`)
- Page background: `--gradient-surface` with a faint radial blob behind the card.
- Card: `rounded-2xl`, `shadow-elegant`, animated entrance (fade + translate-y on mount via CSS keyframes — no extra deps).
- Logo: bump `h-24 w-24` → `h-32 w-32`, drop the white-tile background so the logo art reads cleanly.
- **Remove the `<h1>Sri Nagalakshmi Enterprises</h1>`** (already in the logo). Keep only the small tagline `"FMCG Distributor — OrderDesk"` as the subtitle.
- Inputs: focus ring uses `--brand-glow`, smoother transitions.
- Sign-in button: gradient fill, hover lifts with `shadow-glow`.

## 4. Dashboard (`src/routes/index.tsx`)
- Header strip with a subtle gradient banner; "Orders Dashboard" title scales up, "+ New Order" becomes a gradient button with hover-lift.
- Stat cards (`StatCard.tsx`): add `hover:-translate-y-1`, `transition-all`, a thin gradient top border, animated number entrance (CSS `animate-in fade-in slide-in-from-bottom-2` from `tw-animate-css` already in project).
- Quick-link cards: hover state grows the icon area, border shifts to brand, soft shadow + slight scale.
- Wrap dashboard background in `bg-[var(--gradient-surface)]`.

## 5. Out of scope
- No changes to data fetching, auth, routing, or other routes (orders/products/settings) in this pass.
- No new dependencies — using existing `tw-animate-css` and Tailwind only.

## Verification
- Visual check at `/login` and `/` in preview at the current viewport (708px) — confirm: logo larger, company name appears once (in the logo only), header has gradient, stat cards lift on hover, sign-in button has gradient + glow.
