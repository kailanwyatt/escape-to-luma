// Small deterministic alpha textures for native Image: a radial halo and a feathered wave.
// Run with node scripts/generate-finale-glow.cjs. No image libraries are required.
const {writeFileSync} = require('node:fs');
const {join} = require('node:path');
const {deflateSync} = require('node:zlib');
const size = 256;
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, bytes) {
  const name = Buffer.from(type), length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(bytes.length); crc.writeUInt32BE(crc32(Buffer.concat([name, bytes])));
  return Buffer.concat([length, name, bytes, crc]);
}
function texture(name, sample) {
  const pixels = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const radius = Math.hypot((x + .5 - size / 2) / (size / 2), (y + .5 - size / 2) / (size / 2));
    const offset = y * (size * 4 + 1) + 1 + x * 4;
    pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 255;
    pixels[offset + 3] = Math.round(255 * Math.max(0, Math.min(1, sample(radius))));
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
  writeFileSync(join(__dirname, '../assets/art/sparks', name), Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0)),
  ]));
}
texture('finale-soft-halo.png', r => {
  const edge = Math.max(0, Math.min(1, (1 - r) / .25));
  return Math.exp(-4.5 * r * r) * edge * edge * (3 - 2 * edge);
});
texture('finale-soft-wave.png', r => Math.exp(-.5 * ((r - .64) / .037) ** 2));
