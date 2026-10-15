import * as THREE from 'three';
import type { NullLashConfig, TheNullConfig } from '../config/ObstacleConfig';
import { nullLashStateAtTime, nullLashCenterline, nullLashRadius } from './NullLashState';
import { theNullSafeAtTime } from './StoryLibraryState';
import { NULL_NOISE } from '../graphics/NullShaders';
import { disposeThreeObject } from '../utils/disposeThree';

/** Continuous surface with a stable allocation: only vertex buffers change. */
export class CinematicNullLash {
  readonly group = new THREE.Group();
  readonly surface: THREE.BufferGeometry;
  readonly time = { value: 0 };
  readonly warning = { value: 0 };
  private readonly tip: THREE.Mesh;
  private readonly rows = 96;
  private readonly sides = 14;
  private readonly a = new THREE.Vector3();
  private readonly b = new THREE.Vector3();

  constructor(private readonly config: NullLashConfig) {
    this.group.name = 'cinematic-null-lash';
    this.group.position.set(this.config.pivotX, this.config.pivotY, 0);
    const count = (this.rows + 1) * (this.sides + 1), uv: number[] = [], indices: number[] = [];
    for (let row = 0; row <= this.rows; row++) for (let side = 0; side <= this.sides; side++) {
      uv.push(row / this.rows, side / this.sides);
      if (row < this.rows && side < this.sides) {
        const a = row * (this.sides + 1) + side, b = a + this.sides + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    this.surface = new THREE.BufferGeometry();
    this.surface.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
    this.surface.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
    this.surface.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); this.surface.setIndex(indices);
    const material = new THREE.ShaderMaterial({
      uniforms: { time: this.time, warning: this.warning }, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vUv;varying vec3 vN,vV;void main(){vUv=uv;vN=normalMatrix*normal;vec4 p=modelViewMatrix*vec4(position,1.);vV=p.xyz;gl_Position=projectionMatrix*p;}',
      fragmentShader: `${NULL_NOISE}uniform float time,warning;varying vec2 vUv;varying vec3 vN,vV;
        void main(){vec3 n=normalize(vN),v=normalize(-vV);float light=max(0.,dot(n,normalize(vec3(-.6,.8,1.))));
        float rim=pow(1.-abs(dot(n,v)),2.8);float spec=pow(max(0.,dot(n,normalize(vec3(.45,.6,1.)))),30.);
        float ribs=pow(.5+.5*sin(vUv.y*56.+sin(vUv.x*35.)*.7),12.);
        float skin=fbm(vec3(vUv*vec2(90.,12.),2.));float vein=pow(.5+.5*sin(vUv.y*31.+sin(vUv.x*14.+time*.2)*1.5),30.);
        float head=exp(-pow((vUv.x-fract(time*.28))*9.,2.));
        vec3 c=vec3(.025,.018,.047)*(.5+light*2.8)*(skin+.55)+vec3(.15,.19,.26)*spec+vec3(.07,.025,.16)*ribs*light;
        c+=mix(vec3(.32,.08,.70),vec3(2.,.57,.1),warning)*vein*(.18+head*.9+warning*.8);
        c+=vec3(.23,.14,.43)*rim;gl_FragColor=vec4(c,1.);}`,
    });
    const mesh = new THREE.Mesh(this.surface, material); mesh.frustumCulled = false; this.group.add(mesh);
    const root = new THREE.Mesh(new THREE.SphereGeometry(this.config.thickness * 1.42, 24, 16), material);
    root.scale.set(1, 1.18, .9); root.position.y = .07; this.group.add(root);
    const anchor = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, .05, .12), new THREE.Vector3(-.18, .6, 1.4),
      new THREE.Vector3(-1.7, 2.2, 6), new THREE.Vector3(-5, 4.3, 19), new THREE.Vector3(-10, 7, 42),
    ]);
    this.group.add(new THREE.Mesh(new THREE.TubeGeometry(anchor, 80, .16, 8, false),
      new THREE.MeshStandardMaterial({ color: 0x181320, roughness: .62, metalness: .24, emissive: 0x170925, emissiveIntensity: .3 })));
    this.tip = new THREE.Mesh(new THREE.SphereGeometry(this.config.thickness * .3, 12, 8), new THREE.MeshBasicMaterial({ color: 0xa77bea })); this.group.add(this.tip);
    this.update(0);
  }

  private point(u: number, extension: number, angle: number, time: number, out: THREE.Vector3) {
    const p = nullLashCenterline(this.config, time, u, extension, angle, out);
    out.set(p.x - this.config.pivotX, p.y - this.config.pivotY, p.z);
  }

  update(time: number) {
    const state = nullLashStateAtTime(this.config, time);
    const extension = state.extension, angle = state.angle;
    this.group.userData.phase = state.phase;
    this.time.value = time; this.warning.value = state.phase === 'warning' ? 1 : state.phase === 'lashing' ? .65 : 0;
    const positions = this.surface.attributes.position, normals = this.surface.attributes.normal;
    for (let row = 0; row <= this.rows; row++) {
      const u = row / this.rows; this.point(u, extension, angle, time, this.a); this.point(u + .001, extension, angle, time, this.b);
      const dx = this.b.x - this.a.x, dy = this.b.y - this.a.y, length = Math.max(.0001, Math.hypot(dx, dy));
      const radius = nullLashRadius(this.config, u);
      for (let side = 0; side <= this.sides; side++) {
        const theta = side / this.sides * Math.PI * 2, co = Math.cos(theta), si = Math.sin(theta), index = row * (this.sides + 1) + side;
        const nx = -dy / length * co, ny = dx / length * co;
        positions.setXYZ(index, this.a.x + nx * radius, this.a.y + ny * radius, this.a.z + si * radius * .82);
        normals.setXYZ(index, nx, ny, si);
      }
    }
    positions.needsUpdate = normals.needsUpdate = true;
    this.point(1, extension, angle, time, this.tip.position);
    (this.tip.material as THREE.MeshBasicMaterial).color.setHex(this.warning.value > 0 ? 0xffbc72 : 0x9a78d4);
    return state;
  }
  dispose() { disposeThreeObject(this.group); this.group.clear(); this.group.removeFromParent(); }
}

