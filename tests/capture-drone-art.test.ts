import {expect,it} from 'vitest';
import * as THREE from 'three';
import {CaptureDroneArt} from '../src/obstacles/CaptureDroneArt';
import {conveyorGateBlocksAtTime} from '../src/obstacles/ExtendedLibraryState';
import {getCampaignLevel} from '../src/campaign/levels';

it('keeps every drone surface inside its circular collision silhouette throughout patrol and wrap',()=>{
 const c=getCampaignLevel(17)!.challenge.obstacles[0];if(c.type!=='conveyorGate')throw Error('Expected drones');
 const art=new CaptureDroneArt(c),p=new THREE.Vector3();
 for(const t of [0,.5,1,3,7,12,24]){
  art.update(t);art.group.updateMatrixWorld(true);
  conveyorGateBlocksAtTime(c,t).forEach((s,i)=>{
   const hull=art.group.getObjectByName('patrol-hull-'+i)!;
   expect(hull.position.x).toBe(s.x);expect(hull.position.y).toBe(s.y);
   art.group.traverse(o=>{
    if(!(o instanceof THREE.Mesh) || !o.name.endsWith('-'+i) || !o.geometry)return;
    const v=o.geometry.getAttribute('position');
    for(let j=0;j<v.count;j++){
     p.fromBufferAttribute(v,j).applyMatrix4(o.matrixWorld);
     expect(Math.hypot(p.x-s.x,p.y-s.y)).toBeLessThanOrEqual(s.radius+.002);
    }
   });
  });
 }
 art.dispose();expect(art.group.children).toHaveLength(0);
});

it('keeps archived V1 importable for revert',async()=>{
 const {CaptureDroneArtV1}=await import('../src/obstacles/legacy/CaptureDroneArtV1');
 const c=getCampaignLevel(17)!.challenge.obstacles[0];if(c.type!=='conveyorGate')throw Error('Expected drones');
 const art=new CaptureDroneArtV1(c);
 expect(art.group.name).toBe('capture-drone-v1');
 art.dispose();
});
