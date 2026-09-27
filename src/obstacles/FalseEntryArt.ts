import * as THREE from 'three';
import type { EntryExitPortalConfig } from '../config/ObstacleConfig';
import { entryExitDisks, entryExitStateAtTime } from './StoryLibraryState';

type ApertureVisual = {
  spin: THREE.Group;
  swirl: THREE.Mesh;
  ringMats: THREE.MeshStandardMaterial[];
  swirlMat: THREE.MeshStandardMaterial;
};

/**
 * False Entries — three free-floating cinematic portals (cyan true / amber false)
 * plus a deeper destination portal. No wall panel. Collision stays in StoryLibraryState.
 */
export class FalseEntryArt {
  readonly group = new THREE.Group();
  private readonly apertures: ApertureVisual[] = [];
  private readonly portalMats: THREE.MeshStandardMaterial[] = [];
  private readonly portalSpin: THREE.Group;
  private readonly portalInner: THREE.Mesh;
  private readonly accentTrue: THREE.PointLight;
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly ownedMaterials: THREE.Material[] = [];

  constructor(private readonly config: EntryExitPortalConfig) {
    this.group.name = 'false-entry-art';
    const disks = entryExitDisks(config);
    const r = config.radius;
    const destDepth = Math.max(3.2, config.destinationDepth ?? 5.2);

    const voidMat = new THREE.MeshBasicMaterial({
      color: 0x02060c,
      transparent: true,
      opacity: 0.88,
    });
    this.ownedMaterials.push(voidMat);

    disks.forEach((disk, i) => {
      const spin = new THREE.Group();
      spin.name = `aperture-${i}`;
      spin.position.set(disk.x, disk.y, -0.06);
      this.group.add(spin);

      const ringMats: THREE.MeshStandardMaterial[] = [];
      for (let k = 0; k < 3; k++) {
        const mat = new THREE.MeshStandardMaterial({
          color: 0xffc056,
          emissive: 0xff8a20,
          emissiveIntensity: 0.95 - k * 0.16,
          metalness: 0.05,
          roughness: 0.2,
          transparent: true,
          opacity: 0.7 - k * 0.12,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        this.ownedMaterials.push(mat);
        ringMats.push(mat);
        const geo = new THREE.RingGeometry(
          r * (0.72 - k * 0.12),
          r * (1.05 - k * 0.14),
          40,
        );
        this.geometries.push(geo);
        const ring = new THREE.Mesh(geo, mat);
        ring.name = `aperture-ring-${i}-${k}`;
        ring.position.z = -k * 0.06;
        spin.add(ring);
      }

      const voidGeo = new THREE.CircleGeometry(r * 0.48, 32);
      this.geometries.push(voidGeo);
      const voidMesh = new THREE.Mesh(voidGeo, voidMat);
      voidMesh.name = `aperture-void-${i}`;
      voidMesh.position.z = 0.02;
      spin.add(voidMesh);

      const swirlMat = new THREE.MeshStandardMaterial({
        color: 0x804018,
        emissive: 0xffb449,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      this.ownedMaterials.push(swirlMat);
      const swirlGeo = new THREE.RingGeometry(r * 0.2, r * 0.58, 36);
      this.geometries.push(swirlGeo);
      const swirl = new THREE.Mesh(swirlGeo, swirlMat);
      swirl.name = `aperture-swirl-${i}`;
      swirl.position.z = -0.01;
      spin.add(swirl);

      this.apertures.push({ spin, swirl, ringMats, swirlMat });
    });

    // Destination portal — deeper Z, larger, always cyan.
    this.portalSpin = new THREE.Group();
    this.portalSpin.name = 'destination-portal';
    this.portalSpin.position.set(config.exitX, config.exitY, destDepth);
    this.group.add(this.portalSpin);

    const portalR = Math.max(r * 2.35, 1.45);
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x6ad4ff,
        emissive: 0x2a90c8,
        emissiveIntensity: 1.05 - i * 0.18,
        metalness: 0.05,
        roughness: 0.2,
        transparent: true,
        opacity: 0.62 - i * 0.12,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      this.ownedMaterials.push(mat);
      this.portalMats.push(mat);
      const geo = new THREE.RingGeometry(
        portalR * (0.72 - i * 0.12),
        portalR * (1 - i * 0.14),
        40,
      );
      this.geometries.push(geo);
      const ring = new THREE.Mesh(geo, mat);
      ring.name = `dest-ring-${i}`;
      ring.position.z = -i * 0.08;
      this.portalSpin.add(ring);
    }
    const destVoidGeo = new THREE.CircleGeometry(portalR * 0.5, 32);
    this.geometries.push(destVoidGeo);
    this.portalSpin.add(new THREE.Mesh(destVoidGeo, voidMat));

    const swirlGeo = new THREE.RingGeometry(portalR * 0.22, portalR * 0.62, 36);
    this.geometries.push(swirlGeo);
    const swirlMat = new THREE.MeshStandardMaterial({
      color: 0x1a5080,
      emissive: 0x4ab0e0,
      emissiveIntensity: 0.95,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.ownedMaterials.push(swirlMat);
    this.portalMats.push(swirlMat);
    this.portalInner = new THREE.Mesh(swirlGeo, swirlMat);
    this.portalInner.name = 'dest-swirl';
    this.portalSpin.add(this.portalInner);

    this.accentTrue = new THREE.PointLight(0x5ad8ff, 12, 9, 2);
    this.accentTrue.name = 'false-entry-true-light';
    this.group.add(this.accentTrue);
    this.update(0);
  }

  update(time: number) {
    const state = entryExitStateAtTime(this.config, time);
    state.disks.forEach((disk, i) => {
      const ap = this.apertures[i];
      if (!ap) return;
      const dir = i % 2 ? -1 : 1;
      ap.spin.rotation.z = time * (disk.trueEntry ? 0.55 : 0.32) * dir;
      ap.swirl.rotation.z = -time * (disk.trueEntry ? 1.1 : 0.7) * dir;

      if (disk.trueEntry) {
        const flicker = disk.warning ? 0.55 + 0.45 * Math.abs(Math.sin(time * 18)) : 1;
        for (let k = 0; k < ap.ringMats.length; k++) {
          const mat = ap.ringMats[k]!;
          mat.color.setHex(0x8af0ff);
          mat.emissive.setHex(0x4ab8ff);
          mat.emissiveIntensity = (1.2 - k * 0.18) * flicker;
          mat.opacity = 0.78 - k * 0.1;
        }
        ap.swirlMat.color.setHex(0x1a5080);
        ap.swirlMat.emissive.setHex(0x6ad4ff);
        ap.swirlMat.emissiveIntensity = 1.25 * flicker;
        ap.swirlMat.opacity = 0.62;
        this.accentTrue.position.set(disk.x, disk.y, -0.5);
        this.accentTrue.intensity = 14 * flicker;
        this.accentTrue.visible = true;
      } else {
        for (let k = 0; k < ap.ringMats.length; k++) {
          const mat = ap.ringMats[k]!;
          mat.color.setHex(0xffc056);
          mat.emissive.setHex(0xff8a20);
          mat.emissiveIntensity = 0.75 - k * 0.12;
          mat.opacity = 0.62 - k * 0.1;
        }
        ap.swirlMat.color.setHex(0x804018);
        ap.swirlMat.emissive.setHex(0xffb449);
        ap.swirlMat.emissiveIntensity = 0.75;
        ap.swirlMat.opacity = 0.48;
      }
    });
    if (!state.disks.some((d) => d.trueEntry)) this.accentTrue.visible = false;

    this.portalSpin.rotation.z = time * 0.4;
    this.portalInner.rotation.z = -time * 0.75;
    const pulse = 0.5 + 0.5 * Math.sin(time * 1.5);
    for (const m of this.portalMats) m.emissiveIntensity = 0.7 + pulse * 0.4;
  }

  dispose() {
    for (const g of this.geometries) g.dispose();
    for (const m of this.ownedMaterials) m.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
