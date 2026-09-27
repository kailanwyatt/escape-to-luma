/**
 * Look-dev: cinematic capture pincers (scissorGate).
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import type { ScissorGateConfig } from '../src/config/ObstacleConfig';
import { FacilityScissorArt } from '../src/obstacles/FacilityScissorArt';
import { scissorGateStateAtTime } from '../src/obstacles/ScissorGateState';
import { GAME_TUNING } from '../src/game/gameTuning';

const CONFIG: ScissorGateConfig = {
  type: 'scissorGate',
  z: GAME_TUNING.rotor.z,
  centerX: -1.05,
  centerY: 3.15,
  barLength: 1.65,
  barThickness: 0.09,
  minAngle: 0.06,
  maxAngle: 0.85,
  pattern: 'flutter',
  speed: 0.62,
  flutterFlaps: 2.5,
  flutterBurst: 1.4,
  flutterRest: 1.9,
};

const viewport = document.getElementById('viewport')!;
const status = document.getElementById('status')!;
const pauseBtn = document.getElementById('pause') as HTMLButtonElement;
const bloomToggle = document.getElementById('bloom') as HTMLInputElement;
const speedSelect = document.getElementById('speed') as HTMLSelectElement;

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewport.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050b12);
scene.fog = new THREE.FogExp2(0x071018, 0.042);

const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
camera.position.set(-4.2, 4.5, -9);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 3.6, 0);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 4;
controls.maxDistance = 18;
controls.update();

scene.add(new THREE.AmbientLight(0x6a86a3, 0.3));
const key = new THREE.DirectionalLight(0xfff0d8, 2.2);
key.position.set(-5, 9, -4);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 1;
key.shadow.camera.far = 28;
key.shadow.camera.left = -8;
key.shadow.camera.right = 8;
key.shadow.camera.top = 10;
key.shadow.camera.bottom = -2;
key.shadow.bias = -0.00025;
scene.add(key);
const rim = new THREE.DirectionalLight(0x79c7ff, 1.05);
rim.position.set(6, 4, 5);
scene.add(rim);

function metal(color: number, metalness = 0.75, roughness = 0.45) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}
const floor = new THREE.Mesh(new THREE.BoxGeometry(14, 0.18, 10), metal(0x1a2430, 0.55, 0.62));
floor.position.set(0, -0.09, 1.2);
floor.receiveShadow = true;
scene.add(floor);

const art = new FacilityScissorArt(CONFIG);
art.group.traverse((o) => {
  const m = o as THREE.Mesh;
  if (m.isMesh) {
    m.castShadow = true;
    m.receiveShadow = true;
  }
});
scene.add(art.group);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.38, 0.5, 0.78);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

let paused = false;
let time = 0;
let last = performance.now();
pauseBtn.onclick = () => {
  paused = !paused;
  pauseBtn.textContent = paused ? 'Resume' : 'Pause';
};
bloomToggle.onchange = () => {
  bloomPass.enabled = bloomToggle.checked;
};

function resize() {
  const w = viewport.clientWidth;
  const h = viewport.clientHeight;
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  bloomPass.setSize(w, h);
}
resize();
window.addEventListener('resize', resize);

renderer.setAnimationLoop((now) => {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!paused) time += dt * Number(speedSelect.value);
  art.update(time);
  const s = scissorGateStateAtTime(CONFIG, time);
  status.textContent = `t=${time.toFixed(2)}s · aperture ${s.apertureWidth.toFixed(2)} · angle ${s.angle.toFixed(2)}`;
  controls.update();
  if (bloomToggle.checked) composer.render();
  else renderer.render(scene, camera);
});
