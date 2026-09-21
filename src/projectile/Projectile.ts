import * as THREE from 'three';
import type { SparkVisualState } from './SparkVisualState';
import { SparkCoreMaterial } from './SparkCoreMaterial';
import { SparkHaloMaterial } from './SparkHaloMaterial';

import { sparkVisualProfile, type SparkVisualProfile } from '../customization/sparks';
import { GAME_TUNING } from '../game/gameTuning';

export class Projectile {
  readonly position = new THREE.Vector3();
  readonly previousPosition = new THREE.Vector3();
  readonly velocity = new THREE.Vector3();
  readonly mesh = new THREE.Group();
  private readonly core: THREE.Mesh<THREE.SphereGeometry, SparkCoreMaterial>;
  private readonly glow: THREE.Mesh<THREE.SphereGeometry, SparkHaloMaterial>;
  private readonly aura: THREE.Mesh<THREE.SphereGeometry, SparkHaloMaterial>;
  private readonly pool: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private cancelReady = false;
  private entryTime: number | null = null;
  private profile: SparkVisualProfile = sparkVisualProfile({
    id: 'original',
    name: 'Original',
    acquisition: 'default',
    color: 0x7ef0ff,
    emissive: 0x1aa8b8,
    emissiveIntensity: 0.7,
    shininess: 80,
    trailWidth: 0.07,
    trailColor: 0x7ef0ff,
  });

  constructor() {
    const radius = GAME_TUNING.projectile.radius;
    this.core = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 24), new SparkCoreMaterial());
    this.core.name = 'spark-core';
    this.glow = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.7, 24, 18),new SparkHaloMaterial(0x50deff));
    this.glow.name = 'spark-inner-glow';
    this.aura = new THREE.Mesh(new THREE.SphereGeometry(radius * 3.8, 24, 18),new SparkHaloMaterial(0x28bfff));
    this.aura.name = 'spark-soft-halo';
    this.pool = new THREE.Mesh(new THREE.PlaneGeometry(1.8,1.8),new THREE.ShaderMaterial({
      uniforms: {tint: {value: new THREE.Color(0x50deff)}, strength: {value: .12}},
      vertexShader: 'varying vec2 texCoord; void main(){texCoord=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'uniform vec3 tint; uniform float strength; varying vec2 texCoord; void main(){float r=length(texCoord-.5)*2.0;float fade=pow(max(0.0,1.0-r*r),3.0);gl_FragColor=vec4(tint,strength*fade);}',
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false,
    }));
    this.pool.name = 'spark-ground-light'; this.pool.rotation.x = -Math.PI/2;
    this.mesh.add(this.pool, this.aura, this.glow, this.core);
    this.reset();
  }

  setCancelReady(ready: boolean): void {
    this.cancelReady = ready;
    this.mesh.scale.setScalar(ready ? 0.88 : 1);

  }

  applyStyle(
    style: {
      color: number;
      emissive: number;
      emissiveIntensity: number;
      shininess: number;
    },
    profile?: SparkVisualProfile,
  ): void {
    if (profile) {
      this.profile = profile;
    }
    this.core.material.color.setHex(style.color);
    this.glow.material.color.setHex(style.color);
    this.aura.material.color.setHex(style.color);
    this.pool.material.uniforms.tint.value.setHex(style.color);
  }

  beginPortalEntry(): void {this.entryTime = 0;}

  reset(): void {
    this.entryTime = null;
    const start = GAME_TUNING.projectile.startPosition;
    this.position.set(start.x, start.y, start.z);
    this.previousPosition.copy(this.position);
    this.velocity.set(0, 0, 0);
    this.syncMesh();
    this.mesh.visible = true;
    this.setCancelReady(false);
  }

  syncMesh(): void {
    this.mesh.position.copy(this.position);
  }

  updateVisual(time: number, reduceMotion: boolean, state: SparkVisualState = 'idle', hasGround = true, visualDt = 0): void {
    const energy = state === 'charge' ? 1.2 : state === 'signal' || state === 'success' ? 1.3 : state === 'collision' ? .5 : 1;
    const t = time * this.profile.pulseRate;
    // Layered, continuous oscillations make an uneven electrical heartbeat,
    // without random per-frame changes or abrupt on/off flashes.
    const surge = reduceMotion ? 0 : Math.pow(Math.max(0, Math.sin(t*2.1 + Math.sin(t*.73)*.7)),4);
    const flicker = reduceMotion ? 0 : Math.sin(t*7.3)*.025 + Math.sin(t*11.7+.8)*.015;
    const pulse = reduceMotion ? 1 : .94 + Math.sin(t*2.8)*.06 + surge*.2 + flicker;
    const activity = reduceMotion ? .12 : state === 'charge' || state === 'launch' ? .95 : .65;
    this.glow.material.setActivity(reduceMotion ? 0 : t, activity);
    this.aura.material.setActivity(reduceMotion ? 0 : t*.83, activity*.8);
    const dim = this.cancelReady ? .55 : 1;
    this.core.material.uniforms.time.value = reduceMotion ? 0 : time;
    this.core.material.uniforms.energy.value = energy * (1 + (pulse-1)*.4) * dim;
    // The physical-sized sphere remains round; only light changes size.
    this.glow.material.setStrength(.5 * energy * pulse * dim);
    this.aura.material.setStrength(.24 * energy * pulse * dim);
    const launch = state === 'launch' && !reduceMotion ? 1.12 : 1;
    this.glow.scale.setScalar((1 + (pulse-1)*.45) * launch);
    this.aura.scale.setScalar(this.profile.glowScale * (1 + (pulse-1)*.65) * (state === 'charge' ? .92 : launch));
    this.pool.visible = hasGround && this.position.y < 3;
    this.pool.position.y = (.04 - this.position.y) / this.mesh.scale.y;
    this.pool.material.uniforms.strength.value = .2 * energy * pulse * dim / (1 + this.position.y * this.position.y);
    if(this.entryTime !== null) {
      this.entryTime = Math.min(.45,this.entryTime+visualDt);
      const progress=this.entryTime/.45;
      this.mesh.scale.setScalar(Math.max(.001,1-progress*progress));
      this.mesh.position.z=this.position.z+progress*.16;
      this.core.material.uniforms.energy.value*=1+progress*.7;
      this.glow.material.setStrength(.7*(1-progress));this.aura.material.setStrength(.3*(1-progress));
      this.pool.visible=false;this.mesh.visible=progress<1;
    }
  }

  dispose(): void {
    for (const part of [this.core, this.glow, this.aura, this.pool]) {
      part.geometry.dispose(); part.material.dispose();
    }
  }
}
