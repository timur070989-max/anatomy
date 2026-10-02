require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const store = require('./store');
const userStore = require('./userStore');
const { issueToken, requireAuth, requireRole } = require('./auth');

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const MODEL_EXTENSIONS = new Set(['.glb', '.gltf']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov']);

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
  // Global limit covers the largest field (video); image/model are also bounded by fileFilter's type check.
  limits: { fileSize: 300 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'image' || file.fieldname === 'xray') {
      // The browser-supplied mimetype alone is not enough: an .html or .svg file
      // sent as "image/png" would be served from our origin and could run
      // scripts (stealing the admin token from localStorage).
      if (!file.mimetype.startsWith('image/') || !IMAGE_EXTENSIONS.has(path.extname(file.originalname).toLowerCase())) {
        return cb(badRequest('Only .png, .jpg, .jpeg, .webp or .gif files are allowed for image/xray fields'));
      }
      return cb(null, true);
    }
    if (file.fieldname === 'model') {
      if (!MODEL_EXTENSIONS.has(path.extname(file.originalname).toLowerCase())) {
        return cb(badRequest('Only .glb or .gltf files are allowed for the model field'));
      }
      return cb(null, true);
    }
    if (file.fieldname === 'video') {
      if (!VIDEO_EXTENSIONS.has(path.extname(file.originalname).toLowerCase())) {
        return cb(badRequest('Only .mp4, .webm or .mov files are allowed for the video field'));
      }
      return cb(null, true);
    }
    cb(badRequest('Unexpected field'));
  },
});

const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'model', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'xray', maxCount: 1 },
]);

userStore.bootstrapAdminFromEnv();

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(
  '/uploads',
  express.static(UPLOADS_DIR, {
    setHeaders: (res) => {
      // Never let the browser reinterpret an uploaded file as HTML/script.
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; media-src 'self'; sandbox");
    },
  })
);

// Brute-force protection for /api/auth/login: per IP, 10 failed attempts per 15 minutes.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 10;
const loginFailures = new Map();

function clientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
}

function recentFailures(ip, now = Date.now()) {
  const list = (loginFailures.get(ip) || []).filter((t) => now - t < LOGIN_WINDOW_MS);
  if (list.length) loginFailures.set(ip, list);
  else loginFailures.delete(ip);
  return list;
}

const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
}

