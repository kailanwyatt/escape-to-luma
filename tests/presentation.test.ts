import { ObstacleSlot } from '../src/obstacles/ObstacleSlot';
import { Target } from '../src/target/Target';
import { createGateVisual, layoutGateVisual } from '../src/obstacles/ObstacleVisuals';
import { Projectile } from '../src/projectile/Projectile';
import { describe, it, expect } from 'vitest';
import { containmentProfile } from '../src/environment/WorldPresentation';
import { ContainmentKit } from '../src/environment/ContainmentKit';
import { OpeningScene } from '../src/scene/OpeningScene';
import { GAME_TUNING } from '../src/game/gameTuning';
import * as THREE from 'three';
describe('production scene contracts', () => {
  it('bounds fracture geometry, keeps it outside the breach and clears it at handoff', () => {
    const opening = new OpeningScene(); const camera = new THREE.PerspectiveCamera();
    opening.setBreach({x: .2, y: 3, z: 6, width: 2, height: 3});
    const fragments = opening.group.getObjectByName('opening-fragments')!;
    expect(fragments.children).toHaveLength(12);
    opening.sample(28, camera, false); expect(fragments.visible).toBe(true);
    for (const shard of fragments.children) expect(Math.abs(shard.position.x - .2)).toBeGreaterThan(1.1);
    const positions = fragments.children.map(shard => shard.position.toArray());
    for (let i = 0; i < 100; i++) opening.sample(28, camera, false);
    expect(fragments.children.map(shard => shard.position.toArray())).toEqual(positions);
    opening.sample(28, camera, true); expect(fragments.visible).toBe(false);
    opening.showPlayableVessel(); expect(fragments.visible).toBe(false);
    expect(fragments.children).toHaveLength(12);
  });
  it('restores hidden cinematic actors when the playable challenge is applied', () => {
    const target = new Target(); const slot = new ObstacleSlot('test');
    target.group.visible = false; slot.group.visible = false;
    target.applyConfig({x: 0, y: 3, radius: 1.18});
    slot.applyConfig({type: 'slidingGate', z: 5.75, openingWidth: 1.72, openingHeight: 2.65, baseX: 0, amplitude: 0, speed: 0}, 'workshop');
    expect(target.group.visible).toBe(true); expect(slot.group.visible).toBe(true);
    slot.hide(); expect(slot.group.visible).toBe(false);
  });
  it('replaces breach target art without changing scoring or subsequent gate art', () => {
    const target = new Target();
    const radius = target.radius;
    target.setBreachPresentation(true);
    expect(target.group.children.every(child => !child.visible)).toBe(true);
    expect(target.radius).toBe(radius);
    target.setBreachPresentation(false);
    expect(target.group.children.every(child => child.visible)).toBe(true);
  });
  it('Spark reactions cannot change physics position or velocity', () => {
    const spark = new Projectile(); const position = spark.position.clone(); const velocity = spark.velocity.clone();
    for (const state of ['signal', 'charge', 'launch', 'collision', 'success'] as const) spark.updateVisual(4, false, state);
    expect(spark.position.equals(position)).toBe(true); expect(spark.velocity.equals(velocity)).toBe(true);
  });
  it('covers fifteen levels with five reusable compositions', () => {
    expect(new Set(Array.from({length: 15}, (_, i) => containmentProfile(i + 1).composition)).size).toBe(5);
    expect(containmentProfile(15).signal).toBe('answering');
  });
  it('keeps decorative kit geometry outside the playable lane', () => {
    const kit = new ContainmentKit(); kit.setLevel(15);
    kit.group.updateMatrixWorld(true);
    kit.group.traverse(object => {
      if (object instanceof THREE.Mesh) {
        const bounds = new THREE.Box3().setFromObject(object);
        expect(bounds.max.x <= -3.1 || bounds.min.x >= 3.1).toBe(true);
      }
    });
  });
  it('hands off at exactly the gameplay camera and hides all cinematic actors', () => {
    const scene = new OpeningScene(); const camera = new THREE.PerspectiveCamera();
    scene.sample(35, camera, false);
    expect(camera.position.toArray()).toEqual(GAME_TUNING.camera.position);
    scene.hide(); expect(scene.group.visible).toBe(false);
  });
});
