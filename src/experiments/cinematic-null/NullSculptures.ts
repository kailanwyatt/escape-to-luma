import * as THREE from 'three';
import { nullLashStateAtTime } from '../../obstacles/NullLashState';
import { theNullSafeAtTime } from '../../obstacles/StoryLibraryState';
import { STUDY_LASH, STUDY_NULL } from './NullStudySequence';

export const NULL_NOISE = `
float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=noise(p)*a;p=p*2.03+vec3(5.1,7.2,4.8);a*=.5;}return v;}`;

/** Continuous surface with a stable allocation: only vertex buffers change. */
export class SculptedNullLash {
  readonly group = new THREE.Group();
  readonly surface: THREE.BufferGeometry;
  readonly time = { value: 0 };
  readonly warning = { value: 0 };
  private readonly tip: THREE.Mesh;
  private readonly rows = 96;
  private readonly sides = 14;
  private readonly a = new THREE.Vector3();
  private readonly b = new THREE.Vector3();

  constructor() {
    this.group.name = 'cinematic-null-lash';
    this.group.position.set(STUDY_LASH.pivotX, STUDY_LASH.pivotY, STUDY_LASH.z);
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
    const root = new THREE.Mesh(new THREE.SphereGeometry(.255, 32, 24), material);
    root.scale.set(1, 1.18, .9); root.position.y = .07; this.group.add(root);
    const anchor = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, .05, .12), new THREE.Vector3(-.18, .6, 1.4),
      new THREE.Vector3(-1.7, 2.2, 6), new THREE.Vector3(-5, 4.3, 19), new THREE.Vector3(-10, 7, 42),
    ]);
    this.group.add(new THREE.Mesh(new THREE.TubeGeometry(anchor, 80, .16, 8, false),
      new THREE.MeshStandardMaterial({ color: 0x181320, roughness: .62, metalness: .24, emissive: 0x170925, emissiveIntensity: .3 })));
    this.tip = new THREE.Mesh(new THREE.SphereGeometry(.055, 16, 12), new THREE.MeshBasicMaterial({ color: 0xa77bea })); this.group.add(this.tip);
    this.update(0);
  }

  private point(u: number, extension: number, angle: number, time: number, out: THREE.Vector3) {
    const coiledAngle = STUDY_LASH.restAngle + u * 4.9;
    const cx = Math.cos(coiledAngle) * (.17 + u * .55) - Math.cos(STUDY_LASH.restAngle) * .17;
    const cy = Math.sin(coiledAngle) * (.17 + u * .55) - Math.sin(STUDY_LASH.restAngle) * .17 + u * .53;
    const wave = Math.sin(u * 8.2 - time * 4) * .055 * Math.sin(u * Math.PI);
    out.set(THREE.MathUtils.lerp(cx, Math.cos(angle) * STUDY_LASH.length * u - Math.sin(angle) * wave, extension),
      THREE.MathUtils.lerp(cy, Math.sin(angle) * STUDY_LASH.length * u + Math.cos(angle) * wave, extension),
      Math.sin(u * 4.7 + time * .4) * .11 * Math.sin(u * Math.PI));
  }

  update(time: number) {
    const state = nullLashStateAtTime(STUDY_LASH, time);
    const local = THREE.MathUtils.euclideanModulo(time * STUDY_LASH.speed, 2.07);
    let extension = 0, angle = STUDY_LASH.restAngle;
    if (state.phase === 'lashing') { extension = THREE.MathUtils.smoothstep(local, .74, .94); angle = state.angle; }
    if (state.phase === 'extended') { extension = 1; angle = state.angle; }
    // Art-only recovery unwinds continuously; production timing/collision remain untouched.
    if (state.phase === 'retracting') { extension = 1 - THREE.MathUtils.smoothstep(local, 1.69, 2.07); angle = STUDY_LASH.restAngle + STUDY_LASH.lashSpan * extension; }
    this.time.value = time; this.warning.value = state.phase === 'warning' ? 1 : state.phase === 'lashing' ? .65 : 0;
    const positions = this.surface.attributes.position, normals = this.surface.attributes.normal;
    for (let row = 0; row <= this.rows; row++) {
      const u = row / this.rows; this.point(u, extension, angle, time, this.a); this.point(u + .001, extension, angle, time, this.b);
      const dx = this.b.x - this.a.x, dy = this.b.y - this.a.y, length = Math.max(.0001, Math.hypot(dx, dy));
      const radius = (.018 + Math.pow(1 - u, .72) * .24) * (1 + Math.sin(u * 89) * .045);
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
}

export class SculptedNullEncounter {
  readonly group = new THREE.Group();
  readonly hole = { value: new THREE.Vector3(0, 0, STUDY_NULL.holeRadius) };
  readonly time = { value: 0 };
  private readonly lip: THREE.Mesh;
  private readonly throat: THREE.Mesh;
  private readonly innerLight: THREE.PointLight;

  constructor() {
    this.group.name = 'cinematic-null-encounter'; this.group.position.set(0, STUDY_NULL.centerY, STUDY_NULL.z);
    // UVs parameterize a displaced annulus; both XY collision boundaries stay exact.
    const geometry = new THREE.PlaneGeometry(1, 1, 192, 48);
    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, uniforms: { hole: this.hole, time: this.time, radius: { value: STUDY_NULL.fieldRadius } },
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
    const body = new THREE.Mesh(geometry, material); body.frustumCulled = false; this.group.add(body);
    this.lip = new THREE.Mesh(new THREE.TorusGeometry(STUDY_NULL.holeRadius, .018, 8, 100), new THREE.MeshBasicMaterial({ color: new THREE.Color(.18, 1.1, 1.35) }));
    this.group.add(this.lip);
    // The aperture is genuinely open: a tapering, translucent throat adds depth around it.
    const throatMaterial = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      uniforms: { time: this.time },
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform float time;varying vec2 vUv;void main(){float threads=pow(.5+.5*sin(vUv.x*113.+vUv.y*13.-time*.8),20.);float fade=sin(vUv.y*3.14159);gl_FragColor=vec4(.12,.7,.85,(.08+threads*.25)*fade);}',
    });
    this.throat = new THREE.Mesh(new THREE.CylinderGeometry(.94, .83, 1.4, 80, 12, true), throatMaterial); this.throat.rotation.x = Math.PI / 2; this.group.add(this.throat);
    this.innerLight = new THREE.PointLight(0x80eafa, 18, 9, 2); this.group.add(this.innerLight);
    this.update(0);
  }
  update(time: number) {
    const safe = theNullSafeAtTime(STUDY_NULL, time); this.time.value = time;
    this.hole.value.set(safe.x, safe.y - STUDY_NULL.centerY, safe.radius);
    this.lip.position.set(safe.x, safe.y - STUDY_NULL.centerY, -.32);
    this.throat.position.set(safe.x, safe.y - STUDY_NULL.centerY, .38);
    this.innerLight.position.set(safe.x, safe.y - STUDY_NULL.centerY, -1.2);
    return safe;
  }
}
