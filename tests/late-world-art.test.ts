import {afterEach,describe,it,expect,vi} from 'vitest';
import * as THREE from 'three';
import {createLateWorldArt} from '../src/environment/LateWorldArt';
import {createWorldBackdrop,setWorldBackdropLoader} from '../src/graphics/WorldBackdrop';
import {disposeThreeObject} from '../src/utils/disposeThree';
afterEach(()=>setWorldBackdropLoader(null));
describe('late world scene ownership',()=>{
  it('keeps static kit draw calls bounded and geometry finite',()=>{
    for(const world of ['nebula','network','homeward'] as const){
      const root=createLateWorldArt(world);let draws=0,vertices=0;
      root.traverse(o=>{if(o instanceof THREE.Mesh){draws++;const p=o.geometry.attributes.position;vertices+=p.count;for(const v of p.array)expect(Number.isFinite(v)).toBe(true);}});
      expect(draws).toBeLessThanOrEqual(6);expect(vertices).toBeLessThan(150000);disposeThreeObject(root);
    }
  });
  it('disposes textures that arrive after leaving the scene',async()=>{
    let resolve!:(t:THREE.Texture)=>void;setWorldBackdropLoader(()=>new Promise(r=>{resolve=r;}));
    const root=createWorldBackdrop('nebula');disposeThreeObject(root);
    const texture=new THREE.Texture(),dispose=vi.spyOn(texture,'dispose');resolve(texture);await Promise.resolve();
    expect(dispose).toHaveBeenCalledOnce();expect(root.visible).toBe(false);
  });
  it('shows a loaded backdrop and disposes it with the scene',async()=>{
    const texture=new THREE.Texture(),dispose=vi.spyOn(texture,'dispose');setWorldBackdropLoader(async()=>texture);
    const root=createWorldBackdrop('network');await Promise.resolve();expect(root.visible).toBe(true);
    disposeThreeObject(root);expect(dispose).toHaveBeenCalledOnce();
  });
});
