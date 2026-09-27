import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {createOrbitalIris,layoutOrbitalIris} from '../src/obstacles/OrbitalIrisVisual';
import {evaluateIrisCollision} from '../src/obstacles/ObstacleCollision';
import {disposeObject3D} from '../src/obstacles/RotorGeometry';
import {getCampaignLevel} from '../src/campaign/levels';
import {irisRadiusAt} from '../src/obstacles/IrisObstacle';
describe('orbital iris visible boundary',()=>{
 it('places the shutter and illuminated inner edge at the collision opening throughout its travel',()=>{
  const root=createOrbitalIris();
  const petal=root.getObjectByName('petal-0') as THREE.Mesh;
  const buffer=petal.geometry.attributes.position;
  for(const radius of [.25,.6,1.4,2]){
   layoutOrbitalIris(root,radius);
   expect(petal.geometry.attributes.position).toBe(buffer);
   for(let i=0;i<8;i++){
    const pos=(root.getObjectByName(`petal-${i}`) as THREE.Mesh).geometry.attributes.position;
    for(let j=0;j<=12;j++)expect(Math.hypot(pos.getX(j),pos.getY(j))).toBeCloseTo(radius,6);
   }
   expect(root.getObjectByName('aperture')!.scale.x).toBe(radius);
   expect(evaluateIrisCollision(radius-.22-.001,0,.22,0,0,radius).hit).toBeFalsy();
   expect(evaluateIrisCollision(radius-.22+.001,0,.22,0,0,radius).hit).toBe('iris');
  }
  disposeObject3D(root);
 });
});

describe('upper atmosphere iris teach (L49)', () => {
  it('seals small enough that a center throw can fail', () => {
    const level = getCampaignLevel(49)!;
    const iris = level.challenge.obstacles.find((o) => o.type === 'iris');
    expect(iris?.type).toBe('iris');
    if (!iris || iris.type !== 'iris') return;
    expect(iris.minRadius).toBeLessThan(0.22);
    const cx = iris.centerX ?? 0;
    const cy = iris.centerY ?? 3;
    let hits = 0;
    let clears = 0;
    for (let t = 0; t < 10; t += 0.05) {
      const r = irisRadiusAt(iris, t);
      if (evaluateIrisCollision(cx, cy, 0.22, cx, cy, r).hit) hits++;
      else clears++;
    }
    expect(hits).toBeGreaterThan(0);
    expect(clears).toBeGreaterThan(0);
    // Must not be a free throw — sealed share should be meaningful.
    expect(hits / (hits + clears)).toBeGreaterThan(0.15);
  });
});