export class CinematicNullEncounter {
  readonly group = new THREE.Group();
  readonly hole = { value: new THREE.Vector3(0, 0, 1) };
  readonly time = { value: 0 };
  private readonly lip: THREE.Mesh;
  private readonly throat: THREE.Mesh;
  private readonly innerLight: THREE.PointLight;

  constructor(private readonly config: TheNullConfig) {
    this.group.name = 'cinematic-null-encounter'; this.group.position.set(this.config.centerX, this.config.centerY, 0);
    // UVs parameterize a displaced annulus; both XY collision boundaries stay exact.
    const geometry = new THREE.PlaneGeometry(1, 1, 128, 40);
    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, uniforms: { hole: this.hole, time: this.time, radius: { value: this.config.fieldRadius } },
      vertexShader: `uniform vec3 hole;uniform float time,radius;varying vec2 vUv;varying vec3 vP,vV,vN;
        vec3 surface(float a,float r){vec2 dir=vec2(cos(a),sin(a));
        vec2 p=mix(hole.xy+dir*hole.z,dir*radius,r);
        float fold=pow(.5+.5*sin(a*13.+r*7.+sin(a*3.+time*.18)),3.);
        float z=-.3-sin(r*3.14159)*(.38+fold*.45)+sin(a*7.+r*13.-time*.4)*.035*sin(r*3.14159);
        return vec3(p,z);}
        void main(){vUv=uv;float a=uv.x*6.2831853,r=uv.y;vP=surface(a,r);
        vN=normalMatrix*normalize(cross(surface(a+.001,r)-vP,surface(a,r+.001)-vP));
        vec4 mv=modelViewMatrix*vec4(vP,1.);vV=mv.xyz;gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `${NULL_NOISE}uniform float time;varying vec2 vUv;varying vec3 vP,vV,vN;
        void main(){vec3 n=normalize(vN);
        float a=vUv.x*6.2831853,r=vUv.y;float grain=fbm(vP*23.);float lambert=max(0.,dot(n,normalize(vec3(-.4,.7,1.))));
        float spec=pow(max(0.,dot(n,normalize(vec3(.6,.7,1.)))),42.);
        float channels=pow(.5+.5*sin(a*13.+r*7.+sin(a*3.+time*.18)),26.);
        float pulse=.4+.6*pow(.5+.5*sin(r*12.+time*.7+a),3.);
        float inner=exp(-r*23.);float edge=pow(r,18.);
        vec3 c=vec3(.012,.009,.025)*(.5+lambert*2.)*(.65+grain)+vec3(.07,.065,.12)*spec;
        c+=vec3(.35,.055,.62)*channels*pulse*.28+vec3(.08,1.3,1.5)*inner*.85;
        c+=vec3(.08,.035,.15)*edge;gl_FragColor=vec4(c,1.);}`,
    });
    const body = new THREE.Mesh(geometry, material); body.frustumCulled = false; body.name = 'null-folded-surface'; this.group.add(body);
    this.lip = new THREE.Mesh(new THREE.TorusGeometry(this.config.holeRadius, .018, 8, 100), new THREE.MeshBasicMaterial({ color: new THREE.Color(.18, 1.1, 1.35) }));
    this.group.add(this.lip);
    // The aperture is genuinely open: a tapering, translucent throat adds depth around it.
    const throatMaterial = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      uniforms: { time: this.time },
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform float time;varying vec2 vUv;void main(){float threads=pow(.5+.5*sin(vUv.x*113.+vUv.y*13.-time*.8),20.);float fade=sin(vUv.y*3.14159);gl_FragColor=vec4(.12,.7,.85,(.08+threads*.25)*fade);}',
    });
    this.throat = new THREE.Mesh(new THREE.CylinderGeometry(this.config.holeRadius, this.config.holeRadius * 1.05, 1.4, 64, 8, true), throatMaterial); this.throat.rotation.x = Math.PI / 2; this.group.add(this.throat);
    this.innerLight = new THREE.PointLight(0x80eafa, 18, 9, 2); this.group.add(this.innerLight);
    this.update(0);
  }
  update(time: number) {
    const safe = theNullSafeAtTime(this.config, time); this.time.value = time;
    this.hole.value.set(safe.x - this.config.centerX, safe.y - this.config.centerY, safe.radius);
    this.lip.position.set(safe.x - this.config.centerX, safe.y - this.config.centerY, -.32);
    this.throat.position.set(safe.x - this.config.centerX, safe.y - this.config.centerY, .38);
    this.innerLight.position.set(safe.x - this.config.centerX, safe.y - this.config.centerY, -1.2);
    this.group.userData.openingX = safe.x;
    this.group.userData.openingY = safe.y;
    this.group.userData.holeRadius = safe.radius;
    return safe;
  }
  dispose() { disposeThreeObject(this.group); this.group.clear(); this.group.removeFromParent(); }
}
