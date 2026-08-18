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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState(null);

  // Full-volume view modes
  const [xrayMode, setXrayMode] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [highlightLayer, setHighlightLayer] = useState('all'); // 'all' | 'vessels' | 'nerves' | 'walls'

  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    setActiveHotspot(null);
  }, [src]);

  // Apply colors and transparency based on mode and active layer
  function applyAnatomicalMaterials(el, isXray, layer) {
    if (!el) return;
    try {
      const model = el.model;
      if (!model || !model.materials || model.materials.length === 0) return;

      const srcLower = (src || '').toLowerCase();
      let defaultColor = [0.75, 0.45, 0.42, 1.0];
      let defaultRoughness = 0.38;

      if (srcLower.includes('liver')) {
        defaultColor = [0.62, 0.22, 0.18, 1.0]; // Тёмно-бордовая печень
      } else if (srcLower.includes('gallbladder')) {
        defaultColor = [0.18, 0.50, 0.22, 1.0]; // Изумрудно-зелёный жёлчный пузырь
      } else if (srcLower.includes('stomach')) {
        defaultColor = [0.82, 0.48, 0.44, 1.0]; // Телесно-розовый желудок
      } else if (srcLower.includes('pancreas')) {
        defaultColor = [0.85, 0.66, 0.36, 1.0]; // Охристо-золотистая поджелудочная
      } else if (srcLower.includes('kidney')) {
        defaultColor = [0.54, 0.16, 0.14, 1.0]; // Тёмно-красные почки
      } else if (srcLower.includes('bladder')) {
        defaultColor = [0.88, 0.52, 0.40, 1.0]; // Янтарно-розовый мочевой пузырь
      } else if (srcLower.includes('brain')) {
        defaultColor = [0.80, 0.50, 0.46, 1.0]; // Кора мозга
      }

      const hasMultiMaterials = model.materials.length > 1;

      model.materials.forEach((mat) => {
        const name = (mat.name || '').toLowerCase();
        const isArtery = name.includes('artery') || name.includes('carotid') || name.includes('basilar') || name.includes('pericallosal');
        const isVein = name.includes('sinus') || name.includes('vein');
        const isNerve = name.includes('nerve') || name.includes('fiber') || name.includes('tract') || name.includes('nucleus');
        const isWall = !isArtery && !isVein && !isNerve;

        if (mat.pbrMetallicRoughness) {
          if (layer === 'vessels') {
            // Режим «ТОЛЬКО СОСУДЫ»: оставляем исключительно артерии и вены
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
              // Полностью скрываем стенки, паренхиму и нервы
              if (hasMultiMaterials) {
                if (mat.setAlphaMode) mat.setAlphaMode('BLEND');
                mat.pbrMetallicRoughness.setBaseColorFactor([0, 0, 0, 0.0]);
              } else {
                // Для одиночных моделей подсвечиваем сосудистый профиль органа
                if (mat.setAlphaMode) mat.setAlphaMode('OPAQUE');
                mat.pbrMetallicRoughness.setBaseColorFactor([0.92, 0.12, 0.18, 1.0]);
              }
            }
          } else if (layer === 'nerves') {
            // Режим «ТОЛЬКО НЕРВЫ»: оставляем исключительно нервы и нервные стволы
            if (isNerve) {
              if (mat.setAlphaMode) mat.setAlphaMode('OPAQUE');
              mat.pbrMetallicRoughness.setBaseColorFactor([1.0, 0.88, 0.05, 1.0]);
              mat.pbrMetallicRoughness.setRoughnessFactor(0.25);
              mat.pbrMetallicRoughness.setMetallicFactor(0.1);
            } else {
              // Полностью скрываем стенки, паренхиму, артерии и вены
              if (hasMultiMaterials) {
                if (mat.setAlphaMode) mat.setAlphaMode('BLEND');
                mat.pbrMetallicRoughness.setBaseColorFactor([0, 0, 0, 0.0]);
              } else {
                // Для одиночных моделей подсвечиваем нервный профиль органа
                if (mat.setAlphaMode) mat.setAlphaMode('OPAQUE');
                mat.pbrMetallicRoughness.setBaseColorFactor([0.95, 0.85, 0.15, 1.0]);
              }
            }
          } else if (isXray) {
            // Режим «РЕНТГЕН / ПРОЗРАЧНОСТЬ»: полупрозрачные стенки, сквозь которые видны сосуды и нервы
            if (isArtery) {
              if (mat.setAlphaMode) mat.setAlphaMode('OPAQUE');
              mat.pbrMetallicRoughness.setBaseColorFactor([0.96, 0.08, 0.16, 1.0]);
            } else if (isVein) {
              if (mat.setAlphaMode) mat.setAlphaMode('OPAQUE');
              mat.pbrMetallicRoughness.setBaseColorFactor([0.08, 0.35, 0.96, 1.0]);
            } else if (isNerve) {
              if (mat.setAlphaMode) mat.setAlphaMode('OPAQUE');
              mat.pbrMetallicRoughness.setBaseColorFactor([1.0, 0.88, 0.05, 1.0]);
            } else {
              if (mat.setAlphaMode) mat.setAlphaMode('BLEND');
              mat.pbrMetallicRoughness.setBaseColorFactor([defaultColor[0], defaultColor[1], defaultColor[2], 0.22]);
              mat.pbrMetallicRoughness.setRoughnessFactor(0.15);
            }
          } else {
            // Режим «ПОЛНЫЙ ОБЪЁМ»: все структуры плотные и видны
            if (mat.setAlphaMode) mat.setAlphaMode('OPAQUE');
            if (isArtery) {
              mat.pbrMetallicRoughness.setBaseColorFactor([0.92, 0.12, 0.18, 1.0]);
            } else if (isVein) {
              mat.pbrMetallicRoughness.setBaseColorFactor([0.12, 0.35, 0.92, 1.0]);
            } else if (isNerve) {
              mat.pbrMetallicRoughness.setBaseColorFactor([0.95, 0.82, 0.10, 1.0]);
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
      applyAnatomicalMaterials(el, xrayMode, highlightLayer);
    }

    function handleError(e) {
      console.error('Failed to load 3D model:', src, e);
      setLoading(false);
      setLoadError(true);
    }

    el.addEventListener('load', handleLoad);
    el.addEventListener('error', handleError);

    if (editable && onSurfaceClick) {
      function handleClick(event) {
        const hit = el.positionAndNormalFromPoint(event.clientX, event.clientY);
        if (!hit) return;
        onSurfaceClick({
          x: hit.position.x,
          y: hit.position.y,
          z: hit.position.z,
          nx: hit.normal.x,
          ny: hit.normal.y,
          nz: hit.normal.z,
        });
      }
      el.addEventListener('click', handleClick);
      return () => {
        el.removeEventListener('load', handleLoad);
        el.removeEventListener('error', handleError);
        el.removeEventListener('click', handleClick);
      };
    }

    return () => {
      el.removeEventListener('load', handleLoad);
      el.removeEventListener('error', handleError);
    };
  }, [src, editable, onSurfaceClick]);

  // Update materials when X-Ray or layer selection changes
  useEffect(() => {
    const el = ref.current;
    if (el && !loading) {
      applyAnatomicalMaterials(el, xrayMode, highlightLayer);
    }
  }, [xrayMode, highlightLayer, loading]);

  function handleSelectHotspot(h) {
    setActiveHotspot(h);
    onHotspotClick?.(h);
  }

  function resetCamera() {
    const el = ref.current;
    if (el) {
      el.cameraOrbit = '0deg 75deg 105%';
      el.cameraTarget = 'auto auto auto';
      el.fieldOfView = 'auto';
    }
  }

  if (!src) {
    return (
      <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#94a3b8', borderRadius: '10px' }}>
        3D модель не привязана
      </div>
    );
  }

  return (
    <div className="model-3d-container">
      {/* 3D Anatomical Layer Toolbar */}
      <div className="model-3d-toolbar">
        <div className="toolbar-left">
          <span className="toolbar-label">Анатомический слой:</span>
          <button
            type="button"
            className={`layer-btn ${highlightLayer === 'all' && !xrayMode ? 'active' : ''}`}
            onClick={() => { setHighlightLayer('all'); setXrayMode(false); }}
          >
            🫀 Полный объём
          </button>
          <button
            type="button"
            className={`layer-btn ${highlightLayer === 'vessels' ? 'active' : ''}`}
            onClick={() => { setHighlightLayer('vessels'); setXrayMode(true); }}
            title="Подсветить артерии (красные) и вены (синие)"
          >
            🔴 Сосуды (Арт./Вены)
          </button>
          <button
            type="button"
            className={`layer-btn ${highlightLayer === 'nerves' ? 'active' : ''}`}
            onClick={() => { setHighlightLayer('nerves'); setXrayMode(true); }}
            title="Подсветить нервные волокна (жёлтые)"
          >
            🟡 Нервы
          </button>
          <button
            type="button"
            className={`layer-btn ${xrayMode && highlightLayer === 'all' ? 'active' : ''}`}
            onClick={() => setXrayMode(!xrayMode)}
            title="Полупрозрачность стенок для обзора внутренних структур"
          >
            🩻 Рентген / Прозрачность
          </button>
        </div>

        <div className="toolbar-right">
          <button
            type="button"
            className={`tool-icon-btn ${autoRotate ? 'active' : ''}`}
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? 'Остановить вращение' : 'Включить авто-вращение'}
          >
            🔄
          </button>
          <button
            type="button"
            className="tool-icon-btn"
            onClick={resetCamera}
            title="Сбросить камеру"
          >
            🎯
          </button>
        </div>
      </div>

      <div
        className="model-3d-viewport"
        style={{
          position: 'relative',
          width: '100%',
          height: `${height}px`,
          borderRadius: '10px',
          overflow: 'hidden',
          background: 'radial-gradient(circle at 50% 40%, #1e293b 0%, #0f172a 65%, #020617 100%)',
          boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.6), 0 4px 20px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
        }}
      >
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', zIndex: 10, background: 'rgba(15, 23, 42, 0.85)' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #0284c7', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '10px' }} />
            <span style={{ fontSize: '0.85rem' }}>Загрузка 3D анатомического макета...</span>
          </div>
        )}

        {loadError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#f87171', padding: '1rem', textAlign: 'center', zIndex: 10 }}>
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
          {!isAnimatedVideo && hotspots.map((h, i) => (
            <button
              key={i}
              slot={`hotspot-${i}`}
              className={`hotspot-3d ${activeHotspot?.text === h.text ? 'active' : ''}`}
              data-position={`${h.x} ${h.y} ${h.z}`}
              data-normal={`${h.nx ?? 0} ${h.ny ?? 0} ${h.nz ?? 1}`}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectHotspot(h);
              }}
            >
              <span className="hotspot-badge">{i + 1}</span>
              <span className="hotspot-tooltip">{h.text}</span>
            </button>
          ))}
        </model-viewer>

        {activeHotspot && (
          <div className="active-hotspot-banner">
            <span className="banner-icon">📍</span>
            <span className="banner-title">{activeHotspot.text}</span>
          </div>
        )}

        {/* Anatomical Color Legend Overlay */}
        <div className="anatomical-legend">
          <span className="legend-item"><span className="legend-dot red" /> Артерии</span>
          <span className="legend-item"><span className="legend-dot blue" /> Вены / Синусы</span>
          <span className="legend-item"><span className="legend-dot yellow" /> Нервы</span>
          <span className="legend-item"><span className="legend-dot green" /> Протоки</span>
        </div>

        <div className="viewport-hint">
          <span>Вращение: зажмите ЛКМ • Зум: колесо мыши</span>
        </div>
      </div>

      {hotspots.length > 0 && (
        <div className="hotspots-panel">
          <div className="hotspots-panel-header">
            <span>Анатомическая структура ({hotspots.length} зон):</span>
          </div>
          <div className="hotspots-chips">
            {hotspots.map((h, i) => (
              <button
                key={i}
                type="button"
                className={`hotspot-chip ${activeHotspot?.text === h.text ? 'active' : ''}`}
                onClick={() => handleSelectHotspot(h)}
              >
                <span className="chip-index">{i + 1}</span>
                <span className="chip-name">{h.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
