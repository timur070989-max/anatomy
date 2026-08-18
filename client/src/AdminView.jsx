import { useEffect, useRef, useState } from 'react';
import { api, resolveImageUrl } from './api';
import { translations, getTranslatedOrgan } from './i18n';
import Model3DViewer from './Model3DViewer';

const BODY_PROFILE_OPTIONS = [
  { value: 'male', label: 'Мужской (Взрослый) / Erkak' },
  { value: 'female', label: 'Женский (Взрослая) / Ayol' },
  { value: 'child', label: 'Детский / Bola' },
  { value: 'any', label: 'Любой (Общий) / Umumiy' },
];

const emptyForm = {
  title: '',
  titleUz: '',
  system: '',
  systemUz: '',
  bodyProfile: 'any',
  definition: '',
  definitionUz: '',
  causes: '',
  causesUz: '',
  symptoms: '',
  symptomsUz: '',
};

export default function AdminView({ lang = 'ru' }) {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formLang, setFormLang] = useState('ru'); // 'ru' | 'uz'

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [labels, setLabels] = useState([]);
  const [modelFile, setModelFile] = useState(null);
  const [modelPreview, setModelPreview] = useState(null);
  const [labels3d, setLabels3d] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [xrayFile, setXrayFile] = useState(null);
  const [xrayPreview, setXrayPreview] = useState(null);
  const [drugs, setDrugs] = useState([]);
  const [drugInput, setDrugInput] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const previewRef = useRef(null);

  const t = translations[lang] || translations.ru;

  function refresh() {
    api.listEntries().then(setEntries).catch((e) => setError(e.message));
  }

  useEffect(() => {
    refresh();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
    setLabels([]);
    setModelFile(null);
    setModelPreview(null);
    setLabels3d([]);
    setVideoFile(null);
    setVideoPreview(null);
    setXrayFile(null);
    setXrayPreview(null);
    setDrugs([]);
    setDrugInput('');
  }

  function startEdit(entry) {
    setEditingId(entry.id);
    setForm({
      title: entry.title || '',
      titleUz: entry.titleUz || '',
      system: entry.system || '',
      systemUz: entry.systemUz || '',
      bodyProfile: entry.bodyProfile || 'any',
      definition: entry.definition || '',
      definitionUz: entry.definitionUz || '',
      causes: entry.causes || '',
      causesUz: entry.causesUz || '',
      symptoms: entry.symptoms || '',
      symptomsUz: entry.symptomsUz || '',
    });
    setImageFile(null);
    setImagePreview(entry.imageUrl ? resolveImageUrl(entry.imageUrl) : null);
    setLabels(entry.labels || []);
    setModelFile(null);
    setModelPreview(entry.modelUrl ? resolveImageUrl(entry.modelUrl) : null);
    setLabels3d(entry.labels3d || []);
    setVideoFile(null);
    setVideoPreview(entry.videoUrl ? resolveImageUrl(entry.videoUrl) : null);
    setXrayFile(null);
    setXrayPreview(entry.xrayUrl ? resolveImageUrl(entry.xrayUrl) : null);
    setDrugs(entry.recommendedDrugs || []);
    setDrugInput('');
  }

  function onImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setLabels([]);
  }

  function onModelChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setModelFile(file);
    setModelPreview(URL.createObjectURL(file));
    setLabels3d([]);
  }

  function onVideoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  }

  function onXrayChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setXrayFile(file);
    setXrayPreview(URL.createObjectURL(file));
  }

  function onPreviewClick(e) {
    if (!imagePreview) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const text = window.prompt(lang === 'uz' ? 'Belgi uchun matn:' : 'Подпись для метки:');
    if (!text) return;
    setLabels((prev) => [...prev, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, text }]);
  }

  function removeLabel(i) {
    setLabels((prev) => prev.filter((_, idx) => idx !== i));
  }

  function onModelSurfaceClick(point) {
    const text = window.prompt(lang === 'uz' ? 'Modeldagi belgi matni:' : 'Подпись для метки на модели:');
    if (!text) return;
    setLabels3d((prev) => [...prev, { ...point, text }]);
  }

  function removeLabel3d(i) {
    setLabels3d((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addDrug(e) {
    e.preventDefault();
    const trimmed = drugInput.trim();
    if (!trimmed) return;
    if (!drugs.includes(trimmed)) setDrugs([...drugs, trimmed]);
    setDrugInput('');
  }

  function removeDrug(i) {
    setDrugs(drugs.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setStatus('');
    try {
      const payload = {
        ...form,
        labels,
        labels3d,
        recommendedDrugs: drugs,
      };

      if (imageFile) payload.image = imageFile;
      if (modelFile) payload.model = modelFile;
      if (videoFile) payload.video = videoFile;
      else if (videoPreview === null && editingId) payload.videoUrl = '';

      if (xrayFile) payload.xray = xrayFile;
      else if (xrayPreview === null && editingId) payload.xrayUrl = '';

      if (editingId) {
        await api.updateEntry(editingId, payload);
        setStatus('✓ Запись успешно обновлена / Muvaffaqiyatli saqlandi');
      } else {
        await api.createEntry(payload);
        setStatus('✓ Новая патология успешно добавлена / Muvaffaqiyatli qoʻshildi');
      }
      resetForm();
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(lang === 'uz' ? 'Ushbu yozuvni oʻchirishni tasdiqlaysizmi?' : 'Удалить эту запись?')) return;
    try {
      await api.deleteEntry(id);
      if (editingId === id) resetForm();
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="admin">
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-header">
          <h2>{editingId ? t.editEntry : t.createEntry}</h2>
          {/* Form Language Tab (RU / UZ) */}
          <div className="form-lang-toggle">
            <button
              type="button"
              className={`form-lang-btn ${formLang === 'ru' ? 'active' : ''}`}
              onClick={() => setFormLang('ru')}
            >
              🇷🇺 RU
            </button>
            <button
              type="button"
              className={`form-lang-btn ${formLang === 'uz' ? 'active' : ''}`}
              onClick={() => setFormLang('uz')}
            >
              🇺🇿 UZ
            </button>
          </div>
        </div>

        {error && <p className="error">{error}</p>}
        {status && <p className="status-success">{status}</p>}

        {/* Bilingual Fields Switch */}
        {formLang === 'ru' ? (
          <>
            <label>
              {t.titleField}
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Например: Атеросклероз сосудов головного мозга"
              />
            </label>
            <label>
              {t.systemField}
              <input
                value={form.system}
                onChange={(e) => setForm({ ...form, system: e.target.value })}
                placeholder="Например: Мозг, Спиной мозг"
              />
            </label>
            <label>
              {t.definitionField}
              <textarea
                value={form.definition}
                onChange={(e) => setForm({ ...form, definition: e.target.value })}
                rows={3}
              />
            </label>
            <label>
              {t.causesField}
              <textarea
                value={form.causes}
                onChange={(e) => setForm({ ...form, causes: e.target.value })}
                rows={3}
              />
            </label>
            <label>
              {t.symptomsField}
              <textarea
                value={form.symptoms}
                onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                rows={3}
              />
            </label>
          </>
        ) : (
          <>
            <label>
              {t.titleUzField}
              <input
                value={form.titleUz}
                onChange={(e) => setForm({ ...form, titleUz: e.target.value })}
                placeholder="Masalan: Bosh miya qon tomirlari aterosklerozi"
              />
            </label>
            <label>
              {t.systemUzField}
              <input
                value={form.systemUz}
                onChange={(e) => setForm({ ...form, systemUz: e.target.value })}
                placeholder="Masalan: Bosh miya, Orqa miya"
              />
            </label>
            <label>
              {t.definitionUzField}
              <textarea
                value={form.definitionUz}
                onChange={(e) => setForm({ ...form, definitionUz: e.target.value })}
                rows={3}
              />
            </label>
            <label>
              {t.causesUzField}
              <textarea
                value={form.causesUz}
                onChange={(e) => setForm({ ...form, causesUz: e.target.value })}
                rows={3}
              />
            </label>
            <label>
              {t.symptomsUzField}
              <textarea
                value={form.symptomsUz}
                onChange={(e) => setForm({ ...form, symptomsUz: e.target.value })}
                rows={3}
              />
            </label>
          </>
        )}

        <label>
          Профиль тела / Tana profili
          <select value={form.bodyProfile} onChange={(e) => setForm({ ...form, bodyProfile: e.target.value })}>
            {BODY_PROFILE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>

        <label>
          {t.drugsField}
          <div className="drug-input-row">
            <input
              value={drugInput}
              onChange={(e) => setDrugInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addDrug(e); }}
              placeholder="Название препарата / Dori vositasi nomi"
            />
            <button type="button" onClick={addDrug}>+ Добавить</button>
          </div>
        </label>
        {drugs.length > 0 && (
          <ul className="drug-list">
            {drugs.map((d, i) => (
              <li key={i}>
                💊 {d} <button type="button" onClick={() => removeDrug(i)}>✕</button>
              </li>
            ))}
          </ul>
        )}

        <label>
          Изображение / 2D Схема
          <input type="file" accept="image/*" onChange={onImageChange} />
        </label>

        {imagePreview && (
          <div className="preview-wrap">
            <p className="hint">Кликните по картинке, чтобы поставить интерактивную метку</p>
            <div className="image-with-labels" ref={previewRef} onClick={onPreviewClick}>
              <img src={imagePreview} alt="preview" />
              {labels.map((label, i) => (
                <span key={i} className="label-marker" style={{ left: `${label.x}%`, top: `${label.y}%` }} title={label.text}>
                  {i + 1}
                </span>
              ))}
            </div>
            {labels.length > 0 && (
              <ul className="label-list">
                {labels.map((l, i) => (
                  <li key={i}>
                    {i + 1}. {l.text} <button type="button" onClick={() => removeLabel(i)}>удалить</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <label>
          3D-модель (.glb / .gltf)
          <input type="file" accept=".glb,.gltf" onChange={onModelChange} />
        </label>

        {modelPreview && (
          <div className="preview-wrap">
            <p className="hint">Кликните по 3D-модели для размещения 3D-меток</p>
            <Model3DViewer src={modelPreview} hotspots={labels3d} editable onSurfaceClick={onModelSurfaceClick} height={260} />
            {labels3d.length > 0 && (
              <ul className="label-list">
                {labels3d.map((l, i) => (
                  <li key={i}>
                    {i + 1}. {l.text} <button type="button" onClick={() => removeLabel3d(i)}>удалить</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <label>
          {t.videoTab} (mp4 / webm / mov)
          <input type="file" accept=".mp4,.webm,.mov,video/*" onChange={onVideoChange} />
        </label>

        {videoPreview && (
          <div className="preview-wrap">
            <video src={videoPreview} controls style={{ width: '100%', maxHeight: '220px', borderRadius: '8px', display: 'block', background: '#000' }} />
            <button
              type="button"
              className="remove-video-btn"
              onClick={() => {
                setVideoFile(null);
                setVideoPreview(null);
              }}
            >
              ✕ {t.detachVideo}
            </button>
          </div>
        )}

        <label>
          {t.xrayFileField}
          <input type="file" accept="image/*" onChange={onXrayChange} />
        </label>

        {xrayPreview && (
          <div className="preview-wrap">
            <img src={xrayPreview} alt="Рентген preview" style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', borderRadius: '8px', display: 'block', background: '#000' }} />
            <button
              type="button"
              className="remove-video-btn"
              onClick={() => {
                setXrayFile(null);
                setXrayPreview(null);
              }}
            >
              ✕ {t.detachXray}
            </button>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="save-btn">{t.saveBtn}</button>
          {editingId && (
            <button type="button" className="cancel-btn" onClick={resetForm}>{t.cancelBtn}</button>
          )}
        </div>
      </form>

      <div className="admin-list">
        <h2>{t.adminTitle} ({entries.length})</h2>
        <table>
          <thead>
            <tr>
              <th>{t.titleField}</th>
              <th>{t.organLabel}</th>
              <th>Медиа</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <strong>{lang === 'uz' && entry.titleUz ? entry.titleUz : entry.title}</strong>
                  {entry.titleUz && lang !== 'uz' && <span className="uz-subtitle-tag"> (UZ: {entry.titleUz})</span>}
                </td>
                <td>{lang === 'uz' && entry.systemUz ? entry.systemUz : getTranslatedOrgan(entry.system, lang)}</td>
                <td>
                  <div className="media-badges-cell">
                    {entry.modelUrl && <span className="badge-3d">3D</span>}
                    {entry.videoUrl && <span className="badge-video">🎬 Video</span>}
                    {entry.xrayUrl && <span className="badge-xray">🩻 X-Ray</span>}
                    {entry.imageUrl && <span className="badge-2d-table">2D</span>}
                  </div>
                </td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="edit-btn" onClick={() => startEdit(entry)}>✏️</button>
                    <button type="button" className="delete-btn" onClick={() => handleDelete(entry.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
