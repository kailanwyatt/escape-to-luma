import * as THREE from 'three';
import type { RollingApertureConfig } from '../config/ObstacleConfig';
import { rollingApertureStateAtTime } from './ExtendedLibraryState';
import { FacilityArtKit } from './FacilityArtKit';

const SEGMENTS = 96;

/**
 * Cinematic rolling aperture (upper-atmosphere drift hole).
 * Hole radius/position sample rollingApertureStateAtTime; plate fills the rest.
 */
export class CinematicRollingApertureArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly surface: THREE.Mesh;
  private readonly litEdge: THREE.Mesh;
  private readonly hardware: THREE.Group;
  private readonly lamps: THREE.MeshStandardMaterial[] = [];
  private readonly ownedMaterials: THREE.Material[] = [];
  private readonly accent: THREE.PointLight;
  private readonly surfaceTime = { value: 0 };
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly fieldMat: THREE.ShaderMaterial;

  constructor(private readonly config: RollingApertureConfig) {
    this.group.name = 'cinematic-rolling-aperture';
    const armor = this.kit.metal(0x455868, 0.3);
    const steel = this.kit.metal(0xb0c0cb, 0.2);
    const dark = this.kit.metal(0x0c141c, 0.62, false);
    const lamp = this.kit.lamp();
    this.lamps.push(lamp);
    const lampCore = this.kit.lampCore();
    this.lamps.push(lampCore);

    this.fieldMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: { fieldTime: this.surfaceTime },
      vertexShader:
        'varying vec2 p; void main(){p=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:
        'varying vec2 p;uniform float fieldTime; void main(){float r=length(p);float angle=atan(p.y,p.x);float grid=smoothstep(.955,.99,fract(r*2.8));float spoke=smoothstep(.98,1.,fract(angle*12.));float charge=pow(.5+.5*sin(r*16.-fieldTime*1.4+sin(angle*8.)),10.); gl_FragColor=vec4(mix(vec3(.035,.085,.13),vec3(.18,.43,.55),max(grid,spoke)) + vec3(.025,.08,.12)*charge,.46+grid*.13+charge*.08);}',
    });
    this.ownedMaterials.push(this.fieldMat);

    const surfaceGeo = new THREE.RingGeometry(1, 2, SEGMENTS);
    this.geometries.push(surfaceGeo);
    this.surface = new THREE.Mesh(surfaceGeo, this.fieldMat);
    this.surface.name = 'danger-surface';
    this.surface.frustumCulled = false;
    this.group.add(this.surface);

    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0x9de9ff,
      emissive: 0x4aa7c9,
      emissiveIntensity: 0.85,
      metalness: 0.15,
      roughness: 0.28,
      side: THREE.DoubleSide,
    });
    this.ownedMaterials.push(edgeMat);
    const edgeGeo = new THREE.RingGeometry(1, 2, SEGMENTS);
    this.geometries.push(edgeGeo);
    this.litEdge = new THREE.Mesh(edgeGeo, edgeMat);
    this.litEdge.name = 'lit-edge';
    this.litEdge.frustumCulled = false;
    this.group.add(this.litEdge);

    this.hardware = new THREE.Group();
    this.hardware.name = 'aperture-hardware';
    this.group.add(this.hardware);
    // Unit-radius hardware; scaled with opening like airborne gate.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const pod = new THREE.Group();
      pod.rotation.z = a;
      this.hardware.add(pod);
      this.kit.box(pod, `roll-pod-${i}`, 0.28, 0.2, 0.22, 1.12, 0, 0.02, dark, 0.01);
      this.kit.box(pod, `roll-armor-${i}`, 0.22, 0.16, 0.18, 1.14, 0, -0.02, armor, 0.01);
      this.kit.box(pod, `roll-steel-${i}`, 0.16, 0.12, 0.03, 1.14, 0, -0.12, steel, 0.004);
      this.kit.box(pod, `roll-lamp-${i}`, 0.1, 0.07, 0.02, 1.14, 0, -0.14, lamp, 0.003);
      this.kit.box(pod, `roll-core-${i}`, 0.05, 0.035, 0.012, 1.14, 0, -0.155, lampCore, 0);
    }
    // Thin collar just outside the safe hole.
    const collarGeo = new THREE.TorusGeometry(1.04, 0.035, 8, 48);
    this.geometries.push(collarGeo);
    const collar = new THREE.Mesh(collarGeo, steel);
    collar.name = 'aperture-collar';
    collar.position.z = -0.08;
    this.hardware.add(collar);

    this.accent = new THREE.PointLight(0xffb449, 9, 10, 2);
    this.accent.name = 'rolling-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  private annulus(mesh: THREE.Mesh, x: number, y: number, inner: number, outer: number, z = 0) {
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

  update(time: number) {
    this.surfaceTime.value = time;
    const s = rollingApertureStateAtTime(this.config, time);
    this.annulus(this.surface, s.x, s.y, s.radius, 40);
    this.annulus(this.litEdge, s.x, s.y, s.radius, s.radius + 0.065, -0.005);
    this.hardware.position.set(s.x, s.y, 0);
    this.hardware.scale.setScalar(s.radius);

    const openFrac =
      (s.radius - this.config.minRadius) /
      Math.max(1e-6, this.config.maxRadius - this.config.minRadius);
    const color = openFrac > 0.65 ? 0x70e5ed : openFrac < 0.35 ? 0xff7562 : 0xffb449;
    for (const lamp of this.lamps) {
      lamp.color.setHex(color);
      lamp.emissive.setHex(color);
      lamp.emissiveIntensity = 0.85 + openFrac * 0.35;
    }
    this.accent.color.setHex(color);
    this.accent.intensity = 7 + openFrac * 5;
    this.accent.position.set(s.x, s.y, -1.05);
    this.group.userData.radius = s.radius;
  }

  dispose() {
    this.kit.dispose();
    this.ownedMaterials.forEach((m) => m.dispose());
    this.geometries.forEach((g) => g.dispose());
    this.group.clear();
    this.group.removeFromParent();
  }
}
