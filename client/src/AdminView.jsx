import { useEffect, useRef, useState } from 'react';
import { api, resolveImageUrl } from './api';
import Model3DViewer from './Model3DViewer';

const BODY_PROFILE_OPTIONS = [
  { value: 'male', label: 'Мужской (Взрослый)' },
  { value: 'female', label: 'Женский (Взрослая)' },
  { value: 'child', label: 'Детский' },
  { value: 'any', label: 'Любой (Общий)' },
];

const emptyForm = {
  title: '',
  system: '',
  bodyProfile: 'any',
  definition: '',
  causes: '',
  symptoms: '',
};

export default function AdminView() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
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
      title: entry.title,
      system: entry.system,
      bodyProfile: entry.bodyProfile || 'any',
      definition: entry.definition || '',
      causes: entry.causes || '',
      symptoms: entry.symptoms || '',
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
    const text = window.prompt('Подпись для метки:');
    if (!text) return;
    setLabels((prev) => [...prev, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, text }]);
  }

  function removeLabel(i) {
    setLabels((prev) => prev.filter((_, idx) => idx !== i));
  }

  function onModelSurfaceClick(point) {
    const text = window.prompt('Подпись для метки на модели:');
    if (!text) return;
    setLabels3d((prev) => [...prev, { ...point, text }]);
  }

  function removeLabel3d(i) {
    setLabels3d((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addDrug(e) {
    e.preventDefault();
    const name = drugInput.trim();
    if (!name) return;
    setDrugs((prev) => [...prev, name]);
    setDrugInput('');
  }

  function removeDrug(i) {
    setDrugs((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setStatus('');
    if (!form.title || !form.system) {
      setError('Заполните орган и нозологию (заболевание)');
      return;
    }
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('system', form.system);
    fd.append('bodyProfile', form.bodyProfile);
    fd.append('definition', form.definition);
    fd.append('causes', form.causes);
    fd.append('symptoms', form.symptoms);
    fd.append('recommendedDrugs', JSON.stringify(drugs));
    fd.append('labels', JSON.stringify(labels));
    fd.append('labels3d', JSON.stringify(labels3d));
    if (imageFile) fd.append('image', imageFile);
    if (modelFile) fd.append('model', modelFile);
    if (videoFile) fd.append('video', videoFile);
    if (xrayFile) fd.append('xray', xrayFile);

    try {
      if (editingId) {
        await api.updateEntry(editingId, fd);
        setStatus('Запись обновлена');
      } else {
        await api.createEntry(fd);
        setStatus('Запись добавлена');
      }
      resetForm();
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onDelete(id) {
    if (!window.confirm('Удалить запись?')) return;
    try {
      await api.deleteEntry(id);
      refresh();
      if (editingId === id) resetForm();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin">
      <form className="admin-form" onSubmit={onSubmit}>
        <h2>{editingId ? 'Редактировать запись' : 'Новая запись'}</h2>
        {error && <p className="error">{error}</p>}
        {status && <p className="status">{status}</p>}

        <label>
          Орган (например: Мозг, Сердце, Лёгкие)
          <input value={form.system} onChange={(e) => setForm({ ...form, system: e.target.value })} required />
        </label>

        <label>
          Нозология (заболевание)
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </label>

        <label>
          Профиль тела
          <select value={form.bodyProfile} onChange={(e) => setForm({ ...form, bodyProfile: e.target.value })}>
            {BODY_PROFILE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>

        <label>
          Определение
          <textarea value={form.definition} onChange={(e) => setForm({ ...form, definition: e.target.value })} rows={3} />
        </label>

        <label>
          Причины
          <textarea value={form.causes} onChange={(e) => setForm({ ...form, causes: e.target.value })} rows={3} />
        </label>

        <label>
          Симптомы
          <textarea value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} rows={3} />
        </label>

        <label>
          Рекомендуемые препараты компании WM
          <div className="drug-input-row">
            <input
              value={drugInput}
              onChange={(e) => setDrugInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addDrug(e); }}
              placeholder="Название препарата"
            />
            <button type="button" onClick={addDrug}>Добавить</button>
          </div>
        </label>
        {drugs.length > 0 && (
          <ul className="drug-list">
            {drugs.map((d, i) => (
              <li key={i}>
                {d} <button type="button" onClick={() => removeDrug(i)}>удалить</button>
              </li>
            ))}
          </ul>
        )}

        <label>
          Изображение / схема
          <input type="file" accept="image/*" onChange={onImageChange} />
        </label>

        {imagePreview && (
          <div className="preview-wrap">
            <p className="hint">Кликните по картинке, чтобы добавить метку с подписью</p>
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
            <p className="hint">Кликните по модели, чтобы поставить метку прямо на её поверхности</p>
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
          Видео о патологии (mp4 / webm / mov, в т.ч. рендер 3D-анимации)
          <input type="file" accept=".mp4,.webm,.mov,video/*" onChange={onVideoChange} />
        </label>

        {videoPreview && (
          <div className="preview-wrap">
            <video src={videoPreview} controls style={{ width: '100%', maxHeight: '240px', borderRadius: '8px', display: 'block', background: '#000' }} />
            <button
              type="button"
              className="remove-video-btn"
              onClick={() => {
                setVideoFile(null);
                setVideoPreview(null);
                setForm((prev) => ({ ...prev, videoUrl: '' }));
              }}
              style={{ marginTop: '6px', background: '#ef4444', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}
            >
              🗑️ Открепить видео от патологии
            </button>
          </div>
        )}

        <label>
          Рентген / КТ / МРТ / Ангиография снимок
          <input type="file" accept="image/*" onChange={onXrayChange} />
        </label>

        {xrayPreview && (
          <div className="preview-wrap">
            <img src={xrayPreview} alt="Рентген preview" style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', background: '#000', borderRadius: '8px', display: 'block' }} />
            <button
              type="button"
              className="remove-video-btn"
              onClick={() => {
                setXrayFile(null);
                setXrayPreview(null);
                setForm((prev) => ({ ...prev, xrayUrl: '' }));
              }}
              style={{ marginTop: '6px', background: '#ef4444', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}
            >
              🗑️ Открепить рентген снимок
            </button>
          </div>
        )}

        <div className="form-actions">
          <button type="submit">{editingId ? 'Сохранить' : 'Добавить'}</button>
          {editingId && <button type="button" onClick={resetForm}>Отмена</button>}
        </div>
      </form>

      <div className="admin-list">
        <h2>Все записи ({entries.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Нозология</th>
              <th>Орган</th>
              <th>Медиа</th>
              <th>Профиль</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.title}</td>
                <td>{entry.system}</td>
                <td>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {entry.modelUrl && <span style={{ background: '#0284c7', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>3D</span>}
                    {entry.videoUrl && <span style={{ background: '#d97706', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>🎬 Видео</span>}
                    {entry.xrayUrl && <span style={{ background: '#059669', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>🩻 Рентген</span>}
                  </div>
                </td>
                <td>{BODY_PROFILE_OPTIONS.find((o) => o.value === (entry.bodyProfile || 'any'))?.label.split(' ')[0]}</td>
                <td className="row-actions">
                  <button onClick={() => startEdit(entry)}>Изменить</button>
                  <button onClick={() => onDelete(entry.id)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
