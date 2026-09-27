import {expect,it} from 'vitest';
import * as THREE from 'three';
import {GroundCutLasersArt} from '../src/obstacles/GroundCutLasersArt';
import {getCampaignLevel} from '../src/campaign/levels';
import {groundCutLasersStateAtTime} from '../src/obstacles/GroundCutLasersState';

it('pitches ground-cut beams in 3D from fully off-screen bases',()=>{
  const c=getCampaignLevel(32)!.challenge.obstacles[0];
  expect(c.type).toBe('groundCutLasers');
  if(c.type!=='groundCutLasers')return;
  expect(c.floorY).toBeLessThan(-2.5);
  const art=new GroundCutLasersArt(c);
  art.update(0.4);
  const beam=art.group.children.find((o)=>o.name==='ground-cut-beam') as THREE.Group;
  expect(beam).toBeTruthy();
  const state=groundCutLasersStateAtTime(c,0.4);
  expect(state.beams[0].ay).toBeLessThan(-2.5);
  // Midpoint sits between deep origin (+Z) and tip toward camera (−Z).
  expect(beam.position.z).toBeGreaterThan(0.5);
  expect(beam.position.z).toBeLessThan(2.2);
  // Not a flat XY-only rotation — full quaternion from the 3D shaft direction.
  expect(Math.abs(beam.quaternion.x)+Math.abs(beam.quaternion.y)).toBeGreaterThan(0.02);
  expect(beam.getObjectByName('BeamHaloB')).toBeTruthy();
  expect((beam.getObjectByName('cut-body') as THREE.Mesh).material).toBeInstanceOf(THREE.MeshBasicMaterial);
  art.dispose();
  expect(art.group.children).toHaveLength(0);
});
