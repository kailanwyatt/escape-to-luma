import { describe, expect, it } from 'vitest';
import * as THREE from 'three';

import type {
  LaserGridConfig,
  LaserGridPattern,
} from '../src/config/ObstacleConfig';
import { laserBeamsAtTime } from '../src/obstacles/LaserGridAnimation';
import { LaserGridObstacle } from '../src/obstacles/LaserGridObstacle';

function config(
  pattern: LaserGridPattern = 'HORIZONTAL_WAVE',
): LaserGridConfig {
  return {
    type: 'laserGrid',
    z: 5,
    orientation:
      pattern === 'VERTICAL_WAVE'
        ? 'vertical'
        : pattern === 'CROSSING' || pattern === 'CROSSING_PHASED' || pattern === 'ALTERNATING'
          ? 'both'
          : 'horizontal',
    pattern,
    beamCount:
      pattern === 'CROSSING' || pattern === 'CROSSING_PHASED' || pattern === 'ALTERNATING' ? 6 : 4,
    spacing: 1.12,
    span: 4.2,
    thickness: 0.06,
    amplitude: 0.2,
    speed: 0.6,
    phaseOffset: 0.8,
    centerX: 0,
    centerY: 3,
  };
}

describe('fixed-frame laser grid', () => {
  it('keeps the frame fixed while individual beams move independently', () => {
    const obstacle = new LaserGridObstacle('test-lasers');
    obstacle.applyConfig(config(), 'workshop');

    const frame = obstacle.group.getObjectByName('FixedFrame')!;
    expect(frame.children.map((child) => child.name)).toEqual([
      'FixedLeftPost',
      'FixedRightPost',
    ]);
    const frameStart = frame.children.map((child) => child.position.clone());
    const beams = obstacle.group.getObjectByName('Lasers')!.children;
    const beamStart = beams.map((beam) => beam.position.clone());

    obstacle.update(1, 1.5);

    expect(obstacle.group.position).toEqual(new THREE.Vector3(0, 0, 5));
    expect(obstacle.group.rotation.toArray().slice(0, 3)).toEqual([0, 0, 0]);
    frame.children.forEach((child, index) => {
      expect(child.position).toEqual(frameStart[index]);
    });
    beams.forEach((beam) => {
      expect(beam.position.z).toBe(0);
      expect(beam.rotation.toArray().slice(0, 3)).toEqual([0, 0, 0]);
      expect(beam.scale.z).toBe(1);
      expect(
        (beam as THREE.Mesh<THREE.BoxGeometry>).geometry.parameters.depth,
      ).toBeLessThanOrEqual(0.012);
    });
    const beamDeltas = beams.map((beam, index) =>
      beam.position.distanceTo(beamStart[index]),
    );
    expect(beamDeltas.every((delta) => delta > 0)).toBe(true);
    expect(new Set(beamDeltas.map((delta) => delta.toFixed(4))).size).toBeGreaterThan(1);
  });

  it('mounts vertical emitters on top and bottom rails and follows the collision endpoints',()=>{
    const c=config('VERTICAL_WAVE'),o=new LaserGridObstacle('vertical');o.applyConfig(c,'space');o.update(0,2);
    expect(o.group.getObjectByName('FixedTopPost')).toBeDefined();expect(o.group.getObjectByName('FixedBottomPost')).toBeDefined();
    expect(o.group.getObjectByName('FixedLeftPost')).toBeUndefined();
    const emitters=o.group.children.filter(child=>child.name==='LaserEmitter');
    const beams=o.beamsAtTime(2);expect(emitters).toHaveLength(beams.length*2);
    beams.forEach((b,i)=>{expect(emitters[i*2].position.x).toBe(b.position);expect(emitters[i*2].position.y).toBeCloseTo(b.centerY-c.span/2-.08,1);});
    const rockets=o.group.children[0].children.filter(c=>c.name==='CornerRocket');
    expect(rockets).toHaveLength(4);
    expect(o.group.getObjectByName('CornerRocketPlume')).toBeTruthy();
    expect(o.group.getObjectByName('ThrusterPlume')).toBeFalsy();
    o.hide();expect(o.group.children.some(child=>child.name==='LaserEmitter')).toBe(false);
  });

  it('keeps workshop lasers without space thrusters',()=>{
    const o=new LaserGridObstacle('grounded');o.applyConfig(config('VERTICAL_WAVE'),'workshop');
    expect(o.group.getObjectByName('CornerRocket')).toBeFalsy();
    expect(o.group.getObjectByName('FrameThrusterBank')).toBeFalsy();
    o.hide();
  });

  it('extinguishes hot cores, halos and contact flares while pulsed lasers are off',()=>{
    const o=new LaserGridObstacle('pulse');o.applyConfig({...config(),mode:'pulse',pulseSpeed:1,onRatio:.5},'workshop');
    let off=false;
    for(let t=0;t<10;t+=.1){o.update(.1,t);if(!o.lasersOn){off=true;break;}}
    expect(off).toBe(true);expect(o.group.getObjectByName('HotCore')!.visible).toBe(false);
    expect(o.group.getObjectByName('ContactFlare')!.visible).toBe(false);
    const halo=o.group.getObjectByName('BeamHalo') as THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>;
    expect(halo.material.uniforms.strength.value).toBe(0);
  });

  it('gives Security Sweep a visible amber charge-up before its lasers become dangerous', () => {
    const o = new LaserGridObstacle('security-sweep');
    o.applyConfig(
      {
        ...config('CROSSING_PHASED'),
        appearance: 'securitySweep',
        mode: 'pulse',
        pulseSpeed: 1,
        onRatio: 0.5,
      },
      'space',
    );

    expect(o.group.getObjectByName('SecuritySweepBeacon')).toBeTruthy();
    expect(o.group.getObjectByName('SecuritySweepChevron')).toBeTruthy();

    // The middle of the harmless window is deliberately quiet.
    o.update(0.016, 0.7);
    expect(o.lasersOn).toBe(false);
    const halo = o.group.getObjectByName('BeamHalo') as THREE.Mesh<
      THREE.PlaneGeometry,
      THREE.ShaderMaterial
    >;
    expect(halo.material.uniforms.strength.value).toBe(0);

    // The final part of that window must telegraph the imminent firing pulse.
    o.update(0.016, 0.9);
    expect(o.lasersOn).toBe(false);
    expect(halo.material.uniforms.strength.value).toBeGreaterThan(0);
    expect(o.group.getObjectByName('HotCore')!.visible).toBe(false);
    expect(o.group.getObjectByName('ContactFlare')!.visible).toBe(false);

    o.update(0.016, 0.1);
    expect(o.lasersOn).toBe(true);
    expect(o.group.getObjectByName('HotCore')!.visible).toBe(true);
    expect(o.group.getObjectByName('ContactFlare')!.visible).toBe(true);
    o.hide();
  });

  it('uses the exact crossing-time beam positions for collision', () => {
    const laserConfig = config('VERTICAL_WAVE');
    const obstacle = new LaserGridObstacle('collision-lasers');
    obstacle.applyConfig(laserConfig, 'workshop');

    const crossingTime = 1.5;
    const beam = laserBeamsAtTime(laserConfig, crossingTime)[1];
    const result = obstacle.testProjectileCrossing(
      new THREE.Vector3(beam.position, beam.centerY, 4),
      new THREE.Vector3(beam.position, beam.centerY, 6),
      0.2,
      2,
      1,
    );

    expect(result?.hit).toBe('laser');
  });

  it('supports every deterministic beam pattern', () => {
    const patterns: LaserGridPattern[] = [
      'HORIZONTAL_WAVE',
      'VERTICAL_WAVE',
      'OPEN_CLOSE',
      'ALTERNATING',
      'CROSSING',
      'CROSSING_PHASED',
      'SEQUENTIAL',
    ];
    for (const pattern of patterns) {
      const laserConfig = config(pattern);
      expect(laserBeamsAtTime(laserConfig, 2.25)).toEqual(
        laserBeamsAtTime(laserConfig, 2.25),
      );
      expect(laserBeamsAtTime(laserConfig, 2.25)).toHaveLength(
        laserConfig.beamCount ?? 4,
      );
    }
  });

  it('phases criss-cross motion between H-only, together, and V-only', () => {
    const laserConfig = config('CROSSING_PHASED');
    const regimePeriod = 5.2;
    const sample = (t: number) => {
      const a = laserBeamsAtTime(laserConfig, t);
      const b = laserBeamsAtTime(laserConfig, t + 0.35);
      const hDelta = a
        .filter((beam) => beam.orientation === 'horizontal')
        .some(
          (beam, i) =>
            Math.abs(
              beam.position -
                b.filter((x) => x.orientation === 'horizontal')[i].position,
            ) > 0.015,
        );
      const vDelta = a
        .filter((beam) => beam.orientation === 'vertical')
        .some(
          (beam, i) =>
            Math.abs(
              beam.position -
                b.filter((x) => x.orientation === 'vertical')[i].position,
            ) > 0.015,
        );
      return {
        h: a.filter((beam) => beam.orientation === 'horizontal').length,
        v: a.filter((beam) => beam.orientation === 'vertical').length,
        hDelta,
        vDelta,
      };
    };
    // Regime 0: H only
    expect(sample(1).hDelta).toBe(true);
    expect(sample(1).vDelta).toBe(false);
    // Regime 1: both
    expect(sample(regimePeriod + 1).hDelta).toBe(true);
    expect(sample(regimePeriod + 1).vDelta).toBe(true);
    // Regime 2: V only
    expect(sample(regimePeriod * 2 + 1).hDelta).toBe(false);
    expect(sample(regimePeriod * 2 + 1).vDelta).toBe(true);
    expect(sample(1).h).toBe(3);
    expect(sample(1).v).toBe(3);
  });
});
