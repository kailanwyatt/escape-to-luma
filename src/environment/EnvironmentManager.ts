import * as THREE from 'three';

import type { EnvironmentId } from '../config/ChallengeConfig';

export class EnvironmentManager {
  readonly group = new THREE.Group();
  readonly portal = new THREE.Group();
  current: EnvironmentId = 'workshop';
  private readonly skins: Record<EnvironmentId, THREE.Group>;
  private readonly ambient: THREE.AmbientLight;
  private readonly key: THREE.DirectionalLight;
  private readonly stars: THREE.Points;
  private starSpin = 0;

  constructor(scene: THREE.Scene) {
    this.ambient = new THREE.AmbientLight(0xc8bba8, 0.72);
    this.key = new THREE.DirectionalLight(0xfff1d6, 1.05);
    this.key.position.set(-3.5, 10, -4);
    const fill = new THREE.DirectionalLight(0x88a0c8, 0.22);
    fill.position.set(4.2, 3.4, 5);
    scene.add(this.ambient);
    scene.add(this.key);
    scene.add(fill);

    this.skins = {
      workshop: createWorkshop(),
      rooftop: createRooftop(),
      space: createSpace(),
    };
    for (const skin of Object.values(this.skins)) {
      skin.visible = false;
      this.group.add(skin);
    }
    this.skins.workshop.visible = true;

    this.stars = this.skins.space.getObjectByName('stars') as THREE.Points;
    this.portal = createPortal();
    this.portal.visible = false;
    this.group.add(this.portal);

    scene.background = new THREE.Color(0x1a1612);
    scene.fog = new THREE.Fog(0x1a1612, 18, 36);
    scene.add(this.group);
  }

  setEnvironment(id: EnvironmentId, scene: THREE.Scene, immediate = true): void {
    this.current = id;
    for (const [key, skin] of Object.entries(this.skins)) {
      skin.visible = key === id;
    }
    const look = LOOK[id];
    scene.background = new THREE.Color(look.background);
    scene.fog = new THREE.Fog(look.background, look.fogNear, look.fogFar);
    this.ambient.color.setHex(look.ambient);
    this.ambient.intensity = look.ambientIntensity;
    this.key.color.setHex(look.key);
    this.portal.visible = !immediate;
  }

  showPortal(kind: 'door' | 'tunnel' | 'ring'): void {
    this.portal.visible = true;
    this.portal.position.set(0, 3.1, 10.5);
    const door = this.portal.getObjectByName('door');
    const tunnel = this.portal.getObjectByName('tunnel');
    const ring = this.portal.getObjectByName('ring');
    if (door) {
      door.visible = kind === 'door';
    }
    if (tunnel) {
      tunnel.visible = kind === 'tunnel';
    }
    if (ring) {
      ring.visible = kind === 'ring';
    }
  }

  hidePortal(): void {
    this.portal.visible = false;
  }

  update(dt: number): void {
    if (this.current === 'space' && this.stars) {
      this.starSpin += dt * 0.03;
      this.stars.rotation.z = this.starSpin;
    }
  }
}

const LOOK: Record<
  EnvironmentId,
  { background: number; fogNear: number; fogFar: number; ambient: number; ambientIntensity: number; key: number }
> = {
  workshop: {
    background: 0x1a1612,
    fogNear: 18,
    fogFar: 36,
    ambient: 0xc8bba8,
    ambientIntensity: 0.72,
    key: 0xfff1d6,
  },
  rooftop: {
    background: 0x9ec8e6,
    fogNear: 22,
    fogFar: 48,
    ambient: 0xe8f3ff,
    ambientIntensity: 0.9,
    key: 0xfff6d8,
  },
  space: {
    background: 0x070814,
    fogNear: 28,
    fogFar: 70,
    ambient: 0x8899cc,
    ambientIntensity: 0.45,
    key: 0xc5deff,
  },
};

