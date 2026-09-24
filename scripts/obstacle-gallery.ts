/**
 * Browser obstacle gallery — same Three.js art as gameplay (ObstacleSlot).
 * Bundled by serve-asset-viewer.cjs via esbuild.
 */
import * as THREE from 'three';

import type { ObstacleConfig } from '../src/config/ObstacleConfig';
import { GAME_TUNING } from '../src/game/gameTuning';
import { ObstacleSlot } from '../src/obstacles/ObstacleSlot';

type Preset = {
  id: string;
  name: string;
  family: 'library' | 'story' | 'classic';
  environment: 'workshop' | 'rooftop' | 'space';
  /** Campaign teach level when this is an isolation course. */
  level?: number;
  config: ObstacleConfig;
};

const Z = GAME_TUNING.rotor.z;

/** Representative configs (aligned with LibraryEncounters isolation courses). */
const PRESETS: Preset[] = [
  {
    id: 'pistonField',
    name: 'Piston Field',
    family: 'library',
    environment: 'workshop',
    config: {
      type: 'pistonField',
      z: Z,
      laneCount: 4,
      spacing: 1.4,
      floorY: 0.12,
      clearY: 2.15,
      pistonHeight: 0.48,
      minExtension: 0.12,
      maxExtension: 3.35,
      speed: 0.8,
      halfWidth: 0.36,
    },
  },
  {
    id: 'elevatorBlocks',
    name: 'Elevator Blocks',
    family: 'library',
    environment: 'workshop',
    config: {
      type: 'elevatorBlocks',
      z: Z,
      laneCount: 3,
      spacing: 1.7,
      baseY: 3,
      amplitude: 0.75,
      speed: 0.7,
      blockWidth: 0.85,
      blockHeight: 0.55,
    },
  },
  {
    id: 'reactiveGate',
    name: 'Reactive Gate',
    family: 'library',
    environment: 'workshop',
    config: {
      type: 'reactiveGate',
      z: Z,
      centerX: 0,
      centerY: 3,
      closedWidth: 0.08,
      openWidth: 2.35,
      openHeight: 2.5,
      speed: 0.85,
      closedHold: 0.7,
      warningHold: 0.4,
      openHold: 1.15,
    },
  },
  {
    id: 'splitShutter',
    name: 'Split Shutter',
    family: 'library',
    environment: 'workshop',
    config: {
      type: 'splitShutter',
      z: Z,
      centerX: 0,
      centerY: 3,
      panelWidth: 1.45,
      panelHeight: 2.4,
      minGap: 0.1,
      maxGap: 2.35,
      speed: 1,
      closedHold: 0.55,
      openingDuration: 0.26,
      openHold: 0.4,
      warningHold: 0.22,
      slamDuration: 0.16,
    },
  },
  {
    id: 'clockHands',
    name: 'Clock Hands',
    family: 'library',
    environment: 'workshop',
    config: {
      type: 'clockHands',
      z: Z,
      hubX: 0,
      hubY: 4.05,
      length: 1.9,
      thickness: 0.09,
      handCount: 2,
      speed: 0.35,
      hubRadius: 0.2,
    },
  },
  {
    id: 'conveyorGate',
    name: 'Patrol Drones',
    family: 'library',
    environment: 'rooftop',
    config: {
      type: 'conveyorGate',
      z: Z,
      centerX: 0,
      centerY: 3,
      blockCount: 3,
      blockRadius: 0.3,
      wrapWidth: 5.8,
      speed: 0.7,
    },
  },
  {
    id: 'billboardFlip',
    name: 'Billboard Flip',
    family: 'library',
    environment: 'rooftop',
    config: {
      type: 'billboardFlip',
      z: Z,
      centerX: 0,
      centerY: 3,
      halfWidth: 1.55,
      halfHeight: 1.05,
      halfDepth: 0.08,
      maxAngle: Math.PI * 0.5,
      openAngle: 1.0,
      speed: 0.58,
    },
  },
  {
    id: 'scissorGate',
    name: 'Capture Pincers',
    family: 'library',
    environment: 'rooftop',
    level: 21,
    config: {
      type: 'scissorGate',
      z: Z,
      centerX: 0,
      centerY: 3.55,
      barLength: 1.85,
      barThickness: 0.1,
      maxAngle: 0.72,
      minAngle: 0.1,
      speed: 0.78,
      pattern: 'sine',
    },
  },
  {
    id: 'groundCutLasers',
    name: 'Ground Cutters',
    family: 'library',
    environment: 'rooftop',
    level: 32,
    config: {
      type: 'groundCutLasers',
      z: Z,
      floorY: -3.4,
      ceilingY: 5.6,
      centerX: -0.15,
      spanX: 2.35,
      beamCount: 3,
      thickness: 0.06,
      speed: 0.48,
      fanAngle: 0.58,
      aimX: 0.45,
      crossDuty: 0.36,
    },
  },
  {
    id: 'rotatingGate',
    name: 'Rotating Gate',
    family: 'library',
    environment: 'rooftop',
    level: 33,
    config: {
      type: 'rotatingGate',
      z: Z,
      centerX: 0,
      centerY: 3.05,
      outerRadius: 1.9,
      innerRadius: 0.28,
      gapWidth: 0.78,
      speed: 0.85,
    },
  },
  {
    id: 'movingRing',
    name: 'Climb Ring (legacy)',
    family: 'classic',
    environment: 'rooftop',
    config: {
      type: 'movingRing',
      z: Z,
      radius: 1.05,
      baseX: 0,
      baseY: 3.05,
      movement: {
        type: 'horizontal',
        amplitudeX: 0.95,
        amplitudeY: 0,
        speed: 0.72,
      },
    },
  },
  {
    id: 'pulseRing',
    name: 'Pulse Ring',
    family: 'library',
    environment: 'space',
    level: 40,
    config: {
      type: 'pulseRing',
      z: Z,
      centerX: 0,
      centerY: 3.05,
      minRadius: 0.72,
      maxRadius: 2.55,
      thickness: 0.15,
      speed: 0.78,
      driftAmplitude: 1.05,
      driftSpeed: 0.62,
    },
  },
  {
    id: 'rollingAperture',
    name: 'Rolling Aperture',
    family: 'library',
    environment: 'space',
    level: 47,
    config: {
      type: 'rollingAperture',
      z: Z,
      baseX: 0,
      baseY: 3,
      minRadius: 1.05,
      maxRadius: 1.6,
      pulseSpeed: 0.55,
      driftSpeed: 0.28,
      driftAmplitudeX: 0.32,
      driftAmplitudeY: 0.18,
    },
  },
  {
    id: 'dockingCollar',
    name: 'Docking Collar',
    family: 'library',
    environment: 'space',
    level: 48,
    config: {
      type: 'dockingCollar',
      z: Z,
      centerX: 0,
      centerY: 3,
      outerRadius: 2.15,
      openRadius: 1.15,
      closedRadius: 0.12,
      speed: 0.95,
      closedHold: 0.5,
      openingDuration: 0.35,
      openHold: 0.85,
      warningHold: 0.32,
      slamDuration: 0.18,
    },
  },
  {
    id: 'energyField',
    name: 'Energy Field',
    family: 'library',
    environment: 'space',
    level: 70,
    config: {
      type: 'energyField',
      z: Z,
      centerX: 0,
      centerY: 3.05,
      halfWidth: 2.55,
      halfHeight: 2.05,
      holeRadius: 0.88,
      driftAmplitudeX: 1.2,
      driftAmplitudeY: 0.08,
      driftSpeed: 0.52,
      speed: 0.52,
    },
  },
  {
    id: 'iris',
    name: 'Iris (legacy airlock)',
    family: 'classic',
    environment: 'space',
    config: {
      type: 'iris',
      z: Z,
      centerX: 0,
      centerY: 3.05,
      minRadius: 0.72,
      maxRadius: 1.45,
      speed: 0.55,
    },
  },
  {
    id: 'movingSafeZone',
    name: 'Moving Safe Zone',
    family: 'story',
    environment: 'space',
    level: 71,
    config: {
      type: 'movingSafeZone',
      z: Z,
      centerX: 0,
      centerY: 3,
      fieldRadius: 2.2,
      holeRadius: 0.95,
      baseX: 0,
      baseY: 3,
      driftSpeed: 0.55,
      driftAmplitudeX: 0.55,
      driftAmplitudeY: 0.35,
    },
  },
  {
    id: 'orbitingMoons',
    name: 'Relay Beacons',
    family: 'story',
    environment: 'space',
    level: 77,
    config: {
      type: 'orbitingMoons',
      z: Z,
      centerX: 0,
      centerY: 3,
      orbitRadius: 1.35,
      moonRadius: 0.38,
      moonCount: 3,
      speed: 0.68,
      beaconPulse: {
        kind: 'laser',
        range: 1.35,
        speed: 0.9,
        offHold: 0.7,
        warningHold: 0.35,
        onHold: 0.55,
        thickness: 0.09,
      },
    },
  },
  {
    id: 'magnetopause',
    name: 'Magnetopause',
    family: 'story',
    environment: 'space',
    config: {
      type: 'magnetopause',
      z: Z,
      centerX: 0,
      centerY: 3,
      innerRadius: 0.75,
      outerRadius: 1.85,
      gapWidth: 1.9,
      speed: 0.4,
    },
  },
  {
    id: 'lagrangeNull',
    name: 'Lagrange Null',
    family: 'story',
    environment: 'space',
    config: {
      type: 'lagrangeNull',
      z: Z,
      centerX: 0,
      centerY: 3,
      radius: 1.15,
    },
  },
  {
    id: 'corkscrewTunnel',
    name: 'Transit Conduit',
    family: 'library',
    environment: 'space',
    level: 86,
    config: {
      type: 'corkscrewTunnel',
      z: Z,
      centerX: 0,
      centerY: 3,
      radius: 1.85,
      gapWidth: 0.82,
      innerRadius: 0.28,
      speed: 0.72,
      helixStep: 0.55,
      segmentIndex: 0,
    },
  },
  {
    id: 'orbiter',
    name: 'Belt Rock',
    family: 'classic',
    environment: 'space',
    level: 92,
    config: {
      type: 'orbiter',
      z: Z,
      centerX: 0.9,
      centerY: 3.15,
      orbitRadius: 1.2,
      blockerRadius: 0.48,
      speed: 0.58,
    },
  },
  {
    id: 'accretionShredder',
    name: 'Debris Spiral',
    family: 'story',
    environment: 'space',
    level: 93,
    config: {
      type: 'accretionShredder',
      z: Z,
      centerX: 0,
      centerY: 3,
      outerRadius: 2.1,
      debrisCount: 7,
      debrisRadius: 0.22,
      speed: 0.4,
      turns: 1.4,
    },
  },
  {
    id: 'shearLane',
    name: 'Shear Lane',
    family: 'library',
    environment: 'space',
    level: 94,
    config: {
      type: 'shearLane',
      z: Z,
      centerX: 0,
      centerY: 3,
      gapHeight: 0.9,
      blockCount: 4,
      blockRadius: 0.34,
      wrapWidth: 6.4,
      speed: 0.78,
    },
  },
  {
    id: 'repulsor',
    name: 'Repulsor',
    family: 'library',
    environment: 'space',
    level: 100,
    config: {
      type: 'repulsor',
      z: Z,
      centerX: 0,
      centerY: 3.05,
      coreRadius: 0.48,
      fieldRadius: 2.65,
      strength: 14,
      pulseSpeed: 1.15,
    },
  },
  {
    id: 'speedField',
    name: 'Speed Field (legacy)',
    family: 'classic',
    environment: 'space',
    config: {
      type: 'speedField',
      z: Z,
      centerX: 0,
      centerY: 3,
      width: 2.8,
      height: 2.6,
      speedMultiplier: 1.35,
      pulseSpeed: 1.0,
    },
  },
  {
    id: 'pulsarBeam',
    name: 'Security Sweep',
    family: 'story',
    environment: 'space',
    level: 101,
    config: {
      type: 'pulsarBeam',
      z: Z,
      centerX: 0,
      centerY: 3,
      halfWidth: 0.55,
      orientation: 'vertical',
      speed: 1,
      onHold: 0.55,
      offHold: 0.95,
    },
  },
  {
    id: 'nullTendril',
    name: 'Null Tendril',
    family: 'story',
    environment: 'space',
    level: 111,
    config: {
      type: 'nullTendril',
      z: Z,
      centerX: 0,
      centerY: 3,
      outerRadius: 2.15,
      innerRadius: 0.45,
      tendrilCount: 5,
      gapWidth: 0.95,
      speed: 0.55,
    },
  },
  {
    id: 'nullLash',
    name: 'Null Lash',
    family: 'story',
    environment: 'space',
    level: 112,
    config: {
      type: 'nullLash',
      z: Z,
      pivotX: 0,
      pivotY: 4.75,
      length: 2.6,
      thickness: 0.18,
      restAngle: 0.95,
      lashSpan: -Math.PI / 2 - 0.95,
      speed: 1.05,
      coiledHold: 0.48,
      warningHold: 0.26,
      lashDuration: 0.2,
      extendedHold: 0.75,
      retractDuration: 0.38,
    },
  },
  {
    id: 'theNull',
    name: 'The Null',
    family: 'story',
    environment: 'space',
    level: 113,
    config: {
      type: 'theNull',
      z: Z,
      centerX: 0,
      centerY: 3,
      fieldRadius: 2.2,
      holeRadius: 0.95,
      baseX: 0,
      baseY: 3,
      driftSpeed: 0.55,
      driftAmplitudeX: 0.55,
      driftAmplitudeY: 0.35,
    },
  },
  {
    id: 'teleportPortal',
    name: 'Teleport Portal',
    family: 'story',
    environment: 'space',
    level: 117,
    config: {
      type: 'teleportPortal',
      z: Z,
      anchors: [
        { x: 0, y: 3 },
        { x: -1.1, y: 3.35 },
        { x: 1.1, y: 2.7 },
      ],
      radius: 0.95,
      speed: 1,
      dwell: 1.1,
      warning: 0.55,
    },
  },
  {
    id: 'entryExitPortal',
    name: 'False Entries',
    family: 'story',
    environment: 'space',
    level: 118,
    config: {
      type: 'entryExitPortal',
      z: Z,
      entryX: 0,
      entryY: 3.05,
      exitX: 0,
      exitY: 4.9,
      radius: 0.62,
      disks: [
        { x: -1.35, y: 3.05 },
        { x: 0, y: 3.05 },
        { x: 1.35, y: 3.05 },
      ],
      speed: 0.48,
      phase: 0.1,
      warningHold: 0.32,
      destinationDepth: 5.6,
    },
  },
  {
    id: 'phaseGate',
    name: 'Phase Gate',
    family: 'library',
    environment: 'space',
    level: 129,
    config: {
      type: 'phaseGate',
      z: Z,
      centerX: 0,
      centerY: 3,
      fieldRadius: 1.12,
      speed: 0.72,
      phase: (-6 / 8.5) * 0.72,
      openRatio: 0.48,
      warningRatio: 0.12,
    },
  },
  {
    id: 'rotor',
    name: 'Rotor (classic)',
    family: 'classic',
    environment: 'workshop',
    config: {
      bladeCount: 3,
      rotationSpeed: 0.55,
      direction: 1,
      z: Z,
      initialRotation: Math.PI / 2,
    },
  },
];

