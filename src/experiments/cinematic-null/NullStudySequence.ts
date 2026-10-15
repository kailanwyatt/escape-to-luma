import * as THREE from 'three';
import type { NullLashConfig, TheNullConfig } from '../../config/ObstacleConfig';

export type NullShot = 'presence' | 'lash' | 'encounter';
export const NULL_STUDY_DURATION = 36;
export const NULL_SHOTS: NullShot[] = ['presence', 'lash', 'encounter'];
// The authored isolation encounters, copied for a self-contained visual study.
export const STUDY_LASH: NullLashConfig = {
  type: 'nullLash', z: 6, pivotX: 0, pivotY: 4.75, length: 2.6, thickness: .18,
  restAngle: .95, lashSpan: -Math.PI / 2 - .95, speed: 1.05,
  coiledHold: .48, warningHold: .26, lashDuration: .2, extendedHold: .75, retractDuration: .38,
};
export const STUDY_NULL: TheNullConfig = {
  type: 'theNull', z: 6, centerX: 0, centerY: 3, fieldRadius: 2.2, holeRadius: .95,
  baseX: 0, baseY: 3, driftSpeed: .55, driftAmplitudeX: .55, driftAmplitudeY: .35,
};
export function sampleNullStudy(time: number, fixed: NullShot | null = null) {
  const elapsed = THREE.MathUtils.euclideanModulo(Number.isFinite(time) ? time : 0, NULL_STUDY_DURATION);
  const shot = fixed ?? NULL_SHOTS[Math.floor(elapsed / 12)];
  const local = elapsed % 12;
  const fade = fixed ? 0 : 1 - Math.min(THREE.MathUtils.smoothstep(local, 0, .6), 1 - THREE.MathUtils.smoothstep(local, 11.4, 12));
  return { elapsed, shot, local, fade };
}
export function frameNullStudy(camera: THREE.PerspectiveCamera, shot: NullShot, time: number, reduced: boolean) {
  const portrait = camera.aspect < .85;
  const t = reduced ? 0 : time;
  const y = shot === 'presence' ? 7 : shot === 'lash' ? 3.75 : 2.55;
  const z = shot === 'presence' ? -8 : shot === 'lash' ? -2.3 : -4.4;
  camera.fov = portrait ? 48 : 43;
  camera.position.set(Math.sin(t * .12) * (shot === 'presence' ? .8 : .17), y + .15, z - (portrait ? 2.8 : 0));
  camera.lookAt(0, y, shot === 'presence' ? 38 : 6);
  camera.updateProjectionMatrix(); camera.updateMatrixWorld();
}
