import * as THREE from 'three';
import { spaceFinish } from './SpaceSurfaceArt';
import { ContainmentGateArt } from './ContainmentGateArt';
import { ContainmentGateArtV1 } from './legacy/ContainmentGateArtV1';
import { CinematicPistonArt } from './CinematicPistonArt';
import { CinematicPistonArtV1 } from './legacy/CinematicPistonArtV1';
import { PistonFieldArtBasic } from './legacy/PistonFieldArtBasic';
import { CinematicPulseRingArt } from './CinematicPulseRingArt';
import { CinematicRollingApertureArt } from './CinematicRollingApertureArt';
import { PISTON_VISUAL_VARIANT } from './PistonVisualVariant';
import { GATE_VISUAL_VARIANT } from './GateVisualVariant';
import { PULSE_RING_VISUAL_VARIANT } from './PulseRingVisualVariant';
import { ROLLING_APERTURE_VISUAL_VARIANT } from './RollingApertureVisualVariant';
import type { ObstacleConfig } from '../config/ObstacleConfig';
import { pistonFieldStateAtTime } from './PistonFieldState';
import { pulseRingStateAtTime } from './PulseRingState';
import { rollingApertureStateAtTime } from './ExtendedLibraryState';

type Config = Extract<ObstacleConfig, { type: 'pistonField' | 'pulseRing' | 'rollingAperture' | 'reactiveGate' }>;
const SEGMENTS = 192;

type PistonLaneArt = { group: THREE.Group; update(s: import('./PistonFieldState').PistonLaneState): void; dispose(): void };
type GateArt = { group: THREE.Group; update(time: number): void; dispose(): void };
type RingArt = { group: THREE.Group; update(time: number): void; dispose(): void };

/** Presentation only. Every moving silhouette samples the existing simulation state. */
export class LibraryPriorityArt {
  readonly group = new THREE.Group();
  private parts: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial | THREE.ShaderMaterial>[] = [];
  private cinematicPistons: PistonLaneArt[] = [];
  private basicPistons: PistonFieldArtBasic | null = null;
  private accentLight: THREE.PointLight | null = null;
  private readonly surfaceTime = { value: 0 };
  private containmentGate?: GateArt;
  private pulseArt?: RingArt;
  private rollingArt?: RingArt;

  static supports(config: ObstacleConfig): config is Config {
    return ['pistonField', 'pulseRing', 'rollingAperture', 'reactiveGate'].includes(config.type ?? 'rotor');
  }

