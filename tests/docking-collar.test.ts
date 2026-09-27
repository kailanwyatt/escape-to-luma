import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { DockingCollarArt } from '../src/obstacles/DockingCollarArt';
import {
  dockingCollarStateAtTime,
  evaluateDockingCollarCollision,
} from '../src/obstacles/DockingCollarState';
import { getCampaignLevel } from '../src/campaign/levels';

const BALL = 0.22;

describe('dockingCollar', () => {
  const config = {
    type: 'dockingCollar' as const,
    z: 6,
    centerX: 0,
    centerY: 3,
    outerRadius: 2.15,
    openRadius: 0.95,
    closedRadius: 0,
    speed: 0.88,
    closedHold: 1.15,
    openingDuration: 0.3,
    openHold: 0.42,
    warningHold: 0.38,
    slamDuration: 0.24,
  };

  it('seals the hatch shut and only briefly opens a playable center hole', () => {
    expect(dockingCollarStateAtTime(config, 0).phase).toBe('closed');
    expect(evaluateDockingCollarCollision(config, 0, 0, 3, BALL).hit).toBe(true);
    // Mid-annulus is solid while clamped.
    expect(evaluateDockingCollarCollision(config, 0, 1.1, 3, BALL).hit).toBe(true);
    // Outside the frame is free.
    expect(evaluateDockingCollarCollision(config, 0, 2.6, 3, BALL).hit).toBe(false);

    let opened = false;
    for (let t = 0; t < 8; t += 0.05) {
      const s = dockingCollarStateAtTime(config, t);
      if (s.phase === 'open' && !evaluateDockingCollarCollision(config, t, 0, 3, BALL).hit) {
        opened = true;
        expect(s.openingRadius).toBeGreaterThan(0.75);
        break;
      }
    }
    expect(opened).toBe(true);

    let warned = false;
    for (let t = 0; t < 8; t += 0.05) {
      if (dockingCollarStateAtTime(config, t).warning) {
        warned = true;
        break;
      }
    }
    expect(warned).toBe(true);

    // Center lane must be blocked a real share of the cycle (not a free throw).
    const closed = config.closedHold;
    const opening = config.openingDuration;
    const open = config.openHold;
    const warning = config.warningHold;
    const slam = config.slamDuration;
    const period = (closed + opening + open + warning + slam) / config.speed;
    let clears = 0;
    let samples = 0;
    for (let t = 0; t < period; t += 0.02) {
      samples++;
      if (!evaluateDockingCollarCollision(config, t, 0, 3, BALL).hit) clears++;
    }
    expect(clears / samples).toBeLessThan(0.55);
    expect(clears / samples).toBeGreaterThan(0.2);
  });

  it('keeps jaw silhouette inside the annular plate', () => {
    const art = new DockingCollarArt(config);
    const p = new THREE.Vector3();
    for (const t of [0, 0.6, 1.4, 2.2, 3.5]) {
      const state = dockingCollarStateAtTime(config, t);
      art.update(t);
      art.group.updateMatrixWorld(true);
      art.group.traverse((o) => {
        if (!(o instanceof THREE.Mesh) || !o.geometry) return;
        if (!/^jaw-(left|right)$/.test(o.name)) return;
        const v = o.geometry.getAttribute('position');
        for (let j = 0; j < v.count; j += 6) {
          p.fromBufferAttribute(v, j).applyMatrix4(o.matrixWorld);
          const dist = Math.hypot(p.x - state.centerX, p.y - state.centerY);
          // Jaw verts sit on the plate between hole and rim (allow extrusion thickness).
          expect(dist).toBeGreaterThanOrEqual(Math.max(0, state.openingRadius) - 0.04);
          expect(dist).toBeLessThanOrEqual(state.outerRadius + 0.04);
        }
      });
    }
    art.dispose();
    expect(art.group.children).toHaveLength(0);
  });

  it('ships on Upper Atmosphere L48', () => {
    const level = getCampaignLevel(48)!;
    expect(level.worldId).toBe('upper_atmosphere');
    expect(level.challenge.obstacles).toHaveLength(1);
    expect(level.challenge.obstacles[0].type).toBe('dockingCollar');
    const gate = level.challenge.obstacles[0] as { openHold: number; closedHold: number };
    expect(gate.closedHold).toBeGreaterThan(gate.openHold);
  });
});
