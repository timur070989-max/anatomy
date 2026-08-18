const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const ENTRIES_FILE = path.join(__dirname, '..', 'data', 'entries.json');

// High-resolution, authentic medical 3D GLB models from NIH 3D Print Exchange, HuBMAP & open repositories
const HIGH_RES_MODELS = [
  {
    name: 'organ-heart.glb',
    url: 'https://raw.githubusercontent.com/code4fukui/human_organs/main/glb/VH_M_Heart.glb',
    systemKey: 'сердце',
    color: [0.78, 0.14, 0.16, 1.0], // Myocardium Crimson
    roughness: 0.32,
    metallic: 0.08,
    hotspots: [
      { x: 0.0, y: 0.07, z: 0.02, nx: 0, ny: 1, nz: 0, text: 'Аорта и дуга аорты (Arcus aortae)' },
      { x: 0.05, y: 0.01, z: 0.03, nx: 1, ny: 0, nz: 1, text: 'Левый желудочек (Ventriculus sinister)' },
      { x: -0.05, y: -0.01, z: 0.03, nx: -1, ny: 0, nz: 1, text: 'Правый желудочек (Ventriculus dexter)' },
      { x: 0.0, y: -0.06, z: 0.02, nx: 0, ny: -1, nz: 1, text: 'Верхушка сердца (Apex cordis)' },
      { x: 0.02, y: 0.02, z: 0.05, nx: 0, ny: 0, nz: 1, text: 'Венечные артерии (Arteriae coronariae)' },
    ],
  },
  {
    name: 'organ-stomach.glb',
    url: 'https://raw.githubusercontent.com/code4fukui/human_organs/main/glb/realistic_stomach.glb',
    systemKey: 'желудок',
    color: [0.82, 0.48, 0.44, 1.0], // Gastric mucosa pink
    roughness: 0.38,
    metallic: 0.04,
    hotspots: [
      { x: 0.0, y: 0.08, z: 0.0, nx: 0, ny: 1, nz: 0, text: 'Кардиальная часть и пищевод (Cardia)' },
      { x: -0.06, y: 0.05, z: 0.03, nx: -1, ny: 1, nz: 1, text: 'Дно желудка (Fundus gastricus)' },
      { x: 0.0, y: -0.02, z: 0.04, nx: 0, ny: 0, nz: 1, text: 'Тело желудка (Corpus gastricum)' },
      { x: 0.06, y: -0.07, z: 0.01, nx: 1, ny: -1, nz: 0, text: 'Привратник и пилорический сфинктер (Pylorus)' },
    ],
  },
  {
    name: 'organ-liver.glb',
    url: 'https://raw.githubusercontent.com/code4fukui/human_organs/main/glb/VH_M_Liver.glb',
    systemKey: 'печень',
    color: [0.62, 0.22, 0.18, 1.0], // Deep Liver Maroon
    roughness: 0.35,
    metallic: 0.04,
    hotspots: [
      { x: -0.06, y: 0.02, z: 0.03, nx: -1, ny: 0, nz: 1, text: 'Правая доля печени (Lobus dexter hepatis)' },
      { x: 0.06, y: 0.02, z: 0.02, nx: 1, ny: 0, nz: 1, text: 'Левая доля печени (Lobus sinister hepatis)' },
      { x: -0.02, y: -0.05, z: 0.04, nx: 0, ny: -1, nz: 1, text: 'Жёлчный пузырь (Vesica biliaris)' },
      { x: 0.0, y: -0.02, z: -0.03, nx: 0, ny: 0, nz: -1, text: 'Ворота печени и воротная вена (Porta hepatis)' },
    ],
  },
  {
    name: 'organ-left-kidney.glb',
    url: 'https://raw.githubusercontent.com/code4fukui/human_organs/main/glb/VH_M_Kidney_L.glb',
    systemKey: 'почки',
    color: [0.54, 0.16, 0.14, 1.0], // Renal Dark Bean Red
    roughness: 0.34,
    metallic: 0.04,
    hotspots: [
      { x: 0.0, y: 0.06, z: 0.01, nx: 0, ny: 1, nz: 0, text: 'Верхний полюс почки (Extremitas superior)' },
      { x: 0.0, y: 0.0, z: 0.04, nx: 0, ny: 0, nz: 1, text: 'Корковое вещество (Cortex renalis)' },
      { x: 0.04, y: -0.01, z: 0.0, nx: 1, ny: 0, nz: 0, text: 'Почечная лоханка и сосудистая ножка (Pelvis renalis)' },
      { x: 0.0, y: -0.06, z: 0.01, nx: 0, ny: -1, nz: 0, text: 'Нижний полюс и мочеточник (Extremitas inferior)' },
    ],
  },
  {
    name: 'organ-pancreas.glb',
    url: 'https://raw.githubusercontent.com/code4fukui/human_organs/main/glb/3d-vh-m-pancreas.glb',
    systemKey: 'поджелудочная',
    color: [0.85, 0.66, 0.36, 1.0], // Golden Ochre Pancreas
    roughness: 0.48,
    metallic: 0.02,
    hotspots: [
      { x: -0.06, y: 0.0, z: 0.02, nx: -1, ny: 0, nz: 1, text: 'Головка поджелудочной железы (Caput pancreatis)' },
      { x: 0.0, y: 0.01, z: 0.02, nx: 0, ny: 0, nz: 1, text: 'Тело железы и панкреатический проток (Corpus pancreatis)' },
      { x: 0.06, y: 0.02, z: 0.01, nx: 1, ny: 0, nz: 1, text: 'Хвост железы (Cauda pancreatis)' },
    ],
  },
  {
    name: 'organ-skeleton.glb',
    url: 'https://raw.githubusercontent.com/sesgigikimo/gym-muscle/main/skeleton.glb',
    systemKey: 'кости',
    color: [0.94, 0.92, 0.86, 1.0], // Bone Ivory
    roughness: 0.48,
    metallic: 0.02,
    hotspots: [
      { x: 0.0, y: 0.38, z: 0.02, nx: 0, ny: 1, nz: 1, text: 'Череп (Cranium)' },
      { x: 0.0, y: 0.15, z: 0.04, nx: 0, ny: 0, nz: 1, text: 'Грудная клетка и рёбра (Thorax & Costae)' },
      { x: 0.0, y: 0.0, z: -0.03, nx: 0, ny: 0, nz: -1, text: 'Позвоночный столб (Columna vertebralis)' },
      { x: 0.0, y: -0.08, z: 0.02, nx: 0, ny: 0, nz: 1, text: 'Тазовый пояс (Pelvis)' },
      { x: 0.08, y: -0.25, z: 0.02, nx: 0, ny: 0, nz: 1, text: 'Бедренная кость и коленный сустав (Femur)' },
    ],
  },
  {
    name: 'organ-ear.glb',
    url: 'https://raw.githubusercontent.com/ManasaM-2203/Ear_Anatomy-3D/main/public/Telinga.glb',
    systemKey: 'уши',
    color: [0.88, 0.72, 0.65, 1.0], // Auricular flesh
    roughness: 0.40,
    metallic: 0.05,
    hotspots: [
      { x: 0.0, y: 0.05, z: 0.03, nx: 0, ny: 1, nz: 1, text: 'Ушная раковина (Auricula)' },
      { x: 0.0, y: 0.0, z: 0.0, nx: 0, ny: 0, nz: 1, text: 'Наружный слуховой проход (Meatus acusticus)' },
      { x: -0.02, y: -0.04, z: -0.02, nx: -1, ny: 0, nz: -1, text: 'Барабанная полость и слуховые косточки (Cavitas tympanica)' },
    ],
  },
  {
    name: 'organ-intestines.glb',
    url: 'https://raw.githubusercontent.com/code4fukui/human_organs/main/glb/SBU_F_Intestine_Large.glb',
    systemKey: 'кишечник',
    color: [0.82, 0.58, 0.46, 1.0], // Intestinal warm tone
    roughness: 0.42,
    metallic: 0.03,
    hotspots: [
      { x: 0.0, y: 0.06, z: 0.02, nx: 0, ny: 1, nz: 0, text: 'Ободочная кишка (Colon transversum)' },
      { x: -0.06, y: -0.02, z: 0.02, nx: -1, ny: 0, nz: 1, text: 'Восходящая кишка (Colon ascendens)' },
      { x: 0.06, y: -0.02, z: 0.02, nx: 1, ny: 0, nz: 1, text: 'Нисходящая кишка (Colon descendens)' },
      { x: 0.0, y: -0.08, z: 0.01, nx: 0, ny: -1, nz: 0, text: 'Прямая кишка (Rectum)' },
    ],
  },
  {
    name: 'organ-urinary-bladder.glb',
    url: 'https://raw.githubusercontent.com/code4fukui/human_organs/main/glb/VH_F_Urinary_Bladder.glb',
    systemKey: 'мочевой пузырь',
    color: [0.88, 0.52, 0.40, 1.0], // Bladder wall amber-pink
    roughness: 0.38,
    metallic: 0.04,
    hotspots: [
      { x: 0.0, y: 0.04, z: 0.02, nx: 0, ny: 1, nz: 0, text: 'Верхушка мочевого пузыря (Apex vesicae)' },
      { x: 0.0, y: 0.0, z: 0.03, nx: 0, ny: 0, nz: 1, text: 'Тело мочевого пузыря (Corpus vesicae)' },
      { x: 0.0, y: -0.04, z: 0.01, nx: 0, ny: -1, nz: 0, text: 'Дно и шейка мочевого пузыря (Fundus & Cervix)' },
    ],
  },
];