  constructor(private readonly config: Config) {
    this.group.name = `art-${config.type}`;
    if (config.type === 'pistonField') {
      if (PISTON_VISUAL_VARIANT === 'basic') {
        this.basicPistons = new PistonFieldArtBasic(config);
        this.group.add(this.basicPistons.group);
      } else {
        const Art = PISTON_VISUAL_VARIANT === 'legacy-cinematic' ? CinematicPistonArtV1 : CinematicPistonArt;
        for (let i = 0; i < config.laneCount; i++) {
          const art = new Art();
          this.cinematicPistons.push(art);
          this.group.add(art.group);
        }
        this.accentLight = new THREE.PointLight(0xff9a45, 10, 9, 2);
        this.accentLight.name = 'piston-accent';
        this.accentLight.position.set(0, 1.4, -1.1);
        this.group.add(this.accentLight);
      }
    } else if (config.type === 'reactiveGate') {
      this.containmentGate =
        GATE_VISUAL_VARIANT === 'legacy' ? new ContainmentGateArtV1(config) : new ContainmentGateArt(config);
      this.group.add(this.containmentGate.group);
    } else if (config.type === 'pulseRing' && PULSE_RING_VISUAL_VARIANT === 'cinematic') {
      this.pulseArt = new CinematicPulseRingArt(config);
      this.group.add(this.pulseArt.group);
    } else if (config.type === 'rollingAperture' && ROLLING_APERTURE_VISUAL_VARIANT === 'cinematic') {
      this.rollingArt = new CinematicRollingApertureArt(config);
      this.group.add(this.rollingArt.group);
    } else {
      this.ring('danger-surface', config.type === 'pulseRing' ? 0xa0c8ff : 0x1c344b);
      this.ring('lit-edge', config.type === 'pulseRing' ? 0xe6f3ff : 0x9de9ff);
      if (config.type === 'pulseRing') {
        for (const part of this.parts) spaceFinish(part.material as THREE.MeshBasicMaterial, 'pulse', this.surfaceTime);
      }
      if (config.type === 'rollingAperture') {
        const surface = this.parts[0];
        surface.material.dispose();
        surface.material = new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          uniforms: { fieldTime: this.surfaceTime },
          vertexShader:
            'varying vec2 p; void main(){p=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
          fragmentShader:
            'varying vec2 p;uniform float fieldTime; void main(){float r=length(p);float angle=atan(p.y,p.x);float grid=smoothstep(.955,.99,fract(r*2.8));float spoke=smoothstep(.98,1.,fract(angle*12.));float charge=pow(.5+.5*sin(r*16.-fieldTime*1.4+sin(angle*8.)),10.); gl_FragColor=vec4(mix(vec3(.035,.085,.13),vec3(.18,.43,.55),max(grid,spoke)) + vec3(.025,.08,.12)*charge,.46+grid*.13+charge*.08);}',
        });
      }
    }
  }

  private add(name: string, geometry: THREE.BufferGeometry, color: number) {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    mesh.name = name;
    mesh.frustumCulled = false;
    this.parts.push(mesh);
    this.group.add(mesh);
  }
  private ring(name: string, color: number) {
    this.add(name, new THREE.RingGeometry(1, 2, SEGMENTS), color);
  }
  private annulus(index: number, x: number, y: number, inner: number, outer: number, z = 0) {
    const mesh = this.parts[index];
    const positions = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let row = 0; row < 2; row++) {
      const radius = row === 0 ? inner : outer;
      for (let j = 0; j <= SEGMENTS; j++) {
        const angle = (j / SEGMENTS) * Math.PI * 2;
        positions.setXYZ(row * (SEGMENTS + 1) + j, Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      }
    }
    positions.needsUpdate = true;
    mesh.position.set(x, y, z);
  }

  update(time: number): void {
    this.surfaceTime.value = time;
    const c = this.config;
    if (c.type === 'pistonField') {
      if (this.basicPistons) {
        this.basicPistons.update(time);
        return;
      }
      const lanes = pistonFieldStateAtTime(c, time);
      lanes.forEach((s, i) => this.cinematicPistons[i]?.update(s));
      if (this.accentLight) {
        const mid = lanes[Math.floor(lanes.length / 2)];
        this.accentLight.position.set(mid?.x ?? 0, Math.max(0.8, (mid?.top ?? 2) * 0.35), -1.05);
        const closed = lanes.filter((l) => !l.open).length;
        this.accentLight.intensity = 7 + closed * 1.6 + 2 * (0.5 + 0.5 * Math.sin(time * 2.1));
      }
    } else if (c.type === 'reactiveGate') {
      this.containmentGate?.update(time);
    } else if (this.pulseArt) {
      this.pulseArt.update(time);
    } else if (this.rollingArt) {
      this.rollingArt.update(time);
    } else if (c.type === 'pulseRing') {
      const s = pulseRingStateAtTime(c, time);
      this.annulus(0, s.centerX, s.centerY, Math.max(0, s.radius - s.thickness), s.radius + s.thickness);
      this.annulus(1, s.centerX, s.centerY, s.radius - s.thickness * 0.22, s.radius + s.thickness * 0.22, -0.005);
    } else {
      const s = rollingApertureStateAtTime(c, time);
      this.annulus(0, s.x, s.y, s.radius, 40);
      this.annulus(1, s.x, s.y, s.radius, s.radius + 0.065, -0.005);
    }
  }

  dispose(): void {
    this.cinematicPistons.forEach((p) => p.dispose());
    this.cinematicPistons = [];
    this.basicPistons?.dispose();
    this.basicPistons = null;
    this.accentLight = null;
    this.containmentGate?.dispose();
    this.pulseArt?.dispose();
    this.rollingArt?.dispose();
    this.pulseArt = undefined;
    this.rollingArt = undefined;
    for (const mesh of this.parts) {
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.parts = [];
    this.group.clear();
    this.group.removeFromParent();
  }
}