function createWorkshop(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'workshop';

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 28),
    new THREE.MeshLambertMaterial({ color: 0x3a3228 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 7);
  root.add(floor);

  for (let i = 0; i < 8; i += 1) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.02, 24),
      new THREE.MeshLambertMaterial({ color: 0x2e2720 }),
    );
    plank.position.set(-1.4 + i * 0.4, 0.01, 6);
    root.add(plank);
  }

  const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x2c2722 });
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 26), wallMaterial);
  leftWall.position.set(-5.2, 4, 6);
  root.add(leftWall);
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 26), wallMaterial);
  rightWall.position.set(5.2, 4, 6);
  root.add(rightWall);

  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(11, 9, 0.4),
    new THREE.MeshLambertMaterial({ color: 0x241f1b }),
  );
  backWall.position.set(0, 4.2, 16.2);
  root.add(backWall);

  const opening = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 4.4),
    new THREE.MeshBasicMaterial({ color: 0x0d0c10 }),
  );
  opening.position.set(0, 3.1, 16);
  root.add(opening);

  const beamMaterial = new THREE.MeshLambertMaterial({ color: 0x1f1a16 });
  for (const z of [1, 4.5, 8, 11.5, 15]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(11, 0.28, 0.38), beamMaterial);
    beam.position.set(0, 7.4, z);
    root.add(beam);
  }

  const crateMaterial = new THREE.MeshLambertMaterial({ color: 0x8a5a32 });
  const crates = [
    { x: -4.2, y: 0.55, z: 2.2, s: 1.1 },
    { x: -4.0, y: 0.4, z: 8.4, s: 0.8 },
    { x: 4.15, y: 0.5, z: 3.6, s: 1 },
    { x: 4.3, y: 0.35, z: 10.2, s: 0.7 },
    { x: -4.35, y: 0.7, z: 13.2, s: 1.4 },
    { x: 4.1, y: 0.45, z: 14.4, s: 0.9 },
  ];
  for (const crate of crates) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(crate.s, crate.s, crate.s), crateMaterial);
    mesh.position.set(crate.x, crate.y, crate.z);
    mesh.rotation.y = crate.z * 0.08;
    root.add(mesh);
  }

  const pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x6d7380 });
  const leftPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 10, 10), pipeMaterial);
  leftPipe.position.set(-4.7, 6.4, 6);
  leftPipe.rotation.x = Math.PI / 2;
  root.add(leftPipe);

  const vent = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.12, 1.1),
    new THREE.MeshLambertMaterial({ color: 0x4a4540 }),
  );
  vent.position.set(4.2, 0.08, 6.4);
  root.add(vent);

  const lamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.12, 1.8),
    new THREE.MeshPhongMaterial({
      color: 0xffe7b0,
      emissive: 0xffc46b,
      emissiveIntensity: 0.55,
    }),
  );
  lamp.position.set(0, 7.15, 6);
  root.add(lamp);

  return root;
}

function createRooftop(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'rooftop';

  const roof = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 32),
    new THREE.MeshLambertMaterial({ color: 0x8d97a3 }),
  );
  roof.rotation.x = -Math.PI / 2;
  roof.position.set(0, 0, 7);
  root.add(roof);

  const parapet = new THREE.MeshLambertMaterial({ color: 0xd5dde4 });
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, 28), parapet);
  left.position.set(-5.4, 0.55, 6);
  root.add(left);
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, 28), parapet);
  right.position.set(5.4, 0.55, 6);
  root.add(right);

  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 18),
    new THREE.MeshBasicMaterial({ color: 0x7fb7dd }),
  );
  sky.position.set(0, 7, 18);
  root.add(sky);

  const building = new THREE.MeshLambertMaterial({ color: 0x6b7785 });
  for (const spec of [
    { x: -7.5, y: 3.2, z: 14, w: 3.2, h: 6.4, d: 3 },
    { x: 7.8, y: 2.4, z: 12, w: 2.6, h: 4.8, d: 2.4 },
    { x: -8.2, y: 2.0, z: 8, w: 2.2, h: 4, d: 2 },
  ]) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(spec.w, spec.h, spec.d), building);
    mesh.position.set(spec.x, spec.y, spec.z);
    root.add(mesh);
  }

  const ac = new THREE.MeshLambertMaterial({ color: 0xb7c0c8 });
  for (const spec of [
    { x: -4.3, z: 3.2, s: 1.1 },
    { x: 4.4, z: 9.5, s: 0.9 },
    { x: -4.6, z: 13, s: 1.3 },
  ]) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(spec.s, spec.s * 0.7, spec.s), ac);
    mesh.position.set(spec.x, spec.s * 0.35, spec.z);
    root.add(mesh);
  }

  const tank = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 1.4, 12),
    new THREE.MeshLambertMaterial({ color: 0xcfd8de }),
  );
  tank.position.set(4.6, 0.7, 5.2);
  root.add(tank);

  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 3.2, 6),
    new THREE.MeshLambertMaterial({ color: 0x44505a }),
  );
  antenna.position.set(-4.8, 2.2, 11);
  root.add(antenna);

  for (let i = 0; i < 7; i += 1) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.02, 22),
      new THREE.MeshLambertMaterial({ color: 0x7b858f }),
    );
    stripe.position.set(-1.2 + i * 0.4, 0.02, 6);
    root.add(stripe);
  }

  const barrier = new THREE.MeshLambertMaterial({ color: 0xd8c36a });
  for (const z of [2.5, 7.5, 12.5]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.12), barrier);
    post.position.set(-4.9, 1.0, z);
    root.add(post);
  }

  const duct = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.35, 4.2),
    new THREE.MeshLambertMaterial({ color: 0xa8b2bb }),
  );
  duct.position.set(4.7, 0.28, 7.2);
  root.add(duct);

  return root;
}

