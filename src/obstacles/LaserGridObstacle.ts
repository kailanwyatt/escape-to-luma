import * as THREE from 'three';
import {disposeThreeObject} from '../utils/disposeThree';

import type { EnvironmentId } from '../config/ChallengeConfig';
import type { LaserGridConfig } from '../config/ObstacleConfig';
import { GAME_TUNING } from '../game/gameTuning';
import {
  evaluateLaserCollision,
  lasersOnAt,
  type LaserBeam,
  type ObstacleCollisionResult,
} from './ObstacleCollision';
import { laserBeamsAtTime } from './LaserGridAnimation';
import {
  emptyPredictedState,
  type ObstacleDebugInfo,
  type ObstaclePredictedState,
} from './GameplayObstacle';
import { interpolateAtZ } from './SlidingGateObstacle';

const LASER_ON = 0xff3b3b;
const LASER_OFF = 0x4a2020;

export class LaserGridObstacle {
  readonly id: string;
  readonly type = 'laserGrid' as const;
  readonly group = new THREE.Group();
  z = GAME_TUNING.rotor.z;
  active = false;
  lasersOn = true;
  private readonly fixedFrame = new THREE.Group();
  private readonly laserLayer = new THREE.Group();
  private config: LaserGridConfig | null = null;
  private beams: LaserBeam[] = [];
  private meshes: THREE.Mesh[] = [];
  private elapsed = 0;
  private emitters: THREE.Group[][] = [];

  constructor(id: string) {
    this.id = id;
    this.fixedFrame.name = 'FixedFrame';
    this.laserLayer.name = 'Lasers';
    this.group.add(this.fixedFrame, this.laserLayer);
    this.group.visible = false;
  }

