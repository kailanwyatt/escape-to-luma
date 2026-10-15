import * as THREE from 'three';

type Body = { x: number; y: number; radius: number; stream?: number };
/** Sparse transparent dust follows actual velocity, never the quiet route. */
export class DebrisWake {
  readonly points: THREE.Points;
  private readonly positions: THREE.BufferAttribute;
  private readonly colors: THREE.BufferAttribute;
  constructor(private readonly count: number) {
    const geometry = new THREE.BufferGeometry();
    this.positions = new THREE.BufferAttribute(new Float32Array(count * 8 * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.colors = new THREE.BufferAttribute(new Float32Array(count * 8 * 3), 3).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', this.positions); geometry.setAttribute('color', this.colors);
    this.points = new THREE.Points(geometry, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, vertexColors: true,
      vertexShader: 'varying vec3 c;void main(){c=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=2.;}',
      fragmentShader: 'varying vec3 c;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(c,exp(-d*d*22.)*.18);}',
    })); this.points.frustumCulled = false; this.points.name = 'directional-debris-dust';
  }
  update(current: Body[], previous: Body[]) {
    for (let i = 0; i < this.count; i++) {
      const b = current[i], old = previous[i];
      for (let j = 0; j < 8; j++) {
        const index = i * 8 + j;
        if (!b || !old) { this.positions.setXYZ(index, 0, 0, 1000); continue; }
        const dx = b.x - old.x, dy = b.y - old.y, speed = Math.hypot(dx, dy);
        const tail = b.radius * (.5 + j * .16), fade = 1 - j / 9;
        const discontinuity = speed > b.radius * 2;
        this.positions.setXYZ(index, b.x - dx / Math.max(speed, .0001) * tail, b.y - dy / Math.max(speed, .0001) * tail, .08 + j * .015);
        const warm = (b.stream ?? 1) > 0;
        this.colors.setXYZ(index, (warm ? .7 : .22) * fade, .48 * fade, (warm ? .24 : .75) * fade);
        if (discontinuity) this.colors.setXYZ(index, 0, 0, 0);
      }
    }
    this.positions.needsUpdate = this.colors.needsUpdate = true;
  }
  dispose() { this.points.geometry.dispose(); (this.points.material as THREE.Material).dispose(); }
}
