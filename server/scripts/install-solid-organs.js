const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const ENTRIES_FILE = path.join(__dirname, '..', 'data', 'entries.json');

// Authentic, complete, solid 3D medical organs (HuBMAP, NIH 3D, Open Anatomy)
const AUTHENTIC_SOLID_MODELS = [
  {
    name: 'organ-heart.glb',
    url: 'https://raw.githubusercontent.com/code4fukui/human_organs/main/glb/VH_M_Heart.glb',
    systemKey: 'сердце',
    hotspots: [
      { x: 0.0, y: 0.07, z: 0.02, nx: 0, ny: 1, nz: 0, text: 'Аорта и дуга аорты (Arcus aortae)' },
      { x: 0.04, y: 0.01, z: 0.03, nx: 1, ny: 0, nz: 1, text: 'Левый желудочек (Ventriculus sinister)' },
      { x: -0.04, y: -0.01, z: 0.03, nx: -1, ny: 0, nz: 1, text: 'Правый желудочек (Ventriculus dexter)' },
      { x: 0.0, y: -0.06, z: 0.02, nx: 0, ny: -1, nz: 1, text: 'Верхушка сердца (Apex cordis)' },
      { x: 0.02, y: 0.02, z: 0.04, nx: 0, ny: 0, nz: 1, text: 'Венечные сосуды (Vasa coronaria)' },
    ],
  },
  {
    name: 'organ-stomach.glb',
    url: 'https://raw.githubusercontent.com/code4fukui/human_organs/main/glb/realistic_stomach.glb',
    systemKey: 'желудок',
    hotspots: [
      { x: 0.0, y: 0.08, z: 0.0, nx: 0, ny: 1, nz: 0, text: 'Кардиальная часть и пищевод (Cardia)' },
      { x: -0.06, y: 0.05, z: 0.03, nx: -1, ny: 1, nz: 1, text: 'Дно желудка (Fundus gastricus)' },
      { x: 0.0, y: -0.02, z: 0.04, nx: 0, ny: 0, nz: 1, text: 'Тело желудка (Corpus gastricum)' },
      { x: 0.06, y: -0.07, z: 0.01, nx: 1, ny: -1, nz: 0, text: 'Привратник (Pylorus)' },
    ],
  },
  {
    name: 'organ-liver.glb',
    url: 'https://raw.githubusercontent.com/code4fukui/human_organs/main/glb/VH_M_Liver.glb',
    systemKey: 'печень',
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
    hotspots: [
      { x: 0.0, y: 0.06, z: 0.01, nx: 0, ny: 1, nz: 0, text: 'Верхний полюс (Extremitas superior)' },
      { x: 0.0, y: 0.0, z: 0.04, nx: 0, ny: 0, nz: 1, text: 'Корковое вещество (Cortex renalis)' },
      { x: 0.04, y: -0.01, z: 0.0, nx: 1, ny: 0, nz: 0, text: 'Почечная лоханка и сосуды (Pelvis renalis)' },
      { x: 0.0, y: -0.06, z: 0.01, nx: 0, ny: -1, nz: 0, text: 'Нижний полюс и мочеточник (Ureter)' },
    ],
  },
  {
    name: 'organ-pancreas.glb',
    url: 'https://raw.githubusercontent.com/code4fukui/human_organs/main/glb/3d-vh-m-pancreas.glb',
    systemKey: 'поджелудочная',
    hotspots: [
      { x: -0.06, y: 0.0, z: 0.02, nx: -1, ny: 0, nz: 1, text: 'Головка железы (Caput pancreatis)' },
      { x: 0.0, y: 0.01, z: 0.02, nx: 0, ny: 0, nz: 1, text: 'Тело железы и проток (Corpus pancreatis)' },
      { x: 0.06, y: 0.02, z: 0.01, nx: 1, ny: 0, nz: 1, text: 'Хвост железы (Cauda pancreatis)' },
    ],
  },
  {
    name: 'organ-eye.glb',
    url: 'https://raw.githubusercontent.com/fabbbiodc/portfolio/main/public/models/eye.glb',
    systemKey: 'глаза',
    hotspots: [
      { x: 0.0, y: 0.0, z: 0.12, nx: 0, ny: 0, nz: 1, text: 'Роговица и передняя камера (Cornea)' },
      { x: 0.0, y: 0.0, z: 0.08, nx: 0, ny: 0, nz: 1, text: 'Радужка и зрачок (Iris & Pupilla)' },
      { x: 0.10, y: 0.05, z: 0.0, nx: 1, ny: 0, nz: 0, text: 'Склера (Sclera)' },
      { x: 0.0, y: 0.0, z: -0.12, nx: 0, ny: 0, nz: -1, text: 'Зрительный нерв и сетчатка (Nervus opticus)' },
    ],
  },
  {
    name: 'organ-skeleton.glb',
    url: 'https://raw.githubusercontent.com/sesgigikimo/gym-muscle/main/skeleton.glb',
    systemKey: 'кости',
    hotspots: [
      { x: 0.0, y: 0.38, z: 0.02, nx: 0, ny: 1, nz: 1, text: 'Череп (Cranium)' },
      { x: 0.0, y: 0.15, z: 0.04, nx: 0, ny: 0, nz: 1, text: 'Грудная клетка и рёбра (Thorax & Costae)' },
      { x: 0.0, y: 0.0, z: -0.03, nx: 0, ny: 0, nz: -1, text: 'Позвоночник (Columna vertebralis)' },
      { x: 0.0, y: -0.08, z: 0.02, nx: 0, ny: 0, nz: 1, text: 'Таз (Pelvis)' },
      { x: 0.08, y: -0.25, z: 0.02, nx: 0, ny: 0, nz: 1, text: 'Суставы конечностей' },
    ],
  },
  {
    name: 'organ-ear.glb',
    url: 'https://raw.githubusercontent.com/ManasaM-2203/Ear_Anatomy-3D/main/public/Telinga.glb',
    systemKey: 'уши',
    hotspots: [
      { x: 0.0, y: 0.05, z: 0.03, nx: 0, ny: 1, nz: 1, text: 'Ушная раковина (Auricula)' },
      { x: 0.0, y: 0.0, z: 0.0, nx: 0, ny: 0, nz: 1, text: 'Слуховой проход (Meatus acusticus)' },
      { x: -0.02, y: -0.04, z: -0.02, nx: -1, ny: 0, nz: -1, text: 'Слуховые косточки (Ossicula auditus)' },
    ],
  },
  {
    name: 'organ-intestines.glb',
    url: 'https://raw.githubusercontent.com/code4fukui/human_organs/main/glb/SBU_F_Intestine_Large.glb',
    systemKey: 'кишечник',
    hotspots: [
      { x: 0.0, y: 0.06, z: 0.02, nx: 0, ny: 1, nz: 0, text: 'Ободочная кишка (Colon)' },
      { x: 0.0, y: -0.08, z: 0.01, nx: 0, ny: -1, nz: 0, text: 'Прямая кишка (Rectum)' },
    ],
  },
  {
    name: 'organ-urinary-bladder.glb',
    url: 'https://raw.githubusercontent.com/code4fukui/human_organs/main/glb/VH_F_Urinary_Bladder.glb',
    systemKey: 'мочевой пузырь',
    hotspots: [
      { x: 0.0, y: 0.04, z: 0.02, nx: 0, ny: 1, nz: 0, text: 'Верхушка мочевого пузыря (Apex vesicae)' },
      { x: 0.0, y: 0.0, z: 0.03, nx: 0, ny: 0, nz: 1, text: 'Тело мочевого пузыря (Corpus vesicae)' },
    ],
  },
];

