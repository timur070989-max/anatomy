const fs = require('fs');
const path = require('path');

const ENTRIES_FILE = path.join(__dirname, '..', 'data', 'entries.json');
const entries = JSON.parse(fs.readFileSync(ENTRIES_FILE, 'utf8'));

const ORGAN_HOTSPOTS = {
  '/uploads/organ-liver.glb': [
    { x: 0.06, y: 0.01, z: 0.05, nx: 0, ny: 0, nz: 1, text: 'Правая доля (Lobus dexter)' },
    { x: -0.07, y: 0.03, z: 0.03, nx: 0, ny: 0, nz: 1, text: 'Левая доля (Lobus sinister)' },
    { x: 0.0, y: -0.04, z: -0.01, nx: 0, ny: -1, nz: 0, text: 'Ворота печени (Porta hepatis)' },
    { x: 0.03, y: -0.06, z: 0.02, nx: 0, ny: -1, nz: 1, text: 'Нижний край (Margo inferior)' },
  ],
  '/uploads/organ-stomach.glb': [
    { x: -0.03, y: 0.07, z: 0.02, nx: 0, ny: 1, nz: 0, text: 'Дно желудка (Fundus gastricus)' },
    { x: -0.02, y: 0.01, z: 0.04, nx: 0, ny: 0, nz: 1, text: 'Тело желудка (Corpus gastricum)' },
    { x: 0.05, y: -0.04, z: 0.01, nx: 1, ny: 0, nz: 0, text: 'Пилорический отдел / Привратник (Pylorus)' },
    { x: -0.06, y: -0.02, z: 0.03, nx: -1, ny: 0, nz: 0, text: 'Большая кривизна (Curvatura major)' },
  ],
  '/uploads/organ-pancreas.glb': [
    { x: -0.05, y: -0.01, z: 0.01, nx: -1, ny: 0, nz: 0, text: 'Головка железы (Caput pancreatis)' },
    { x: 0.0, y: 0.01, z: 0.02, nx: 0, ny: 0, nz: 1, text: 'Тело железы (Corpus pancreatis)' },
    { x: 0.06, y: 0.03, z: 0.01, nx: 1, ny: 0, nz: 0, text: 'Хвост железы (Cauda pancreatis)' },
    { x: 0.01, y: 0.0, z: 0.01, nx: 0, ny: 0, nz: 1, text: 'Панкреатический проток (Ductus pancreaticus)' },
  ],
  '/uploads/organ-gallbladder.glb': [
    { x: 0.0, y: -0.04, z: 0.02, nx: 0, ny: -1, nz: 1, text: 'Дно жёлчного пузыря (Fundus)' },
    { x: 0.0, y: 0.0, z: 0.02, nx: 0, ny: 0, nz: 1, text: 'Тело жёлчного пузыря (Corpus)' },
    { x: 0.0, y: 0.04, z: 0.01, nx: 0, ny: 1, nz: 0, text: 'Шейка и пузырный проток (Collum & Ductus cysticus)' },
  ],
  '/uploads/organ-right-kidney.glb': [
    { x: 0.0, y: 0.05, z: 0.02, nx: 0, ny: 1, nz: 0, text: 'Верхний полюс (Extremitas superior)' },
    { x: -0.03, y: 0.0, z: 0.01, nx: -1, ny: 0, nz: 0, text: 'Почечные ворота и лоханка (Hilum & Pelvis renalis)' },
    { x: 0.0, y: -0.05, z: 0.02, nx: 0, ny: -1, nz: 0, text: 'Нижний полюс (Extremitas inferior)' },
    { x: -0.02, y: -0.08, z: 0.0, nx: -1, ny: -1, nz: 0, text: 'Мочеточник (Ureter)' },
  ],
  '/uploads/organ-left-kidney.glb': [
    { x: 0.0, y: 0.05, z: 0.02, nx: 0, ny: 1, nz: 0, text: 'Верхний полюс (Extremitas superior)' },
    { x: 0.03, y: 0.0, z: 0.01, nx: 1, ny: 0, nz: 0, text: 'Почечные ворота и лоханка (Hilum & Pelvis renalis)' },
    { x: 0.0, y: -0.05, z: 0.02, nx: 0, ny: -1, nz: 0, text: 'Нижний полюс (Extremitas inferior)' },
    { x: 0.02, y: -0.08, z: 0.0, nx: 1, ny: -1, nz: 0, text: 'Мочеточник (Ureter)' },
  ],
  '/uploads/organ-urinary-bladder.glb': [
    { x: 0.0, y: 0.04, z: 0.02, nx: 0, ny: 1, nz: 0, text: 'Верхушка мочевого пузыря (Apex vesicae)' },
    { x: 0.0, y: 0.0, z: 0.03, nx: 0, ny: 0, nz: 1, text: 'Тело мочевого пузыря (Corpus vesicae)' },
    { x: 0.0, y: -0.04, z: 0.01, nx: 0, ny: -1, nz: 0, text: 'Шейка мочевого пузыря (Cervix vesicae)' },
  ],
};

let count = 0;
entries.forEach((e) => {
  if (e.modelUrl && ORGAN_HOTSPOTS[e.modelUrl]) {
    e.labels3d = ORGAN_HOTSPOTS[e.modelUrl];
    count++;
  }
});

fs.writeFileSync(ENTRIES_FILE, JSON.stringify(entries, null, 2), 'utf8');
console.log(`Успешно добавлена 3D-структура и подписи для ${count} записей!`);
