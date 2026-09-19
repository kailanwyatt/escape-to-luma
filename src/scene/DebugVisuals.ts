import * as THREE from 'three';

import type { ShotPrediction } from '../debug/ShotDiagnostics';
import { GAME_TUNING } from '../game/gameTuning';
import type { ObstacleSlot } from '../obstacles/ObstacleSlot';
import type { Target } from '../target/Target';

export class DebugVisuals {
  readonly group = new THREE.Group();
  private readonly projectileRing: THREE.Line;
  private readonly planes: THREE.Mesh[] = [];
  private readonly targetHit: THREE.Line;
  private readonly targetEdge: THREE.Line;
  private readonly hubs: THREE.Line[] = [];
  private readonly ringsInner: THREE.Line[] = [];
  private readonly ringsOuter: THREE.Line[] = [];
  private readonly bladeSets: THREE.LineSegments[][] = [];
  private readonly ghostHubs: THREE.Line[] = [];
  private readonly ghostBlades: THREE.LineSegments[][] = [];
  private readonly crossings: THREE.Mesh[] = [];
  private readonly fullPath: THREE.Line;
  private readonly analyticMarker: THREE.Mesh;
  private readonly openings: THREE.Line[] = [];
  private readonly ghostOpenings: THREE.Line[] = [];
  private readonly pendulumArms: THREE.Line[] = [];
  private readonly ghostPendulumArms: THREE.Line[] = [];

