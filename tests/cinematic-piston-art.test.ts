import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { CinematicPistonArt } from '../src/obstacles/CinematicPistonArt';
import { getCampaignLevel } from '../src/campaign/levels';
import { pistonFieldStateAtTime } from '../src/obstacles/PistonFieldState';

describe('cinematic piston presentation', () => {
  it('keeps contact shading below the collider floor and releases finish textures', () => {
    const art = new CinematicPistonArt();
    const c = getCampaignLevel(6)!.challenge.obstacles[0];
    if (c.type !== 'pistonField') throw new Error('Expected piston');
    const s = pistonFieldStateAtTime(c, 2)[1]; art.update(s);
    art.group.updateMatrixWorld(true);
    const shadow = art.group.getObjectByName('floor-contact-shadow') as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
    expect(new THREE.Box3().setFromObject(shadow).max.y).toBeLessThan(s.floorY);
    expect(shadow.material.transparent).toBe(true);
    expect(shadow.material.depthWrite).toBe(false);
    const shaft = art.group.getObjectByName('brushed-sliding-face') as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
    expect(shaft.material.customProgramCacheKey()).toBe('piston-finish-v1-steel');
    const env = shaft.material.envMap!;
    const brush = shaft.material.bumpMap!;
    let count = 0;
    env.addEventListener('dispose', () => { count++; });
    brush.addEventListener('dispose', () => { count++; });
    art.dispose(); expect(count).toBe(2);
  });
  it('keeps the solid silhouette on the authoritative floor and tip through a full cycle', () => {
    const c = getCampaignLevel(6)!.challenge.obstacles[0];
    if (c.type !== 'pistonField') throw new Error('Expected L6 piston');
    const art = new CinematicPistonArt();
    const body = art.group.getObjectByName('solid-envelope') as THREE.Mesh;
    const geometry = body.geometry;
    for (let t = 0; t < 9; t += .1) {
      const s = pistonFieldStateAtTime(c, t)[1]; art.update(s);
      art.group.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(body);
      expect(bounds.min.x).toBeCloseTo(s.x - s.width / 2);
      expect(bounds.max.x).toBeCloseTo(s.x + s.width / 2);
      expect(bounds.min.y).toBeCloseTo(s.floorY);
      expect(bounds.max.y).toBeCloseTo(s.top);
      expect(bounds.max.z - bounds.min.z).toBeGreaterThan(.5);
      expect(body.geometry).toBe(geometry);
      art.group.traverse(o => {
        if (!(o instanceof THREE.Mesh) || o.name.startsWith('socket') || o.name.startsWith('floor-')) return;
        const b = new THREE.Box3().setFromObject(o);
        expect(b.max.y).toBeLessThanOrEqual(s.top + .0001);
        expect(b.min.x).toBeGreaterThanOrEqual(s.x - s.width / 2 - .0001);
        expect(b.max.x).toBeLessThanOrEqual(s.x + s.width / 2 + .0001);
      });
    }
    let disposed = false; geometry.addEventListener('dispose', () => { disposed = true; });
    art.dispose(); expect(disposed).toBe(true); expect(art.group.children).toHaveLength(0);
  });
});
