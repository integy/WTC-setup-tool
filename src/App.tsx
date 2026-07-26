import { useState, useCallback, useRef, useEffect } from 'react';
import { startARSession } from './ar/ARSession';
import { ARSceneRenderer } from './ar/ARScene';
import terrainLayouts from './data/terrain-layouts';
import LayoutSelector from './components/LayoutSelector';
import ARControls from './components/ARControls';
import type { TerrainLayout } from './types';

type AppState = 'landing' | 'ar-active' | 'error';

function getDebugInfo(): string[] {
  const info: string[] = [];
  info.push(`navigator.xr: ${!!(navigator as any).xr}`);
  info.push(`isSecureContext: ${window.isSecureContext}`);
  info.push(`userAgent: ${navigator.userAgent.substring(0, 90)}`);
  return info;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [selectedLayout, setSelectedLayout] = useState<TerrainLayout>(terrainLayouts[0]);
  const [errorMsg, setErrorMsg] = useState('');
  const [layoutIdx, setLayoutIdx] = useState(0);
  const arRendererRef = useRef<ARSceneRenderer | null>(null);
  const sessionRef = useRef<XRSession | null>(null);

  const [debugInfo] = useState<string[]>(getDebugInfo);

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

        <button
          className="ar-start-btn"
          onClick={handleStartAR}
        >
          📷 Start AR
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#888', lineHeight: 1.5 }}>
          Requires <strong>Safari on iPhone/iPad</strong>.<br />
          Make sure <strong>WebXR</strong> is enabled in:<br />
          Settings → Safari → Advanced → Feature Flags → WebXR
        </p>
      </main>

      {debugInfo.length > 0 && (
        <div style={{
          marginTop: 8, padding: 10, background: '#111', borderRadius: 8,
          fontSize: 11, fontFamily: 'monospace', color: '#0f0', lineHeight: 1.6,
          wordBreak: 'break-all'
        }}>
          {debugInfo.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}

      <footer className="app-footer">
        <p>WTC 11th Edition · Terrain data from GDM 2026</p>
      </footer>
    </div>
  );
}
