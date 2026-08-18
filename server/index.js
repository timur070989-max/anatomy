const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const store = require('./store');

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const MODEL_EXTENSIONS = new Set(['.glb', '.gltf']);

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
  limits: { fileSize: 60 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'image') {
      if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image uploads are allowed for the image field'));
      return cb(null, true);
    }
    if (file.fieldname === 'model') {
      if (!MODEL_EXTENSIONS.has(path.extname(file.originalname).toLowerCase())) {
        return cb(new Error('Only .glb or .gltf files are allowed for the model field'));
      }
      return cb(null, true);
    }
    cb(new Error('Unexpected field'));
  },
});

const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'model', maxCount: 1 },
]);

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/', (req, res) => res.json({ ok: true, service: 'anatomy-server' }));

app.get('/api/systems', (req, res) => {
  res.json(store.listSystems());
});

app.get('/api/entries', (req, res) => {
  res.json(store.listEntries(req.query.system));
});

app.get('/api/entries/:id', (req, res) => {
  const entry = store.getEntry(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Not found' });
  res.json(entry);
});

function parseJsonField(value, fieldName) {
  if (value === undefined) return { ok: true, value: undefined };
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch {
    return { ok: false, error: `${fieldName} must be valid JSON` };
  }
}

app.post('/api/entries', uploadFields, (req, res) => {
  const { title, system, description, labels, labels3d } = req.body;
  if (!title || !system) return res.status(400).json({ error: 'title and system are required' });

  const imageFile = req.files?.image?.[0];
  const modelFile = req.files?.model?.[0];
  const imageUrl = imageFile ? `/uploads/${imageFile.filename}` : req.body.imageUrl || null;
  const modelUrl = modelFile ? `/uploads/${modelFile.filename}` : req.body.modelUrl || null;

  const parsedLabels = parseJsonField(labels, 'labels');
  if (!parsedLabels.ok) return res.status(400).json({ error: parsedLabels.error });
  const parsedLabels3d = parseJsonField(labels3d, 'labels3d');
  if (!parsedLabels3d.ok) return res.status(400).json({ error: parsedLabels3d.error });

  const entry = store.createEntry({
    title,
    system,
    description,
    imageUrl,
    modelUrl,
    labels: parsedLabels.value || [],
    labels3d: parsedLabels3d.value || [],
  });
  res.status(201).json(entry);
});

app.put('/api/entries/:id', uploadFields, (req, res) => {
  const { title, system, description, labels, labels3d } = req.body;
  const data = {};
  if (title !== undefined) data.title = title;
  if (system !== undefined) data.system = system;
  if (description !== undefined) data.description = description;

  const imageFile = req.files?.image?.[0];
  const modelFile = req.files?.model?.[0];
  if (imageFile) data.imageUrl = `/uploads/${imageFile.filename}`;
  else if (req.body.imageUrl !== undefined) data.imageUrl = req.body.imageUrl;
  if (modelFile) data.modelUrl = `/uploads/${modelFile.filename}`;
  else if (req.body.modelUrl !== undefined) data.modelUrl = req.body.modelUrl;

  const parsedLabels = parseJsonField(labels, 'labels');
  if (!parsedLabels.ok) return res.status(400).json({ error: parsedLabels.error });
  if (parsedLabels.value !== undefined) data.labels = parsedLabels.value;
  const parsedLabels3d = parseJsonField(labels3d, 'labels3d');
  if (!parsedLabels3d.ok) return res.status(400).json({ error: parsedLabels3d.error });
  if (parsedLabels3d.value !== undefined) data.labels3d = parsedLabels3d.value;

  const updated = store.updateEntry(req.params.id, data);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

app.delete('/api/entries/:id', (req, res) => {
  const ok = store.deleteEntry(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || 'Unexpected error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`[anatomy-server] listening on port ${PORT}`);
});
