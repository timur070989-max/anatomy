import { useEffect, useRef, useState } from 'react';
import { api, resolveImageUrl } from './api';
import Model3DViewer from './Model3DViewer';

const PROFILES = [
  { id: 'male', label: 'Мужчина' },
  { id: 'female', label: 'Женщина' },
  { id: 'child', label: 'Ребёнок' },
];

export default function BodyMapAdmin() {
  const [profile, setProfile] = useState('male');
  const [map, setMap] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [modelFile, setModelFile] = useState(null);
  const [modelPreview, setModelPreview] = useState(null);
  const [labels, setLabels] = useState([]);
  const [labels3d, setLabels3d] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const previewRef = useRef(null);

  useEffect(() => {
    setStatus('');
    setError('');
    setImageFile(null);
    setModelFile(null);
    api
      .getBodyMap(profile)
      .then((m) => {
        setMap(m);
        setImagePreview(m?.imageUrl ? resolveImageUrl(m.imageUrl) : null);
        setModelPreview(m?.modelUrl ? resolveImageUrl(m.modelUrl) : null);
        setLabels(m?.labels || []);
        setLabels3d(m?.labels3d || []);
      })
      .catch((e) => setError(e.message));
  }, [profile]);

  function onImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function onModelChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setModelFile(file);
    setModelPreview(URL.createObjectURL(file));
  }

  function onImageClick(e) {
    if (!imagePreview) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const organ = window.prompt('Название органа (например: Мозг, Сердце, Лёгкие):');
    if (!organ) return;
    setLabels((prev) => [...prev, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, organ }]);
  }

  function onModelSurfaceClick(point) {
    const organ = window.prompt('Название органа для этой точки на модели:');
    if (!organ) return;
    setLabels3d((prev) => [...prev, { ...point, organ }]);
  }

  function removeLabel(i) {
    setLabels((prev) => prev.filter((_, idx) => idx !== i));
  }

  function removeLabel3d(i) {
    setLabels3d((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onSave() {
    setStatus('');
    setError('');
    const fd = new FormData();
    fd.append('labels', JSON.stringify(labels));
    fd.append('labels3d', JSON.stringify(labels3d));
    if (imageFile) fd.append('image', imageFile);
    if (modelFile) fd.append('model', modelFile);
    try {
      const saved = await api.saveBodyMap(profile, fd);
      setMap(saved);
      setImageFile(null);
      setModelFile(null);
      setStatus('Карта тела сохранена');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="bodymap-admin">
      <h2>Карта тела</h2>
      <p className="section-dek">
        Загрузите изображение или 3D-модель всего тела для каждого профиля и расставьте метки органов —
        в «Атласе» клик по метке сразу открывает список нозологий по этому органу.
      </p>

      <div className="profile-tabs">
        {PROFILES.map((p) => (
          <button key={p.id} className={profile === p.id ? 'active' : ''} onClick={() => setProfile(p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}
      {status && <p className="status">{status}</p>}

      <div className="bodymap-admin-grid">
        <div className="preview-wrap">
          <label>
            Изображение тела (2D)
            <input type="file" accept="image/*" onChange={onImageChange} />
          </label>
          {imagePreview && (
            <>
              <p className="hint">Кликните по фигуре, чтобы поставить метку органа</p>
              <div className="image-with-labels" ref={previewRef} onClick={onImageClick}>
                <img src={imagePreview} alt="preview" />
                {labels.map((l, i) => (
                  <span key={i} className="label-marker organ-marker" style={{ left: `${l.x}%`, top: `${l.y}%` }} title={l.organ}>
                    {l.organ}
                  </span>
                ))}
              </div>
              {labels.length > 0 && (
                <ul className="label-list">
                  {labels.map((l, i) => (
                    <li key={i}>
                      {l.organ} <button type="button" onClick={() => removeLabel(i)}>удалить</button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="preview-wrap">
          <label>
            3D-модель тела (.glb / .gltf)
            <input type="file" accept=".glb,.gltf" onChange={onModelChange} />
          </label>
          {modelPreview && (
            <>
              <p className="hint">Кликните по модели, чтобы поставить метку органа на поверхности</p>
              <Model3DViewer src={modelPreview} hotspots={labels3d.map((l) => ({ ...l, text: l.organ }))} editable onSurfaceClick={onModelSurfaceClick} height={320} />
              {labels3d.length > 0 && (
                <ul className="label-list">
                  {labels3d.map((l, i) => (
                    <li key={i}>
                      {l.organ} <button type="button" onClick={() => removeLabel3d(i)}>удалить</button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      <div className="form-actions">
        <button onClick={onSave}>Сохранить карту тела</button>
      </div>
    </div>
  );
}