  constructor() {
    this.group.visible = false;
    this.projectileRing = makeCircle(GAME_TUNING.projectile.radius, 0x7ef0ff);
    this.group.add(this.projectileRing);

    for (let p = 0; p < 2; p += 1) {
      const color = p === 0 ? 0x4fd2ff : 0xff8a4a;
      const plane = makePlane(5.2, 5.2, color, GAME_TUNING.rotor.z);
      this.planes.push(plane);
      this.group.add(plane);
      const hub = makeCircle(GAME_TUNING.rotor.hubRadius, 0xffee88);
      this.hubs.push(hub);
      this.group.add(hub);
      this.ringsInner.push(makeCircle(GAME_TUNING.rotor.radius - GAME_TUNING.rotor.ringThickness, color));
      this.ringsOuter.push(makeCircle(GAME_TUNING.rotor.radius + GAME_TUNING.rotor.ringThickness, color));
      this.group.add(this.ringsInner[p], this.ringsOuter[p]);
      const blades: THREE.LineSegments[] = [];
      const ghosts: THREE.LineSegments[] = [];
      for (let i = 0; i < 4; i += 1) {
        const box = makeBladeBox(0xff6b4a);
        blades.push(box);
        this.group.add(box);
        const ghost = makeBladeBox(0x7ef0ff);
        ghost.material = new THREE.LineBasicMaterial({
          color: 0x7ef0ff,
          transparent: true,
          opacity: 0.45,
        });
        ghosts.push(ghost);
        this.group.add(ghost);
      }
      this.bladeSets.push(blades);
      this.ghostBlades.push(ghosts);
      const ghostHub = makeCircle(GAME_TUNING.rotor.hubRadius, 0x7ef0ff);
      (ghostHub.material as THREE.LineBasicMaterial).transparent = true;
      (ghostHub.material as THREE.LineBasicMaterial).opacity = 0.5;
      this.ghostHubs.push(ghostHub);
      this.group.add(ghostHub);
      const opening = makeCircle(1, color);
      this.openings.push(opening);
      this.group.add(opening);
      const ghostOpening = makeCircle(1, 0x7ef0ff);
      (ghostOpening.material as THREE.LineBasicMaterial).transparent = true;
      (ghostOpening.material as THREE.LineBasicMaterial).opacity = 0.55;
      this.ghostOpenings.push(ghostOpening);
      this.group.add(ghostOpening);
      const arm = makeLine(color);
      this.pendulumArms.push(arm);
      this.group.add(arm);
      const ghostArm = makeLine(0x7ef0ff);
      this.ghostPendulumArms.push(ghostArm);
      this.group.add(ghostArm);
    }

    const targetPlane = makePlane(4.2, 4.2, 0xffd24a, GAME_TUNING.target.z);
    this.group.add(targetPlane);
    this.planes.push(targetPlane);

    this.targetHit = makeCircle(1, 0x66ff99);
    this.targetEdge = makeCircle(1, 0xff5d6c);
    this.group.add(this.targetHit, this.targetEdge);

    const crossColors = [0x4fd2ff, 0xff8a4a, 0xffd24a];
    for (const color of crossColors) {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 12, 10),
        new THREE.MeshBasicMaterial({ color, depthTest: false }),
      );
      marker.renderOrder = 20;
      marker.visible = false;
      this.crossings.push(marker);
      this.group.add(marker);
    }

    this.fullPath = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xd8fbff, transparent: true, opacity: 0.7 }),
    );
    this.group.add(this.fullPath);

    this.analyticMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xff5d6c, depthTest: false }),
    );
    this.analyticMarker.renderOrder = 21;
    this.analyticMarker.visible = false;
    this.group.add(this.analyticMarker);
  }

  setEnabled(enabled: boolean): void {
    this.group.visible = enabled;
  }

  sync(
    projectile: THREE.Vector3,
    obstacles: ObstacleSlot[],
    target: Target,
    prediction: ShotPrediction | null,
    analyticNow: { x: number; y: number; z: number } | null,
  ): void {
    if (!this.group.visible) {
      return;
    }
    this.projectileRing.position.copy(projectile);
    this.targetHit.position.set(target.x, target.y, target.z + 0.02);
    this.targetHit.scale.setScalar(target.radius);
    this.targetEdge.position.set(target.x, target.y, target.z + 0.03);
    this.targetEdge.scale.setScalar(target.radius + GAME_TUNING.projectile.radius);
    this.planes[2].position.set(target.x, target.y, target.z);

    for (let r = 0; r < 2; r += 1) {
      const obstacle = obstacles[r];
      const active = obstacle.active;
      const info = active ? obstacle.getDebugInfo() : null;
      this.planes[r].visible = active;
      const isRotor = obstacle.type === 'rotor';
      this.hubs[r].visible = active && isRotor;
      this.ringsInner[r].visible = active && isRotor;
      this.ringsOuter[r].visible = active && isRotor;
      if (active && info) {
        this.planes[r].position.set(info.x, info.y, obstacle.z);
        this.hubs[r].position.set(info.x, info.y, obstacle.z + 0.02);
        this.ringsInner[r].position.set(info.x, info.y, obstacle.z + 0.015);
        this.ringsOuter[r].position.set(info.x, info.y, obstacle.z + 0.015);
      }
      placeBlades(
        this.bladeSets[r],
        isRotor ? obstacle.bladeCount : 0,
        obstacle.z,
        active && isRotor,
        obstacle.angle,
        info?.x ?? 0,
        info?.y ?? 0,
      );

      const ghost = prediction?.rotors[r];
      const showGhost = Boolean(ghost?.active);
      this.ghostHubs[r].visible = showGhost && isRotor;
      if (showGhost && ghost && isRotor) {
        this.ghostHubs[r].position.set(ghost.predicted.x, ghost.predicted.y, ghost.z + 0.04);
        placeBlades(
          this.ghostBlades[r],
          obstacle.bladeCount,
          obstacle.z,
          true,
          ghost.predicted.angle,
          ghost.predicted.x,
          ghost.predicted.y,
          0.05,
        );
      } else {
        for (const box of this.ghostBlades[r]) {
          box.visible = false;
        }
      }

      syncOpening(
        this.openings[r],
        this.ghostOpenings[r],
        this.pendulumArms[r],
        this.ghostPendulumArms[r],
        obstacle,
        ghost,
      );
    }

    if (prediction) {
      const points = prediction.path.map((p) => new THREE.Vector3(p.x, p.y, p.z));
      this.fullPath.geometry.dispose();
      this.fullPath.geometry = new THREE.BufferGeometry().setFromPoints(points);
      this.fullPath.visible = points.length > 1;

      setCrossing(this.crossings[0], prediction.rotors[0]);
      setCrossing(this.crossings[1], prediction.rotors[1]);
      this.crossings[2].visible = true;
      this.crossings[2].position.set(
        prediction.target.simulated.x,
        prediction.target.simulated.y,
        target.z + 0.06,
      );
    } else {
      this.fullPath.visible = false;
      for (const marker of this.crossings) {
        marker.visible = false;
      }
    }

    if (analyticNow) {
      this.analyticMarker.visible = true;
      this.analyticMarker.position.set(analyticNow.x, analyticNow.y, analyticNow.z);
    } else {
      this.analyticMarker.visible = false;
    }
  }
}

