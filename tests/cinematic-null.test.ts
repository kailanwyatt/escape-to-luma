import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { getCampaignLevel } from '../src/campaign/levels';
import { theNullSafeAtTime } from '../src/obstacles/StoryLibraryState';
import { SculptedNullEncounter, SculptedNullLash } from '../src/experiments/cinematic-null/NullSculptures';
import { CinematicNullScene, CurrentNullScene, disposeNullStudy } from '../src/experiments/cinematic-null/NullStudyScenes';
import { frameNullStudy, sampleNullStudy, STUDY_LASH, STUDY_NULL } from '../src/experiments/cinematic-null/NullStudySequence';

describe('standalone Null cinematic study', () => {
  it('compares the actual L112 and L113 authored encounter configurations', () => {
    expect(STUDY_LASH).toEqual(getCampaignLevel(112)!.challenge.obstacles[0]);
    expect(STUDY_NULL).toEqual(getCampaignLevel(113)!.challenge.obstacles[0]);
  });

  it('loops the three-shot film and holds a selected shot across the timeline', () => {
    expect(sampleNullStudy(0).shot).toBe('presence');
    expect(sampleNullStudy(12).shot).toBe('lash');
    expect(sampleNullStudy(24).shot).toBe('encounter');
    expect(sampleNullStudy(36).shot).toBe('presence');
    expect(sampleNullStudy(720, 'lash').shot).toBe('lash');
    for (const t of [NaN, Infinity, -1, 0, 11.99, 12, 35.99, 36, 100]) {
      const state = sampleNullStudy(t); expect(state.elapsed).toBeGreaterThanOrEqual(0); expect(state.elapsed).toBeLessThan(36);
      expect(state.fade).toBeGreaterThanOrEqual(0); expect(state.fade).toBeLessThanOrEqual(1);
    }
  });

  it('keeps one continuous lash buffer and unwinds without a recovery jump', () => {
    const lash = new SculptedNullLash(), positions = lash.surface.attributes.position;
    const snapshot = (time: number) => { lash.update(time); return Array.from(positions.array); };
    const initial = snapshot(.63); snapshot(1.2); expect(snapshot(.63)).toEqual(initial);
    for (const boundary of [.48, .74, .94, 1.69, 2.07]) {
      const a = snapshot((boundary - .00001) / STUDY_LASH.speed);
      const b = snapshot((boundary + .00001) / STUDY_LASH.speed);
      expect(Math.max(...a.map((v, i) => Math.abs(v - b[i])))).toBeLessThan(.003);
    }
    expect(lash.surface.attributes.position).toBe(positions);
    expect(snapshot(500).every(Number.isFinite)).toBe(true); disposeNullStudy(lash.group);
  });

  it('preserves the current encounter’s moving aperture position and radius', () => {
    const art = new SculptedNullEncounter();
    for (const time of [0, .5, 3, 9, 42, -2]) {
      const expected = theNullSafeAtTime(STUDY_NULL, time); art.update(time);
      expect(art.hole.value.x).toBe(expected.x);
      expect(art.hole.value.y + STUDY_NULL.centerY).toBe(expected.y);
      expect(art.hole.value.z).toBe(expected.radius);
    }
    disposeNullStudy(art.group);
  });

  it('supports phone framing, still motion, bounded geometry and repeatable disposal', () => {
    const demo = new CinematicNullScene(), camera = new THREE.PerspectiveCamera();
    for (const aspect of [.55, 1.8]) for (const shot of ['presence', 'lash', 'encounter'] as const) {
      camera.aspect = aspect; frameNullStudy(camera, shot, 1, true); const pose = camera.matrixWorld.toArray();
      frameNullStudy(camera, shot, 9, true); expect(camera.matrixWorld.toArray()).toEqual(pose);
      demo.update(1, shot, true, aspect); const lash = Array.from(demo.lash.surface.attributes.position.array);
      demo.update(9, shot, true, aspect); expect(Array.from(demo.lash.surface.attributes.position.array)).toEqual(lash);
    }
    let triangles = 0, drawables = 0;
    demo.scene.traverse(o => {
      if (o instanceof THREE.Mesh) { triangles += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3 * (o instanceof THREE.InstancedMesh ? o.count : 1); drawables++; }
      if (o instanceof THREE.Points) drawables++;
    });
    expect(triangles).toBeLessThan(120_000); expect(drawables).toBeLessThan(35);
    demo.dispose(); demo.dispose(); expect(demo.scene.children).toHaveLength(0);
    const reference = new CurrentNullScene(); reference.update(1, 'encounter', false); reference.dispose(); reference.dispose(); expect(reference.scene.children).toHaveLength(0);
  });
});
