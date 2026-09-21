import * as THREE from 'three';
import {VESSEL} from '../obstacles/BreachBoundary';
import {containmentMetal} from '../graphics/ContainmentMaterials';

/** Rounded chamber footprint contains the gameplay camera and Spark.
 * Its front observation pane belongs to the obstacle, at the same frontZ. */
export function createContainmentVessel(): THREE.Group {
  const group = new THREE.Group(); group.name = 'containment-vessel';
  const metal = containmentMetal();
  const trim = new THREE.MeshPhongMaterial({color: 0x567183, shininess: 85});
  const cyan = new THREE.MeshBasicMaterial({color: 0x5ab8cc});
  const glass = new THREE.MeshPhongMaterial({color: 0x91c9d7, transparent: true, opacity: .07, side: THREE.DoubleSide, depthWrite: false, shininess: 100});
  const points: THREE.Vector2[] = [];
  const r = .65, w = VESSEL.halfWidth, front = VESSEL.frontZ, rear = VESSEL.rearZ;
  for (const [cx,cz,start] of [[w-r,front-r,0],[-w+r,front-r,Math.PI/2],[-w+r,rear+r,Math.PI],[w-r,rear+r,Math.PI*1.5]]) {
    for (let step=0; step<=8; step++) {
      const a=start+step*Math.PI/16;
      points.push(new THREE.Vector2(cx+Math.cos(a)*r,cz+Math.sin(a)*r));
    }
  }
  const deck = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(points)), new THREE.MeshPhongMaterial({color: 0x263d4c, shininess: 65, side: THREE.DoubleSide}));
  deck.rotation.x = Math.PI/2; deck.position.y = .025; group.add(deck);
  // Connect each perimeter segment, leaving the front observation pane to the fracture mesh.
  const tube = (y: number, radius: number, material: THREE.Material) => {
    const path = new THREE.CurvePath<THREE.Vector3>();
    points.forEach((a,i) => { const b=points[(i+1)%points.length]; path.add(new THREE.LineCurve3(new THREE.Vector3(a.x,y,a.y),new THREE.Vector3(b.x,y,b.y))); });
    group.add(new THREE.Mesh(new THREE.TubeGeometry(path,112,radius,6,true),material));
  };
  tube(.1,.12,metal); tube(.24,.026,cyan); tube(VESSEL.height,.13,metal); tube(VESSEL.height-.16,.025,cyan);
  const wallVertices: number[] = [];
  points.forEach((a,i) => {
    const b=points[(i+1)%points.length];
    // The straight front portion and its corners are open here; the full front pane seals it.
    if (a.y > front-.01 && b.y > front-.01) return;
    wallVertices.push(a.x,.24,a.y,b.x,.24,b.y,b.x,6.2,b.y,a.x,.24,a.y,b.x,6.2,b.y,a.x,6.2,a.y);
  });
  const wallGeometry=new THREE.BufferGeometry(); wallGeometry.setAttribute('position',new THREE.Float32BufferAttribute(wallVertices,3)); wallGeometry.computeVertexNormals();
  group.add(new THREE.Mesh(wallGeometry,glass));
  for (const side of [-1,1]) for (const z of [front, -3, rear+.65]) {
    const post=new THREE.Mesh(new THREE.BoxGeometry(.14,VESSEL.height,.16),trim); post.position.set(side*(z === front ? VESSEL.frontHalfWidth : w),3.2,z); group.add(post);
    const strip=new THREE.Mesh(new THREE.BoxGeometry(.025,5.8,.035),cyan); strip.position.set(side*((z === front ? VESSEL.frontHalfWidth : w)-.08),3.2,z-.09); group.add(strip);
  }
  // Low launch cradle; the core floats above it, without a new collision obstacle.
  const cradle=new THREE.Mesh(new THREE.CylinderGeometry(.65,.78,.08,40),metal); cradle.position.set(0,.09,0); group.add(cradle);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.61,.025,6,40),cyan); ring.rotation.x=Math.PI/2; ring.position.set(0,.14,0); group.add(ring);
  return group;
}
