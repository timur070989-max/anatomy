import { useEffect, useState } from 'react';
import { api, resolveImageUrl } from './api';
import Model3DViewer from './Model3DViewer';

export default function AtlasView() {
  const [systems, setSystems] = useState([]);
  const [activeSystem, setActiveSystem] = useState('');
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeLabel, setActiveLabel] = useState(null);
  const [viewMode, setViewMode] = useState('2d');
  const [error, setError] = useState('');

  useEffect(() => {
    api.listSystems().then(setSystems).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    api
      .listEntries(activeSystem)
      .then(setEntries)
      .catch((e) => setError(e.message));
  }, [activeSystem]);

  return (
    <div className="atlas">
      <aside className="atlas-sidebar">
        <h2>Системы</h2>
        <ul>
          <li className={activeSystem === '' ? 'active' : ''} onClick={() => setActiveSystem('')}>
            Все
          </li>
          {systems.map((s) => (
            <li key={s} className={activeSystem === s ? 'active' : ''} onClick={() => setActiveSystem(s)}>
              {s}
            </li>
          ))}
        </ul>
      </aside>

      <main className="atlas-content">
        {error && <p className="error">{error}</p>}
        {entries.length === 0 && !error && <p className="empty">Пока нет данных. Добавьте записи в разделе «Админ».</p>}
        <div className="entry-grid">
          {entries.map((entry) => (
            <button
              key={entry.id}
              className="entry-card"
              onClick={() => {
                setSelected(entry);
                setActiveLabel(null);
                setViewMode(entry.modelUrl ? '3d' : '2d');
              }}
            >
              {entry.imageUrl ? (
                <img src={resolveImageUrl(entry.imageUrl)} alt={entry.title} />
              ) : (
                <div className="no-image">{entry.modelUrl ? '3D-модель' : 'Нет изображения'}</div>
              )}
              <span>{entry.title}</span>
            </button>
          ))}
        </div>
      </main>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setSelected(null)}>×</button>
            <h2>{selected.title}</h2>
            <p className="system-tag">{selected.system}</p>

            {selected.imageUrl && selected.modelUrl && (
              <div className="view-toggle">
                <button className={viewMode === '2d' ? 'active' : ''} onClick={() => setViewMode('2d')}>2D</button>
                <button className={viewMode === '3d' ? 'active' : ''} onClick={() => setViewMode('3d')}>3D</button>
              </div>
            )}

            {viewMode === '3d' && selected.modelUrl ? (
              <Model3DViewer
                src={resolveImageUrl(selected.modelUrl)}
                hotspots={selected.labels3d || []}
                onHotspotClick={(label) => setActiveLabel(label)}
                height={360}
              />
            ) : (
              selected.imageUrl && (
                <div className="image-with-labels">
                  <img src={resolveImageUrl(selected.imageUrl)} alt={selected.title} />
                  {(selected.labels || []).map((label, i) => (
                    <button
                      key={i}
                      className="label-marker"
                      style={{ left: `${label.x}%`, top: `${label.y}%` }}
                      onClick={() => setActiveLabel(label)}
                      title={label.text}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )
            )}
            {activeLabel && <p className="label-text"><strong>{activeLabel.text}</strong></p>}
            {selected.description && <p className="description">{selected.description}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
