import * as THREE from 'three';
import { CinematicPistonArt } from './CinematicPistonArt';
import type { ObstacleConfig } from '../config/ObstacleConfig';
import { pistonFieldStateAtTime } from './PistonFieldState';
import { pulseRingStateAtTime } from './PulseRingState';
import { reactiveGateStateAtTime, rollingApertureStateAtTime } from './ExtendedLibraryState';

type Config = Extract<ObstacleConfig, {type: 'pistonField' | 'pulseRing' | 'rollingAperture' | 'reactiveGate'}>;
const SEGMENTS = 192;

/** Presentation only. Every moving silhouette samples the existing simulation state. */
export class LibraryPriorityArt {
  readonly group = new THREE.Group();
  private parts: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial | THREE.ShaderMaterial>[] = [];
  private cinematicPiston?: CinematicPistonArt;

  static supports(config: ObstacleConfig): config is Config {
    return ['pistonField', 'pulseRing', 'rollingAperture', 'reactiveGate'].includes(config.type ?? 'rotor');
  }

  constructor(private readonly config: Config) {
    this.group.name = `art-${config.type}`;
    if (config.type === 'pistonField') {
      for (let i = 0; i < config.laneCount; i++) {
        for (const [name, color] of [['floor-socket', 0x26313b], ['steel-ram', 0x405566], ['shaft-face', 0xabc0cc], ['ram-cap', 0x253746], ['travel-lamp', 0xffba62], ['shaft-shadow', 0x263944], ['socket-collar', 0x607785], ['socket-mark', 0xd8a14a]] as const) this.box(`${name}-${i}`, color);
      }
      // L6 look-development checkpoint: second lane only; other lanes are comparison art.
      if (config.z === 5.8 && config.laneCount === 4) {
        this.cinematicPiston = new CinematicPistonArt();
        this.group.add(this.cinematicPiston.group);
        for (let i = 8; i < 16; i++) this.parts[i].visible = false;
      }
    } else if (config.type === 'reactiveGate') {
      for (let i = 0; i < 2; i++) {
        this.box(`capture-door-${i}`, 0x344955);
        this.box(`armor-inset-${i}`, 0x647e8b);
        this.box(`status-lamp-${i}`, 0xffba62);
        this.box(`restraint-mark-${i}`, 0xc5d7dc);
        this.box(`door-spine-${i}`, 0x23313f);
        this.box(`door-latch-${i}`, 0xdba657);
      }
    } else {
      this.ring('danger-surface', config.type === 'pulseRing' ? 0xa0c8ff : 0x1c344b);
      this.ring('lit-edge', config.type === 'pulseRing' ? 0xe6f3ff : 0x9de9ff);
      if (config.type === 'rollingAperture') {
        const surface = this.parts[0];
        surface.material.dispose();
        // Procedural transfer-field lines keep the blocked plane visible without
        // erasing the chapter backdrop. Geometry, not alpha, cuts the safe hole.
        surface.material = new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, side: THREE.DoubleSide,
          vertexShader: 'varying vec2 p; void main(){p=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
          fragmentShader: 'varying vec2 p; void main(){float r=length(p); float grid=step(.965,fract(r*2.8)); float spoke=step(.991,fract(atan(p.y,p.x)*12.)); gl_FragColor=vec4(mix(vec3(.055,.13,.20),vec3(.23,.48,.58),max(grid,spoke)),.52+grid*.16);}',
        });
      }
    }
  }

  private add(name: string, geometry: THREE.BufferGeometry, color: number) {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color, side: THREE.DoubleSide}));
    mesh.name = name;
    // Dynamic annuli keep their initial bounding sphere; don't cull using stale bounds.
    mesh.frustumCulled = false;
    this.parts.push(mesh);
    this.group.add(mesh);
  }
  private box(name: string, color: number) { this.add(name, new THREE.BoxGeometry(1, 1, 1), color); }
  private ring(name: string, color: number) { this.add(name, new THREE.RingGeometry(1, 2, SEGMENTS), color); }
  private place(index: number, x: number, y: number, z: number, w: number, h: number, d: number) {
    const mesh = this.parts[index];
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
  }
  private annulus(index: number, x: number, y: number, inner: number, outer: number, z = 0) {
    const mesh = this.parts[index];
    const positions = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let row = 0; row < 2; row++) {
      const radius = row === 0 ? inner : outer;
      for (let j = 0; j <= SEGMENTS; j++) {
        const angle = j / SEGMENTS * Math.PI * 2;
        positions.setXYZ(row * (SEGMENTS + 1) + j, Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      }
    }
    positions.needsUpdate = true;
    mesh.position.set(x, y, z);
  }

  update(time: number): void {
    const c = this.config;
    if (c.type === 'pistonField') {
      pistonFieldStateAtTime(c, time).forEach((s, i) => {
        if (i === 1) this.cinematicPiston?.update(s);
        const n = i * 8;
        // Socket is below the collider and behind it; trim stays inside the ram silhouette.
        this.place(n, s.x, s.floorY - 0.06, 0.10, s.width * 1.18, 0.12, 0.30);
        this.place(n + 1, s.x, s.y, 0, s.width, s.height, 0.18);
        this.place(n + 2, s.x, s.y, -0.096, s.width * 0.34, s.height * 0.94, 0.012);
        const cap = Math.min(0.16, s.height * 0.3);
        this.place(n + 3, s.x, s.top - cap / 2, -0.10, s.width, cap, 0.016);
        this.place(n + 4, s.x, s.top - cap / 2, -0.112, s.width * 0.52, cap * 0.27, 0.012);
        // Amber indicates machinery, not immunity: retracted bodies remain fully visible.
        (this.parts[n + 4].material as THREE.MeshBasicMaterial).color.setHex(s.open ? 0xc4d6da : 0xffb449);
        this.place(n + 5, s.x + s.width * 0.28, s.y, -0.097, s.width * 0.09, s.height * 0.94, 0.014);
        this.place(n + 6, s.x, s.floorY + Math.min(0.16,s.height * 0.18), -0.105, s.width, Math.min(0.25,s.height * 0.3), 0.02);
        this.place(n + 7, s.x, s.floorY + 0.045, -0.121, s.width * 0.7, 0.035, 0.014);
      });
    } else if (c.type === 'reactiveGate') {
      const s = reactiveGateStateAtTime(c, time);
      [s.leftX, s.rightX].forEach((x, i) => {
        const n = i * 6;
        this.place(n, x, s.y, 0, s.panelWidth, s.panelHeight, 0.20);
        this.place(n + 1, x, s.y, -0.106, s.panelWidth * 0.76, s.panelHeight * 0.81, 0.012);
        this.place(n + 2, x, s.y + s.panelHeight * 0.36, -0.12, s.panelWidth * 0.56, 0.075, 0.014);
        this.place(n + 3, x, s.y - s.panelHeight * 0.25, -0.12, s.panelWidth * 0.38, 0.035, 0.014);
        (this.parts[n + 2].material as THREE.MeshBasicMaterial).color.setHex(s.warning ? 0xffb449 : s.phase === 'open' ? 0x70e5ed : 0xff7562);
        this.place(n + 4, x + (i === 0 ? 1 : -1) * s.panelWidth * 0.30, s.y, -0.12, s.panelWidth * 0.08, s.panelHeight * 0.84, 0.025);
        this.place(n + 5, x, s.y - s.panelHeight * 0.25, -0.145, s.panelWidth * 0.18, 0.11, 0.024);
        // Open refers to the gap: door panels themselves remain solid and opaque.
      });
    } else if (c.type === 'pulseRing') {
      const s = pulseRingStateAtTime(c, time);
      this.annulus(0, s.centerX, s.centerY, Math.max(0, s.radius - s.thickness), s.radius + s.thickness);
      this.annulus(1, s.centerX, s.centerY, s.radius - s.thickness * 0.22, s.radius + s.thickness * 0.22, -0.005);
    } else {
      const s = rollingApertureStateAtTime(c, time);
      // Collision blocks the whole plane outside the hole. Cover the visible corridor,
      // rather than offering apparently safe space beyond a narrow decorative rim.
      this.annulus(0, s.x, s.y, s.radius, 40);
      this.annulus(1, s.x, s.y, s.radius, s.radius + 0.065, -0.005);
    }
  }

  dispose(): void {
    this.cinematicPiston?.dispose();
    for (const mesh of this.parts) { mesh.geometry.dispose(); mesh.material.dispose(); }
    this.parts = [];
    this.group.clear();
    this.group.removeFromParent();
  }
}
