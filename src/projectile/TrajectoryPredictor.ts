import type {ShotPrediction} from '../debug/ShotDiagnostics';
import * as THREE from 'three';

import { GAME_TUNING } from '../game/gameTuning';
import { integrateMotion } from './physics';

export class TrajectoryPredictor {
  readonly dots: THREE.Mesh[] = [];
  readonly group = new THREE.Group();
  private debugFull = false;
  private readonly bounceMarkers:THREE.Mesh[]=[];
  private readonly ricochetPath:THREE.Line;
  private readonly ricochetPoints=new Float32Array(1024*3);

  constructor() {
    const pathGeometry=new THREE.BufferGeometry();pathGeometry.setAttribute('position',new THREE.BufferAttribute(this.ricochetPoints,3));
    this.ricochetPath=new THREE.Line(pathGeometry,new THREE.LineBasicMaterial({color:0x8eeeff,transparent:true,opacity:.7}));
    this.ricochetPath.visible=false;this.group.add(this.ricochetPath);
    const diamond=new THREE.OctahedronGeometry(.11);
    for(let i=0;i<2;i++){const m=new THREE.Mesh(diamond,new THREE.MeshBasicMaterial({color:0xb1ffff}));m.visible=false;this.bounceMarkers.push(m);this.group.add(m);}
    const geometry = new THREE.SphereGeometry(0.07, 10, 8);
    for (let i = 0; i < GAME_TUNING.aim.trajectoryDots; i += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: 0xd8fbff,
        transparent: true,
        opacity: 0.85 - i * 0.08,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      this.dots.push(mesh);
      this.group.add(mesh);
    }
  }

  showRicochet(prediction:ShotPrediction,full:boolean):void {
    for(const dot of this.dots)dot.visible=false;
    const points=prediction.path;
    let count=points.length;
    if(!full&&!this.debugFull&&prediction.bounces?.length){
      const first=prediction.bounces[0].point;const i=points.findIndex(p=>p.x===first.x&&p.y===first.y&&p.z===first.z);
      if(i>=0)count=Math.min(count,i+9);
    }
    count=Math.min(count,1024);
    for(let i=0;i<count;i++){this.ricochetPoints[i*3]=points[i].x;this.ricochetPoints[i*3+1]=points[i].y;this.ricochetPoints[i*3+2]=points[i].z;}
    this.ricochetPath.geometry.setDrawRange(0,count);this.ricochetPath.geometry.attributes.position.needsUpdate=true;
    this.ricochetPath.frustumCulled=false;this.ricochetPath.visible=true;
    // Solid sampled curve keeps shared geometry fixed; bounce diamonds show the turns.
    for(let i=0;i<2;i++){const bounce=prediction.bounces?.[i];this.bounceMarkers[i].visible=Boolean(bounce)&&(i===0||full||this.debugFull);if(bounce)this.bounceMarkers[i].position.set(bounce.point.x,bounce.point.y,bounce.point.z);}
  }

  setVisible(visible: boolean): void {
    this.group.visible = visible;
    for (const dot of this.dots) {
      dot.visible = visible && !this.ricochetPath.visible;
    }
  }

  setDebugFull(enabled: boolean): void {
    this.debugFull = enabled;
    for (const [index, dot] of this.dots.entries()) {
      const material = dot.material as THREE.MeshBasicMaterial;
      material.color.setHex(enabled ? 0xfff4c2 : 0xd8fbff);
      material.opacity = enabled ? 0.9 - index * 0.04 : 0.85 - index * 0.08;
    }
  }

  setFaded(faded: boolean): void {
    this.group.visible = !faded;
    for (const [index, dot] of this.dots.entries()) {
      const material = dot.material as THREE.MeshBasicMaterial;
      material.opacity = faded ? 0 : 0.85 - index * 0.08;
      dot.visible = !faded;
    }
  }

  update(
    start: THREE.Vector3,
    velocity: { vx: number; vy: number; vz: number },
    endZ = GAME_TUNING.target.z,
    options?: {
      windX?: number;
      gravityScale?: number;
      wells?: { x: number; y: number; z: number; strength: number; radius: number }[];
    },
  ): void {
    this.ricochetPath.visible=false;for(const marker of this.bounceMarkers)marker.visible=false;
    const count = this.dots.length;
    const travelZ = Math.max(0.5, endZ - start.z);
    const tEnd =
      (velocity.vz <= 0.001 ? 1 : travelZ / velocity.vz) *
      (this.debugFull ? 1 : GAME_TUNING.aim.trajectoryFraction);

    const state = {
      x: start.x,
      y: start.y,
      z: start.z,
      vx: velocity.vx,
      vy: velocity.vy,
      vz: velocity.vz,
    };
    const steps = count * 4;
    const dt = tEnd / steps;
    let dotIndex = 0;
    for (let step = 1; step <= steps; step += 1) {
      integrateMotion(state, dt, options);
      if (step % 4 === 0 && dotIndex < count) {
        this.dots[dotIndex].position.set(state.x, state.y, state.z);
        dotIndex += 1;
      }
    }
    while (dotIndex < count) {
      this.dots[dotIndex].position.set(state.x, state.y, state.z);
      dotIndex += 1;
    }
  }
}
