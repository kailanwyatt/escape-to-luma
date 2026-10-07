import * as THREE from 'three';

import { GAME_TUNING } from '../../game/gameTuning';
import { createWorldBackdrop } from '../../graphics/WorldBackdrop';
import { VESSEL } from '../../obstacles/BreachBoundary';
import { createContainmentVessel } from '../../scene/ContainmentVessel';
import { createOpeningProbe } from '../../scene/OpeningProbe';
import { sampleOpening, sampleOpeningChoreography } from '../../scene/OpeningSequence';
import { Projectile } from '../../projectile/Projectile';
import { sparkVisualProfile, type SparkDefinition } from '../../customization/sparks';

type Breach = { x: number; y: number; z: number; width: number; height: number };

const CYAN = 0x8fefff;
const AMBER = 0xffa45e;

/**
 * Dev-only treatment for the real Three.js campaign opening. It shares the
 * opening beat clock and camera handoff, but owns separate render-only meshes.
 */
export class OpeningSceneV2 {
  readonly group = new THREE.Group();

  private readonly backdrop = createWorldBackdrop('opening');
  private readonly stars = new THREE.Group();
  private readonly probe = createOpeningProbe();
  private readonly vessel = createContainmentVessel();
  private readonly spark = new Projectile();
  private readonly coreLight = new THREE.PointLight(0x8fefff, 0, 9);
  private readonly scanMaterial: THREE.ShaderMaterial;
  private readonly scan: THREE.Mesh<THREE.ConeGeometry, THREE.ShaderMaterial>;
  private readonly captureRings = new THREE.Group();
  private readonly signalRings = new THREE.Group();
  private readonly field: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial>;
  private readonly shards = new THREE.Group();
  private readonly fracture = new THREE.Group();
  private readonly fractureMaterial = new THREE.LineBasicMaterial({
    color: 0xe5fbff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  private readonly fractureLines: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  private readonly shockwave: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  private readonly breachFlash = new THREE.PointLight(0xcffaff, 0, 13);
  private readonly shardMaterial = new THREE.MeshBasicMaterial({
    color: 0xbff5ff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  private readonly starMaterial: THREE.ShaderMaterial;
  private readonly transferMaterial: THREE.ShaderMaterial;
  private readonly transfer: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private readonly cameraPosition = new THREE.Vector3();
  private readonly cameraTarget = new THREE.Vector3();
  private readonly handoffPosition = new THREE.Vector3();
  private readonly handoffTarget = new THREE.Vector3();
  private sparkColor = CYAN;
  private readonly labSparkPosition = new THREE.Vector3(0, 3.12, 0.5);
  private readonly launchSparkPosition = new THREE.Vector3(
    GAME_TUNING.projectile.startPosition.x,
    GAME_TUNING.projectile.startPosition.y,
    GAME_TUNING.projectile.startPosition.z,
  );
  private breach: Breach = { x: 0, y: 3, z: 5.75, width: 1.72, height: 2.65 };

  constructor() {
    this.group.name = 'opening-scene-v2-demo';
    this.group.add(this.backdrop);

    this.starMaterial = createStarMaterial();
    this.stars.add(createStarField(this.starMaterial));
    this.group.add(this.stars);

    this.probe.name = 'opening-v2-probe';
    this.probe.rotation.y = Math.PI;
    this.group.add(this.probe);

    this.spark.mesh.name = 'opening-v2-spark';
    this.spark.mesh.add(this.coreLight);
    this.group.add(this.spark.mesh);

    this.scanMaterial = new THREE.ShaderMaterial({
      uniforms: { opacity: { value: 0 }, time: { value: 0 } },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform float opacity; uniform float time; varying vec2 vUv; void main(){ float edge=pow(sin(vUv.y*3.14159),2.); float scan=.72+.28*sin(vUv.y*22.-time*6.); gl_FragColor=vec4(.24,.9,1.,opacity*edge*scan); }`,
    });
    this.scan = new THREE.Mesh(new THREE.ConeGeometry(1.1, 5.2, 32, 1, true), this.scanMaterial);
    this.scan.rotation.x = Math.PI / 2;
    this.scan.position.set(0, 0.66, 1.2);
    this.probe.add(this.scan);

    for (let i = 0; i < 3; i += 1) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.48 + i * 0.16, 0.012, 6, 48),
        new THREE.MeshBasicMaterial({ color: i === 2 ? 0xffcc7a : CYAN, transparent: true, opacity: 0, depthWrite: false }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.name = `capture-ring-${i}`;
      this.captureRings.add(ring);
    }
    this.captureRings.position.copy(this.spark.position);
    this.group.add(this.captureRings);

    for (let i = 0; i < 4; i += 1) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.55 + i * 0.31, 0.013, 6, 56),
        new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0, depthWrite: false }),
      );
      ring.rotation.set(Math.PI / 2 + i * 0.28, i * 0.72, 0);
      ring.name = `signal-ring-${i}`;
      this.signalRings.add(ring);
    }
    this.signalRings.position.set(0, 3.12, 0.5);
    this.group.add(this.signalRings);

    this.field = new THREE.Mesh(
      new THREE.CylinderGeometry(2.35, 2.35, 6.2, 36, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x42cde9,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.field.scale.set(1.07, 1, 3.1);
    this.field.position.set(0, 3.05, -1.8);
    this.group.add(this.field);

    this.vessel.name = 'opening-v2-vessel';
    this.group.add(this.vessel);
    for (let index = 0; index < 54; index += 1) {
      const shard = new THREE.Mesh(new THREE.TetrahedronGeometry(0.11), this.shardMaterial);
      shard.name = `opening-v2-shard-${index}`;
      this.shards.add(shard);
    }
    this.group.add(this.shards);
    this.fractureLines = new THREE.LineSegments(createFractureGeometry(), this.fractureMaterial);
    this.fractureLines.name = 'opening-v2-fracture-lines';
    this.shockwave = new THREE.Mesh(
      new THREE.RingGeometry(0.24, 0.29, 64),
      new THREE.MeshBasicMaterial({
        color: 0xeaffff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.shockwave.name = 'opening-v2-breach-shockwave';
    this.fracture.add(this.fractureLines, this.shockwave, this.breachFlash);
    this.group.add(this.fracture);
    this.setBreach(this.breach);

    this.transferMaterial = new THREE.ShaderMaterial({
      uniforms: { opacity: { value: 0 }, warmth: { value: 0 } },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      vertexShader: `void main(){ gl_Position=vec4(position.xy,0.,1.); }`,
      fragmentShader: `uniform float opacity; uniform float warmth; void main(){ vec3 cold=vec3(.015,.075,.11); vec3 hot=vec3(.18,.045,.018); gl_FragColor=vec4(mix(cold,hot,warmth),opacity); }`,
    });
    this.transfer = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.transferMaterial);
    this.transfer.frustumCulled = false;
    this.transfer.renderOrder = 1000;
    this.group.add(this.transfer);
    this.group.visible = false;
  }

  sample(elapsed: number, camera: THREE.PerspectiveCamera, reduceMotion: boolean): boolean {
    const { stage, progress } = sampleOpening(elapsed);
    const choreography = sampleOpeningChoreography(elapsed, reduceMotion);
    const time = elapsed;
    const smooth = reduceMotion ? 1 : progress * progress * (3 - 2 * progress);
    const space = stage < 2;
    const pulse = reduceMotion ? 0.7 : 0.58 + Math.sin(time * 3.8) * 0.24;

    this.group.visible = true;
    this.backdrop.visible = space;
    this.stars.visible = space;
    this.starMaterial.uniforms.time.value = time;
    this.probe.visible = stage === 1;
    this.vessel.visible = !space;
    if (stage < 2) {
      this.spark.position.set(0, 0.65, 0);
    } else if (stage === 5) {
      this.spark.position.copy(this.launchSparkPosition);
    } else {
      this.spark.position.copy(this.labSparkPosition);
    }
    this.spark.syncMesh();
    this.spark.mesh.visible = true;
    this.spark.updateVisual(time, reduceMotion, stage === 3 ? 'signal' : 'idle', stage >= 2);
    this.spark.mesh.scale.setScalar(
      reduceMotion || stage === 5 ? 1 : stage === 3 ? 1.24 + pulse * 0.2 : stage === 4 ? 1.12 + pulse * 0.12 : 1,
    );
    this.coreLight.intensity = stage < 2 ? 4.2 + pulse * 3.6 : stage === 4 ? 10.5 + pulse * 8.5 : 8.5 + pulse * 7;
    this.coreLight.color.setHex(this.sparkColor);

    this.probe.position.set(0.35 * Math.sin(time * 0.43), 0.66 + Math.sin(time * 0.65) * 0.08, 5.35 - choreography.approach * 4.05);
    this.probe.rotation.z = Math.sin(time * 0.5) * 0.045;
    this.scanMaterial.uniforms.time.value = time;
    this.scanMaterial.uniforms.opacity.value = stage === 1 ? (reduceMotion ? 0.13 : 0.12 + choreography.approach * 0.2) : 0;

    this.captureRings.position.copy(this.spark.position);
    this.captureRings.children.forEach((child, index) => {
      const ring = child as THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
      const capture = stage === 1 ? choreography.capture : 0;
      ring.material.opacity = capture ? (0.32 - index * 0.06) * (1 - capture * 0.25) : 0;
      const scale = 1 + capture * (1.9 + index * 0.34);
      ring.scale.setScalar(scale);
      ring.rotation.z = time * (index % 2 === 0 ? 0.6 : -0.5);
    });

    this.signalRings.visible = stage === 3;
    this.signalRings.children.forEach((child, index) => {
      const ring = child as THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
      const travel = reduceMotion ? 0.82 : Math.min(1, progress * 1.24 + index * 0.08);
      ring.scale.setScalar(0.56 + travel * (1.25 + index * 0.18));
      ring.material.opacity = reduceMotion ? 0.18 : Math.sin(Math.min(1, travel) * Math.PI) * (0.43 - index * 0.055);
      ring.rotation.z += 0.008 * (index % 2 === 0 ? 1 : -1);
    });

    this.field.visible = stage >= 2 && stage <= 4;
    this.field.material.color.setHex(stage === 4 ? AMBER : CYAN);
    this.field.material.opacity = stage === 4 ? (reduceMotion ? 0.05 : 0.09 * (1 - smooth)) : stage === 3 ? 0.09 + pulse * 0.05 : 0.055;
    this.field.scale.x = 1.06 + (stage === 3 && !reduceMotion ? pulse * 0.06 : 0);
    this.field.scale.z = 3.1 + (stage === 3 && !reduceMotion ? pulse * 0.12 : 0);

    const shattering = stage === 4 ? smooth : stage === 5 ? 1 + smooth * 1.45 : 0;
    const debrisOpacity = stage === 4 ? 0.96 * (0.35 + smooth * 0.65) : stage === 5 ? 0.82 * (1 - smooth) : 0;
    this.fracture.visible = shattering > 0;
    this.fractureMaterial.opacity = stage === 4 ? 0.95 * (1 - smooth * 0.45) : stage === 5 ? 0.52 * (1 - smooth) : 0;
    this.shockwave.material.opacity = stage === 4 ? 0.72 * (1 - smooth * 0.45) : stage === 5 ? 0.34 * (1 - smooth) : 0;
    this.shockwave.material.color.setHex(stage === 4 ? AMBER : CYAN);
    this.shockwave.scale.setScalar(0.6 + shattering * 7.4);
    this.breachFlash.color.setHex(stage === 4 ? 0xffd2a0 : CYAN);
    this.breachFlash.intensity = stage === 4 ? 8.5 * (1 - smooth * 0.42) : stage === 5 ? 4.2 * (1 - smooth) : 0;

    this.shards.visible = shattering > 0 && !reduceMotion;
    this.shardMaterial.opacity = reduceMotion ? 0 : debrisOpacity;
    this.shards.children.forEach((child, index) => {
      const shard = child as THREE.Mesh;
      const angle = index * 2.39996;
      const radius = this.breach.width * (0.18 + (index % 7) * 0.065) + shattering * (0.95 + (index % 5) * 0.31);
      shard.position.set(
        this.breach.x + Math.cos(angle) * radius,
        this.breach.y + Math.sin(angle) * this.breach.height * (0.18 + (index % 5) * 0.1) - shattering * shattering * (1.2 + (index % 3) * 0.32),
        this.breach.z - 0.12 - shattering * (0.5 + (index % 5) * 0.19),
      );
      shard.rotation.set(time * (1.1 + index * 0.1), angle + shattering * 3.2, index * 0.37);
      const shardScale = 0.42 + (index % 4) * 0.19;
      shard.scale.set(shardScale, shardScale * 1.8, shardScale * 0.42);
    });

    this.transferMaterial.uniforms.opacity.value = choreography.transferOpacity;
    this.transferMaterial.uniforms.warmth.value = stage >= 4 ? 1 : 0;
    this.transfer.visible = choreography.transferOpacity > 0;

    this.sampleCamera(stage, smooth, reduceMotion, camera);
    return space;
  }

  setSparkLook(spark: SparkDefinition): void {
    this.sparkColor = spark.color;
    this.spark.applyStyle(
      {
        color: spark.color,
        emissive: spark.emissive,
        emissiveIntensity: spark.emissiveIntensity,
        shininess: spark.shininess,
      },
      sparkVisualProfile(spark),
    );
    this.coreLight.color.setHex(spark.color);
    this.captureRings.children.forEach((child) => {
      (child as THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>).material.color.setHex(spark.color);
    });
    this.signalRings.children.forEach((child) => {
      (child as THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>).material.color.setHex(spark.emissive);
    });
  }

  setBreach(breach: Breach): void {
    this.breach = breach;
    this.vessel.position.z = breach.z - VESSEL.frontZ;
    this.fracture.position.set(breach.x, breach.y, breach.z - 0.1);
    this.fracture.scale.set(breach.width / 2, breach.height / 2, 1);
  }

  hide(): void {
    this.group.visible = false;
  }

  private sampleCamera(stage: number, progress: number, reduceMotion: boolean, camera: THREE.PerspectiveCamera): void {
    if (stage === 0) {
      this.cameraPosition.set(-0.85, 1.15, 8.3);
      this.cameraTarget.set(0, 0.52, 0);
    } else if (stage === 1) {
      this.cameraPosition.set(1.9 - progress * 0.65, 1.35, 6.8 - progress * 1.15);
      this.cameraTarget.set(0, 0.64, 0.18);
    } else if (stage === 2) {
      this.cameraPosition.set(2.55, 3.4, -5.85);
      this.cameraTarget.set(0, 3.08, 0.62);
    } else if (stage === 3) {
      this.cameraPosition.set(1.8, 3.28, -6.3);
      this.cameraTarget.set(0, 3.12, 0.5);
    } else if (stage === 4) {
      this.cameraPosition.set(1.15 - progress * 0.42, 3.05, -7.2);
      this.cameraTarget.set(this.breach.x, this.breach.y, this.breach.z);
    } else {
      this.cameraPosition.set(1.35, 3.05, -6.65);
      this.cameraTarget.set(0, 2.8, 5.3);
      this.handoffPosition.set(...GAME_TUNING.camera.position);
      this.handoffTarget.set(...GAME_TUNING.camera.lookAt);
      const handoff = reduceMotion ? 1 : progress * progress * (3 - 2 * progress);
      this.cameraPosition.lerp(this.handoffPosition, handoff);
      this.cameraTarget.lerp(this.handoffTarget, handoff);
    }
    camera.position.copy(this.cameraPosition);
    camera.lookAt(this.cameraTarget);
  }
}

function createStarField(material: THREE.ShaderMaterial): THREE.Points {
  const count = 420;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    const theta = index * 2.3999632297;
    const radius = 7 + ((index * 47) % 190) / 7;
    positions[index * 3] = Math.cos(theta) * radius;
    positions[index * 3 + 1] = Math.sin(theta * 1.63) * (4.5 + (index % 9) * 0.7);
    positions[index * 3 + 2] = 11 + (index % 31);
    sizes[index] = 1 + (index % 5) * 0.48;
    phases[index] = (index % 29) * 0.37;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  const stars = new THREE.Points(geometry, material);
  stars.name = 'opening-v2-star-depth';
  return stars;
}

function createStarMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aSize; attribute float aPhase; uniform float time; varying float vGlow; void main(){ vec4 view=modelViewMatrix*vec4(position,1.); vGlow=.45+.55*sin(time*.85+aPhase); gl_PointSize=aSize*(1.2+vGlow*1.8); gl_Position=projectionMatrix*view; }`,
    fragmentShader: `varying float vGlow; void main(){ float d=length(gl_PointCoord-vec2(.5)); float alpha=(1.-smoothstep(.08,.5,d))*(.24+.48*vGlow); gl_FragColor=vec4(.62,.86,1.,alpha); }`,
  });
}

function createFractureGeometry(): THREE.BufferGeometry {
  const points: number[] = [];
  for (let index = 0; index < 38; index += 1) {
    const angle = index * 2.3999632297;
    const inner = 0.04 + (index % 4) * 0.025;
    const outer = 0.48 + (index % 7) * 0.075;
    const bend = angle + (index % 2 === 0 ? 0.12 : -0.12);
    points.push(
      Math.cos(angle) * inner, Math.sin(angle) * inner, 0,
      Math.cos(bend) * outer * 0.58, Math.sin(bend) * outer * 0.58, 0,
      Math.cos(bend) * outer * 0.58, Math.sin(bend) * outer * 0.58, 0,
      Math.cos(angle) * outer, Math.sin(angle) * outer, 0,
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return geometry;
}
