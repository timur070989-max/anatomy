import { useState, useRef } from 'react';

export default function Schema2DViewer({
  src,
  title,
  labels = [],
  activeLabel,
  onSelectLabel,
  height = 400,
}) {
  const containerRef = useRef(null);
  const [hoveredLabel, setHoveredLabel] = useState(null);
  const [cursorPos, setCursorPos] = useState(null);

  function handlePointerMove(e) {
    const container = containerRef.current;
    if (!container || labels.length === 0) return;

    const rect = container.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    // Check proximity to any label (within 12% distance radius)
    let closest = null;
    let minDist = Infinity;

    labels.forEach((l) => {
      const dx = l.x - xPct;
      const dy = l.y - yPct;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist && dist < 12) {
        minDist = dist;
        closest = l;
      }
    });

    setHoveredLabel(closest);
  }

  function handlePointerLeave() {
    setHoveredLabel(null);
    setCursorPos(null);
  }

  if (!src) {
    return (
      <div className="schema-2d-empty" style={{ height: `${height}px` }}>
        <p>Анатомическая 2D-схема подготавливается</p>
      </div>
    );
  }

  return (
    <div className="schema-2d-wrapper">
      {/* 2D Image Viewport with interactive hover markers */}
      <div
        ref={containerRef}
        className="schema-2d-viewport"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{ height: `${height}px` }}
      >
        <img
          src={src}
          alt={title || 'Анатомическая 2D схема'}
          className="schema-2d-image"
        />

        {/* Hotspot Markers placed at exact anatomical coordinates */}
        {labels.map((l, i) => {
          const isActive = (activeLabel && activeLabel.text === l.text) || (hoveredLabel && hoveredLabel.text === l.text);
          return (
            <button
              key={i}
              type="button"
              className={`schema-2d-marker ${isActive ? 'active' : ''}`}
              style={{ left: `${l.x}%`, top: `${l.y}%` }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectLabel?.(l);
              }}
              onPointerEnter={() => setHoveredLabel(l)}
              onPointerLeave={() => setHoveredLabel(null)}
              title={l.text}
            >
              <span className="marker-index">{i + 1}</span>
              <span className="marker-tooltip">{l.text}</span>
            </button>
          );
        })}

        {/* Dynamic Cursor Floating Tooltip */}
        {hoveredLabel && cursorPos && (
          <div
            className="schema-2d-cursor-tooltip"
            style={{
              left: `${cursorPos.x + 14}px`,
              top: `${cursorPos.y + 14}px`,
            }}
          >
            <span className="tooltip-dot" />
            <span className="tooltip-text">{hoveredLabel.text}</span>
          </div>
        )}

        {/* Bottom bar indicator */}
        <div className="schema-2d-hint">
          <span>💡 Наведите курсор на участок схемы для отображения названия структуры</span>
        </div>
      </div>

      {/* Structure Chips List below the 2D diagram */}
      {labels.length > 0 && (
        <div className="schema-2d-chips-panel">
          <div className="schema-chips-header">
            <span>Анатомические структуры ({labels.length} зон):</span>
          </div>
          <div className="schema-chips-list">
            {labels.map((l, i) => {
              const isActive = (activeLabel && activeLabel.text === l.text) || (hoveredLabel && hoveredLabel.text === l.text);
              return (
                <button
                  key={i}
                  type="button"
                  className={`schema-chip ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectLabel?.(l)}
                  onPointerEnter={() => setHoveredLabel(l)}
                  onPointerLeave={() => setHoveredLabel(null)}
                >
                  <span className="chip-num">{i + 1}</span>
                  <span className="chip-title">{l.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
