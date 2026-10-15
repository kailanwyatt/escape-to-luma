import { batchOpeningMeshes } from '../scene/batchOpeningMeshes';
import { disposeThreeObject } from '../utils/disposeThree';
import * as THREE from 'three';
import type { GroundCutLasersConfig } from '../config/ObstacleConfig';
import { groundCutLasersStateAtTime } from './GroundCutLasersState';

const LASER_ON = 0xff3b3b;
/** Local +Z is deeper into the climb; bases sit there so shafts pitch toward the camera. */
const ORIGIN_Z = 2.55;
/** Tips cut slightly toward the camera through the play plane. */
const TIP_Z = -0.4;
const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const _origin = new THREE.Vector3();
const _tip = new THREE.Vector3();
const _dir = new THREE.Vector3();

/**
 * Ground cutters — same beam language as early-world laserGrid, pitched in 3D
 * from below/off-screen up through the climb corridor.
 */
export class GroundCutLasersArt {
  readonly group = new THREE.Group();
  private readonly beams: THREE.Group[] = [];
  private readonly emitters: THREE.Group[] = [];
  private readonly spill = new THREE.PointLight(0xff5729, 8, 14, 2);
  private readonly heatTime = { value: 0 };

  constructor(private readonly config: GroundCutLasersConfig) {
    this.group.name = 'ground-cut-lasers-art';
    const count = Math.max(2, Math.min(6, Math.round(config.beamCount)));
    for (let i = 0; i < count; i += 1) {
      this.beams.push(this.createBeam());
      this.group.add(this.beams[i]);
      const emitter = this.createEmitter(); this.emitters.push(emitter); this.group.add(emitter);
    }
    this.spill.name = 'cutter-environment-spill'; this.group.add(this.spill);
    this.update(0);
  }

  update(time: number) {
    const state = groundCutLasersStateAtTime(this.config, time);
    this.heatTime.value = time;
    this.spill.position.set(this.config.centerX, this.config.floorY + 1.4, ORIGIN_Z - .5);
    this.spill.intensity = 8 + state.crossAmount * 6;
    const thickness = Math.max(0.05, this.config.thickness);
    state.beams.forEach((beam, i) => {
      _origin.set(beam.ax, beam.ay, ORIGIN_Z);
      _tip.set(beam.bx, beam.by, TIP_Z);
      _dir.subVectors(_tip, _origin);
      const len = Math.max(0.01, _dir.length());
      _dir.multiplyScalar(1 / len);
      const emitter = this.emitters[i]; emitter.position.copy(_origin);
      emitter.quaternion.setFromUnitVectors(Y_AXIS, _dir);
      const root = this.beams[i];
      root.position.lerpVectors(_origin, _tip, 0.5);
      root.quaternion.setFromUnitVectors(X_AXIS, _dir);
      // Length on X; square cross-section so the shaft reads in 3D like laserGrid bars.
      root.scale.set(len, thickness * 2, thickness * 2);
      const halo = root.getObjectByName('BeamHalo') as THREE.Mesh;
      (halo.material as THREE.ShaderMaterial).uniforms.strength.value =
        0.55 + state.crossAmount * 0.25;
    });
  }

  dispose() {
    disposeThreeObject(this.group); this.group.clear(); this.beams.length = 0; this.emitters.length = 0; this.group.removeFromParent();
  }

  private createEmitter(): THREE.Group {
    const root = new THREE.Group(); root.name = 'ground-cutter-projector';
    const casing = new THREE.MeshStandardMaterial({ color: 0x35404b, metalness: .72, roughness: .4 });
    const copper = new THREE.MeshStandardMaterial({ color: 0xad7754, metalness: .65, roughness: .33 });
    const lens = new THREE.MeshBasicMaterial({ color: 0xffbc85 });
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.22, .34, .75, 12), casing); barrel.position.y = -.25; root.add(barrel);
    const finGeo = new THREE.BoxGeometry(.08, .6, .34);
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const fin = new THREE.Mesh(finGeo, copper); fin.position.set(Math.cos(a) * .28, -.3, Math.sin(a) * .28); fin.rotation.y = -a; root.add(fin); }
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.2, .045, 8, 24), copper); rim.rotation.x = Math.PI / 2; rim.position.y = .12; root.add(rim);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .05, 16), lens); core.position.y = .14; root.add(core);
    const bloom = new THREE.Mesh(new THREE.SphereGeometry(.4, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff5525, transparent: true, opacity: .09, depthWrite: false, blending: THREE.AdditiveBlending })); root.add(bloom);
    batchOpeningMeshes(root);
    return root;
  }

  private createBeam(): THREE.Group {
    const root = new THREE.Group();
    root.name = 'ground-cut-beam';
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({
        color: LASER_ON,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      }),
    );
    body.name = 'cut-body';
    // Keep the collision-thin silhouette; scale.z supplies the 3D thickness at runtime.
    body.scale.set(1, 1, 0.35);
    root.add(body);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({
        uniforms: { strength: { value: 0.65 }, time: this.heatTime },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        vertexShader: `varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `varying vec2 v;uniform float strength,time;void main(){float heat=sin(v.x*72.-time*8.)*.028*(1.-v.x);float d=abs(v.y-.5+heat)*2.;float a=(exp(-d*d*95.)*.95+exp(-d*d*5.)*.42)*(1.-smoothstep(.65,1.,d));gl_FragColor=vec4(1.,.055,.018,a*strength);}`,
      }),
    );
    glow.name = 'BeamHalo';
    glow.position.z = 0;
    glow.scale.set(1, 4.5, 1);
    root.add(glow);
    // Second halo rotated so the wash reads from multiple 3D angles.
    const glowB = glow.clone();
    glowB.name = 'BeamHaloB';
    glowB.rotation.x = Math.PI / 2;
    root.add(glowB);
    const core = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0xffece0, toneMapped: false }),
    );
    core.name = 'HotCore';
    core.scale.set(1, 0.24, 0.24);
    root.add(core);
    return root;
  }
}
