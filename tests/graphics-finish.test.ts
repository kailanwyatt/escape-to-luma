import {describe,it,expect,vi} from 'vitest';
import * as THREE from 'three';
import {createWorldGateHousing} from '../src/target/WorldGateHousing';
import {Target} from '../src/target/Target';
import {disposeThreeObject} from '../src/utils/disposeThree';
import {createMoonArt,createSkyClouds} from '../src/environment/SkyMoonArt';

describe('finished scene boundaries and ownership',()=>{
 it('keeps every world housing outside the scoring aperture',()=>{
  for(const world of ['city','ascent','storm','upper_atmosphere','orbit','moon','asteroid_belt','nebula','ancient_network','homeward','luma']){
   const root=createWorldGateHousing(world);let minimum=Infinity;
   root.traverse(o=>{if(o instanceof THREE.Mesh){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)minimum=Math.min(minimum,Math.hypot(p.getX(i),p.getY(i)));}});
   expect(minimum).toBeGreaterThan(1);disposeThreeObject(root);
  }
 });
 it('changes visual worlds without changing the target and releases the old housing',()=>{
  const target=new Target();target.setWorld('moon');const old=target.group.getObjectByName('gate-housing-moon')!;
  const mesh=old.children[0] as THREE.Mesh,dispose=vi.spyOn(mesh.geometry,'dispose');
  const before=[target.x,target.y,target.z,target.radius,...target.group.scale.toArray()];
  target.setWorld('homeward');expect(dispose).toHaveBeenCalledOnce();expect(target.group.getObjectByName('gate-housing-moon')).toBeUndefined();
  expect([target.x,target.y,target.z,target.radius,...target.group.scale.toArray()]).toEqual(before);
  target.setWorld('containment');expect(target.group.getObjectByName('mechanical-outer-ring')!.visible).toBe(true);target.dispose();
 });
 it('uses soft transparent cloud borders and actual crater relief',()=>{
  const clouds=createSkyClouds(),mat=(clouds.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
  const pixels=(mat.map as THREE.DataTexture).image.data as Uint8Array;for(let x=0;x<256;x++)expect(pixels[x*4+3]).toBe(0);
  const moon=createMoonArt(),terrain=moon.getObjectByName('sculpted-crater-terrain') as THREE.Mesh;
  const p=terrain.geometry.attributes.position;let min=Infinity,max=-Infinity;
  for(let i=0;i<p.count;i++){min=Math.min(min,p.getY(i));max=Math.max(max,p.getY(i));}
  expect(max-min).toBeGreaterThan(1);expect(moon.getObjectByName('earth-horizon')).toBeDefined();
  disposeThreeObject(moon);disposeThreeObject(clouds);
 });
});
