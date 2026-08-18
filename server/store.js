const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'entries.json');
const BODYMAPS_FILE = path.join(__dirname, 'data', 'bodymaps.json');

function readAll() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw);
}

function writeAll(entries) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), 'utf8');
}

function readBodyMaps() {
  if (!fs.existsSync(BODYMAPS_FILE)) return {};
  const raw = fs.readFileSync(BODYMAPS_FILE, 'utf8').trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

function writeBodyMaps(maps) {
  fs.writeFileSync(BODYMAPS_FILE, JSON.stringify(maps, null, 2), 'utf8');
}

function getBodyMap(bodyProfile) {
  const maps = readBodyMaps();
  return maps[bodyProfile] || null;
}

function saveBodyMap(bodyProfile, data) {
  const maps = readBodyMaps();
  const existing = maps[bodyProfile] || {};
  maps[bodyProfile] = {
    bodyProfile,
    imageUrl: data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl || null,
    modelUrl: data.modelUrl !== undefined ? data.modelUrl : existing.modelUrl || null,
    labels: data.labels !== undefined ? data.labels : existing.labels || [],       // [{ x, y, organ }]
    labels3d: data.labels3d !== undefined ? data.labels3d : existing.labels3d || [], // [{ x, y, z, nx, ny, nz, organ }]
    updatedAt: new Date().toISOString(),
  };
  writeBodyMaps(maps);
  return maps[bodyProfile];
}

function listEntries(system, bodyProfile) {
  let entries = readAll();
  if (system) entries = entries.filter((e) => e.system === system);
  if (bodyProfile) entries = entries.filter((e) => !e.bodyProfile || e.bodyProfile === 'any' || e.bodyProfile === bodyProfile);
  return entries;
}

function getEntry(id) {
  return readAll().find((e) => e.id === id) || null;
}

function createEntry(data) {
  const entries = readAll();
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    title: data.title,           // Нозология (заболевание)
    system: data.system,         // Орган
    bodyProfile: data.bodyProfile || 'any',  // "male" | "female" | "child" | "any"
    definition: data.definition || '',   // Рубрика: Определение
    causes: data.causes || '',           // Рубрика: Причины
    symptoms: data.symptoms || '',       // Рубрика: Симптомы
    recommendedDrugs: data.recommendedDrugs || [],  // Рубрика: Рекомендуемые препараты компании WM
    imageUrl: data.imageUrl || null,
    labels: data.labels || [],
    modelUrl: data.modelUrl || null,
    labels3d: data.labels3d || [],
    videoUrl: data.videoUrl || null,
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

function listSystems(bodyProfile) {
  const entries = listEntries(undefined, bodyProfile);
  return [...new Set(entries.map((e) => e.system))].sort();
}

module.exports = { listEntries, getEntry, createEntry, updateEntry, deleteEntry, listSystems, getBodyMap, saveBodyMap };
