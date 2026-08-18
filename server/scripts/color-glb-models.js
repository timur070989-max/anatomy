const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Realistic medical colors from the World Medicine Body Map illustration
const ORGAN_COLOR_MAP = {
  'organ-liver.glb': {
    name: 'Liver_Tissue',
    baseColorFactor: [0.62, 0.22, 0.18, 1.0], // Тёмно-бордовая печень
    metallicFactor: 0.05,
    roughnessFactor: 0.35,
  },
  'organ-gallbladder.glb': {
    name: 'Gallbladder_Bile',
    baseColorFactor: [0.18, 0.50, 0.22, 1.0], // Изумрудно-оливковый жёлчный пузырь
    metallicFactor: 0.05,
    roughnessFactor: 0.30,
  },
  'organ-stomach.glb': {
    name: 'Stomach_Mucosa',
    baseColorFactor: [0.82, 0.48, 0.44, 1.0], // Телесно-розовый желудок
    metallicFactor: 0.04,
    roughnessFactor: 0.40,
  },
  'organ-pancreas.glb': {
    name: 'Pancreas_Gland',
    baseColorFactor: [0.85, 0.66, 0.36, 1.0], // Охристо-золотистая поджелудочная
    metallicFactor: 0.02,
    roughnessFactor: 0.52,
  },
  'organ-right-kidney.glb': {
    name: 'Renal_Cortex_Right',
    baseColorFactor: [0.54, 0.16, 0.14, 1.0], // Тёмно-пурпурная правая почка
    metallicFactor: 0.05,
    roughnessFactor: 0.34,
  },
  'organ-left-kidney.glb': {
    name: 'Renal_Cortex_Left',
    baseColorFactor: [0.54, 0.16, 0.14, 1.0], // Тёмно-пурпурная левая почка
    metallicFactor: 0.05,
    roughnessFactor: 0.34,
  },
  'organ-urinary-bladder.glb': {
    name: 'Bladder_Wall',
    baseColorFactor: [0.88, 0.52, 0.40, 1.0], // Янтарно-розовый мочевой пузырь
    metallicFactor: 0.04,
    roughnessFactor: 0.38,
  },
};

function processGlb(file, colorSpec) {
  const filePath = path.join(UPLOADS_DIR, file);
  if (!fs.existsSync(filePath)) return;

  const buf = fs.readFileSync(filePath);
  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546c67) {
    console.error('Not a valid GLB:', file);
    return;
  }

  const jsonChunkLength = buf.readUInt32LE(12);
  const jsonChunkType = buf.readUInt32LE(16);
  const jsonStr = buf.toString('utf8', 20, 20 + jsonChunkLength);
  const gltf = JSON.parse(jsonStr);

  const binOffset = 20 + jsonChunkLength;
  const binBuffer = buf.subarray(binOffset);

  // Add material to gltf
  gltf.materials = [
    {
      name: colorSpec.name,
      pbrMetallicRoughness: {
        baseColorFactor: colorSpec.baseColorFactor,
        metallicFactor: colorSpec.metallicFactor,
        roughnessFactor: colorSpec.roughnessFactor,
      },
      doubleSided: true,
    },
  ];

  // Assign material 0 to all primitives
  if (gltf.meshes) {
    gltf.meshes.forEach((mesh) => {
      if (mesh.primitives) {
        mesh.primitives.forEach((prim) => {
          prim.material = 0;
        });
      }
    });
  }

  // Re-encode JSON chunk padded to 4 bytes with spaces (0x20)
  let newJsonStr = JSON.stringify(gltf);
  while (Buffer.byteLength(newJsonStr, 'utf8') % 4 !== 0) {
    newJsonStr += ' ';
  }
  const newJsonChunkLength = Buffer.byteLength(newJsonStr, 'utf8');

  // Build new GLB
  const totalLength = 12 + 8 + newJsonChunkLength + binBuffer.length;
  const outBuf = Buffer.alloc(totalLength);

  // Header
  outBuf.writeUInt32LE(0x46546c67, 0); // magic
  outBuf.writeUInt32LE(2, 4); // version
  outBuf.writeUInt32LE(totalLength, 8); // length

  // JSON chunk header
  outBuf.writeUInt32LE(newJsonChunkLength, 12);
  outBuf.writeUInt32LE(jsonChunkType, 16);
  outBuf.write(newJsonStr, 20, newJsonChunkLength, 'utf8');

  // Copy BIN chunk
  binBuffer.copy(outBuf, 20 + newJsonChunkLength);

  fs.writeFileSync(filePath, outBuf);
  console.log(`✓ Запечены PBR-цвета в ${file} (${colorSpec.name})`);
}

Object.entries(ORGAN_COLOR_MAP).forEach(([file, spec]) => {
  processGlb(file, spec);
});

console.log('Все 3D-модели органов успешно раскрашены в цвета карты тела!');
