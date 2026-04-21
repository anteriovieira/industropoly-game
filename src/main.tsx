import { createRoot } from 'react-dom/client';
import { AppRoot } from './app/AppRoot';
import { SceneErrorBoundary } from './app/SceneErrorBoundary';
import { GlobalErrorOverlay } from './app/GlobalErrorOverlay';
import { installWebglPrecisionShim } from './lib/webglShim';
import './ui/global.css';

installWebglPrecisionShim();

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
