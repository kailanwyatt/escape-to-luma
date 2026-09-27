import {expect,it} from 'vitest';
import * as THREE from 'three';
import {ContainmentGateArt} from '../src/obstacles/ContainmentGateArt';
import {getCampaignLevel} from '../src/campaign/levels';
import {reactiveGateStateAtTime} from '../src/obstacles/ExtendedLibraryState';

it('keeps every door detail inside the authoritative panels across all phases',()=>{
 const c=getCampaignLevel(10)!.challenge.obstacles[0];if(c.type!=='reactiveGate')throw Error('Expected gate');
 const art=new ContainmentGateArt(c),seen=new Set<string>();
 for(let t=0;t<5;t+=.05){
  art.update(t);art.group.updateMatrixWorld(true);const s=reactiveGateStateAtTime(c,t);seen.add(s.phase);
  [s.leftX,s.rightX].forEach((x,i)=>{
   const door=art.group.getObjectByName('door-'+i)!;
   const body=art.group.getObjectByName('capture-door-'+i)!;
   const b=new THREE.Box3().setFromObject(body);
   expect(b.min.x).toBeCloseTo(x-s.panelWidth/2);expect(b.max.x).toBeCloseTo(x+s.panelWidth/2);
   expect(b.min.y).toBeCloseTo(s.y-s.panelHeight/2);expect(b.max.y).toBeCloseTo(s.y+s.panelHeight/2);
   expect(b.max.z-b.min.z).toBeGreaterThan(.4);
   door.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const d=new THREE.Box3().setFromObject(o);
    // Bevel segments can overhang by a hair; keep decorative mass inside the panel.
    expect(d.min.x).toBeGreaterThanOrEqual(b.min.x-.002);expect(d.max.x).toBeLessThanOrEqual(b.max.x+.002);
    expect(d.min.y).toBeGreaterThanOrEqual(b.min.y-.002);expect(d.max.y).toBeLessThanOrEqual(b.max.y+.002);
    expect(o.material.opacity).toBe(1);
   });
  });
 }
 expect([...seen].sort()).toEqual(['closed','open','warning']);
 const sill=art.group.getObjectByName('floor-sill')!;
 const sillBounds=new THREE.Box3().setFromObject(sill);
 expect(sillBounds.min.y).toBeLessThan(0.25);
 const body=art.group.getObjectByName('capture-door-0') as THREE.Mesh;let disposed=false;
 body.geometry.addEventListener('dispose',()=>{disposed=true;});art.dispose();expect(disposed).toBe(true);expect(art.group.children.length).toBe(0);
});

it('keeps archived V1 importable for revert',async()=>{
 const {ContainmentGateArtV1}=await import('../src/obstacles/legacy/ContainmentGateArtV1');
 const c=getCampaignLevel(10)!.challenge.obstacles[0];if(c.type!=='reactiveGate')throw Error('Expected gate');
 const art=new ContainmentGateArtV1(c);
 expect(art.group.name).toBe('containment-gate-v1');
 art.dispose();
});
