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
  private readonly corridorLip: THREE.Mesh;
  private readonly corridorWash: THREE.Mesh;
  private readonly lipMat: THREE.MeshStandardMaterial;
  private readonly washMat: THREE.ShaderMaterial;
  private readonly accent: THREE.PointLight;
  private readonly silhouettes: THREE.Group[] = [];
  private readonly earth: THREE.Group;
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly materials: THREE.Material[] = [];
  private readonly uniforms: {
    uTime: { value: number };
    uHole: { value: THREE.Vector2 };
    uHoleR: { value: number };
  };

  constructor(private readonly config: MovingSafeZoneConfig) {
    this.group.name = 'moving-safe-zone-art';

    const steel = new THREE.MeshStandardMaterial({
      color: 0x6a7688,
      metalness: 0.88,
      roughness: 0.42,
    });
    const hull = new THREE.MeshStandardMaterial({
      color: 0x4a5566,
      metalness: 0.78,
      roughness: 0.55,
    });
    const panel = new THREE.MeshStandardMaterial({
      color: 0x3a4a62,
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
      const depth = -0.9 - i * 0.55;
      wreck.position.set(
        cx + side * (R * 0.85 + 0.35 + (i % 2) * 0.4),
        cy + (i < 2 ? 0.55 : -0.75) + (rand() - 0.5) * 0.3,
        depth,
      );
      wreck.rotation.z = side * (0.18 + i * 0.07);
      wreck.scale.setScalar(0.85 + i * 0.12);
      this.group.add(wreck);
      this.silhouettes.push(wreck);
    }

    // --- Subtle amber corridor navigation cues (not an energy membrane) ---
    this.lipMat = new THREE.MeshStandardMaterial({
      color: 0xffc878,
      emissive: 0xff9a3a,
      emissiveIntensity: 0.55,
      metalness: 0.2,
      roughness: 0.4,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    this.materials.push(this.lipMat);
    const lipGeo = new THREE.TorusGeometry(1, 0.018, 6, 48);
    this.geometries.push(lipGeo);
    this.corridorLip = new THREE.Mesh(lipGeo, this.lipMat);
    this.corridorLip.name = 'corridor-guide';
    this.group.add(this.corridorLip);

    this.uniforms = {
      uTime: { value: 0 },
      uHole: { value: new THREE.Vector2(0, 0) },
      uHoleR: { value: config.holeRadius },
    };
    this.washMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: this.uniforms,
      vertexShader: `
        varying vec2 vLocal;
        void main() {
          vLocal = position.xy;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision mediump float;
        varying vec2 vLocal;
        uniform float uTime;
        uniform float uHoleR;
        void main() {
          float d = length(vLocal);
          float rim = smoothstep(uHoleR * 0.72, uHoleR, d) * (1.0 - smoothstep(uHoleR, uHoleR * 1.22, d));
          float pulse = 0.75 + 0.25 * sin(uTime * 2.1);
          vec3 amber = vec3(1.0, 0.68, 0.28);
          gl_FragColor = vec4(amber, rim * 0.22 * pulse);
        }
      `,
    });
    this.materials.push(this.washMat);
    const washGeo = new THREE.CircleGeometry(1, 48);
    this.geometries.push(washGeo);
    this.corridorWash = new THREE.Mesh(washGeo, this.washMat);
    this.corridorWash.name = 'corridor-wash';
    this.corridorWash.position.z = -0.05;
    this.group.add(this.corridorWash);

    this.accent = new THREE.PointLight(0xffb56a, 4.5, 8, 2);
    this.accent.name = 'safe-zone-accent';
    this.group.add(this.accent);

    // --- Earth below (decorative; establishes LEO context) ---
    this.earth = this.buildEarthAccent();
    this.earth.position.set(cx, cy - R - 2.6, 3.2);
    this.earth.scale.setScalar(1.15);
    this.group.add(this.earth);

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

  private buildEarthAccent(): THREE.Group {
    const root = new THREE.Group();
    root.name = 'wreck-earth-accent';
    const earthMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 p; varying vec3 n; varying vec3 eye;
        void main(){
          p = position;
          n = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          eye = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 p; varying vec3 n; varying vec3 eye;
        float hash(vec3 q){ return fract(sin(dot(q, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
        float noise(vec3 q){
          vec3 i = floor(q), f = fract(q); f = f*f*(3.0-2.0*f);
          return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
        }
        void main(){
          vec3 q = normalize(p);
          float land = smoothstep(0.5, 0.58, noise(q * 5.0 + 2.0));
          vec3 sea = mix(vec3(0.02, 0.06, 0.16), vec3(0.04, 0.28, 0.45), noise(q * 12.0));
          vec3 ground = mix(vec3(0.05, 0.14, 0.1), vec3(0.22, 0.26, 0.18), noise(q * 18.0));
          float cloud = smoothstep(0.48, 0.72, noise(q * 20.0));
          vec3 col = mix(mix(sea, ground, land), vec3(0.82, 0.9, 0.95), cloud * 0.75);
          float day = 0.35 + 0.65 * smoothstep(-0.4, 0.55, dot(q, normalize(vec3(-0.5, 0.75, -0.4))));
          float rim = pow(1.0 - max(0.0, dot(normalize(n), normalize(eye))), 3.0);
          gl_FragColor = vec4(col * day + vec3(0.1, 0.4, 0.75) * rim * 0.65, 1.0);
        }
      `,
    });
    this.materials.push(earthMat);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(2.4, 40, 28), earthMat);
    ball.name = 'wreck-earth-horizon';
    ball.rotation.z = -0.2;
    root.add(ball);
    const airMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      vertexShader: `
        varying vec3 n; varying vec3 v;
        void main(){
          n = normalize(normalMatrix * normal);
          vec4 p = modelViewMatrix * vec4(position, 1.0);
          v = normalize(-p.xyz);
          gl_Position = projectionMatrix * p;
        }
      `,
      fragmentShader: `
        varying vec3 n; varying vec3 v;
        void main(){
          float f = pow(1.0 - max(0.0, dot(normalize(n), normalize(v))), 4.5);
          gl_FragColor = vec4(0.16, 0.52, 1.0, f * 0.5);
        }
      `,
    });
    this.materials.push(airMat);
    const air = new THREE.Mesh(new THREE.SphereGeometry(2.52, 40, 28), airMat);
    air.name = 'wreck-earth-atmosphere';
    root.add(air);
    return root;
  }

  /** Density falloff inside the moving corridor — low-density path, not a hard cut. */
  private corridorScale(px: number, py: number, holeX: number, holeY: number, holeR: number): number {
    const d = Math.hypot(px - holeX, py - holeY);
    if (d >= holeR * 1.05) return 1;
    if (d <= holeR * 0.35) return 0.04;
    // Soft thin-out toward the corridor center; sparse crumbs remain near the rim.
    const t = (d - holeR * 0.35) / (holeR * 0.7);
    return 0.04 + t * t * 0.96;
  }

  private writeInstance(mesh: THREE.InstancedMesh, index: number, rest: DebrisRest, time: number, holeX: number, holeY: number, holeR: number) {
    const clear = this.corridorScale(rest.x, rest.y, holeX, holeY, holeR);
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

    this.uniforms.uTime.value = time;
    this.uniforms.uHole.value.set(s.x - cx, s.y - cy);
    this.uniforms.uHoleR.value = s.radius;

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
      const clear = this.corridorScale(x, y, s.x, s.y, s.radius);
      this.dummy.position.set(x, y, -0.12 + (i % 3) * 0.05);
      this.dummy.rotation.set(0, 0, st.angle + travel + Math.PI / 2);
      this.dummy.scale.set(st.len * clear, 0.018 * clear, 0.018 * clear);
      this.dummy.updateMatrix();
      this.streaks.setMatrixAt(i, this.dummy.matrix);
    }
    this.streaks.instanceMatrix.needsUpdate = true;

    this.corridorLip.position.set(s.x, s.y, -0.06);
    this.corridorLip.scale.setScalar(Math.max(0.25, s.radius));
    this.corridorWash.position.set(s.x, s.y, -0.05);
    this.corridorWash.scale.setScalar(Math.max(0.25, s.radius));

    const pulse = 0.75 + 0.25 * Math.sin(time * 2.1);
    this.lipMat.emissiveIntensity = 0.4 + pulse * 0.35;
    this.accent.intensity = 3.5 + 2.5 * pulse;
    this.accent.position.set(s.x, s.y, -1.0);

    // Slow parallax on deep silhouettes only — not tied to hole collision.
    this.silhouettes.forEach((wreck, i) => {
      wreck.rotation.y = Math.sin(time * 0.12 + i) * 0.08;
      wreck.position.z = -0.9 - i * 0.55 + Math.sin(time * 0.18 + i * 1.3) * 0.04;
    });

    this.earth.rotation.y = time * 0.02;

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
        if (obj instanceof THREE.Mesh) obj.geometry.dispose();
      });
    }
    this.earth.traverse((obj) => {
      if (obj instanceof THREE.Mesh) obj.geometry.dispose();
    });
    this.group.clear();
    this.group.removeFromParent();
  }
}
