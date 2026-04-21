## ADDED Requirements

### Requirement: Web App Manifest

The application SHALL ship a valid `manifest.webmanifest` linked from `index.html` that declares the app's identity and install behavior.

#### Scenario: Manifest served at root

- **WHEN** a client requests `/manifest.webmanifest` on a production build
- **THEN** the server returns the file with `Content-Type: application/manifest+json`
- **AND** the JSON contains `name: "Industropoly"`, `short_name: "Industropoly"`, `start_url: "/"`, `scope: "/"`, `display: "standalone"`, `orientation: "any"`, `theme_color: "#0F3B3A"`, `background_color: "#F5E9D3"`

#### Scenario: Manifest linked from HTML

- **WHEN** a browser loads `index.html`
- **THEN** the `<head>` contains `<link rel="manifest" href="/manifest.webmanifest">`
- **AND** the `<head>` contains a `<meta name="theme-color" content="#0F3B3A">` tag

### Requirement: Icon Set

The application SHALL provide a full PWA icon set derived from a single source SVG, covering standard, maskable, Apple Touch, and favicon sizes.

#### Scenario: Standard PNG icons present

- **WHEN** the production build completes
- **THEN** `dist/` contains `icon-192.png` (192×192) and `icon-512.png` (512×512)
- **AND** both are referenced in the manifest `icons` array with `purpose: "any"`

#### Scenario: Maskable icon present

- **WHEN** the production build completes
- **THEN** `dist/` contains `icon-maskable-512.png` with the logo confined to the inner 80% safe zone
- **AND** the manifest `icons` array includes it with `purpose: "maskable"`

#### Scenario: Apple Touch Icon and favicon present

- **WHEN** a browser loads `index.html`
- **THEN** the `<head>` contains `<link rel="apple-touch-icon" href="/apple-touch-icon.png">` (180×180)
- **AND** the `<head>` contains `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` for the favicon

#### Scenario: Source SVG committed to repo

- **WHEN** a contributor inspects the repository
- **THEN** `assets/icon/industropoly-icon.svg` exists as the single source of truth for the icon
- **AND** `scripts/generate-icons.ts` can re-render all PNGs from the SVG

### Requirement: Service Worker Registration

The application SHALL register a service worker in production builds that precaches the app shell and runtime-caches large assets, and SHALL NOT register one in development by default.

#### Scenario: Service worker registers in production

- **WHEN** a user loads the production site over HTTPS
- **THEN** `navigator.serviceWorker.controller` becomes non-null within 5 seconds of first load
- **AND** the precache contains the built `index.html`, main JS bundle, and CSS bundle

#### Scenario: Service worker not registered in dev

- **WHEN** a contributor runs `npm run dev` without `VITE_PWA_DEV=1`
- **THEN** no service worker is registered
- **AND** HMR continues to work normally

#### Scenario: Runtime cache for large assets

- **WHEN** a user requests a font, texture, or image under `/assets/`
- **THEN** the service worker serves it via a `CacheFirst` strategy with a configured max-age and entry cap
- **AND** on cache miss the asset is fetched from the network and stored

### Requirement: Offline App Shell

After a first successful online visit, the application SHALL launch and render the intro screen without network connectivity.

#### Scenario: Reload while offline after first visit

- **GIVEN** a user has loaded the production site at least once while online
- **WHEN** the user reloads the page while offline
- **THEN** the app shell renders and the intro screen appears
- **AND** previously cached fonts and images display correctly

#### Scenario: First visit while offline

- **GIVEN** a user has never loaded the site
- **WHEN** the user opens it while offline
- **THEN** the browser's native offline page is shown
- **AND** no stale cache is served

### Requirement: Install Prompt UX

The application SHALL surface an in-app install affordance on the intro screen when the browser supports it, and SHALL NOT surface it when the app is already installed.

#### Scenario: Installable browser shows button

- **GIVEN** the browser fires a `beforeinstallprompt` event
- **WHEN** the intro screen renders
- **THEN** an "Install app" button is visible
- **AND** clicking it calls `.prompt()` on the captured event

#### Scenario: User accepts install

- **WHEN** the user accepts the native install prompt
- **THEN** the "Install app" button is removed from the UI
- **AND** the `beforeinstallprompt` event reference is cleared

#### Scenario: Already installed

- **GIVEN** the app is launched in standalone mode (`display-mode: standalone` or `navigator.standalone === true`)
- **WHEN** the intro screen renders
- **THEN** the "Install app" button is not rendered

#### Scenario: iOS guidance fallback

- **GIVEN** the user agent is iOS Safari and `navigator.standalone === false`
- **WHEN** the user taps an "Add to Home Screen" entry point on the intro screen
- **THEN** a modal is shown with step-by-step Add-to-Home-Screen instructions specific to iOS
- **AND** no `.prompt()` call is attempted

### Requirement: Update Flow

The service worker SHALL use an auto-update strategy that does not interrupt active gameplay, and SHALL inform the user when a new version is available.

#### Scenario: New version ready while playing

- **GIVEN** a user is actively on the game screen
- **WHEN** a new service worker finishes installing and enters the `waiting` state
- **THEN** a non-blocking "New version available — reload" pill appears in the HUD corner
- **AND** the current session is not interrupted

#### Scenario: Auto-update on next launch

- **GIVEN** a waiting service worker exists at app close
- **WHEN** the user re-launches the app
- **THEN** the new service worker takes control within 2 seconds
- **AND** subsequent navigation uses the new bundle
