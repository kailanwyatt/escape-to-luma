import * as THREE from 'three';

import { VoidReachesDemo } from '../src/experiments/void-reaches';

const canvas = document.querySelector<HTMLCanvasElement>('#void-reaches-canvas');
if (!canvas) {
  throw new Error('Void Reaches canvas is missing.');
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x030711, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x030711, 14, 30);
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 80);
camera.position.set(0, 3.12, -8.5);
camera.lookAt(0, 3.12, 6);

scene.add(new THREE.AmbientLight(0x8b7fc6, 0.32));
const key = new THREE.DirectionalLight(0xc9eeff, 1.1);
key.position.set(-3, 5, -2);
scene.add(key);

const stars = new THREE.BufferGeometry();
const starPositions: number[] = [];
for (let index = 0; index < 180; index += 1) {
  starPositions.push((Math.random() - 0.5) * 24, (Math.random() - 0.5) * 16 + 3, 10 + Math.random() * 16);
}
stars.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
scene.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: 0x8f8ab7, size: 0.026, transparent: true, opacity: 0.72 })));

const demo = new VoidReachesDemo();
demo.show();
scene.add(demo.group);

let timeOffset = 0;
const start = performance.now();
const phaseButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-phase]'));
for (const button of phaseButtons) {
  button.addEventListener('click', () => {
    const target = Number(button.dataset.phase ?? 0);
    timeOffset = target - (performance.now() - start) / 1000;
    for (const candidate of phaseButtons) candidate.setAttribute('aria-pressed', String(candidate === button));
  });
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function render() {
  const elapsed = (performance.now() - start) / 1000 + timeOffset;
  demo.update(elapsed, false);
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

window.addEventListener('resize', resize);
resize();
render();
