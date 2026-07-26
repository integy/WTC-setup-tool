import { useState, useCallback } from 'react';
import terrainLayouts from './data/terrain-layouts';
import LayoutSelector from './components/LayoutSelector';
import type { TerrainLayout } from './types';
import { FD_SHORT } from './types';
import type { ForceDisposition } from './types';

export default function App() {
  const [selectedLayout, setSelectedLayout] = useState<TerrainLayout>(terrainLayouts[0]);
  const [layoutIdx, setLayoutIdx] = useState(0);

  const handleLayoutChange = useCallback((layout: TerrainLayout, idx: number) => {
    setSelectedLayout(layout);
    setLayoutIdx(idx);
  }, []);

  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

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

        {/* AR Quick Look button for iOS */}
        <a
          href={selectedLayout.usdzPath}
          rel="ar"
          className="ar-start-btn"
          style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}
        >
          📷 View in AR
        </a>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#888', lineHeight: 1.5 }}>
          {isIOS ? (
            <>Opens <strong>AR Quick Look</strong> — place the terrain board in your real space.</>
          ) : (
            <>Best experienced on <strong>iPhone/iPad Safari</strong> with AR Quick Look.</>
          )}
        </p>

        {/* Debug: test solid color plane */}
        <div style={{ marginTop: 4, textAlign: 'center' }}>
          <a href="usdz/_test_red.usdz" rel="ar" style={{ fontSize: 12, color: '#FFDE00' }}>
            🔴 Test: solid red plane
          </a>
        </div>

        {/* Layout preview image */}
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <img
            src={selectedLayout.imagePath}
            alt={selectedLayout.name}
            style={{
              maxWidth: '100%',
              maxHeight: 300,
              borderRadius: 8,
              border: '2px solid #333',
            }}
          />
          <p style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
            {selectedLayout.name} · {FD_SHORT[selectedLayout.fd]} · Layout #{selectedLayout.layoutNumber}
          </p>
        </div>
      </main>

      <footer className="app-footer">
        <p>WTC 11th Edition · Terrain data from GDM 2026 · {layoutIdx + 1}/{terrainLayouts.length}</p>
      </footer>
    </div>
  );
}
