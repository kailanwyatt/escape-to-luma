import * as THREE from 'three';
import {RotorObstacle} from '../src/obstacles/RotorObstacle';
import {WORLD_ROTOR_VARIANTS} from '../src/campaign/RotorWorldVariants';
import {GAME_TUNING} from '../src/game/gameTuning';
import {disposeObject3D} from '../src/obstacles/RotorGeometry';
const app=document.getElementById('gallery')!;
const focus=document.getElementById('focus') as HTMLSelectElement;
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));document.body.appendChild(renderer.domElement);
const silhouette=new THREE.MeshBasicMaterial({color:0x101820});
const entries=Object.entries(WORLD_ROTOR_VARIANTS).map(([world,variant])=>{
 const option=document.createElement('option');option.value=world;option.textContent=world;focus.appendChild(option);
 const card=document.createElement('section');card.dataset.world=world;card.innerHTML=`<h2>${world}</h2><p>${variant}</p><div class="view"></div>`;app.appendChild(card);
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x253445);scene.add(new THREE.AmbientLight(0xcbdfff,1.3));
 const key=new THREE.DirectionalLight(0xffe0b5,2);key.position.set(-3,7,-5);scene.add(key);
 const rotor=new RotorObstacle(world);scene.add(rotor.group);
 const camera=new THREE.PerspectiveCamera(GAME_TUNING.camera.fov,1,.1,80);camera.position.fromArray(GAME_TUNING.camera.position);camera.lookAt(...GAME_TUNING.camera.lookAt);
 return {scene,rotor,camera,variant,view:card.querySelector('.view')!};
});
function configure(){
 app.classList.toggle('focused',focus.value!=='all');
 app.querySelectorAll<HTMLElement>('section').forEach(card=>{card.hidden=focus.value!=='all'&&card.dataset.world!==focus.value;});
 const count=Number((document.getElementById('arms') as HTMLSelectElement).value);
 const speed=Number((document.getElementById('speed') as HTMLSelectElement).value);
 const direction=Number((document.getElementById('direction') as HTMLSelectElement).value) as 1|-1;
 const z=Number((document.getElementById('depth') as HTMLSelectElement).value);
 const black=(document.getElementById('silhouette') as HTMLInputElement).checked;
 for(const e of entries){e.rotor.applyConfig({bladeCount:count,rotationSpeed:speed,direction,z,initialRotation:Math.PI/2,visualVariant:e.variant},'workshop');e.scene.overrideMaterial=black?silhouette:null;}
}
document.querySelectorAll('select,input').forEach(e=>e.addEventListener('change',configure));configure();
let last=performance.now(),time=0;
renderer.setAnimationLoop(now=>{
 const dt=Math.min((now-last)/1000,.05);last=now;time+=dt;
 renderer.setSize(innerWidth,innerHeight,false);renderer.setScissorTest(false);renderer.clear();renderer.setScissorTest(true);
 for(const e of entries){e.rotor.update(dt,time);const r=e.view.getBoundingClientRect();if(r.width===0||r.bottom<0||r.top>innerHeight)continue;
 e.camera.aspect=r.width/r.height;e.camera.updateProjectionMatrix();renderer.setViewport(r.left,innerHeight-r.bottom,r.width,r.height);renderer.setScissor(r.left,innerHeight-r.bottom,r.width,r.height);renderer.render(e.scene,e.camera);}
});
window.addEventListener('pagehide',()=>{renderer.setAnimationLoop(null);for(const e of entries)disposeObject3D(e.scene);silhouette.dispose();renderer.dispose();});
