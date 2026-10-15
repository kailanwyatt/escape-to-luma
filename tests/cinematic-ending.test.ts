import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { CinematicEnding } from '../src/experiments/cinematic-ending/CinematicEnding';
import { ENDING_DURATION, ENDING_STARTS, sampleEnding } from '../src/experiments/cinematic-ending/EndingSequence';
import { ENDING_SPARK_COLORS, TREE_PULSE_PERIOD, TREE_PULSE_TRAVEL, treePulsePosition } from '../src/experiments/cinematic-ending/EndingWorldLife';
import { SPARK_CATALOG } from '../src/customization/sparks';

function pose(scene: THREE.Scene) {
  const values: number[] = [];
  scene.traverse(object => {
    values.push(...object.position.toArray(), ...object.quaternion.toArray(), ...object.scale.toArray(), Number(object.visible));
    if (object instanceof THREE.InstancedMesh && object.name === 'passing-asteroids') values.push(...object.instanceMatrix.array);
  });
  return values;
}

describe('cinematic ending', () => {
  it('uses the actual game palette and a bounded four-chapter clock', () => {
    expect(ENDING_SPARK_COLORS).toEqual(SPARK_CATALOG.map(spark => spark.color));
    expect(ENDING_DURATION).toBe(38);
    ENDING_STARTS.forEach((time, stage) => expect(sampleEnding(time).stage).toBe(stage));
    expect(sampleEnding(-2).elapsed).toBe(0);
    expect(sampleEnding(Number.NaN).elapsed).toBe(0);
    expect(sampleEnding(100).complete).toBe(true);
  });

  it('spaces tree beams apart, staggers branches, and repeats without a flash at the boundary', () => {
    expect(treePulsePosition(0, 0)).toBe(0);
    expect(treePulsePosition(TREE_PULSE_TRAVEL / 2, 0)).toBe(.5);
    expect(treePulsePosition(TREE_PULSE_TRAVEL + 1, 0)).toBeNull();
    expect(treePulsePosition(TREE_PULSE_PERIOD - .1, 0)).toBeNull();
    expect(treePulsePosition(1, 2)).toBeNull();
    expect(treePulsePosition(2, 2)).toBe(0);
    expect(treePulsePosition(TREE_PULSE_PERIOD + 1.5, 0)).toBe(.5);
  });

  it('builds complete geometry, supports reverse seeking, and stays within the demo draw budget', () => {
    const error = vi.spyOn(console, 'error');
    const scene = new CinematicEnding();
    scene.camera.aspect = 390 / 844;
    scene.sample(23);
    const expected = pose(scene.scene), camera = scene.camera.matrixWorld.toArray();
    for (const time of [38, 0, 13, 31, 23]) {
      scene.sample(time);
      let draws = 0, triangles = 0;
      scene.scene.traverseVisible(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          draws++;
          if (object instanceof THREE.Mesh) triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3 * (object instanceof THREE.InstancedMesh ? object.count : 1);
        }
      });
      expect(draws).toBeLessThan(150);
      expect(triangles).toBeLessThan(500_000);
      expect(pose(scene.scene).every(Number.isFinite)).toBe(true);
    }
    expect(pose(scene.scene)).toEqual(expected);
    expect(scene.camera.matrixWorld.toArray()).toEqual(camera);
    expect(error).not.toHaveBeenCalled(); error.mockRestore();
    scene.dispose(); scene.dispose();
    expect(scene.scene.children).toHaveLength(0);
  });

  it('keeps the living background moving after the ending while reduced motion holds everything still', () => {
    const scene = new CinematicEnding();
    const rocks = scene.scene.getObjectByName('passing-asteroids') as THREE.InstancedMesh;
    const sparks = scene.scene.getObjectByName('distant-colored-sparks') as THREE.Points;
    expect(rocks.count).toBe(11);
    expect(sparks.geometry.attributes.position.count).toBe(1800);
    scene.sample(38, false, 38); const atEnd = rocks.instanceMatrix.array.slice();
    const camera = scene.camera.matrixWorld.toArray();
    scene.sample(38, false, 48);
    expect(rocks.instanceMatrix.array).not.toEqual(atEnd);
    expect(scene.camera.matrixWorld.toArray()).toEqual(camera);
    scene.sample(38, true, 38); const still = pose(scene.scene);
    scene.sample(38, true, 48);
    expect(pose(scene.scene)).toEqual(still);
    expect(scene.scene.getObjectByName('shooting-star-formation')?.visible).toBe(false);
    scene.dispose();
  });
});
