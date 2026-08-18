const userStore = require('../userStore');
const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, '..', 'data', 'users.json');

// Reset admin user with known password
const adminUser = {
  id: "admin_root",
  email: "admin@worldmedicine.com",
  passwordHash: userStore.hashPassword ? userStore.hashPassword("admin123") : "admin123",
  role: "admin",
  createdAt: new Date().toISOString()
};

// Let's also check if userStore exports hashPassword
const crypto = require('crypto');
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

adminUser.passwordHash = hashPassword("admin123");

fs.writeFileSync(usersFile, JSON.stringify([adminUser], null, 2), 'utf8');
console.log("Admin account configured with email: admin@worldmedicine.com and password: admin123");
