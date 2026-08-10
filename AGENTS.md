# Venrate - Venezuelan Exchange Rate Monitor

## Tech Stack
- React 19 + Vite + Tailwind CSS 4 (PWA)
- Express backend (API + serving SPA)
- Deployed on Railway: https://venrate-production.up.railway.app
- Animation library: `motion` v12 (import from `motion/react`)

## Commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (tsx server.ts → Express + Vite middleware) |
| `npm run build` | Vite build + esbuild server.ts |
| `npm run start` | Production server (node dist/server.cjs) |
| `npm run lint` | TS type check (tsc --noEmit) |
| `npm run clean` | Remove dist/ |

## Architecture
- **Backend**: Express serves SPA from `dist/` + `/api/rates` endpoint. 5-min in-memory cache, 30 req/min rate limit, Helmet CSP disabled.
- **PWA**: vite-plugin-pwa with autoUpdate; workbox precaches all assets + NetworkFirst for `/api/`
- **Code Splitting**: `React.lazy()` for all tabs. Named exports require the `.then(m => ({ default: m.X }))` wrapper.
- **Error Boundary**: `react-error-boundary` wraps `<App />` in `main.tsx`
- **File tree**: `src/App.tsx` (state hub), `src/components/` (tabs + shared), `src/lib/notifications.ts` (native browser notifications), `src/constants.ts`, `src/types.ts`

## Design System (Aurora Night)
- **Theme tokens** use Tailwind 4 `@theme` CSS variables. Always use semantic classes:
  - Text: `text-on-surface` (NOT `text-white` — breaks light mode)
  - Accents: `text-primary` / `text-secondary` / `text-tertiary` / `text-success` / `text-warning` / `text-error`
  - Borders: `border-primary/20`, `border-secondary/20`, etc.
  - Backgrounds: `bg-primary/10`, `bg-secondary/10`, etc.
- **Glass utilities**: `glass`, `glass-strong`, `glass-card` (defined in `index.css`). Use `glass-card` for content panels.
- **Fonts**: `font-display` (Space Grotesk) for headings, `font-mono` (JetBrains Mono) for data, `font-sans` (Inter) for body.
- **Dark/light**: `html.dark` (default) / `html.light` toggle via `App.tsx`. CSS token overrides in `html.light { … }` block.
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` disables all animations + hides aurora orbs.

## Animation Conventions
- Page transitions: `AnimatePresence mode="wait"` in `App.tsx`, keyed on `activeTab`. Fade + slide + scale (0.35s).
- `layoutId` morphing: bottom nav pill (`nav-pill`), timeframe slider (`time-pill`), spread/forecast tabs (`analysis-pill`).
- Staggered entrance: each tab uses `containerVariants` + `itemVariants` (spring, stagger 0.07–0.08s).
- Toasts: spring entrance + exit, progress bar animation via `motion.div width 100%→0%` over `TOAST_DURATION`.
- `Background` component: fixed `-z-10`, pointer-events-none, aurora orbs with CSS keyframe drift.

## State Persistence (localStorage)
| Key | Type | Set in |
|-----|------|--------|
| `venrate-alerts` | `PriceAlert[]` | Load on mount, save on every change |
| `venrate-intelligent-alerts` | `IntelligentAlerts` | Load on mount, save on every change |
| `isCompactView` | boolean | Already persisted |
| `isEqualizedToBcv` | boolean | Already persisted |

Reset via Settings → "Reiniciar Alertas por Defecto" (sets defaults, persistence effect re-saves them).

## Components with Quirks
- **`AnimatedNumber`**: Spring count-up using `motion/react` `useMotionValue` + `useSpring` + `useTransform`. Requires `value` prop to change for re-animation.
- **`DashboardTab`**: Calculator swap button rotates 180° (spring). Hero rate flashes green/red on API update (ref comparison). Spread gauge bar animates via `motion.div left` with spring.
- **`HistoryTab`**: Chart uses Recharts `AreaChart`. Mock data scaled to live rates via ratio. `animationDuration` per series for staggered draw.
- **`AlertsTab`**: Form disables button during `isSubmitting` and `submitted` states (2s cooldown). Validation error shows inline `motion.p`.
- **`BottomNavBar`**: Floating pill container (`glass-strong rounded-3xl`). Active indicator uses `layoutId="nav-pill"` (spring stiffness 380, damping 28).
- **`TopAppBar`**: Scroll-aware elevation (`glass-strong` or transparent). Live pulse dot with CSS `animate-ping`. Refresh spinner uses `motion.div rotate 360 infinite linear`.

## Critical Gotchas

### Lazy Loading with Named Exports
React.lazy() requires default exports. Components use named exports:
```tsx
const DashboardTab = lazy(() => import('./components/DashboardTab').then(m => ({ default: m.DashboardTab })));
```

### Light Mode
Never use hardcoded `text-white` or `text-[#eaecfa]`. Use `text-on-surface`. Never use `text-cyan-400`/`text-violet-400`/etc — use `text-primary`/`text-secondary` tokens so they adapt to light mode.

### Package Manager
- Use **npm only**. `bun.lock` is gitignored. Railway detects `bun.lock` and fails.

### Railway Deploy
- GitHub auto-deploys on push to main. CLI deploy: `railway up --detach --service venrate`
- Two services exist: `venrate` and `Venrate`. The active one for CLI deploys is `venrate`.
- PORT env var: `parseInt(process.env.PORT || '3000', 10)`

### No Test Framework
Verify changes with `npm run lint && npm run build` then manual browser check.