type Entry = {
  preset: Preset;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  slot: ObstacleSlot;
  view: HTMLElement;
  card: HTMLElement;
};

const gallery = document.getElementById('gallery')!;
const filter = document.getElementById('family') as HTMLSelectElement;
const pauseBtn = document.getElementById('pause') as HTMLButtonElement;
const search = document.getElementById('q') as HTMLInputElement;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x0a141c, 1);
document.body.appendChild(renderer.domElement);
Object.assign(renderer.domElement.style, {
  position: 'fixed',
  inset: '0',
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  zIndex: '0',
});

let paused = false;
pauseBtn.onclick = () => {
  paused = !paused;
  pauseBtn.textContent = paused ? 'Resume' : 'Pause';
};

const entries: Entry[] = PRESETS.map((preset) => {
  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.family = preset.family;
  card.dataset.id = preset.id;
  card.innerHTML = `
    <div class="view"></div>
    <div class="meta">
      <div class="title">${preset.name}</div>
      <div class="row">
        <span class="badge">${preset.family}</span>
        <span class="badge">${preset.config.type ?? 'rotor'}</span>
        ${preset.level != null ? `<span class="badge level">L${preset.level}</span>` : ''}
      </div>
    </div>`;
  gallery.appendChild(card);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x122030);
  scene.add(new THREE.AmbientLight(0xcbdfff, 1.15));
  const key = new THREE.DirectionalLight(0xffe0b5, 1.8);
  key.position.set(-3, 7, -5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x88aaff, 0.55);
  fill.position.set(4, 2, 3);
  scene.add(fill);

  const slot = new ObstacleSlot(preset.id);
  scene.add(slot.group);
  slot.applyConfig(preset.config, preset.environment);

  const camera = new THREE.PerspectiveCamera(GAME_TUNING.camera.fov, 1, 0.1, 80);
  camera.position.fromArray(GAME_TUNING.camera.position);
  camera.lookAt(...GAME_TUNING.camera.lookAt);

  return { preset, scene, camera, slot, view: card.querySelector('.view')!, card };
});

