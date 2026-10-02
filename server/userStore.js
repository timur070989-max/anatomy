const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(__dirname, 'data', 'users.json');

function readAll() {
  if (!fs.existsSync(USERS_FILE)) return [];
  const raw = fs.readFileSync(USERS_FILE, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw);
}

function writeAll(users) {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(String(password), salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === check.length && crypto.timingSafeEqual(expected, check);
}

function listUsers() {
  return readAll().map(({ passwordHash, ...rest }) => rest);
}

function getUserByEmail(email) {
  return readAll().find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

function getUserById(id) {
  return readAll().find((u) => u.id === id) || null;
}

function createUser({ email, password, role }) {
  const users = readAll();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('A user with this email already exists');
  }
  const user = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    email,
    passwordHash: hashPassword(password),
    role,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeAll(users);
  const { passwordHash, ...safe } = user;
  return safe;
}

function deleteUser(id) {
  const users = readAll();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  users.splice(idx, 1);
  writeAll(users);
  return true;
}

function countUsers() {
  return readAll().length;
}

// users.json is not in git, so a fresh deploy (e.g. Render, which has no shell
// on the free tier) starts with no accounts. Create the first admin from
// ADMIN_EMAIL / ADMIN_PASSWORD; does nothing once any user exists.
function bootstrapAdminFromEnv(env = process.env) {
  if (countUsers() > 0) return null;
  const email = (env.ADMIN_EMAIL || '').trim();
  const password = env.ADMIN_PASSWORD || '';
  if (!email || !password) {
    console.warn('[users] No users yet. Set ADMIN_EMAIL and ADMIN_PASSWORD (or run scripts/create-admin.js) to create the first admin.');
    return null;
  }
  if (password.length < 12) {
    throw new Error('[users] ADMIN_PASSWORD must be at least 12 characters');
  }
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  const user = createUser({ email, password, role: 'admin' });
  console.log(`[users] Created first admin ${user.email} from ADMIN_EMAIL/ADMIN_PASSWORD`);
  return user;
}

module.exports = {
  hashPassword,
  verifyPassword,
  listUsers,
  getUserByEmail,
  getUserById,
  createUser,
  deleteUser,
  countUsers,
  bootstrapAdminFromEnv,
};
