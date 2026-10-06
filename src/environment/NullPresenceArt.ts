import * as THREE from 'three';
import { NULL_PALETTE, NullFleshKit } from '../obstacles/NullFleshKit';

/**
 * Distant void-moon of The Null — soft eclipse mass behind the corridor.
 * Decorative only; never enters play Z.
 */
export class NullPresenceArt {
  readonly group = new THREE.Group();
  private readonly moon: THREE.Mesh;
  private readonly haze: THREE.Mesh;
  private readonly lash: THREE.Group;
  private readonly kit = new NullFleshKit();
  private readonly moonMat: THREE.MeshStandardMaterial;
  private readonly hazeMat: THREE.MeshBasicMaterial;
  private readonly accent: THREE.PointLight;
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly lashBlobs: THREE.Mesh[] = [];

  constructor() {
    this.group.name = 'null-presence';
    this.group.userData.decorativeOnly = true;

    this.moonMat = new THREE.MeshStandardMaterial({
      color: NULL_PALETTE.voidDeep,
      map: this.kit.fleshMap,
      emissive: 0x1a0a28,
      emissiveIntensity: 0.45,
      metalness: 0.02,
      roughness: 0.92,
      fog: false,
    });

    const moonGeo = new THREE.SphereGeometry(7.2, 32, 24);
    this.geometries.push(moonGeo);
    this.moon = new THREE.Mesh(moonGeo, this.moonMat);
    this.moon.name = 'null-body';
    // Soft eclipse behind and above the corridor.
    this.moon.position.set(2.5, 10.5, 52);
    this.moon.scale.set(1.05, 0.92, 0.88);
    this.group.add(this.moon);

    this.hazeMat = new THREE.MeshBasicMaterial({
      color: NULL_PALETTE.scaleLow,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      fog: false,
    });
    const hazeGeo = new THREE.SphereGeometry(9.5, 24, 16);
    this.geometries.push(hazeGeo);
    this.haze = new THREE.Mesh(hazeGeo, this.hazeMat);
    this.haze.name = 'null-hunger-core';
    this.haze.position.copy(this.moon.position);
    this.haze.position.z -= 0.8;
    this.group.add(this.haze);

    // One hanging decorative lash — same egg-blob language as gameplay limbs.
    this.lash = new THREE.Group();
    this.lash.name = 'null-presence-arm-0';
    this.lash.position.set(
      this.moon.position.x - 0.5,
      this.moon.position.y - 5.5,
      this.moon.position.z - 3,
    );
    const blobGeo = new THREE.SphereGeometry(1, 10, 8);
    this.geometries.push(blobGeo);
    for (let s = 0; s < 6; s++) {
      const u = s / 5;
      const mesh = new THREE.Mesh(blobGeo, s % 2 ? this.kit.flesh : this.kit.dark);
      mesh.name = `null-presence-seg-0-${s}`;
      const r = 0.55 - u * 0.32;
      mesh.scale.set(r * 1.3, r * 1.5, r * 0.9);
      mesh.position.set(
        Math.sin(u * 0.8) * 0.4,
        -u * 2.2,
        -u * 0.35,
      );
      this.lash.add(mesh);
      this.lashBlobs.push(mesh);
    }
    const tip = new THREE.Mesh(blobGeo, this.kit.telegraph);
    tip.name = 'null-presence-tip-0';
    tip.position.set(0.35, -11.2, -2.2);
    tip.scale.set(0.22, 0.18, 0.16);
    this.lash.add(tip);
    this.lashBlobs.push(tip);
    this.group.add(this.lash);

    // Sparse eaten-light motes around the moon.
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const sparkGeo = new THREE.SphereGeometry(0.07 + (i % 3) * 0.02, 6, 4);
      this.geometries.push(sparkGeo);
      const spark = new THREE.Mesh(sparkGeo, this.kit.telegraph);
      spark.position.set(
        this.moon.position.x + Math.cos(a) * (8.5 + (i % 3)),
        this.moon.position.y + Math.sin(a) * (6.2 + (i % 2)),
        this.moon.position.z - 1.5,
      );
      spark.name = `null-eaten-spark-${i}`;
      this.group.add(spark);
    }

    this.accent = new THREE.PointLight(NULL_PALETTE.scaleLow, 22, 55, 2);
    this.accent.position.copy(this.moon.position);
    this.accent.position.z -= 4;
    this.group.add(this.accent);
  }

  update(time: number, reduceMotion: boolean) {
    if (reduceMotion) return;
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.55);
    this.moonMat.emissiveIntensity = 0.35 + pulse * 0.2;
    this.hazeMat.opacity = 0.14 + pulse * 0.08;
    this.kit.flesh.emissiveIntensity = 0.45 + pulse * 0.25;
    this.kit.telegraph.emissiveIntensity = 0.7 + pulse * 0.35;
    this.accent.intensity = 16 + pulse * 10;
    this.moon.rotation.z = Math.sin(time * 0.12) * 0.03;
    this.lash.rotation.z = Math.sin(time * 0.35) * 0.08;
    this.lashBlobs.forEach((b, i) => {
      b.position.x += Math.sin(time * 0.9 + i) * 0.0008;
    });
  }

  dispose() {
    for (const g of this.geometries) g.dispose();
    this.moonMat.dispose();
    this.hazeMat.dispose();
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
