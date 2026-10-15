import {expect,it} from 'vitest';
import * as THREE from 'three';
import {createAsteroidBeltArt} from '../src/environment/AsteroidBeltArt';
import {disposeThreeObject} from '../src/utils/disposeThree';

it('uses batched distant decoration with bounded draw calls and no lights or collision owners',()=>{
  const root=createAsteroidBeltArt(95);let draws=0,triangles=0;
  root.traverse(o=>{
    if(o instanceof THREE.Mesh||o instanceof THREE.Points){
      draws++;
      if(o instanceof THREE.Mesh)triangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3*(o instanceof THREE.InstancedMesh?o.count:1);
    }
    expect(o instanceof THREE.Light).toBe(false);
    expect('testProjectileCrossing' in o).toBe(false);
  });
  expect(draws).toBeLessThanOrEqual(16);expect(triangles).toBeLessThan(65000);
  const stream=root.getObjectByName('belt-distant-stream')!.children as THREE.InstancedMesh[];
  expect(stream.reduce((sum,batch)=>sum+batch.count,0)).toBe(360);
  expect(new Set(stream.map(batch=>batch.geometry.userData.asteroidShape)).size).toBe(4);
  expect(new Set(stream.map(batch=>batch.geometry.userData.asteroidFamily)).size).toBe(4);
  expect(stream.every(batch=>batch.instanceColor!==null)).toBe(true);
  expect(root.userData.decorativeOnly).toBe(true);disposeThreeObject(root);
});

it('keeps near decoration at the edges and restores reduced-motion positions',()=>{
  const root=createAsteroidBeltArt();
  const mid=root.getObjectByName('belt-midground-rocks')!;
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3();
  for(const batch of mid.children as THREE.InstancedMesh[])for(let i=0;i<batch.count;i++){
    batch.getMatrixAt(i,matrix);position.setFromMatrixPosition(matrix);
    expect(Math.abs(position.x)).toBeGreaterThanOrEqual(6);expect(position.z).toBeGreaterThanOrEqual(25);
  }
  for(const o of root.children.filter(o=>o.name==='belt-foreground-edge'))expect(Math.abs(o.position.x)).toBe(5.5);
  root.userData.updateAtmosphere(100,false);expect(mid.position.y).not.toBe(0);
  root.userData.updateAtmosphere(100,true);expect(mid.position.y).toBe(0);
  const edges=root.children.filter(o=>o.name==='belt-foreground-edge');
  const rotations=edges.map(o=>o.rotation.toArray());
  root.userData.updateAtmosphere(200,true);expect(edges.map(o=>o.rotation.toArray())).toEqual(rotations);
  disposeThreeObject(root);
});

it('varies decoration by level reproducibly without allocating per frame',()=>{
  const a=createAsteroidBeltArt(95),b=createAsteroidBeltArt(95),c=createAsteroidBeltArt(96);
  const stream=(g:THREE.Group)=>(g.getObjectByName('belt-distant-stream')!.children[0] as THREE.InstancedMesh).instanceMatrix.array;
  expect(stream(a)).toEqual(stream(b));expect(stream(a)).not.toEqual(stream(c));
  const original=stream(a);a.userData.updateAtmosphere(10,false);expect(stream(a)).toBe(original);
  [a,b,c].forEach(disposeThreeObject);
});
