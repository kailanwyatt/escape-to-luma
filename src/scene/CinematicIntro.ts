import * as THREE from 'three';
import { sampleOpening, sampleOpeningChoreography } from './OpeningSequence';
import { disposeThreeObject } from '../utils/disposeThree';
import { batchOpeningMeshes } from './batchOpeningMeshes';
import { DESKTOP_OPENING_QUALITY, type OpeningQuality } from './OpeningQuality';

const TAU = Math.PI * 2;
const CYAN = 0x7aeaff;
const GOLD = 0xffc486;
const ease = (a: number, b: number, t: number) => THREE.MathUtils.smoothstep(t, a, b);
const noise = /* glsl */ `
  float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
  float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
  float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=noise(p)*a;p=p*2.03+vec3(12.1,7.2,4.8);a*=.5;}return v;}
`;

function seeded(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let n = Math.imul(seed ^ seed >>> 15, 1 | seed);
    n ^= n + Math.imul(n ^ n >>> 7, 61 | n);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}

function metal(color: number, roughness = .42) {
  const pixels = new Uint8Array(128 * 128 * 4);
  const random = seeded(color);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const edge = Math.min(x, y, 127 - x, 127 - y);
    const grain = 158 + Math.sin(y * 1.9) * 9 + random() * 22;
    const value = edge < 1 ? 55 : edge < 2 ? 195 : grain;
    const index = (y * 128 + x) * 4;
    pixels[index] = pixels[index + 1] = pixels[index + 2] = value;
    pixels[index + 3] = 255;
  }
  const texture = new THREE.DataTexture(pixels, 128, 128);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true; texture.needsUpdate = true;
  return new THREE.MeshStandardMaterial({ color, metalness: .68, roughness, bumpMap: texture, bumpScale: .025, roughnessMap: texture });
}
function luminous(color: number, intensity = 2) {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: .32 });
}
function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) {
  const result = new THREE.Mesh(geometry, material);
  result.position.set(x, y, z);
  parent.add(result);
  return result;
}
function box(parent: THREE.Object3D, material: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number) {
  return mesh(parent, new THREE.BoxGeometry(w, h, d), material, x, y, z);
}
function ring(parent: THREE.Object3D, material: THREE.Material, radius: number, tube: number, z = 0) {
  return mesh(parent, new THREE.TorusGeometry(radius, tube, 10, 96), material, 0, 0, z);
}

/** A render-only film treatment. All poses derive from the canonical 35-second clock. */
export class CinematicIntro {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(42, 1, .1, 180);
  private readonly cosmos = new THREE.Group();
  private readonly laboratory = new THREE.Group();
  private readonly spark = new THREE.Group();
  private readonly probe = new THREE.Group();
  private readonly irises: THREE.Mesh[] = [];
  private readonly glass = new THREE.Group();
  private readonly shards: THREE.InstancedMesh;
  private readonly shardOrigins: THREE.Vector3[] = [];
  private readonly shardVelocities: THREE.Vector3[] = [];
  private readonly shardScales: number[] = [];
  private readonly shardPose = new THREE.Object3D();
  private readonly homeRings = new THREE.Group();
  private readonly orbitals = new THREE.Group();
  private readonly coreLight = new THREE.PointLight(CYAN, 25, 16, 1.4);
  private readonly alarm = new THREE.PointLight(0xff6940, 0, 22, 1.2);
  private readonly cold = luminous(0x78cbdc, 1.6);
  private readonly warm = luminous(0xe5a45e, 1.7);
  private readonly coreMaterial: THREE.ShaderMaterial;
  private readonly skyMaterial: THREE.ShaderMaterial;
  private readonly fieldMaterial: THREE.ShaderMaterial;
  private readonly scanMaterial: THREE.ShaderMaterial;
  private readonly stars: THREE.Points;
  private readonly motes: THREE.Points;
  private readonly haze: THREE.Mesh;
  private readonly wave: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  private readonly target = new THREE.Vector3();
  private readonly destination = new THREE.Vector3();
  private readonly nebulaFog = new THREE.Color(0x060b17);
  private readonly labFog = new THREE.FogExp2(0x07101b, .026);