function applyFilters() {
  const family = filter.value;
  const q = search.value.trim().toLowerCase();
  for (const e of entries) {
  const hay = `${e.preset.name} ${e.preset.id} ${e.preset.family} ${e.preset.level ?? ''}`.toLowerCase();
    const hide =
      (family !== 'all' && e.preset.family !== family) || (q.length > 0 && !hay.includes(q));
    e.card.hidden = hide;
  }
  document.getElementById('stats')!.textContent =
    `${entries.filter((e) => !e.card.hidden).length} / ${entries.length} obstacles`;
}

filter.onchange = applyFilters;
search.oninput = applyFilters;
applyFilters();

let last = performance.now();
let time = 0;
renderer.setAnimationLoop((now) => {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (!paused) time += dt;

  renderer.setSize(innerWidth, innerHeight, false);
  renderer.setScissorTest(false);
  renderer.clear();
  renderer.setScissorTest(true);

  for (const e of entries) {
    if (e.card.hidden) continue;
    e.slot.update(paused ? 0 : dt, time);
    const r = e.view.getBoundingClientRect();
    if (r.width < 2 || r.bottom < 0 || r.top > innerHeight) continue;
    e.camera.aspect = r.width / r.height;
    e.camera.updateProjectionMatrix();
    const x = r.left;
    const y = innerHeight - r.bottom;
    renderer.setViewport(x, y, r.width, r.height);
    renderer.setScissor(x, y, r.width, r.height);
    renderer.render(e.scene, e.camera);
  }
});