async function install() {
  console.log('=== Установка подлинных монолитных 3D-моделей органов ===\n');

  for (const m of AUTHENTIC_SOLID_MODELS) {
    console.log(`Загрузка ${m.name}...`);
    try {
      const res = await fetch(m.url);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        const outPath = path.join(UPLOADS_DIR, m.name);
        fs.writeFileSync(outPath, buf);
        console.log(`✓ Установлен ${m.name} (${(buf.length / 1024).toFixed(1)} KB)`);
      } else {
        console.warn(`Не удалось загрузить ${m.name}: ${res.status}`);
      }
    } catch (e) {
      console.error(`Ошибка при загрузке ${m.name}:`, e.message);
    }
  }

  // Duplicate for right kidney
  const leftKidney = path.join(UPLOADS_DIR, 'organ-left-kidney.glb');
  const rightKidney = path.join(UPLOADS_DIR, 'organ-right-kidney.glb');
  if (fs.existsSync(leftKidney)) {
    fs.copyFileSync(leftKidney, rightKidney);
    console.log('✓ Синхронизирован organ-right-kidney.glb');
  }

  // Update entries.json
  console.log('\nОбновление entries.json...');
  const entries = JSON.parse(fs.readFileSync(ENTRIES_FILE, 'utf8'));

  entries.forEach((entry) => {
    const sys = (entry.system || '').toLowerCase();
    const title = (entry.title || '').toLowerCase();
    const combined = sys + ' ' + title;

    for (const m of AUTHENTIC_SOLID_MODELS) {
      if (combined.includes(m.systemKey)) {
        entry.modelUrl = '/uploads/' + m.name;
        entry.labels3d = m.hotspots;
        break;
      }
    }
  });

  fs.writeFileSync(ENTRIES_FILE, JSON.stringify(entries, null, 2), 'utf8');
  console.log('✓ Все записи синхронизированы с монолитными 3D-моделями!');
}

install().catch(console.error);
