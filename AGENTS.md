# Venrate - Venezuelan Exchange Rate Monitor

## Tech Stack
- React 19 + Vite + Tailwind CSS 4 (PWA)
- Express backend (API + serving SPA)
- Deployed on Railway: https://venrate-production.up.railway.app
- Uptime monitoring via Healthchecks.io

## Developer Commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (tsx server.ts) |
| `npm run build` | Vite build + esbuild server.ts |
| `npm run start` | Production server (node dist/server.cjs) |
| `npm run lint` | TypeScript type check (tsc --noEmit) |
| `npm run clean` | Remove dist/ |

## Architecture Notes
- **Backend**: Express serves SPA from `dist/` + `/api/rates` endpoint
- **API Cache**: 5-minute in-memory cache to avoid hammering external APIs
- **PWA**: vite-plugin-pwa with autoUpdate; workbox precaches all assets
- **Code Splitting**: React.lazy() for all tabs (Dashboard, History, Alerts, Settings)
- **Error Boundary**: react-error-boundary wraps `<App />` in main.tsx

## Critical Gotchas

### Lazy Loading with Named Exports
React.lazy() requires default exports. Components use named exports, so imports in App.tsx must map:
```tsx
const DashboardTab = lazy(() => import('./components/DashboardTab').then(m => ({ default: m.DashboardTab })));
```
Without this, `resolveLazy` in react-dom throws `Cannot convert object to primitive value`.

### Package Manager
- Use **npm only** - `bun.lock` is in .gitignore
- Railway detects `bun.lock` and runs `bun install --frozen-lockfile`, which fails when lockfile is out of sync with package.json

### Railway Deploy
- PORT env var: `parseInt(process.env.PORT || '3000', 10)` in server.ts
- GitHub repo connected for auto-deploy on push to main
- To deploy via CLI (without GitHub): `railway up --detach --service venrate`
- Delete duplicate services: `railway service delete --service <SERVICE_ID> --yes`

### Server Config
- Helmet CSP disabled: `contentSecurityPolicy: false`
- Rate limit: 30 req/min on `/api/`

## Deployment Workflow
1. `npm run lint` before committing
2. `git add . && git commit -m "msg"`
3. `git push origin main` → Railway auto-deploys
4. Verify: `railway status`
5. If auto-deploy fails: `railway up --detach --service venrate`
