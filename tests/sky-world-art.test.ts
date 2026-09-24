import {afterEach,expect,it,vi} from 'vitest';
import * as THREE from 'three';
import {createWorldBackdrop,setWorldBackdropLoader,backdropForAspect} from '../src/graphics/WorldBackdrop';
import {createSkyWorldArt,skyLook} from '../src/environment/SkyWorldArt';
import {disposeThreeObject} from '../src/utils/disposeThree';
afterEach(()=>setWorldBackdropLoader(null));
const render=(mesh:THREE.Mesh,aspect:number)=>mesh.onBeforeRender({} as THREE.WebGLRenderer,new THREE.Scene(),new THREE.PerspectiveCamera(45,aspect),mesh.geometry,mesh.material as THREE.Material,null as never);
it('selects phone/tablet art by shape and keeps all sky level mappings stable',()=>{
  for(const aspect of [.46,.5625])expect(backdropForAspect('sky-storm','sky-storm-wide',aspect)).toBe('sky-storm');
  for(const aspect of [.75,.834,1,4/3,16/9])expect(backdropForAspect('sky-storm','sky-storm-wide',aspect)).toBe('sky-storm-wide');
  expect(skyLook(false,31).portrait).toBe('sky-storm');expect(skyLook(false,34).portrait).toBe('sky-storm');
  expect(skyLook(false,31).background).toBeLessThan(0x204060);
  expect(skyLook(false,35).portrait).toBe('sky-golden');expect(skyLook(false,38).portrait).toBe('sky-golden');
  expect(skyLook(true,39).portrait).toBe('sky-storm');
});
it('switches on rotation, disposes the previous texture, and uses undistorted cover crops',async()=>{
  const textures:THREE.Texture[]=[];
  setWorldBackdropLoader(async id=>{
    const t=new THREE.Texture({width:id.endsWith('wide')?1448:941,height:id.endsWith('wide')?1086:1672} as HTMLImageElement);
    textures.push(t);return t;
  });
  const mesh=createWorldBackdrop('sky-storm','sky-storm-wide');await Promise.resolve();
  const dispose=vi.spyOn(textures[0],'dispose');render(mesh,4/3);await Promise.resolve();render(mesh,4/3);
  expect(mesh.userData.backdrop).toBe('sky-storm-wide');expect(dispose).toHaveBeenCalledOnce();
  expect(textures[1].repeat.x).toBeCloseTo(1);expect(textures[1].repeat.y).toBeCloseTo(1);
  render(mesh,.5625);await Promise.resolve();expect(mesh.userData.backdrop).toBe('sky-storm');
  disposeThreeObject(mesh);
});
it('keeps reduced-motion mist stationary and never moves it into the central lane',()=>{
  const root=createSkyWorldArt(false,33);
  expect(root.userData.skyNight).toBe(true);
  expect(root.userData.skyBackdrop).toBe('sky-storm');
  root.userData.updateAtmosphere(7,false);
  root.traverse(o=>{if(o.name==='sky-edge-mist'){
    const m=(o as THREE.Mesh).material as THREE.ShaderMaterial;
    expect(m.uniforms.time.value).toBe(7);expect(Math.abs(o.position.x)).toBe(14);
  }});
  root.userData.updateAtmosphere(10,true);
  const mist=root.getObjectByName('sky-edge-mist') as THREE.Mesh;
  expect((mist.material as THREE.ShaderMaterial).uniforms.time.value).toBe(0);
  disposeThreeObject(root);
});
