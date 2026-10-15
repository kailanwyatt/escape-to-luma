import * as THREE from 'three';
import type { MovingSafeZoneConfig } from '../config/ObstacleConfig';
import { movingSafeZoneHoleAtTime } from './StoryLibraryState';

type DebrisRest = {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  sx: number;
  sy: number;
  sz: number;
  tumble: number;
};

/**
 * Orbital wreck field — dense irregular debris plane with a drifting low-density
 * corridor. Visual only; hole pose still comes from StoryLibraryState.
 */
export class MovingSafeZoneArt {
  readonly group = new THREE.Group();
  private readonly dummy = new THREE.Object3D();
  private readonly boxDebris: THREE.InstancedMesh;
  private readonly rodDebris: THREE.InstancedMesh;
  private readonly boxRests: DebrisRest[] = [];
  private readonly rodRests: DebrisRest[] = [];
  private readonly streaks: THREE.InstancedMesh;
  private readonly streakRests: { angle: number; speed: number; len: number; phase: number }[] = [];
  private readonly accent: THREE.PointLight;
  private readonly silhouettes: THREE.Group[] = [];
  private readonly opening: THREE.Mesh;
  private readonly field: THREE.ShaderMaterial;
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly materials: THREE.Material[] = [];

  constructor(private readonly config: MovingSafeZoneConfig) {
    this.group.name = 'moving-safe-zone-art';

    const steel = new THREE.MeshStandardMaterial({
      color: 0x9aa9b6,
      metalness: 0.55,
      roughness: 0.42,
    });
    const hull = new THREE.MeshStandardMaterial({
      color: 0x61798b,
      metalness: 0.78,
      roughness: 0.55,
    });
    const panel = new THREE.MeshStandardMaterial({
      color: 0x234d77,
      metalness: 0.7,
      roughness: 0.48,
      emissive: 0x061018,
      emissiveIntensity: 0.35,
    });
    this.materials.push(steel, hull, panel);

    let seed = 71011;
    const rand = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    const R = config.fieldRadius;
    const cx = config.centerX;
    const cy = config.centerY;

    // --- Dense wreckage plane (instanced boxes: panels, hull, beams, crumbs) ---
    const BOX_COUNT = 92;
    for (let i = 0; i < BOX_COUNT; i++) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * R * 0.98;
      const kind = i % 7;
      let sx: number;
      let sy: number;
      let sz: number;
      if (kind === 0) {
        // Broken satellite panel
        sx = 0.28 + rand() * 0.42;
        sy = 0.14 + rand() * 0.22;
        sz = 0.018 + rand() * 0.02;
      } else if (kind === 1) {
        // Structural beam
        sx = 0.45 + rand() * 0.55;
        sy = 0.035 + rand() * 0.03;
        sz = 0.035 + rand() * 0.025;
      } else if (kind === 2) {
        // Hull fragment
        sx = 0.16 + rand() * 0.28;
        sy = 0.12 + rand() * 0.22;
        sz = 0.06 + rand() * 0.1;
      } else if (kind === 3) {
        // Small satellite body
        sx = 0.1 + rand() * 0.12;
        sy = 0.1 + rand() * 0.12;
        sz = 0.1 + rand() * 0.14;
      } else if (kind === 4) {
        // Radiator / plate shard
        sx = 0.2 + rand() * 0.3;
        sy = 0.06 + rand() * 0.08;
        sz = 0.012 + rand() * 0.015;
      } else {
        // Metallic crumb
        const s = 0.03 + rand() * 0.06;
        sx = s;
        sy = s * (0.6 + rand());
        sz = s * (0.5 + rand());
      }
      this.boxRests.push({
        x: cx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r,
        z: (rand() - 0.5) * 0.35,
        rx: rand() * Math.PI,
        ry: rand() * Math.PI,
        rz: rand() * Math.PI,
        sx,
        sy,
        sz,
        tumble: 0.15 + rand() * 0.55,
      });
    }
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    this.geometries.push(boxGeo);
    this.boxDebris = new THREE.InstancedMesh(boxGeo, steel, BOX_COUNT);
    this.boxDebris.name = 'wreck-box-debris';
    this.boxDebris.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.group.add(this.boxDebris);

