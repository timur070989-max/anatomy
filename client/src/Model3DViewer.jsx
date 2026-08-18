import { useEffect, useRef, useState } from 'react';

// Google <model-viewer> web component wrapper with 3D anatomical hotspots and structure navigator
export default function Model3DViewer({ src, hotspots = [], editable = false, onSurfaceClick, onHotspotClick, height = 380 }) {
  const ref = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState(null);

  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    setActiveHotspot(null);
  }, [src]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function handleLoad() {
      setLoading(false);
      setLoadError(false);

      // Enhance organ PBR colors matching World Medicine body map
      try {
        const model = el.model;
        if (model && model.materials && model.materials.length > 0) {
          const srcLower = (src || '').toLowerCase();
          let color = null;
          let roughness = 0.35;
          let metallic = 0.04;

          if (srcLower.includes('liver')) {
            color = [0.62, 0.22, 0.18, 1.0]; // Тёмно-бордовая печень
            roughness = 0.35;
          } else if (srcLower.includes('gallbladder')) {
            color = [0.18, 0.50, 0.22, 1.0]; // Изумрудно-зелёный жёлчный пузырь
            roughness = 0.28;
          } else if (srcLower.includes('stomach')) {
            color = [0.82, 0.48, 0.44, 1.0]; // Телесно-розовый желудок
            roughness = 0.40;
          } else if (srcLower.includes('pancreas')) {
            color = [0.85, 0.66, 0.36, 1.0]; // Охристо-золотистая поджелудочная
            roughness = 0.52;
          } else if (srcLower.includes('kidney')) {
            color = [0.54, 0.16, 0.14, 1.0]; // Тёмно-красные почки
            roughness = 0.34;
          } else if (srcLower.includes('bladder')) {
            color = [0.88, 0.52, 0.40, 1.0]; // Янтарно-розовый мочевой пузырь
            roughness = 0.38;
          } else if (srcLower.includes('brain')) {
            color = [0.82, 0.65, 0.62, 1.0]; // Серо-розовый мозг
            roughness = 0.45;
          }

          if (color) {
            model.materials.forEach((mat) => {
              if (mat.pbrMetallicRoughness) {
                mat.pbrMetallicRoughness.setBaseColorFactor(color);
                mat.pbrMetallicRoughness.setRoughnessFactor(roughness);
                mat.pbrMetallicRoughness.setMetallicFactor(metallic);
              }
            });
          }
        }
      } catch (err) {
        console.warn('Material coloring info:', err);
      }
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

  function handleSelectHotspot(h) {
    setActiveHotspot(h);
    onHotspotClick?.(h);
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
          border: '1px solid rgba(56, 189, 248, 0.2)',
        }}
      >
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', zIndex: 10, background: 'rgba(15, 23, 42, 0.85)' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #0284c7', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '10px' }} />
            <span style={{ fontSize: '0.85rem' }}>Загрузка 3D анатомической модели...</span>
          </div>
        )}

        {loadError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#f87171', padding: '1rem', textAlign: 'center', zIndex: 10 }}>
            Не удалось загрузить 3D-модель. Проверьте соединение с сервером.
          </div>
        )}

        <model-viewer
          ref={ref}
          src={src}
          camera-controls
          touch-action="pan-y"
          auto-rotate={editable ? undefined : ''}
          rotation-per-second="20deg"
          shadow-intensity="1.5"
          shadow-softness="0.8"
          exposure="1.1"
          loading="eager"
          reveal="auto"
          style={{ width: '100%', height: '100%', outline: 'none' }}
        >
          {hotspots.map((h, i) => (
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

        <div className="viewport-hint">
          <span>Вращение: зажмите ЛКМ • Масштаб: колесо мыши</span>
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
