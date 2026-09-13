// Deterministic code-drawn brand icons; no image dependency or external service.
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type); const size = Buffer.alloc(4); size.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([size, name, data, crc]);
}
for (const size of [192, 512]) {
  const pixels = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size * 64, v = y / size * 64;
    const p = u >= 17 && u < 22 && v >= 20 && v < 46 || u >= 22 && u < 30 && (v >= 20 && v < 25 || v >= 31 && v < 36) || u >= 29 && u < 34 && v >= 24 && v < 32;
    const k = u >= 37 && u < 42 && v >= 17 && v < 46 || u >= 42 && u < 51 && v >= 22 && v < 46 && Math.abs(Math.abs(v - 34) - (u - 41)) < 3;
    const color = p || k ? [220, 239, 206] : [26, 54, 93];
    const offset = y * (size * 3 + 1) + 1 + x * 3;
    pixels.set(color, offset);
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(size); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 2;
  writeFileSync(`public/icon-${size}.png`, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(pixels)), chunk("IEND", Buffer.alloc(0))]));
}
