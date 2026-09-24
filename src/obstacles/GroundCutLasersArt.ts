import * as THREE from 'three';
import type { GroundCutLasersConfig } from '../config/ObstacleConfig';
import { groundCutLasersStateAtTime } from './GroundCutLasersState';

const LASER_ON = 0xff3b3b;
/** Local +Z is deeper into the climb; bases sit there so shafts pitch toward the camera. */
const ORIGIN_Z = 2.55;
/** Tips cut slightly toward the camera through the play plane. */
const TIP_Z = -0.4;
const X_AXIS = new THREE.Vector3(1, 0, 0);
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

  constructor(private readonly config: GroundCutLasersConfig) {
    this.group.name = 'ground-cut-lasers-art';
    const count = Math.max(2, Math.min(6, Math.round(config.beamCount)));
    for (let i = 0; i < count; i += 1) {
      this.beams.push(this.createBeam());
      this.group.add(this.beams[i]);
    }
    this.update(0);
  }

  update(time: number) {
    const state = groundCutLasersStateAtTime(this.config, time);
    const thickness = Math.max(0.05, this.config.thickness);
    state.beams.forEach((beam, i) => {
      _origin.set(beam.ax, beam.ay, ORIGIN_Z);
      _tip.set(beam.bx, beam.by, TIP_Z);
      _dir.subVectors(_tip, _origin);
      const len = Math.max(0.01, _dir.length());
      _dir.multiplyScalar(1 / len);
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
    while (this.group.children.length) {
      const child = this.group.children.pop()!;
      this.group.remove(child);
    }
    this.beams.length = 0;
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
        uniforms: { strength: { value: 0.65 } },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        vertexShader: `varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `varying vec2 v;uniform float strength;void main(){float d=abs(v.y-.5)*2.;float a=(exp(-d*d*95.)*.95+exp(-d*d*5.)*.42)*(1.-smoothstep(.65,1.,d));gl_FragColor=vec4(1.,.055,.018,a*strength);}`,
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
