const jwt = require('jsonwebtoken');
const userStore = require('./userStore');

const AUTH_SECRET = process.env.AUTH_SECRET;
// Render sets RENDER=true. Running a real deployment with the public fallback
// secret would let anyone forge an admin token, so refuse to start instead.
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);
if (!AUTH_SECRET || AUTH_SECRET.length < 32) {
  if (IS_PRODUCTION) {
    throw new Error(
      '[auth] AUTH_SECRET must be set to a random string of at least 32 characters in production. ' +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
    );
  }
  console.warn(
    '[auth] AUTH_SECRET is not set (or too short) — using an insecure development secret. ' +
      'Set AUTH_SECRET in your environment before deploying anywhere real.'
  );
}
const SECRET = AUTH_SECRET && AUTH_SECRET.length >= 32 ? AUTH_SECRET : 'dev-only-insecure-secret-change-me';
const TOKEN_TTL = '12h';

function issueToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: TOKEN_TTL });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = jwt.verify(token, SECRET, { algorithms: ['HS256'] });
    const user = userStore.getUserById(payload.sub);
    if (!user) return res.status(401).json({ error: 'User no longer exists' });
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { issueToken, requireAuth, requireRole };
