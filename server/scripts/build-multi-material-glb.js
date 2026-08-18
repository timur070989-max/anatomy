const fs = require('fs');
const path = require('path');

// Multi-Part GLB Assembler that compiles separate OBJ meshes into a single multi-material GLB
function assembleMultiMaterialGlb(parts) {
  // parts = [ { name: 'Artery', type: 'artery', objText: '...' }, ... ]
  const MATERIALS = [
    {
      name: 'Artery_Red',
      pbrMetallicRoughness: {
        baseColorFactor: [0.96, 0.08, 0.16, 1.0], // Vivid Red Arteries
        metallicFactor: 0.20,
        roughnessFactor: 0.25,
      },
      doubleSided: true,
    },
    {
      name: 'Vein_Blue',
      pbrMetallicRoughness: {
        baseColorFactor: [0.08, 0.35, 0.96, 1.0], // Vivid Blue Veins
        metallicFactor: 0.20,
        roughnessFactor: 0.25,
      },
      doubleSided: true,
    },
    {
      name: 'Nerve_Yellow',
      pbrMetallicRoughness: {
        baseColorFactor: [1.0, 0.88, 0.05, 1.0], // Radiant Yellow Nerves
        metallicFactor: 0.05,
        roughnessFactor: 0.30,
      },
      doubleSided: true,
    },
    {
      name: 'Duct_Green',
      pbrMetallicRoughness: {
        baseColorFactor: [0.12, 0.85, 0.35, 1.0], // Emerald Green Ducts
        metallicFactor: 0.10,
        roughnessFactor: 0.25,
      },
      doubleSided: true,
    },
    {
      name: 'Organ_Wall',
      pbrMetallicRoughness: {
        baseColorFactor: [0.78, 0.45, 0.42, 1.0], // Organ tissue
        metallicFactor: 0.04,
        roughnessFactor: 0.38,
      },
      doubleSided: true,
    },
  ];

  const typeToMatIndex = {
    artery: 0,
    vein: 1,
    nerve: 2,
    duct: 3,
    wall: 4,
    parenchyma: 4,
  };

  const meshes = [];
  const nodes = [];
  const accessors = [];
  const bufferViews = [];
  const binaryChunks = [];

  let currentByteOffset = 0;

  // First pass: collect all vertices to calculate global center and bounding box
  const allPositions = [];

  parts.forEach((part) => {
    const lines = part.objText.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('v ')) {
        const p = line.split(/\s+/);
        allPositions.push(parseFloat(p[1]), parseFloat(p[2]), parseFloat(p[3]));
      }
    }
  });

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < allPositions.length; i += 3) {
    const x = allPositions[i];
    const y = allPositions[i + 1];
    const z = allPositions[i + 2];
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
  const scale = 0.5 / maxDim; // Normalized standard viewport

  // Second pass: parse each part with separate accessor and material
  parts.forEach((part, partIdx) => {
    const positions = [];
    const normals = [];
    const outPositions = [];
    const outNormals = [];
    const outIndices = [];
    const vertexCache = new Map();

    const lines = part.objText.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) continue;
      const partsArr = line.split(/\s+/);
      const type = partsArr[0];

      if (type === 'v') {
        positions.push(parseFloat(partsArr[1]), parseFloat(partsArr[2]), parseFloat(partsArr[3]));
      } else if (type === 'vn') {
        normals.push(parseFloat(partsArr[1]), parseFloat(partsArr[2]), parseFloat(partsArr[3]));
      } else if (type === 'f') {
        const faceVertices = partsArr.slice(1);
        const faceIndices = [];

        for (let j = 0; j < faceVertices.length; j++) {
          const vertKey = faceVertices[j];
          if (vertexCache.has(vertKey)) {
            faceIndices.push(vertexCache.get(vertKey));
          } else {
            const vertParts = vertKey.split('/');
            const vIdx = (parseInt(vertParts[0], 10) - 1) * 3;
            const vnIdx = vertParts[2] ? (parseInt(vertParts[2], 10) - 1) * 3 : -1;

            const px = (positions[vIdx] || 0) - cx;
            const py = (positions[vIdx + 1] || 0) - cy;
            const pz = (positions[vIdx + 2] || 0) - cz;

            let nx = 0, ny = 1, nz = 0;
            if (vnIdx >= 0 && normals[vnIdx] !== undefined) {
              nx = normals[vnIdx];
              ny = normals[vnIdx + 1];
              nz = normals[vnIdx + 2];
            }

            const newIdx = outPositions.length / 3;
            outPositions.push(px * scale, py * scale, pz * scale);
            outNormals.push(nx, ny, nz);

            vertexCache.set(vertKey, newIdx);
            faceIndices.push(newIdx);
          }
        }

        for (let k = 1; k < faceIndices.length - 1; k++) {
          outIndices.push(faceIndices[0], faceIndices[k], faceIndices[k + 1]);
        }
      }
    }

    if (outPositions.length === 0 || outIndices.length === 0) return;

    const posArray = new Float32Array(outPositions);
    const normArray = new Float32Array(outNormals);
    const use32Bit = outPositions.length / 3 > 65535;
    const idxArray = use32Bit ? new Uint32Array(outIndices) : new Uint16Array(outIndices);

    function pad4(buf) {
      const pad = (4 - (buf.length % 4)) % 4;
      return pad > 0 ? Buffer.concat([buf, Buffer.alloc(pad)]) : buf;
    }

    const posBuf = pad4(Buffer.from(posArray.buffer));
    const normBuf = pad4(Buffer.from(normArray.buffer));
    const idxBuf = pad4(Buffer.from(idxArray.buffer));

    const posBVIdx = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset: currentByteOffset, byteLength: posBuf.length, target: 34962 });
    currentByteOffset += posBuf.length;

    const normBVIdx = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset: currentByteOffset, byteLength: normBuf.length, target: 34962 });
    currentByteOffset += normBuf.length;

    const idxBVIdx = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset: currentByteOffset, byteLength: idxBuf.length, target: 34963 });
    currentByteOffset += idxBuf.length;

    binaryChunks.push(posBuf, normBuf, idxBuf);

    // Calculate part min/max
    let pMin = [Infinity, Infinity, Infinity];
    let pMax = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < outPositions.length; i += 3) {
      const x = outPositions[i], y = outPositions[i + 1], z = outPositions[i + 2];
      if (x < pMin[0]) pMin[0] = x; if (x > pMax[0]) pMax[0] = x;
      if (y < pMin[1]) pMin[1] = y; if (y > pMax[1]) pMax[1] = y;
      if (z < pMin[2]) pMin[2] = z; if (z > pMax[2]) pMax[2] = z;
    }

    const posAccIdx = accessors.length;
    accessors.push({
      bufferView: posBVIdx,
      byteOffset: 0,
      componentType: 5126,
      count: posArray.length / 3,
      type: 'VEC3',
      max: pMax,
      min: pMin,
    });

    const normAccIdx = accessors.length;
    accessors.push({
      bufferView: normBVIdx,
      byteOffset: 0,
      componentType: 5126,
      count: normArray.length / 3,
      type: 'VEC3',
    });

    const idxAccIdx = accessors.length;
    accessors.push({
      bufferView: idxBVIdx,
      byteOffset: 0,
      componentType: use32Bit ? 5125 : 5123,
      count: idxArray.length,
      type: 'SCALAR',
    });

    const matIdx = typeToMatIndex[part.type] ?? 4;
    const meshIdx = meshes.length;

    meshes.push({
      name: part.name || `Mesh_${partIdx}`,
      primitives: [
        {
          attributes: { POSITION: posAccIdx, NORMAL: normAccIdx },
          indices: idxAccIdx,
          material: matIdx,
          mode: 4,
        },
      ],
    });

    nodes.push({
      name: part.name || `Node_${partIdx}`,
      mesh: meshIdx,
    });
  });

  const binBuffer = Buffer.concat(binaryChunks);

  // Filter materials to ONLY those actually referenced by primitives
  const usedMatIndices = new Set();
  meshes.forEach((m) => {
    m.primitives.forEach((p) => {
      if (p.material !== undefined) usedMatIndices.add(p.material);
    });
  });

  const finalMaterials = [];
  const oldToNewMatIndex = {};
  Array.from(usedMatIndices).sort().forEach((oldIdx, newIdx) => {
    finalMaterials.push(MATERIALS[oldIdx]);
    oldToNewMatIndex[oldIdx] = newIdx;
  });

  meshes.forEach((m) => {
    m.primitives.forEach((p) => {
      if (p.material !== undefined) {
        p.material = oldToNewMatIndex[p.material] ?? 0;
      }
    });
  });

  const gltf = {
    asset: { version: '2.0', generator: 'Antigravity-MultiLayer-Medical-GLB' },
    scenes: [{ nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes,
    materials: finalMaterials,
    accessors,
    bufferViews,
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
  glb.writeUInt32LE(0x4e4f534a, 16);
  glb.write(jsonStr, 20, jsonChunkLength, 'utf8');

  // BIN Chunk
  const binHeaderOffset = 20 + jsonChunkLength;
  glb.writeUInt32LE(binBuffer.length, binHeaderOffset);
  glb.writeUInt32LE(0x004e4942, binHeaderOffset + 4);
  binBuffer.copy(glb, binHeaderOffset + 8);

  return glb;
}

module.exports = { assembleMultiMaterialGlb };
