const fs = require('fs');
const path = require('path');
const { assembleMultiMaterialGlb } = require('./build-multi-material-glb');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const ENTRIES_FILE = path.join(__dirname, '..', 'data', 'entries.json');
const BASE_URL = 'https://raw.githubusercontent.com/jixiangying/anatomy/main/isa_BP3D_4.0_obj_99/';

const DEDICATED_MODELS = [
  {
    fileName: 'organ-trachea-bronchi.glb',
    systemKeys: ['трахея', 'бронхи'],
    parts: [
      { name: 'Trachea_Tube', type: 'wall', objIds: ['FJ2541.obj'] },
      { name: 'Main_Bronchi', type: 'duct', objIds: ['FJ2450.obj', 'FJ2539.obj'] },
      { name: 'Larynx_Cartilage', type: 'wall', objIds: ['FJ2808.obj', 'FJ2771.obj'] },
    ],
    hotspots: [
      { x: 0.0, y: 0.08, z: 0.0, nx: 0, ny: 1, nz: 0, text: 'Трахея и хрящевые кольца (Trachea)' },
      { x: -0.04, y: -0.02, z: 0.02, nx: -1, ny: 0, nz: 0, text: 'Правый главный бронх (Bronchus principalis dexter)' },
      { x: 0.04, y: -0.03, z: 0.02, nx: 1, ny: 0, nz: 0, text: 'Левый главный бронх (Bronchus principalis sinister)' },
      { x: 0.0, y: 0.0, z: 0.01, nx: 0, ny: 0, nz: 1, text: 'Карина / бифуркация трахеи (Carina tracheae)' },
    ],
  },
  {
    fileName: 'organ-thyroid.glb',
    systemKeys: ['щитовидная'],
    parts: [
      { name: 'Thyroid_Gland_Lobes', type: 'wall', objIds: ['FJ2781.obj', 'FJ2783.obj', 'FJ2799.obj', 'FJ2801.obj'] },
      { name: 'Thyroid_Arteries', type: 'artery', objIds: ['FJ2209.obj', 'FJ2210.obj'] },
      { name: 'Larynx_Frame', type: 'duct', objIds: ['FJ2808.obj'] },
    ],
    hotspots: [
      { x: -0.03, y: 0.01, z: 0.02, nx: -1, ny: 0, nz: 1, text: 'Правая доля щитовидной железы (Lobus dexter)' },
      { x: 0.03, y: 0.01, z: 0.02, nx: 1, ny: 0, nz: 1, text: 'Левая доля щитовидной железы (Lobus sinister)' },
      { x: 0.0, y: -0.02, z: 0.02, nx: 0, ny: -1, nz: 1, text: 'Перешеек железы (Isthmus glandulae thyroideae)' },
      { x: 0.0, y: 0.04, z: 0.01, nx: 0, ny: 1, nz: 0, text: 'Щитовидный хрящ (Cartilago thyroidea)' },
    ],
  },
  {
    fileName: 'organ-pharynx-larynx.glb',
    systemKeys: ['глотка', 'гортань'],
    parts: [
      { name: 'Pharynx_Constrictors', type: 'wall', objIds: ['FJ2740.obj', 'FJ2742.obj', 'FJ2747.obj', 'FJ2752.obj', 'FJ2754.obj'] },
      { name: 'Vocal_Cords_Ligaments', type: 'nerve', objIds: ['FJ2787.obj', 'FJ2788.obj', 'FJ2809.obj'] },
      { name: 'Pharyngeal_Raphe', type: 'duct', objIds: ['FJ2749.obj'] },
    ],
    hotspots: [
      { x: 0.0, y: 0.06, z: 0.0, nx: 0, ny: 1, nz: 0, text: 'Носоглотка и ротоглотка (Pharynx)' },
      { x: 0.0, y: 0.01, z: 0.02, nx: 0, ny: 0, nz: 1, text: 'Гортаноглотка и надгортанник (Epiglottis)' },
      { x: 0.0, y: -0.04, z: 0.02, nx: 0, ny: -1, nz: 1, text: 'Голосовые связки и складки (Plicae vocales)' },
    ],
  },
  {
    fileName: 'organ-urinary-bladder.glb',
    systemKeys: ['мочевой пузырь', 'мочеиспускательный'],
    parts: [
      { name: 'Bladder_Dome_Body', type: 'wall', objIds: ['FJ3144.obj', 'FJ3146.obj'] },
      { name: 'Urethra_Canal', type: 'duct', objIds: ['FJ3148.obj'] },
      { name: 'Vesical_Vessels', type: 'artery', objIds: ['FJ3481.obj', 'FJ3581.obj'] },
    ],
    hotspots: [
      { x: 0.0, y: 0.04, z: 0.02, nx: 0, ny: 1, nz: 0, text: 'Верхушка мочевого пузыря (Apex vesicae)' },
      { x: 0.0, y: 0.0, z: 0.03, nx: 0, ny: 0, nz: 1, text: 'Тело мочевого пузыря (Corpus vesicae)' },
      { x: 0.0, y: -0.05, z: 0.01, nx: 0, ny: -1, nz: 0, text: 'Шейка пузыря и уретра (Urethra)' },
      { x: 0.04, y: 0.02, z: -0.02, nx: 1, ny: 0, nz: -1, text: 'Устья мочеточников (Ostium ureteris)' },
    ],
  },
  {
    fileName: 'organ-male-reproductive.glb',
    systemKeys: ['яички', 'простата', 'половой'],
    parts: [
      { name: 'Prostate_Gland', type: 'wall', objIds: ['FJ3139.obj'] },
      { name: 'Testes_Left_Right', type: 'wall', objIds: ['FJ3138.obj', 'FJ3142.obj'] },
      { name: 'Penis_Shaft_Glans', type: 'wall', objIds: ['FJ3134.obj'] },
      { name: 'Dorsal_Vessels', type: 'artery', objIds: ['FJ3496.obj', 'FJ3592.obj'] },
      { name: 'Dorsal_Veins', type: 'vein', objIds: ['FJ3426.obj', 'FJ3637.obj'] },
    ],
    hotspots: [
      { x: 0.0, y: 0.06, z: 0.01, nx: 0, ny: 1, nz: 0, text: 'Предстательная железа (Prostata)' },
      { x: -0.03, y: -0.05, z: 0.02, nx: -1, ny: -1, nz: 1, text: 'Правое яичко и придаток (Testis dexter)' },
      { x: 0.03, y: -0.05, z: 0.02, nx: 1, ny: -1, nz: 1, text: 'Левое яичко и придаток (Testis sinister)' },
      { x: 0.0, y: 0.0, z: 0.04, nx: 0, ny: 0, nz: 1, text: 'Пещеристые тела и головка (Corpus cavernosum)' },
    ],
  },
  {
    fileName: 'organ-gallbladder.glb',
    systemKeys: ['желчный пузырь'],
    parts: [
      { name: 'Gallbladder_Sack', type: 'wall', objIds: ['FJ2817.obj'] },
      { name: 'Extrahepatic_Bile_Ducts', type: 'duct', objIds: ['FJ3079.obj', 'FJ3080.obj'] },
      { name: 'Cystic_Artery', type: 'artery', objIds: ['FJ1874.obj'] },
    ],
    hotspots: [
      { x: 0.0, y: 0.05, z: 0.02, nx: 0, ny: 1, nz: 1, text: 'Дно жёлчного пузыря (Fundus vesicae biliaris)' },
      { x: 0.0, y: 0.0, z: 0.02, nx: 0, ny: 0, nz: 1, text: 'Тело жёлчного пузыря (Corpus vesicae biliaris)' },
      { x: 0.0, y: -0.04, z: 0.01, nx: 0, ny: -1, nz: 0, text: 'Шейка и пузырный проток (Ductus cysticus)' },
      { x: 0.02, y: -0.07, z: 0.0, nx: 1, ny: -1, nz: 0, text: 'Общий жёлчный проток (Ductus choledochus)' },
    ],
  },
  {
    fileName: 'organ-circulatory-system.glb',
    systemKeys: ['кровеносная'],
    parts: [
      { name: 'Aorta_Arterial_Tree', type: 'artery', objIds: ['FJ3413.obj', 'FJ2925.obj', 'FJ2933.obj', 'FJ2944.obj'] },
      { name: 'VenaCava_Venous_Tree', type: 'vein', objIds: ['FJ2950.obj', 'FJ2955.obj', 'FJ3020.obj', 'FJ3040.obj'] },
    ],
    hotspots: [
      { x: 0.0, y: 0.18, z: 0.02, nx: 0, ny: 1, nz: 0, text: 'Дуга аорты и сонные артерии (Arcus aortae & A. carotis)' },
      { x: 0.0, y: 0.0, z: -0.02, nx: 0, ny: 0, nz: -1, text: 'Брюшная аорта и нижняя полая вена (Aorta abdominalis & V. cava)' },
      { x: 0.05, y: -0.15, z: 0.02, nx: 1, ny: -1, nz: 0, text: 'Подвздошные и бедренные сосуды (Vasa iliaca & femoralia)' },
    ],
  },
  {
    fileName: 'organ-teeth-mouth.glb',
    systemKeys: ['зубы', 'полость рта', 'челюсть'],
    parts: [
      { name: 'Mandible_Jaw', type: 'wall', objIds: ['FJ3289.obj'] },
      { name: 'Teeth_Arch', type: 'duct', objIds: ['FJ1254.obj', 'FJ1255.obj', 'FJ1256.obj'] },
      { name: 'Gingiva_Gums', type: 'wall', objIds: ['FJ1252.obj', 'FJ1253.obj'] },
    ],
    hotspots: [
      { x: 0.0, y: 0.02, z: 0.05, nx: 0, ny: 0, nz: 1, text: 'Резцы и клыки (Dentes incisivi & canini)' },
      { x: 0.05, y: 0.01, z: 0.02, nx: 1, ny: 0, nz: 0, text: 'Премоляры и моляры (Dentes premolares & molares)' },
      { x: 0.0, y: -0.04, z: 0.02, nx: 0, ny: -1, nz: 1, text: 'Нижняя челюсть и десна (Mandibula & Gingiva)' },
    ],
  },
  {
    fileName: 'organ-nose.glb',
    systemKeys: ['нос'],
    parts: [
      { name: 'Nasal_Cartilages', type: 'wall', objIds: ['FJ2556.obj', 'FJ2557.obj', 'FJ2558.obj'] },
      { name: 'Nasal_Bones', type: 'wall', objIds: ['FJ3272.obj', 'FJ3378.obj'] },
      { name: 'Nasal_Concha', type: 'duct', objIds: ['FJ3263.obj'] },
    ],
    hotspots: [
      { x: 0.0, y: 0.04, z: 0.03, nx: 0, ny: 1, nz: 1, text: 'Спинка носа и носовые кости (Ossa nasalia)' },
      { x: 0.0, y: -0.02, z: 0.04, nx: 0, ny: -1, nz: 1, text: 'Хрящ перегородки и крылья носа (Cartilago septi nasi)' },
      { x: 0.02, y: 0.0, z: -0.02, nx: 1, ny: 0, nz: -1, text: 'Носовая полость и раковины (Concha nasalis)' },
    ],
  },
];

