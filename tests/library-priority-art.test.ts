import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { LibraryPriorityArt } from '../src/obstacles/LibraryPriorityArt';
import { getCampaignLevel } from '../src/campaign/levels';
import { pistonFieldStateAtTime } from '../src/obstacles/PistonFieldState';
import { pulseRingStateAtTime } from '../src/obstacles/PulseRingState';
import { rollingApertureStateAtTime, reactiveGateStateAtTime } from '../src/obstacles/ExtendedLibraryState';
import { PISTON_VISUAL_VARIANT } from '../src/obstacles/PistonVisualVariant';

describe('priority art follows authoritative silhouettes', () => {
  for (const level of [6, 10, 40, 47])
    it(`L${level}: matches state throughout a cycle and disposes`, () => {
      const config = getCampaignLevel(level)!.challenge.obstacles[0];
      if (!LibraryPriorityArt.supports(config)) throw new Error('Expected priority family');
      const art = new LibraryPriorityArt(config);
      const mesh = (name: string) =>
        art.group.getObjectByName(name) as THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
      for (const time of [0, 0.8, 1.2, 2, 4, 6]) {
        art.update(time);
        if (config.type === 'pistonField') {
          const lanes = pistonFieldStateAtTime(config, time);
          if (PISTON_VISUAL_VARIANT === 'basic') {
            lanes.forEach((s, i) => {
              const ram = mesh(`steel-ram-${i}`);
              expect(ram.position.y - ram.scale.y / 2).toBeCloseTo(s.floorY);
              expect(ram.position.y + ram.scale.y / 2).toBeCloseTo(s.top);
              expect(ram.scale.x).toBe(s.width);
              expect((ram.material as THREE.MeshBasicMaterial).opacity).toBe(1);
            });
          } else {
            const pistons = art.group.children.filter((c) => c.name.startsWith('cinematic-piston'));
            expect(pistons.length).toBe(config.laneCount);
            lanes.forEach((s, i) => {
              const body = pistons[i].getObjectByName('solid-envelope') as THREE.Mesh;
              pistons[i].updateMatrixWorld(true);
              const bounds = new THREE.Box3().setFromObject(body);
              expect(bounds.min.y).toBeCloseTo(s.floorY);
              expect(bounds.max.y).toBeCloseTo(s.top);
              expect(bounds.max.x - bounds.min.x).toBeCloseTo(s.width);
            });
          }
        } else if (config.type === 'reactiveGate') {
          const s = reactiveGateStateAtTime(config, time);
          art.group.updateMatrixWorld(true);
          expect(mesh('capture-door-0').getWorldPosition(new THREE.Vector3()).x + s.panelWidth / 2).toBeCloseTo(
            config.centerX - s.gap / 2,
          );
          expect((mesh('status-lamp-0').material as THREE.MeshStandardMaterial).color.getHex()).toBe(
            s.warning ? 0xffb449 : s.phase === 'open' ? 0x70e5ed : 0xff7562,
          );
        } else {
          const positions = mesh('danger-surface').geometry.getAttribute('position');
          const s = config.type === 'pulseRing' ? pulseRingStateAtTime(config, time) : rollingApertureStateAtTime(config, time);
          const inner = config.type === 'pulseRing' ? s.radius - config.thickness : s.radius;
          const outer = config.type === 'pulseRing' ? s.radius + config.thickness : 40;
          for (let i = 0; i < positions.count; i++) {
            expect(Math.hypot(positions.getX(i), positions.getY(i))).toBeCloseTo(i < positions.count / 2 ? inner : outer, 4);
          }
          expect(mesh('danger-surface').geometry.index).not.toBeNull();
        }
      }
      art.dispose();
      expect(art.group.children).toHaveLength(0);
    });
});
