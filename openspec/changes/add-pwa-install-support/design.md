## Context

Industropoly is a Vite + React + three.js single-page app with a statically hostable `dist/` output. It has no backend, no auth, and no service worker today. The entrypoint is `index.html` → `src/main.tsx`, assets live in `public/` (currently empty), and 3D assets/fonts are pulled in at runtime. Players primarily access the game on desktops (classroom) and iPads; an installable PWA lets teachers add it to a home screen and launch it distraction-free, and keeps it playable after the first load even on shaky classroom wifi.

The Industropoly brand leans into Industrial-Revolution iconography (smokestacks, gears, Victorian typography via `@fontsource/im-fell-english`). The icon must be recognizable at 48 px and still read well at 512 px, and must survive masking on Android (safe zone).

## Goals / Non-Goals

**Goals:**
- `npm run build` produces a Lighthouse-installable PWA: valid manifest, 192/512 icons, HTTPS-ready, start URL responds offline.
- Players see an "Install" affordance on the intro screen when the browser allows it; iOS gets tailored guidance.
- Game shell and previously loaded static assets launch offline after first successful visit.
- A distinctive Industropoly game icon exists as a source SVG and exported PNG set (maskable + apple-touch + favicon).
- No regressions to `npm run dev` ergonomics (HMR stays fast, no stale service-worker caches during development).

**Non-Goals:**
- Push notifications, Background Sync, Web Share Target, or protocol handlers.
- App-store (Play/App Store) packaging via TWA/PWABuilder.
- Offline-first for dynamic gameplay state persistence beyond what the game already stores.
- Multi-language manifest variants.
- Server-rendered install landing page.

## Decisions

### Decision: Use `vite-plugin-pwa` with Workbox (generateSW strategy)
**Rationale:** It integrates cleanly with Vite's build, emits the manifest, precaches hashed build assets automatically, and supports dev-mode toggling. Hand-rolling a service worker adds maintenance cost (hash-busting, precache manifest) for no benefit here.
**Alternatives considered:**
- Hand-written service worker + manual `manifest.webmanifest`: more code, easy to drift from asset hashes.
- `@remix-pwa/*`: tied to Remix conventions, overkill.

### Decision: `generateSW` with `registerType: 'autoUpdate'` and a skip-waiting + clients-claim flow
**Rationale:** Classroom/kiosk use wants the latest version immediately. We show a small in-app "New version available — reload" pill on `needRefresh` so an active game isn't yanked mid-turn, but default to auto-updating on next launch.
**Alternatives considered:** `prompt` mode (forces user click every time, annoying for teachers); purely silent auto-refresh (can interrupt gameplay).

### Decision: Precache the app shell only; runtime-cache 3D/texture/font assets
**Rationale:** three.js textures, GLTFs, and fonts are large. Precaching everything bloats the install and wastes quota. Use Workbox `CacheFirst` for fonts and images under `/assets/` with a size/age cap, and `StaleWhileRevalidate` for the HTML shell.
**Alternatives considered:** Precache everything (too heavy), no runtime cache (breaks offline for assets loaded lazily).

### Decision: Install UX — `beforeinstallprompt` capture + intro-screen button, iOS fallback modal
**Rationale:** Chrome/Edge/Android fire `beforeinstallprompt`; we stash the event in a Zustand slice and surface an "Install app" button on `IntroScreen`. Safari/iOS never fire the event, so we detect iOS Safari via UA + `navigator.standalone` and show a small "Add to Home Screen" instructions modal instead. Hide the button entirely when `display-mode: standalone` matches (already installed).
**Alternatives considered:** Always-visible button (misleading on unsupported browsers); no UI at all (relies on browser's address-bar prompt which desktop users miss).

### Decision: Icon generation — one source SVG, exported via a repo script
**Rationale:** Keep `assets/icon/industropoly-icon.svg` (designed here) as the single source of truth; a `scripts/generate-icons.ts` script (using `sharp`) renders the PNG set on demand and on CI if we want. For now we commit the rendered PNGs so the app works without running the script. Design: a stylized red-brick factory silhouette with two smokestacks emitting a curled gear motif, set on a deep-teal (#0F3B3A) roundel with a warm-gold (#E2B049) ring — readable at 48 px, survives the Android maskable safe zone (inner 80% of the canvas).
**Alternatives considered:** Pure text mark "I" (looks generic); photo-realistic factory (unreadable at small sizes); relying on a service like realfavicongenerator (external dependency, not repo-reproducible).

### Decision: Dev-mode service worker stays OFF by default
**Rationale:** `vite-plugin-pwa` with `devOptions.enabled: false` avoids stale caches during development. We gate it behind `VITE_PWA_DEV=1` for contributors who want to test install locally.
**Alternatives considered:** Always-on dev SW (breaks HMR for styles/textures); never-on (can't smoke-test install without a full `preview`).

### Decision: Manifest `display: 'standalone'`, `orientation: 'any'`, `theme_color: '#0F3B3A'`, `background_color: '#F5E9D3'`
**Rationale:** Standalone hides browser chrome (feels native). `any` orientation because the board is playable in landscape on tablets and portrait on phones. Theme color matches the in-game HUD; background color matches the intro parchment so the splash transitions smoothly.

## Risks / Trade-offs

- **[iOS Safari limitations]** → `beforeinstallprompt` doesn't fire; mitigate with explicit Add-to-Home-Screen guidance modal detecting iOS UA and `navigator.standalone === false`.
- **[Service-worker cache staleness after big three.js asset updates]** → Use `registerType: 'autoUpdate'` + versioned precache manifest; bump a `CACHE_VERSION` constant when we intentionally want to blow away runtime caches.
- **[Dev-mode confusion if SW is accidentally registered]** → Only register in production (`import.meta.env.PROD`), and document `chrome://serviceworker-internals` cleanup in README.
- **[Install button shown redundantly when already installed]** → Check `window.matchMedia('(display-mode: standalone)')` and `navigator.standalone` before rendering.
- **[Icon misreads when Android masks it to a circle/squircle]** → Export a dedicated maskable icon with the logo confined to the inner 80% safe zone.
- **[Large precache blowing past Workbox default 2 MB file limit]** → Raise `maximumFileSizeToCacheInBytes` only if needed; prefer runtime caching for big GLB/PNG assets.
- **[Offline gameplay partially broken]** → Accept that first-visit-while-offline shows the browser's offline page; document that install/offline requires one successful online load.

## Migration Plan

1. Land change behind build step only — no server changes needed since app is statically hosted.
2. Deploy to staging, verify Lighthouse PWA score and install flow on Chrome/Android and the iOS guidance modal on Safari.
3. Roll to production; monitor first-week error logs (service-worker registration failures).
4. **Rollback:** Set `VITE_PWA_DISABLE=1` (short-circuits plugin) and ship a build — existing installs will pick up a new no-op SW that unregisters itself.

## Open Questions

- Should the install button also appear on the in-game HUD, or only on the intro screen? Default: intro screen only to avoid distraction during play.
- Do we want per-locale manifest names for a future pt-BR variant? Defer until i18n lands.
