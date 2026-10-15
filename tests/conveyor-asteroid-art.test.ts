import {expect, it} from 'vitest';
import * as THREE from 'three';
import {createAsteroidGeometry} from '../src/environment/AsteroidGeometry';
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
  const a = createConveyorAsteroid(2.1), b = createConveyorAsteroid(2.1), c = createConveyorAsteroid(2.81);
  expect(a.geometry.getAttribute('position').array).toEqual(b.geometry.getAttribute('position').array);
  expect(a.geometry.getAttribute('position').array).not.toEqual(c.geometry.getAttribute('position').array);
  expect(a.geometry.getAttribute('color').array).not.toEqual(c.geometry.getAttribute('color').array);
  [a,b,c].forEach(disposeThreeObject);
});

it('keeps sculpted normals finite and joins lighting across spherical UV seams', () => {
  for (const seed of [771, 908, 1002, 1003]) {
    const geometry = createAsteroidGeometry(seed, 32, 22);
    const normal = geometry.getAttribute('normal'), position = geometry.getAttribute('position');
    for (let i = 0; i < normal.count; i++) {
      expect(Math.hypot(normal.getX(i), normal.getY(i), normal.getZ(i))).toBeCloseTo(1, 5);
      expect(Math.hypot(position.getX(i), position.getY(i), position.getZ(i))).toBeLessThan(1.6);
    }
    for (let row = 0; row <= 22; row++) {
      const a = row * 33, b = a + 32;
      expect([normal.getX(a), normal.getY(a), normal.getZ(a)]).toEqual([normal.getX(b), normal.getY(b), normal.getZ(b)]);
    }
    geometry.dispose();
  }
});
