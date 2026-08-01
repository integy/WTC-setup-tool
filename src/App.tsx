import { useState, useCallback } from 'react';
import terrainLayouts from './data/terrain-layouts';
import LayoutSelector from './components/LayoutSelector';
import type { TerrainLayout } from './types';
import { FD_SHORT } from './types';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string; alt?: string; 'camera-controls'?: string;
          'touch-action'?: string; poster?: string; 'shadow-intensity'?: string;
          style?: React.CSSProperties;
        }, HTMLElement>;
    }
  }
}

export default function App() {
  const [selectedLayout, setSelectedLayout] = useState<TerrainLayout>(terrainLayouts[0]);
  const [layoutIdx, setLayoutIdx] = useState(0);

  const handleLayoutChange = useCallback((layout: TerrainLayout, idx: number) => {
    setSelectedLayout(layout);
    setLayoutIdx(idx);
  }, []);

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

        {/* 3D preview */}
        <model-viewer
          src={selectedLayout.glbPath}
          alt={selectedLayout.name}
          camera-controls
          touch-action="pan-y"
          poster={selectedLayout.imagePath}
          shadow-intensity="0"
          style={{
            width: '100%', height: 240, borderRadius: 8,
            background: '#0f0f1a', border: '2px solid #333',
          }}
        />

        {/* AR Quick Look — direct USDZ link */}
        <a href={selectedLayout.usdzPath} rel="ar" className="ar-start-btn"
          style={{ display: 'block', textDecoration: 'none' }}>
          📷 View in AR
        </a>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#888', lineHeight: 1.5 }}>
          {selectedLayout.name} · {FD_SHORT[selectedLayout.fd]} · #{selectedLayout.layoutNumber}
        </p>
      </main>

      <footer className="app-footer">
        <p>WTC 11th Edition · GDM 2026 · {layoutIdx + 1}/{terrainLayouts.length}</p>
      </footer>
    </div>
  );
}
