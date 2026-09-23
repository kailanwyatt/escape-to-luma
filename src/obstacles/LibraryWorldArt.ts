import * as THREE from 'three';
import type { LibraryObstacleConfig } from './LibraryObstacle';
import type { StoryLibraryConfig } from './StoryLibraryObstacle';
import { elevatorBlocksStateAtTime } from './ElevatorBlocksState';
import { clockHandsStateAtTime } from './ClockHandsState';
import { scissorGateStateAtTime } from './ScissorGateState';
import { speedFieldStateAtTime } from './SpeedFieldState';
import { splitShutterStateAtTime, conveyorGateBlocksAtTime, corkscrewStateAtTime, cometCrossingStateAtTime } from './ExtendedLibraryState';
import { orbitingMoonsAtTime, sequentialTunnelAtTime, movingSafeZoneHoleAtTime, accretionDebrisAtTime, pulsarBeamOn, solarSailAngle, solarSailOpen, teleportPortalPoseAtTime, theNullSafeAtTime } from './StoryLibraryState';

type Config = LibraryObstacleConfig | StoryLibraryConfig;
type Part = THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial | THREE.MeshPhongMaterial>;
const N = 128;

/** Primitive visual kit. No state, collision, launch or prediction decisions live here. */
export class LibraryWorldArt {
  readonly group = new THREE.Group();
  private parts = new Map<string, Part>();
  constructor(private c: Config) { this.group.name = `world-art-${c.type}`; this.update(0); }
  private part(id: string, color: number, shape: 'box' | 'sphere' | 'ring' = 'box'): Part {
    const found = this.parts.get(id); if (found) { found.material.color.setHex(color); return found; }
    const geometry = shape === 'sphere' ? new THREE.SphereGeometry(1, 20, 12) : shape === 'ring' ? new THREE.RingGeometry(1, 2, N) : new THREE.BoxGeometry(1, 1, 1);
    const material = shape === 'sphere' && !id.includes('eye')
      ? new THREE.MeshPhongMaterial({color, emissive:color, emissiveIntensity:.12, shininess:85, specular:0xbddbe9})
      : new THREE.MeshBasicMaterial({color, side: THREE.DoubleSide});
    const m: Part = new THREE.Mesh(geometry, material);
    m.name = id; m.frustumCulled = false; this.parts.set(id, m); this.group.add(m); return m;
  }
  private box(id: string, x: number, y: number, w: number, h: number, color: number, z = 0, angle = 0, opacity = 1): Part {
    const m = this.part(id, color); m.position.set(x,y,z); m.scale.set(w,h,.08); m.rotation.z=angle;
    this.opacity(m,opacity); return m;
  }
  private opacity(m: Part, value: number) { m.material.opacity=value; m.material.transparent=value<1; m.material.depthWrite=value===1; }
  private ball(id: string,x:number,y:number,r:number,color:number,z=0):Part {
    const m=this.part(id,color,'sphere');m.position.set(x,y,z);m.scale.set(r,r,r*.65);return m;
  }
  private ring(id:string,x:number,y:number,inner:number,outer:number,color:number,start=0,span=Math.PI*2,z=0,opacity=1,outerX=x,outerY=y):Part {
    const m=this.part(id,color,'ring');const p=m.geometry.getAttribute('position') as THREE.BufferAttribute;
    for(let row=0;row<2;row++)for(let j=0;j<=N;j++){
      const a=start+j/N*span,r=row===0?inner:outer;
      p.setXYZ(row*(N+1)+j,Math.cos(a)*r+(row===0?0:outerX-x),Math.sin(a)*r+(row===0?0:outerY-y),0);
    }
    p.needsUpdate=true;m.position.set(x,y,z);this.opacity(m,opacity);return m;
  }
  private capsule(id:string,ax:number,ay:number,bx:number,by:number,r:number,color:number) {
    const a=Math.atan2(by-ay,bx-ax),length=Math.hypot(bx-ax,by-ay);
    this.box(id,(ax+bx)/2,(ay+by)/2,length,2*r,color,0,a);
    this.ball(id+'-a',ax,ay,r,color);this.ball(id+'-b',bx,by,r,color);
    this.box(id+'-trace',(ax+bx)/2,(ay+by)/2,length*.88,r*.35,0xffbb62,-.09,a);
  }
  private creature(id:string,x:number,y:number,r:number,kind:'drone'|'alien'|'ice') {
    const color=kind==='drone'?0x647f96:kind==='ice'?0x9edcf2:0x946caf;
    this.ball(id,x,y,r,color);
    this.ball(id+'-face',x,y,r*.73,kind==='drone'?0x172c3d:0x34254c,-r*.45);
    this.ball(id+'-eye',x,y,r*.26,kind==='drone'?0xffba55:0xa9ffe3,-r*.89);
    if(kind==='drone'){
      this.box(id+'-visor',x,y,r*1.45,r*.18,0xffcd78,-r*.90);
      this.box(id+'-vent',x,y-r*.36,r*.65,r*.12,0xacc6d4,-r*.72);
    }else{
      this.ring(id+'-halo',x,y,r*.55,r*.69,kind==='ice'?0xe8faff:0xb8a4ee,0,Math.PI*2,-r*.8);
    }
  }
  update(t:number):void {
    const c=this.c;
    switch(c.type){
      case 'elevatorBlocks':
        elevatorBlocksStateAtTime(c,t).forEach((b,i)=>{
          this.box('cage-'+i,b.x,b.y,b.width,b.height,0x354b59);
          this.box('glass-'+i,b.x,b.y,b.width*.78,b.height*.65,0x4c8b91,-.06);
          for(let j=0;j<3;j++)this.box(`bar-${i}-${j}`,b.x+(j-1)*b.width*.25,b.y,b.width*.035,b.height*.8,0xb2c5ce,-.11);
          this.box('lamp-'+i,b.x,b.y+b.height*.39,b.width*.55,b.height*.08,0xffbd61,-.12);
          // Thin background guides are explicitly secondary, behind the collision plane.
          for(const side of [-1,1])this.box(`rail-${i}-${side}`,b.x+side*b.width*.52,c.baseY,.018,c.amplitude*2+b.height,0x34444e,.3,0,.35);
        });break;
      case 'splitShutter':{
        const s=splitShutterStateAtTime(c,t);
        [s.leftX,s.rightX].forEach((x,i)=>{
          this.box('bulkhead-'+i,x,s.y,c.panelWidth,s.height,0x344d60);
          this.box('inset-'+i,x,s.y,c.panelWidth*.83,s.height*.82,0x688391,-.06);
          for(let j=0;j<4;j++)this.box(`rib-${i}-${j}`,x,s.y+(j-1.5)*s.height*.18,c.panelWidth*.79,.045,0x293e4c,-.11);
          this.box('edge-'+i,x+(i===0?1:-1)*c.panelWidth*.43,s.y,.045,s.height*.88,0xf5b759,-.12);
        });break;}
      case 'clockHands':{
        const s=clockHandsStateAtTime(c,t);
        s.hands.forEach((h,i)=>this.capsule('arm-'+i,s.hubX,s.hubY,h.tipX,h.tipY,c.thickness,0x91a5b2));
        this.creature('retrieval-hub',s.hubX,s.hubY,s.hubRadius,'drone');break;}
      case 'scissorGate':{
        const s=scissorGateStateAtTime(c,t);
        s.bars.forEach((b,i)=>this.capsule('pincer-'+i,b.ax,b.ay,b.bx,b.by,c.barThickness,0xa5bac3));
        // The central eye stays inside the existing intersection, no new body collider.
        this.ball('hinge-eye',s.centerX,s.centerY,c.barThickness*.85,0xffc36b,-.13);break;}
      case 'conveyorGate':conveyorGateBlocksAtTime(c,t).forEach((b,i)=>this.creature('patrol-'+i,b.x,b.y,b.radius,'drone'));break;
      case 'cometCrossing':{
        const s=cometCrossingStateAtTime(c,t);this.creature('ice-core',s.x,s.y,s.radius,'ice');
        // Ghost-thin wake, never a solid extra obstacle.
        const a=Math.atan2(c.endY-c.startY,c.endX-c.startX);
        this.box('wake',s.x-Math.cos(a)*s.radius*1.8,s.y-Math.sin(a)*s.radius*1.8,s.radius*2.7,s.radius*.35,0xa5def5,.3,a,.13);break;}
      case 'corkscrewTunnel':{
        const s=corkscrewStateAtTime(c,t),start=s.gapAngle+s.gapWidth/2,span=Math.PI*2-s.gapWidth;
        this.ring('transit-wall',s.centerX,s.centerY,s.innerRadius,s.radius,0x52677d,start,span);
        this.ring('transit-inner',s.centerX,s.centerY,s.innerRadius,s.innerRadius+.045,0xa4d6ee,start,span,-.01);
        this.ring('transit-outer',s.centerX,s.centerY,s.radius-.045,s.radius,0xd5b889,start,span,-.01);break;}
      case 'speedField':{
        const s=speedFieldStateAtTime(c,t);this.box('current',s.centerX,s.centerY,s.width,s.height,0x399abc,0,0,.17);
        for(const side of [-1,1])this.box('edge-'+side,s.centerX+side*s.width/2,s.centerY,.025,s.height,0x8fdaed,-.02,0,.55);
        for(let i=0;i<7;i++){
          const u=((t*.28+i/7)%1+1)%1;
          this.box('flow-'+i,s.centerX+(i%3-1)*s.width*.29,s.centerY+(u-.5)*s.height,.018,.22,0xb7f5ff,-.03,0,.45);
        }break;}
      case 'orbitingMoons':orbitingMoonsAtTime(c,t).forEach((b,i)=>this.creature('lunar-life-'+i,b.x,b.y,b.radius,'alien'));break;
      case 'accretionShredder':accretionDebrisAtTime(c,t).forEach((b,i)=>this.creature('scavenger-'+i,b.x,b.y,b.radius,'alien'));break;
      case 'sequentialTunnel':{
        const ports=sequentialTunnelAtTime(c,t),open=ports.find(p=>p.open)!;
        this.ring('derelict-wall',open.x,open.y,open.radius,40,0x253645);
        ports.forEach((p,i)=>{
          // Retracted closed-port irises cannot draw across the active safe opening.
          const r=p.open?p.radius:Math.max(.12,Math.min(p.radius,c.spacing-p.radius-.16));
          this.ring('port-'+i,p.x,p.y,r,r+.10,p.open?0x92edcf:0x65747e,0,Math.PI*2,-.02);
          const cross=this.box('sealed-'+i,p.x,p.y,r*1.25,.07,0xa98068,-.05,Math.PI/4);cross.visible=!p.open;
          const cross2=this.box('sealed-b-'+i,p.x,p.y,r*1.25,.07,0xa98068,-.05,-Math.PI/4);cross2.visible=!p.open;
        });break;}
      case 'movingSafeZone':{
        const s=movingSafeZoneHoleAtTime(c,t);
        this.ring('damaged-field',s.x,s.y,s.radius,c.fieldRadius,0x5a365c,0,Math.PI*2,0,.78,c.centerX,c.centerY);
        this.ring('safe-edge',s.x,s.y,s.radius,s.radius+.035,0x9df2d4,0,Math.PI*2,-.02);
        this.ring('field-edge',c.centerX,c.centerY,c.fieldRadius-.025,c.fieldRadius,0xc091a8);break;}
      case 'magnetopause':{
        const a=t*c.speed+(c.phase??0)+c.gapWidth/2,span=Math.PI*2-c.gapWidth;
        this.ring('sheath',c.centerX,c.centerY,c.innerRadius,c.outerRadius,0x7e72ac,a,span,0,.85);
        this.ring('sheath-edge',c.centerX,c.centerY,c.outerRadius-.035,c.outerRadius,0xc0e4ff,a,span,-.01);break;}
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
        const panel=this.box('solar-panel',c.centerX,c.centerY,c.halfWidth*2,c.halfHeight*2,0x314e72,0,a,open?.13:1);
        for(let i=0;i<7;i++){
          const dx=(i-3)*c.halfWidth*.26;
          this.box('cell-'+i,c.centerX+Math.cos(a)*dx,c.centerY+Math.sin(a)*dx,.02,c.halfHeight*1.85,0xd2b575,-.06,a,open?.10:1);
        }
        // At the mechanical open threshold the panel is non-solid: show an edge-on
        // cyan status line, not a visibly blocking opaque rectangle.
        const line=this.box('clear-line',c.centerX,c.centerY,c.halfWidth*2,.018,0x88efc9,-.07,a);line.visible=open;
        panel.material.color.setHex(open?0x8ae6c9:0x314e72);break;}
      case 'theNull':{
        const s=theNullSafeAtTime(c,t);
        this.ring('darkness',s.x,s.y,s.radius,c.fieldRadius,0x090713);
        this.ring('remaining-light',s.x,s.y,s.radius,s.radius+.045,0xd7dbfb,0,Math.PI*2,-.01);
        this.ring('void-edge',s.x,s.y,c.fieldRadius-.035,c.fieldRadius,0x513455);break;}
      case 'teleportPortal':{
        const s=teleportPortalPoseAtTime(c,t);
        this.ring('relay-wall',s.x,s.y,s.radius,40,0x251d37);
        this.ring('current-aperture',s.x,s.y,s.radius,s.radius+.10,0x89f2bc,0,Math.PI*2,-.02);
        const ghost=this.ring('next-anchor',s.nextX,s.nextY,s.radius*.9,s.radius*.9+.025,0xffbe66,0,Math.PI*2,-.04,.65);ghost.visible=s.warning;
        // Small anchor brackets remain decorative; only the green aperture is passable.
        c.anchors.forEach((p,i)=>this.box('anchor-'+i,p.x,p.y+c.radius+.17,.20,.035,0x9c819f,-.02));break;}
      case 'entryExitPortal':
        this.ring('entry-wall',c.entryX,c.entryY,c.radius,40,0x202c3d);
        this.ring('entry',c.entryX,c.entryY,c.radius,c.radius+.10,0x80f2b1,0,Math.PI*2,-.01);
        this.ring('exit',c.exitX,c.exitY,c.radius*.7,c.radius*.7+.035,0x7cd9ff,0,Math.PI*2,-.03,.55);
        this.ring('exit-double',c.exitX,c.exitY,c.radius*.79,c.radius*.79+.016,0x7cd9ff,0,Math.PI*2,-.03,.4);break;
      default: break;
    }
  }
  dispose():void {for(const p of this.parts.values()){p.geometry.dispose();p.material.dispose();}this.parts.clear();this.group.clear();this.group.removeFromParent();}
}
