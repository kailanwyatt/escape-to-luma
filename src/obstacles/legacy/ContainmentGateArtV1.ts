import * as THREE from 'three';
import type { ReactiveGateConfig } from '../../config/ObstacleConfig';
import { GAME_TUNING } from '../../game/gameTuning';
import { reactiveGateStateAtTime } from '../ExtendedLibraryState';
import { FacilityArtKit } from '../FacilityArtKit';

const FLOOR_Y = GAME_TUNING.projectile.floorY;

/** Archived V1 containment gate. Restore via GATE_VISUAL_VARIANT = 'legacy'. */
export class ContainmentGateArtV1 {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit();
  private readonly doors: THREE.Group[] = [];
  private readonly lamp = this.kit.lamp();
  constructor(private readonly config: ReactiveGateConfig) {
    this.group.name = 'containment-gate-v1';
    const s=reactiveGateStateAtTime(config,0),w=s.panelWidth,h=s.panelHeight;
    const armor=this.kit.metal(0x4c6272),inset=this.kit.metal(0x293d4a,.5),steel=this.kit.metal(0x9aaab5,.27);
    const black=this.kit.metal(0x101b24,.65,false),mark=this.kit.metal(0xbb8545,.5,false);
    for(let i=0;i<2;i++){
      const door=new THREE.Group();door.name=`door-${i}`;this.doors.push(door);this.group.add(door);
      const side=i===0?1:-1;
      const box=(name:string,bw:number,bh:number,d:number,x:number,y:number,z:number,m:THREE.Material,b=.035)=>this.kit.box(door,name,bw,bh,d,x,y,z,m,b);
      // Full collision silhouette stays occupied even at the bevelled outer corners.
      box(`capture-door-${i}`,w,h,.42,0,0,.12,black,0);
      box('armor-shell',w,h,.43,0,0,.13,armor,.055);
      box('recessed-panel',w*.73,h*.72,.055,-side*w*.045,-h*.01,-.105,black);
      box('upper-armor',w*.65,h*.36,.065,-side*w*.045,h*.12,-.14,inset);
      box('lower-armor',w*.65,h*.24,.065,-side*w*.045,-h*.22,-.14,inset);
      box('leading-seal',w*.055,h*.94,.065,side*w*.457,0,-.12,black);
      box('steel-leading-edge',w*.025,h*.9,.06,side*w*.42,0,-.17,steel);
      box('lamp-recess',w*.72,h*.095,.06,0,h*.39,-.12,black);
      box(`status-lamp-${i}`,w*.58,h*.035,.022,0,h*.39,-.16,this.lamp,.007);
      for(const sy of [-1,1]){
        box('cross-brace',w*.78,h*.022,.05,0,sy*h*.32,-.18,steel,.008);
        box('latch-pocket',w*.19,h*.13,.06,side*w*.29,sy*h*.18,-.20,black);
        box('latch-block',w*.13,h*.09,.07,side*w*.29,sy*h*.18,-.24,steel);
      }
      for(let j=0;j<4;j++) box('vent',w*.19,h*.011,.012,-side*w*.17,-h*.2+j*h*.024,-.18,black,0);
      for(const x of [-.39,.39])for(const y of [-.43,.43]){
        box('fastener-seat',w*.055,h*.028,.018,x*w,y*h,-.105,black);
        box('fastener',w*.025,h*.013,.026,x*w,y*h,-.12,steel,.005);
      }
      for(let j=0;j<3;j++)box('caution-marker',w*.055,h*.025,.013,(-.10+j*.08)*w,-h*.43,-.105,mark,.004);
    }
    this.buildFloorFrame(s.y, w, h, config.openWidth);
    this.update(0);
  }
  /** Presentation-only doorway: sill, jambs and header plant the doors on the floor. */
  private buildFloorFrame(centerY:number, panelWidth:number, panelHeight:number, openWidth:number){
    const armor=this.kit.metal(0x4c6272),steel=this.kit.metal(0x9aaab5,.27);
    const black=this.kit.metal(0x101b24,.65,false);
    const frame=new THREE.Group();frame.name='ground-frame';this.group.add(frame);
    const doorBottom=centerY-panelHeight/2;
    const doorTop=centerY+panelHeight/2;
    const span=openWidth+panelWidth*2+.35;
    const sillTop=Math.max(FLOOR_Y+.1,Math.min(doorBottom-.05,FLOOR_Y+.45));
    const sillH=Math.max(0.12,sillTop-FLOOR_Y);
    this.kit.box(frame,'floor-sill',span,sillH,.5,0,FLOOR_Y+sillH/2,.14,black,0);
    this.kit.box(frame,'sill-lip',span*.92,.045,.08,0,sillTop-.02,-.16,steel,.006);
    this.kit.box(frame,'floor-track',span*.86,.04,.32,0,FLOOR_Y+.035,-.04,armor,.004);
    for(const side of [-1,1]){
      const x=side*(openWidth/2+panelWidth*.55+.08);
      const jambH=Math.max(0.5,doorTop+.28-FLOOR_Y);
      this.kit.box(frame,`jamb-${side<0?'left':'right'}`,.32,jambH,.48,x,FLOOR_Y+jambH/2,.05,armor,.04);
      this.kit.box(frame,`jamb-trim-${side<0?'left':'right'}`,.09,jambH*.94,.1,x,FLOOR_Y+jambH/2,-.26,steel,.006);
      this.kit.box(frame,`jamb-foot-${side<0?'left':'right'}`,.4,.16,.44,x,FLOOR_Y+.1,-.06,black,0);
    }
    const headerY=doorTop+.18;
    this.kit.box(frame,'header',span,.28,.46,0,headerY,.06,armor,.04);
    this.kit.box(frame,'header-lip',span*.94,.05,.08,0,headerY-.12,-.2,steel,.005);
    const underGap=Math.max(0,doorBottom-sillTop);
    if(underGap>0.1){
      for(const x of [-openWidth*.35,0,openWidth*.35]){
        this.kit.box(frame,`under-post-${x}`,.14,underGap,.24,x,sillTop+underGap/2,.1,black,0);
      }
    }
  }
  update(time:number){
    const s=reactiveGateStateAtTime(this.config,time);
    this.doors[0].position.set(s.leftX,s.y,0);this.doors[1].position.set(s.rightX,s.y,0);
    const color=s.warning?0xffb449:s.phase==='open'?0x70e5ed:0xff7562;
    this.lamp.color.setHex(color);this.lamp.emissive.setHex(color);
    this.group.userData.phase=s.phase;
  }
  dispose(){this.kit.dispose();this.group.clear();this.group.removeFromParent();}
}