function placeBlades(
  boxes: THREE.LineSegments[],
  bladeCount: number,
  z: number,
  active: boolean,
  angle: number,
  originX: number,
  originY: number,
  zOffset = 0,
): void {
  const t = GAME_TUNING.rotor;
  for (let i = 0; i < 4; i += 1) {
    const box = boxes[i];
    const show = active && i < bladeCount;
    box.visible = show;
    if (!show) {
      continue;
    }
    const bladeAngle = angle + (i / bladeCount) * Math.PI * 2;
    const radius = t.hubRadius + t.bladeLength / 2;
    box.position.set(
      originX + Math.cos(bladeAngle) * radius,
      originY + Math.sin(bladeAngle) * radius,
      z + zOffset,
    );
    box.rotation.z = bladeAngle;
  }
}

function syncOpening(
  opening: THREE.Line,
  ghost: THREE.Line,
  arm: THREE.Line,
  ghostArm: THREE.Line,
  obstacle: ObstacleSlot,
  prediction: ShotPrediction['rotors'][number] | undefined,
): void {
  const info = obstacle.getDebugInfo();
  const showOpening =
    obstacle.active &&
    (obstacle.type === 'iris' || obstacle.type === 'movingRing' || obstacle.type === 'slidingGate');
  opening.visible = showOpening;
  if (showOpening) {
    const radius =
      obstacle.type === 'slidingGate'
        ? Math.min(info.openingWidth, info.openingHeight) / 2
        : Math.max(0.2, info.openingRadius || info.blockerRadius);
    opening.scale.setScalar(radius);
    opening.position.set(
      obstacle.type === 'slidingGate' ? info.openingX : info.x,
      obstacle.type === 'slidingGate' ? info.openingY : info.y,
      obstacle.z + 0.03,
    );
  }
  const showGhost = Boolean(prediction?.active) && showOpening;
  ghost.visible = showGhost;
  if (showGhost && prediction) {
    const radius = Math.max(0.2, prediction.predicted.openingRadius || 0.4);
    ghost.scale.setScalar(radius);
    ghost.position.set(prediction.predicted.x, prediction.predicted.y, prediction.z + 0.05);
  }

  const showArm = obstacle.active && obstacle.type === 'pendulum';
  arm.visible = showArm;
  ghostArm.visible = Boolean(prediction?.active) && obstacle.type === 'pendulum';
  if (showArm) {
    setLine(arm, info.pivotX, info.pivotY, info.blockerX, info.blockerY, obstacle.z + 0.04);
  }
  if (ghostArm.visible && prediction) {
    setLine(
      ghostArm,
      info.pivotX,
      info.pivotY,
      prediction.predicted.x,
      prediction.predicted.y,
      prediction.z + 0.05,
    );
  }
}

function makeLine(color: number): THREE.Line {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, -1, 0)]),
    new THREE.LineBasicMaterial({ color }),
  );
}

function setLine(
  line: THREE.Line,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  z: number,
): void {
  line.geometry.dispose();
  line.geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(x1, y1, z),
    new THREE.Vector3(x2, y2, z),
  ]);
}

function setCrossing(
  marker: THREE.Mesh,
  rotor: ShotPrediction['rotors'][number],
): void {
  if (!rotor.active) {
    marker.visible = false;
    return;
  }
  marker.visible = true;
  marker.position.set(rotor.simulated.x, rotor.simulated.y, rotor.z + 0.06);
}

function makeCircle(radius: number, color: number): THREE.Line {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 32; i += 1) {
    const a = (i / 32) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
  }
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color }),
  );
}

function makePlane(width: number, height: number, color: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  mesh.position.set(0, GAME_TUNING.rotor.center.y, z);
  return mesh;
}

function makeBladeBox(color: number): THREE.LineSegments {
  const t = GAME_TUNING.rotor;
  return new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(t.bladeLength, t.bladeWidth, t.bladeDepth)),
    new THREE.LineBasicMaterial({ color }),
  );
}
