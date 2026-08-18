import { useEffect, useState, useMemo } from 'react';
import { api, resolveImageUrl } from './api';
import Model3DViewer from './Model3DViewer';

const PROFILES = [
  { id: 'male', label: 'Мужчина' },
  { id: 'female', label: 'Женщина' },
  { id: 'child', label: 'Ребёнок' },
];

function cleanHtmlText(text) {
  if (!text) return '';
  return text
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&hellip;/g, '...')
    .replace(/&amp;/g, '&')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

export default function AtlasView() {
  const [bodyProfile, setBodyProfile] = useState('male');
  const [systems, setSystems] = useState([]);
  const [activeSystem, setActiveSystem] = useState('');
  const [entries, setEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [activeLabel, setActiveLabel] = useState(null);
  const [viewMode, setViewMode] = useState('3d');
  const [bodyMap, setBodyMap] = useState(null);
  const [bodyMapView, setBodyMapView] = useState('2d');
  const [error, setError] = useState('');

  // Single active accordion section: only one open at any time
  const [openAccordion, setOpenAccordion] = useState('definition');

  function toggleAccordion(section) {
    setOpenAccordion((prev) => (prev === section ? '' : section));
  }

  function getYoutubeEmbedUrl(url) {
    if (!url) return null;
    if (url.includes('youtube.com/embed/')) return url;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`;
    }
    return null;
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
      setSearchQuery('');
    }
  }

  function openEntry(entry) {
    setSelected(entry);
    setActiveLabel(null);
    setViewMode(entry.modelUrl ? '3d' : entry.imageUrl ? '2d' : 'video');
    // Open only 'definition' accordion by default
    setOpenAccordion('definition');
  }

  // Filter entries by search query
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase().trim();
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.system && e.system.toLowerCase().includes(q)) ||
        (e.recommendedDrugs && e.recommendedDrugs.some((d) => d.toLowerCase().includes(q)))
    );
  }, [entries, searchQuery]);

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
              onClick={() => { setBodyProfile(p.id); setActiveSystem(''); setSearchQuery(''); }}
            >
              {p.label}
            </button>
          ))}
          <button
            className={`profile-pill ${bodyProfile === 'all' ? 'active' : ''}`}
            onClick={() => { setBodyProfile('all'); setActiveSystem(''); setSearchQuery(''); }}
          >
            Все
          </button>
        </div>

        <div className="system-status-badge">
          {activeSystem ? (
            <div className="active-filter">
              <span>Орган: <strong>{activeSystem}</strong> ({entries.length} патологий)</span>
              <button className="reset-filter-btn" onClick={() => { setActiveSystem(''); setSearchQuery(''); }}>
                ✕ Показать все органы
              </button>
            </div>
          ) : (
            <span className="hint-text">💡 Кликните по любому органу на теле для фильтрации</span>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {/* Main 2-Pane Side-by-Side Studio Layout */}
      <div className="atlas-main-split">
        {/* Left Pane: Interactive Body Map */}
        <div className="atlas-body-pane">
          <div className="pane-card bodymap-card">
            <div className="bodymap-header">
              <div className="bodymap-title">
                <h2>Карта тела</h2>
                <span className="bodymap-subtitle">Наведите курсор и нажмите на орган</span>
              </div>
              {bodyMap?.imageUrl && bodyMap?.modelUrl && (
                <div className="view-toggle">
                  <button className={bodyMapView === '2d' ? 'active' : ''} onClick={() => setBodyMapView('2d')}>2D Карта</button>
                  <button className={bodyMapView === '3d' ? 'active' : ''} onClick={() => setBodyMapView('3d')}>3D Тело</button>
                </div>
              )}
            </div>

            {bodyMapView === '3d' && bodyMap?.modelUrl ? (
              <Model3DViewer
                src={resolveImageUrl(bodyMap.modelUrl)}
                hotspots={(bodyMap.labels3d || []).map((l) => ({ ...l, text: l.organ }))}
                onHotspotClick={(l) => goToOrgan(l.organ)}
                height={520}
              />
            ) : (
              bodyMap?.imageUrl && (
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
        </div>

        {/* Right Pane: Pathology Buttons Stack */}
        <div className="atlas-pathology-pane">
          <div className="pane-card pathology-stack-card">
            <div className="pathology-stack-header">
              <div className="stack-title-wrap">
                <h3>
                  {activeSystem ? (
                    <>
                      <span>Патологии: </span>
                      <span className="active-organ-title">{activeSystem}</span>
                    </>
                  ) : (
                    <span>Все нозологии и патологии</span>
                  )}
                  <span className="count-pill">{filteredEntries.length}</span>
                </h3>
              </div>

              {/* Quick Search inside this organ */}
              <div className="pathology-search-box">
                <input
                  type="text"
                  placeholder="Поиск патологии или симптома..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pathology-search-input"
                />
                {searchQuery && (
                  <button className="search-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
                )}
              </div>
            </div>

            {/* Pathology Buttons Vertical Stack */}
            <div className="pathology-stack-list">
              {filteredEntries.length === 0 ? (
                <div className="empty-pathology-state">
                  <span className="empty-icon">🔍</span>
                  <p>Ничего не найдено{searchQuery ? ` по запросу «${searchQuery}»` : ''}.</p>
                </div>
              ) : (
                filteredEntries.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className="pathology-button-item"
                    onClick={() => openEntry(entry)}
                  >
                    <div className="pathology-item-main">
                      <div className="pathology-item-title-row">
                        <span className="pathology-name">{cleanHtmlText(entry.title)}</span>
                        <div className="pathology-item-badges">
                          {entry.modelUrl && (
                            <span className="badge-3d" title="Доступна интерактивная 3D-модель органа">3D</span>
                          )}
                          {entry.videoUrl && (
                            <span className="badge-video" title="Доступно анимационное видео патологии">🎬 Видео</span>
                          )}
                        </div>
                      </div>
                      <div className="pathology-item-sub">
                        <span className="pathology-organ-tag">{entry.system}</span>
                        {entry.recommendedDrugs && entry.recommendedDrugs.length > 0 && (
                          <span className="pathology-drugs-count">
                            💊 {entry.recommendedDrugs.length} преп. World Medicine
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="pathology-arrow">→</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Dossier Detail Modal */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setSelected(null)} aria-label="Закрыть">×</button>
            
            <div className="modal-header-section">
              <span className="system-tag">{selected.system}</span>
              <h2>{cleanHtmlText(selected.title)}</h2>
            </div>

            <div className="modal-split-layout">
              {/* Left Column: Visual Media (2D Схема, 3D Модель, 🎬 Анимационное видео) */}
              <div className="modal-media-col">
                <div className="view-toggle modal-view-toggle">
                  <button
                    type="button"
                    className={viewMode === '2d' ? 'active' : ''}
                    onClick={() => setViewMode('2d')}
                    title="2D анатомическая схема"
                  >
                    🖼️ 2D Схема
                  </button>
                  <button
                    type="button"
                    className={viewMode === '3d' ? 'active' : ''}
                    onClick={() => setViewMode('3d')}
                    disabled={!selected.modelUrl}
                    style={!selected.modelUrl ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                    title={selected.modelUrl ? 'Интерактивная 3D-модель органа' : '3D-модель не привязана'}
                  >
                    🧊 3D Модель
                  </button>
                  <button
                    type="button"
                    className={`video-tab-btn ${viewMode === 'video' ? 'active' : ''} ${!selected.videoUrl ? 'disabled-tab' : ''}`}
                    onClick={() => {
                      if (selected.videoUrl) setViewMode('video');
                    }}
                    disabled={!selected.videoUrl}
                    style={!selected.videoUrl ? { opacity: 0.40, cursor: 'not-allowed', filter: 'grayscale(0.8)' } : undefined}
                    title={selected.videoUrl ? 'Смотреть анимационное видео патологии' : 'Анимационное видео не прикреплено в админ-панели'}
                  >
                    🎬 Анимационное видео {selected.videoUrl ? '' : '🔒'}
                  </button>
                </div>

                {viewMode === '3d' && selected.modelUrl ? (
                  <Model3DViewer
                    src={resolveImageUrl(selected.modelUrl)}
                    hotspots={selected.labels3d || []}
                    onHotspotClick={(label) => setActiveLabel(label)}
                    height={400}
                  />
                ) : viewMode === 'video' && selected.videoUrl ? (
                  <div className="pathology-video-player-box">
                    {getYoutubeEmbedUrl(selected.videoUrl) ? (
                      <iframe
                        src={getYoutubeEmbedUrl(selected.videoUrl)}
                        title={selected.title}
                        className="pathology-video-player"
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        key={selected.videoUrl}
                        src={resolveImageUrl(selected.videoUrl)}
                        controls
                        autoPlay
                        playsInline
                        className="pathology-video-player"
                      />
                    )}
                    <div className="video-player-info-badge">
                      <span className="video-rec-dot" />
                      <span>Анимация патологии: <strong>{cleanHtmlText(selected.title)}</strong></span>
                    </div>
                  </div>
                ) : (
                  selected.imageUrl ? (
                    <div className="modal-image-preview">
                      <img src={resolveImageUrl(selected.imageUrl)} alt={selected.title} />
                    </div>
                  ) : selected.modelUrl ? (
                    <Model3DViewer
                      src={resolveImageUrl(selected.modelUrl)}
                      hotspots={selected.labels3d || []}
                      height={400}
                    />
                  ) : (
                    <div className="modal-image-preview">
                      <p>Изображение подготавливается</p>
                    </div>
                  )
                )}
                {activeLabel && <p className="label-text">Выбрана зона: <strong>{activeLabel.text}</strong></p>}
              </div>

              {/* Right Column: Accordion Sections (Single-accordion mode: only one open at a time) */}
              <div className="modal-dossier-col">
                <div className="accordion-list">
                  {/* Определение */}
                  {selected.definition && (
                    <div className={`accordion-card ${openAccordion === 'definition' ? 'open' : ''}`}>
                      <button
                        type="button"
                        className="accordion-header"
                        onClick={() => toggleAccordion('definition')}
                      >
                        <div className="accordion-title-wrap">
                          <span className="accordion-icon">📖</span>
                          <span className="accordion-title">Определение</span>
                        </div>
                        <span className="accordion-arrow">{openAccordion === 'definition' ? '▲' : '▼'}</span>
                      </button>
                      {openAccordion === 'definition' && (
                        <div className="accordion-content">
                          <p>{cleanHtmlText(selected.definition)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Причины */}
                  {selected.causes && (
                    <div className={`accordion-card ${openAccordion === 'causes' ? 'open' : ''}`}>
                      <button
                        type="button"
                        className="accordion-header"
                        onClick={() => toggleAccordion('causes')}
                      >
                        <div className="accordion-title-wrap">
                          <span className="accordion-icon">🧬</span>
                          <span className="accordion-title">Причины</span>
                        </div>
                        <span className="accordion-arrow">{openAccordion === 'causes' ? '▲' : '▼'}</span>
                      </button>
                      {openAccordion === 'causes' && (
                        <div className="accordion-content">
                          <p>{cleanHtmlText(selected.causes)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Симптомы */}
                  {selected.symptoms && (
                    <div className={`accordion-card ${openAccordion === 'symptoms' ? 'open' : ''}`}>
                      <button
                        type="button"
                        className="accordion-header"
                        onClick={() => toggleAccordion('symptoms')}
                      >
                        <div className="accordion-title-wrap">
                          <span className="accordion-icon">🩺</span>
                          <span className="accordion-title">Симптомы</span>
                        </div>
                        <span className="accordion-arrow">{openAccordion === 'symptoms' ? '▲' : '▼'}</span>
                      </button>
                      {openAccordion === 'symptoms' && (
                        <div className="accordion-content">
                          <p>{cleanHtmlText(selected.symptoms)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Препараты World Medicine */}
                  {selected.recommendedDrugs && selected.recommendedDrugs.length > 0 && (
                    <div className={`accordion-card ${openAccordion === 'drugs' ? 'open' : ''}`}>
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
                        <span className="accordion-arrow">{openAccordion === 'drugs' ? '▲' : '▼'}</span>
                      </button>
                      {openAccordion === 'drugs' && (
                        <div className="accordion-content">
                          <div className="drug-cards-grid">
                            {selected.recommendedDrugs.map((drug, i) => (
                              <div key={i} className="drug-badge-card">
                                <span className="drug-icon">💊</span>
                                <span className="drug-name">{cleanHtmlText(drug)}</span>
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
