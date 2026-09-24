import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {LibraryWorldArt} from '../src/obstacles/LibraryWorldArt';
import type {StoryLibraryConfig} from '../src/obstacles/StoryLibraryObstacle';
import type {LibraryObstacleConfig} from '../src/obstacles/LibraryObstacle';
import {getCampaignLevel} from '../src/campaign/levels';
import {pulsarBeamOn,sequentialTunnelAtTime} from '../src/obstacles/StoryLibraryState';

describe('world art runtime geometry',()=>{
 for(const level of [9,13,14,17,32,71,77,78,86,93,100,112,118]){
  it(`L${level} reuses geometry with finite transforms across its animation`,()=>{
   const config=getCampaignLevel(level)!.challenge.obstacles[0] as LibraryObstacleConfig|StoryLibraryConfig;
   const art=new LibraryWorldArt(config);
   const meshes=()=>{const out:THREE.Mesh[]=[];art.group.traverse(o=>{if(o instanceof THREE.Mesh)out.push(o);});return out;};
   const first=meshes().map(m=>m.geometry);
   for(const time of [0,.9,1.2,1.4,2.1,4,6]){
    art.update(time);
    expect(meshes().map(m=>m.geometry)).toEqual(first);
    for(const o of art.group.children){
     expect([...o.position.toArray(),...o.scale.toArray()].every(Number.isFinite)).toBe(true);
    }
    for(const m of meshes()){
     expect([...m.position.toArray(),...m.scale.toArray()].every(Number.isFinite)).toBe(true);
     const p=m.geometry.getAttribute('position');
     expect(Array.from(p.array).every(Number.isFinite)).toBe(true);
    }
    if(config.type==='sequentialTunnel')sequentialTunnelAtTime(config,time).forEach((p,i)=>{
     const rim=art.group.getObjectByName('port-'+i) as THREE.Mesh<THREE.BufferGeometry,THREE.MeshBasicMaterial>;
     expect(rim.material.color.getHex()).toBe(p.open?0x92edcf:0x65747e);
    });
    if(config.type==='pulsarBeam')expect(art.group.getObjectByName('radiation')!.visible).toBe(pulsarBeamOn(config,time));
   }
   art.dispose();expect(art.group.children).toHaveLength(0);
  });
 }
});
