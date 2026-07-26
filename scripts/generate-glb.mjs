#!/usr/bin/env node
// Generate proper GLB files using sharp + manual binary assembly
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const BOARD_DIR = 'public/layouts';
const GLB_DIR = 'public/glb';

// Board: 60" x 44" = 1.524m x 1.1176m
const HW = 1.524 / 2; // 0.762
const HD = 1.1176 / 2; // 0.5588

async function generateGLB(pngPath, glbPath, imgW, imgH) {
  // Read PNG and convert to JPEG buffer
  const jpgBuf = await sharp(pngPath).jpeg({ quality: 80 }).toBuffer();

  // Pad to 4-byte boundary
  const imgPadded = Buffer.alloc(Math.ceil(jpgBuf.length / 4) * 4);
  jpgBuf.copy(imgPadded);

  // Vertices: pos(3) + uv(2) = 5 floats × 4 bytes × 4 verts = 80
  const verts = new Float32Array([
    -HW, 0.01, -HD,  0, 0,
     HW, 0.01, -HD,  1, 0,
     HW, 0.01,  HD,  1, 1,
    -HW, 0.01,  HD,  0, 1,
  ]);
  // Indices: 6 × uint16 = 12 bytes
  const idx = new Uint16Array([0, 1, 2, 0, 2, 3]);

  const buf = Buffer.concat([
    Buffer.from(verts.buffer),
    Buffer.from(idx.buffer),
  ]);

  // GLTF JSON
  const gltf = {
    asset: { version: '2.0', generator: 'wtc-setup' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{
      primitives: [{
        attributes: { POSITION: 0, TEXCOORD_0: 1 },
        indices: 2,
        material: 0,
      }],
    }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 4, type: 'VEC3',
        max: [HW, 0.01, HD], min: [-HW, 0.01, -HD] },
      { bufferView: 1, componentType: 5126, count: 4, type: 'VEC2' },
      { bufferView: 2, componentType: 5123, count: 6, type: 'SCALAR' },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0,  byteLength: 80, target: 34962 },
      { buffer: 0, byteOffset: 80, byteLength: 32, target: 34962 },
      { buffer: 0, byteOffset: 112, byteLength: 12, target: 34963 },
      { buffer: 0, byteOffset: buf.length, byteLength: imgPadded.length },
    ],
    buffers: [{ byteLength: buf.length + imgPadded.length }],
    images: [{ bufferView: 3, mimeType: 'image/jpeg' }],
    textures: [{ source: 0, sampler: 0 }],
    samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }],
    materials: [{
      pbrMetallicRoughness: {
        baseColorTexture: { index: 0 },
        metallicFactor: 0,
        roughnessFactor: 1,
      },
      doubleSided: true,
      alphaMode: 'OPAQUE',
    }],
  };

  const jsonStr = JSON.stringify(gltf);
  let jsonBuf = Buffer.from(jsonStr);
  // Pad JSON to 4 bytes
  while (jsonBuf.length % 4 !== 0) jsonBuf = Buffer.concat([jsonBuf, Buffer.from(' ')]);
  // Remove trailing spaces for clean JSON
  jsonBuf = Buffer.from(jsonStr + ' '.repeat((4 - (jsonStr.length % 4)) % 4));

  // BIN chunk = buffer data + padded image
  const binChunk = Buffer.concat([buf, imgPadded]);

  // GLB header
  const totalLen = 12 + 8 + jsonBuf.length + 8 + binChunk.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546C67, 0); // magic "glTF"
  header.writeUInt32LE(2, 4);          // version
  header.writeUInt32LE(totalLen, 8);   // total length

  // JSON chunk
  const jHeader = Buffer.alloc(8);
  jHeader.writeUInt32LE(jsonBuf.length, 0);
  jHeader.write('JSON', 4);

  // BIN chunk header
  const bHeader = Buffer.alloc(8);
  bHeader.writeUInt32LE(binChunk.length, 0);
  bHeader.write('BIN\0', 4);

  fs.writeFileSync(glbPath, Buffer.concat([header, jHeader, jsonBuf, bHeader, binChunk]));
  console.log(`OK: ${path.basename(glbPath)} (${(totalLen / 1024) | 0} KB)`);
}

async function main() {
  fs.mkdirSync(GLB_DIR, { recursive: true });

  for (const fname of fs.readdirSync(BOARD_DIR).sort()) {
    if (!fname.endsWith('.png')) continue;
    const base = fname.replace('.png', '');
    const pngPath = path.join(BOARD_DIR, fname);
    const meta = await sharp(pngPath).metadata();
    await generateGLB(pngPath, path.join(GLB_DIR, `${base}.glb`), meta.width, meta.height);
  }

  console.log(`\nDone! ${fs.readdirSync(GLB_DIR).length} GLB files`);
}

main().catch(console.error);