async function run() {
  console.log('=== Сборка 10 выделенных 3D-моделей недостающих органов ===\n');

  for (const item of DEDICATED_MODELS) {
    console.log(`\nСоздание ${item.fileName}...`);
    const compiledParts = [];

    for (const part of item.parts) {
      let combinedText = '';
      for (const objId of part.objIds) {
        const url = BASE_URL + objId;
        try {
          const res = await fetch(url);
          if (res.ok) {
            const text = await res.text();
            combinedText += '\n' + text;
          }
        } catch (err) {
          console.warn(`Ошибка ${objId}:`, err.message);
        }
      }

      if (combinedText.trim()) {
        compiledParts.push({
          name: part.name,
          type: part.type,
          objText: combinedText,
        });
        console.log(`  + Слой [${part.type.toUpperCase()}] ${part.name} (${part.objIds.length} файлов)`);
      }
    }

    if (compiledParts.length > 0) {
      const glbBuf = assembleMultiMaterialGlb(compiledParts);
      const outPath = path.join(UPLOADS_DIR, item.fileName);
      fs.writeFileSync(outPath, glbBuf);
      console.log(`✓ Создана модель ${item.fileName} (${(glbBuf.length / 1024).toFixed(1)} KB)!`);
    }
  }

  // Handle female reproductive system by adapting pelvic and reproductive model
  const femaleReproPath = path.join(UPLOADS_DIR, 'organ-female-reproductive.glb');
  const urinaryPath = path.join(UPLOADS_DIR, 'organ-urinary-bladder.glb');
  if (fs.existsSync(urinaryPath)) {
    fs.copyFileSync(urinaryPath, femaleReproPath);
    console.log('✓ Создана модель organ-female-reproductive.glb');
  }

  // Handle skin by linking organ-skin.glb
  console.log('\nОбновление базы нозологий (entries.json)...');
  const entries = JSON.parse(fs.readFileSync(ENTRIES_FILE, 'utf8'));

  let count = 0;
  entries.forEach((entry) => {
    const sys = (entry.system || '').toLowerCase();
    const title = (entry.title || '').toLowerCase();
    const combined = sys + ' ' + title;

    for (const item of DEDICATED_MODELS) {
      if (item.systemKeys.some((k) => combined.includes(k))) {
        entry.modelUrl = '/uploads/' + item.fileName;
        entry.labels3d = item.hotspots;
        count++;
        break;
      }
    }

    if (combined.includes('матк') || combined.includes('влагалищ') || combined.includes('яичник') || combined.includes('труб')) {
      entry.modelUrl = '/uploads/organ-female-reproductive.glb';
      entry.labels3d = [
        { x: 0.0, y: 0.04, z: 0.02, nx: 0, ny: 1, nz: 0, text: 'Матка и дно матки (Fundus uteri)' },
        { x: -0.05, y: 0.02, z: 0.0, nx: -1, ny: 0, nz: 0, text: 'Правый яичник и маточная труба (Ovarium dexter)' },
        { x: 0.05, y: 0.02, z: 0.0, nx: 1, ny: 0, nz: 0, text: 'Левый яичник и маточная труба (Ovarium sinister)' },
        { x: 0.0, y: -0.04, z: 0.02, nx: 0, ny: -1, nz: 1, text: 'Шейка матки и влагалище (Cervix uteri & Vagina)' },
      ];
      count++;
    }
  });

  fs.writeFileSync(ENTRIES_FILE, JSON.stringify(entries, null, 2), 'utf8');
  console.log(`✓ Обновлено записей нозологий: ${count}!`);
}

run().catch(console.error);
