import {it,expect} from 'vitest';
import * as THREE from 'three';
import {FacilityClockArt} from '../src/obstacles/FacilityClockArt';
import {clockHandsStateAtTime,evaluateClockHandsCollision} from '../src/obstacles/ClockHandsState';
import {getCampaignLevel} from '../src/campaign/levels';

it('keeps scanner geometry within the rotating capsule and hub silhouettes',()=>{
 const c=getCampaignLevel(14)!.challenge.obstacles[0];if(c.type!=='clockHands')throw Error('Expected clock');
 const art=new FacilityClockArt(c),p=new THREE.Vector3();
 for(const t of [0,.4,1.3,3,5,9]){
  art.update(t);art.group.updateMatrixWorld(true);
  clockHandsStateAtTime(c,t).hands.forEach((h,i)=>{
   const tip=art.group.getObjectByName('end-optic-'+i)!;
   expect(tip.position.x).toBeCloseTo(h.tipX);expect(tip.position.y).toBeCloseTo(h.tipY);
  });
  art.group.traverse(o=>{
   if(!(o instanceof THREE.Mesh) || !o.geometry)return;
   const v=o.geometry.getAttribute('position');
   for(let j=0;j<v.count;j++){
    p.fromBufferAttribute(v,j).applyMatrix4(o.matrixWorld);
    expect(evaluateClockHandsCollision(c,t,p.x,p.y,0).clearance).toBeLessThanOrEqual(.002);
   }
  });
 }
 art.dispose();expect(art.group.children).toHaveLength(0);
});

it('keeps archived V1 importable for revert',async()=>{
 const {FacilityClockArtV1}=await import('../src/obstacles/legacy/FacilityClockArtV1');
 const c=getCampaignLevel(14)!.challenge.obstacles[0];if(c.type!=='clockHands')throw Error('Expected clock');
 const art=new FacilityClockArtV1(c);
 expect(art.group.name).toBe('facility-clock-v1');
 art.dispose();
});
