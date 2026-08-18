const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'entries.json');

function readAll() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw);
}

function writeAll(entries) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), 'utf8');
}

function listEntries(system) {
  const entries = readAll();
  return system ? entries.filter((e) => e.system === system) : entries;
}

function getEntry(id) {
  return readAll().find((e) => e.id === id) || null;
}

function createEntry(data) {
  const entries = readAll();
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    title: data.title,
    system: data.system,
    description: data.description || '',
    imageUrl: data.imageUrl || null,
    labels: data.labels || [],
    modelUrl: data.modelUrl || null,
    labels3d: data.labels3d || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  entries.push(entry);
  writeAll(entries);
  return entry;
}

function updateEntry(id, data) {
  const entries = readAll();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const updated = {
    ...entries[idx],
    ...data,
    id: entries[idx].id,
    updatedAt: new Date().toISOString(),
  };
  entries[idx] = updated;
  writeAll(entries);
  return updated;
}

function deleteEntry(id) {
  const entries = readAll();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  entries.splice(idx, 1);
  writeAll(entries);
  return true;
}

function listSystems() {
  const entries = readAll();
  return [...new Set(entries.map((e) => e.system))].sort();
}

module.exports = { listEntries, getEntry, createEntry, updateEntry, deleteEntry, listSystems };
