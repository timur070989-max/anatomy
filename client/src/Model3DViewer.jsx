import { useEffect, useRef } from 'react';

// Wraps <model-viewer> (Google's web component) to show a GLB/GLTF model
// with clickable hotspots anchored to 3D surface points.
export default function Model3DViewer({ src, hotspots = [], editable = false, onSurfaceClick, onHotspotClick, height = 320 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !editable || !onSurfaceClick) return;

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
    return () => el.removeEventListener('click', handleClick);
  }, [editable, onSurfaceClick]);

  return (
    <model-viewer
      ref={ref}
      src={src}
      camera-controls="true"
      auto-rotate={editable ? undefined : 'true'}
      interaction-prompt="none"
      style={{ width: '100%', height: `${height}px`, background: '#f0eef4', borderRadius: '8px' }}
    >
      {hotspots.map((h, i) => (
        <button
          key={i}
          slot={`hotspot-${i}`}
          className="hotspot-3d"
          data-position={`${h.x} ${h.y} ${h.z}`}
          data-normal={`${h.nx ?? 0} ${h.ny ?? 0} ${h.nz ?? 1}`}
          onClick={(e) => {
            e.stopPropagation();
            onHotspotClick?.(h);
          }}
          title={h.text}
        >
          {i + 1}
        </button>
      ))}
    </model-viewer>
  );
}
