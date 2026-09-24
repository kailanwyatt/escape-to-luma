import * as THREE from 'three';
import {FacilityArtKit} from './FacilityArtKit';
import {spaceFinish,ringVolume,type SpaceFinish} from './SpaceSurfaceArt';
import type { LibraryObstacleConfig } from './LibraryObstacle';
import type { StoryLibraryConfig } from './StoryLibraryObstacle';
import { FacilityElevatorArt } from './FacilityElevatorArt';
import { FacilityElevatorArtV1 } from './legacy/FacilityElevatorArtV1';
import { ELEVATOR_VISUAL_VARIANT } from './ElevatorVisualVariant';
import { FacilityShutterArt } from './FacilityShutterArt';
import { FacilityShutterArtV1 } from './legacy/FacilityShutterArtV1';
import { SHUTTER_VISUAL_VARIANT } from './ShutterVisualVariant';
import { CaptureDroneArt } from './CaptureDroneArt';
import { CaptureDroneArtV1 } from './legacy/CaptureDroneArtV1';
import { DRONE_VISUAL_VARIANT } from './DroneVisualVariant';
import { FacilityClockArt } from './FacilityClockArt';
import { FacilityClockArtV1 } from './legacy/FacilityClockArtV1';
import { CLOCK_VISUAL_VARIANT } from './ClockVisualVariant';
import { FacilityScissorArt } from './FacilityScissorArt';
import { SCISSOR_VISUAL_VARIANT } from './ScissorVisualVariant';
import { BillboardFlipArt } from './BillboardFlipArt';
import { DockingCollarArt } from './DockingCollarArt';
import { ShearLaneArt } from './ShearLaneArt';
import { GroundCutLasersArt } from './GroundCutLasersArt';
import { RotatingGateArt } from './RotatingGateArt';
import { EnergyFieldArt } from './EnergyFieldArt';
import { PhaseGateArt } from './PhaseGateArt';
import { RepulsorArt } from './RepulsorArt';
import { NullTendrilArt } from './NullTendrilArt';
import { NullLashArt } from './NullLashArt';
import { TheNullArt } from './TheNullArt';
import { FalseEntryArt } from './FalseEntryArt';
import { scissorGateStateAtTime } from './ScissorGateState';
import { speedFieldStateAtTime } from './SpeedFieldState';
import { corkscrewStateAtTime, cometCrossingStateAtTime } from './ExtendedLibraryState';
import { orbitingMoonsAtTime, beaconPulseStateAtTime, sequentialTunnelAtTime, movingSafeZoneHoleAtTime, accretionDebrisAtTime, pulsarBeamOn, solarSailAngle, solarSailOpen, teleportPortalPoseAtTime } from './StoryLibraryState';

type Config = LibraryObstacleConfig | StoryLibraryConfig;
type Part = THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial | THREE.MeshStandardMaterial>;
const N = 128;

