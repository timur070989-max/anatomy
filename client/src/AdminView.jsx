import { useEffect, useRef, useState } from 'react';
import { api, resolveImageUrl } from './api';
import Model3DViewer from './Model3DViewer';

const emptyForm = { title: '', system: '', description: '' };

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
  }

  function startEdit(entry) {
    setEditingId(entry.id);
    setForm({ title: entry.title, system: entry.system, description: entry.description || '' });
    setImageFile(null);
    setImagePreview(entry.imageUrl ? resolveImageUrl(entry.imageUrl) : null);
    setLabels(entry.labels || []);
    setModelFile(null);
    setModelPreview(entry.modelUrl ? resolveImageUrl(entry.modelUrl) : null);
    setLabels3d(entry.labels3d || []);
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

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setStatus('');
    if (!form.title || !form.system) {
      setError('Заполните название и систему');
      return;
    }
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('system', form.system);
    fd.append('description', form.description);
    fd.append('labels', JSON.stringify(labels));
    fd.append('labels3d', JSON.stringify(labels3d));
    if (imageFile) fd.append('image', imageFile);
    if (modelFile) fd.append('model', modelFile);

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
          Название
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </label>

        <label>
          Система (например: skeletal, muscular, organs)
          <input value={form.system} onChange={(e) => setForm({ ...form, system: e.target.value })} required />
        </label>

        <label>
          Описание
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
        </label>

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
              <th>Название</th>
              <th>Система</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.title}</td>
                <td>{entry.system}</td>
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
