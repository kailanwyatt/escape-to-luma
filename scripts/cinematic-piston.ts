/**
 * Look-dev showcase: cinematic containment pistons.
 * Uses gameplay CinematicPistonArt + pistonFieldStateAtTime; adds chamber set dressing,
 * cinematic lights/shadows, and bloom (browser-only — not wired into the mobile game).
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import type { PistonFieldConfig } from '../src/config/ObstacleConfig';
import { CinematicPistonArt } from '../src/obstacles/CinematicPistonArt';
import { pistonFieldStateAtTime } from '../src/obstacles/PistonFieldState';

const CONFIG: PistonFieldConfig = {
  type: 'pistonField',
  z: 6,
  laneCount: 4,
  spacing: 1.35,
  floorY: 0.12,
  clearY: 2.15,
  pistonHeight: 0.52,
  minExtension: 0.18,
  maxExtension: 3.55,
  speed: 0.72,
  halfWidth: 0.38,
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
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewport.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050b12);
scene.fog = new THREE.FogExp2(0x071018, 0.045);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
camera.position.set(-4.2, 3.4, -7.8);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2.1, 0);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 4;
controls.maxDistance = 16;
controls.update();

// —— Studio / containment lighting ——
scene.add(new THREE.AmbientLight(0x6a86a3, 0.28));

const key = new THREE.DirectionalLight(0xfff0d8, 2.35);
key.position.set(-5.5, 9.5, -4.5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 1;
key.shadow.camera.far = 28;
key.shadow.camera.left = -8;
key.shadow.camera.right = 8;
key.shadow.camera.top = 10;
key.shadow.camera.bottom = -2;
key.shadow.bias = -0.00025;
key.shadow.normalBias = 0.03;
scene.add(key);

const rim = new THREE.DirectionalLight(0x79c7ff, 1.15);
rim.position.set(6, 4.5, 5);
scene.add(rim);

const warmFill = new THREE.PointLight(0xff9a45, 18, 14, 2);
warmFill.position.set(0.4, 1.2, -2.4);
scene.add(warmFill);

const overhead = new THREE.SpotLight(0xcfe8ff, 55, 22, 0.55, 0.45, 1.4);
overhead.position.set(0, 9.5, -1);
overhead.target.position.set(0, 0, 0);
overhead.castShadow = true;
overhead.shadow.mapSize.set(1024, 1024);
scene.add(overhead, overhead.target);

// —— Chamber set ——
const setRoot = new THREE.Group();
scene.add(setRoot);

function metal(color: number, metalness = 0.78, roughness = 0.42) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

const floorMat = metal(0x1a2430, 0.55, 0.62);
const grateMat = metal(0x2a3848, 0.7, 0.38);
const wallMat = metal(0x121a24, 0.35, 0.72);
const accentMat = metal(0x3d4f5f, 0.8, 0.32);
const hazard = new THREE.MeshStandardMaterial({
  color: 0x2a1808,
  metalness: 0.2,
  roughness: 0.55,
  emissive: 0xff6a10,
  emissiveIntensity: 0.22,
});

const floor = new THREE.Mesh(new THREE.BoxGeometry(14, 0.18, 10), floorMat);
floor.position.set(0, -0.09, 1.2);
floor.receiveShadow = true;
setRoot.add(floor);

// Floor grate channels under each lane
for (let i = 0; i < CONFIG.laneCount; i++) {
  const mid = (CONFIG.laneCount - 1) / 2;
  const x = (i - mid) * CONFIG.spacing;
  const trench = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.halfWidth! * 2.35, 0.06, 1.35), grateMat);
  trench.position.set(x, 0.01, 0.15);
  trench.receiveShadow = true;
  setRoot.add(trench);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.halfWidth! * 2.55, 0.035, 0.08), accentMat);
  lip.position.set(x, 0.045, -0.52);
  lip.castShadow = true;
  setRoot.add(lip);
}

const backWall = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 0.35), wallMat);
backWall.position.set(0, 3.8, 2.55);
backWall.receiveShadow = true;
setRoot.add(backWall);

for (let i = -2; i <= 2; i++) {
  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.4, 0.12), accentMat);
  panel.position.set(i * 2.55, 2.6, 2.32);
  panel.castShadow = true;
  panel.receiveShadow = true;
  setRoot.add(panel);
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.04, 3.2, 0.14), metal(0x0a1018, 0.4, 0.8));
  seam.position.set(i * 2.55 + 1.1, 2.6, 2.28);
  setRoot.add(seam);
}

// Hazard strip along the wall base
const strip = new THREE.Mesh(new THREE.BoxGeometry(12, 0.12, 0.08), hazard);
strip.position.set(0, 0.28, 2.28);
setRoot.add(strip);

// Side bulkheads
for (const side of [-1, 1]) {
  const bulk = new THREE.Mesh(new THREE.BoxGeometry(0.55, 6.5, 8), wallMat);
  bulk.position.set(side * 6.2, 3.1, 0.5);
  bulk.castShadow = true;
  bulk.receiveShadow = true;
  setRoot.add(bulk);
}

// Ceiling beams
for (let i = -2; i <= 2; i++) {
  const beam = new THREE.Mesh(new THREE.BoxGeometry(12, 0.28, 0.35), accentMat);
  beam.position.set(0, 7.2, i * 1.4);
  beam.castShadow = true;
  setRoot.add(beam);
}

// Soft volumetric-looking light shafts (transparent planes)
const shaftMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide,
  uniforms: { uTime: { value: 0 } },
  vertexShader: `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.);
    }`,
  fragmentShader: `
    varying vec2 vUv;
    uniform float uTime;
    void main(){
      float beam = pow(1. - abs(vUv.x - .5) * 2., 2.4);
      float fall = smoothstep(0., .15, vUv.y) * (1. - smoothstep(.55, 1., vUv.y));
      float dust = .85 + .15 * sin(vUv.y * 40. - uTime * 1.2);
      float a = beam * fall * dust * .11;
      gl_FragColor = vec4(.55, .72, .95, a);
    }`,
});
const shaft = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 7.5), shaftMat);
shaft.position.set(-1.2, 3.6, -0.8);
shaft.rotation.y = 0.35;
setRoot.add(shaft);

// —— Pistons (gameplay art) ——
const pistons = Array.from({ length: CONFIG.laneCount }, () => {
  const art = new CinematicPistonArt();
  art.group.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });
  scene.add(art.group);
  return art;
});

// —— Post ——
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.42, 0.55, 0.82);
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

  const lanes = pistonFieldStateAtTime(CONFIG, time);
  lanes.forEach((lane, i) => pistons[i]?.update(lane));

  const openCount = lanes.filter((l) => l.open).length;
  const tips = lanes.map((l) => l.top.toFixed(2)).join(' · ');
  status.textContent = `t=${time.toFixed(2)}s · open lanes ${openCount}/${lanes.length} · tip Y ${tips}`;

  (shaftMat.uniforms.uTime as { value: number }).value = time;
  warmFill.intensity = 14 + 6 * (0.5 + 0.5 * Math.sin(time * 1.7));

  controls.update();
  if (bloomToggle.checked) composer.render();
  else renderer.render(scene, camera);
});
