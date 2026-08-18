import { useEffect, useState } from 'react';
import { api, resolveImageUrl } from './api';
import Model3DViewer from './Model3DViewer';

const PROFILES = [
  { id: 'male', label: 'Мужчина' },
  { id: 'female', label: 'Женщина' },
  { id: 'child', label: 'Ребёнок' },
];

export default function AtlasView() {
  const [bodyProfile, setBodyProfile] = useState(null);
  const [systems, setSystems] = useState([]);
  const [activeSystem, setActiveSystem] = useState('');
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeLabel, setActiveLabel] = useState(null);
  const [viewMode, setViewMode] = useState('2d');
  const [bodyMap, setBodyMap] = useState(null);
  const [bodyMapView, setBodyMapView] = useState('2d');
  const [error, setError] = useState('');

  // 'all' means "show everything, no profile filter" — don't forward it to the API as a filter value.
  const apiProfile = bodyProfile && bodyProfile !== 'all' ? bodyProfile : undefined;

  useEffect(() => {
    if (bodyProfile === null) return;
    api.listSystems(apiProfile).then(setSystems).catch((e) => setError(e.message));
  }, [bodyProfile]);

  useEffect(() => {
    if (bodyProfile === null) return;
    api
      .listEntries(activeSystem, apiProfile)
      .then(setEntries)
      .catch((e) => setError(e.message));
  }, [activeSystem, bodyProfile]);

  useEffect(() => {
    if (!apiProfile) {
      setBodyMap(null);
      return;
    }
    api
      .getBodyMap(apiProfile)
      .then((map) => {
        setBodyMap(map);
        setBodyMapView(map?.modelUrl ? '3d' : '2d');
      })
      .catch(() => setBodyMap(null));
  }, [bodyProfile]);

  function goToOrgan(organ) {
    setActiveSystem(organ);
    document.getElementById('entry-grid-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (bodyProfile === null) {
    return (
      <div className="profile-picker">
        <p className="eyebrow">Справочник</p>
        <h2>Выберите профиль</h2>
        <p className="section-dek">У мужчин, женщин и детей разная анатомия и разные патологии — атлас показывает записи, актуальные для выбранного профиля.</p>
        <div className="profile-grid">
          {PROFILES.map((p) => (
            <button key={p.id} className="profile-card" onClick={() => setBodyProfile(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        <button className="profile-skip" onClick={() => setBodyProfile('all')}>Показать всё без фильтра</button>
      </div>
    );
  }

  return (
    <div className="atlas">
      <aside className="atlas-sidebar">
        <div className="profile-switch">
          <span>{PROFILES.find((p) => p.id === bodyProfile)?.label || 'Все профили'}</span>
          <button onClick={() => { setBodyProfile(null); setActiveSystem(''); }}>Сменить</button>
        </div>
        <h2>Органы</h2>
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

        {bodyMap && (bodyMap.imageUrl || bodyMap.modelUrl) && (
          <div className="bodymap-panel">
            <div className="bodymap-header">
              <h2>Карта тела — кликните на орган</h2>
              {bodyMap.imageUrl && bodyMap.modelUrl && (
                <div className="view-toggle">
                  <button className={bodyMapView === '2d' ? 'active' : ''} onClick={() => setBodyMapView('2d')}>2D</button>
                  <button className={bodyMapView === '3d' ? 'active' : ''} onClick={() => setBodyMapView('3d')}>3D</button>
                </div>
              )}
            </div>
            {bodyMapView === '3d' && bodyMap.modelUrl ? (
              <Model3DViewer
                src={resolveImageUrl(bodyMap.modelUrl)}
                hotspots={(bodyMap.labels3d || []).map((l) => ({ ...l, text: l.organ }))}
                onHotspotClick={(l) => goToOrgan(l.organ)}
                height={420}
              />
            ) : (
              bodyMap.imageUrl && (
                <div className="image-with-labels bodymap-image">
                  <img src={resolveImageUrl(bodyMap.imageUrl)} alt="Карта тела" />
                  {(bodyMap.labels || []).map((l, i) => (
                    <button
                      key={i}
                      className="label-marker organ-marker"
                      style={{ left: `${l.x}%`, top: `${l.y}%` }}
                      onClick={() => goToOrgan(l.organ)}
                      title={l.organ}
                    >
                      {l.organ}
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        <div id="entry-grid-anchor" />
        {entries.length === 0 && !error && <p className="empty">Пока нет данных. Добавьте записи в разделе «Админ».</p>}
        <div className="entry-grid">
          {entries.map((entry) => (
            <button
              key={entry.id}
              className="entry-card"
              onClick={() => {
                setSelected(entry);
                setActiveLabel(null);
                setViewMode(entry.modelUrl ? '3d' : entry.imageUrl ? '2d' : 'video');
              }}
            >
              {entry.imageUrl ? (
                <img src={resolveImageUrl(entry.imageUrl)} alt={entry.title} />
              ) : (
                <div className="no-image">{entry.modelUrl ? '3D-модель' : entry.videoUrl ? 'Видео' : 'Нет изображения'}</div>
              )}
              {entry.videoUrl && <span className="video-badge" title="Есть видео">▶</span>}
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

            {(() => {
              const modes = [
                selected.imageUrl && '2d',
                selected.modelUrl && '3d',
                selected.videoUrl && 'video',
              ].filter(Boolean);
              const labels = { '2d': '2D', '3d': '3D', video: 'Видео' };
              return (
                modes.length > 1 && (
                  <div className="view-toggle">
                    {modes.map((m) => (
                      <button key={m} className={viewMode === m ? 'active' : ''} onClick={() => setViewMode(m)}>
                        {labels[m]}
                      </button>
                    ))}
                  </div>
                )
              );
            })()}

            {viewMode === '3d' && selected.modelUrl ? (
              <Model3DViewer
                src={resolveImageUrl(selected.modelUrl)}
                hotspots={selected.labels3d || []}
                onHotspotClick={(label) => setActiveLabel(label)}
                height={360}
              />
            ) : viewMode === 'video' && selected.videoUrl ? (
              <video
                src={resolveImageUrl(selected.videoUrl)}
                controls
                style={{ width: '100%', borderRadius: '8px', display: 'block' }}
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

            <div className="rubrics">
              {selected.definition && (
                <div className="rubric">
                  <h3>Определение</h3>
                  <p>{selected.definition}</p>
                </div>
              )}
              {selected.causes && (
                <div className="rubric">
                  <h3>Причины</h3>
                  <p>{selected.causes}</p>
                </div>
              )}
              {selected.symptoms && (
                <div className="rubric">
                  <h3>Симптомы</h3>
                  <p>{selected.symptoms}</p>
                </div>
              )}
              {selected.recommendedDrugs && selected.recommendedDrugs.length > 0 && (
                <div className="rubric">
                  <h3>Рекомендуемые препараты компании WM</h3>
                  <ul className="drug-tags">
                    {selected.recommendedDrugs.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
