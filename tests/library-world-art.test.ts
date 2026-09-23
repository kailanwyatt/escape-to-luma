import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {LibraryWorldArt} from '../src/obstacles/LibraryWorldArt';
import type {StoryLibraryConfig} from '../src/obstacles/StoryLibraryObstacle';
import type {LibraryObstacleConfig} from '../src/obstacles/LibraryObstacle';
import {getCampaignLevel} from '../src/campaign/levels';
import {teleportPortalPoseAtTime,solarSailOpen,pulsarBeamOn,sequentialTunnelAtTime} from '../src/obstacles/StoryLibraryState';

describe('world art runtime geometry',()=>{
 for(const level of [9,13,14,17,32,33,70,71,77,78,85,86,92,93,100,101,112,117,118]){
  it(`L${level} reuses geometry with finite transforms across its animation`,()=>{
   const config=getCampaignLevel(level)!.challenge.obstacles[0] as LibraryObstacleConfig|StoryLibraryConfig;
   const art=new LibraryWorldArt(config);
   const first=art.group.children.map(o=>(o as THREE.Mesh).geometry);
   for(const time of [0,.9,1.2,1.4,2.1,4,6]){
    art.update(time);
    expect(art.group.children.map(o=>(o as THREE.Mesh).geometry)).toEqual(first);
    for(const o of art.group.children){
     expect([...o.position.toArray(),...o.scale.toArray()].every(Number.isFinite)).toBe(true);
     const p=(o as THREE.Mesh).geometry.getAttribute('position');
     expect(Array.from(p.array).every(Number.isFinite)).toBe(true);
    }
    if(config.type==='teleportPortal'){
     const s=teleportPortalPoseAtTime(config,time),hole=art.group.getObjectByName('current-aperture')!;
     expect(hole.position.x).toBe(s.x);expect(hole.position.y).toBe(s.y);
     expect(art.group.getObjectByName('next-anchor')!.visible).toBe(s.warning);
     const wall=art.group.getObjectByName('relay-wall')!;art.group.updateMatrixWorld(true);
     const ray=new THREE.Raycaster(new THREE.Vector3(s.x,s.y,-5),new THREE.Vector3(0,0,1));
     expect(ray.intersectObject(wall)).toHaveLength(0);
    }
    if(config.type==='sequentialTunnel')sequentialTunnelAtTime(config,time).forEach((p,i)=>{
     const rim=art.group.getObjectByName('port-'+i) as THREE.Mesh<THREE.BufferGeometry,THREE.MeshBasicMaterial>;
     expect(rim.material.color.getHex()).toBe(p.open?0x92edcf:0x65747e);
    });
    if(config.type==='solarSail')expect(art.group.getObjectByName('clear-line')!.visible).toBe(solarSailOpen(config,time));
    if(config.type==='pulsarBeam')expect(art.group.getObjectByName('radiation')!.visible).toBe(pulsarBeamOn(config,time));
   }
   art.dispose();expect(art.group.children).toHaveLength(0);
  });
 }
});