  applyConfig(config: LaserGridConfig, environment: EnvironmentId): void {
    this.config = config;
    this.active = true;
    this.group.visible = true;
    this.z = config.z;
    this.elapsed = 0;
    this.clearMeshes();
    this.buildFixedFrame(config, environment);

    this.beams = laserBeamsAtTime(config, 0);

    for (const beam of this.beams) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 0.012),
        new THREE.MeshBasicMaterial({
          color: LASER_ON,
          transparent: true,
          opacity: 0.95,
          depthWrite: false,
        }),
      );
      mesh.name = `LaserBeam${this.meshes.length + 1}`;
      // Symmetric falloff leaves the collision-width red envelope centered on the beam.
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.ShaderMaterial({
        uniforms:{vertical:{value:beam.orientation==='vertical'?1:0},strength:{value:1}},
        transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false,
        vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`varying vec2 v;uniform float vertical;uniform float strength;void main(){float d=abs(mix(v.y,v.x,vertical)-.5)*2.;float a=(exp(-d*d*95.)*.95+exp(-d*d*5.)*.42)*(1.-smoothstep(.65,1.,d));gl_FragColor=vec4(1.,.055,.018,a*strength);}`
      }));
      glow.name='BeamHalo';glow.position.z=-.018;
      glow.scale.set(beam.orientation==='vertical'?10:1,beam.orientation==='vertical'?1:10,1);mesh.add(glow);
      const core=new THREE.Mesh(new THREE.BoxGeometry(1,1,.008),new THREE.MeshBasicMaterial({color:0xffece0,toneMapped:false}));
      core.name='HotCore';core.scale.set(beam.orientation==='vertical'?.24:1,beam.orientation==='vertical'?1:.24,1);core.position.z=-.012;mesh.add(core);
      const pair=[this.createEmitter(),this.createEmitter()];
      this.emitters.push(pair);this.group.add(...pair);
      this.laserLayer.add(mesh);
      this.meshes.push(mesh);
    }

    // The obstacle root and frame are fixed. Only beam child positions change.
    this.group.position.set(0, 0, config.z);
    this.update(0, 0);
  }

  hide(): void {
    this.active = false;
    this.group.visible = false;
    this.config = null;
    this.beams = [];
    this.clearMeshes();
    this.clearGroup(this.fixedFrame);
  }

  update(_dt: number, elapsedTime: number): void {
    if (!this.active || !this.config) {
      return;
    }
    this.elapsed = elapsedTime;
    this.lasersOn = this.lasersActiveAt(elapsedTime);
    this.beams = laserBeamsAtTime(this.config, elapsedTime);
    this.syncBeamMeshes(this.beams, this.lasersOn, elapsedTime);
  }

  testProjectileCrossing(
    previous: THREE.Vector3,
    current: THREE.Vector3,
    projectileRadius: number,
    currentSimulationTime = this.elapsed,
    stepSeconds = 0,
  ): ObstacleCollisionResult | null {
    if (!this.active || !this.config || previous.z >= this.z || current.z < this.z) {
      return null;
    }
    const at = interpolateAtZ(previous, current, this.z);
    const span = current.z - previous.z;
    const crossingFraction = span === 0 ? 1 : (this.z - previous.z) / span;
    const crossingTime =
      currentSimulationTime - stepSeconds + stepSeconds * crossingFraction;
    const beams = laserBeamsAtTime(this.config, crossingTime);
    return evaluateLaserCollision(
      at.x,
      at.y,
      projectileRadius,
      beams,
      this.lasersActiveAt(crossingTime),
    );
  }

  predictState(deltaSeconds: number, simTime: number): ObstaclePredictedState {
    const predicted = emptyPredictedState(this.type, this.z);
    if (!this.config) {
      return predicted;
    }
    const futureTime = simTime + deltaSeconds;
    const centerX = this.config.centerX ?? 0;
    const centerY = this.config.centerY ?? 3;
    predicted.x = centerX;
    predicted.y = centerY;
    predicted.openingX = centerX;
    predicted.openingY = centerY;
    predicted.openingWidth = this.config.spacing;
    predicted.openingHeight = this.config.spacing;
    predicted.openingRadius = this.lasersActiveAt(futureTime) ? 0 : 99;
    // Laser arrival time is carried for evaluateAt and debug ghost beams.
    predicted.angle = futureTime;
    return predicted;
  }

  evaluateAt(
    x: number,
    y: number,
    projectileRadius: number,
    predicted: ObstaclePredictedState,
  ): ObstacleCollisionResult {
    if (!this.config) {
      return { hit: null, nearMiss: false, clearance: 1 };
    }
    const beams = laserBeamsAtTime(this.config, predicted.angle);
    return evaluateLaserCollision(
      x,
      y,
      projectileRadius,
      beams,
      this.lasersActiveAt(predicted.angle),
    );
  }

  getDebugInfo(): ObstacleDebugInfo {
    const predicted = this.predictState(0, this.elapsed);
    let horizontal = 0;
    let vertical = 0;
    const positions = this.beams.map((beam) => {
      if (beam.orientation === 'horizontal') {
        horizontal += 1;
        return `H${horizontal} Y:${beam.position.toFixed(2)}`;
      }
      vertical += 1;
      return `V${vertical} X:${beam.position.toFixed(2)}`;
    });
    return {
      ...predicted,
      speed: this.config?.speed ?? 0,
      extra: `LASER GRID Z:${this.z.toFixed(2)} ${positions.join(' ')}`,
    };
  }

  beamsAtTime(elapsedTime: number): LaserBeam[] {
    return this.config ? laserBeamsAtTime(this.config, elapsedTime) : [];
  }

  private lasersActiveAt(elapsedTime: number): boolean {
    if (!this.config || (this.config.mode ?? 'static') === 'static') {
      return true;
    }
    return lasersOnAt(
      elapsedTime,
      this.config.pulseSpeed ?? 0.7,
      this.config.phase ?? 0,
      this.config.onRatio ?? 0.55,
    );
  }

  private syncBeamMeshes(
    beams: LaserBeam[],
    on: boolean,
    elapsedTime: number,
  ): void {
    const config = this.config;
    if (!config) {
      return;
    }
    for (let index=0;index<this.meshes.length;index++) {
      const mesh=this.meshes[index],beam=beams[index];mesh.visible=Boolean(beam);
      if(!beam)continue;
      const vertical=beam.orientation==='vertical';
      mesh.scale.set(vertical?config.thickness*2:config.span,vertical?config.span:config.thickness*2,1);
      mesh.position.set(vertical?beam.position:beam.centerX,vertical?beam.centerY:beam.position,0);
      const material=mesh.material as THREE.MeshBasicMaterial;
      material.color.setHex(on?LASER_ON:LASER_OFF);material.opacity=on?.12:.04;
      mesh.getObjectByName('HotCore')!.visible=on;
      (mesh.getObjectByName('BeamHalo') as THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>).material.uniforms.strength.value=on?1:0;
      this.emitters[index].forEach((emitter,j)=>{
        const sign=j===0?-1:1;
        emitter.position.set(vertical?beam.position:beam.centerX+sign*(config.span/2+.08),vertical?beam.centerY+sign*(config.span/2+.08):beam.position,0);
        emitter.rotation.z=vertical?Math.PI/2:0;
        const lens=emitter.getObjectByName('EmitterLens') as THREE.Mesh<THREE.SphereGeometry,THREE.MeshBasicMaterial>;
        lens.material.color.setHex(on?0xffae8c:0x476b72);
        emitter.getObjectByName('ContactFlare')!.visible=on;
      });
    }
  }

  private createEmitter():THREE.Group {
    const root=new THREE.Group();root.name='LaserEmitter';
    const steel=new THREE.MeshPhongMaterial({color:0x536578,shininess:65});
    const body=new THREE.Mesh(new THREE.BoxGeometry(.25,.31,.3),steel);root.add(body);
    const face=new THREE.Mesh(new THREE.BoxGeometry(.2,.23,.04),new THREE.MeshPhongMaterial({color:0x121f2c}));face.position.z=-.17;root.add(face);
    const lens=new THREE.Mesh(new THREE.SphereGeometry(.065,12,8),new THREE.MeshBasicMaterial({color:0xffae8c,toneMapped:false}));lens.name='EmitterLens';lens.position.z=-.2;root.add(lens);
    const flare=new THREE.Mesh(new THREE.PlaneGeometry(.9,.9),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false,
      vertexShader:`varying vec2 v;void main(){v=uv-.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`varying vec2 v;void main(){float r=length(v);float a=exp(-r*r*60.)*.65+exp(-abs(v.x)*95.-abs(v.y)*12.)*.2;gl_FragColor=vec4(1.,.13,.035,a*(1.-smoothstep(.3,.5,r)));}`
    }));flare.name='ContactFlare';flare.position.z=-.22;root.add(flare);
    for(const y of [-.11,.11]){const fin=new THREE.Mesh(new THREE.BoxGeometry(.32,.035,.22),steel);fin.position.set(0,y,.015);root.add(fin);}
    return root;
  }

  private buildFixedFrame(
    config: LaserGridConfig,
    environment: EnvironmentId,
  ): void {
    this.clearGroup(this.fixedFrame);
    const centerX = config.centerX ?? 0;
    const centerY = config.centerY ?? 3;
    const frameSpan = config.span + 0.32;
    const postWidth = 0.24;
    const color =
      environment === 'space' ? 0x2a3c50 : environment === 'rooftop' ? 0x667b89 : 0x1c2836;
    const material = new THREE.MeshPhongMaterial({
      color,
      shininess: 65,
    });
    const verticalGeometry = new THREE.BoxGeometry(postWidth, frameSpan, 0.3);
    const half = frameSpan / 2;

    const left = new THREE.Mesh(verticalGeometry, material);
    left.name = 'FixedLeftPost';
    left.position.set(centerX - half, centerY, 0);
    const right = left.clone();
    right.name = 'FixedRightPost';
    right.position.x = centerX + half;
    const horizontal=this.beamsForFrame(config,'horizontal');
    const vertical=this.beamsForFrame(config,'vertical');
    if(horizontal)this.fixedFrame.add(left,right);
    else {verticalGeometry.dispose();material.dispose();}
    if(vertical){
      const railMaterial=new THREE.MeshPhongMaterial({color,shininess:65});
      for(const side of [-1,1]){
        const rail=new THREE.Mesh(new THREE.BoxGeometry(frameSpan,postWidth,.3),railMaterial);
        rail.name=side<0?'FixedBottomPost':'FixedTopPost';rail.position.set(centerX,centerY+side*half,0);this.fixedFrame.add(rail);
      }
    }
    for(const rail of this.fixedFrame.children){
      const isVertical=rail.name==='FixedLeftPost'||rail.name==='FixedRightPost';
      const channel=new THREE.Mesh(new THREE.BoxGeometry(isVertical?.055:frameSpan-.2,isVertical?frameSpan-.2:.055,.02),new THREE.MeshBasicMaterial({color:0x718494}));
      channel.position.z=-.16;rail.add(channel);
      for(const sign of [-1,1]){
        const cap=new THREE.Mesh(new THREE.BoxGeometry(isVertical?.34:.24,isVertical?.24:.34,.38),new THREE.MeshPhongMaterial({color:0x263647}));
        cap.position.set(isVertical?0:sign*(half-.12),isVertical?sign*(half-.12):0,0);rail.add(cap);
      }
    }
  }

  private beamsForFrame(config:LaserGridConfig,orientation:LaserBeam['orientation']):boolean {
    return laserBeamsAtTime(config,0).some(beam=>beam.orientation===orientation);
  }

  private clearMeshes(): void {
    for(const pair of this.emitters)for(const emitter of pair){this.group.remove(emitter);disposeThreeObject(emitter);}
    this.emitters=[];
    for (const mesh of this.meshes) {
      this.laserLayer.remove(mesh);
      mesh.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) {
          return;
        }
        object.geometry.dispose();
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        for (const material of materials) {
          material.dispose();
        }
      });
    }
    this.meshes = [];
  }

  private clearGroup(group: THREE.Group): void {
    disposeThreeObject(group);group.clear();
  }
}