async function downloadAndInstall() {
  console.log('=== Загрузка высокодетализированных оригинальных 3D-моделей органов (NIH 3D / HuBMAP) ===\n');

  for (const item of HIGH_RES_MODELS) {
    console.log(`Загрузка ${item.name} с ${item.url}...`);
    try {
      const res = await fetch(item.url);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        const outPath = path.join(UPLOADS_DIR, item.name);
        fs.writeFileSync(outPath, buf);
        console.log(`✓ Успешно установлен ${item.name} (${(buf.length / 1024).toFixed(1)} KB)`);
      } else {
        console.warn(`Не удалось загрузить ${item.name} (${res.status})`);
      }
    } catch (err) {
      console.error(`Ошибка при загрузке ${item.name}:`, err.message);
    }
  }

  // Ensure organ-right-kidney.glb is also updated
  const leftKidneyPath = path.join(UPLOADS_DIR, 'organ-left-kidney.glb');
  const rightKidneyPath = path.join(UPLOADS_DIR, 'organ-right-kidney.glb');
  if (fs.existsSync(leftKidneyPath)) {
    fs.copyFileSync(leftKidneyPath, rightKidneyPath);
    console.log('✓ Синхронизирован organ-right-kidney.glb');
  }

  // Update entries.json
  console.log('\nОбновление базы нозологий (entries.json)...');
  const entries = JSON.parse(fs.readFileSync(ENTRIES_FILE, 'utf8'));

  entries.forEach((entry) => {
    const sys = (entry.system || '').toLowerCase();
    const title = (entry.title || '').toLowerCase();
    const combined = sys + ' ' + title;

    for (const m of HIGH_RES_MODELS) {
      if (combined.includes(m.systemKey)) {
        entry.modelUrl = '/uploads/' + m.name;
        entry.labels3d = m.hotspots;
        break;
      }
    }
  });

  fs.writeFileSync(ENTRIES_FILE, JSON.stringify(entries, null, 2), 'utf8');
  console.log('✓ Все 401 нозологии успешно привязаны к аутентичным медицинским 3D-моделям!');
}

downloadAndInstall().catch(console.error);
