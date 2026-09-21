import * as THREE from 'three';

const PARTICLE_COUNT = 16;

/** Sparse dust and curved wisps, using two shared materials and one shared quad. */
export class WindField {
  readonly group = new THREE.Group();
  private readonly particles: THREE.Mesh[] = [];
  private readonly geometry = new THREE.PlaneGeometry(1, 1);
  private readonly materials = [makeMaterial(false), makeMaterial(true)];
  private strength = 0;
  private elapsed = 0;

  constructor() {
    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const wisp = index % 4 === 0;
      const mesh = new THREE.Mesh(this.geometry, this.materials[wisp ? 1 : 0]);
      mesh.scale.set(wisp ? 0.38 : 0.035, wisp ? 0.12 : 0.035, 1);
      mesh.position.set(-3.2 + (index * 1.37) % 6.4, 0.9 + (index * 0.83) % 4.4, 1.5 + (index * 2.71) % 11);
      this.particles.push(mesh);
      this.group.add(mesh);
    }
    this.group.visible = false;
  }

  setWind(windX: number): void {
    this.strength = windX;
    this.group.visible = Math.abs(windX) > 0.001;
    for (const particle of this.particles) particle.scale.x = Math.abs(particle.scale.x) * (Math.sign(windX) || 1);
  }

  update(dt: number, reduceMotion: boolean): void {
    this.group.visible = Math.abs(this.strength) > 0.001 && !reduceMotion;
    if (!this.group.visible) return;
    this.elapsed += dt;
    for (let index = 0; index < this.particles.length; index += 1) {
      const particle = this.particles[index];
      const x = particle.position.x + this.strength * 2.4 * dt * (0.7 + index % 4 * 0.12);
      particle.position.x = ((x + 3.2) % 6.4 + 6.4) % 6.4 - 3.2;
      particle.position.y = 0.9 + (index * 0.83) % 4.4 + Math.sin(this.elapsed * 0.65 + index) * 0.055;
    }
  }

  dispose(): void {
    this.geometry.dispose();
    for (const material of this.materials) material.dispose();
    this.group.clear();
    this.particles.length = 0;
  }
}

function makeMaterial(wisp: boolean): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { wisp: { value: wisp ? 1 : 0 } },
    vertexShader: `varying vec2 tex; varying float fade; void main(){
      tex=uv; vec4 world=modelMatrix*vec4(position,1.0);
      fade=1.0-smoothstep(2.5,3.2,abs(world.x));
      gl_Position=projectionMatrix*viewMatrix*world; }`,
    fragmentShader: `precision mediump float; varying vec2 tex; varying float fade; uniform float wisp;
      void main(){ vec2 p=tex*2.0-1.0;
        float mote=exp(-dot(p,p)*5.0)*0.36;
        float curve=p.y-0.22*sin(p.x*3.0);
        float ribbon=exp(-curve*curve*26.0)*pow(max(0.0,1.0-p.x*p.x),2.0)*0.12;
        gl_FragColor=vec4(0.80,0.91,0.95,mix(mote,ribbon,wisp)*fade); }`,
  });
}
