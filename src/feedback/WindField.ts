import * as THREE from 'three';

const MOTE_COUNT = 28;
const STREAK_COUNT = 10;
const CHEVRON_COUNT = 5;

/**
 * Always-readable crosswind — streak sheet + side vanes.
 * Motion can freeze under reduceMotion; direction cues stay visible.
 */
export class WindField {
  readonly group = new THREE.Group();
  private readonly motes: THREE.Mesh[] = [];
  private readonly streaks: THREE.Mesh[] = [];
  private readonly chevrons: THREE.Mesh[] = [];
  private readonly moteGeo = new THREE.PlaneGeometry(1, 1);
  private readonly streakGeo = new THREE.PlaneGeometry(1, 1);
  private readonly chevronGeo = new THREE.PlaneGeometry(1, 1);
  private readonly moteMat: THREE.ShaderMaterial;
  private readonly streakMat: THREE.ShaderMaterial;
  private readonly chevronMat: THREE.ShaderMaterial;
  private strength = 0;
  private elapsed = 0;

  constructor() {
    this.group.name = 'wind-field';
    this.moteMat = makeWindMaterial('mote');
    this.streakMat = makeWindMaterial('streak');
    this.chevronMat = makeWindMaterial('chevron');

    for (let i = 0; i < MOTE_COUNT; i++) {
      const mesh = new THREE.Mesh(this.moteGeo, this.moteMat);
      mesh.frustumCulled = false;
      mesh.userData.seed = i * 1.7;
      this.motes.push(mesh);
      this.group.add(mesh);
    }
    for (let i = 0; i < STREAK_COUNT; i++) {
      const mesh = new THREE.Mesh(this.streakGeo, this.streakMat);
      mesh.frustumCulled = false;
      mesh.userData.seed = i * 2.3;
      this.streaks.push(mesh);
      this.group.add(mesh);
    }
    for (let i = 0; i < CHEVRON_COUNT; i++) {
      const mesh = new THREE.Mesh(this.chevronGeo, this.chevronMat);
      mesh.frustumCulled = false;
      mesh.userData.lane = i;
      this.chevrons.push(mesh);
      this.group.add(mesh);
    }
    this.group.visible = false;
    this.layout();
  }

  setWind(windX: number): void {
    this.strength = windX;
    this.group.visible = Math.abs(windX) > 0.001;
    this.layout();
  }

  update(dt: number, reduceMotion: boolean): void {
    const active = Math.abs(this.strength) > 0.001;
    this.group.visible = active;
    if (!active) return;

    const intensity = Math.min(1.35, 0.45 + Math.abs(this.strength) * 2.8);
    this.moteMat.uniforms.intensity.value = intensity;
    this.streakMat.uniforms.intensity.value = intensity * 1.15;
    this.chevronMat.uniforms.intensity.value = intensity * 1.25;
    this.moteMat.uniforms.dir.value = Math.sign(this.strength) || 1;
    this.streakMat.uniforms.dir.value = Math.sign(this.strength) || 1;
    this.chevronMat.uniforms.dir.value = Math.sign(this.strength) || 1;

    if (reduceMotion) {
      // Keep cues frozen but present — wind must never go silent.
      return;
    }

    this.elapsed += dt;
    const dir = Math.sign(this.strength) || 1;
    const speed = Math.abs(this.strength) * 3.4;

    for (let i = 0; i < this.motes.length; i++) {
      const p = this.motes[i];
      const seed = p.userData.seed as number;
      let x = p.position.x + dir * speed * dt * (0.55 + (i % 5) * 0.12);
      if (x > 3.4) x = -3.4;
      if (x < -3.4) x = 3.4;
      p.position.x = x;
      p.position.y = 0.75 + ((seed * 1.3) % 4.2) + Math.sin(this.elapsed * 0.9 + seed) * 0.08;
      const pulse = 0.85 + 0.15 * Math.sin(this.elapsed * 2.1 + seed);
      p.scale.set(0.09 * pulse * dir, 0.045 * pulse, 1);
    }

    for (let i = 0; i < this.streaks.length; i++) {
      const p = this.streaks[i];
      const seed = p.userData.seed as number;
      let x = p.position.x + dir * speed * dt * (0.75 + (i % 3) * 0.18);
      if (x > 3.6) x = -3.6;
      if (x < -3.6) x = 3.6;
      p.position.x = x;
      p.position.y = 1.1 + ((seed * 0.9) % 3.6) + Math.sin(this.elapsed * 0.55 + seed) * 0.12;
      const len = 0.55 + (i % 4) * 0.12;
      p.scale.set(len * dir, 0.1 + (i % 3) * 0.02, 1);
    }

    // Chevrons pulse in place along the windward edge.
    const edgeX = dir > 0 ? -2.85 : 2.85;
    for (let i = 0; i < this.chevrons.length; i++) {
      const c = this.chevrons[i];
      const lane = c.userData.lane as number;
      c.position.x = edgeX + Math.sin(this.elapsed * 1.6 + lane) * 0.06 * dir;
      c.position.y = 1.15 + lane * 0.72;
      const pulse = 0.9 + 0.2 * Math.sin(this.elapsed * 3.2 + lane * 0.8);
      c.scale.set(0.42 * dir * pulse, 0.22 * pulse, 1);
    }
  }

