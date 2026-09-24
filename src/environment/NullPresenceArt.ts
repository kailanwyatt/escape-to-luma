import * as THREE from 'three';

/**
 * Persistent Null creature in the deep background of the_null chapter.
 * Decorative only — outside the playable corridor.
 */
export class NullPresenceArt {
  readonly group = new THREE.Group();
  private readonly body: THREE.Mesh;
  private readonly arms: THREE.Group[] = [];
  private readonly bodyMat: THREE.MeshStandardMaterial;
  private readonly fleshMat: THREE.MeshStandardMaterial;
  private readonly rimMat: THREE.MeshStandardMaterial;
  private readonly accent: THREE.PointLight;
  private readonly geometries: THREE.BufferGeometry[] = [];
  private time = 0;

  constructor() {
    this.group.name = 'null-presence';
    this.group.userData.decorativeOnly = true;

    this.bodyMat = new THREE.MeshStandardMaterial({
      color: 0x08040f,
      emissive: 0x1a0a28,
      emissiveIntensity: 0.35,
      metalness: 0.05,
      roughness: 0.85,
      fog: false,
    });
    this.fleshMat = new THREE.MeshStandardMaterial({
      color: 0x14081f,
      emissive: 0x3a1458,
      emissiveIntensity: 0.4,
      metalness: 0.02,
      roughness: 0.78,
      fog: false,
    });
    this.rimMat = new THREE.MeshStandardMaterial({
      color: 0x6a40a0,
      emissive: 0x502080,
      emissiveIntensity: 0.55,
      metalness: 0.1,
      roughness: 0.45,
      fog: false,
      transparent: true,
      opacity: 0.75,
    });

    // Core mass — light-eaten body, far behind gameplay.
    const bodyGeo = new THREE.SphereGeometry(6.2, 28, 20);
    this.geometries.push(bodyGeo);
    this.body = new THREE.Mesh(bodyGeo, this.bodyMat);
    this.body.name = 'null-body';
    this.body.position.set(9.5, 11.5, 54);
    this.body.scale.set(1.15, 0.95, 0.85);
    this.group.add(this.body);

    // Inner hunger glow (eaten light)
    const coreGeo = new THREE.SphereGeometry(2.4, 16, 12);
    this.geometries.push(coreGeo);
    const core = new THREE.Mesh(coreGeo, this.rimMat);
    core.name = 'null-hunger-core';
    core.position.copy(this.body.position);
    core.position.z -= 1.2;
    this.group.add(core);

    // Long background tentacles reaching toward the corridor (never enter play Z).
    for (let i = 0; i < 7; i++) {
      const arm = new THREE.Group();
      arm.name = `null-presence-arm-${i}`;
      const baseAngle = -0.9 + (i / 6) * 1.8;
      arm.position.set(
        this.body.position.x + Math.cos(baseAngle) * 4.5,
        this.body.position.y + Math.sin(baseAngle) * 3.2 - 1.5,
        this.body.position.z - 2 - (i % 3) * 0.8,
      );
      arm.userData.baseAngle = baseAngle;
      arm.userData.phase = i * 0.73;

      let parent: THREE.Object3D = arm;
      for (let s = 0; s < 5; s++) {
        const segGeo = new THREE.CapsuleGeometry(0.35 - s * 0.05, 1.6 - s * 0.18, 4, 8);
        this.geometries.push(segGeo);
        const seg = new THREE.Mesh(segGeo, s % 2 ? this.fleshMat : this.bodyMat);
        seg.name = `null-presence-seg-${i}-${s}`;
        seg.position.set(0, -(0.95 - s * 0.08), 0);
        // Point roughly toward play space (down-left toward camera/corridor).
        seg.rotation.z = baseAngle * 0.35 + (i % 2 ? 0.15 : -0.12);
        seg.rotation.x = 0.35 + s * 0.08;
        parent.add(seg);
        parent = seg;

        if (s === 4) {
          const tipGeo = new THREE.SphereGeometry(0.22, 8, 6);
          this.geometries.push(tipGeo);
          const tip = new THREE.Mesh(tipGeo, this.rimMat);
          tip.name = `null-presence-tip-${i}`;
          tip.position.y = -0.85;
          seg.add(tip);
        }
      }
      this.group.add(arm);
      this.arms.push(arm);
    }

    // Halo of eaten stars
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const sparkGeo = new THREE.SphereGeometry(0.06 + (i % 3) * 0.02, 6, 4);
      this.geometries.push(sparkGeo);
      const spark = new THREE.Mesh(sparkGeo, this.rimMat);
      spark.position.set(
        this.body.position.x + Math.cos(a) * (8 + (i % 4)),
        this.body.position.y + Math.sin(a) * (6.5 + (i % 3)),
        this.body.position.z - 1,
      );
      spark.name = `null-eaten-spark-${i}`;
      this.group.add(spark);
    }

    this.accent = new THREE.PointLight(0x6a30a0, 18, 40, 2);
    this.accent.position.copy(this.body.position);
    this.accent.position.z -= 3;
    this.group.add(this.accent);
  }

  update(time: number, reduceMotion: boolean) {
    this.time = time;
    if (reduceMotion) return;
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.7);
    this.bodyMat.emissiveIntensity = 0.28 + pulse * 0.2;
    this.fleshMat.emissiveIntensity = 0.32 + pulse * 0.28;
    this.rimMat.emissiveIntensity = 0.45 + pulse * 0.35;
    this.accent.intensity = 14 + pulse * 10;
    this.body.rotation.z = Math.sin(time * 0.15) * 0.04;
    this.body.rotation.y = Math.sin(time * 0.11) * 0.06;

    this.arms.forEach((arm, i) => {
      const phase = arm.userData.phase as number;
      const sway = Math.sin(time * (0.45 + i * 0.03) + phase) * 0.18;
      const reach = Math.sin(time * 0.22 + phase) * 0.08;
      arm.rotation.z = sway;
      arm.rotation.x = reach;
      // Subtle undulation down the chain
      arm.traverse((o) => {
        if (o.name.startsWith('null-presence-seg') && o !== arm.children[0]) {
          o.rotation.z = sway * 0.35 + Math.sin(time * 1.1 + phase + o.id) * 0.06;
        }
      });
    });
  }

  dispose() {
    for (const g of this.geometries) g.dispose();
    this.bodyMat.dispose();
    this.fleshMat.dispose();
    this.rimMat.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
