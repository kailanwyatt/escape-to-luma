import * as THREE from 'three';

/** Tiny deterministic runtime textures: no DOM, downloads or baked perspective.
 * Each material owns its map and releases it with the existing scene disposer. */
export function containmentMetal(kind: 'panel' | 'floor' = 'panel'): THREE.MeshPhongMaterial {
  const size = 128;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const grain = ((x * 17 + y * 31 + x * y * 7) % 9) - 4;
    let value = 102 + grain;
    const edge = Math.min(x, y, size - 1 - x, size - 1 - y);
    if (edge < 3) value = 29;
    else if (edge < 5) value = 150;
    if (kind === 'panel') {
      // Recessed service plate, ventilation slits and four fasteners.
      if (x > 17 && x < 111 && y > 23 && y < 103) value -= 14;
      if (x > 29 && x < 99 && y > 37 && y < 85 && y % 8 < 3) value = 42;
      for (const bx of [10, 117]) for (const by of [10, 117]) {
        const r = (x - bx) ** 2 + (y - by) ** 2;
        if (r < 12) value = r < 3 ? 32 : 174;
      }
    } else if ((x + y) % 20 < 2) value += 14;
    const i = (y * size + x) * 4;
    pixels[i] = value; pixels[i + 1] = value + 9; pixels[i + 2] = value + 17; pixels[i + 3] = 255;
  }
  const map = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.magFilter = THREE.LinearFilter;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.generateMipmaps = true;
  if (kind === 'floor') map.repeat.set(9, 14);
  map.needsUpdate = true;
  const material = new THREE.MeshPhongMaterial({map, color: 0xa1b4c5, shininess: 48, specular: 0x35495b});
  material.addEventListener('dispose', () => map.dispose());
  return material;
}