  constructor(private readonly quality: Readonly<OpeningQuality> = DESKTOP_OPENING_QUALITY) {
    this.shards = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(1), new THREE.MeshStandardMaterial({ color: 0xb7e5ed, metalness: .48, roughness: .13, transparent: true, opacity: .75 }), quality.shards);
    this.shards.name = 'opening-fragments';
    this.shards.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.shards.frustumCulled = false;
    this.scene.background = this.nebulaFog;
    this.scene.add(this.cosmos, this.laboratory, this.spark);
    this.scene.add(new THREE.HemisphereLight(0x97bccf, 0x231916, 1.15));
    const key = new THREE.DirectionalLight(0xb9e4ff, 3.2);
    key.position.set(-5, 8, 6);
    const rim = new THREE.DirectionalLight(0xffba7b, 2.8);
    rim.position.set(5, 2, -8);
    this.scene.add(key, rim, this.coreLight, this.alarm);
    this.alarm.position.set(-3, 1, 2);

    this.skyMaterial = new THREE.ShaderMaterial({
      depthWrite: false, depthTest: false,
      uniforms: { time: { value: 0 }, aspect: { value: 1 } },
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,.9999,1.);}',
      fragmentShader: /* glsl */ `${noise.replace('i<5', `i<${quality.nebulaOctaves}`)}
        uniform float time,aspect;varying vec2 vUv;
        void main(){
          vec2 p=(vUv-.5)*vec2(aspect,1.);vec3 q=vec3(p*2.2,time*.006);
          float warp=fbm(q+vec3(8.,2.,0.));
          float cloud=fbm(q*2.1+warp*2.4);
          float lane=exp(-pow((p.y-p.x*.24+.13+(warp-.5)*.7)*3.2,2.));
          float wisps=pow(max(0.,cloud-.26),2.2)*lane*5.;
          vec3 col=vec3(.003,.009,.023);
          col+=mix(vec3(.025,.17,.22),vec3(.22,.12,.09),smoothstep(-.2,.7,p.x))*wisps;
          col+=vec3(.045,.032,.10)*pow(cloud,3.)*1.8;
          col*=1.-.35*smoothstep(.2,1.2,length(p));
          gl_FragColor=vec4(col,1.);
        }`,
    });
    const sky = mesh(this.cosmos, new THREE.PlaneGeometry(2, 2), this.skyMaterial);
    sky.frustumCulled = false; sky.renderOrder = -1000;

    const random = seeded(42017);
    const stars = new THREE.BufferGeometry();
    const starPositions = [], starColors = [], starSizes = [];
    for (let i = 0; i < quality.stars; i++) {
      starPositions.push((random() - .5) * 140, (random() - .5) * 90, -10 - random() * 100);
      const tint = new THREE.Color().setHSL(.52 + random() * .16, .18 + random() * .3, .55 + random() * .35);
      starColors.push(tint.r, tint.g, tint.b);
      starSizes.push(random() > .985 ? 3.2 : .5 + random() * 1.2);
    }
    stars.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    stars.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    stars.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));
    this.stars = new THREE.Points(stars, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending,
      vertexShader: 'attribute float size;varying vec3 vColor;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=size*1.8;}',
      fragmentShader: 'varying vec3 vColor;void main(){float r=length(gl_PointCoord-.5)*2.;float a=pow(max(0.,1.-r),2.);gl_FragColor=vec4(vColor*1.5,a);}',
    }));
    this.cosmos.add(this.stars);

    const planetMaterial = new THREE.ShaderMaterial({
      vertexShader: 'varying vec3 vNormal,vPosition;void main(){vNormal=normal;vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: /* glsl */ `${noise}
        varying vec3 vNormal,vPosition;void main(){
          vec3 n=normalize(vNormal);float light=max(0.,dot(n,normalize(vec3(-.9,.8,.55))));
          float clouds=fbm(vPosition*1.1);float ridges=fbm(vPosition*3.4+clouds);
          vec3 col=mix(vec3(.008,.015,.027),vec3(.11,.18,.23),clouds)*(.025+light*.65);
          col+=vec3(.1,.16,.2)*smoothstep(.54,.71,ridges)*light;
          float edge=pow(1.-max(0.,n.z),4.)*pow(light,.6);
          col+=vec3(.12,.44,.6)*edge*.8;gl_FragColor=vec4(col,1.);
        }`,
    });
    const planet = mesh(this.cosmos, new THREE.SphereGeometry(8, quality.sphereSegments, quality.sphereSegments * .75), planetMaterial, -17, 11, -42);
    planet.rotation.z = -.3;
    const atmosphere = mesh(this.cosmos, new THREE.SphereGeometry(8.09, quality.sphereSegments, quality.sphereSegments * .75), this.auraMaterial(0x58bbdc, .26), -17, 11, -42);
    atmosphere.name = 'planet-atmosphere';
    const moon = mesh(this.cosmos, new THREE.SphereGeometry(1.1, 32, 24), metal(0x646c78, .95), 17, 6, -32);
    moon.name = 'distant-moon';

    this.coreMaterial = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, warmth: { value: 0 } },
      vertexShader: /* glsl */ `${noise}
        uniform float time;varying vec3 vNormal,vPosition;
        void main(){vNormal=normal;vPosition=position;
          vec3 p=position+normal*(fbm(position*7.+time*.5)-.5)*.14;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`, 
      fragmentShader: /* glsl */ `${noise}
        uniform float time,warmth;varying vec3 vNormal,vPosition;
        void main(){float n=fbm(vPosition*10.+vec3(time*.3,-time*.8,0.));
          float veins=pow(smoothstep(.35,.7,n),2.);
          vec3 blue=mix(vec3(.015,.24,.5),vec3(1.7,3.2,3.7),veins);
          vec3 gold=mix(vec3(.5,.10,.01),vec3(3.5,1.8,.5),veins);
          gl_FragColor=vec4(mix(blue,gold,warmth),1.);}`, 
    });
    mesh(this.spark, new THREE.SphereGeometry(.36, quality.sphereSegments * .75, quality.sphereSegments / 2), this.coreMaterial);
    mesh(this.spark, new THREE.SphereGeometry(.46, 32, 16), this.auraMaterial(CYAN, .75));
    this.haze = mesh(this.spark, new THREE.PlaneGeometry(4.5, 4.5), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { color: { value: new THREE.Color(0x40badd) } },
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform vec3 color;varying vec2 vUv;void main(){float d=length((vUv-.5)*2.);gl_FragColor=vec4(color,exp(-d*d*9.)*.16*(1.-smoothstep(.6,1.,d)));}',
    }));
    this.spark.add(this.orbitals);
    for (let i = 0; i < 5; i++) {
      const points = [];
      for (let j = 0; j <= quality.curveSegments; j++) {
        const a = j / quality.curveSegments * TAU * (i < 2 ? 1.5 : .85);
        const r = .5 + Math.sin(j / quality.curveSegments * Math.PI) * (.25 + i * .12);
        points.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, Math.sin(a * 1.6) * .25));
      }
      const strand = mesh(this.orbitals, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), quality.curveSegments, .005 + i * .001, 5, false), luminous(i % 2 ? GOLD : CYAN, 1.4));
      strand.rotation.set(i * .7, i * .8, i * 1.5);
    }
    const dust = new THREE.BufferGeometry();
    const dustPositions = [];
    for (let i = 0; i < quality.motes; i++) {
      const radius = .65 + Math.pow(random(), 2) * 4;
      const a = random() * TAU, b = random() * Math.PI;
      dustPositions.push(Math.cos(a) * Math.sin(b) * radius, Math.cos(b) * radius * .55, Math.sin(a) * Math.sin(b) * radius);
    }
    dust.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    this.motes = new THREE.Points(dust, new THREE.PointsMaterial({ color: 0xa0d6e8, size: .017, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.spark.add(this.motes);

    this.scanMaterial = this.beamMaterial(.18);
    this.buildProbe();
    this.cosmos.add(this.probe);
    this.fieldMaterial = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, strength: { value: .18 }, warmth: { value: 0 } },
      transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `uniform float time,strength,warmth;varying vec2 vUv;void main(){
        float line=pow(.5+.5*sin(vUv.y*170.-time*2.),20.);
        float sweep=pow(.5+.5*sin(vUv.y*9.-time*1.3),12.);
        float edge=pow(abs(vUv.x-.5)*2.,6.);
        vec3 col=mix(vec3(.1,.7,1.),vec3(1.,.25,.05),warmth);
        gl_FragColor=vec4(col,(line*.3+sweep*.16+edge*.16+.018)*strength);}`,
    });
    this.buildLaboratory(random);
    this.wave = new THREE.Mesh(new THREE.TorusGeometry(1, .02, 8, 128), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.laboratory.add(this.wave);
    for (let i = 0; i < 4; i++) {
      const pulse = ring(this.homeRings, new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), 1, .008);
      pulse.rotation.set(.1 * i, -.2, 0);
    }
    this.laboratory.add(this.homeRings);
  }

  private auraMaterial(color: number, opacity: number) {
    return new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { color: { value: new THREE.Color(color) }, opacity: { value: opacity } },
      vertexShader: 'varying vec3 vNormal,vView;void main(){vec4 p=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
      fragmentShader: 'uniform vec3 color;uniform float opacity;varying vec3 vNormal,vView;void main(){float rim=pow(1.-abs(dot(normalize(vNormal),normalize(vView))),2.8);gl_FragColor=vec4(color*1.5,rim*opacity);}',
    });
  }

  private beamMaterial(opacity: number) {
    return new THREE.ShaderMaterial({
      uniforms: { opacity: { value: opacity } }, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform float opacity;varying vec2 vUv;void main(){float edge=pow(sin(vUv.x*3.14159),3.);gl_FragColor=vec4(.22,.65,.85,edge*pow(1.-vUv.y,1.6)*opacity);}',
    });
  }

  private buildProbe() {
    const body = metal(0x50606b), dark = metal(0x101c26), copper = metal(0x997954);
    const hull = mesh(this.probe, new THREE.CylinderGeometry(.9, 1.1, 1.8, 12), body, 0, 0, -.8);
    hull.rotation.x = Math.PI / 2;
    ring(this.probe, copper, .85, .12, .18);
    ring(this.probe, this.cold, .72, .027, .3);
    mesh(this.probe, new THREE.CircleGeometry(.7, 48), dark, 0, 0, .25);
    mesh(this.probe, new THREE.CircleGeometry(.28, 48), this.cold, 0, 0, .27);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      const rib = box(this.probe, copper, Math.cos(a), Math.sin(a), -.7, .12, .12, 1.9);
      rib.rotation.z = a;
      const leaf = box(this.probe, body, Math.cos(a) * .7, Math.sin(a) * .7, .38, .3, .6, .09);
      leaf.rotation.z = a - Math.PI / 2;
      leaf.userData.animated = true;
      this.irises.push(leaf);
    }
    for (const side of [-1, 1]) {
      box(this.probe, copper, side * 2, 0, -.8, 2.8, .1, .1);
      box(this.probe, dark, side * 3.1, 0, -.8, 2.2, 1.8, .12);
      for (let x = 0; x < 8; x++) for (let y = 0; y < 5; y++) {
        box(this.probe, body, side * 3.1 - .93 + x * .265, -.72 + y * .35, -.72, .24, .31, .025);
      }
      box(this.probe, this.cold, side * 3.1, -.95, -.7, 2.25, .025, .025);
    }
    const scan = mesh(this.probe, new THREE.ConeGeometry(1.1, 4, 48, 1, true), this.scanMaterial, 0, 0, 2.3);
    scan.rotation.x = -Math.PI / 2;
    batchOpeningMeshes(this.probe);
  }

  private buildLaboratory(random: () => number) {
    const steel = metal(0x35424e), dark = metal(0x141c25, .55), edge = metal(0x6d7b84, .3), brass = metal(0x8e7354);
    const floor = box(this.laboratory, dark, 0, -3.4, -10, 34, .3, 65);
    floor.receiveShadow = true;
    mesh(this.laboratory, new THREE.CylinderGeometry(1.6, 2, .55, 48), dark, 0, -3, 0);
    for (const x of [-1.4, 1.4]) box(this.laboratory, steel, x, 3.8, 0, .16, 2.4, .16);
    // Repeating architecture gives the chamber a visible scale and a vanishing point.
    for (let bay = 0; bay < this.quality.bays; bay++) {
      const z = 5 - bay * 5;
      for (const side of [-1, 1]) {
        box(this.laboratory, steel, side * 7, 1, z, .65, 9, .65);
        box(this.laboratory, edge, side * 6.6, 1, z, .13, 8.5, .16);
        box(this.laboratory, this.cold, side * 6.5, 1.5, z + .12, .04, 4, .04);
        box(this.laboratory, dark, side * 7.4, .8, z - 2.4, .4, 8, 4.4);
        box(this.laboratory, brass, side * 6.5, -2.9, z - 2.4, .08, .08, 4.8);
        for (let panel = 0; panel < 4; panel++) {
          box(this.laboratory, steel, side * 7.1, -.9 + panel * 1.3, z - 2.4, .15, 1.18, 3.6);
        }
      }
      box(this.laboratory, steel, 0, 5.1, z, 14, .45, .55);
      box(this.laboratory, this.cold, 0, 4.85, z, 5, .04, .08);
      box(this.laboratory, steel, 0, -3.2, z, 14, .035, .04);
    }
    for (const x of [-5.8, -4.8, 4.8, 5.8]) {
      box(this.laboratory, edge, x, -3.19, -12, .07, .025, 46);
      box(this.laboratory, this.warm, x, -3.18, -12, .018, .018, 46);
    }
    for (const side of [-1, 1]) {
      const desk = new THREE.Group();
      desk.position.set(side * 4.9, -1.8, -2.8);
      desk.rotation.y = -side * .4;
      box(desk, dark, 0, -.65, 0, .55, 1.5, .6);
      box(desk, steel, 0, .2, 0, 1.35, .9, .18);
      box(desk, dark, 0, .21, .1, 1.16, .7, .03);
      for (let i = 0; i < 6; i++) {
        box(desk, this.cold, -.36, .43 - i * .085, .125, .32 + random() * .55, .012, .01);
      }
      for (let i = 0; i < 4; i++) box(desk, this.warm, -.42 + i * .28, -.12, .13, .05, .025, .025);
      this.laboratory.add(desk);
      const cablePoints = [new THREE.Vector3(side * 2.2, -2.7, -.8), new THREE.Vector3(side * 2.9, -3.15, -1.2), new THREE.Vector3(side * 4, -3.2, -2.6), new THREE.Vector3(side * 4.9, -2.4, -2.8)];
      mesh(this.laboratory, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cablePoints), 40, .045, 8, false), dark);
    }
    // Layered pedestal and suspended cap, with visible bolts and radial seams.
    for (const side of [-1, 1]) {
      const y = side * 2.6;
      mesh(this.laboratory, new THREE.CylinderGeometry(2.2, 2.45, .35, 64), steel, 0, y, 0);
      mesh(this.laboratory, new THREE.CylinderGeometry(1.93, 1.93, .22, 64), dark, 0, y - side * .24, 0);
      const rim = ring(this.laboratory, this.cold, 1.98, .023);
      rim.rotation.x = Math.PI / 2; rim.position.y = y - side * .35;
      const trim = ring(this.laboratory, brass, 2.28, .055);
      trim.rotation.x = Math.PI / 2; trim.position.y = y;
      for (let i = 0; i < 24; i++) {
        const a = i / 24 * TAU;
        const screw = mesh(this.laboratory, new THREE.CylinderGeometry(.045, .045, .06, 6), edge, Math.cos(a) * 2.13, y - side * .2, Math.sin(a) * 2.13);
        screw.name = 'chamber-fastener';
      }
    }
    // Glass is segmented so the fracture has a physical silhouette.
    const glassMaterial = new THREE.MeshPhysicalMaterial({ color: 0x83c5d3, metalness: .1, roughness: .13, transparent: true, opacity: .07, side: THREE.DoubleSide, depthWrite: false });
    for (let i = 0; i < 12; i++) {
      const segment = mesh(this.glass, new THREE.CylinderGeometry(1.9, 1.9, 4.45, 6, 1, true, i / 12 * TAU, TAU / 12 - .015), glassMaterial);
      segment.name = `containment-pane-${i}`;
    }
    this.laboratory.add(this.glass);
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * TAU + Math.PI / 4;
      const x = Math.cos(a) * 2.05, z = Math.sin(a) * 2.05;
      box(this.laboratory, steel, x, 0, z, .12, 5, .12);
      box(this.laboratory, this.cold, x * .98, 0, z * .98, .025, 4.3, .025);
    }
    mesh(this.laboratory, new THREE.CylinderGeometry(1.86, 1.86, 4.4, 64, 1, true), this.fieldMaterial);
    // Behind the subject, nested rings suggest a huge machine below the city.
    for (let i = 0; i < 5; i++) {
      const r = ring(this.laboratory, i % 2 ? brass : steel, 3.8 + i * .33, .09, -5.5);
      r.rotation.y = .04;
    }
    ring(this.laboratory, this.warm, 4.15, .025, -5.4);
    for (let i = 0; i < 20; i++) {
      const a = i / 20 * TAU;
      const brace = box(this.laboratory, edge, Math.cos(a) * 4.1, Math.sin(a) * 4.1, -5.4, .1, .7, .2);
      brace.rotation.z = a - Math.PI / 2;
    }
    const shaft = mesh(this.laboratory, new THREE.ConeGeometry(4, 11, 48, 1, true), this.beamMaterial(.075), -3, 1, -6);
    shaft.rotation.z = -.27;
    const beam = new THREE.SpotLight(0x8edaff, 95, 25, .5, .9, 1.3);
    beam.position.set(-3, 6, 3); beam.target.position.set(0, -2, 0);
    this.laboratory.add(beam, beam.target);
    for (let i = 0; i < this.quality.shards; i++) {
      this.shardScales.push(.07 + random() * .13);
      const a = random() * TAU;
      this.shardOrigins.push(new THREE.Vector3(Math.cos(a) * 1.9, (random() - .5) * 4.2, Math.sin(a) * 1.9));
      this.shardVelocities.push(new THREE.Vector3(Math.cos(a) * (1 + random() * 2), (random() - .25) * 2, Math.sin(a) * 2 + 1));
    }
    this.laboratory.add(this.shards);
    const particles = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 0; i < this.quality.dust; i++) positions.push((random() - .5) * 16, (random() - .5) * 9, 5 - random() * 30);
    particles.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const dust = new THREE.Points(particles, new THREE.PointsMaterial({ color: 0x82b8c4, size: .018, transparent: true, opacity: .45, depthWrite: false }));
    this.laboratory.add(dust);
    batchOpeningMeshes(this.laboratory);
  }

  sample(elapsed: number, reducedMotion = false) {
    const { stage, progress } = sampleOpening(elapsed);
    const choreography = sampleOpeningChoreography(elapsed, reducedMotion);
    const t = reducedMotion ? [2.5, 8, 15, 22, 28, 33][stage] : elapsed;
    const p = reducedMotion ? .5 : progress;
    const s = p * p * (3 - 2 * p);
    const portrait = this.camera.aspect < .85;
    const warmth = stage >= 3 ? ease(19, 25, elapsed) : .08;
    this.cosmos.visible = stage < 2;
    this.laboratory.visible = stage >= 2;
    this.scene.fog = stage >= 2 ? this.labFog : null;
    this.skyMaterial.uniforms.time.value = t;
    this.skyMaterial.uniforms.aspect.value = this.camera.aspect;
    this.coreMaterial.uniforms.time.value = t;
    this.coreMaterial.uniforms.warmth.value = warmth;
    this.fieldMaterial.uniforms.time.value = t;
    this.fieldMaterial.uniforms.warmth.value = stage === 4 ? 1 : 0;
    this.fieldMaterial.uniforms.strength.value = stage < 4 ? .55 : .55 * (1 - ease(25, 27.5, elapsed));
    this.coreLight.color.setHex(warmth > .5 ? GOLD : CYAN);
    this.coreLight.intensity = 22 + Math.sin(t * 2) * 3 + (stage === 3 ? s * 25 : 0);
    this.alarm.intensity = stage === 4 ? 25 * (.7 + .3 * Math.sin(t * 3)) : 0;
    this.stars.rotation.z = t * .0005;
    this.orbitals.rotation.set(t * .12, t * .2, t * .07);
    this.motes.rotation.y = t * .055;
    this.spark.position.set(0, Math.sin(t * .7) * .08, 0);
    this.spark.scale.setScalar(stage === 3 ? 1 + Math.sin(p * Math.PI) * .17 : 1);
    this.probe.visible = stage === 1;
    this.probe.position.set(2.8 * (1 - choreography.approach), 1.1 * (1 - choreography.approach), -6.5 + choreography.approach * 4.8);
    this.probe.rotation.set(.12 * (1 - choreography.approach), -.16 * (1 - choreography.approach), -.12);
    this.scanMaterial.uniforms.opacity.value = .22 * (1 - choreography.capture);
    this.irises.forEach((leaf, i) => {
      const a = i / 8 * TAU, radius = .7 - choreography.capture * .42;
      leaf.position.set(Math.cos(a) * radius, Math.sin(a) * radius, .38);
    });
    if (stage === 1) this.spark.position.z = -choreography.capture * 1.5;
    const fracture = ease(25.2, 29.5, elapsed);
    this.glass.visible = stage >= 2 && fracture < .05;
    this.shards.visible = stage === 4 && !reducedMotion;
    if (this.shards.visible) {
      for (let i = 0; i < this.shards.count; i++) {
        const pose = this.shardPose;
        pose.position.copy(this.shardOrigins[i]).addScaledVector(this.shardVelocities[i], fracture * 2);
        pose.position.y -= fracture * fracture * 3;
        pose.rotation.set(fracture * (i % 5), i * .7 + fracture * 2, i + fracture);
        pose.scale.set(.4, 2, .12).multiplyScalar(this.shardScales[i]);
        pose.updateMatrix();
        this.shards.setMatrixAt(i, pose.matrix);
      }
      this.shards.instanceMatrix.needsUpdate = true;
    }
    this.wave.visible = stage === 4 && !reducedMotion;
    this.wave.scale.setScalar(.5 + fracture * 9);
    this.wave.material.opacity = (1 - fracture) * .65;
    this.homeRings.visible = stage === 3;
    this.homeRings.children.forEach((child, i) => {
      const pulse = child as THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
      const phase = reducedMotion ? .4 : ((p * 1.5 + i * .24) % 1);
      pulse.scale.setScalar(.8 + phase * 5);
      pulse.material.opacity = Math.sin(phase * Math.PI) * .38;
      pulse.position.z = -1 - phase * 3;
    });
    // Deliberate, connected dolly shots; the only location cut is hidden by the shared fade.
    switch (stage) {
      case 0:
        this.destination.set(1.4 - s * .8, .6 - s * .25, 13 - s * 2);
        this.target.set(portrait ? 0 : -2.1, .15, 0); break;
      case 1:
        this.destination.set(.6 + s * 2, .35 + s * .8, 11 + s);
        this.target.set(portrait ? 0 : -1.5, .2, -1.2 * s); break;
      case 2:
        this.destination.set(5.5 - s * 2, 2.7 - s * 1.4, 13 - s * 1.5);
        this.target.set(portrait ? 0 : -1.1, -.2, 0); break;
      case 3:
        this.destination.set(3.5 - s * 2.5, 1.3 - s * .9, 11.5 - s * 1.5);
        this.target.set(portrait ? 0 : -1, -.1, 0); break;
      case 4:
        this.destination.set(1 - s * 2.5, .4 + s * .5, 10 + s * 3);
        this.target.set(portrait ? 0 : -.8, 0, 0); break;
      default:
        this.destination.set(-1.5 + s * .7, .9 - s * .4, 13 - s * 3);
        this.target.set(portrait ? 0 : -1, 0, -s * 2);
        this.spark.position.z = -s * 6;
    }
    if (portrait) this.destination.z += 6;
    this.camera.position.copy(this.destination);
    this.camera.lookAt(this.target);
    const fov = portrait ? 49 : 42;
    if (this.camera.fov !== fov) { this.camera.fov = fov; this.camera.updateProjectionMatrix(); }
    this.haze.quaternion.copy(this.camera.quaternion);
    this.coreLight.position.copy(this.spark.position);
    return { stage, progress, transferOpacity: choreography.transferOpacity };
  }

  dispose() { this.shards.dispose(); disposeThreeObject(this.scene); }
}
