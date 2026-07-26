import { FD_SHORT } from '../types';
import type { TerrainLayout, ForceDisposition } from '../types';

interface Props {
  layouts: TerrainLayout[];
  selected: TerrainLayout;
  onSelect: (layout: TerrainLayout, index: number) => void;
}

const FD_COLORS: Record<ForceDisposition, string> = {
  'take-and-hold': '#00d4ff',
  'purge-the-foe': '#DE2910',
  'reconnaissance': '#4caf50',
  'priority-assets': '#FFDE00',
  'disruption': '#e040fb',
};

export default function LayoutSelector({ layouts, selected, onSelect }: Props) {
  return (
    <div className="layout-selector">
      {layouts.map((layout, idx) => (
        <button
          key={layout.id}
          className={`layout-card ${layout.id === selected.id ? 'selected' : ''}`}
          onClick={() => onSelect(layout, idx)}
          style={{
            borderColor: layout.id === selected.id ? FD_COLORS[layout.fd] : 'transparent',
          }}
        >
          <span
            className="fd-badge"
            style={{ background: FD_COLORS[layout.fd] }}
          >
            {FD_SHORT[layout.fd]}
          </span>
          <span className="layout-name">
            {layout.fd === 'take-and-hold' ? 'Take & Hold' : FD_SHORT[layout.fd]}
            {' · '}
            #{layout.layoutNumber}
          </span>
        </button>
      ))}
    </div>
  );
}
