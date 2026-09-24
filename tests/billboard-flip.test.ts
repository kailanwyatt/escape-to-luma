import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { BillboardFlipArt } from '../src/obstacles/BillboardFlipArt';
import {
  billboardFlipStateAtTime,
  evaluateBillboardFlipCollision,
} from '../src/obstacles/BillboardFlipState';
import { getCampaignLevel } from '../src/campaign/levels';

const BALL = 0.22;

describe('billboardFlip', () => {
  const config = {
    type: 'billboardFlip' as const,
    z: 6,
    centerX: 0,
    centerY: 3,
    halfWidth: 1.55,
    halfHeight: 1.05,
    halfDepth: 0.08,
    maxAngle: Math.PI * 0.5,
    openAngle: 1.0,
    speed: 0.58,
  };

  it('blocks the corridor when face-on and clears when edge-on', () => {
    expect(billboardFlipStateAtTime(config, 0).open).toBe(false);
    expect(evaluateBillboardFlipCollision(config, 0, 0, 3, BALL).hit).toBe(true);
    expect(evaluateBillboardFlipCollision(config, 0, 2.2, 3, BALL).hit).toBe(false);

    let opened = false;
    for (let t = 0; t < 12; t += 0.05) {
      const s = billboardFlipStateAtTime(config, t);
      if (s.open && !evaluateBillboardFlipCollision(config, t, 0, 3, BALL).hit) {
        opened = true;
        expect(Math.abs(s.angle)).toBeGreaterThanOrEqual(config.openAngle);
        break;
      }
    }
    expect(opened).toBe(true);
  });

  it('keeps board silhouette inside the face AABB while closed', () => {
    const art = new BillboardFlipArt(config);
    const p = new THREE.Vector3();
    for (const t of [0, 0.4, 1.1, 2.2, 3.5]) {
      const state = billboardFlipStateAtTime(config, t);
      if (state.open) continue;
      art.update(t);
      art.group.updateMatrixWorld(true);
      art.group.traverse((o) => {
        if (!(o instanceof THREE.Mesh) || !o.geometry) return;
        if (!/^(board-|ad-)/.test(o.name)) return;
        const v = o.geometry.getAttribute('position');
        for (let j = 0; j < v.count; j += 4) {
          p.fromBufferAttribute(v, j).applyMatrix4(o.matrixWorld);
          expect(evaluateBillboardFlipCollision(config, t, p.x, p.y, 0).clearance).toBeLessThanOrEqual(
            0.01,
          );
        }
      });
    }
    art.dispose();
    expect(art.group.children).toHaveLength(0);
  });

  it('ships on City L19', () => {
    const level = getCampaignLevel(19)!;
    expect(level.worldId).toBe('city');
    expect(level.challenge.obstacles).toHaveLength(1);
    expect(level.challenge.obstacles[0].type).toBe('billboardFlip');
  });
});
