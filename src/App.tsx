import { useState, useCallback } from 'react';
import terrainLayouts from './data/terrain-layouts';
import LayoutSelector from './components/LayoutSelector';
import type { TerrainLayout } from './types';
import { FD_SHORT } from './types';

// Type declaration for model-viewer web component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          ar?: string;
          'ar-modes'?: string;
          'camera-controls'?: string;
          'touch-action'?: string;
          poster?: string;
          'shadow-intensity'?: string;
          'environment-image'?: string;
          exposure?: string;
          style?: React.CSSProperties;
        },
        HTMLElement
      >;
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

        {/* 3D preview with model-viewer */}
        <model-viewer
          src={selectedLayout.glbPath}
          alt={selectedLayout.name}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          touch-action="pan-y"
          poster={selectedLayout.imagePath}
          shadow-intensity="0"
          exposure="1"
          style={{
            width: '100%',
            height: 280,
            borderRadius: 8,
            background: '#0f0f1a',
            border: '2px solid #333',
          }}
        />

        <p style={{ textAlign: 'center', fontSize: 12, color: '#888', lineHeight: 1.5 }}>
          {selectedLayout.name} · {FD_SHORT[selectedLayout.fd]} · Layout #{selectedLayout.layoutNumber}
          <br />
          Tap the <strong>AR icon</strong> (cube) in the 3D viewer to place on your table.
        </p>
      </main>

      <footer className="app-footer">
        <p>WTC 11th Edition · Terrain data from GDM 2026 · {layoutIdx + 1}/{terrainLayouts.length}</p>
      </footer>
    </div>
  );
}
