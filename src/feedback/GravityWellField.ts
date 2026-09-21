import {disposeThreeObject} from '../utils/disposeThree';
import * as THREE from 'three';

type Well = { x: number; y: number; z: number; strength: number; radius: number };

export class GravityWellField {
  readonly group = new THREE.Group();
  private readonly rings: THREE.Mesh[] = [];

  setWells(wells: Well[]): void {
    this.clear();
    for (const well of wells) {
      for (let index = 0; index < 3; index += 1) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(well.radius * (0.28 + index * 0.18), 0.018, 6, 42),
          new THREE.MeshBasicMaterial({
            color: index === 2 ? 0xb889ff : 0x57cfff,
            transparent: true,
            opacity: 0.28 - index * 0.045,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        ring.position.set(well.x, well.y, well.z);
        ring.userData.spin = (0.12 + index * 0.08) * Math.sign(well.strength || 1);
        ring.userData.phase = index * 2.1;
        const packet=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),new THREE.MeshBasicMaterial({color:0xbbeeff,transparent:true,opacity:.65}));packet.position.x=well.radius*(.28+index*.18);ring.add(packet);
        this.rings.push(ring);
        this.group.add(ring);
      }
    }
    this.group.visible = wells.length > 0;
  }

  update(time: number, reduceMotion: boolean): void {
    if (!this.group.visible) {
      return;
    }
    for (const ring of this.rings) {
      ring.rotation.z = reduceMotion ? 0 : time * ring.userData.spin;
      const pulse = reduceMotion ? 1 : 1 + Math.sin(time * 1.8 + ring.userData.phase) * 0.08;
      ring.scale.setScalar(pulse);
    }
  }

  dispose(): void {
    this.clear();
  }

  private clear(): void {
    for (const ring of this.rings) {
      this.group.remove(ring);
      disposeThreeObject(ring);
    }
    this.rings.length = 0;
    this.group.visible = false;
  }
}
