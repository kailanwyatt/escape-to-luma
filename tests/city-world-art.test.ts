import {afterEach,expect,it} from 'vitest';
import * as THREE from 'three';
import {cityLook,createCityWorldArt} from '../src/environment/CityWorldArt';
import {EnvironmentManager} from '../src/environment/EnvironmentManager';
import {setWorldBackdropLoader} from '../src/graphics/WorldBackdrop';
import {disposeThreeObject} from '../src/utils/disposeThree';
afterEach(()=>setWorldBackdropLoader(null));

it('assigns all fifteen city levels to four predictable backgrounds',()=>{
  const ids=Array.from({length:15},(_,i)=>cityLook(16+i).backdrop);
  expect(ids).toEqual([
    ...Array(4).fill('city-sunset'),...Array(4).fill('city-construction'),
    ...Array(4).fill('city-neon-night'),...Array(3).fill('city-rainy'),
  ]);
});

it('loads each matte while retaining the real 3D rooftop',async()=>{
  const loaded:string[]=[];
  setWorldBackdropLoader(async id=>{loaded.push(id);return new THREE.Texture();});
  for(const level of [17,20,24,28]){
    const root=createCityWorldArt(level);await Promise.resolve();
    const matte=root.getObjectByName(`${cityLook(level).backdrop}-distant-matte`)!;
    expect(matte.visible).toBe(true);
    expect(root.children.some(o=>o instanceof THREE.Mesh&&o.rotation.x===-Math.PI/2)).toBe(true);
    disposeThreeObject(root);
  }
  expect(new Set(loaded).size).toBe(4);
});

it('rebuilds on level changes and restores the regular rooftop outside campaign',()=>{
  const scene=new THREE.Scene(),manager=new EnvironmentManager(scene);
  manager.setEnvironment('rooftop',scene);manager.setSpaceWorld('city',17);
  const first=manager.group.getObjectByName('world-city')!;
  manager.setSpaceWorld('city',17);expect(manager.group.getObjectByName('world-city')).toBe(first);
  manager.setSpaceWorld('city',20);
  expect(manager.group.getObjectByName('world-city')!.userData.cityBackdrop).toBe('city-construction');
  expect(manager.group.getObjectByName('chapter-dressing')!.visible).toBe(false);
  manager.setEnvironment('rooftop',scene);manager.setSpaceWorld(null);
  expect(manager.group.getObjectByName('world-city')).toBeUndefined();
  expect(manager.group.getObjectByName('rooftop')!.visible).toBe(true);
  disposeThreeObject(scene);
});

it('uses wider City art for tablet portrait and landscape, and returns to phone art',async()=>{
  setWorldBackdropLoader(async id=>new THREE.Texture({width:id.endsWith('-wide')?1448:941,height:id.endsWith('-wide')?1086:1672} as HTMLImageElement));
  for(const level of [17,20,24,28]){
    const root=createCityWorldArt(level);await Promise.resolve();
    const matte=root.getObjectByName(`${cityLook(level).backdrop}-distant-matte`) as THREE.Mesh;
    for(const aspect of [.75,4/3,.5625]){
      matte.onBeforeRender({} as THREE.WebGLRenderer,new THREE.Scene(),new THREE.PerspectiveCamera(45,aspect),matte.geometry,matte.material as THREE.Material,null as never);
      await Promise.resolve();
      expect(matte.userData.backdrop).toBe(cityLook(level).backdrop+(aspect>=.7?'-wide':''));
    }
    disposeThreeObject(root);
  }
});
