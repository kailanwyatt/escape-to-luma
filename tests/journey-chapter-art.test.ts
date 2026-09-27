import {expect,it} from 'vitest';
import * as THREE from 'three';
import {CHAPTER_MOTIFS,createJourneyChapterArt} from '../src/environment/JourneyChapterArt';
import {EnvironmentManager} from '../src/environment/EnvironmentManager';
import {createSpaceScene} from '../src/environment/SpaceScene';
import {disposeThreeObject} from '../src/utils/disposeThree';

it('gives the other nineteen chapters distinct bounded decorative landmarks',()=>{
  expect(Object.keys(CHAPTER_MOTIFS)).toHaveLength(19);
  expect(new Set(Object.values(CHAPTER_MOTIFS)).size).toBe(19);
  for(const id of Object.keys(CHAPTER_MOTIFS)){
    const art=createJourneyChapterArt(id);let draws=0,triangles=0;
    expect(art.userData.decorativeOnly).toBe(true);
    art.traverse(o=>{
      expect('testProjectileCrossing' in o).toBe(false);
      if(!(o instanceof THREE.Mesh))return;
      draws++;const p=o.geometry.getAttribute('position');
      triangles+=(o.geometry.index?.count??p.count)/3;
      for(let i=0;i<p.count;i++){
        expect(Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i))).toBe(true);
      }
    });
    expect(draws).toBeGreaterThan(0);expect(draws).toBeLessThanOrEqual(5);
    expect(triangles).toBeLessThan(24000);disposeThreeObject(art);
  }
});

it('disposes old chapter dressing, reuses same chapter and hides it outside campaign',()=>{
  const scene=new THREE.Scene(),manager=new EnvironmentManager(scene);
  manager.setEnvironment('space',scene);manager.setSpaceWorld('the_machine');
  const previous=manager.group.getObjectByName('chapter-dressing')!;
  let disposed=false;(previous.children[0] as THREE.Mesh).geometry.addEventListener('dispose',()=>{disposed=true;});
  manager.setSpaceWorld('the_machine');expect(manager.group.getObjectByName('chapter-dressing')).toBe(previous);
  manager.setSpaceWorld('luma');expect(disposed).toBe(true);
  expect(manager.group.getObjectByName('chapter-dressing')!.userData.motif).toBe('reunion-grove');
  manager.setEnvironment('space',scene);expect(manager.group.getObjectByName('chapter-dressing')!.visible).toBe(false);
  manager.setSpaceWorld(null);expect(manager.group.getObjectByName('chapter-dressing')).toBeUndefined();
  disposeThreeObject(scene);
});

it('reduces station hardware in atmosphere and removes solar cells in the graveyard',()=>{
  const count=(id:'upper_atmosphere'|'orbit'|'orbital_graveyard')=>{
    const art=createSpaceScene(id);let count=0;
    art.traverse(o=>{if(o instanceof THREE.InstancedMesh)count+=o.count;});
    disposeThreeObject(art);return count;
  };
  const orbit=count('orbit');expect(count('upper_atmosphere')).toBeLessThan(orbit);
  expect(count('orbital_graveyard')).toBeLessThan(orbit);
});
