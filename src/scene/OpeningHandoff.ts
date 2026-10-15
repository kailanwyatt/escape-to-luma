import * as THREE from 'three';
import { GAME_TUNING } from '../game/gameTuning';
import { sampleOpeningChoreography } from './OpeningSequence';

export const OPENING_HANDOFF = { fadeStart: 31.35, sceneSwitch: 32.1, fadeEnd: 33, cameraEnd: 34.7 } as const;

/** Switch scenes only at full black, then reveal the already-built playable level. */
export function sampleOpeningHandoff(elapsed: number) {
  const gameplay = elapsed >= OPENING_HANDOFF.sceneSwitch;
  const opacity = elapsed < OPENING_HANDOFF.fadeStart
    ? sampleOpeningChoreography(elapsed).transferOpacity
    : gameplay
      ? 1 - THREE.MathUtils.smoothstep(elapsed, OPENING_HANDOFF.sceneSwitch, OPENING_HANDOFF.fadeEnd)
      : THREE.MathUtils.smoothstep(elapsed, OPENING_HANDOFF.fadeStart, OPENING_HANDOFF.sceneSwitch);
  return {
    gameplay,
    opacity,
    cameraProgress: THREE.MathUtils.smoothstep(elapsed, OPENING_HANDOFF.sceneSwitch, OPENING_HANDOFF.cameraEnd),
  };
}

const fromPosition = new THREE.Vector3(.25, 2.4, -6.6);
const fromTarget = new THREE.Vector3(0, .9, .7);
const toPosition = new THREE.Vector3(...GAME_TUNING.camera.position);
const toTarget = new THREE.Vector3(...GAME_TUNING.camera.lookAt);
const target = new THREE.Vector3();

/** Ends at exactly CameraController's pose, including FOV. Reduced motion reveals that pose directly. */
export function applyOpeningHandoff(camera: THREE.PerspectiveCamera, elapsed: number, reduceMotion: boolean) {
  const progress = reduceMotion ? 1 : sampleOpeningHandoff(elapsed).cameraProgress;
  camera.position.lerpVectors(fromPosition, toPosition, progress);
  target.lerpVectors(fromTarget, toTarget, progress);
  camera.lookAt(target);
  const fov = THREE.MathUtils.lerp(42, GAME_TUNING.camera.fov, progress);
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
}
