## Why

Industropoly is currently only accessible via a browser tab, which creates friction for repeated play and limits reach on tablets and phones where kids and classrooms naturally reach for home-screen apps. Shipping it as an installable Progressive Web App lets players add it to their device like a native game, launch it full-screen without browser chrome, and recognize it by a distinctive icon on their home screen.

## What Changes

- Add a Web App Manifest (`manifest.webmanifest`) declaring the app name, short name, theme/background colors, display mode (`standalone`), orientation, and start URL.
- Generate a distinctive game icon (Industropoly industrial-revolution visual identity) and export it as the full PWA icon set: 192×192, 512×512, a maskable variant, an Apple Touch Icon (180×180), and a favicon.
- Register a service worker to cache the app shell and built assets so the game launches offline after first visit (the 3D board, textures, fonts, and audio remain available on subsequent loads).
- Wire the manifest, icons, and service worker into `index.html` (link tags, theme-color meta, apple-mobile-web-app tags) and Vite's build pipeline.
- Add an in-app install affordance: a subtle "Install" button on the intro screen that appears once `beforeinstallprompt` fires and disappears after acceptance or on iOS (where it shows iOS-specific Add-to-Home-Screen guidance instead).
- Document PWA behavior (install flow, offline scope, cache versioning) in the README.

## Capabilities

### New Capabilities
- `pwa-install`: Installability contract — manifest, icons, service worker registration, offline app shell, install-prompt UX, and iOS fallback guidance.

### Modified Capabilities
<!-- None: no existing spec requirements change. -->

## Impact

- **Code**: `index.html` (manifest + icon + meta tags), `src/main.tsx` (service worker registration), new `src/pwa/` module for install-prompt state and UI, new `src/components/InstallButton.tsx` surfaced inside `IntroScreen`, `vite.config.ts` (PWA plugin wiring).
- **Assets**: New `public/icon-*.png`, `public/apple-touch-icon.png`, `public/favicon.svg`, `public/manifest.webmanifest`, plus a source SVG for the icon kept in-repo for future re-exports.
- **Dependencies**: Add `vite-plugin-pwa` (and transitively `workbox-window`) to manage manifest + service worker generation during `vite build`.
- **Build/CI**: `npm run build` output now includes the manifest, hashed service worker, and precache manifest; `dist/` size grows by the icon set (~tens of KB).
- **Runtime**: Service worker caches the built shell; dev mode remains non-SW by default to avoid confusing hot-reload behavior.
- **Non-goals**: No push notifications, no background sync, no multiplayer sync, no native app store submission.
