import * as THREE from 'three';
import {breachBoundary, VESSEL} from './BreachBoundary';

export function createBreachVisual(): THREE.Group {
  const group = new THREE.Group(); group.name = 'containment-glass';
  const pane = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshPhongMaterial({
    color: 0x8eb4c4, specular: 0xdefaff, shininess: 110, transparent: true,
    opacity: .11, side: THREE.DoubleSide, depthWrite: false,
  }));
  pane.name = 'fractured-pane'; group.add(pane);
  const edges = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({
    color: 0xc0eff8, transparent: true, opacity: .8, depthWrite: false,
  })); edges.name = 'fracture-lines'; group.add(edges);
  const rim = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({
    color: 0x9bd2df, transparent: true, opacity: .65, side: THREE.DoubleSide,
  })); rim.name = 'fracture-thickness'; group.add(rim);
  return group;
}
export function layoutBreachVisual(group: THREE.Group, x: number, y: number, width: number, height: number): void {
  const key = [x,y,width,height].join(':');
  if (group.userData.layout === key) return;
  group.userData.layout = key;
  const boundary = breachBoundary(x,y,width,height);
  const shape = new THREE.Shape();
  shape.moveTo(-VESSEL.frontHalfWidth,0); shape.lineTo(VESSEL.frontHalfWidth,0);
  shape.lineTo(VESSEL.frontHalfWidth,VESSEL.height); shape.lineTo(-VESSEL.frontHalfWidth,VESSEL.height); shape.closePath();
  const hole = new THREE.Path();
  boundary.forEach(([px,py],i) => i === 0 ? hole.moveTo(px,py) : hole.lineTo(px,py)); hole.closePath(); shape.holes.push(hole);
  const pane = group.getObjectByName('fractured-pane') as THREE.Mesh;
  pane.geometry.dispose(); pane.geometry = new THREE.ShapeGeometry(shape);
  // Exposed thickness follows the exact polygon, without decorative teeth in the opening.
  const sides: number[] = [], lines: number[] = [];
  const line = (ax: number,ay: number,bx: number,by: number) => lines.push(ax,ay,-.004,bx,by,-.004);
  boundary.forEach(([ax,ay],i) => {
    const [bx,by] = boundary[(i+1)%boundary.length];
    const d = VESSEL.thickness;
    sides.push(ax,ay,0,bx,by,0,bx,by,d, ax,ay,0,bx,by,d,ax,ay,d);
    line(ax,ay,bx,by);
    if (i % 3 === 1) return;
    const dx = ax-x, dy = ay-y;
    let px = ax, py = ay;
    for (let step = 1; step <= 3; step++) {
      const factor = 1 + step * (.19 + (i%4)*.055);
      const nx = Math.max(-VESSEL.frontHalfWidth+.05,Math.min(VESSEL.frontHalfWidth-.05,x+dx*factor+Math.sin(i*3+step)*.09));
      const ny = Math.max(.08,Math.min(6.32,y+dy*factor+Math.cos(i+step)*.09));
      line(px,py,nx,ny);
      if (step === 2) line(nx,ny,Math.max(-VESSEL.frontHalfWidth+.05,Math.min(VESSEL.frontHalfWidth-.05,nx+dx*.25-dy*.12)),Math.max(.08,Math.min(6.32,ny+dy*.25+dx*.12)));
      px=nx; py=ny;
    }
  });
  for (const [name,data] of [['fracture-lines',lines],['fracture-thickness',sides]] as const) {
    const mesh = group.getObjectByName(name) as THREE.Mesh;
    mesh.geometry.dispose(); mesh.geometry = new THREE.BufferGeometry();
    mesh.geometry.setAttribute('position',new THREE.Float32BufferAttribute(data,3));
    mesh.geometry.computeBoundingSphere();
  }
}
