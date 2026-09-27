import {expect,it} from 'vitest';
import * as THREE from 'three';
import {FacilityShutterArt} from '../src/obstacles/FacilityShutterArt';
import {splitShutterStateAtTime} from '../src/obstacles/ExtendedLibraryState';
import {getCampaignLevel} from '../src/campaign/levels';

it('matches moving shutter bounds without details entering the safe gap',()=>{
 const c=getCampaignLevel(13)!.challenge.obstacles[0];if(c.type!=='splitShutter')throw Error('Expected shutter');
 const art=new FacilityShutterArt(c);
 for(let t=0;t<9;t+=.15){
  art.update(t);art.group.updateMatrixWorld(true);const s=splitShutterStateAtTime(c,t);
  [s.leftX,s.rightX].forEach((x,i)=>{
   const leaf=art.group.getObjectByName('leaf-'+i)!;
   const body=art.group.getObjectByName('shutter-body-'+i)!;
   const b=new THREE.Box3().setFromObject(body);
   expect(b.min.x).toBeCloseTo(x-c.panelWidth/2);expect(b.max.x).toBeCloseTo(x+c.panelWidth/2);
   expect(b.min.y).toBeCloseTo(s.y-s.height/2);expect(b.max.y).toBeCloseTo(s.y+s.height/2);
   expect(b.max.z-b.min.z).toBeGreaterThan(.4);
   leaf.traverse(o=>{
    if(!(o instanceof THREE.Mesh))return;
    const d=new THREE.Box3().setFromObject(o);
    // Bevel segments can overhang by a hair; keep decorative mass inside the panel.
    expect(d.min.x).toBeGreaterThanOrEqual(b.min.x-.002);expect(d.max.x).toBeLessThanOrEqual(b.max.x+.002);
    expect(d.min.y).toBeGreaterThanOrEqual(b.min.y-.002);expect(d.max.y).toBeLessThanOrEqual(b.max.y+.002);
    expect(o.material.opacity).toBe(1);
   });
  });
 }
 const sill=art.group.getObjectByName('floor-sill')!;
 expect(new THREE.Box3().setFromObject(sill).min.y).toBeLessThan(0.25);
 const body=art.group.getObjectByName('shutter-body-0') as THREE.Mesh;let disposed=false;
 body.geometry.addEventListener('dispose',()=>{disposed=true;});art.dispose();expect(disposed).toBe(true);expect(art.group.children).toHaveLength(0);
});

it('keeps archived V1 importable for revert',async()=>{
 const {FacilityShutterArtV1}=await import('../src/obstacles/legacy/FacilityShutterArtV1');
 const c=getCampaignLevel(13)!.challenge.obstacles[0];if(c.type!=='splitShutter')throw Error('Expected shutter');
 const art=new FacilityShutterArtV1(c);
 expect(art.group.name).toBe('facility-shutter-v1');
 art.dispose();
});
