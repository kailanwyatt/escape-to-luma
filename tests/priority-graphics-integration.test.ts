import { describe, expect, it, vi } from 'vitest';
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
import * as THREE from 'three';
import { getCampaignLevel } from '../src/campaign/levels';
import { NullLashArt } from '../src/obstacles/NullLashArt';
import { TheNullArt } from '../src/obstacles/TheNullArt';
import { nullLashStateAtTime, nullLashCenterline, evaluateNullLashCollision } from '../src/obstacles/NullLashState';
import { theNullSafeAtTime } from '../src/obstacles/StoryLibraryState';
import { DockingCollarArt } from '../src/obstacles/DockingCollarArt';
import { dockingCollarStateAtTime } from '../src/obstacles/DockingCollarState';
import { createMovingRingMechanism } from '../src/obstacles/MovingRingMechanism';
import { layoutRingVisual } from '../src/obstacles/ObstacleVisuals';
import { createConveyorAsteroid } from '../src/obstacles/ConveyorAsteroidArt';
import { createChapterLandmarkWorld, LANDMARK_WORLDS, type LandmarkWorld } from '../src/environment/ChapterLandmarkWorld';
import { EnvironmentManager } from '../src/environment/EnvironmentManager';
import { disposeThreeObject } from '../src/utils/disposeThree';
import { MovingSafeZoneArt } from '../src/obstacles/MovingSafeZoneArt';

function first(level: number) { return getCampaignLevel(level)!.challenge.obstacles[0]; }

