import {expect, it} from 'vitest';
import * as THREE from 'three';
import {createConveyorAsteroid} from '../src/obstacles/ConveyorAsteroidArt';
import {disposeThreeObject} from '../src/utils/disposeThree';

it('sculpts rock depth while preserving every authoritative XY vertex', () => {
  const reference = new THREE.SphereGeometry(1, 64, 40).getAttribute('position');
  const mesh = createConveyorAsteroid(20);
  const p = mesh.geometry.getAttribute('position');
  let relief = 0;
  for (let i = 0; i < p.count; i++) {
    expect(p.getX(i)).toBe(reference.getX(i));
    expect(p.getY(i)).toBe(reference.getY(i));
    expect(Number.isFinite(p.getZ(i))).toBe(true);
    relief += Math.abs(p.getZ(i) - reference.getZ(i));
  }
  expect(relief).toBeGreaterThan(10);
  expect(mesh.children).toHaveLength(0);
  disposeThreeObject(mesh);
});

it('provides repeatable, distinct crater and mineral patterns', () => {
  const a = createConveyorAsteroid(20), b = createConveyorAsteroid(20), c = createConveyorAsteroid(21);
  expect(a.geometry.getAttribute('position').array).toEqual(b.geometry.getAttribute('position').array);
  expect(a.geometry.getAttribute('position').array).not.toEqual(c.geometry.getAttribute('position').array);
  expect(a.geometry.getAttribute('color').array).not.toEqual(c.geometry.getAttribute('color').array);
  [a,b,c].forEach(disposeThreeObject);
});