function createSpace(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'space';

  const deck = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 26),
    new THREE.MeshLambertMaterial({ color: 0x1b2230 }),
  );
  deck.rotation.x = -Math.PI / 2;
  deck.position.set(0, 0, 7);
  root.add(deck);

  const starGeom = new THREE.BufferGeometry();
  const positions = new Float32Array(240);
  for (let i = 0; i < 80; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 28;
    positions[i * 3 + 1] = Math.random() * 14;
    positions[i * 3 + 2] = 8 + Math.random() * 18;
  }
  starGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(
    starGeom,
    new THREE.PointsMaterial({ color: 0xe8f0ff, size: 0.08 }),
  );
  stars.name = 'stars';
  root.add(stars);

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 16, 12),
    new THREE.MeshLambertMaterial({ color: 0x4b6d9a }),
  );
  planet.position.set(6.5, 6.8, 18);
  root.add(planet);

  const panelMat = new THREE.MeshLambertMaterial({ color: 0x274a7a });
  const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.6, 6), panelMat);
  leftPanel.position.set(-5.0, 3.4, 8);
  root.add(leftPanel);
  const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.6, 6), panelMat);
  rightPanel.position.set(5.0, 3.4, 10);
  root.add(rightPanel);

  const station = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 1.1, 3.4),
    new THREE.MeshLambertMaterial({ color: 0x8d97a8 }),
  );
  station.position.set(-4.6, 0.7, 13);
  root.add(station);

  const debris = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.18, 0.5),
    new THREE.MeshLambertMaterial({ color: 0x9aa7b8 }),
  );
  debris.position.set(4.2, 2.8, 7.5);
  debris.rotation.set(0.4, 0.7, 0.2);
  root.add(debris);

  for (let i = 0; i < 6; i += 1) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.03, 18),
      new THREE.MeshPhongMaterial({
        color: 0x7ef0ff,
        emissive: 0x145868,
        emissiveIntensity: 0.7,
      }),
    );
    strip.position.set(-1.0 + i * 0.4, 0.02, 7);
    root.add(strip);
  }

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.35, 0.06, 8, 28),
    new THREE.MeshPhongMaterial({
      color: 0x7a5cff,
      emissive: 0x3a1a88,
      emissiveIntensity: 0.55,
    }),
  );
  ring.position.set(-6.4, 5.4, 16);
  ring.rotation.y = 0.6;
  root.add(ring);

  return root;
}

function createPortal(): THREE.Group {
  const group = new THREE.Group();
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 5.2, 0.4),
    new THREE.MeshLambertMaterial({ color: 0x1a1612 }),
  );
  door.name = 'door';
  const doorHole = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 3.8),
    new THREE.MeshBasicMaterial({ color: 0x9ec8e6 }),
  );
  doorHole.position.z = 0.22;
  door.add(doorHole);
  group.add(door);

  const tunnel = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.8, 6, 16, 1, true),
    new THREE.MeshLambertMaterial({ color: 0x101018, side: THREE.DoubleSide }),
  );
  tunnel.rotation.x = Math.PI / 2;
  tunnel.name = 'tunnel';
  tunnel.visible = false;
  group.add(tunnel);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.7, 0.18, 8, 28),
    new THREE.MeshPhongMaterial({ color: 0x7ef0ff, emissive: 0x145868, emissiveIntensity: 0.8 }),
  );
  ring.name = 'ring';
  ring.visible = false;
  group.add(ring);

  return group;
}

