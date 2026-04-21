import { createRoot } from 'react-dom/client';
import { AppRoot } from './app/AppRoot';
import { SceneErrorBoundary } from './app/SceneErrorBoundary';
import { GlobalErrorOverlay } from './app/GlobalErrorOverlay';
import { installWebglPrecisionShim } from './lib/webglShim';
import { installLogBridge, reportToLogBridge } from './lib/logBridge';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import { usePwaStore } from './pwa/pwaStore';
import './ui/global.css';

installLogBridge();
installWebglPrecisionShim();
reportToLogBridge('info', 'boot', {
  kind: 'boot',
  viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
  coarsePointer: window.matchMedia?.('(pointer: coarse)').matches ?? null,
});

// NOTE: StrictMode intentionally NOT used. React 18 StrictMode double-mounts
// every component in dev, creating two WebGL contexts per <Canvas>. iOS
// Safari/Chrome don't release the first context fast enough, and the second
// nasce em estado degradado (gl.getParameter returns null for everything,
// crashing Three.js init). The double-mount detection of StrictMode is not
// worth the cost on a 3D-heavy app.
const container = document.getElementById('root');
if (!container) throw new Error('#root not found');
createRoot(container).render(
  <SceneErrorBoundary>
    <AppRoot />
    <GlobalErrorOverlay />
  </SceneErrorBoundary>,
);

registerServiceWorker({
  onNeedRefresh: (activate) => usePwaStore.getState().setNeedRefresh(activate),
  onOfflineReady: () => usePwaStore.getState().setOfflineReady(true),
});
