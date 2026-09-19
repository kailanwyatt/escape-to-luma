import * as THREE from 'three';

export function createPrototypeEnvironment(): THREE.Group {
  const root = new THREE.Group();

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
  const beamZs = [1, 4.5, 8, 11.5, 15];
  for (const z of beamZs) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(11, 0.28, 0.38), beamMaterial);
    beam.position.set(0, 7.4, z);
    root.add(beam);
  }

  const crateMaterial = new THREE.MeshLambertMaterial({ color: 0x8a5a32 });
  const crateSpecs = [
    { x: -4.2, y: 0.55, z: 2.2, s: 1.1 },
    { x: -4.0, y: 0.4, z: 8.4, s: 0.8 },
    { x: 4.15, y: 0.5, z: 3.6, s: 1 },
    { x: 4.3, y: 0.35, z: 10.2, s: 0.7 },
    { x: -4.35, y: 0.7, z: 13.2, s: 1.4 },
    { x: 4.1, y: 0.45, z: 14.4, s: 0.9 },
  ];
  for (const crate of crateSpecs) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(crate.s, crate.s, crate.s),
      crateMaterial,
    );
    mesh.position.set(crate.x, crate.y, crate.z);
    mesh.rotation.y = crate.z * 0.08;
    root.add(mesh);
  }

  const pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x6d7380 });
  const leftPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 10, 10), pipeMaterial);
  leftPipe.position.set(-4.7, 6.4, 6);
  leftPipe.rotation.x = Math.PI / 2;
  root.add(leftPipe);

  const rightPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 8, 10), pipeMaterial);
  rightPipe.position.set(4.7, 6.6, 8);
  rightPipe.rotation.x = Math.PI / 2;
  root.add(rightPipe);

  return root;
}
