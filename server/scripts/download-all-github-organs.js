const fs = require('fs');
const path = require('path');
const { objToGlb } = require('./objToGlb');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const ENTRIES_FILE = path.join(__dirname, '..', 'data', 'entries.json');

const BASE_URL = 'https://raw.githubusercontent.com/jixiangying/anatomy/main/isa_BP3D_4.0_obj_99/';

// Organs to download from GitHub BodyParts3D and convert to GLB
const ORGANS_TO_BUILD = [
  {
    name: 'organ-heart.glb',
    objIds: ['FJ2258.obj', 'FJ2260.obj'],
    color: [0.76, 0.14, 0.16, 1.0], // Myocardial deep crimson
    roughness: 0.32,
    metallic: 0.08,
    systemKey: 'сердце',
    hotspots: [
      { x: 0.0, y: 0.06, z: 0.02, nx: 0, ny: 1, nz: 0, text: 'Аорта и дуга аорты (Arcus aortae)' },
      { x: 0.04, y: 0.02, z: 0.03, nx: 1, ny: 0, nz: 1, text: 'Левый желудочек (Ventriculus sinister)' },
      { x: -0.04, y: 0.0, z: 0.03, nx: -1, ny: 0, nz: 1, text: 'Правый желудочек (Ventriculus dexter)' },
      { x: 0.0, y: -0.05, z: 0.02, nx: 0, ny: -1, nz: 1, text: 'Верхушка сердца (Apex cordis)' },
      { x: 0.02, y: 0.01, z: 0.04, nx: 0, ny: 0, nz: 1, text: 'Венечные артерии (Arteriae coronariae)' },
    ],
  },
  {
    name: 'organ-trachea-bronchi.glb',
    objIds: ['FJ2450.obj', 'FJ2539.obj', 'FJ2808.obj'],
    color: [0.88, 0.52, 0.56, 1.0], // Respiratory pink
    roughness: 0.40,
    metallic: 0.04,
    systemKey: 'трахея',
    hotspots: [
      { x: 0.0, y: 0.08, z: 0.0, nx: 0, ny: 1, nz: 0, text: 'Трахея и хрящевые кольца (Trachea)' },
      { x: -0.04, y: -0.02, z: 0.02, nx: -1, ny: 0, nz: 0, text: 'Правый главный бронх (Bronchus principalis dexter)' },
      { x: 0.04, y: -0.03, z: 0.02, nx: 1, ny: 0, nz: 0, text: 'Левый главный бронх (Bronchus principalis sinister)' },
      { x: 0.0, y: 0.0, z: 0.01, nx: 0, ny: 0, nz: 1, text: 'Бифуркация трахеи / Карина (Bifurcatio tracheae)' },
    ],
  },
  {
    name: 'organ-intestines.glb',
    objIds: ['FJ2566.obj', 'FJ2574.obj'],
    color: [0.82, 0.58, 0.46, 1.0], // Intestinal warm flesh
    roughness: 0.42,
    metallic: 0.03,
    systemKey: 'кишечник',
    hotspots: [
      { x: 0.0, y: 0.06, z: 0.02, nx: 0, ny: 1, nz: 0, text: 'Ободочная кишка (Colon)' },
      { x: 0.0, y: 0.0, z: 0.03, nx: 0, ny: 0, nz: 1, text: 'Петли тонкой кишки (Intestinum tenue)' },
      { x: -0.06, y: -0.04, z: 0.02, nx: -1, ny: 0, nz: 0, text: 'Слепая кишка и аппендикс (Caecum)' },
      { x: 0.0, y: -0.07, z: 0.01, nx: 0, ny: -1, nz: 0, text: 'Прямая кишка (Rectum)' },
    ],
  },
  {
    name: 'organ-eye.glb',
    objIds: ['FJ1282.obj', 'FJ1332.obj'],
    color: [0.92, 0.94, 0.98, 1.0], // Sclera white-blue
    roughness: 0.20,
    metallic: 0.15,
    systemKey: 'глаза',
    hotspots: [
      { x: 0.0, y: 0.0, z: 0.06, nx: 0, ny: 0, nz: 1, text: 'Роговица и радужка (Cornea & Iris)' },
      { x: 0.0, y: 0.04, z: 0.0, nx: 0, ny: 1, nz: 0, text: 'Склера (Sclera)' },
      { x: 0.0, y: 0.0, z: -0.06, nx: 0, ny: 0, nz: -1, text: 'Зрительный нерв и сетчатка (Nervus opticus & Retina)' },
    ],
  },
  {
    name: 'organ-skeleton.glb',
    objIds: ['FJ3154.obj', 'FJ3155.obj', 'FJ3237.obj'],
    color: [0.94, 0.92, 0.86, 1.0], // Bone ivory
    roughness: 0.48,
    metallic: 0.02,
    systemKey: 'кости',
    hotspots: [
      { x: 0.0, y: 0.06, z: 0.0, nx: 0, ny: 1, nz: 0, text: 'Тело позвонка (Corpus vertebrae)' },
      { x: 0.0, y: 0.0, z: -0.04, nx: 0, ny: 0, nz: -1, text: 'Остистый отросток (Processus spinosus)' },
      { x: 0.0, y: -0.05, z: 0.01, nx: 0, ny: -1, nz: 0, text: 'Межпозвонковый диск (Discus intervertebralis)' },
      { x: 0.04, y: 0.02, z: 0.0, nx: 1, ny: 0, nz: 0, text: 'Суставные отростки и дуга (Arcus vertebrae)' },
    ],
  },
  {
    name: 'organ-thyroid.glb',
    objIds: ['FJ2209.obj', 'FJ2808.obj'],
    color: [0.78, 0.38, 0.42, 1.0], // Thyroid gland red-pink
    roughness: 0.45,
    metallic: 0.03,
    systemKey: 'щитовидная',
    hotspots: [
      { x: -0.03, y: 0.01, z: 0.02, nx: -1, ny: 0, nz: 1, text: 'Правая доля щитовидной железы (Lobus dexter)' },
      { x: 0.03, y: 0.01, z: 0.02, nx: 1, ny: 0, nz: 1, text: 'Левая доля щитовидной железы (Lobus sinister)' },
      { x: 0.0, y: -0.02, z: 0.02, nx: 0, ny: -1, nz: 1, text: 'Перешеек железы (Isthmus glandulae thyroideae)' },
    ],
  },
  {
    name: 'organ-prostate.glb',
    objIds: ['FJ3139.obj'],
    color: [0.80, 0.52, 0.48, 1.0], // Glandular tissue
    roughness: 0.40,
    metallic: 0.03,
    systemKey: 'яички',
    hotspots: [
      { x: 0.0, y: 0.03, z: 0.02, nx: 0, ny: 1, nz: 0, text: 'Основание предстательной железы (Basis prostatae)' },
      { x: 0.0, y: 0.0, z: 0.03, nx: 0, ny: 0, nz: 1, text: 'Тело железы и капсула (Corpus prostatae)' },
      { x: 0.0, y: -0.03, z: 0.01, nx: 0, ny: -1, nz: 0, text: 'Верхушка железы (Apex prostatae)' },
    ],
  },
  {
    name: 'organ-skin.glb',
    objIds: ['FJ2810.obj'],
    color: [0.88, 0.72, 0.64, 1.0], // Epidermal skin tone
    roughness: 0.55,
    metallic: 0.02,
    systemKey: 'кожа',
    hotspots: [
      { x: 0.0, y: 0.04, z: 0.02, nx: 0, ny: 1, nz: 1, text: 'Эпидермис и роговой слой (Epidermis)' },
      { x: 0.0, y: 0.0, z: 0.02, nx: 0, ny: 0, nz: 1, text: 'Дерма и сосудистая сеть (Dermis)' },
      { x: 0.0, y: -0.04, z: 0.01, nx: 0, ny: -1, nz: 0, text: 'Подкожно-жировая клетчатка (Hypodermis)' },
    ],
  },
];

