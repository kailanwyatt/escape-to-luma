import * as THREE from 'three';
import {disposeThreeObject} from '../utils/disposeThree';

type Floater={object:THREE.Object3D;x:number;y:number;z:number;phase:number;amplitude:number};
/** Decorative motion uses the game clock only. No collisions, timers or per-frame allocations. */
export class AmbientLife {
 readonly group=new THREE.Group();
 private world='';private source:THREE.Object3D|null=null;private time=0;
 private floaters:Floater[]=[];private clouds:Floater[]=[];
 private beacons:THREE.MeshBasicMaterial[]=[];
 private stars:THREE.ShaderMaterial|null=null;
 private comet:THREE.Group|null=null;private cometMaterial:THREE.LineBasicMaterial|null=null;
 private reduced=false;
 private asteroids:{object:THREE.Object3D;x:number;y:number;z:number;px:number;py:number;pz:number;phase:number;speed:number}[]=[];
 constructor(){this.group.name='ambient-life';}
 setWorld(world:string,source:THREE.Object3D):void {
  this.group.visible=true;
  if(this.world===world&&this.source===source)return;
  disposeThreeObject(this.group);this.group.clear();this.floaters=[];this.clouds=[];this.beacons=[];this.stars=null;this.comet=null;this.cometMaterial=null;
  this.world=world;this.source=source;this.time=0;this.asteroids=[];
  source.traverse(o=>{if(o.userData.ambientAsteroid)this.asteroids.push({object:o,x:o.rotation.x,y:o.rotation.y,z:o.rotation.z,px:o.position.x,py:o.position.y,pz:o.position.z,phase:this.asteroids.length*2.399,speed:.012+(this.asteroids.length%5)*.004});});
  source.traverse(o=>{if(o.userData.ambientCloud)this.clouds.push({object:o,x:o.position.x,y:o.position.y,z:o.position.z,phase:this.clouds.length*1.73,amplitude:world==='sky'?.85:.4});});
  const space=!['containment','workshop','city','rooftop','sky'].includes(world);
  if(space){
   const p:number[]=[],ph:number[]=[];
   for(let i=0;i<72;i++){p.push(Math.sin(i*4.718)*27,9+(i*7%17),32+(i*11%23));ph.push(i*2.399);}
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('phase',new THREE.Float32BufferAttribute(ph,1));
   this.stars=new THREE.ShaderMaterial({uniforms:{clock:{value:0},motion:{value:1}},transparent:true,depthWrite:false,
    vertexShader:`attribute float phase;uniform float clock;uniform float motion;varying float b;void main(){b=.55+.3*motion*sin(clock*.85+phase);gl_PointSize=3.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying float b;void main(){vec2 p=abs(gl_PointCoord-.5);float a=exp(-20.*dot(p,p));float rays=exp(-40.*min(p.x,p.y))*exp(-7.*max(p.x,p.y));gl_FragColor=vec4(.73,.85,1.,b*max(a,rays*.55));}`});
   const stars=new THREE.Points(geo,this.stars);stars.name='twinkling-stars';this.group.add(stars);
   if(world!=='homeward'){
    this.comet=new THREE.Group();this.comet.name='distant-comet';
    const head=new THREE.Mesh(new THREE.SphereGeometry(.055,8,6),new THREE.MeshBasicMaterial({color:0xc0e3ff}));this.comet.add(head);
    const trail=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(-3.2,.8,.4)]);
    this.cometMaterial=new THREE.LineBasicMaterial({color:0x83b4d5,transparent:true,opacity:.3,depthWrite:false});this.comet.add(new THREE.Line(trail,this.cometMaterial));this.group.add(this.comet);
   }
  }
  const industrial=['containment','workshop','city','rooftop','sky','atmosphere','orbit','moon'].includes(world);
  if(industrial){
   for(let i=0;i<4;i++){
    const material=new THREE.MeshBasicMaterial({color:0xe4aa5c,transparent:true,opacity:.75});this.beacons.push(material);
    const beacon=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),material);beacon.position.set((i%2?-1:1)*4.3,3.5,8+Math.floor(i/2)*9);this.group.add(beacon);
   }
   // Maintenance craft are small, outboard and visually distinct from large amber-eyed hazards.
   for(let i=0;i<2;i++){
    const drone=new THREE.Group();drone.name='background-maintenance-drone';
    const body=new THREE.Mesh(new THREE.BoxGeometry(.32,.14,.22),new THREE.MeshPhongMaterial({color:0x9cadb8,shininess:55}));drone.add(body);
    const panel=new THREE.Mesh(new THREE.BoxGeometry(.8,.025,.3),new THREE.MeshPhongMaterial({color:0x223b56}));drone.add(panel);
    const light=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),new THREE.MeshBasicMaterial({color:0x8cbdd4}));light.position.set(0,0,-.14);drone.add(light);
    const x=(i?-1:1)*5.4,y=5+i,z=18+i*8;drone.position.set(x,y,z);this.group.add(drone);this.floaters.push({object:drone,x,y,z,phase:i*2.1,amplitude:.65});
   }
  }
  if(world==='homeward'||world==='nebula'||world==='network'){
   for(let i=0;i<(world==='homeward'?9:5);i++){
    const color=world==='homeward'?0xb0ffe0:world==='nebula'?0xb398ff:0xe4c47f;
    const light=new THREE.Group();light.name=world==='homeward'?'distant-living-light':'energy-mote';
    light.add(new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),new THREE.MeshBasicMaterial({color})));
    light.add(new THREE.Mesh(new THREE.SphereGeometry(.15,10,8),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.12,depthWrite:false})));
    const x=(i%2?-1:1)*(4.3+i%3*.65),y=3+i%4,z=21+i*2.2;light.position.set(x,y,z);this.group.add(light);this.floaters.push({object:light,x,y,z,phase:i*1.7,amplitude:.35});
   }
  }
  this.update(0,this.reduced);
 }
 update(dt:number,reduceMotion:boolean):void {
  this.reduced=reduceMotion;
  if(!reduceMotion)this.time+=Math.max(0,Math.min(dt,.1));
  const t=this.time;
  this.source?.userData.updateWindows?.(t,reduceMotion);
  this.source?.userData.updateAtmosphere?.(t,reduceMotion);
  for(const a of this.asteroids){
   a.object.rotation.set(a.x+(reduceMotion?0:t*a.speed),a.y+(reduceMotion?0:t*a.speed*.7),a.z);
   // Drift outward from the authored boundary, never into the playable corridor.
   a.object.position.set(
    a.px+(reduceMotion?0:Math.sign(a.px)*.45*(1-Math.cos(t*.14+a.phase))),
    a.py+(reduceMotion?0:.55*Math.sin(t*.19+a.phase)),
    a.pz+(reduceMotion?0:.8*Math.sin(t*.12+a.phase)));
  }
  if(this.stars){this.stars.uniforms.clock.value=t;this.stars.uniforms.motion.value=reduceMotion?0:1;}
  for(let i=0;i<this.beacons.length;i++)this.beacons[i].opacity=reduceMotion?.65:.5+.35*(.5+.5*Math.sin(t*1.4+i*1.9));
  for(const f of this.floaters){f.object.position.set(f.x+(reduceMotion?0:Math.sin(t*.24+f.phase)*f.amplitude),f.y+(reduceMotion?0:Math.sin(t*.37+f.phase)*.2),f.z+(reduceMotion?0:Math.cos(t*.19+f.phase)*.6));}
  for(const c of this.clouds)c.object.position.x=c.x+(reduceMotion?0:Math.sin(t*.055+c.phase)*c.amplitude);
  if(this.comet){const cycle=t%29,progress=(cycle-6)/5;this.comet.visible=!reduceMotion&&progress>=0&&progress<=1;this.comet.position.set(-13+progress*26,15-progress*4,48);if(this.cometMaterial)this.cometMaterial.opacity=.35*Math.max(0,Math.sin(progress*Math.PI));}
 }
}