    // --- Antenna rods / boom stubs (instanced cylinders) ---
    const ROD_COUNT = 28;
    for (let i = 0; i < ROD_COUNT; i++) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * R * 0.95;
      const len = 0.22 + rand() * 0.45;
      const thin = 0.012 + rand() * 0.018;
      this.rodRests.push({
        x: cx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r,
        z: (rand() - 0.5) * 0.3,
        rx: rand() * Math.PI,
        ry: rand() * Math.PI,
        rz: rand() * Math.PI,
        sx: thin,
        sy: len,
        sz: thin,
        tumble: 0.2 + rand() * 0.5,
      });
    }
    const rodGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 5);
    this.geometries.push(rodGeo);
    this.rodDebris = new THREE.InstancedMesh(rodGeo, hull, ROD_COUNT);
    this.rodDebris.name = 'wreck-antenna-debris';
    this.rodDebris.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.group.add(this.rodDebris);

    // --- Fast debris streaks (thin darting shards) ---
    const STREAK_COUNT = 6;
    for (let i = 0; i < STREAK_COUNT; i++) {
      this.streakRests.push({
        angle: rand() * Math.PI * 2,
        speed: 1.6 + rand() * 2.2,
        len: 0.35 + rand() * 0.45,
        phase: rand() * Math.PI * 2,
      });
    }
    const streakMat = new THREE.MeshBasicMaterial({
      color: 0x9aa8bc,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    this.materials.push(streakMat);
    this.streaks = new THREE.InstancedMesh(boxGeo, streakMat, STREAK_COUNT);
    this.streaks.name = 'wreck-debris-streaks';
    this.streaks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.group.add(this.streaks);

    // --- Large non-colliding satellite wreck silhouettes at depth ---
    for (let i = 0; i < 4; i++) {
      const wreck = this.buildSatelliteSilhouette(hull, panel, i);
      const side = i % 2 === 0 ? -1 : 1;
      const depth = 2.6 + i * .8;
      wreck.position.set(
        cx + side * (R + 1.2 + (i % 2) * .5),
        cy + (i < 2 ? 0.55 : -0.75) + (rand() - 0.5) * 0.3,
        depth,
      );
      wreck.rotation.z = side * (0.18 + i * 0.07);
      wreck.scale.setScalar(1.15 + i * .15);
      wreck.userData.decorativeOnly = true;
      this.group.add(wreck);
      this.silhouettes.push(wreck);
    }

    // --- Subtle accent only (corridor read comes from debris density) ---
    this.accent = new THREE.PointLight(0xffb56a, 4.5, 8, 2);
    this.accent.name = 'safe-zone-accent';
    this.group.add(this.accent);

    // The environment owns Earth. Keep the moving corridor the brightest foreground read.
    const markerGeo = new THREE.TorusGeometry(config.holeRadius + .018, .018, 6, 72);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xffc47a, transparent: true, opacity: .8, depthWrite: false });
    this.geometries.push(markerGeo); this.materials.push(markerMat);
    this.opening = new THREE.Mesh(markerGeo, markerMat); this.opening.name = 'wreck-safe-boundary'; this.group.add(this.opening);
    this.field = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { hole: { value: new THREE.Vector3() }, radius: { value: R } },
      vertexShader: 'varying vec2 p;void main(){p=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'varying vec2 p;uniform vec3 hole;uniform float radius;void main(){float d=length(p-hole.xy);if(d<hole.z||length(p)>radius)discard;vec2 cell=abs(fract(p*10.)-.5);float seam=smoothstep(.44,.5,max(cell.x,cell.y));gl_FragColor=vec4(.19,.29,.37,.13+seam*.10);}',
    });
    const fieldGeo = new THREE.PlaneGeometry(R * 2, R * 2); this.geometries.push(fieldGeo); this.materials.push(this.field);
    const field = new THREE.Mesh(fieldGeo, this.field); field.name = 'wreck-hazard-density'; field.position.set(cx, cy, .3); this.group.add(field);

    this.update(0);
  }

  private buildSatelliteSilhouette(
    hull: THREE.Material,
    panelMat: THREE.Material,
    seed: number,
  ): THREE.Group {
    const g = new THREE.Group();
    g.name = `wreck-silhouette-${seed}`;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.32, 0.28), hull);
    body.name = 'sil-body';
    g.add(body);
    const boom = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.04), hull);
    boom.position.set(0.35, 0.05, 0);
    boom.rotation.z = -0.2 + seed * 0.05;
    g.add(boom);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.28, 0.03), panelMat);
    wing.position.set(-0.15, -0.05, 0.08);
    wing.rotation.z = 0.35 + seed * 0.08;
    wing.rotation.y = 0.2;
    g.add(wing);
    const cells = new THREE.InstancedMesh(new THREE.BoxGeometry(.14, .09, .012), panelMat, 12);
    const pose = new THREE.Object3D();
    for (let i = 0; i < 12; i++) {
      pose.position.set(-.55 + i % 4 * .17, -.2 + Math.floor(i / 4) * .12, -.09);
      pose.updateMatrix(); cells.setMatrixAt(i, pose.matrix);
    }
    cells.name = 'fractured-solar-cells'; g.add(cells);
    const radiator = new THREE.InstancedMesh(new THREE.BoxGeometry(.03, .27, .05), hull, 6);
    for (let i = 0; i < 6; i++) { pose.position.set(.08 + i * .07, -.04, -.19); pose.updateMatrix(); radiator.setMatrixAt(i, pose.matrix); }
    radiator.name = 'exposed-radiator'; g.add(radiator);
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.04, 10), hull);
    dish.rotation.x = Math.PI / 2;
    dish.position.set(0.1, 0.18, -0.1);
    g.add(dish);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.01, 0.55, 4), hull);
    ant.position.set(0.2, 0.35, 0);
    ant.rotation.z = 0.4;
    g.add(ant);
    return g;
  }

  /** Density falloff inside the moving corridor — low-density path, not a hard cut. */
  private corridorScale(px: number, py: number, holeX: number, holeY: number, holeR: number): number {
    const d = Math.hypot(px - holeX, py - holeY);
    if (d >= holeR * 1.05) return 1;
    if (d <= holeR) return 0;
    // Never leave opaque crumbs inside the safe corridor.
    const t = (d - holeR) / (holeR * .05);
    return t * t;
  }

  private writeInstance(mesh: THREE.InstancedMesh, index: number, rest: DebrisRest, time: number, holeX: number, holeY: number, holeR: number) {
    const clear = this.corridorScale(rest.x, rest.y, holeX, holeY, holeR + Math.hypot(rest.sx, rest.sy, rest.sz) * .5);
    // Mild outward nudge when partially cleared so the path reads as a gap in wreckage.
    let x = rest.x;
    let y = rest.y;
    if (clear < 0.95) {
      const dx = rest.x - holeX;
      const dy = rest.y - holeY;
      const len = Math.hypot(dx, dy) || 1;
      const push = (1 - clear) * holeR * 0.22;
      x += (dx / len) * push;
      y += (dy / len) * push;
    }
    const s = clear;
    this.dummy.position.set(x, y, rest.z);
    this.dummy.rotation.set(
      rest.rx + time * rest.tumble * 0.35,
      rest.ry + time * rest.tumble * 0.22,
      rest.rz + time * rest.tumble * 0.18,
    );
    this.dummy.scale.set(rest.sx * s, rest.sy * s, rest.sz * s);
    this.dummy.updateMatrix();
    mesh.setMatrixAt(index, this.dummy.matrix);
  }

  update(time: number) {
    const s = movingSafeZoneHoleAtTime(this.config, time);
    const cx = this.config.centerX;
    const cy = this.config.centerY;
    const R = this.config.fieldRadius;

    for (let i = 0; i < this.boxRests.length; i++) {
      this.writeInstance(this.boxDebris, i, this.boxRests[i]!, time, s.x, s.y, s.radius);
    }
    this.boxDebris.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < this.rodRests.length; i++) {
      this.writeInstance(this.rodDebris, i, this.rodRests[i]!, time, s.x, s.y, s.radius);
    }
    this.rodDebris.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < this.streakRests.length; i++) {
      const st = this.streakRests[i]!;
      const travel = ((time * st.speed + st.phase) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const rr = R * (0.55 + 0.4 * Math.sin(st.phase * 3.1));
      const x = cx + Math.cos(st.angle + travel) * rr;
      const y = cy + Math.sin(st.angle + travel * 1.05) * rr;
      const clear = this.corridorScale(x, y, s.x, s.y, s.radius + st.len * .5);
      this.dummy.position.set(x, y, -0.12 + (i % 3) * 0.05);
      this.dummy.rotation.set(0, 0, st.angle + travel + Math.PI / 2);
      this.dummy.scale.set(st.len * clear, 0.018 * clear, 0.018 * clear);
      this.dummy.updateMatrix();
      this.streaks.setMatrixAt(i, this.dummy.matrix);
    }
    this.streaks.instanceMatrix.needsUpdate = true;

    const pulse = 0.75 + 0.25 * Math.sin(time * 2.1);
    this.accent.intensity = 3.5 + 2.5 * pulse;
    this.accent.position.set(s.x, s.y, -1.0);

    // Slow parallax on deep silhouettes only — not tied to hole collision.
    this.silhouettes.forEach((wreck, i) => {
      wreck.rotation.y = Math.sin(time * 0.12 + i) * 0.08;
      wreck.position.z = 2.6 + i * .8 + Math.sin(time * 0.18 + i * 1.3) * 0.04;
    });

    this.opening.position.set(s.x, s.y, -.28);
    this.field.uniforms.hole.value.set(s.x - cx, s.y - cy, s.radius);

    this.group.userData.openingX = s.x;
    this.group.userData.openingY = s.y;
    this.group.userData.holeRadius = s.radius;
  }

  dispose() {
    for (const g of this.geometries) g.dispose();
    for (const m of this.materials) m.dispose();
    this.boxDebris.dispose();
    this.rodDebris.dispose();
    this.streaks.dispose();
    for (const wreck of this.silhouettes) {
      wreck.traverse((obj) => {
        if (obj instanceof THREE.InstancedMesh) obj.dispose();
        if (obj instanceof THREE.Mesh) obj.geometry.dispose();
      });
    }
    this.group.clear();
    this.group.removeFromParent();
  }
}
