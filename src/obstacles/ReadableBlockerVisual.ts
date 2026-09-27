import * as THREE from 'three';
import {mineralTexture} from '../environment/SkyMoonArt';

/** All solid detail stays within the authoritative unit XY silhouette; physics is unchanged. */
export function createReadableBlocker(kind:'drone'|'debris'|'weight'):THREE.Mesh {
  const geometry=new THREE.SphereGeometry(1,kind==='debris'?28:40,kind==='debris'?20:28);
  const map=kind==='debris'?mineralTexture():null;
  if(kind==='debris'){
    const p=geometry.attributes.position,colors:number[]=[];
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      // Faceted depth relief only — XY unit circle stays the hit boundary from the player view.
      const facet=.18*(.5+.5*Math.sin(x*17+y*11)*Math.sin(y*29-x*9));
      const ridge=.08*Math.max(0,Math.sin(x*31+y*19));
      p.setZ(i,z*(1-facet-ridge));
      const shade=.62+.22*Math.sin(x*13+y*21)*Math.sin(y*15-z*11)+.1*ridge;
      colors.push(shade,shade*.94,shade*.88);
    }
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geometry.computeVertexNormals();
  }
  const body=new THREE.Mesh(geometry,new THREE.MeshPhongMaterial({
    color:kind==='debris'?0x6e645c:kind==='weight'?0x677887:0x3a5265,
    map,bumpMap:map,bumpScale:kind==='debris'?0.1:0.06,
    vertexColors:kind==='debris',shininess:kind==='debris'?4:65,
    flatShading:kind==='debris',
  }));
  body.name=kind==='drone'?'orbital-sentry':kind==='weight'?'pendulum-counterweight':'mineral-debris';
  if(kind==='debris'){
    dressDebris(body);
    return body;
  }
  dressHardware(body,kind);
  return body;
}

function dressDebris(body:THREE.Mesh):void {
  const rock=new THREE.MeshPhongMaterial({color:0x4a4540,shininess:2,flatShading:true});
  const seam=new THREE.MeshPhongMaterial({color:0x2a2622,shininess:8});
  const glow=new THREE.MeshBasicMaterial({color:0xff8a4a});
  const add=(g:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number,sx=1,sy=sx,sz=sx)=>{
    // Keep props inside unit disk so lane gaps still read as routes.
    if(Math.hypot(x,y)>0.82)return;
    const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);body.add(o);
  };
  const chip=new THREE.BoxGeometry(1,1,1);
  for(let i=0;i<6;i++){
    const a=i*1.047,r=0.42+ (i%3)*0.08;
    add(chip,rock,Math.cos(a)*r,Math.sin(a)*r,-0.55,.22+i%2*.08,.16,.12);
  }
  for(let i=0;i<4;i++){
    const a=i*1.57+0.4;
    add(new THREE.BoxGeometry(.55,.04,.06),seam,Math.cos(a)*.35,Math.sin(a)*.35,-0.72);
  }
  add(new THREE.BoxGeometry(.12,.08,.04),glow,0.2,-0.15,-0.88);
}

function dressHardware(body:THREE.Mesh,kind:'drone'|'weight'):void {
  const metal=new THREE.MeshPhongMaterial({color:0x17232e,shininess:70});
  const trim=new THREE.MeshPhongMaterial({color:0xa0acb4,shininess:90});
  const panel=new THREE.MeshPhongMaterial({color:0x243646,shininess:55});
  const amber=new THREE.MeshBasicMaterial({color:0xffb45a});
  const cyan=new THREE.MeshBasicMaterial({color:0x6cf0ff});
  const add=(g:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number)=>{
    const o=new THREE.Mesh(g,m);o.position.set(x,y,z);body.add(o);return o;
  };
  // Segmented armor collar — circular rim reads as the hit disk.
  add(new THREE.TorusGeometry(.82,.055,8,48),metal,0,0,-.58);
  add(new THREE.TorusGeometry(.94,.028,6,40),trim,0,0,-.52);
  const lens=add(new THREE.SphereGeometry(kind==='drone'?.28:.13,20,12),kind==='drone'?cyan:amber,0,0,-1);
  lens.scale.z=.2;
  add(new THREE.TorusGeometry(kind==='drone'?.33:.18,.035,8,32),trim,0,0,-.97);
  const bolt=new THREE.SphereGeometry(.032,8,6);
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4,x=Math.cos(a)*.8,y=Math.sin(a)*.8;
    add(bolt,trim,x,y,-.64);
    const plate=add(new THREE.BoxGeometry(.2,.3,.05),panel,Math.cos(a)*.55,Math.sin(a)*.55,-.82);
    plate.rotation.z=a-Math.PI/2;
    if(i%2===0){
      const mark=add(new THREE.BoxGeometry(.1,.035,.025),amber,Math.cos(a)*.55,Math.sin(a)*.55,-.86);
      mark.rotation.z=a;
    }
  }
  // Solar vanes stay inside the unit disk — readable satellite mass, not extra collision.
  if(kind==='drone'){
    for(const side of [-1,1]){
      const wing=add(new THREE.BoxGeometry(.55,.18,.03),panel,side*.48,0,-.7);
      wing.rotation.z=side*.12;
      for(let j=0;j<3;j++){
        add(new THREE.BoxGeometry(.48,.035,.015),cyan,side*.48,(j-1)*.055,-.72);
      }
    }
    add(new THREE.CylinderGeometry(.06,.08,.2,8),metal,0,.55,-.75).rotation.x=Math.PI/2;
  }
  for(const side of [-1,1])for(let j=0;j<4;j++){
    add(new THREE.BoxGeometry(.18,.035,.04),metal,side*.46,(j-1.5)*.085,-.9);
  }
  if(kind==='weight'){
    const stripe=new THREE.BoxGeometry(.055,.52,.035);
    for(const side of [-1,1]){const o=add(stripe,amber,side*.23,0,-.99);o.rotation.z=-.24;}
  }
}
