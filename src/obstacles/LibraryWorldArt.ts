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
import { CorkscrewTunnelArt } from './CorkscrewTunnelArt';
import { EnergyFieldArt } from './EnergyFieldArt';
import { PhaseGateArt } from './PhaseGateArt';
import { RepulsorArt } from './RepulsorArt';
import { NullTendrilArt } from './NullTendrilArt';
import { NullLashArt } from './NullLashArt';
import { TheNullArt } from './TheNullArt';
import { FalseEntryArt } from './FalseEntryArt';
import { OrbitingMoonsArt } from './OrbitingMoonsArt';
import { MovingSafeZoneArt } from './MovingSafeZoneArt';
import { AccretionShredderArt } from './AccretionShredderArt';
import { StoryExtraArt } from './StoryExtraArt';
import { scissorGateStateAtTime } from './ScissorGateState';
import { speedFieldStateAtTime } from './SpeedFieldState';
import { cometCrossingStateAtTime } from './ExtendedLibraryState';

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
  private corkscrew?: CorkscrewTunnelArt;
  private energyField?: EnergyFieldArt;
  private phaseGate?: PhaseGateArt;
  private repulsor?: RepulsorArt;
  private nullTendril?: NullTendrilArt;
  private nullLash?: NullLashArt;
  private theNull?: TheNullArt;
  private falseEntry?: FalseEntryArt;
  private orbitingMoons?: OrbitingMoonsArt;
  private movingSafeZone?: MovingSafeZoneArt;
  private accretion?: AccretionShredderArt;
  private storyExtra?: StoryExtraArt;
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
    if(c.type==='corkscrewTunnel'){
      this.corkscrew=new CorkscrewTunnelArt(c);
      this.group.add(this.corkscrew.group);
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
    if(c.type==='orbitingMoons'){
      this.orbitingMoons=new OrbitingMoonsArt(c);
      this.group.add(this.orbitingMoons.group);
    }
    if(c.type==='movingSafeZone'){
      this.movingSafeZone=new MovingSafeZoneArt(c);
      this.group.add(this.movingSafeZone.group);
    }
    if(c.type==='accretionShredder'){
      this.accretion=new AccretionShredderArt(c);
      this.group.add(this.accretion.group);
    }
    if(
      c.type==='magnetopause' ||
      c.type==='lagrangeNull' ||
      c.type==='pulsarBeam' ||
      c.type==='solarSail' ||
      c.type==='sequentialTunnel' ||
      c.type==='teleportPortal'
    ){
      this.storyExtra=new StoryExtraArt(c);
      this.group.add(this.storyExtra.group);
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
      // Lean shard silhouette — fewer facets so spirals do not strobe.
      this.ball(id,x,y,r,0x6a737c).visible=true;
      this.ball(id+'-facet-0',x+r*.22,y-r*.12,r*.28,0x4e585f,-r*.35).visible=true;
      this.ball(id+'-glint',x,y,r*.1,0xc9d4dc,-r*.7).visible=true;
      // Hide unused facet slots from denser legacy creatures.
      for(const i of [1,2]){
        const f=this.parts.get(id+'-facet-'+i);
        if(f)f.visible=false;
      }
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
      case 'corkscrewTunnel':this.corkscrew?.update(t);break;
      case 'energyField':this.energyField?.update(t);break;
      case 'phaseGate':this.phaseGate?.update(t);break;
      case 'repulsor':this.repulsor?.update(t);break;
      case 'nullTendril':this.nullTendril?.update(t);break;
      case 'nullLash':this.nullLash?.update(t);break;
      case 'theNull':this.theNull?.update(t);break;
      case 'entryExitPortal':this.falseEntry?.update(t);break;
      case 'orbitingMoons':this.orbitingMoons?.update(t);break;
      case 'movingSafeZone':this.movingSafeZone?.update(t);break;
      case 'accretionShredder':this.accretion?.update(t);break;
      case 'magnetopause':
      case 'lagrangeNull':
      case 'pulsarBeam':
      case 'solarSail':
      case 'sequentialTunnel':
      case 'teleportPortal':
        this.storyExtra?.update(t);break;
      case 'cometCrossing':{
        const s=cometCrossingStateAtTime(c,t);this.creature('ice-core',s.x,s.y,s.radius,'ice');
        // Ghost-thin wake, never a solid extra obstacle.
        const a=Math.atan2(c.endY-c.startY,c.endX-c.startX);
        for(let i=0;i<4;i++)this.box('wake-'+i,s.x-Math.cos(a)*s.radius*(1+i*.7),s.y-Math.sin(a)*s.radius*(1+i*.7),s.radius*.9,s.radius*(.36-i*.07),0xa5def5,.3,a,.15-i*.03);break;}
      case 'speedField':{
        const s=speedFieldStateAtTime(c,t);this.box('current',s.centerX,s.centerY,s.width,s.height,0x399abc,0,0,.17);
        for(const side of [-1,1])this.box('edge-'+side,s.centerX+side*s.width/2,s.centerY,.025,s.height,0x8fdaed,-.02,0,.55);
        for(let i=0;i<7;i++){
          const u=((t*.28+i/7)%1+1)%1;
          this.box('flow-'+i,s.centerX+(i%3-1)*s.width*.29,s.centerY+(u-.5)*s.height,.018,.22,0xb7f5ff,-.03,0,.45);
        }break;}
      default: break;
    }
  }
  dispose():void {this.clock?.dispose();this.drones?.dispose();this.elevator?.dispose();this.shutter?.dispose();this.scissor?.dispose();this.groundCuts?.dispose();this.billboard?.dispose();this.docking?.dispose();this.shear?.dispose();this.rotatingGate?.dispose();this.corkscrew?.dispose();this.energyField?.dispose();this.phaseGate?.dispose();this.repulsor?.dispose();this.nullTendril?.dispose();this.nullLash?.dispose();this.theNull?.dispose();this.falseEntry?.dispose();this.orbitingMoons?.dispose();this.movingSafeZone?.dispose();this.accretion?.dispose();this.storyExtra?.dispose();for(const p of this.parts.values()){p.geometry.dispose();if(p.material instanceof THREE.MeshBasicMaterial)p.material.dispose();}this.finishes.dispose();this.parts.clear();this.group.clear();this.group.removeFromParent();}
}
