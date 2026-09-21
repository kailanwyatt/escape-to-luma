import {AmbientLife} from './AmbientLife';
import {createJourneyWorldScene,isJourneyWorld,JOURNEY_LOOKS} from './JourneyWorldScene';
import {disposeThreeObject} from '../utils/disposeThree';
import {createSpaceScene} from './SpaceScene';
import {createRooftopScene} from './RooftopScene';
import { containmentMetal } from '../graphics/ContainmentMaterials';
import * as THREE from 'three';
import { ContainmentKit } from './ContainmentKit';
import { containmentProfile } from './WorldPresentation';

import type { EnvironmentId } from '../config/ChallengeConfig';

export class EnvironmentManager {
  private readonly containmentKit = new ContainmentKit();
  private alarm = 0;
  private readonly ambientLife = new AmbientLife();
  private journeyKit: THREE.Group | null = null;
  private journeyWorld: string | null = null;
  setCampaignLevel(level: number | null): void {
    this.containmentKit.setLevel(level);
    this.alarm = level === null ? 0 : containmentProfile(level).alarm;
    this.setOpeningLighting(-1, 0);
  }

  /** Earth belongs to the near-Earth leg; it must not follow Spark to Luma. */
  setSpaceWorld(worldId: string | null): void {
    if (this.journeyKit) this.journeyKit.visible=false;
    if(this.journeyWorld!==worldId&&this.journeyKit){this.group.remove(this.journeyKit);disposeThreeObject(this.journeyKit);this.journeyKit=null;}
    this.journeyWorld=worldId;
    if(isJourneyWorld(worldId)){
      if(!this.journeyKit){this.journeyKit=createJourneyWorldScene(worldId);this.group.add(this.journeyKit);}
      for(const skin of Object.values(this.skins))skin.visible=false;
      this.journeyKit.visible=true;
      const look=JOURNEY_LOOKS[worldId];this.scene.background=new THREE.Color(look.background);this.scene.fog=new THREE.Fog(look.background,worldId==='sky'?28:38,78);
      this.ambient.color.setHex(look.ambient);this.ambient.intensity=worldId==='asteroid'?1.2:.8;this.key.color.setHex(look.key);
      // Broad front fill reveals rock relief without flattening it into emissive art.
      this.fill.color.setHex(worldId==='asteroid'?0x9bcaff:0xffb060);
      this.fill.intensity=worldId==='asteroid'?.65:.18;
      this.fill.position.set(worldId==='asteroid'?5:4.2,3.4,worldId==='asteroid'?-6:5);
    }

    this.ambientLife.setWorld(worldId ?? this.current, this.journeyKit ?? this.skins[this.current]);
    const nearEarth = worldId === null || worldId === 'atmosphere' || worldId === 'orbit';
    const lunar = worldId === 'moon';
    for (const name of ['earth-horizon', 'earth-atmosphere']) {
      const object = this.skins.space.getObjectByName(name);
      if (!object) continue;
      object.visible = nearEarth || lunar;
      object.scale.setScalar(lunar ? .18 : worldId === 'orbit' ? .85 : 1);
      object.position.set(lunar ? 9 : 0, lunar ? 9 : -25, 49);
    }
  }

  setOpeningLighting(stage: number, progress: number): void {
    const signal = stage === 3 && !this.reduceMotion ? Math.sin(progress * Math.PI) : 0;
    this.key.intensity = (this.journeyWorld === 'asteroid' ? 1.3 : .95) + signal * .22;
    const alarm = stage === 4 ? progress : this.alarm;
    for (const lamp of this.warningLamps) {
      lamp.color.setHex(alarm > .35 ? 0xff865e : 0xffd280);
      lamp.emissive.setHex(alarm > .35 ? 0xff432b : 0xff9b32);
    }
  }
  readonly group = new THREE.Group();
  readonly portal = new THREE.Group();
  current: EnvironmentId = 'workshop';
  private readonly skins: Record<EnvironmentId, THREE.Group>;
  private readonly ambient: THREE.AmbientLight;
  private readonly key: THREE.DirectionalLight;
  private readonly fill: THREE.DirectionalLight;
  private lampTime = 0;
  private warningLamps: THREE.MeshPhongMaterial[] = [];
  private reduceMotion = false;

  constructor(private readonly scene: THREE.Scene) {
    this.group.add(this.containmentKit.group,this.ambientLife.group);
    this.ambient = new THREE.AmbientLight(0x8aa8c0, 0.55);
    this.key = new THREE.DirectionalLight(0xc8e8ff, 0.95);
    this.key.position.set(-3.5, 10, -4);
    this.fill = new THREE.DirectionalLight(0xffb060, 0.18);
    this.fill.position.set(4.2, 3.4, 5);
    scene.add(this.ambient);
    scene.add(this.key);
    scene.add(this.fill);

    this.skins = {
      workshop: createWorkshop(this.warningLamps),
      rooftop: createRooftopScene(),
      space: createSpaceScene(),
    };
    for (const skin of Object.values(this.skins)) {
      skin.visible = false;
      this.group.add(skin);
    }
    this.skins.workshop.visible = true;


    this.portal = createPortal();
    this.portal.visible = false;
    this.group.add(this.portal);

    scene.background = new THREE.Color(0x071018);
    scene.fog = new THREE.Fog(0x071018, 16, 34);
    scene.add(this.group);
  }

