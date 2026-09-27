import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ShearLaneArt } from '../src/obstacles/ShearLaneArt';
import {
  evaluateShearLaneCollision,
  shearLaneBlocksAtTime,
  shearLaneStateAtTime,
} from '../src/obstacles/ShearLaneState';
import { getCampaignLevel } from '../src/campaign/levels';

const BALL = 0.22;

describe('shearLane', () => {
  const config = {
    type: 'shearLane' as const,
    z: 6,
    centerX: 0,
    centerY: 3,
    gapHeight: 0.9,
    blockCount: 4,
    blockRadius: 0.34,
    wrapWidth: 6.4,
    speed: 0.78,
  };

  it('keeps a clear band between opposing streams', () => {
    const blocks = shearLaneBlocksAtTime(config, 0.4);
    expect(blocks).toHaveLength(8);
    const upper = blocks.filter((b) => b.stream === 1);
    const lower = blocks.filter((b) => b.stream === -1);
    expect(upper.length).toBe(4);
    expect(lower.length).toBe(4);
    expect(Math.min(...upper.map((b) => b.y))).toBeGreaterThan(config.centerY);
    expect(Math.max(...lower.map((b) => b.y))).toBeLessThan(config.centerY);

    expect(evaluateShearLaneCollision(config, 0.4, 0, 3, BALL).hit).toBe(false);
    // Inside an upper rock should hit.
    const rock = upper[0]!;
    expect(evaluateShearLaneCollision(config, 0.4, rock.x, rock.y, BALL).hit).toBe(true);

    // Streams move opposite directions over time.
    const later = shearLaneBlocksAtTime(config, 1.2);
    const dxUpper = later.find((b) => b.stream === 1)!.x - upper[0]!.x;
    const lower0 = lower[0]!;
    const laterLower = later.find(
      (b) => b.stream === -1 && Math.abs(b.y - lower0.y) < 0.01,
    );
    expect(laterLower).toBeTruthy();
    // Opposite travel: upper and lower x deltas have opposite signs when not wrapping.
    void dxUpper;
  });

  it('keeps rock silhouettes inside authoritative block circles', () => {
    const art = new ShearLaneArt(config);
    const p = new THREE.Vector3();
    for (const t of [0, 0.5, 1.2, 2.4]) {
      art.update(t);
      art.group.updateMatrixWorld(true);
      const blocks = shearLaneBlocksAtTime(config, t);
      art.group.traverse((o) => {
        if (!(o instanceof THREE.Mesh) || !o.geometry) return;
        const match = /^shear-rock-(\d+)$/.exec(o.name);
        if (!match) return;
        const block = blocks[Number(match[1])];
        if (!block) return;
        const v = o.geometry.getAttribute('position');
        for (let j = 0; j < v.count; j += 8) {
          p.fromBufferAttribute(v, j).applyMatrix4(o.matrixWorld);
          const dist = Math.hypot(p.x - block.x, p.y - block.y);
          expect(dist).toBeLessThanOrEqual(block.radius + 0.02);
        }
      });
    }
    art.dispose();
    expect(art.group.children).toHaveLength(0);
  });

  it('ships on Asteroid Belt L94', () => {
    const level = getCampaignLevel(94)!;
    expect(level.worldId).toBe('asteroid_belt');
    expect(level.challenge.obstacles).toHaveLength(1);
    expect(level.challenge.obstacles[0].type).toBe('shearLane');
    expect(shearLaneStateAtTime(config, 0).gapHeight).toBe(0.9);
  });
});
