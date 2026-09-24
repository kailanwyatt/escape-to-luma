import * as THREE from 'three';
import type { EnergyFieldConfig } from '../config/ObstacleConfig';
import { energyFieldStateAtTime } from './EnergyFieldState';

/**
 * Cinematic energy curtain — full-width flowing membrane with a drifting safe hole.
 * Opening position/radius sample EnergyFieldState; shader discards the hole.
 */
export class EnergyFieldArt {
  readonly group = new THREE.Group();
  private readonly membrane: THREE.Mesh;
  private readonly holeRing: THREE.Mesh;
  private readonly innerRing: THREE.Mesh;
  private readonly chevrons: THREE.Mesh[] = [];
  private readonly membraneMat: THREE.ShaderMaterial;
  private readonly ringMat: THREE.MeshStandardMaterial;
  private readonly chevronMat: THREE.MeshStandardMaterial;
  private readonly accent: THREE.PointLight;
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly uniforms: {
    uTime: { value: number };
    uHole: { value: THREE.Vector2 };
    uHoleR: { value: number };
    uHalf: { value: THREE.Vector2 };
  };

  constructor(private readonly config: EnergyFieldConfig) {
    this.group.name = 'energy-field-art';

    this.uniforms = {
      uTime: { value: 0 },
      uHole: { value: new THREE.Vector2(0, 0) },
      uHoleR: { value: config.holeRadius },
      uHalf: { value: new THREE.Vector2(config.halfWidth, config.halfHeight) },
    };

    this.membraneMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
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
        uniform vec2 uHole;
        uniform float uHoleR;
        uniform vec2 uHalf;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p){
          vec2 i = floor(p); vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i), b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        void main() {
          float dist = length(vLocal - uHole);
          if (dist < uHoleR) discard;
          float edge = smoothstep(uHoleR, uHoleR + 0.18, dist);
          vec2 uv = vLocal / uHalf;
          float flow = noise(uv * vec2(3.2, 1.4) + vec2(uTime * 0.55, uTime * 0.18));
          float veins = pow(0.5 + 0.5 * sin(uv.x * 18.0 + flow * 6.0 + uTime * 1.4), 10.0);
          float wash = pow(0.5 + 0.5 * sin(uv.y * 11.0 - uTime * 0.9 + flow * 4.0), 6.0);
          float rim = 1.0 - smoothstep(uHoleR, uHoleR + 0.28, dist);
          vec3 deep = vec3(0.22, 0.04, 0.38);
          vec3 bright = vec3(0.72, 0.28, 0.95);
          vec3 cyan = vec3(0.35, 0.85, 1.0);
          vec3 col = mix(deep, bright, flow * 0.65 + veins * 0.35);
          col = mix(col, cyan, rim * 0.55 + wash * 0.12);
          float alpha = (0.42 + flow * 0.28 + veins * 0.18) * edge;
          alpha = max(alpha, rim * 0.7);
          // Soft falloff near rectangle edges
          float border = min(
            1.0 - smoothstep(uHalf.x - 0.15, uHalf.x, abs(vLocal.x)),
            1.0 - smoothstep(uHalf.y - 0.15, uHalf.y, abs(vLocal.y))
          );
          gl_FragColor = vec4(col, alpha * mix(0.55, 1.0, border));
        }
      `,
    });

    const planeGeo = new THREE.PlaneGeometry(
      config.halfWidth * 2,
      config.halfHeight * 2,
      1,
      1,
    );
    this.geometries.push(planeGeo);
    this.membrane = new THREE.Mesh(planeGeo, this.membraneMat);
    this.membrane.name = 'energy-membrane';
    this.membrane.position.z = -0.02;
    this.group.add(this.membrane);

    this.ringMat = new THREE.MeshStandardMaterial({
      color: 0x7ef0ff,
      emissive: 0x2ec8e0,
      emissiveIntensity: 1.1,
      metalness: 0.1,
      roughness: 0.25,
      transparent: true,
      opacity: 0.95,
    });
    const ringGeo = new THREE.TorusGeometry(1, 0.045, 8, 48);
    this.geometries.push(ringGeo);
    this.holeRing = new THREE.Mesh(ringGeo, this.ringMat);
    this.holeRing.name = 'energy-hole-ring';
    this.group.add(this.holeRing);

    const innerMat = this.ringMat.clone();
    innerMat.emissiveIntensity = 0.55;
    innerMat.opacity = 0.55;
    const innerGeo = new THREE.TorusGeometry(1, 0.02, 6, 40);
    this.geometries.push(innerGeo);
    this.innerRing = new THREE.Mesh(innerGeo, innerMat);
    this.innerRing.name = 'energy-hole-inner';
    this.innerRing.position.z = -0.01;
    this.group.add(this.innerRing);

    this.chevronMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xb8e8ff,
      emissiveIntensity: 0.85,
      metalness: 0.05,
      roughness: 0.35,
      transparent: true,
      opacity: 0.85,
    });
    for (let i = 0; i < 3; i++) {
      const geo = new THREE.ConeGeometry(0.07, 0.14, 3);
      this.geometries.push(geo);
      const tip = new THREE.Mesh(geo, this.chevronMat);
      tip.name = `energy-chevron-${i}`;
      tip.rotation.z = -Math.PI / 2;
      this.group.add(tip);
      this.chevrons.push(tip);
    }

    this.accent = new THREE.PointLight(0x8a5cff, 14, 14, 2);
    this.accent.name = 'energy-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const state = energyFieldStateAtTime(this.config, time);
    this.group.position.set(0, 0, 0);
    this.membrane.position.set(state.centerX, state.centerY, -0.02);

    this.uniforms.uTime.value = time;
    this.uniforms.uHole.value.set(
      state.openingX - state.centerX,
      state.openingY - state.centerY,
    );
    this.uniforms.uHoleR.value = state.holeRadius;
    this.uniforms.uHalf.value.set(state.halfWidth, state.halfHeight);

    this.holeRing.position.set(state.openingX, state.openingY, -0.04);
    this.holeRing.scale.setScalar(Math.max(0.25, state.holeRadius));
    this.innerRing.position.set(state.openingX, state.openingY, -0.03);
    this.innerRing.scale.setScalar(Math.max(0.2, state.holeRadius * 0.82));

    const pulse = 0.5 + 0.5 * Math.sin(time * 2.4);
    this.ringMat.emissiveIntensity = 0.95 + pulse * 0.45;
    this.chevronMat.emissiveIntensity = 0.65 + pulse * 0.4;
    this.chevronMat.opacity = 0.55 + pulse * 0.35;

    // Chevrons trail opposite the drift direction (sheet: <<< or >>> beside opening).
    const dir = state.driftDir;
    this.chevrons.forEach((tip, i) => {
      const lag = 0.22 + i * 0.16;
      tip.position.set(
        state.openingX - dir * (state.holeRadius + 0.22 + lag),
        state.openingY + (i - 1) * 0.08,
        -0.05,
      );
      tip.rotation.z = dir > 0 ? -Math.PI / 2 : Math.PI / 2;
      tip.visible = true;
    });

    this.accent.color.setHex(0x6a90ff);
    this.accent.intensity = 11 + pulse * 6;
    this.accent.position.set(state.openingX, state.openingY, -1.15);
    this.group.userData.openingX = state.openingX;
    this.group.userData.openingY = state.openingY;
    this.group.userData.holeRadius = state.holeRadius;
    this.group.userData.driftDir = state.driftDir;
  }

  dispose() {
    for (const g of this.geometries) g.dispose();
    this.membraneMat.dispose();
    this.ringMat.dispose();
    if (this.innerRing.material instanceof THREE.Material) this.innerRing.material.dispose();
    this.chevronMat.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