  setReduceMotion(enabled: boolean): void {
    this.reduceMotion = enabled;
    this.ambientLife.update(0,enabled);
  }

  setEnvironment(id: EnvironmentId, scene: THREE.Scene, immediate = true): void {
    this.current = id;
    this.ambientLife.group.visible=false;
    if(this.journeyKit)this.journeyKit.visible=false;
    for (const [key, skin] of Object.entries(this.skins)) {
      skin.visible = key === id;
    }
    const look = LOOK[id];
    scene.background = new THREE.Color(look.background);
    scene.fog = new THREE.Fog(look.background, look.fogNear, look.fogFar);
    this.ambient.color.setHex(look.ambient);
    this.ambient.intensity = look.ambientIntensity;
    this.key.color.setHex(look.key);
    this.key.intensity = .95;
    this.fill.color.setHex(0xffb060);
    this.fill.intensity = .18;
    this.fill.position.set(4.2, 3.4, 5);
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

  setBreachPlateVisible(visible: boolean): void {
    const plate = this.skins.workshop.getObjectByName('crackEscapePlate');
    if (plate) {
      plate.visible = false; // Full-room concept is reference material, not playable glass.
    }
  }

  update(dt: number): void {
    this.ambientLife.update(dt,this.reduceMotion);
    if (this.current === 'workshop' && this.warningLamps.length > 0) {
      this.lampTime += dt;
      const pulse = this.reduceMotion
        ? 0.55
        : 0.35 + (Math.sin(this.lampTime * 3.4) * 0.5 + 0.5) * 0.55;
      for (const lamp of this.warningLamps) {
        lamp.emissiveIntensity = pulse;
      }
    }
  }
}

const LOOK: Record<
  EnvironmentId,
  { background: number; fogNear: number; fogFar: number; ambient: number; ambientIntensity: number; key: number }
> = {
  workshop: {
    background: 0x071018,
    fogNear: 14,
    fogFar: 32,
    ambient: 0x8aa8c0,
    ambientIntensity: 0.55,
    key: 0xc8e8ff,
  },
  rooftop: {
    background: 0x92aec3,
    fogNear: 22,
    fogFar: 48,
    ambient: 0xb9cfdf,
    ambientIntensity: 0.8,
    key: 0xffdfb3,
  },
  space: {
    background: 0x040914,
    fogNear: 38,
    fogFar: 78,
    ambient: 0x8899cc,
    ambientIntensity: 0.65,
    key: 0xc5deff,
  },
};

function createWorkshop(warningLamps: THREE.MeshPhongMaterial[]): THREE.Group {
  const root = new THREE.Group();
  root.name = 'workshop';

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 28),
    containmentMetal('floor'),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 7);
  root.add(floor);

  for (let i = 0; i < 10; i += 1) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.02, 24),
      new THREE.MeshLambertMaterial({ color: i % 2 === 0 ? 0x243444 : 0x1c2a38 }),
    );
    plank.position.set(-1.8 + i * 0.4, 0.01, 6);
    root.add(plank);
  }

  // Flush amber guide rails and cyan approach markers leave the flight lane clear.
  const railMaterial = new THREE.MeshBasicMaterial({color: 0xd49437});
  const guideMaterial = new THREE.MeshBasicMaterial({color: 0x529caf});
  const railGeometry = new THREE.BoxGeometry(.065, .012, 23);
  for (const x of [-2.8, -2.65, 2.65, 2.8]) {
    const rail = new THREE.Mesh(railGeometry, railMaterial);
    rail.position.set(x, .015, 6); root.add(rail);
  }
  const guideGeometry = new THREE.BoxGeometry(.28, .012, .11);
  for (let z = 1; z < 13; z += 1) {
    const guide = new THREE.Mesh(guideGeometry, guideMaterial);
    guide.position.set(0, .018, z); root.add(guide);
  }

  const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x15202c });
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 26), wallMaterial);
  leftWall.position.set(-5.2, 4, 6);
  root.add(leftWall);
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 26), wallMaterial);
  rightWall.position.set(5.2, 4, 6);
  root.add(rightWall);

  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(11, 9, 0.4),
    new THREE.MeshLambertMaterial({ color: 0x101820 }),
  );
  backWall.position.set(0, 4.2, 16.2);
  root.add(backWall);

  // Layered destination bulkhead, behind the scoring plane, frames the route.
  const bulkheadMaterial = containmentMetal();
  const frameMaterial = new THREE.MeshPhongMaterial({color: 0x456073, shininess: 55});
  const cyanMaterial = new THREE.MeshBasicMaterial({color: 0x49b5d0});
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const block = (x: number, y: number, z: number, w: number, h: number, d: number, material: THREE.Material) => {
    const mesh = new THREE.Mesh(unitBox, material);
    mesh.position.set(x, y, z); mesh.scale.set(w, h, d); root.add(mesh);
  };
  for (const side of [-1, 1]) {
    for (const y of [1.2, 3.6, 6]) block(side * 3.85, y, 15.8, 2.3, 2.25, .35, bulkheadMaterial);
    block(side * 2.55, 3.1, 15.2, .3, 6.1, .6, frameMaterial);
    block(side * 2.34, 3.1, 14.85, .06, 5.8, .06, cyanMaterial);
    for (const z of [5, 9, 13]) {
      block(side * 4.75, 3.4, z, .32, 6.6, .4, frameMaterial);
      block(side * 4.54, 3.6, z - .23, .06, 3.2, .06, cyanMaterial);
    }
  }
  // A recessed observation bay is visible through the shattered vessel.
  const baySteel = new THREE.MeshPhongMaterial({color: 0x466477, emissive: 0x132635, emissiveIntensity: .5});
  const bayDark = new THREE.MeshBasicMaterial({color: 0x102b3a});
  block(0, 3.2, 15.85, 4.6, 5.8, .12, baySteel);
  block(0, 3.4, 15.7, 3.1, 4.5, .12, bayDark);
  block(0, 3.5, 15.6, .75, 3.7, .03, new THREE.MeshBasicMaterial({color: 0x234758}));
  for (const x of [-1.65, 1.65]) {
    block(x, 3.6, 15.55, .035, 2.6, .08, cyanMaterial);
    block(x, 1.3, 15.3, 1.2, 1.8, .7, bulkheadMaterial);
    block(x, 2.3, 15.15, 1.05, .65, .15, bayDark);
    for (let row = 0; row < 3; row++) block(x, 2.12 + row * .15, 15.04, .72 - row * .13, .025, .025, cyanMaterial);
  }
  block(0, 4.88, 15.5, 3.6, .045, .06, cyanMaterial);
  block(0, 5.4, 15.4, 1.8, .12, .18, railMaterial);

  block(0, 6.15, 15.2, 5.4, .32, .6, frameMaterial);
  block(0, 5.95, 14.85, 4.7, .06, .06, cyanMaterial);

  const beamMaterial = new THREE.MeshLambertMaterial({ color: 0x0e1620 });
  for (const z of [1, 4.5, 8, 11.5, 15]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(11, 0.28, 0.38), beamMaterial);
    beam.position.set(0, 7.4, z);
    root.add(beam);
  }

  // Side pylons with amber warning lamps.
  for (const x of [-4.55, 4.55]) {
    const pylon = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 5.2, 0.42),
      new THREE.MeshLambertMaterial({ color: 0x243140 }),
    );
    pylon.position.set(x, 2.7, 5.5);
    root.add(pylon);
    for (const y of [1.4, 2.8, 4.2]) {
      const lampMat = new THREE.MeshPhongMaterial({
        color: 0xffd280,
        emissive: 0xff9b32,
        emissiveIntensity: 0.55,
      });
      warningLamps.push(lampMat);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.12), lampMat);
      lamp.position.set(x, y, 5.75);
      root.add(lamp);
    }
  }

  const crateMaterial = new THREE.MeshLambertMaterial({ color: 0x3a4a58 });
  const crates = [
    { x: -4.2, y: 0.55, z: 2.2, s: 1.1 },
    { x: -4.0, y: 0.4, z: 8.4, s: 0.8 },
    { x: 4.15, y: 0.5, z: 3.6, s: 1 },
    { x: 4.3, y: 0.35, z: 10.2, s: 0.7 },
  ];
  for (const crate of crates) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(crate.s, crate.s, crate.s), crateMaterial);
    mesh.position.set(crate.x, crate.y, crate.z);
    mesh.rotation.y = crate.z * 0.08;
    root.add(mesh);
  }

  const pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x4a6278 });
  const leftPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 10, 10), pipeMaterial);
  leftPipe.position.set(-4.7, 6.4, 6);
  leftPipe.rotation.x = Math.PI / 2;
  root.add(leftPipe);

  const ceilingStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.12, 8),
    new THREE.MeshPhongMaterial({
      color: 0xa8e8ff,
      emissive: 0x1a88a8,
      emissiveIntensity: 0.65,
    }),
  );
  ceilingStrip.position.set(0, 7.15, 6);
  root.add(ceilingStrip);

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

