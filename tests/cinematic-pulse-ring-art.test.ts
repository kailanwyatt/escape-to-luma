import { expect, it } from 'vitest';
import * as THREE from 'three';
import { CinematicPulseRingArt } from '../src/obstacles/CinematicPulseRingArt';
import { evaluatePulseRingCollision, pulseRingStateAtTime } from '../src/obstacles/PulseRingState';
import { getCampaignLevel } from '../src/campaign/levels';

it('keeps pulse pods inside the expanding danger band', () => {
  const c = getCampaignLevel(40)!.challenge.obstacles[0];
  if (c.type !== 'pulseRing') throw Error('Expected pulse');
  const art = new CinematicPulseRingArt(c);
  const p = new THREE.Vector3();
  for (const t of [0, 0.4, 0.8, 1.2, 2, 3]) {
    art.update(t);
    art.group.updateMatrixWorld(true);
    const s = pulseRingStateAtTime(c, t);
    expect(art.group.getObjectByName('danger-surface')).toBeTruthy();
    for (let i = 0; i < 8; i++) {
      const pod = art.group.getObjectByName(`pulse-pod-${i}`)!;
      expect(Math.hypot(pod.position.x - s.centerX, pod.position.y - s.centerY)).toBeCloseTo(s.radius, 5);
      pod.traverse((o) => {
        if (!(o instanceof THREE.Mesh) || !o.geometry) return;
        const v = o.geometry.getAttribute('position');
        for (let j = 0; j < v.count; j += 2) {
          p.fromBufferAttribute(v, j).applyMatrix4(o.matrixWorld);
          expect(evaluatePulseRingCollision(c, t, p.x, p.y, 0).clearance).toBeLessThanOrEqual(0.01);
        }
      });
    }
  }
  art.dispose();
  expect(art.group.children).toHaveLength(0);
});