async function run() {
  console.log('=== Загрузка и сборка полного комплекта 3D-моделей всех органов из GitHub ===\n');

  for (const organ of ORGANS_TO_BUILD) {
    console.log(`Сборка ${organ.name}...`);
    let combinedObj = '';

    for (const objId of organ.objIds) {
      const url = BASE_URL + objId;
      try {
        const res = await fetch(url);
        if (res.ok) {
          const text = await res.text();
          combinedObj += '\n' + text;
        } else {
          console.warn(`Не удалось загрузить ${objId} (${res.status})`);
        }
      } catch (err) {
        console.warn(`Ошибка загрузки ${objId}:`, err.message);
      }
    }

    if (combinedObj.trim()) {
      const glbBuffer = objToGlb(combinedObj, {
        name: organ.name.replace('.glb', ''),
        color: organ.color,
        roughness: organ.roughness,
        metallic: organ.metallic,
      });

      const outPath = path.join(UPLOADS_DIR, organ.name);
      fs.writeFileSync(outPath, glbBuffer);
      console.log(`✓ Создана 3D-модель ${organ.name} (${(glbBuffer.length / 1024).toFixed(1)} KB)`);
    }
  }

  // Update entries.json to link all 401 records to their corresponding 3D models
  console.log('\nОбновление базы нозологий (entries.json)...');
  const entries = JSON.parse(fs.readFileSync(ENTRIES_FILE, 'utf8'));

  let linkedCount = 0;
  entries.forEach((entry) => {
    const sys = (entry.system || '').toLowerCase();
    const title = (entry.title || '').toLowerCase();
    const combined = sys + ' ' + title;

    for (const organ of ORGANS_TO_BUILD) {
      if (combined.includes(organ.systemKey)) {
        entry.modelUrl = '/uploads/' + organ.name;
        entry.labels3d = organ.hotspots;
        linkedCount++;
        break;
      }
    }
  });

  fs.writeFileSync(ENTRIES_FILE, JSON.stringify(entries, null, 2), 'utf8');
  console.log(`✓ Успешно привязаны 3D-модели к ${linkedCount} записям нозологий!`);
}

run().catch(console.error);
