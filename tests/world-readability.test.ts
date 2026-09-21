import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {EnvironmentManager} from '../src/environment/EnvironmentManager';
import {JOURNEY_LOOKS} from '../src/environment/JourneyWorldScene';
import {ShiftingApertureObstacle,apertureState} from '../src/obstacles/ShiftingApertureObstacle';
import {PhaseFieldObstacle} from '../src/obstacles/PhaseFieldObstacle';
import {createReadableBlocker} from '../src/obstacles/ReadableBlockerVisual';
import {getCampaignLevel} from '../src/campaign/levels';
import {disposeThreeObject} from '../src/utils/disposeThree';
describe('world and obstacle readability',()=>{
 it('replaces the active world kit and restores the ordinary environment',()=>{
  const scene=new THREE.Scene(),manager=new EnvironmentManager(scene);
  for(const id of Object.keys(JOURNEY_LOOKS)){
   manager.setEnvironment(id==='sky'?'rooftop':'space',scene);manager.setCampaignLevel(null);manager.setSpaceWorld(id);
   const kits=manager.group.children.filter(o=>o.name.startsWith('world-'));
   expect(kits).toHaveLength(1);expect(kits[0].name).toBe(`world-${id}`);expect(kits[0].visible).toBe(true);
   manager.setSpaceWorld(id);expect(manager.group.children.filter(o=>o.name.startsWith('world-'))).toHaveLength(1);
  }
  manager.setEnvironment('workshop',scene);manager.setSpaceWorld('containment');
  expect(manager.group.children.some(o=>o.name.startsWith('world-'))).toBe(false);
  expect(manager.group.getObjectByName('workshop')!.visible).toBe(true);disposeThreeObject(scene);
 });
 it('keeps the moving aperture clear and updates an existing geometry buffer',()=>{
  const config=getCampaignLevel(121)!.challenge.obstacles.find(o=>o.type==='shiftingAperture')!;
  if(config.type!=='shiftingAperture')throw new Error('Expected aperture');
  const o=new ShiftingApertureObstacle('test');o.applyConfig(config,'space');
  const petal=o.group.getObjectByName('petal-0') as THREE.Mesh;const geometry=petal.geometry;
  for(const t of [0,1,2,3,8]){o.update(.1,t);expect(petal.geometry).toBe(geometry);const p=geometry.attributes.position;expect(Math.hypot(p.getX(0),p.getY(0))).toBeCloseTo(apertureState(config,t).radius,6);}
  expect(o.group.children[0].children.some(o=>o instanceof THREE.Mesh&&o.geometry.type==='CircleGeometry')).toBe(false);disposeThreeObject(o.group);
 });
 it('removes the filled surface when a field is passable',()=>{
  const o=new PhaseFieldObstacle('field');o.applyConfig({type:'phaseField',z:6,centerX:0,centerY:3,fieldRadius:1.8,speed:1,openRatio:.5},'space');
  const disc=o.group.children.find(o=>o instanceof THREE.Mesh&&o.geometry.type==='CircleGeometry')!;
  o.update(0,0);expect(o.open).toBe(true);expect(disc.visible).toBe(false);
  o.update(0,Math.PI*1.5);expect(o.open).toBe(false);expect(disc.visible).toBe(true);disposeThreeObject(o.group);
 });
 it('uses a circular unit collision silhouette for every solid blocker body',()=>{
  for(const kind of ['drone','weight','debris'] as const){const m=createReadableBlocker(kind);m.geometry.computeBoundingSphere();expect(m.geometry.boundingSphere!.radius).toBeCloseTo(1,5);disposeThreeObject(m);}
 });
});
