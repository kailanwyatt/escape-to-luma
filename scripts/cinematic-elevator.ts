/**
 * Look-dev showcase: cinematic elevator blocks.
 * Uses gameplay FacilityElevatorArt + elevatorBlocksStateAtTime.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import type { ElevatorBlocksConfig } from '../src/config/ObstacleConfig';
import { FacilityElevatorArt } from '../src/obstacles/FacilityElevatorArt';
import { elevatorBlocksStateAtTime } from '../src/obstacles/ElevatorBlocksState';
import { GAME_TUNING } from '../src/game/gameTuning';

const CONFIG: ElevatorBlocksConfig = {
  type: 'elevatorBlocks',
  z: GAME_TUNING.rotor.z,
  laneCount: 3,
  spacing: 1.7,
  baseY: 3,
  amplitude: 0.75,
  speed: 0.7,
  blockWidth: 0.85,
  blockHeight: 0.55,
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
camera.position.set(-3.8, 3.4, -8.4);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2.6, 0);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 4;
controls.maxDistance = 16;
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
const overhead = new THREE.SpotLight(0xcfe8ff, 48, 22, 0.5, 0.45, 1.4);
overhead.position.set(0, 9, -1);
overhead.target.position.set(0, 2, 0);
scene.add(overhead, overhead.target);

function metal(color: number, metalness = 0.75, roughness = 0.45) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}
const floor = new THREE.Mesh(new THREE.BoxGeometry(14, 0.18, 10), metal(0x1a2430, 0.55, 0.62));
floor.position.set(0, -0.09, 1.2);
floor.receiveShadow = true;
scene.add(floor);
const wall = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 0.35), metal(0x121a24, 0.35, 0.72));
wall.position.set(0, 3.8, 2.4);
wall.receiveShadow = true;
scene.add(wall);
for (let i = -2; i <= 2; i++) {
  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 0.12), metal(0x3d4f5f, 0.8, 0.32));
  panel.position.set(i * 2.55, 2.5, 2.18);
  panel.castShadow = true;
  scene.add(panel);
}

const elevator = new FacilityElevatorArt(CONFIG);
elevator.group.traverse((o) => {
  const m = o as THREE.Mesh;
  if (m.isMesh) {
    m.castShadow = true;
    m.receiveShadow = true;
  }
});
scene.add(elevator.group);

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
  elevator.update(time);
  const ys = elevatorBlocksStateAtTime(CONFIG, time).map((p) => p.y.toFixed(2)).join(' · ');
  status.textContent = `t=${time.toFixed(2)}s · lanes y ${ys}`;
  controls.update();
  if (bloomToggle.checked) composer.render();
  else renderer.render(scene, camera);
});
