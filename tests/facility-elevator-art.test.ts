import {expect,it} from 'vitest';
import * as THREE from 'three';
import {FacilityElevatorArt} from '../src/obstacles/FacilityElevatorArt';
import {elevatorBlocksStateAtTime} from '../src/obstacles/ElevatorBlocksState';
import {getCampaignLevel} from '../src/campaign/levels';

it('keeps opaque carriage details within moving collision bounds',()=>{
 const c=getCampaignLevel(9)!.challenge.obstacles[0];if(c.type!=='elevatorBlocks')throw Error('Expected elevator');
 const art=new FacilityElevatorArt(c);
 for(let t=0;t<8;t+=.2){
  art.update(t);art.group.updateMatrixWorld(true);
  elevatorBlocksStateAtTime(c,t).forEach((s,i)=>{
   const carriage=art.group.getObjectByName('carriage-'+i)!;
   const body=art.group.getObjectByName('carriage-body-'+i)!;
   const bounds=new THREE.Box3().setFromObject(body);
   expect(bounds.min.x).toBeCloseTo(s.x-s.width/2);expect(bounds.max.y).toBeCloseTo(s.y+s.height/2);
   expect(bounds.max.z-bounds.min.z).toBeGreaterThan(.4);
   carriage.traverse(o=>{
    if(!(o instanceof THREE.Mesh))return;
    const b=new THREE.Box3().setFromObject(o);
    expect(b.min.x).toBeGreaterThanOrEqual(s.x-s.width/2-.002);expect(b.max.x).toBeLessThanOrEqual(s.x+s.width/2+.002);
    expect(b.min.y).toBeGreaterThanOrEqual(s.y-s.height/2-.002);expect(b.max.y).toBeLessThanOrEqual(s.y+s.height/2+.002);
    expect(o.material.opacity).toBe(1);
   });
  });
 }
 const foot=art.group.getObjectByName('shaft-foot-0')!;
 expect(new THREE.Box3().setFromObject(foot).min.y).toBeLessThan(0.2);
 const body=art.group.getObjectByName('carriage-body-0') as THREE.Mesh;let disposed=false;
 body.geometry.addEventListener('dispose',()=>{disposed=true;});art.dispose();expect(disposed).toBe(true);expect(art.group.children).toHaveLength(0);
});

it('keeps archived V1 importable for revert',async()=>{
 const {FacilityElevatorArtV1}=await import('../src/obstacles/legacy/FacilityElevatorArtV1');
 const c=getCampaignLevel(9)!.challenge.obstacles[0];if(c.type!=='elevatorBlocks')throw Error('Expected elevator');
 const art=new FacilityElevatorArtV1(c);
 expect(art.group.name).toBe('facility-elevator-v1');
 art.dispose();
});
