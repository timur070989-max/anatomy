import { useEffect, useState, useMemo, useRef } from 'react';
import { api, resolveImageUrl } from './api';
import { translations, getTranslatedOrgan } from './i18n';
import Model3DViewer from './Model3DViewer';
import Schema2DViewer from './Schema2DViewer';

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
    .replace(/\s+/g, ' ')
    .trim();
}

export default function AtlasView({ lang = 'ru' }) {
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

  const t = translations[lang] || translations.ru;

  const PROFILES = [
    { id: 'male', label: t.male },
    { id: 'female', label: t.female },
    { id: 'child', label: t.child },
  ];

  const bodyMapWrapRef = useRef(null);
  const [hoveredBodyOrgan, setHoveredBodyOrgan] = useState(null);
  const [bodyCursorPos, setBodyCursorPos] = useState(null);

  function handleBodyMapPointerMove(e) {
    const container = bodyMapWrapRef.current;
    if (!container || !bodyMap?.labels) return;

    const rect = container.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    setBodyCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    let closest = null;
    let minDist = Infinity;

    (bodyMap.labels || []).forEach((l) => {
      const dx = l.x - xPct;
      const dy = l.y - yPct;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist && dist < 12) {
        minDist = dist;
        closest = l;
      }
    });

    setHoveredBodyOrgan(closest);
  }

  function handleBodyMapPointerLeave() {
    setHoveredBodyOrgan(null);
    setBodyCursorPos(null);
  }

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
    setOpenAccordion('definition');
  }

  // Filter entries by search query
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase().trim();
    return entries.filter((e) => {
      const title = (lang === 'uz' && e.titleUz ? e.titleUz : e.title).toLowerCase();
      const system = (lang === 'uz' && e.systemUz ? e.systemUz : e.system || '').toLowerCase();
      const drugs = (e.recommendedDrugs || []).join(' ').toLowerCase();
      return title.includes(q) || system.includes(q) || drugs.includes(q);
    });
  }, [entries, searchQuery, lang]);

  function getEntryTitle(entry) {
    if (!entry) return '';
    return lang === 'uz' && entry.titleUz ? entry.titleUz : entry.title;
  }

  function getEntrySystem(entry) {
    if (!entry) return '';
    if (lang === 'uz' && entry.systemUz) return entry.systemUz;
    return getTranslatedOrgan(entry.system, lang);
  }

  function getEntryDefinition(entry) {
    if (!entry) return '';
    return lang === 'uz' && entry.definitionUz ? entry.definitionUz : entry.definition;
  }

  function getEntryCauses(entry) {
    if (!entry) return '';
    return lang === 'uz' && entry.causesUz ? entry.causesUz : entry.causes;
  }

  function getEntrySymptoms(entry) {
    if (!entry) return '';
    return lang === 'uz' && entry.symptomsUz ? entry.symptomsUz : entry.symptoms;
  }

  if (bodyProfile === null) {
    return (
      <div className="profile-picker">
        <p className="eyebrow">World Medicine</p>
        <h2>{t.appTitle}</h2>
        <div className="profile-grid">
          {PROFILES.map((p) => (
            <button key={p.id} className="profile-card" onClick={() => setBodyProfile(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="atlas-container">
      {/* Top Profile & Filter Navigation Bar */}
      <div className="atlas-top-bar">
        <div className="profile-pills">
          <span className="profile-pills-label">{t.profile}</span>
          {PROFILES.map((p) => (
            <button
              key={p.id}
              className={`profile-pill ${bodyProfile === p.id ? 'active' : ''}`}
              onClick={() => { setBodyProfile(p.id); setActiveSystem(''); setSearchQuery(''); }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="system-status-badge">
          {activeSystem ? (
            <div className="active-filter">
              <span>{t.organLabel} <strong>{getTranslatedOrgan(activeSystem, lang)}</strong> ({entries.length} {t.pathologiesCount})</span>
              <button className="reset-filter-btn" onClick={() => { setActiveSystem(''); setSearchQuery(''); }}>
                {t.showAllOrgans}
              </button>
            </div>
          ) : (
            <span className="hint-text">💡 {t.scannerHint}</span>
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
                <h2>{t.bodyMapTitle}</h2>
                <span className="bodymap-subtitle">{t.bodyMapSubtitle}</span>
              </div>
              {bodyMap?.imageUrl && bodyMap?.modelUrl && (
                <div className="view-toggle">
                  <button className={bodyMapView === '2d' ? 'active' : ''} onClick={() => setBodyMapView('2d')}>{t.view2D}</button>
                  <button className={bodyMapView === '3d' ? 'active' : ''} onClick={() => setBodyMapView('3d')}>{t.view3D}</button>
                </div>
              )}
            </div>

            {bodyMapView === '3d' && bodyMap?.modelUrl ? (
              <Model3DViewer
                src={resolveImageUrl(bodyMap.modelUrl)}
                hotspots={(bodyMap.labels3d || []).map((l) => ({ ...l, text: getTranslatedOrgan(l.organ, lang) }))}
                onHotspotClick={(l) => goToOrgan(l.organ)}
                height={520}
              />
            ) : (
              bodyMap?.imageUrl && (
                <div
                  ref={bodyMapWrapRef}
                  className="bodymap-interactive-wrap"
                  onPointerMove={handleBodyMapPointerMove}
                  onPointerLeave={handleBodyMapPointerLeave}
                  onClick={() => {
                    if (hoveredBodyOrgan) goToOrgan(hoveredBodyOrgan.organ);
                  }}
                >
                  <div className="image-with-labels bodymap-image">
                    <img src={resolveImageUrl(bodyMap.imageUrl)} alt="Карта тела" />

                    {/* Show glowing marker ONLY for the specific organ under cursor or currently active filter */}
                    {(bodyMap.labels || []).map((l, i) => {
                      const isHovered = hoveredBodyOrgan && hoveredBodyOrgan.organ === l.organ;
                      const isActive = activeSystem === l.organ;

                      if (!isHovered && !isActive) return null;

                      return (
                        <button
                          key={i}
                          type="button"
                          className={`organ-marker ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
                          style={{ left: `${l.x}%`, top: `${l.y}%` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            goToOrgan(l.organ);
                          }}
                          aria-label={l.organ}
                        >
                          <span className="organ-marker-dot" />
                          <span className="organ-marker-ring" />
                          <span className="organ-tooltip">{getTranslatedOrgan(l.organ, lang)}</span>
                        </button>
                      );
                    })}

                    {/* Scanner Live Reticle & Floating HUD Tooltip */}
                    {hoveredBodyOrgan && bodyCursorPos && (
                      <div
                        className="scanner-live-tooltip"
                        style={{
                          left: `${bodyCursorPos.x + 12}px`,
                          top: `${bodyCursorPos.y + 12}px`,
                        }}
                      >
                        <span className="scanner-dot" />
                        <span className="scanner-text">{getTranslatedOrgan(hoveredBodyOrgan.organ, lang)}</span>
                      </div>
                    )}
                  </div>

                  <div className="bodymap-scanner-hint">
                    <span>{t.scannerHint}</span>
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
                      <span>{t.pathologiesForOrgan} </span>
                      <span className="active-organ-title">{getTranslatedOrgan(activeSystem, lang)}</span>
                    </>
                  ) : (
                    <span>{t.allPathologiesTitle}</span>
                  )}
                  <span className="count-pill">{filteredEntries.length}</span>
                </h3>
                <span className="pathology-subtitle">{t.selectDiseaseToOpen}</span>
              </div>

              {/* Quick Search inside this organ */}
              <div className="pathology-search-box">
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
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
                  <p>{t.notFound}{searchQuery ? ` «${searchQuery}»` : ''}.</p>
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
                        <span className="pathology-name">{cleanHtmlText(getEntryTitle(entry))}</span>
                        <div className="pathology-item-badges">
                          {entry.modelUrl && (
                            <span className="badge-2d badge-3d" title={t.model3DTab}>
                              <svg className="badge-svg-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                              3D
                            </span>
                          )}
                          {entry.videoUrl && (
                            <span className="badge-2d badge-video" title={t.videoTab}>
                              <svg className="badge-svg-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                              Video
                            </span>
                          )}
                          {entry.xrayUrl && (
                            <span className="badge-2d badge-xray" title={t.xrayTab}>
                              <svg className="badge-svg-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
                              X-Ray
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="pathology-item-sub">
                        <span className="pathology-organ-tag">{getEntrySystem(entry)}</span>
                        {entry.recommendedDrugs && entry.recommendedDrugs.length > 0 && (
                          <span className="pathology-drugs-count">
                            <svg className="badge-svg-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 4}}><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
                            {entry.recommendedDrugs.length} {t.wmDrugsPrefix}
                          </span>
                        )}
                      </div>
                    </div>
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
              <span className="system-tag">{getEntrySystem(selected)}</span>
              <h2>{cleanHtmlText(getEntryTitle(selected))}</h2>
            </div>

            <div className="modal-split-layout">
              {/* Left Column: Visual Media (2D Схема, 3D Модель, 🎬 Анимационное видео, 🩻 Рентген) */}
              <div className="modal-media-col">
                <div className="view-toggle modal-view-toggle">
                  <button
                    type="button"
                    className={viewMode === '2d' ? 'active' : ''}
                    onClick={() => setViewMode('2d')}
                    title={t.schema2DTab}
                  >
                    <svg className="tab-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    {t.schema2DTab}
                  </button>
                  <button
                    type="button"
                    className={viewMode === '3d' ? 'active' : ''}
                    onClick={() => setViewMode('3d')}
                    disabled={!selected.modelUrl}
                    style={!selected.modelUrl ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                    title={selected.modelUrl ? t.model3DTab : '3D-модель не привязана'}
                  >
                    <svg className="tab-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                    {t.model3DTab}
                  </button>
                  <button
                    type="button"
                    className={`video-tab-btn ${viewMode === 'video' ? 'active' : ''} ${!selected.videoUrl ? 'disabled-tab' : ''}`}
                    onClick={() => {
                      if (selected.videoUrl) setViewMode('video');
                    }}
                    disabled={!selected.videoUrl}
                    style={!selected.videoUrl ? { opacity: 0.40, cursor: 'not-allowed', filter: 'grayscale(0.8)' } : undefined}
                    title={selected.videoUrl ? t.videoTab : t.videoLockedTooltip}
                  >
                    <svg className="tab-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    {t.videoTab}
                    {!selected.videoUrl && (
                      <svg className="tab-svg-icon" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 4 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    )}
                  </button>
                  {selected.xrayUrl && (
                    <button
                      type="button"
                      className={`xray-tab-btn ${viewMode === 'xray' ? 'active' : ''}`}
                      onClick={() => setViewMode('xray')}
                      title={t.xrayTab}
                    >
                      <svg className="tab-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
                      {t.xrayTab}
                    </button>
                  )}
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
                      <span>{t.videoTab}: <strong>{cleanHtmlText(getEntryTitle(selected))}</strong></span>
                    </div>
                  </div>
                ) : viewMode === 'xray' && selected.xrayUrl ? (
                  <div className="pathology-xray-box">
                    <img
                      src={resolveImageUrl(selected.xrayUrl)}
                      alt={`${t.xrayTab}: ${selected.title}`}
                      className="pathology-xray-img"
                    />
                    <div className="xray-info-badge">
                      <span>{t.xrayTab}: <strong>{cleanHtmlText(getEntryTitle(selected))}</strong></span>
                    </div>
                  </div>
                ) : (
                  <Schema2DViewer
                    src={resolveImageUrl(selected.imageUrl)}
                    title={getEntryTitle(selected)}
                    labels={selected.labels || []}
                    activeLabel={activeLabel}
                    onSelectLabel={(label) => setActiveLabel(label)}
                    height={400}
                  />
                )}
                {activeLabel && <p className="label-text">Выбрана зона: <strong>{activeLabel.text}</strong></p>}
              </div>

              {/* Right Column: Accordion Sections */}
              <div className="modal-dossier-col">
                <div className="accordion-list">
                  {/* Определение / Ta'rif */}
                  {getEntryDefinition(selected) && (
                    <div className={`accordion-card ${openAccordion === 'definition' ? 'open' : ''}`}>
                      <button
                        type="button"
                        className="accordion-header"
                        onClick={() => toggleAccordion('definition')}
                      >
                        <div className="accordion-title-wrap">
                          <svg className="acc-svg-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                          <span className="accordion-title">{t.definition}</span>
                        </div>
                        <span className="accordion-arrow">{openAccordion === 'definition' ? '▲' : '▼'}</span>
                      </button>
                      {openAccordion === 'definition' && (
                        <div className="accordion-content">
                          <p>{cleanHtmlText(getEntryDefinition(selected))}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Причины / Sabablari */}
                  {getEntryCauses(selected) && (
                    <div className={`accordion-card ${openAccordion === 'causes' ? 'open' : ''}`}>
                      <button
                        type="button"
                        className="accordion-header"
                        onClick={() => toggleAccordion('causes')}
                      >
                        <div className="accordion-title-wrap">
                          <svg className="acc-svg-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                          <span className="accordion-title">{t.causes}</span>
                        </div>
                        <span className="accordion-arrow">{openAccordion === 'causes' ? '▲' : '▼'}</span>
                      </button>
                      {openAccordion === 'causes' && (
                        <div className="accordion-content">
                          <p>{cleanHtmlText(getEntryCauses(selected))}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Симптомы / Belgilari */}
                  {getEntrySymptoms(selected) && (
                    <div className={`accordion-card ${openAccordion === 'symptoms' ? 'open' : ''}`}>
                      <button
                        type="button"
                        className="accordion-header"
                        onClick={() => toggleAccordion('symptoms')}
                      >
                        <div className="accordion-title-wrap">
                          <svg className="acc-svg-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                          <span className="accordion-title">{t.symptoms}</span>
                        </div>
                        <span className="accordion-arrow">{openAccordion === 'symptoms' ? '▲' : '▼'}</span>
                      </button>
                      {openAccordion === 'symptoms' && (
                        <div className="accordion-content">
                          <p>{cleanHtmlText(getEntrySymptoms(selected))}</p>
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
                          <svg className="acc-svg-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
                          <span className="accordion-title">
                            {t.recommendedDrugs} ({selected.recommendedDrugs.length})
                          </span>
                        </div>
                        <span className="accordion-arrow">{openAccordion === 'drugs' ? '▲' : '▼'}</span>
                      </button>
                      {openAccordion === 'drugs' && (
                        <div className="accordion-content">
                          <div className="drug-cards-grid">
                            {selected.recommendedDrugs.map((drug, i) => (
                              <div key={i} className="drug-badge-card">
                                <svg className="badge-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
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
