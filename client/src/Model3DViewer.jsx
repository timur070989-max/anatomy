import { useEffect, useRef, useState } from 'react';

export default function Model3DViewer({
  src,
  hotspots = [],
  editable = false,
  onSurfaceClick,
  onHotspotClick,
  height = 400,
  isAnimatedVideo = false,
}) {
  const ref = useRef(null);
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [hoveredStructure, setHoveredStructure] = useState(null);

  // View modes
  const [autoRotate, setAutoRotate] = useState(true);
  const [highlightLayer, setHighlightLayer] = useState('all');

  // Dynamically detected anatomical layers in the loaded 3D model
  const [availableLayers, setAvailableLayers] = useState({
    vessels: false,
    nerves: false,
    ducts: false,
  });

  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    setActiveHotspot(null);
    setHoveredStructure(null);
    setHighlightLayer('all');
    setAvailableLayers({ vessels: false, nerves: false, ducts: false });
  }, [src]);

  // Apply colors and transparency based on active layer
  function applyAnatomicalMaterials(el, layer) {
    if (!el) return;
    try {
      const model = el.model;
      if (!model || !model.materials || model.materials.length === 0) return;

      const srcLower = (src || '').toLowerCase();
      let defaultColor = [0.78, 0.45, 0.42, 1.0];
      let defaultRoughness = 0.38;

      if (srcLower.includes('heart')) {
        defaultColor = [0.78, 0.14, 0.16, 1.0];
        defaultRoughness = 0.32;
      } else if (srcLower.includes('liver')) {
        defaultColor = [0.62, 0.22, 0.18, 1.0];
        defaultRoughness = 0.35;
      } else if (srcLower.includes('stomach')) {
        defaultColor = [0.82, 0.48, 0.44, 1.0];
        defaultRoughness = 0.38;
      } else if (srcLower.includes('kidney')) {
        defaultColor = [0.54, 0.16, 0.14, 1.0];
        defaultRoughness = 0.34;
      } else if (srcLower.includes('pancreas')) {
        defaultColor = [0.85, 0.66, 0.36, 1.0];
        defaultRoughness = 0.48;
      } else if (srcLower.includes('lung') || srcLower.includes('trachea')) {
        defaultColor = [0.88, 0.52, 0.56, 1.0];
        defaultRoughness = 0.42;
      } else if (srcLower.includes('skeleton')) {
        defaultColor = [0.94, 0.92, 0.86, 1.0];
        defaultRoughness = 0.48;
      } else if (srcLower.includes('ear')) {
        defaultColor = [0.88, 0.72, 0.65, 1.0];
        defaultRoughness = 0.40;
      } else if (srcLower.includes('bladder')) {
        defaultColor = [0.88, 0.52, 0.40, 1.0];
        defaultRoughness = 0.38;
      } else if (srcLower.includes('intestine')) {
        defaultColor = [0.82, 0.58, 0.46, 1.0];
        defaultRoughness = 0.42;
      } else if (srcLower.includes('brain')) {
        defaultColor = [0.80, 0.50, 0.46, 1.0];
        defaultRoughness = 0.45;
      }

      model.materials.forEach((mat) => {
        const name = (mat.name || '').toLowerCase();
        const isArtery = name.includes('artery') || name.includes('carotid') || name.includes('basilar') || name.includes('pericallosal');
        const isVein = name.includes('sinus') || name.includes('vein');
        const isNerve = name.includes('nerve') || name.includes('fiber') || name.includes('tract') || name.includes('nucleus') || name.includes('ganglion');
        const isDuct = name.includes('duct') || name.includes('lcr') || name.includes('choroid') || name.includes('ventricle') || name.includes('bile') || name.includes('pancreat') || name.includes('ureter');

        if (mat.pbrMetallicRoughness) {
          if (layer === 'vessels') {
            if (isArtery) {
              if (mat.setAlphaMode) mat.setAlphaMode('OPAQUE');
              mat.pbrMetallicRoughness.setBaseColorFactor([0.96, 0.08, 0.16, 1.0]);
              mat.pbrMetallicRoughness.setRoughnessFactor(0.2);
              mat.pbrMetallicRoughness.setMetallicFactor(0.25);
            } else if (isVein) {
              if (mat.setAlphaMode) mat.setAlphaMode('OPAQUE');
              mat.pbrMetallicRoughness.setBaseColorFactor([0.08, 0.35, 0.96, 1.0]);
              mat.pbrMetallicRoughness.setRoughnessFactor(0.2);
              mat.pbrMetallicRoughness.setMetallicFactor(0.25);
            } else {
              if (mat.setAlphaMode) mat.setAlphaMode('BLEND');
              mat.pbrMetallicRoughness.setBaseColorFactor([defaultColor[0], defaultColor[1], defaultColor[2], 0.06]);
            }
          } else if (layer === 'nerves') {
            if (isNerve) {
              if (mat.setAlphaMode) mat.setAlphaMode('OPAQUE');
              mat.pbrMetallicRoughness.setBaseColorFactor([1.0, 0.88, 0.05, 1.0]);
              mat.pbrMetallicRoughness.setRoughnessFactor(0.25);
              mat.pbrMetallicRoughness.setMetallicFactor(0.1);
            } else {
              if (mat.setAlphaMode) mat.setAlphaMode('BLEND');
              mat.pbrMetallicRoughness.setBaseColorFactor([defaultColor[0], defaultColor[1], defaultColor[2], 0.06]);
            }
          } else if (layer === 'ducts') {
            if (isDuct) {
              if (mat.setAlphaMode) mat.setAlphaMode('OPAQUE');
              mat.pbrMetallicRoughness.setBaseColorFactor([0.12, 0.85, 0.35, 1.0]);
              mat.pbrMetallicRoughness.setRoughnessFactor(0.25);
              mat.pbrMetallicRoughness.setMetallicFactor(0.15);
            } else {
              if (mat.setAlphaMode) mat.setAlphaMode('BLEND');
              mat.pbrMetallicRoughness.setBaseColorFactor([defaultColor[0], defaultColor[1], defaultColor[2], 0.06]);
            }
          } else {
            if (mat.setAlphaMode) mat.setAlphaMode('OPAQUE');
            if (isArtery) {
              mat.pbrMetallicRoughness.setBaseColorFactor([0.92, 0.12, 0.18, 1.0]);
            } else if (isVein) {
              mat.pbrMetallicRoughness.setBaseColorFactor([0.12, 0.35, 0.92, 1.0]);
            } else if (isNerve) {
              mat.pbrMetallicRoughness.setBaseColorFactor([0.95, 0.82, 0.10, 1.0]);
            } else if (isDuct) {
              mat.pbrMetallicRoughness.setBaseColorFactor([0.15, 0.80, 0.35, 1.0]);
            } else {
              mat.pbrMetallicRoughness.setBaseColorFactor(defaultColor);
              mat.pbrMetallicRoughness.setRoughnessFactor(defaultRoughness);
            }
          }
        }
      });
    } catch (err) {
      console.warn('Material adjustment info:', err);
    }
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function handleLoad() {
      setLoading(false);
      setLoadError(false);

      let hasVessels = false;
      let hasNerves = false;
      let hasDucts = false;

      try {
        const model = el.model;
        if (model && model.materials) {
          model.materials.forEach((mat) => {
            const name = (mat.name || '').toLowerCase();
            if (name.includes('artery') || name.includes('vein') || name.includes('sinus') || name.includes('carotid') || name.includes('basilar') || name.includes('vessel')) {
              hasVessels = true;
            }
            if (name.includes('nerve') || name.includes('tract') || name.includes('fiber') || name.includes('nucleus') || name.includes('ganglion')) {
              hasNerves = true;
            }
            if (name.includes('duct') || name.includes('ventricle') || name.includes('lcr') || name.includes('choroid') || name.includes('bile') || name.includes('ureter')) {
              hasDucts = true;
            }
          });
        }
      } catch (err) {
        console.warn('Structure detection info:', err);
      }

      setAvailableLayers({ vessels: hasVessels, nerves: hasNerves, ducts: hasDucts });
      applyAnatomicalMaterials(el, 'all');
    }

    function handleError() {
      setLoading(false);
      setLoadError(true);
    }

    el.addEventListener('load', handleLoad);
    el.addEventListener('error', handleError);

    return () => {
      el.removeEventListener('load', handleLoad);
      el.removeEventListener('error', handleError);
    };
  }, [src, editable, onSurfaceClick]);

  useEffect(() => {
    const el = ref.current;
    if (el && !loading) {
      applyAnatomicalMaterials(el, highlightLayer);
    }
  }, [highlightLayer, loading]);

  // Focus camera directly onto the chosen anatomical hotspot
  function handleSelectHotspot(h) {
    setActiveHotspot(h);
    onHotspotClick?.(h);

    const el = ref.current;
    if (el && h.x !== undefined && h.y !== undefined && h.z !== undefined) {
      try {
        // Smoothly pan camera target to the exact 3D coordinates of the hotspot
        el.cameraTarget = `${h.x}m ${h.y}m ${h.z}m`;
        // Stop auto rotation so the user can inspect the selected structure
        setAutoRotate(false);
      } catch (err) {
        console.warn('Camera target update:', err);
      }
    }
  }

  function resetCamera() {
    const el = ref.current;
    if (el) {
      el.cameraOrbit = '0deg 75deg 105%';
      el.cameraTarget = 'auto auto auto';
      el.fieldOfView = 'auto';
      setActiveHotspot(null);
    }
  }

  function handlePointerMove(e) {
    const el = ref.current;
    const container = containerRef.current;
    if (!el || !container || isAnimatedVideo) return;

    const rect = container.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    try {
      const hit = el.positionAndNormalFromPoint(clientX, clientY);
      if (hit && hotspots.length > 0) {
        let closest = null;
        let minDist = Infinity;
        hotspots.forEach((h) => {
          const dx = h.x - hit.position.x;
          const dy = h.y - hit.position.y;
          const dz = h.z - hit.position.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < minDist) {
            minDist = dist;
            closest = h;
          }
        });

        if (closest) {
          setHoveredStructure({ text: closest.text, x, y });
          return;
        }
      }
    } catch (err) {
      // Ignored
    }
  }

  function handlePointerLeave() {
    setHoveredStructure(null);
  }

  if (!src) {
    return (
      <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050d1a', color: '#94a3b8', borderRadius: '10px' }}>
        3D модель не привязана
      </div>
    );
  }

  const hasAnySubLayers = availableLayers.vessels || availableLayers.nerves || availableLayers.ducts;

  return (
    <div className="model-3d-container">
      {/* Clean 3D Toolbar */}
      <div className="model-3d-toolbar">
        <div className="toolbar-left">
          <span className="toolbar-label">{hasAnySubLayers ? 'Слои:' : 'Режим:'}</span>

          <button
            type="button"
            className={`layer-btn ${highlightLayer === 'all' ? 'active' : ''}`}
            onClick={() => setHighlightLayer('all')}
            title="Полный объёмный анатомический макет"
          >
            <span className="layer-color-dot all" /> Полный объём
          </button>

          {availableLayers.vessels && (
            <button
              type="button"
              className={`layer-btn ${highlightLayer === 'vessels' ? 'active' : ''}`}
              onClick={() => setHighlightLayer('vessels')}
              title="Оставить только артерии и вены"
            >
              <span className="layer-color-dot red" /> Сосуды
            </button>
          )}

          {availableLayers.nerves && (
            <button
              type="button"
              className={`layer-btn ${highlightLayer === 'nerves' ? 'active' : ''}`}
              onClick={() => setHighlightLayer('nerves')}
              title="Оставить только нервы и проводящие пути"
            >
              <span className="layer-color-dot yellow" /> Нервы
            </button>
          )}

          {availableLayers.ducts && (
            <button
              type="button"
              className={`layer-btn ${highlightLayer === 'ducts' ? 'active' : ''}`}
              onClick={() => setHighlightLayer('ducts')}
              title="Оставить только протоки, ликворные пути и желудочки"
            >
              <span className="layer-color-dot green" /> Протоки
            </button>
          )}
        </div>

        <div className="toolbar-right">
          <button
            type="button"
            className={`tool-icon-btn ${autoRotate ? 'active' : ''}`}
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? 'Остановить вращение' : 'Включить авто-вращение'}
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          </button>
          <button
            type="button"
            className="tool-icon-btn"
            onClick={resetCamera}
            title="Сбросить ракурс камеры"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="model-3d-viewport"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          position: 'relative',
          width: '100%',
          height: `${height}px`,
          borderRadius: '10px',
          overflow: 'hidden',
          background: 'radial-gradient(circle at 50% 40%, #0d1e3a 0%, #071224 65%, #030814 100%)',
          boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.6), 0 4px 20px rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--wm-border)',
        }}
      >
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', zIndex: 10, background: 'rgba(7, 18, 36, 0.88)' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #0284c7', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '10px' }} />
            <span style={{ fontSize: '0.85rem' }}>Загрузка 3D анатомического макета...</span>
          </div>
        )}

        {loadError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#071224', color: '#f87171', padding: '1rem', textAlign: 'center', zIndex: 10 }}>
            Не удалось загрузить 3D-модель. Проверьте соединение с сервером.
          </div>
        )}

        {isAnimatedVideo && (
          <div className="animated-video-badge">
            <span className="rec-dot" />
            <span>АНИМАЦИОННЫЙ 3D ВИДЕО-ОБЗОР</span>
          </div>
        )}

        <model-viewer
          ref={ref}
          src={src}
          camera-controls
          touch-action="pan-y"
          auto-rotate={(autoRotate || isAnimatedVideo) && !editable ? '' : undefined}
          rotation-per-second={isAnimatedVideo ? '32deg' : '18deg'}
          shadow-intensity="1.6"
          shadow-softness="0.75"
          exposure="1.15"
          loading="eager"
          reveal="auto"
          style={{ width: '100%', height: '100%', outline: 'none' }}
        >
          {!isAnimatedVideo && hotspots.map((h, i) => {
            const isActive = activeHotspot?.text === h.text;
            return (
              <button
                key={i}
                slot={`hotspot-${i}`}
                className={`hotspot-3d ${isActive ? 'active' : ''}`}
                data-position={`${h.x} ${h.y} ${h.z}`}
                data-normal={`${h.nx ?? 0} ${h.ny ?? 0} ${h.nz ?? 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectHotspot(h);
                }}
                onPointerEnter={() => setHoveredStructure({ text: h.text })}
              >
                <span className="hotspot-badge">{i + 1}</span>
                <span className="hotspot-tooltip">{h.text}</span>
              </button>
            );
          })}
        </model-viewer>

        {/* Live Cursor Floating Hover Tooltip */}
        {hoveredStructure && (
          <div
            className="cursor-3d-tooltip"
            style={
              hoveredStructure.x !== undefined && hoveredStructure.y !== undefined
                ? { left: `${hoveredStructure.x + 12}px`, top: `${hoveredStructure.y + 12}px` }
                : { left: '50%', bottom: '40px', transform: 'translateX(-50%)' }
            }
          >
            <span className="tooltip-dot" />
            <span className="tooltip-title">{hoveredStructure.text}</span>
          </div>
        )}

        {/* Active Hotspot Banner */}
        {activeHotspot && !hoveredStructure && (
          <div className="active-hotspot-banner">
            <span className="banner-pulse-dot" />
            <span className="banner-title">{activeHotspot.text}</span>
          </div>
        )}

        {/* Conditional Legend */}
        {hasAnySubLayers && (
          <div className="anatomical-legend">
            {availableLayers.vessels && <span className="legend-item"><span className="legend-dot red" /> Артерии / Вены</span>}
            {availableLayers.nerves && <span className="legend-item"><span className="legend-dot yellow" /> Нервы</span>}
            {availableLayers.ducts && <span className="legend-item"><span className="legend-dot green" /> Протоки</span>}
          </div>
        )}

        <div className="viewport-hint">
          <span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '5px', verticalAlign: 'middle' }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Нажмите на анатомическую зону для выбора органа • Вращение: ЛКМ • Масштаб: Колесо мыши
          </span>
        </div>
      </div>

      {/* Structure Chips List below the 3D model */}
      {hotspots.length > 0 && (
        <div className="hotspots-panel">
          <div className="hotspots-panel-header">
            <span>Анатомические структуры ({hotspots.length} зон):</span>
          </div>
          <div className="hotspots-chips">
            {hotspots.map((h, i) => {
              const isActive = activeHotspot?.text === h.text;
              return (
                <button
                  key={i}
                  type="button"
                  className={`hotspot-chip ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectHotspot(h)}
                  onPointerEnter={() => setHoveredStructure({ text: h.text })}
                  onPointerLeave={() => setHoveredStructure(null)}
                >
                  <span className="chip-index">{i + 1}</span>
                  <span className="chip-name">{h.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
