const jwt = require('jsonwebtoken');
const userStore = require('./userStore');

const AUTH_SECRET = process.env.AUTH_SECRET;
if (!AUTH_SECRET) {
  console.warn(
    '[auth] AUTH_SECRET is not set — using an insecure development secret. ' +
      'Set AUTH_SECRET in your environment before deploying anywhere real.'
  );
}
const SECRET = AUTH_SECRET || 'dev-only-insecure-secret-change-me';
const TOKEN_TTL = '12h';

function issueToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: TOKEN_TTL });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = jwt.verify(token, SECRET);
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
