import {createContainmentVessel} from './ContainmentVessel';
import {VESSEL} from '../obstacles/BreachBoundary';
import * as THREE from 'three';
import { GAME_TUNING } from '../game/gameTuning';
import { sampleOpening, sampleOpeningChoreography } from './OpeningSequence';

/** Scene-owned, bounded procedural actors. Never changes projectile physics. */
export class OpeningScene {
  readonly group = new THREE.Group();
  private readonly probe = new THREE.Group();
  private readonly transferMaterial = new THREE.ShaderMaterial({
    uniforms: { opacity: { value: 0 } },
    vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: 'uniform float opacity; void main() { gl_FragColor = vec4(0.015, 0.025, 0.035, opacity); }',
    transparent: true, depthTest: false, depthWrite: false,
  });
  private readonly transfer = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.transferMaterial);
  private readonly scanner: THREE.Mesh;
  private readonly signal: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  private readonly field: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial>;
  private readonly shutters: THREE.Mesh[] = [];
  private readonly stars = new THREE.Group();
  private readonly fragments = new THREE.Group();
  private readonly fractureMaterial = new THREE.MeshBasicMaterial({ color: 0xb3f0ff, transparent: true, opacity: .55, depthWrite: false });
  private breach = { x: 0, y: 3, z: 5.75, width: 1.72, height: 2.65 };
  private readonly vessel = createContainmentVessel();
  private readonly from = new THREE.Vector3(2.4, 2.2, -4.8);
  private readonly to = new THREE.Vector3();
  constructor() {
    const metal = new THREE.MeshPhongMaterial({ color: 0x243747, shininess: 70 });
    const cyan = new THREE.MeshBasicMaterial({ color: 0x70efff });
    const panel = new THREE.MeshPhongMaterial({ color: 0x172c57, emissive: 0x071225 });
    const box = (parent: THREE.Group, w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z); parent.add(mesh); return mesh;
    };
    box(this.probe, .8, .65, 1.2, 0, 0, 0, metal);
    box(this.probe, 3.8, .04, .08, 0, 0, 0, metal);
    for (const side of [-1, 1]) {
      box(this.probe, 1.2, .06, 1.8, side * 1.4, 0, 0, panel);
      for (let i = 0; i < 4; i++) box(this.probe, 1.2, .012, .018, side * 1.4, .04, -.65 + i * .43, cyan);
    }
    box(this.probe, .04, .7, .04, 0, .6, 0, metal);
    this.scanner = new THREE.Mesh(new THREE.ConeGeometry(.65, 2, 24, 1, true), new THREE.MeshBasicMaterial({color: 0x63ebff, transparent: true, opacity: .12, depthWrite: false, side: THREE.DoubleSide}));
    this.scanner.rotation.x = Math.PI / 2; this.scanner.position.z = -1.5;
    this.probe.add(this.scanner);
    for (const z of [-.65, -1.1]) {
      const chamber = new THREE.Mesh(new THREE.TorusGeometry(.5, .05, 8, 32), metal);
      chamber.position.z = z; this.probe.add(chamber);
    }
    const starPositions = new Float32Array(70 * 3);
    for (let i = 0; i < 70; i++) {
      starPositions.set([Math.sin(i * 127.1) * 13, Math.cos(i * 83.7) * 10, 8 + (i % 9)], i * 3);
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    this.stars.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({color: 0x8db5c7, size: .035})));
    const fragmentGeometry = new THREE.TetrahedronGeometry(.1);
    for (let i = 0; i < 12; i++) {
      const shard = new THREE.Mesh(fragmentGeometry, this.fractureMaterial);
      shard.name = `breach-fragment-${i}`;
      this.fragments.add(shard);
    }
    this.fragments.name = 'opening-fragments';
    for (const side of [-1, 1]) {
      const shutter = box(this.probe, .4, .8, .08, side * .7, 0, -1.15, metal);
      this.shutters.push(shutter);
    }
    this.signal = new THREE.Mesh(new THREE.TorusGeometry(1, .012, 6, 48), new THREE.MeshBasicMaterial({color: 0x9df6ff, transparent: true, opacity: 0, depthWrite: false}));
    this.signal.position.set(0, .6, -.12);
    this.field = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.25, 6, 32, 1, true), new THREE.MeshBasicMaterial({color: 0x4cd9ed, transparent: true, opacity: .055, depthWrite: false, side: THREE.DoubleSide}));
    this.field.scale.set(1.1, 1, 3.25);
    this.field.position.set(0, 3, -1.9);
    this.group.add(this.probe, this.stars, this.vessel, this.signal, this.field, this.fragments);
    this.transfer.frustumCulled = false;
    this.transfer.renderOrder = 1000;
    this.transfer.name = 'location-transfer';
    this.group.add(this.transfer);
    this.group.visible = false;
  }
  sample(elapsed: number, camera: THREE.PerspectiveCamera, reduceMotion: boolean): boolean {
    const {stage, progress} = sampleOpening(elapsed);
    const choreography = sampleOpeningChoreography(elapsed, reduceMotion);
    this.transfer.visible = choreography.transferOpacity > 0;
    this.transferMaterial.uniforms.opacity.value = choreography.transferOpacity;
    const space = stage < 2;
    this.group.visible = true;
    this.stars.visible = space; this.probe.visible = stage === 1; this.vessel.visible = !space;
    this.probe.position.set(0, .6, 5 - choreography.approach * 3.85);
    this.scanner.scale.setScalar(.7 + choreography.approach * .3);
    (this.scanner.material as THREE.MeshBasicMaterial).opacity = .12 * (1 - choreography.capture);
    this.shutters.forEach((shutter, i) => { shutter.position.x = (i === 0 ? -1 : 1) * (.7 - choreography.capture * .5); });
    this.signal.visible = stage === 3;
    this.signal.scale.setScalar(reduceMotion ? .8 : .5 + progress * 3);
    this.signal.material.opacity = reduceMotion ? .18 : Math.sin(progress * Math.PI) * .45;
    this.field.visible = stage === 2 || stage === 3 || stage === 4;
    this.field.material.color.setHex(stage === 4 ? 0xff9855 : 0x4cd9ed);
    this.field.material.opacity = stage === 4 ? .055 * (1 - progress) : .055;
    this.fragments.visible = stage === 4 && !reduceMotion;
    this.fractureMaterial.opacity = .55 * (1 - progress);
    this.fragments.children.forEach((shard, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      shard.position.set(
        this.breach.x + side * (this.breach.width / 2 + .15 + progress * (1 + (i % 3) * .2)),
        this.breach.y + (i / 11 - .5) * this.breach.height - progress * progress * 1.4,
        this.breach.z - .1 - progress * .6,
      );
      shard.rotation.set(progress * (i + 1), i * .7 + progress, i);
      shard.scale.set(.5, 1 + (i % 3) * .4, .2);
    });
    const handoff = stage === 5 ? (reduceMotion ? 1 : progress * progress * (3 - 2 * progress)) : 0;
    const p = GAME_TUNING.camera.position;
    this.to.set(p[0], p[1], p[2]);
    camera.position.copy(this.from).lerp(this.to, handoff);
    const target = GAME_TUNING.camera.lookAt;
    camera.lookAt(target[0] * handoff, .6 + (target[1] - .6) * handoff, target[2] * handoff);
    return space;
  }
  setBreach(breach: { x: number; y: number; z: number; width: number; height: number }): void {
    this.breach = breach;
    this.vessel.position.z = breach.z - VESSEL.frontZ;
  }

  showPlayableVessel(): void {
    this.group.visible = true; this.stars.visible = false; this.probe.visible = false; this.vessel.visible = true; this.signal.visible = false; this.field.visible = false; this.fragments.visible = false; this.transfer.visible = false;
  }
  hide(): void { this.group.visible = false; }
}