describe('integrated priority artwork', () => {
  it('uses the same continuous lash curve for the visible skin and active hits', () => {
    const config = first(112); if (config.type !== 'nullLash') throw Error('Expected lash');
    const art = new NullLashArt(config), buffer = art.surface.attributes.position;
    for (let t = 0; t < 4; t += .08) {
      art.update(t); const state = nullLashStateAtTime(config, t);
      for (const u of [.25, .5, .75, 1]) {
        const center = nullLashCenterline(config, t, u, state.extension, state.angle);
        const row = Math.round(u * 96), vertex = row * 15;
        const x = (buffer.getX(vertex) + buffer.getX(vertex + 7)) * .5 + config.pivotX;
        const y = (buffer.getY(vertex) + buffer.getY(vertex + 7)) * .5 + config.pivotY;
        expect(x).toBeCloseTo(center.x, 5); expect(y).toBeCloseTo(center.y, 5);
        if (!['coiled', 'warning'].includes(state.phase)) expect(evaluateNullLashCollision(config, t, center.x, center.y, .05).hit).toBe(true);
      }
    }
    for (const boundary of [.48, .74, .94, 1.69, 2.07]) {
      const a = nullLashStateAtTime(config, (boundary - .000001) / config.speed), b = nullLashStateAtTime(config, (boundary + .000001) / config.speed);
      expect(Math.abs(a.angle - b.angle)).toBeLessThan(.001); expect(Math.abs(a.extension - b.extension)).toBeLessThan(.001);
    }
    expect(art.surface.attributes.position).toBe(buffer); art.dispose();
  });
  it('keeps nonzero encounter centers and the authored opening aligned', () => {
    const c = first(113); if (c.type !== 'theNull') throw Error('Expected Null');
    const config = { ...c, centerX: 2, centerY: 4, baseX: 2, baseY: 4 }, art = new TheNullArt(config);
    for (const t of [0, 1, 5, 12]) {
      art.update(t); const safe = theNullSafeAtTime(config, t);
      expect(art.hole.value.x + art.group.position.x).toBeCloseTo(safe.x);
      expect(art.hole.value.y + art.group.position.y).toBeCloseTo(safe.y);
      expect(art.hole.value.z).toBe(safe.radius);
    }
    art.dispose(); expect(art.group.children).toHaveLength(0);
  });
  it('animates the docking opening exactly without rebuilding GPU buffers', () => {
    const c = first(48); if (c.type !== 'dockingCollar') throw Error('Expected collar');
    const art = new DockingCollarArt(c), jaw = art.group.getObjectByName('jaw-left') as THREE.Mesh, geo = jaw.geometry;
    for (let t = 0; t < 3; t += .025) {
      art.update(t); expect(jaw.geometry).toBe(geo);
      expect(Math.hypot(geo.attributes.position.getX(0), geo.attributes.position.getY(0))).toBeCloseTo(Math.max(.001, dockingCollarStateAtTime(c, t).openingRadius), 5);
    }
    art.dispose();
  });
  it('gives ring motions different mechanisms without intruding into the opening', () => {
    const signatures = new Set();
    for (const kind of ['horizontal', 'vertical', 'ellipse'] as const) {
      const art = createMovingRingMechanism('space', kind); signatures.add(art.userData.mechanism);
      for (const r of [.8, 1.4]) {
        layoutRingVisual(art, r); art.userData.updateMechanism?.(3); art.updateMatrixWorld(true);
        const point = new THREE.Vector3();
        art.getObjectByName('gate-hardware')!.traverse(o => {
          if (!(o instanceof THREE.Mesh)) return;
          const p = o.geometry.attributes.position;
          for (let i = 0; i < p.count; i++) { point.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); expect(Math.hypot(point.x, point.y)).toBeGreaterThanOrEqual(r - .00001); }
        });
      }
      disposeThreeObject(art); art.userData.kit.dispose();
    }
    expect(signatures.size).toBe(3);
  });
  it('contains fractured rock silhouettes within their collision circle', () => {
    for (const seed of [1.7, 2.43, 6.4, 8.22]) {
      const rock = createConveyorAsteroid(seed, 'shard'), p = rock.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) expect(Math.hypot(p.getX(i), p.getY(i))).toBeLessThanOrEqual(1.00001);
      disposeThreeObject(rock);
    }
  });
  it('keeps the wreck passage empty and removes the duplicate foreground planet', () => {
    const c = first(71); if (c.type !== 'movingSafeZone') throw Error('Expected wreck field');
    const art = new MovingSafeZoneArt(c); art.update(2);
    expect(art.group.getObjectByName('wreck-earth-accent')).toBeUndefined();
    expect(art.group.getObjectByName('wreck-safe-boundary')).toBeTruthy();
    const debris = art.group.getObjectByName('wreck-box-debris') as THREE.InstancedMesh;
    const center = new THREE.Vector3(), scale = new THREE.Vector3(), q = new THREE.Quaternion(), m = new THREE.Matrix4();
    const { openingX: x, openingY: y, holeRadius: r } = art.group.userData;
    for (let i = 0; i < debris.count; i++) { debris.getMatrixAt(i, m); if (m.determinant() === 0) continue; m.decompose(center, q, scale); if (scale.length() < .001) continue; expect(Math.hypot(center.x - x, center.y - y) - scale.length() * .5, JSON.stringify({i,center: center.toArray(),scale:scale.toArray(),x,y,r})).toBeGreaterThanOrEqual(r - .001); }
    art.dispose();
  });
  it('bounds chapter render cost and respects reduced motion', () => {
    const signatures = new Set();
    for (const world of LANDMARK_WORLDS) {
      const art = createChapterLandmarkWorld(world as LandmarkWorld, 148); signatures.add(art.userData.landmark);
      let draws = 0, triangles = 0;
      art.traverse(o => { if (o instanceof THREE.Mesh) { draws++; triangles += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3 * (o instanceof THREE.InstancedMesh ? o.count : 1); } });
      expect(draws).toBeLessThan(20); expect(triangles).toBeLessThan(100_000);
      art.userData.updateAtmosphere(3, true); const a = art.children.map(o => o.rotation.toArray());
      art.userData.updateAtmosphere(8, true); expect(art.children.map(o => o.rotation.toArray())).toEqual(a);
      disposeThreeObject(art);
    }
    expect(signatures.size).toBe(5);
  });
  it('releases the Null sky on chapter exit and advances the final planet reveal', () => {
    const scene = new THREE.Scene(), env = new EnvironmentManager(scene);
    env.setEnvironment('space', scene); env.setSpaceWorld('the_null', 112);
    const presence = scene.getObjectByName('null-presence')!, geometry = (presence.getObjectByName('null-orbital-fragments') as THREE.Mesh).geometry;
    const release = vi.spyOn(geometry, 'dispose'); env.setSpaceWorld('homeward', 141); expect(release).toHaveBeenCalledOnce();
    const before = scene.getObjectByName('revealed-planet-of-light')!.scale.x;
    env.setSpaceWorld('luma', 150); expect(scene.getObjectByName('revealed-planet-of-light')!.scale.x).toBeGreaterThan(before);
    expect(scene.getObjectByName('null-presence')).toBeUndefined(); disposeThreeObject(scene);
  });
});
