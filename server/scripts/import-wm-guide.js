const fs = require('fs');
const path = require('path');

const GENDERS = [
  { id: 45, profile: 'male', label: 'Мужчина' },
  { id: 46, profile: 'female', label: 'Женщина' },
  { id: 47, profile: 'child', label: 'Ребёнок' },
];

const ORGAN_MODELS = {
  'печень': '/uploads/organ-liver.glb',
  'желудок': '/uploads/organ-stomach.glb',
  'поджелудочн': '/uploads/organ-pancreas.glb',
  'жёлчн': '/uploads/organ-gallbladder.glb',
  'желчн': '/uploads/organ-gallbladder.glb',
  'почк': '/uploads/organ-right-kidney.glb',
  'мочевой': '/uploads/organ-urinary-bladder.glb',
};

function matchModel(organName) {
  const lower = (organName || '').toLowerCase();
  for (const [key, modelPath] of Object.entries(ORGAN_MODELS)) {
    if (lower.includes(key)) return modelPath;
  }
  return null;
}

function cleanHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

async function fetchGenderData(genderId) {
  const res = await fetch('https://wmapp.life-style.uz/api/v1/app/gender/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gender_id: genderId }),
  });
  if (!res.ok) throw new Error(`Failed to fetch gender ${genderId}: ${res.statusText}`);
  const json = await res.json();
  return json.data;
}

async function run() {
  console.log('=== Запуск миграции данных World Medicine Guide ===');
  
  const allEntries = [];
  const bodyMaps = {};

  for (const g of GENDERS) {
    console.log(`\nЗагрузка профиля: ${g.label} (ID: ${g.id})...`);
    const data = await fetchGenderData(g.id);
    
    // 1. Формируем BodyMap
    const prcWidth = 500 / 100;
    const prcHeight = 800 / 100;
    const labels2d = [];

    (data.parts || []).forEach((part) => {
      const left = Number(part.position?.left || 0) / prcWidth;
      const top = Number(part.position?.top || 0) / prcHeight;
      labels2d.push({
        x: Math.round(left * 10) / 10,
        y: Math.round(top * 10) / 10,
        organ: part.name,
      });
    });

    bodyMaps[g.profile] = {
      bodyProfile: g.profile,
      imageUrl: data.images?.image_body_skin || data.images?.image_body_normal || null,
      modelUrl: null,
      labels: labels2d,
      labels3d: [],
      updatedAt: new Date().toISOString(),
    };

    // 2. Формируем Entries
    for (const part of (data.parts || [])) {
      const organName = part.name;
      const modelUrl = matchModel(organName);
      const partImageUrl = part.images?.image || part.images?.image_performance || null;

      for (const illness of (part.illnesses || [])) {
        let definition = '';
        let causes = '';
        let symptoms = '';

        for (const info of (illness.info || [])) {
          const infoName = (info.name || '').toLowerCase();
          const text = cleanHtml(info.desc || '');
          if (infoName.includes('определен')) {
            definition = text;
          } else if (infoName.includes('причин')) {
            causes = text;
          } else if (infoName.includes('симптом')) {
            symptoms = text;
          } else if (!definition) {
            definition = text;
          }
        }

        const recommendedDrugs = [];
        for (const category of (illness.drugs || [])) {
          const catName = category.name || '';
          for (const prep of (category.preparats || [])) {
            const prepName = cleanHtml(prep.name || '');
            if (prepName) {
              recommendedDrugs.push(`${catName ? catName + ': ' : ''}${prepName}`);
            }
          }
        }

        allEntries.push({
          id: `${g.profile}-${part.id}-${illness.id}`,
          title: illness.name,
          system: organName,
          bodyProfile: g.profile,
          definition,
          causes,
          symptoms,
          recommendedDrugs,
          imageUrl: partImageUrl,
          labels: [],
          modelUrl,
          labels3d: [],
          videoUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  // Backup and save
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const entriesFile = path.join(dataDir, 'entries.json');
  const bodymapsFile = path.join(dataDir, 'bodymaps.json');

  if (fs.existsSync(entriesFile)) {
    fs.copyFileSync(entriesFile, path.join(dataDir, `entries.backup.${Date.now()}.json`));
  }
  if (fs.existsSync(bodymapsFile)) {
    fs.copyFileSync(bodymapsFile, path.join(dataDir, `bodymaps.backup.${Date.now()}.json`));
  }

  fs.writeFileSync(entriesFile, JSON.stringify(allEntries, null, 2), 'utf8');
  fs.writeFileSync(bodymapsFile, JSON.stringify(bodyMaps, null, 2), 'utf8');

  console.log(`\nУспешно импортировано:`);
  console.log(`- Всего нозологий (записей): ${allEntries.length}`);
  console.log(`- Уникальных органов: ${new Set(allEntries.map(e => e.system)).size}`);
  console.log(`- Карт тела: ${Object.keys(bodyMaps).length}`);
  console.log(`- Данные сохранены в ${entriesFile} и ${bodymapsFile}`);
}

run().catch((err) => {
  console.error('Ошибка миграции:', err);
  process.exit(1);
});