  dispose(): void {
    this.moteGeo.dispose();
    this.streakGeo.dispose();
    this.chevronGeo.dispose();
    this.moteMat.dispose();
    this.streakMat.dispose();
    this.chevronMat.dispose();
    this.group.clear();
    this.motes.length = 0;
    this.streaks.length = 0;
    this.chevrons.length = 0;
  }

  private layout(): void {
    if (Math.abs(this.strength) <= 0.001) return;
    const dir = Math.sign(this.strength) || 1;
    for (let i = 0; i < this.motes.length; i++) {
      const seed = this.motes[i].userData.seed as number;
      this.motes[i].position.set(
        -3.2 + ((i * 1.17) % 6.4),
        0.75 + ((seed * 1.3) % 4.2),
        1.2 + ((i * 1.91) % 10.5),
      );
      this.motes[i].scale.set(0.08 * dir, 0.04, 1);
    }
    for (let i = 0; i < this.streaks.length; i++) {
      const seed = this.streaks[i].userData.seed as number;
      this.streaks[i].position.set(
        -3.4 + ((i * 1.55) % 6.8),
        1.1 + ((seed * 0.9) % 3.6),
        2 + ((i * 2.4) % 9),
      );
      this.streaks[i].scale.set((0.55 + (i % 4) * 0.12) * dir, 0.11, 1);
    }
    const edgeX = dir > 0 ? -2.85 : 2.85;
    for (let i = 0; i < this.chevrons.length; i++) {
      this.chevrons[i].position.set(edgeX, 1.15 + i * 0.72, 4.2 + i * 0.35);
      this.chevrons[i].scale.set(0.42 * dir, 0.22, 1);
    }
  }
}

type WindStyle = 'mote' | 'streak' | 'chevron';

function makeWindMaterial(style: WindStyle): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      intensity: { value: 1 },
      dir: { value: 1 },
      style: { value: style === 'mote' ? 0 : style === 'streak' ? 1 : 2 },
    },
    vertexShader: `
      varying vec2 tex;
      void main() {
        tex = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      precision mediump float;
      varying vec2 tex;
      uniform float intensity;
      uniform float dir;
      uniform float style;
      void main() {
        vec2 p = tex * 2.0 - 1.0;
        float alpha = 0.0;
        if (style < 0.5) {
          alpha = exp(-dot(p, p) * 4.2) * 0.55;
        } else if (style < 1.5) {
          float curve = p.y - 0.18 * sin(p.x * 3.4);
          alpha = exp(-curve * curve * 22.0) * pow(max(0.0, 1.0 - p.x * p.x), 1.6) * 0.42;
        } else {
          // Chevron / arrow head pointing with wind (+X in local when scale.x > 0).
          float body = smoothstep(0.15, 0.0, abs(p.y) - (0.55 - p.x * 0.55));
          float tip = smoothstep(0.05, -0.35, p.x);
          alpha = body * tip * 0.7;
        }
        vec3 col = mix(vec3(0.72, 0.90, 0.98), vec3(0.55, 0.82, 0.95), style * 0.25);
        gl_FragColor = vec4(col, alpha * intensity);
      }`,
  });
}
