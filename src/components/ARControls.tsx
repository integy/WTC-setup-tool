interface Props {
  layoutName: string;
  layoutIndex: number;
  totalLayouts: number;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
}

export default function ARControls({
  layoutName,
  layoutIndex,
  totalLayouts,
  onPrev,
  onNext,
  onExit,
}: Props) {
  return (
    <div className="ar-overlay">
      <div className="ar-top-bar">
        <span className="ar-title">WTC Setup Tools</span>
        <button className="ar-exit-btn" onClick={onExit}>
          ✕ Exit AR
        </button>
      </div>

      <div className="ar-bottom-bar">
        <div className="ar-layout-info">
          <span className="ar-layout-name">{layoutName}</span>
          <span className="ar-layout-count">
            {layoutIndex + 1} / {totalLayouts}
          </span>
        </div>

        <div className="ar-layout-nav">
          <button className="ar-nav-btn" onClick={onPrev}>
            ◀ Prev
          </button>
          <button className="ar-nav-btn" onClick={onNext}>
            Next ▶
          </button>
        </div>
      </div>
    </div>
  );
}
