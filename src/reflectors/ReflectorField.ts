import * as THREE from 'three';
import {createSatelliteMount} from './SatelliteMount';
import type {ReflectorConfig,ReflectorVisualVariant} from './ReflectorConfig';
import {reflectorPose} from './Reflection';
import {disposeThreeObject} from '../utils/disposeThree';
export class ReflectorField {
 readonly group=new THREE.Group();
 private readonly matrix=new THREE.Matrix4();
 private readonly u=new THREE.Vector3();private readonly v=new THREE.Vector3();private readonly n=new THREE.Vector3();
 private items:{config:ReflectorConfig;mesh:THREE.Group;scan:THREE.Mesh;debug:THREE.ArrowHelper}[]=[];
 setReflectors(configs:ReflectorConfig[]):void {
  disposeThreeObject(this.group);this.group.clear();this.items=[];
  for(const c of configs){
   const mesh=new THREE.Group();mesh.visible=c.active!==false;
   const variant=c.visualVariant??'satelliteReflector';
   if(variant==='satelliteReflector'||variant==='solarArrayReflector')mesh.add(createSatelliteMount(c.width,c.height));
   const palette:Record<ReflectorVisualVariant,[number,number,number]>={
    satelliteReflector:[0x263746,0x197bba,0x85f5ff],solarArrayReflector:[0x5c4d32,0x15336d,0xffd378],lunarDishReflector:[0xb1bdc8,0x568ca8,0x9bffff],crystalReflector:[0x526774,0x1fa1c9,0x90ffff],energyCrystalReflector:[0x473269,0x8255bb,0xbb9cff],ancientReflector:[0x4f493c,0x75684b,0xffd47c],lumaReflector:[0x779bd0,0x74baca,0xe0ffff],
   };const [bodyColor,faceColor,edgeColor]=palette[variant];
   const backing=new THREE.Mesh(new THREE.BoxGeometry(c.width,c.height,.08),new THREE.MeshPhongMaterial({color:bodyColor,shininess:80}));backing.position.z=-.05;mesh.add(backing);
   const face=new THREE.Mesh(new THREE.PlaneGeometry(c.width-.035,c.height-.035),new THREE.MeshPhongMaterial({color:faceColor,emissive:faceColor,emissiveIntensity:.7,shininess:110}));mesh.add(face);
   const trim=new THREE.MeshBasicMaterial({color:edgeColor});
   const box=new THREE.BoxGeometry(1,1,1);
   for(const [x,y,w,h] of [[-c.width/2+.025,0,.05,c.height],[c.width/2-.025,0,.05,c.height],[0,-c.height/2+.025,c.width,.05],[0,c.height/2-.025,c.width,.05]]){
    const edge=new THREE.Mesh(box,trim);edge.position.set(x,y,.012);edge.scale.set(w,h,.025);mesh.add(edge);
   }
   if(variant==='solarArrayReflector'||variant==='ancientReflector'){
    const lineMaterial=new THREE.MeshBasicMaterial({color:edgeColor,transparent:true,opacity:.45});
    for(let i=1;i<5;i++){const stripe=new THREE.Mesh(box,lineMaterial);stripe.position.set(-c.width/2+i*c.width/5,0,.015);stripe.scale.set(.018,c.height*.9,.01);mesh.add(stripe);}
    for(let i=1;i<7;i++){const stripe=new THREE.Mesh(box,lineMaterial);stripe.position.set(0,-c.height/2+i*c.height/7,.015);stripe.scale.set(c.width*.9,.014,.01);mesh.add(stripe);}
   }
   if(variant==='lunarDishReflector'){
    const rim=new THREE.Mesh(new THREE.TorusGeometry(Math.min(c.width,c.height)*.4,.05,6,32),new THREE.MeshPhongMaterial({color:bodyColor}));rim.position.z=-.13;mesh.add(rim);
   }
   if(['crystalReflector','energyCrystalReflector','lumaReflector'].includes(variant)){
    const facet=new THREE.Mesh(new THREE.OctahedronGeometry(1,0),new THREE.MeshPhongMaterial({color:bodyColor,shininess:100}));facet.scale.set(c.width*.45,c.height*.45,.15);facet.position.z=-.19;mesh.add(facet);
   }
   // Bracing remains within the solid backing footprint.
   const brace=new THREE.Mesh(box,new THREE.MeshPhongMaterial({color:0x52697d}));brace.scale.set(c.width*.75,.10,.07);brace.position.z=-.12;mesh.add(brace);
   const scan=new THREE.Mesh(new THREE.PlaneGeometry(c.width*.9,.045),new THREE.MeshBasicMaterial({color:0xc3ffff,transparent:true,opacity:.3,depthWrite:false}));scan.position.z=.018;mesh.add(scan);
   const debug=new THREE.ArrowHelper(new THREE.Vector3(0,0,1),new THREE.Vector3(),.8,0xffd966);mesh.add(debug);debug.visible=false;
   this.items.push({config:c,mesh,scan,debug});this.group.add(mesh);
  }this.update(0,false,false);
 }
 update(time:number,reduceMotion:boolean,debugEnabled:boolean):void {
  for(const {config,mesh,scan,debug} of this.items){const {p,n,u,v}=reflectorPose(config,time);
   mesh.position.set(p.x,p.y,p.z);this.matrix.makeBasis(this.u.set(u.x,u.y,u.z),this.v.set(v.x,v.y,v.z),this.n.set(n.x,n.y,n.z));mesh.quaternion.setFromRotationMatrix(this.matrix);
   scan.visible=!reduceMotion;scan.position.y=Math.sin(time*.7)*config.height*.38;debug.visible=debugEnabled;
  }
 }
}
