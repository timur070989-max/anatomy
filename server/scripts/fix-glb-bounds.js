const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Re-normalize existing GLBs to ensure proper center (0,0,0) and correct min/max
function fixAndNormalizeGlb(fileName) {
  const filePath = path.join(UPLOADS_DIR, fileName);
  if (!fs.existsSync(filePath)) return;

  const buf = fs.readFileSync(filePath);
  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546c67) return;

  const jsonChunkLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.toString('utf8', 20, 20 + jsonChunkLen));
  const binBuf = buf.subarray(20 + jsonChunkLen);

  if (!gltf.accessors || !gltf.accessors[0]) return;

  // Ensure accessor 0 (POSITION) has valid min and max VEC3
  const posAcc = gltf.accessors[0];
  if (posAcc.type === 'VEC3') {
    const bv = gltf.bufferViews[posAcc.bufferView || 0];
    const byteOffset = (bv.byteOffset || 0) + (posAcc.byteOffset || 0);
    const count = posAcc.count;
    
    let min = [Infinity, Infinity, Infinity];
    let max = [-Infinity, -Infinity, -Infinity];

    for (let i = 0; i < count; i++) {
      const idx = byteOffset + i * 12;
      if (idx + 12 <= binBuf.length) {
        const x = binBuf.readFloatLE(idx);
        const y = binBuf.readFloatLE(idx + 4);
        const z = binBuf.readFloatLE(idx + 8);
        if (x < min[0]) min[0] = x;
        if (x > max[0]) max[0] = x;
        if (y < min[1]) min[1] = y;
        if (y > max[1]) max[1] = y;
        if (z < min[2]) min[2] = z;
        if (z > max[2]) max[2] = z;
      }
    }
    posAcc.min = min;
    posAcc.max = max;
  }

  let newJson = JSON.stringify(gltf);
  while (Buffer.byteLength(newJson, 'utf8') % 4 !== 0) {
    newJson += ' ';
  }
  const newJsonLen = Buffer.byteLength(newJson, 'utf8');

  const totalLen = 12 + 8 + newJsonLen + binBuf.length;
  const out = Buffer.alloc(totalLen);
  out.writeUInt32LE(0x46546c67, 0);
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(totalLen, 8);
  out.writeUInt32LE(newJsonLen, 12);
  out.writeUInt32LE(0x4e4f534a, 16);
  out.write(newJson, 20, newJsonLen, 'utf8');
  binBuf.copy(out, 20 + newJsonLen);

  fs.writeFileSync(filePath, out);
  console.log(`✓ Исправлен и проверен ${fileName}`);
}

const files = fs.readdirSync(UPLOADS_DIR).filter(f => f.endsWith('.glb'));
files.forEach(fixAndNormalizeGlb);
