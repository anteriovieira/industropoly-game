## 1. Design & export the game icon

- [x] 1.1 Author `assets/icon/industropoly-icon.svg` — factory silhouette with twin smokestacks and gear motif on a deep-teal (#0F3B3A) roundel with a warm-gold (#E2B049) ring; safe zone constrained to inner 80%
- [x] 1.2 Author `assets/icon/industropoly-icon-maskable.svg` variant with extra padding for Android masking
- [x] 1.3 Author `assets/icon/industropoly-favicon.svg` — simplified monochrome-friendly mark for tab favicon
- [x] 1.4 Add `sharp` as a devDependency and create `scripts/generate-icons.ts` that renders `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`, and `public/apple-touch-icon.png` (180×180) from the SVGs
- [x] 1.5 Add an `icons` npm script (`"icons": "tsx scripts/generate-icons.ts"`) and run it to commit the generated PNGs under `public/`
- [x] 1.6 Copy `industropoly-favicon.svg` to `public/favicon.svg`

## 2. Install PWA tooling

- [x] 2.1 Install `vite-plugin-pwa` and `workbox-window` as devDependencies
- [x] 2.2 Update `vite.config.ts` to register `VitePWA` with `registerType: 'autoUpdate'`, `strategies: 'generateSW'`, `devOptions.enabled: process.env.VITE_PWA_DEV === '1'`, and the full manifest object (name, short_name, start_url, scope, display, orientation, theme_color, background_color, icons[])
- [x] 2.3 Configure Workbox: precache the built shell, runtime-cache `/assets/*.{woff2,woff,png,jpg,webp,glb,gltf,ktx2}` with `CacheFirst` (maxEntries 60, maxAgeSeconds 30 days), and bump `maximumFileSizeToCacheInBytes` only if a build warning requires it
- [x] 2.4 Add `VITE_PWA_DISABLE` short-circuit so CI can emit a no-op SW for rollback

## 3. Wire HTML and app shell

- [x] 3.1 Update `index.html` to add `<link rel="manifest">`, `<meta name="theme-color" content="#0F3B3A">`, `<link rel="apple-touch-icon">`, `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`, and Apple `mobile-web-app-capable` / `mobile-web-app-status-bar-style` meta tags
- [x] 3.2 Create `src/pwa/registerServiceWorker.ts` using `workbox-window` that registers the SW only when `import.meta.env.PROD`, exposes `onNeedRefresh` and `onOfflineReady` hooks
- [x] 3.3 Call the registration from `src/main.tsx` after React mounts

## 4. Install prompt UX

- [x] 4.1 Create `src/pwa/useInstallPrompt.ts` — a hook backed by a tiny Zustand slice that captures `beforeinstallprompt`, tracks `isInstalled` via `display-mode: standalone` and `navigator.standalone`, detects iOS Safari, and exposes `{ canInstall, promptInstall, isIOS, isInstalled }`
- [x] 4.2 Create `src/components/InstallButton.tsx` that renders nothing when `isInstalled`, renders the native install button when `canInstall`, and renders an "Add to Home Screen" button that opens an iOS instructions modal when `isIOS`
- [x] 4.3 Create `src/components/IOSInstallModal.tsx` with step-by-step Share → Add to Home Screen guidance
- [x] 4.4 Mount `<InstallButton />` inside `IntroScreen` in a non-intrusive corner
- [x] 4.5 Add an "appinstalled" listener that clears the stored `beforeinstallprompt` reference and hides the button

## 5. Update-available pill

- [x] 5.1 Create `src/components/UpdatePill.tsx` that subscribes to `onNeedRefresh` and shows a dismissible "New version available — reload" chip in a HUD corner
- [x] 5.2 Mount it at the app root so it's visible on every screen without blocking play
- [x] 5.3 On click, call `workbox.messageSkipWaiting()` and reload

## 6. Tests & verification

- [x] 6.1 Add a Vitest unit test for `useInstallPrompt` covering: capture event → `canInstall === true`; after accept → `canInstall === false`; iOS UA → `isIOS === true`
- [x] 6.2 Add a Playwright E2E that runs `npm run build && npm run preview`, asserts `/manifest.webmanifest` is served with correct content-type and required fields, and asserts the icons resolve
- [x] 6.3 Add a Playwright E2E that simulates offline reload after first visit and asserts the intro screen renders
- [ ] 6.4 Manually verify Lighthouse "Installable" passes on a production preview build (pending human verification)

## 7. Docs & cleanup

- [x] 7.1 Update `README.md` with a "Progressive Web App" section covering install flow, iOS behavior, offline scope, `VITE_PWA_DEV` / `VITE_PWA_DISABLE` env vars, and how to regenerate icons
- [x] 7.2 Add a `.gitattributes` entry (if needed) to mark generated PNG icons as binary and note in README that they are regenerated from the SVG sources
- [x] 7.3 Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and confirm green (lint is broken pre-existing — eslint v9 config missing in repo; typecheck/test/build all pass; PWA Playwright specs pass)
