import { useEffect, useState } from 'react';
import { api, resolveImageUrl } from './api';
import Model3DViewer from './Model3DViewer';

const PROFILES = [
  { id: 'male', label: 'Мужчина' },
  { id: 'female', label: 'Женщина' },
  { id: 'child', label: 'Ребёнок' },
];

export default function AtlasView() {
  const [bodyProfile, setBodyProfile] = useState('male');
  const [systems, setSystems] = useState([]);
  const [activeSystem, setActiveSystem] = useState('');
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeLabel, setActiveLabel] = useState(null);
  const [viewMode, setViewMode] = useState('2d');
  const [bodyMap, setBodyMap] = useState(null);
  const [bodyMapView, setBodyMapView] = useState('2d');
  const [error, setError] = useState('');

  // Accordion state for dossier sections in modal
  const [accordion, setAccordion] = useState({
    definition: true,
    causes: true,
    symptoms: true,
    drugs: true,
  });

  function toggleAccordion(section) {
    setAccordion((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  // 'all' means "show everything, no profile filter"
  const apiProfile = bodyProfile && bodyProfile !== 'all' ? bodyProfile : undefined;

  useEffect(() => {
    if (bodyProfile === null) return;
    api
      .listSystems(apiProfile)
      .then((data) => setSystems(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message));
  }, [bodyProfile]);

  useEffect(() => {
    if (bodyProfile === null) return;
    api
      .listEntries(activeSystem, apiProfile)
      .then((data) => setEntries(Array.isArray(data) ? data : []))
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
    if (activeSystem === organ) {
      setActiveSystem('');
    } else {
      setActiveSystem(organ);
      document.getElementById('entry-grid-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function openEntry(entry) {
    setSelected(entry);
    setActiveLabel(null);
    setViewMode(entry.modelUrl ? '3d' : entry.imageUrl ? '2d' : 'video');
    // Open all available sections by default
    setAccordion({
      definition: true,
      causes: true,
      symptoms: true,
      drugs: true,
    });
  }

  if (bodyProfile === null) {
    return (
      <div className="profile-picker">
        <p className="eyebrow">World Medicine</p>
        <h2>Интерактивный атлас анатомии</h2>
        <p className="section-dek">Выберите профиль тела для просмотра анатомических структур и патологий:</p>
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
    <div className="atlas-container">
      {/* Top Profile & Filter Navigation Bar */}
      <div className="atlas-top-bar">
        <div className="profile-pills">
          <span className="profile-pills-label">Профиль:</span>
          {PROFILES.map((p) => (
            <button
              key={p.id}
              className={`profile-pill ${bodyProfile === p.id ? 'active' : ''}`}
              onClick={() => { setBodyProfile(p.id); setActiveSystem(''); }}
            >
              {p.label}
            </button>
          ))}
          <button
            className={`profile-pill ${bodyProfile === 'all' ? 'active' : ''}`}
            onClick={() => { setBodyProfile('all'); setActiveSystem(''); }}
          >
            Все
          </button>
        </div>

        <div className="system-status-badge">
          {activeSystem ? (
            <div className="active-filter">
              <span>Орган: <strong>{activeSystem}</strong> ({entries.length} патологий)</span>
              <button className="reset-filter-btn" onClick={() => setActiveSystem('')}>✕ Сбросить</button>
            </div>
          ) : (
            <span className="hint-text">💡 Наведите курсор на орган на теле и кликните для фильтрации</span>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {/* Center Interactive Body Map View */}
      {bodyMap && (bodyMap.imageUrl || bodyMap.modelUrl) && (
        <div className="bodymap-panel">
          <div className="bodymap-header">
            <div className="bodymap-title">
              <h2>Интерактивная карта тела</h2>
              <span className="bodymap-subtitle">Наведите курсор на орган на теле для просмотра названия</span>
            </div>
            {bodyMap.imageUrl && bodyMap.modelUrl && (
              <div className="view-toggle">
                <button className={bodyMapView === '2d' ? 'active' : ''} onClick={() => setBodyMapView('2d')}>2D Карта</button>
                <button className={bodyMapView === '3d' ? 'active' : ''} onClick={() => setBodyMapView('3d')}>3D Тело</button>
              </div>
            )}
          </div>

          {bodyMapView === '3d' && bodyMap.modelUrl ? (
            <Model3DViewer
              src={resolveImageUrl(bodyMap.modelUrl)}
              hotspots={(bodyMap.labels3d || []).map((l) => ({ ...l, text: l.organ }))}
              onHotspotClick={(l) => goToOrgan(l.organ)}
              height={460}
            />
          ) : (
            bodyMap.imageUrl && (
              <div className="bodymap-interactive-wrap">
                <div className="image-with-labels bodymap-image">
                  <img src={resolveImageUrl(bodyMap.imageUrl)} alt="Карта тела" />
                  {(bodyMap.labels || []).map((l, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`organ-marker ${activeSystem === l.organ ? 'active' : ''}`}
                      style={{ left: `${l.x}%`, top: `${l.y}%` }}
                      onClick={() => goToOrgan(l.organ)}
                      aria-label={l.organ}
                    >
                      <span className="organ-marker-dot" />
                      <span className="organ-marker-ring" />
                      <span className="organ-tooltip">{l.organ}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Disease / Pathologies Grid Anchor */}
      <div id="entry-grid-anchor" />

      <div className="entries-section-header">
        <h3>
          {activeSystem ? `Патологии органа: ${activeSystem}` : 'Все патологии и нозологии'}
          <span className="entries-count">({entries.length})</span>
        </h3>
      </div>

      {entries.length === 0 && !error && (
        <p className="empty">Пока нет записей для выбранного органа.</p>
      )}

      <div className="entry-grid">
        {entries.map((entry) => (
          <button
            key={entry.id}
            className="entry-card"
            onClick={() => openEntry(entry)}
          >
            {entry.imageUrl ? (
              <img src={resolveImageUrl(entry.imageUrl)} alt={entry.title} />
            ) : (
              <div className="no-image">{entry.modelUrl ? '3D-модель' : entry.videoUrl ? 'Видео' : 'Нет изображения'}</div>
            )}
            {entry.modelUrl && <span className="model3d-badge" title="Доступна интерактивная 3D-модель">3D</span>}
            {entry.videoUrl && <span className="video-badge" title="Есть видео">▶</span>}
            <span className="entry-system-badge">{entry.system}</span>
            <span className="entry-title-text">{entry.title}</span>
          </button>
        ))}
      </div>

      {/* 2-Column Dossier Detail Modal */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setSelected(null)} aria-label="Закрыть">×</button>
            
            <div className="modal-header-section">
              <span className="system-tag">{selected.system}</span>
              <h2>{selected.title}</h2>
            </div>

            <div className="modal-split-layout">
              {/* Left Column: Visual Media (3D Model / 2D Diagram / Video) */}
              <div className="modal-media-col">
                {(() => {
                  const modes = [
                    selected.imageUrl && '2d',
                    selected.modelUrl && '3d',
                    selected.videoUrl && 'video',
                  ].filter(Boolean);
                  const labels = { '2d': '2D Схема', '3d': '3D Модель', video: 'Видео' };
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
                    height={400}
                  />
                ) : viewMode === 'video' && selected.videoUrl ? (
                  <video
                    src={resolveImageUrl(selected.videoUrl)}
                    controls
                    style={{ width: '100%', borderRadius: '10px', display: 'block' }}
                  />
                ) : (
                  selected.imageUrl && (
                    <div className="modal-image-preview">
                      <img src={resolveImageUrl(selected.imageUrl)} alt={selected.title} />
                    </div>
                  )
                )}
                {activeLabel && <p className="label-text">Выбрана зона: <strong>{activeLabel.text}</strong></p>}
              </div>

              {/* Right Column: Accordion Sections (Определение, Причины, Симптомы, Препараты) */}
              <div className="modal-dossier-col">
                <div className="accordion-list">
                  {/* Определение */}
                  {selected.definition && (
                    <div className={`accordion-card ${accordion.definition ? 'open' : ''}`}>
                      <button
                        type="button"
                        className="accordion-header"
                        onClick={() => toggleAccordion('definition')}
                      >
                        <div className="accordion-title-wrap">
                          <span className="accordion-icon">📖</span>
                          <span className="accordion-title">Определение</span>
                        </div>
                        <span className="accordion-arrow">{accordion.definition ? '▲' : '▼'}</span>
                      </button>
                      {accordion.definition && (
                        <div className="accordion-content">
                          <p>{selected.definition}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Причины */}
                  {selected.causes && (
                    <div className={`accordion-card ${accordion.causes ? 'open' : ''}`}>
                      <button
                        type="button"
                        className="accordion-header"
                        onClick={() => toggleAccordion('causes')}
                      >
                        <div className="accordion-title-wrap">
                          <span className="accordion-icon">🧬</span>
                          <span className="accordion-title">Причины</span>
                        </div>
                        <span className="accordion-arrow">{accordion.causes ? '▲' : '▼'}</span>
                      </button>
                      {accordion.causes && (
                        <div className="accordion-content">
                          <p>{selected.causes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Симптомы */}
                  {selected.symptoms && (
                    <div className={`accordion-card ${accordion.symptoms ? 'open' : ''}`}>
                      <button
                        type="button"
                        className="accordion-header"
                        onClick={() => toggleAccordion('symptoms')}
                      >
                        <div className="accordion-title-wrap">
                          <span className="accordion-icon">🩺</span>
                          <span className="accordion-title">Симптомы</span>
                        </div>
                        <span className="accordion-arrow">{accordion.symptoms ? '▲' : '▼'}</span>
                      </button>
                      {accordion.symptoms && (
                        <div className="accordion-content">
                          <p>{selected.symptoms}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Препараты World Medicine */}
                  {selected.recommendedDrugs && selected.recommendedDrugs.length > 0 && (
                    <div className={`accordion-card ${accordion.drugs ? 'open' : ''}`}>
                      <button
                        type="button"
                        className="accordion-header"
                        onClick={() => toggleAccordion('drugs')}
                      >
                        <div className="accordion-title-wrap">
                          <span className="accordion-icon">💊</span>
                          <span className="accordion-title">
                            Препараты World Medicine ({selected.recommendedDrugs.length})
                          </span>
                        </div>
                        <span className="accordion-arrow">{accordion.drugs ? '▲' : '▼'}</span>
                      </button>
                      {accordion.drugs && (
                        <div className="accordion-content">
                          <div className="drug-cards-grid">
                            {selected.recommendedDrugs.map((drug, i) => (
                              <div key={i} className="drug-badge-card">
                                <span className="drug-icon">💊</span>
                                <span className="drug-name">{drug}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
