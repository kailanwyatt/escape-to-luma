import {it,expect} from 'vitest';
import * as THREE from 'three';
import {ringVolume,spaceFinish,type SpaceFinish} from '../src/obstacles/SpaceSurfaceArt';
it('creates indexed front/back/side ring topology without changing contour count',()=>{
 const g=ringVolume(32);expect(g.getAttribute('position').count).toBe(132);
 expect(g.getAttribute('uv').count).toBe(132);
 expect(Math.max(...g.index!.array)).toBeLessThan(132);g.dispose();
});
it('all surface finishes attach to material color, use the shared clock and leave vertices unchanged',()=>{
 for(const kind of ['current','radiation','magnetic','void','relay','ice','organic','solar','pulse','calm'] as SpaceFinish[]){
  const m=new THREE.MeshBasicMaterial(),time={value:2};spaceFinish(m,kind,time);
  const shader={vertexShader:THREE.ShaderLib.basic.vertexShader,fragmentShader:THREE.ShaderLib.basic.fragmentShader,uniforms:{}};
  m.onBeforeCompile(shader as Parameters<typeof m.onBeforeCompile>[0],{} as THREE.WebGLRenderer);
  expect(shader.uniforms).toHaveProperty('spaceTime',time);
  expect(shader.vertexShader).toContain('#include <begin_vertex>\nspaceP=position;spaceUV=uv;');
  expect(shader.vertexShader).not.toContain('transformed +=');
  expect(shader.fragmentShader).toContain('diffuseColor.rgb');m.dispose();
 }
});
