import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {breachBoundary,breachClearance,VESSEL} from '../src/obstacles/BreachBoundary';
import {createGateVisual,layoutGateVisual} from '../src/obstacles/ObstacleVisuals';
import {SlidingGateObstacle} from '../src/obstacles/SlidingGateObstacle';
import {createContainmentVessel} from '../src/scene/ContainmentVessel';
import {GAME_TUNING} from '../src/game/gameTuning';
describe('physical containment breach',()=>{
  it('uses every authored fracture edge as the visible glass thickness',()=>{
    const group=createGateVisual('workshop','containmentGlass');
    layoutGateVisual(group,0,3,1.72,2.65);
    const points=breachBoundary(0,3,1.72,2.65);
    const rim=group.getObjectByName('fracture-thickness') as THREE.Mesh;
    const positions=rim.geometry.getAttribute('position');
    points.forEach(([x,y],i)=>{expect(positions.getX(i*6)).toBeCloseTo(x);expect(positions.getY(i*6)).toBeCloseTo(y);});
    expect(group.getObjectByName('edgeLeft')).toBeUndefined();
    const pane=group.getObjectByName('fractured-pane') as THREE.Mesh;
    const geometry=pane.geometry;
    layoutGateVisual(group,0,3,1.72,2.65);expect(pane.geometry).toBe(geometry);
  });
  it('agrees between prediction and actual crossings, including concave shard edges',()=>{
    const obstacle=new SlidingGateObstacle('breach');
    obstacle.applyConfig({type:'slidingGate',z:5.75,baseX:0,baseY:3,openingWidth:1.72,openingHeight:2.65,amplitude:0,speed:0,appearance:'containmentGlass'},'workshop');
    const predicted=obstacle.predictState(0,0);
    for(let x=-1.3;x<=1.3;x+=.13) for(let y=1.2;y<4.8;y+=.18){
      const expected=breachClearance(x,y,.22,0,3,1.72,2.65)<0;
      expect(!!obstacle.evaluateAt(x,y,.22,predicted).hit).toBe(expected);
      expect(!!obstacle.testProjectileCrossing(new THREE.Vector3(x,y,5.5),new THREE.Vector3(x,y,6),.22)?.hit).toBe(expected);
    }
    expect(breachClearance(0,3,.22,0,3,1.72,2.65)).toBeGreaterThan(.5);
  });
  it('has no visible glass inside the collision opening and no invisible hole outside it',()=>{
    const group=createGateVisual('workshop','containmentGlass');layoutGateVisual(group,0,3,1.72,2.65);
    const pane=group.getObjectByName('fractured-pane') as THREE.Mesh;group.updateMatrixWorld(true);
    const ray=new THREE.Raycaster();
    for(let x=-1.4;x<1.4;x+=.17) for(let y=1.2;y<4.8;y+=.19){
      ray.set(new THREE.Vector3(x,y,-1),new THREE.Vector3(0,0,1));
      const visibleGlass=ray.intersectObject(pane).length>0;
      expect(visibleGlass).toBe(breachClearance(x,y,0,0,3,1.72,2.65)<0);
    }
  });
  it('contains Spark and the gameplay camera inside the chamber footprint',()=>{
    const [x,,z]=GAME_TUNING.camera.position;
    expect(Math.abs(x)).toBeLessThan(VESSEL.halfWidth);
    expect(z).toBeGreaterThan(VESSEL.rearZ+.65);expect(z).toBeLessThan(VESSEL.frontZ);
    const vessel=createContainmentVessel();
    const bounds=new THREE.Box3().setFromObject(vessel);
    expect(bounds.max.z).toBeGreaterThanOrEqual(VESSEL.frontZ);
    expect(bounds.min.z).toBeLessThan(z);
  });
});
