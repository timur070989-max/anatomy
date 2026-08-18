#!/usr/bin/env node
// Bootstrap or update a user. There is no public registration endpoint on purpose —
// the first admin (and any later user) is created from the server's own filesystem access.
//
// Usage: node scripts/create-admin.js <email> <password> [role]
//   role defaults to "admin". Use "editor" for a content-only account.

const userStore = require('../userStore');

const [, , email, password, role = 'admin'] = process.argv;

if (!email || !password) {
  console.error('Usage: node scripts/create-admin.js <email> <password> [admin|editor]');
  process.exit(1);
}
if (!['admin', 'editor'].includes(role)) {
  console.error('role must be "admin" or "editor"');
  process.exit(1);
}

const existing = userStore.getUserByEmail(email);
if (existing) {
  console.error(`A user with email ${email} already exists (id: ${existing.id}). Delete it first if you want to recreate it.`);
  process.exit(1);
}

const user = userStore.createUser({ email, password, role });
console.log(`Created ${user.role} user: ${user.email} (id: ${user.id})`);