/** Primitive visual kit. No state, collision, launch or prediction decisions live here. */
export class LibraryWorldArt {
  readonly group = new THREE.Group();
  private parts = new Map<string, Part>();
  private readonly finishes=new FacilityArtKit();
  private readonly surfaceTime={value:0};
  private elevator?: FacilityElevatorArt | FacilityElevatorArtV1;
  private shutter?: FacilityShutterArt | FacilityShutterArtV1;
  private drones?: CaptureDroneArt | CaptureDroneArtV1;
  private clock?: FacilityClockArt | FacilityClockArtV1;
  private scissor?: FacilityScissorArt;
  private billboard?: BillboardFlipArt;
  private docking?: DockingCollarArt;
  private shear?: ShearLaneArt;
  private groundCuts?: GroundCutLasersArt;
  private rotatingGate?: RotatingGateArt;
  private energyField?: EnergyFieldArt;
  private phaseGate?: PhaseGateArt;
  private repulsor?: RepulsorArt;
  private nullTendril?: NullTendrilArt;
  private nullLash?: NullLashArt;
  private theNull?: TheNullArt;
  private falseEntry?: FalseEntryArt;
  constructor(private c: Config) {
    this.group.name = `world-art-${c.type}`;
    if(c.type==='clockHands'){
      this.clock =
        CLOCK_VISUAL_VARIANT === 'legacy' ? new FacilityClockArtV1(c) : new FacilityClockArt(c);
      this.group.add(this.clock.group);
    }
    if(c.type==='conveyorGate'){
      this.drones =
        DRONE_VISUAL_VARIANT === 'legacy' ? new CaptureDroneArtV1(c) : new CaptureDroneArt(c);
      this.group.add(this.drones.group);
    }
    if(c.type==='elevatorBlocks'){
      this.elevator =
        ELEVATOR_VISUAL_VARIANT === 'legacy' ? new FacilityElevatorArtV1(c) : new FacilityElevatorArt(c);
      this.group.add(this.elevator.group);
    }
    if(c.type==='splitShutter'){
      this.shutter =
        SHUTTER_VISUAL_VARIANT === 'legacy' ? new FacilityShutterArtV1(c) : new FacilityShutterArt(c);
      this.group.add(this.shutter.group);
    }
    if(c.type==='scissorGate' && SCISSOR_VISUAL_VARIANT === 'cinematic'){
      this.scissor=new FacilityScissorArt(c);
      this.group.add(this.scissor.group);
    }
    if(c.type==='groundCutLasers'){
      this.groundCuts=new GroundCutLasersArt(c);
      this.group.add(this.groundCuts.group);
    }
    if(c.type==='billboardFlip'){
      this.billboard=new BillboardFlipArt(c);
      this.group.add(this.billboard.group);
    }
    if(c.type==='dockingCollar'){
      this.docking=new DockingCollarArt(c);
      this.group.add(this.docking.group);
    }
    if(c.type==='shearLane'){
      this.shear=new ShearLaneArt(c);
      this.group.add(this.shear.group);
    }
    if(c.type==='rotatingGate'){
      this.rotatingGate=new RotatingGateArt(c);
      this.group.add(this.rotatingGate.group);
    }
    if(c.type==='energyField'){
      this.energyField=new EnergyFieldArt(c);
      this.group.add(this.energyField.group);
    }
    if(c.type==='phaseGate'){
      this.phaseGate=new PhaseGateArt(c);
      this.group.add(this.phaseGate.group);
    }
    if(c.type==='repulsor'){
      this.repulsor=new RepulsorArt(c);
      this.group.add(this.repulsor.group);
    }
    if(c.type==='nullTendril'){
      this.nullTendril=new NullTendrilArt(c);
      this.group.add(this.nullTendril.group);
    }
    if(c.type==='nullLash'){
      this.nullLash=new NullLashArt(c);
      this.group.add(this.nullLash.group);
    }
    if(c.type==='theNull'){
      this.theNull=new TheNullArt(c);
      this.group.add(this.theNull.group);
    }
    if(c.type==='entryExitPortal'){
      this.falseEntry=new FalseEntryArt(c);
      this.group.add(this.falseEntry.group);
    }
    this.update(0);
  }
  private part(id: string, color: number, shape: 'box' | 'sphere' | 'ring' = 'box'): Part {
    const found = this.parts.get(id); if (found) { found.material.color.setHex(color); return found; }
    const geometry = shape === 'sphere' ? new THREE.SphereGeometry(1, 24, 16) : shape === 'ring' ? ringVolume(N) : new THREE.BoxGeometry(1, 1, 1);
    const metal=/pincer|transit|derelict|port-|sealed|vane-|solar-panel|cell-|anchor-|entry-wall|relay-|portal-frame|portal-lip|conduit-|dish-|wreck-/.test(id);
    const material=metal||shape==='sphere'?this.finishes.metal(color,shape==='sphere'?.3:.4):new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide});
    material.side=THREE.DoubleSide;
    if(material instanceof THREE.MeshStandardMaterial&&/lumen|hinge-eye/.test(id)){
      material.emissive.setHex(color);material.emissiveIntensity=.65;material.metalness=.15;
    }
    const finish:SpaceFinish|undefined=id==='darkness'?'void':id==='vane-panel'||id==='solar-panel'?'solar':id==='current'?'current':id.startsWith('radiation')?'radiation':id==='sheath'||id==='dish-arc'||id==='wreck-field'||id==='damaged-field'?'magnetic':id.startsWith('calm-')?'calm':id.startsWith('ice-core')?'ice':id.startsWith('rock-shard')?'organic':id.startsWith('portal-')||id==='next-anchor'||id==='relay-seal'?undefined:shape==='ring'?'relay':undefined;
    if(finish)spaceFinish(material,finish,this.surfaceTime);
    const m: Part = new THREE.Mesh(geometry, material);
    m.name = id; m.frustumCulled = false; this.parts.set(id, m); this.group.add(m); return m;
  }
  private box(id: string, x: number, y: number, w: number, h: number, color: number, z = 0, angle = 0, opacity = 1): Part {
    const m = this.part(id, color); m.position.set(x,y,z); m.scale.set(w,h,/pincer|vane-panel|solar-panel|sealed/.test(id)?.16:.08); m.rotation.z=angle;
    this.opacity(m,opacity); return m;
  }
  private opacity(m: Part, value: number) { m.material.opacity=value; m.material.transparent=value<1; m.material.depthWrite=value===1; }
  /** Soft additive glow beam — outer wash + hot core, laser-grid style. */
  private laserBeam(
    id: string,
    ax: number,
    ay: number,
    bx: number,
    by: number,
    halfWidth: number,
    color: number,
    opacity: number,
  ) {
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const len = Math.hypot(bx - ax, by - ay);
    const angle = Math.atan2(by - ay, bx - ax);
    const glow = this.part(`${id}-glow`, color);
    glow.position.set(mx, my, -0.05);
    glow.scale.set(len, halfWidth * 4.2, 0.02);
    glow.rotation.z = angle;
    if (glow.material instanceof THREE.MeshBasicMaterial) {
      glow.material.transparent = true;
      glow.material.depthWrite = false;
      glow.material.blending = THREE.AdditiveBlending;
      glow.material.opacity = opacity * 0.45;
    }
    const mid = this.part(`${id}-beam`, color);
    mid.position.set(mx, my, -0.03);
    mid.scale.set(len, halfWidth * 1.6, 0.02);
    mid.rotation.z = angle;
    if (mid.material instanceof THREE.MeshBasicMaterial) {
      mid.material.transparent = true;
      mid.material.depthWrite = false;
      mid.material.blending = THREE.AdditiveBlending;
      mid.material.opacity = opacity * 0.85;
    }
    const core = this.part(`${id}-core`, 0xfff6e8);
    core.position.set(mx, my, -0.01);
    core.scale.set(len, halfWidth * 0.45, 0.02);
    core.rotation.z = angle;
    if (core.material instanceof THREE.MeshBasicMaterial) {
      core.material.transparent = true;
      core.material.depthWrite = false;
      core.material.blending = THREE.AdditiveBlending;
      core.material.opacity = Math.min(1, opacity * 1.05);
    }
    const visible = opacity > 0.05;
    glow.visible = visible;
    mid.visible = visible;
    core.visible = visible;
  }
  private ball(id: string,x:number,y:number,r:number,color:number,z=0):Part {
    const m=this.part(id,color,'sphere');m.position.set(x,y,z);m.scale.set(r,r,r*.65);return m;
  }
  private ring(id:string,x:number,y:number,inner:number,outer:number,color:number,start=0,span=Math.PI*2,z=0,opacity=1,outerX=x,outerY=y):Part {
    const m=this.part(id,color,'ring');const p=m.geometry.getAttribute('position') as THREE.BufferAttribute;
    for(let row=0;row<4;row++)for(let j=0;j<=N;j++){
      const isInner=row%2===0,a=start+j/N*span,r=isInner?inner:outer;
      p.setXYZ(row*(N+1)+j,Math.cos(a)*r+(isInner?0:outerX-x),Math.sin(a)*r+(isInner?0:outerY-y),row<2?0:.12);
    }
    p.needsUpdate=true;m.geometry.computeVertexNormals();m.position.set(x,y,z);this.opacity(m,opacity);return m;
  }
  private capsule(id:string,ax:number,ay:number,bx:number,by:number,r:number,color:number) {
    const a=Math.atan2(by-ay,bx-ax),length=Math.hypot(bx-ax,by-ay);
    this.box(id,(ax+bx)/2,(ay+by)/2,length,2*r,color,0,a);
    this.ball(id+'-a',ax,ay,r,color);this.ball(id+'-b',bx,by,r,color);
    this.box(id+'-trace',(ax+bx)/2,(ay+by)/2,length*.88,r*.35,0xffbb62,-.09,a);
    for(const u of [.20,.80]){
      const x=ax+(bx-ax)*u,y=ay+(by-ay)*u;
      this.box(id+'-collar-'+u,x,y,r*.75,r*1.85,0x627c8c,-.025,a);
    }
  }
  private creature(id:string,x:number,y:number,r:number,kind:'drone'|'rock'|'ice') {
    if(kind==='ice'){
      this.ball(id,x,y,r,0x91bbcf);
      for(let i=0;i<3;i++){
        const a=i*Math.PI*2/3;
        this.ball(id+'-crystal-'+i,x+Math.cos(a)*r*.45,y+Math.sin(a)*r*.45,r*.20,0xc5eaf0,-r*.62);
      }
      return;
    }
    if(kind==='rock'){
      this.ball(id,x,y,r,0x6a737c);
      for(let i=0;i<3;i++){
        const a=i*Math.PI*2/3+.2;
        this.ball(id+'-facet-'+i,x+Math.cos(a)*r*.32,y+Math.sin(a)*r*.32,r*.34,0x4e585f,-r*.4);
      }
      this.ball(id+'-glint',x,y,r*.12,0xc9d4dc,-r*.72);
      return;
    }
    const color=0x647f96;
    this.ball(id,x,y,r,color);
    this.ball(id+'-face',x,y,r*.73,0x172c3d,-r*.45);
    this.ball(id+'-eye',x,y,r*.26,0xffba55,-r*.89);
    this.box(id+'-visor',x,y,r*1.45,r*.18,0xffcd78,-r*.90);
    this.box(id+'-vent',x,y-r*.36,r*.65,r*.12,0xacc6d4,-r*.72);
  }
  update(t:number):void {
    this.surfaceTime.value=t;
    const c=this.c;
    switch(c.type){
      case 'elevatorBlocks':
        this.elevator?.update(t);break;
      case 'splitShutter':this.shutter?.update(t);break;
      case 'clockHands':this.clock?.update(t);break;
      case 'scissorGate':
        if(this.scissor){this.scissor.update(t);break;}
        {
        const s=scissorGateStateAtTime(c,t);
        s.bars.forEach((b,i)=>this.capsule('pincer-'+i,b.ax,b.ay,b.bx,b.by,c.barThickness,0xa5bac3));
        this.ball('hinge-eye',s.centerX,s.centerY,c.barThickness*.85,0xffc36b,-.13);break;}
      case 'groundCutLasers':
        this.groundCuts?.update(t);
        break;
      case 'conveyorGate':this.drones?.update(t);break;
      case 'billboardFlip':this.billboard?.update(t);break;
      case 'dockingCollar':this.docking?.update(t);break;
      case 'shearLane':this.shear?.update(t);break;
      case 'rotatingGate':this.rotatingGate?.update(t);break;
      case 'energyField':this.energyField?.update(t);break;
      case 'phaseGate':this.phaseGate?.update(t);break;
      case 'repulsor':this.repulsor?.update(t);break;
      case 'nullTendril':this.nullTendril?.update(t);break;
      case 'nullLash':this.nullLash?.update(t);break;
      case 'theNull':this.theNull?.update(t);break;
      case 'entryExitPortal':this.falseEntry?.update(t);break;
      case 'cometCrossing':{
        const s=cometCrossingStateAtTime(c,t);this.creature('ice-core',s.x,s.y,s.radius,'ice');
        // Ghost-thin wake, never a solid extra obstacle.
        const a=Math.atan2(c.endY-c.startY,c.endX-c.startX);
        for(let i=0;i<4;i++)this.box('wake-'+i,s.x-Math.cos(a)*s.radius*(1+i*.7),s.y-Math.sin(a)*s.radius*(1+i*.7),s.radius*.9,s.radius*(.36-i*.07),0xa5def5,.3,a,.15-i*.03);break;}
      case 'corkscrewTunnel':{
        const s=corkscrewStateAtTime(c,t),start=s.gapAngle+s.gapWidth/2,span=Math.PI*2-s.gapWidth;
        // Solid bore through the hub — only the timed sector is open.
        const bore=Math.max(0.08,s.innerRadius*0.35);
        this.ring('conduit-wall',s.centerX,s.centerY,bore,s.radius,0x3d5163,start,span);
        this.ball('conduit-hub',s.centerX,s.centerY,s.innerRadius,0x2a3848,-.02);
        this.ring('conduit-collar',s.centerX,s.centerY,s.innerRadius,s.innerRadius+.07,0x7ec8e0,0,Math.PI*2,-.01);
        this.ring('conduit-rim',s.centerX,s.centerY,s.radius-.06,s.radius,0xd4b07a,start,span,-.01);
        for(let i=0;i<5;i++){
          const a=start+((i+.35)/5)*span;
          this.box('helix-ridge-'+i,s.centerX+Math.cos(a)*(bore+s.radius)/2,s.centerY+Math.sin(a)*(bore+s.radius)/2,.04,(s.radius-bore)*.7,0x9bb0bf,-.04,a);
        }
        // Cyan lips mark the safe sector edges.
        for(const side of [-1,1] as const){
          const a=s.gapAngle+side*s.gapWidth/2;
          this.box(
            'gap-lip-'+side,
            s.centerX+Math.cos(a)*(bore+s.radius)/2,
            s.centerY+Math.sin(a)*(bore+s.radius)/2,
            .05,
            (s.radius-bore)*.85,
            0x7ce8ff,
            -.06,
            a+Math.PI/2,
            .7,
          );
        }
        break;}
      case 'speedField':{
        const s=speedFieldStateAtTime(c,t);this.box('current',s.centerX,s.centerY,s.width,s.height,0x399abc,0,0,.17);
        for(const side of [-1,1])this.box('edge-'+side,s.centerX+side*s.width/2,s.centerY,.025,s.height,0x8fdaed,-.02,0,.55);
        for(let i=0;i<7;i++){
          const u=((t*.28+i/7)%1+1)%1;
          this.box('flow-'+i,s.centerX+(i%3-1)*s.width*.29,s.centerY+(u-.5)*s.height,.018,.22,0xb7f5ff,-.03,0,.45);
        }break;}
      case 'orbitingMoons':{
        const hub=c.hubRadius??0;
        if(hub>0)this.ball('relay-hub',c.centerX,c.centerY,hub,0xffb449,-.06);
        const moons=orbitingMoonsAtTime(c,t);
        const pulse=beaconPulseStateAtTime(c,t);
        moons.forEach((b,i)=>this.creature('relay-beacon-'+i,b.x,b.y,b.radius,'drone'));
        if(c.beaconPulse){
          const color=pulse.warning?0xffb449:pulse.phase==='firing'?0xff6a55:0x70e5ed;
          moons.forEach((b,i)=>{
            if(c.beaconPulse!.kind==='shockwave'){
              const r=pulse.phase==='firing'
                ? b.radius+c.beaconPulse!.range*pulse.fraction
                : pulse.warning?b.radius+0.08:b.radius+0.04;
              const thick=c.beaconPulse!.thickness??0.16;
              const ring=this.ring('beacon-shock-'+i,b.x,b.y,Math.max(0.05,r-thick/2),r+thick/2,color,0,Math.PI*2,-.03,pulse.phase==='off'?0.12:pulse.warning?0.45:0.85);
              ring.visible=pulse.phase!=='off';
            }else{
              // Beams fire inward toward the corridor (matches collision).
              const len=pulse.phase==='firing'
                ? c.beaconPulse!.range
                : pulse.warning
                  ? c.beaconPulse!.range*0.4
                  : 0;
              const ux=-Math.cos(b.angle),uy=-Math.sin(b.angle);
              const half=c.beaconPulse!.thickness??0.09;
              this.laserBeam(
                `beacon-laser-${i}`,
                b.x+ux*b.radius*0.85,
                b.y+uy*b.radius*0.85,
                b.x+ux*(b.radius+len),
                b.y+uy*(b.radius+len),
                half,
                color,
                pulse.phase==='firing'?1:pulse.warning?0.4:0,
              );
            }
          });
        }
        break;}
      case 'accretionShredder':accretionDebrisAtTime(c,t).forEach((b,i)=>this.creature('rock-shard-'+i,b.x,b.y,b.radius,'rock'));break;
      case 'sequentialTunnel':{
        const ports=sequentialTunnelAtTime(c,t),open=ports.find(p=>p.open)!;
        this.ring('derelict-wall',open.x,open.y,open.radius,40,0x1e2c3a);
        this.ring('port-active-housing',open.x,open.y,open.radius+.10,open.radius+.22,0x7a93a3,0,Math.PI*2,.02);
        this.ring('port-active-lip',open.x,open.y,open.radius+.22,open.radius+.28,0xb0c4d0,0,Math.PI*2,.01);
        ports.forEach((p,i)=>{
          const r=p.open?p.radius:Math.max(.12,Math.min(p.radius,c.spacing-p.radius-.16));
          this.ring('port-'+i,p.x,p.y,r,r+.11,p.open?0x92edcf:0x65747e,0,Math.PI*2,-.02);
          const cross=this.box('sealed-'+i,p.x,p.y,r*1.25,.07,0xa98068,-.05,Math.PI/4);cross.visible=!p.open;
          const cross2=this.box('sealed-b-'+i,p.x,p.y,r*1.25,.07,0xa98068,-.05,-Math.PI/4);cross2.visible=!p.open;
        });break;}
      case 'movingSafeZone':{
        const s=movingSafeZoneHoleAtTime(c,t);
        this.ring('wreck-field',s.x,s.y,s.radius,c.fieldRadius,0x5a4836,0,Math.PI*2,0,.78,c.centerX,c.centerY);
        this.ring('safe-edge',s.x,s.y,s.radius,s.radius+.035,0xffd08a,0,Math.PI*2,-.02);
        this.ring('field-edge',c.centerX,c.centerY,c.fieldRadius-.025,c.fieldRadius,0xb89a78);break;}
      case 'magnetopause':{
        const hub=Math.max(0.12,c.hubRadius??c.innerRadius*.45);
        const a=t*c.speed+(c.phase??0)+c.gapWidth/2,span=Math.PI*2-c.gapWidth;
        const inner=Math.max(hub,c.innerRadius);
        this.ring('dish-arc',c.centerX,c.centerY,inner,c.outerRadius,0x6a7f93,a,span,0,.9);
        this.ring('dish-rim',c.centerX,c.centerY,c.outerRadius-.04,c.outerRadius,0xd7e4ef,a,span,-.01);
        this.ball('dish-hub',c.centerX,c.centerY,hub,0xffb449,-.08);break;}
      case 'lagrangeNull':
        this.ring('calm-boundary',c.centerX,c.centerY,c.radius-.015,c.radius,0x8caaa9,0,Math.PI*2,0,.4);
        this.ring('calm-pocket',c.centerX,c.centerY,0,c.radius,0x142637,0,Math.PI*2,.02,.15);break;
      case 'pulsarBeam':{
        const on=pulsarBeamOn(c,t),vertical=c.orientation==='vertical';
        const beam=this.box('radiation',c.centerX,c.centerY,vertical?c.halfWidth*2:80,vertical?80:c.halfWidth*2,0xff997a,0,0,.85);beam.visible=on;
        const core=this.box('radiation-core',c.centerX,c.centerY,vertical?c.halfWidth*.65:80,vertical?80:c.halfWidth*.65,0xffeee0,-.01);core.visible=on;
        for(const side of [-1,1])this.box('trace-'+side,c.centerX+(vertical?side*c.halfWidth:0),c.centerY+(vertical?0:side*c.halfWidth),vertical?.012:80,vertical?80:.012,0x8aa3bd,.01,0,on?.5:.15);break;}
      case 'solarSail':{
        const a=solarSailAngle(c,t),open=solarSailOpen(c,t);
        const panel=this.box('vane-panel',c.centerX,c.centerY,c.halfWidth*2,c.halfHeight*2,0x5a6a76,0,a,open?.13:1);
        for(const side of [-1,1]){
          const dy=side*c.halfHeight*.94;
          this.box('vane-frame-'+side,c.centerX-Math.sin(a)*dy,c.centerY+Math.cos(a)*dy,c.halfWidth*1.97,c.halfHeight*.10,0xa8b8c4,-.075,a,open?.10:1);
        }
        for(let i=0;i<5;i++){
          const dx=(i-2)*c.halfWidth*.32;
          this.box('vane-rib-'+i,c.centerX+Math.cos(a)*dx,c.centerY+Math.sin(a)*dx,.025,c.halfHeight*1.85,0xc5d0d8,-.06,a,open?.10:1);
        }
        const line=this.box('clear-line',c.centerX,c.centerY,c.halfWidth*2,.018,0x88efc9,-.07,a);line.visible=open;
        panel.material.color.setHex(open?0x8ae6c9:0x5a6a76);break;}
      case 'teleportPortal':{
        const s=teleportPortalPoseAtTime(c,t);
        // Portal only — no seal wall, grid, or aperture circle. Vanishes and reappears as one piece.
        const frame=this.ring('portal-frame',s.x,s.y,s.radius,s.radius+.16,0x6a8498,0,Math.PI*2,.01);frame.visible=s.present;
        const lip=this.ring('portal-lip',s.x,s.y,s.radius+.16,s.radius+.26,0x3f5363,0,Math.PI*2,.02);lip.visible=s.present;
        const energy=this.ring('portal-energy',s.x,s.y,s.radius+.04,s.radius+.11,0x4aa7c9,0,Math.PI*2,-.02,.75);energy.visible=s.present;
        const ghost=this.ring('next-anchor',s.nextX,s.nextY,s.radius*.88,s.radius+.06,0xffbe66,0,Math.PI*2,-.04,.55);ghost.visible=s.warning;
        break;}
      default: break;
    }
  }
  dispose():void {this.clock?.dispose();this.drones?.dispose();this.elevator?.dispose();this.shutter?.dispose();this.scissor?.dispose();this.groundCuts?.dispose();this.billboard?.dispose();this.docking?.dispose();this.shear?.dispose();this.rotatingGate?.dispose();this.energyField?.dispose();this.phaseGate?.dispose();this.repulsor?.dispose();this.nullTendril?.dispose();this.nullLash?.dispose();this.theNull?.dispose();this.falseEntry?.dispose();for(const p of this.parts.values()){p.geometry.dispose();if(p.material instanceof THREE.MeshBasicMaterial)p.material.dispose();}this.finishes.dispose();this.parts.clear();this.group.clear();this.group.removeFromParent();}
}
