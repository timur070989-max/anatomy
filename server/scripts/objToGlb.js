// Pure Node.js OBJ to GLB converter with PBR material support
function objToGlb(objText, materialConfig = {}) {
  const positions = [];
  const normals = [];
  const outPositions = [];
  const outNormals = [];
  const outIndices = [];

  const vertexCache = new Map();

  const lines = objText.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split(/\s+/);
    const type = parts[0];

    if (type === 'v') {
      positions.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
    } else if (type === 'vn') {
      normals.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
    } else if (type === 'f') {
      // Face elements: v, v/vt, v/vt/vn, or v//vn
      const faceVertices = parts.slice(1);
      const faceIndices = [];

      for (let j = 0; j < faceVertices.length; j++) {
        const vertKey = faceVertices[j];
        if (vertexCache.has(vertKey)) {
          faceIndices.push(vertexCache.get(vertKey));
        } else {
          const vertParts = vertKey.split('/');
          const vIdx = (parseInt(vertParts[0], 10) - 1) * 3;
          const vnIdx = vertParts[2] ? (parseInt(vertParts[2], 10) - 1) * 3 : -1;

          const px = positions[vIdx] || 0;
          const py = positions[vIdx + 1] || 0;
          const pz = positions[vIdx + 2] || 0;

          let nx = 0, ny = 1, nz = 0;
          if (vnIdx >= 0 && normals[vnIdx] !== undefined) {
            nx = normals[vnIdx];
            ny = normals[vnIdx + 1];
            nz = normals[vnIdx + 2];
          }

          const newIdx = outPositions.length / 3;
          outPositions.push(px, py, pz);
          outNormals.push(nx, ny, nz);

          vertexCache.set(vertKey, newIdx);
          faceIndices.push(newIdx);
        }
      }

      // Triangulate polygon (fan)
      for (let k = 1; k < faceIndices.length - 1; k++) {
        outIndices.push(faceIndices[0], faceIndices[k], faceIndices[k + 1]);
      }
    }
  }

  // Calculate center and normalize scale to fit standard 1-meter viewport
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < outPositions.length; i += 3) {
    const x = outPositions[i];
    const y = outPositions[i + 1];
    const z = outPositions[i + 2];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;
  const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
  const scale = 0.5 / maxDim; // Normalized standard medical model scale

  const finalPositions = new Float32Array(outPositions.length);
  for (let i = 0; i < outPositions.length; i += 3) {
    finalPositions[i] = (outPositions[i] - cx) * scale;
    finalPositions[i + 1] = (outPositions[i + 1] - cy) * scale;
    finalPositions[i + 2] = (outPositions[i + 2] - cz) * scale;
  }

  const finalNormals = new Float32Array(outNormals);
  const use32BitIndices = outPositions.length / 3 > 65535;
  const finalIndices = use32BitIndices ? new Uint32Array(outIndices) : new Uint16Array(outIndices);

  // Build binary buffers
  const posBuffer = Buffer.from(finalPositions.buffer);
  const normBuffer = Buffer.from(finalNormals.buffer);
  const idxBuffer = Buffer.from(finalIndices.buffer);

  // Pad to 4 bytes
  function pad4(buf) {
    const pad = (4 - (buf.length % 4)) % 4;
    return pad > 0 ? Buffer.concat([buf, Buffer.alloc(pad)]) : buf;
  }

  const paddedPos = pad4(posBuffer);
  const paddedNorm = pad4(normBuffer);
  const paddedIdx = pad4(idxBuffer);

  const binBuffer = Buffer.concat([paddedPos, paddedNorm, paddedIdx]);

  const posByteOffset = 0;
  const normByteOffset = paddedPos.length;
  const idxByteOffset = paddedPos.length + paddedNorm.length;

  const color = materialConfig.color || [0.8, 0.4, 0.4, 1.0];
  const roughness = materialConfig.roughness || 0.4;
  const metallic = materialConfig.metallic || 0.05;

  const gltf = {
    asset: { version: '2.0', generator: 'WorldMedicine-Anatomy3D-Pipeline' },
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: materialConfig.name || 'Organ_Node' }],
    meshes: [
      {
        name: materialConfig.name || 'Organ_Mesh',
        primitives: [
          {
            attributes: { POSITION: 0, NORMAL: 1 },
            indices: 2,
            material: 0,
            mode: 4,
          },
        ],
      },
    ],
    materials: [
      {
        name: materialConfig.name || 'Organ_Material',
        pbrMetallicRoughness: {
          baseColorFactor: color,
          roughnessFactor: roughness,
          metallicFactor: metallic,
        },
        doubleSided: true,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        byteOffset: 0,
        componentType: 5126, // FLOAT
        count: finalPositions.length / 3,
        type: 'VEC3',
        max: [
          (maxX - cx) * scale,
          (maxY - cy) * scale,
          (maxZ - cz) * scale,
        ],
        min: [
          (minX - cx) * scale,
          (minY - cy) * scale,
          (minZ - cz) * scale,
        ],
      },
      {
        bufferView: 1,
        byteOffset: 0,
        componentType: 5126, // FLOAT
        count: finalNormals.length / 3,
        type: 'VEC3',
      },
      {
        bufferView: 2,
        byteOffset: 0,
        componentType: use32BitIndices ? 5125 : 5123, // UNSIGNED_INT or UNSIGNED_SHORT
        count: finalIndices.length,
        type: 'SCALAR',
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: posByteOffset, byteLength: posBuffer.length, target: 34962 },
      { buffer: 0, byteOffset: normByteOffset, byteLength: normBuffer.length, target: 34962 },
      { buffer: 0, byteOffset: idxByteOffset, byteLength: idxBuffer.length, target: 34963 },
    ],
    buffers: [{ byteLength: binBuffer.length }],
  };

  let jsonStr = JSON.stringify(gltf);
  while (Buffer.byteLength(jsonStr, 'utf8') % 4 !== 0) {
    jsonStr += ' ';
  }
  const jsonChunkLength = Buffer.byteLength(jsonStr, 'utf8');

  const totalLength = 12 + 8 + jsonChunkLength + 8 + binBuffer.length;
  const glb = Buffer.alloc(totalLength);

  glb.writeUInt32LE(0x46546c67, 0); // magic
  glb.writeUInt32LE(2, 4); // version
  glb.writeUInt32LE(totalLength, 8); // total length

  // JSON Chunk
  glb.writeUInt32LE(jsonChunkLength, 12);
  glb.writeUInt32LE(0x4e4f534a, 16); // JSON
  glb.write(jsonStr, 20, jsonChunkLength, 'utf8');

  // BIN Chunk
  const binHeaderOffset = 20 + jsonChunkLength;
  glb.writeUInt32LE(binBuffer.length, binHeaderOffset);
  glb.writeUInt32LE(0x004e4942, binHeaderOffset + 4); // BIN
  binBuffer.copy(glb, binHeaderOffset + 8);

  return glb;
}

module.exports = { objToGlb };
