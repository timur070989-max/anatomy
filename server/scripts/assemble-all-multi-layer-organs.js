const fs = require('fs');
const path = require('path');
const { assembleMultiMaterialGlb } = require('./build-multi-material-glb');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const BASE_URL = 'https://raw.githubusercontent.com/jixiangying/anatomy/main/isa_BP3D_4.0_obj_99/';

const ORGAN_SPECS = [
  {
    fileName: 'organ-heart.glb',
    parts: [
      { name: 'Coronary_Arteries', type: 'artery', objIds: ['FJ2631.obj', 'FJ2649.obj', 'FJ2723.obj', 'FJ2737.obj'] },
      { name: 'Cardiac_Veins_VenaCava', type: 'vein', objIds: ['FJ2258.obj'] },
      { name: 'Cardiac_Plexus_Nerves', type: 'nerve', objIds: ['FJ3418.obj'] },
      { name: 'Conduction_Ducts', type: 'duct', objIds: ['FJ3431.obj'] },
      { name: 'Myocardium_Heart_Walls', type: 'wall', objIds: ['FJ2260.obj'] },
    ],
  },
  {
    fileName: 'organ-liver.glb',
    parts: [
      { name: 'Hepatic_Artery', type: 'artery', objIds: ['FJ1874.obj', 'FJ1924.obj', 'FJ2394.obj'] },
      { name: 'Portal_Vein_Hepatic_Veins', type: 'vein', objIds: ['FJ1853.obj', 'FJ1914.obj', 'FJ2415.obj'] },
      { name: 'Bile_Ducts_Gallbladder', type: 'duct', objIds: ['FJ3079.obj', 'FJ3080.obj'] },
    ],
  },
  {
    fileName: 'organ-left-kidney.glb',
    parts: [
      { name: 'Renal_Artery', type: 'artery', objIds: ['FJ2038.obj', 'FJ2042.obj', 'FJ2043.obj', 'FJ2046.obj'] },
      { name: 'Ureter_Renal_Pelvis', type: 'duct', objIds: ['FJ3144.obj', 'FJ3146.obj', 'FJ3481.obj'] },
    ],
  },
  {
    fileName: 'organ-eye.glb',
    parts: [
      { name: 'Optic_Nerve_Ciliary', type: 'nerve', objIds: ['FJ1313.obj', 'FJ1772.obj', 'FJ1288.obj', 'FJ1318.obj'] },
      { name: 'Retina_Receptors', type: 'duct', objIds: ['FJ1316.obj'] },
      { name: 'Eyeball_Sclera_Cornea', type: 'wall', objIds: ['FJ1282.obj', 'FJ1332.obj'] },
    ],
  },
];

async function run() {
  console.log('=== Сборка многослойных 3D-моделей (Артерии + Вены + Нервы + Протоки + Стенки) ===\n');

  for (const spec of ORGAN_SPECS) {
    console.log(`\nСоздание ${spec.fileName}...`);
    const compiledParts = [];

    for (const part of spec.parts) {
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
      const outPath = path.join(UPLOADS_DIR, spec.fileName);
      fs.writeFileSync(outPath, glbBuf);
      console.log(`✓ Создана многослойная модель ${spec.fileName} (${(glbBuf.length / 1024).toFixed(1)} KB) с ${compiledParts.length} анатомическими слоями!`);
    }
  }

  // Copy organ-left-kidney.glb to organ-right-kidney.glb
  const leftKidney = path.join(UPLOADS_DIR, 'organ-left-kidney.glb');
  const rightKidney = path.join(UPLOADS_DIR, 'organ-right-kidney.glb');
  if (fs.existsSync(leftKidney)) {
    fs.copyFileSync(leftKidney, rightKidney);
    console.log('✓ Синхронизирован organ-right-kidney.glb');
  }
}

run().catch(console.error);
