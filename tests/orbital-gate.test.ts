import {describe,it,expect} from 'vitest';
import {createOrbitalGate,layoutOrbitalGate} from '../src/obstacles/OrbitalGateVisual';
import {storyForLevel} from '../src/campaign/StoryMoments';
import {disposeObject3D} from '../src/obstacles/RotorGeometry';
describe('orbital sliding door',()=>{
 it('keeps panels outside the moving opening without coplanar overlap',()=>{
 const g=createOrbitalGate();
 for(const x of [-1,0,1]){
 layoutOrbitalGate(g,x,3,1.6,2.8);
 const l=g.getObjectByName('left')!,r=g.getObjectByName('right')!,t=g.getObjectByName('top')!,b=g.getObjectByName('bottom')!;
 expect(l.position.x+l.scale.x/2).toBeCloseTo(x-.8);
 expect(r.position.x-r.scale.x/2).toBeCloseTo(x+.8);
 expect(t.position.y-t.scale.y/2).toBeCloseTo(4.4);
 expect(b.position.y+b.scale.y/2).toBeCloseTo(1.6);
 expect(l.position.y+l.scale.y/2).toBeCloseTo(t.position.y-t.scale.y/2);
 expect(r.position.y-r.scale.y/2).toBeCloseTo(b.position.y+b.scale.y/2);
 }
 disposeObject3D(g);
 });
 it('explains the iris and climb-ring pair even when individual obstacles and the old arrival were acknowledged',()=>{
 const seen=['arrival.level-57','mechanic.iris.v2','mechanic.movingRing.v2'];
 const story=storyForLevel(57,seen)!;
 expect(story.instruction).toContain('cyan iris');expect(story.instruction).toContain('climbing ring');
 expect(storyForLevel(57,[...seen,story.id,...story.acknowledgements??[]])).toBeNull();
 });
});