app.post('/api/auth/login', (req, res) => {
  const ip = clientIp(req);
  if (recentFailures(ip).length >= LOGIN_MAX_FAILURES) {
    return res.status(429).json({ error: 'Too many failed login attempts. Try again in 15 minutes.' });
  }
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const user = userStore.getUserByEmail(email);
  if (!user || !userStore.verifyPassword(password, user.passwordHash)) {
    loginFailures.set(ip, [...recentFailures(ip), Date.now()]);
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  loginFailures.delete(ip);
  const token = issueToken(user);
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/users', requireAuth, requireRole('admin'), (req, res) => {
  res.json(userStore.listUsers());
});

app.post('/api/users', requireAuth, requireRole('admin'), (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password || !role) return res.status(400).json({ error: 'email, password and role are required' });
  if (!['admin', 'editor'].includes(role)) return res.status(400).json({ error: 'role must be admin or editor' });
  if (typeof password !== 'string' || password.length < 10) {
    return res.status(400).json({ error: 'password must be at least 10 characters' });
  }
  try {
    const user = userStore.createUser({ email, password, role });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/users/:id', requireAuth, requireRole('admin'), (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account while logged in as it' });
  const ok = userStore.deleteUser(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

const BODY_PROFILES = new Set(['male', 'female', 'child', 'any']);

app.get('/api/systems', (req, res) => {
  res.json(store.listSystems(req.query.bodyProfile));
});

app.get('/api/entries', (req, res) => {
  res.json(store.listEntries(req.query.system, req.query.bodyProfile));
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

app.post('/api/entries', requireAuth, uploadFields, (req, res) => {
  const { title, system, bodyProfile, definition, causes, symptoms, recommendedDrugs, labels, labels3d } = req.body;
  if (!title || !system) return res.status(400).json({ error: 'title (Нозология) and system (Орган) are required' });
  if (bodyProfile !== undefined && !BODY_PROFILES.has(bodyProfile)) {
    return res.status(400).json({ error: 'bodyProfile must be one of male, female, child, any' });
  }

  const imageFile = req.files?.image?.[0];
  const modelFile = req.files?.model?.[0];
  const videoFile = req.files?.video?.[0];
  const xrayFile = req.files?.xray?.[0];
  const imageUrl = imageFile ? `/uploads/${imageFile.filename}` : req.body.imageUrl || null;
  const modelUrl = modelFile ? `/uploads/${modelFile.filename}` : req.body.modelUrl || null;
  const videoUrl = videoFile ? `/uploads/${videoFile.filename}` : req.body.videoUrl || null;
  const xrayUrl = xrayFile ? `/uploads/${xrayFile.filename}` : req.body.xrayUrl || null;

  const parsedLabels = parseJsonField(labels, 'labels');
  if (!parsedLabels.ok) return res.status(400).json({ error: parsedLabels.error });
  const parsedLabels3d = parseJsonField(labels3d, 'labels3d');
  if (!parsedLabels3d.ok) return res.status(400).json({ error: parsedLabels3d.error });
  const parsedDrugs = parseJsonField(recommendedDrugs, 'recommendedDrugs');
  if (!parsedDrugs.ok) return res.status(400).json({ error: parsedDrugs.error });

  const entry = store.createEntry({
    title,
    titleUz: req.body.titleUz,
    system,
    systemUz: req.body.systemUz,
    bodyProfile,
    definition,
    definitionUz: req.body.definitionUz,
    causes,
    causesUz: req.body.causesUz,
    symptoms,
    symptomsUz: req.body.symptomsUz,
    recommendedDrugs: parsedDrugs.value || [],
    imageUrl,
    modelUrl,
    videoUrl,
    xrayUrl,
    labels: parsedLabels.value || [],
    labels3d: parsedLabels3d.value || [],
  });
  res.status(201).json(entry);
});

app.put('/api/entries/:id', requireAuth, uploadFields, (req, res) => {
  const {
    title, titleUz,
    system, systemUz,
    bodyProfile,
    definition, definitionUz,
    causes, causesUz,
    symptoms, symptomsUz,
    recommendedDrugs, labels, labels3d
  } = req.body;
  if (bodyProfile !== undefined && !BODY_PROFILES.has(bodyProfile)) {
    return res.status(400).json({ error: 'bodyProfile must be one of male, female, child, any' });
  }
  const data = {};
  if (title !== undefined) data.title = title;
  if (titleUz !== undefined) data.titleUz = titleUz;
  if (system !== undefined) data.system = system;
  if (systemUz !== undefined) data.systemUz = systemUz;
  if (bodyProfile !== undefined) data.bodyProfile = bodyProfile;
  if (definition !== undefined) data.definition = definition;
  if (definitionUz !== undefined) data.definitionUz = definitionUz;
  if (causes !== undefined) data.causes = causes;
  if (causesUz !== undefined) data.causesUz = causesUz;
  if (symptoms !== undefined) data.symptoms = symptoms;
  if (symptomsUz !== undefined) data.symptomsUz = symptomsUz;

  const imageFile = req.files?.image?.[0];
  const modelFile = req.files?.model?.[0];
  const videoFile = req.files?.video?.[0];
  const xrayFile = req.files?.xray?.[0];
  if (imageFile) data.imageUrl = `/uploads/${imageFile.filename}`;
  else if (req.body.imageUrl !== undefined) data.imageUrl = req.body.imageUrl;
  if (modelFile) data.modelUrl = `/uploads/${modelFile.filename}`;
  else if (req.body.modelUrl !== undefined) data.modelUrl = req.body.modelUrl;
  if (videoFile) data.videoUrl = `/uploads/${videoFile.filename}`;
  else if (req.body.videoUrl !== undefined) data.videoUrl = req.body.videoUrl;
  if (xrayFile) data.xrayUrl = `/uploads/${xrayFile.filename}`;
  else if (req.body.xrayUrl !== undefined) data.xrayUrl = req.body.xrayUrl;

  const parsedLabels = parseJsonField(labels, 'labels');
  if (!parsedLabels.ok) return res.status(400).json({ error: parsedLabels.error });
  if (parsedLabels.value !== undefined) data.labels = parsedLabels.value;
  const parsedLabels3d = parseJsonField(labels3d, 'labels3d');
  if (!parsedLabels3d.ok) return res.status(400).json({ error: parsedLabels3d.error });
  if (parsedLabels3d.value !== undefined) data.labels3d = parsedLabels3d.value;
  const parsedDrugs = parseJsonField(recommendedDrugs, 'recommendedDrugs');
  if (!parsedDrugs.ok) return res.status(400).json({ error: parsedDrugs.error });
  if (parsedDrugs.value !== undefined) data.recommendedDrugs = parsedDrugs.value;

  const updated = store.updateEntry(req.params.id, data);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

app.delete('/api/entries/:id', requireAuth, (req, res) => {
  const ok = store.deleteEntry(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

const BODY_MAP_PROFILES = new Set(['male', 'female', 'child']);

app.get('/api/bodymaps/:profile', (req, res) => {
  if (!BODY_MAP_PROFILES.has(req.params.profile)) {
    return res.status(400).json({ error: 'profile must be one of male, female, child' });
  }
  res.json(store.getBodyMap(req.params.profile));
});

app.put('/api/bodymaps/:profile', requireAuth, uploadFields, (req, res) => {
  if (!BODY_MAP_PROFILES.has(req.params.profile)) {
    return res.status(400).json({ error: 'profile must be one of male, female, child' });
  }
  const { labels, labels3d } = req.body;
  const parsedLabels = parseJsonField(labels, 'labels');
  if (!parsedLabels.ok) return res.status(400).json({ error: parsedLabels.error });
  const parsedLabels3d = parseJsonField(labels3d, 'labels3d');
  if (!parsedLabels3d.ok) return res.status(400).json({ error: parsedLabels3d.error });

  const imageFile = req.files?.image?.[0];
  const modelFile = req.files?.model?.[0];
  const data = {};
  if (imageFile) data.imageUrl = `/uploads/${imageFile.filename}`;
  else if (req.body.imageUrl !== undefined) data.imageUrl = req.body.imageUrl;
  if (modelFile) data.modelUrl = `/uploads/${modelFile.filename}`;
  else if (req.body.modelUrl !== undefined) data.modelUrl = req.body.modelUrl;
  if (parsedLabels.value !== undefined) data.labels = parsedLabels.value;
  if (parsedLabels3d.value !== undefined) data.labels3d = parsedLabels3d.value;

  const saved = store.saveBodyMap(req.params.profile, data);
  res.json(saved);
});

if (fs.existsSync(CLIENT_DIST)) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  // Upload validation and body-parser errors carry a 4xx status; anything else
  // is a server bug and must not leak internals to the client.
  if (err instanceof multer.MulterError) return res.status(400).json({ error: err.message });
  if (err.status >= 400 && err.status < 500) return res.status(err.status).json({ error: err.message });
  console.error('[anatomy-server] unexpected error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`[anatomy-server] listening on port ${PORT}`);
});
