## Goal
Get this TanStack Start app deploying successfully on Vercel.

## Why the current build fails
- `vercel.json` is configured for a **static SPA** (`outputDirectory: dist/client`, catch-all rewrite to `/`). This is wrong for this project — it's a **TanStack Start SSR** app with server functions, a custom `src/server.ts` Worker entry, Supabase auth middleware, and a `nitro` dev dep targeting Cloudflare Workers.
- During Vercel's build, `vite build` runs but fails at the TanStack Router plugin step because the build pipeline is misconfigured for the target. The route-tree error in the screenshot is downstream of that.
- Even if the build succeeded, a static deploy would have **no runtime** for `createServerFn` calls, the Supabase auth middleware, or SSR — the app would white-screen at runtime.

## Heads-up on tradeoffs
This stack (`@lovable.dev/vite-tanstack-config`, `src/server.ts` Worker entry, the SSR error wrapper) is tuned for Lovable's Cloudflare-based hosting. Moving to Vercel means:
- The Lovable preview/published URL on `lovable.app` will keep working — but Vercel becomes a second, parallel deployment you maintain separately.
- Future Lovable template/config updates may need re-merging against the Vercel changes.
- The simpler path remains using Lovable's built-in Publish + custom domain. I'll proceed with Vercel since you asked, but wanted to flag this.

## Plan

### 1. Switch the server target to Vercel
- Replace `src/server.ts` (Cloudflare Worker `export default { fetch }` shape) with a Vercel-compatible Node entry that wraps `@tanstack/react-start/server-entry`.
- Update `vite.config.ts` so `@lovable.dev/vite-tanstack-config` builds for a Node server target instead of Cloudflare Workers (`tanstackStart.server.preset: "vercel"` if supported by the installed plugin version; otherwise drop the custom entry and let TanStack Start's default Vercel preset emit `.vercel/output/`).
- Keep the SSR error capture + `renderErrorPage` wrapper, but adapted to the Node request/response shape.

### 2. Rewrite `vercel.json`
Replace the static-SPA config with one that points Vercel at the TanStack Start build output:
```json
{
  "buildCommand": "bun run build",
  "outputDirectory": ".vercel/output",
  "framework": null
}
```
(Exact shape depends on which preset the plugin emits — Build Output API v3 vs a Node server. I'll confirm by inspecting the plugin and pick the matching config.)

### 3. Environment variables on Vercel (you do this)
In Vercel → Project → Settings → Environment Variables, add (for **Production**, **Preview**, **Development**):
- Client-visible: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
- Server-only: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`

Values for the `VITE_*` vars are already in your `.env`; the service role key and Lovable API key are managed by Lovable Cloud — I'll surface the values you need to copy in.

### 4. Verify
- `bun run build` locally (in Lovable's sandbox) to confirm the build succeeds and emits a Vercel-compatible output dir.
- Confirm route tree generates (the file already exists at `src/routeTree.gen.ts`, so this should resolve once the build pipeline is correct).
- After you redeploy on Vercel, test: `/login` loads, login works (auth middleware), dashboard data fetches (server functions).

## Out of scope
- No changes to UI, routes, auth logic, or Lovable Cloud schema.
- No changes to the Lovable-hosted deployment — it will keep working in parallel.

## Open question before I start
The `@lovable.dev/vite-tanstack-config` plugin (v2.3.2) is opinionated toward Cloudflare. If it doesn't expose a Vercel preset, the cleanest fix is to **replace it** with a vanilla `@tanstack/react-start/plugin` setup configured for Vercel — a larger but more reliable change. I'll inspect the installed plugin first; if no Vercel preset exists, I'll flag it before swapping plugins.
