import * as THREE from 'three';

/** Locked Null palette — obs.md creature bible. */
export const NULL_PALETTE = {
  voidDeep: 0x0a0612,
  voidFlesh: 0x1a0a2c,
  scaleLow: 0x6a28a8,
  scaleHigh: 0x9a50e8,
  telegraph: 0xb070ff,
  safeLight: 0xc8e8ff,
} as const;

function makeDataTexture(
  size: number,
  fill: (x: number, y: number, size: number) => [number, number, number],
): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b] = fill(x, y, size);
      const i = (y * size + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Soft organic flesh mottling for egg-blobs / limbs. */
export function makeNullFleshTexture(size = 128): THREE.DataTexture {
  return makeDataTexture(size, (x, y, s) => {
    const u = x / s;
    const v = y / s;
    const mott =
      0.55 +
      0.25 * Math.sin(u * 18 + v * 7) +
      0.15 * Math.sin(u * 41 - v * 29) +
      0.1 * Math.sin((u + v) * 9);
    const vein = Math.pow(0.5 + 0.5 * Math.sin(u * 22 + v * 14), 4) * 0.35;
    const t = Math.min(1, Math.max(0, mott + vein));
    return [
      Math.floor(18 + t * 55),
      Math.floor(6 + t * 18),
      Math.floor(32 + t * 90),
    ];
  });
}

/** Hex-scale plates for boss void field. */
export function makeNullScaleTextures(size = 256): {
  color: THREE.DataTexture;
  bump: THREE.DataTexture;
} {
  const colorData = new Uint8Array(size * size * 4);
  const bumpData = new Uint8Array(size * size * 4);
  const hexW = 18;
  const hexH = hexW * 0.866;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const row = Math.floor(y / hexH);
      const colOffset = (row % 2) * (hexW * 0.5);
      const col = Math.floor((x - colOffset) / hexW);
      const cx = col * hexW + colOffset + hexW * 0.5;
      const cy = row * hexH + hexH * 0.5;
      const dx = (x - cx) / (hexW * 0.48);
      const dy = (y - cy) / (hexH * 0.52);
      const dist = Math.hypot(dx, dy);
      const plate = Math.max(0, 1 - dist);
      const rim = Math.pow(Math.max(0, 1 - Math.abs(dist - 0.72) * 4.2), 2);
      const dome = Math.pow(plate, 1.35);
      const grain =
        ((Math.sin(x * 0.37 + y * 0.19) * 0.5 + 0.5) * 0.12 +
          (Math.sin(x * 1.1 - y * 0.7) * 0.5 + 0.5) * 0.08);
      const height = Math.min(1, dome * 0.75 + rim * 0.55 + grain);
      const i = (y * size + x) * 4;
      const b = Math.floor(height * 255);
      bumpData[i] = b;
      bumpData[i + 1] = b;
      bumpData[i + 2] = b;
      bumpData[i + 3] = 255;
      // Darker void scales than legacy — closer to concept moon.
      colorData[i] = Math.min(255, Math.floor(14 + height * 70 + rim * 30));
      colorData[i + 1] = Math.min(255, Math.floor(6 + height * 22 + rim * 12));
      colorData[i + 2] = Math.min(255, Math.floor(28 + height * 100 + rim * 45));
      colorData[i + 3] = 255;
    }
  }

  const color = new THREE.DataTexture(colorData, size, size);
  color.wrapS = color.wrapT = THREE.RepeatWrapping;
  color.magFilter = THREE.LinearFilter;
  color.minFilter = THREE.LinearMipmapLinearFilter;
  color.needsUpdate = true;
  color.colorSpace = THREE.SRGBColorSpace;

  const bump = new THREE.DataTexture(bumpData, size, size);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.magFilter = THREE.LinearFilter;
  bump.minFilter = THREE.LinearMipmapLinearFilter;
  bump.needsUpdate = true;

  return { color, bump };
}

/**
 * Shared Null flesh materials — one language for tendril / lash / presence.
 * Own and dispose textures via dispose().
 */
export class NullFleshKit {
  readonly fleshMap: THREE.DataTexture;
  readonly flesh: THREE.MeshStandardMaterial;
  readonly dark: THREE.MeshStandardMaterial;
  readonly telegraph: THREE.MeshStandardMaterial;
  readonly safe: THREE.MeshStandardMaterial;
  private readonly owned: THREE.Material[] = [];

  constructor() {
    this.fleshMap = makeNullFleshTexture(128);
    this.flesh = new THREE.MeshStandardMaterial({
      color: NULL_PALETTE.voidFlesh,
      map: this.fleshMap,
      emissive: NULL_PALETTE.scaleLow,
      emissiveIntensity: 0.7,
      metalness: 0.04,
      roughness: 0.58,
    });
    this.dark = new THREE.MeshStandardMaterial({
      color: NULL_PALETTE.voidDeep,
      map: this.fleshMap,
      emissive: 0x2a1040,
      emissiveIntensity: 0.4,
      metalness: 0.02,
      roughness: 0.78,
    });
    this.telegraph = new THREE.MeshStandardMaterial({
      color: NULL_PALETTE.telegraph,
      emissive: NULL_PALETTE.scaleHigh,
      emissiveIntensity: 1.1,
      metalness: 0.08,
      roughness: 0.28,
    });
    this.safe = new THREE.MeshStandardMaterial({
      color: NULL_PALETTE.safeLight,
      emissive: NULL_PALETTE.safeLight,
      emissiveIntensity: 1.0,
      metalness: 0.05,
      roughness: 0.25,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.owned.push(this.flesh, this.dark, this.telegraph, this.safe);
  }

  dispose() {
    this.fleshMap.dispose();
    for (const m of this.owned) m.dispose();
  }
}
