import { useState, useCallback, useRef } from 'react';
import { startARSession, isARSupported } from './ar/ARSession';
import { ARSceneRenderer } from './ar/ARScene';
import terrainLayouts from './data/terrain-layouts';
import LayoutSelector from './components/LayoutSelector';
import ARControls from './components/ARControls';
import type { TerrainLayout } from './types';

type AppState = 'landing' | 'ar-active' | 'error';

export default function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [selectedLayout, setSelectedLayout] = useState<TerrainLayout>(terrainLayouts[0]);
  const [errorMsg, setErrorMsg] = useState('');
  const [layoutIdx, setLayoutIdx] = useState(0);
  const arRendererRef = useRef<ARSceneRenderer | null>(null);
  const sessionRef = useRef<XRSession | null>(null);

  const arSupported = isARSupported();

  const handleStartAR = useCallback(async () => {
    setErrorMsg('');

    // Create canvas for AR
    const canvas = document.createElement('canvas');
    canvas.id = 'ar-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:1;';
    document.body.appendChild(canvas);

    try {
      await startARSession(canvas, {
        onSessionStarted: (session, gl) => {
          sessionRef.current = session;

          const renderer = new ARSceneRenderer(canvas, gl);
          arRendererRef.current = renderer;

          // Create board when session starts (will be positioned on hit)
          const layout = terrainLayouts[layoutIdx];
          renderer.createBoard(
            layout.imagePath,
            { x: 0, y: -1, z: -2 } // Default position, updated on hit test
          );

          session.requestAnimationFrame((_time, frame) => {
            const refSpace = (session as any)._referenceSpace as XRReferenceSpace;
            if (refSpace && renderer) {
              renderer.render(frame, refSpace);
            }
          });

          setAppState('ar-active');
        },
        onSessionEnded: () => {
          canvas.remove();
          arRendererRef.current = null;
          sessionRef.current = null;
          setAppState('landing');
        },
        onError: (err) => {
          canvas.remove();
          setErrorMsg(err.message);
          setAppState('error');
        },
      });
    } catch (err: any) {
      canvas.remove();
      setErrorMsg(err.message || 'Failed to start AR');
      setAppState('error');
    }
  }, [layoutIdx]);

  const handleLayoutChange = useCallback((layout: TerrainLayout, idx: number) => {
    setSelectedLayout(layout);
    setLayoutIdx(idx);

    // Update board texture if in AR
    const renderer = arRendererRef.current;
    if (renderer && appState === 'ar-active') {
      renderer.removeBoard();
      renderer.createBoard(layout.imagePath, { x: 0, y: -1, z: -2 });
    }
  }, [appState]);

  const handleCycleLayout = useCallback((direction: 1 | -1) => {
    const newIdx = (layoutIdx + direction + terrainLayouts.length) % terrainLayouts.length;
    handleLayoutChange(terrainLayouts[newIdx], newIdx);
  }, [layoutIdx, handleLayoutChange]);

  const handleExitAR = useCallback(() => {
    sessionRef.current?.end();
  }, []);

  if (appState === 'error') {
    return (
      <div className="app">
        <div className="error-screen">
          <h1>⚠️ Error</h1>
          <p>{errorMsg}</p>
          <button onClick={() => setAppState('landing')}>Go Back</button>
        </div>
      </div>
    );
  }

  if (appState === 'ar-active') {
    return (
      <div className="app">
        <ARControls
          layoutName={selectedLayout.name}
          layoutIndex={layoutIdx}
          totalLayouts={terrainLayouts.length}
          onPrev={() => handleCycleLayout(-1)}
          onNext={() => handleCycleLayout(1)}
          onExit={handleExitAR}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>WTC Setup Tools</h1>
        <p className="subtitle">AR Terrain Layout Projection — 11th Edition</p>
      </header>

      <main className="main-content">
        <LayoutSelector
          layouts={terrainLayouts}
          selected={selectedLayout}
          onSelect={handleLayoutChange}
        />

        {!arSupported && (
          <div className="warning-box">
            <p>⚠️ AR not supported on this device/browser.</p>
            <p>Open this page in <strong>Safari on iPhone/iPad</strong> to use AR.</p>
          </div>
        )}

        <button
          className="ar-start-btn"
          onClick={handleStartAR}
          disabled={!arSupported}
        >
          {arSupported ? '📷 Start AR' : 'AR Not Available'}
        </button>

        {arSupported && (
          <p className="hint">
            Opens your camera. Point at a table, then tap to place the terrain layout.
          </p>
        )}
      </main>

      <footer className="app-footer">
        <p>WTC 11th Edition · Terrain data from GDM 2026</p>
      </footer>
    </div>
  );
}
