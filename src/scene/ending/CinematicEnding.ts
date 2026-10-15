import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { batchOpeningMeshes } from '../batchOpeningMeshes';
import { sampleEnding } from './EndingSequence';
import { EndingWorldLife, ENDING_SPARK_COLORS } from './EndingWorldLife';

const TAU = Math.PI * 2;
const GOLD = 0xffca7c, CYAN = ENDING_SPARK_COLORS[0];
const smooth = (a: number, b: number, t: number) => THREE.MathUtils.smoothstep(t, a, b);
const noise = /* glsl */ `
float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=noise(p)*a;p=p*2.03+vec3(5.1,7.2,4.8);a*=.5;}return v;}
`;
function seeded(seed: number) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let n = Math.imul(seed ^ seed >>> 15, 1 | seed); n ^= n + Math.imul(n ^ n >>> 7, 61 | n); return ((n ^ n >>> 14) >>> 0) / 4294967296; };
}
function put(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}
function curve(parent: THREE.Object3D, points: THREE.Vector3[], radius: number, material: THREE.Material, segments = 40) {
  return put(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, radius, 6, false), material);
}
function ring(parent: THREE.Object3D, r: number, tube: number, material: THREE.Material, x: number, y: number, z: number) {
  const mesh = put(parent, new THREE.TorusGeometry(r, tube, 6, 96), material, x, y, z); mesh.rotation.x = Math.PI / 2; return mesh;
}
function lightMaterial(color: number, intensity = 2) {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: .35, metalness: .25 });
}

class LivingLight {
  readonly group = new THREE.Group();
  readonly core: THREE.ShaderMaterial;
  readonly halo: THREE.Mesh;
  readonly strands = new THREE.Group();
  constructor(color: number, scale = 1) {
    const tint = new THREE.Color(color);
    this.core = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, tint: { value: tint } },
      vertexShader: `${noise}uniform float time;varying vec3 vN,vP;
        void main(){vN=normal;vP=position;vec3 p=position+normal*(noise(position*7.+time*.5)-.5)*.07;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
      fragmentShader: `${noise}uniform float time;uniform vec3 tint;varying vec3 vN,vP;
        void main(){float n=fbm(vP*12.+vec3(time*.4,-time*.6,0.));float vein=smoothstep(.3,.68,n);
        vec3 c=tint*(.45+vein*1.8)+vec3(1.)*pow(vein,9.)*.25;gl_FragColor=vec4(c,1.);}`,
    });
    put(this.group, new THREE.SphereGeometry(.38, 32, 24), this.core);
    const haloMaterial = new THREE.ShaderMaterial({
      uniforms: { tint: { value: tint } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform vec3 tint;varying vec2 vUv;void main(){float d=length(vUv-.5)*2.;float a=exp(-d*d*8.)*(1.-smoothstep(.65,1.,d));gl_FragColor=vec4(tint,a*.10);}',
    });
    this.halo = put(this.group, new THREE.PlaneGeometry(2.8, 2.8), haloMaterial);
    this.group.add(this.strands);
    const lineMaterial = lightMaterial(color, 2.5);
    for (let i = 0; i < 3; i++) {
      const points: THREE.Vector3[] = [];
      for (let j = 0; j <= 64; j++) {
        const a = j / 64 * TAU * 1.3, r = .42 + Math.sin(j / 64 * Math.PI) * .16;
        points.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, Math.sin(a * 1.7) * .14));
      }
      const strand = curve(this.strands, points, .006, lineMaterial, 64);
      strand.rotation.set(i * 1.1, i * .7, i * 1.2);
    }
    batchOpeningMeshes(this.strands);
    this.group.scale.setScalar(scale);
  }
  update(time: number, camera: THREE.Camera) {
    this.core.uniforms.time.value = time;
    this.strands.rotation.set(time * .12, time * .18, -time * .1);
    this.halo.quaternion.copy(camera.quaternion);
  }
}

/** Shared campaign and demo artwork. No campaign state, rewards, native UI, or browser dependencies. */
export class CinematicEnding {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(44, 1, .1, 300);
  private readonly architecture = new THREE.Group();
  private readonly tree = new THREE.Group();
  private readonly life = new EndingWorldLife();
  private readonly hero: LivingLight;
  private readonly companions: LivingLight[] = [];
  private readonly shaderTimes: THREE.IUniform<number>[] = [];
  private readonly pulses: THREE.Mesh[] = [];
  private readonly waterfalls: THREE.ShaderMaterial;
  private readonly sky: THREE.ShaderMaterial;
  private readonly pool: THREE.ShaderMaterial;
  private readonly heroLight = new THREE.PointLight(CYAN, 16, 16, 2);
  private readonly chorusLight = new THREE.PointLight(GOLD, 0, 32, 2);
  private readonly motes: THREE.Points;
  private readonly target = new THREE.Vector3();
  private readonly reunion = new THREE.Vector3();
  private readonly voyage = new THREE.Vector3();
  private disposed = false;

  constructor(heroColor = CYAN) {
    this.hero = new LivingLight(heroColor, 1.25);
    this.heroLight.color.setHex(heroColor);
    this.scene.background = new THREE.Color(0x07121f);
    this.scene.fog = new THREE.FogExp2(0x0c1829, .004);
    this.scene.add(this.architecture, this.tree, this.life.group, this.hero.group, this.heroLight, this.chorusLight);
    this.scene.add(new THREE.HemisphereLight(0x94d8ed, 0x263336, 2.2));
    const dawn = new THREE.DirectionalLight(0xffc482, 2.8); dawn.position.set(-15, 16, -25); this.scene.add(dawn);
    const fill = new THREE.DirectionalLight(0x81b9e9, 2.1); fill.position.set(7, 10, 18); this.scene.add(fill);
    this.chorusLight.position.set(0, 4, -1);
    const treeLight = new THREE.PointLight(0xffc870, 180, 45, 1.7); treeLight.position.set(0, 10, -27); this.scene.add(treeLight);

    this.sky = new THREE.ShaderMaterial({
      depthWrite: false, depthTest: false,
      uniforms: { time: { value: 0 }, aspect: { value: 1 } },
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,.99999,1.);}',
      fragmentShader: `${noise}uniform float time,aspect;varying vec2 vUv;void main(){
        vec2 p=(vUv-.5)*vec2(aspect,1.);float cloud=fbm(vec3(p*3.3+vec2(0.,time*.004),1.));
        float arc=exp(-pow((p.y-.2-p.x*.14+(cloud-.5)*.4)*4.,2.));
        vec3 c=mix(vec3(.022,.045,.075),vec3(.003,.012,.034),smoothstep(.0,.73,vUv.y));
        c+=vec3(.07,.13,.21)*pow(cloud,2.)*arc;
        c+=vec3(.15,.072,.03)*exp(-pow((vUv.y-.28)*4.5,2.))*(.5+cloud*.6);
        c+=vec3(.02,.11,.10)*pow(max(0.,cloud-.36),2.)*3.;
        float mist=fbm(vec3(p*9.+cloud*2.,time*.009));
        c+=vec3(.045,.07,.10)*pow(mist,2.)*(1.-smoothstep(.3,.65,vUv.y))*3.;
        gl_FragColor=vec4(c,1.);}`,
    });
    const sky = put(this.scene, new THREE.PlaneGeometry(2, 2), this.sky); sky.frustumCulled = false; sky.renderOrder = -1000;
    this.shaderTimes.push(this.sky.uniforms.time);
    this.buildSky();
    this.waterfalls = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      uniforms: { time: { value: 0 } },
      vertexShader: 'uniform float time;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.x+=sin(uv.y*12.+time*.8)*.08;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
      fragmentShader: `${noise}uniform float time;varying vec2 vUv;void main(){
        float edge=pow(sin(vUv.x*3.14159),.6);float streak=pow(.5+.5*sin(vUv.x*150.+noise(vec3(vUv*7.,time*.2))*2.),3.);
        float flow=.6+.4*noise(vec3(vUv.x*35.,vUv.y*12.+time*2.,2.));
        float fade=smoothstep(0.,.2,vUv.y);gl_FragColor=vec4(mix(vec3(.12,.43,.64),vec3(.85,1.2,1.5),streak),edge*fade*flow*.48);}`,
    });
    this.shaderTimes.push(this.waterfalls.uniforms.time);
    this.buildIslands();
    this.buildTree();
    this.buildBridge();
    this.pool = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { time: { value: 0 }, arrival: { value: 0 } },
      vertexShader: 'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `${noise}uniform float time,arrival;varying vec3 vP;void main(){
        float r=length(vP.xy);float n=noise(vec3(vP.xy*2.,time*.28));
        float ripple=pow(.5+.5*sin(r*8.-time*1.8+n*.8),20.);
        float reflection=exp(-pow(vP.x*(2.1+n),2.))*(.2+.8*pow(.5+.5*sin(vP.y*32.+n*3.),2.));
        vec3 c=vec3(.015,.05,.085)+vec3(.48,.25,.07)*reflection+vec3(.06,.2,.25)*ripple;
        c+=vec3(.18,.1,.035)*arrival*ripple;gl_FragColor=vec4(c,.96);}`,
    });
    const pool = put(this.architecture, new THREE.CircleGeometry(6.25, 96), this.pool, 0, -.91, 3); pool.rotation.x = -Math.PI / 2;
    this.shaderTimes.push(this.pool.uniforms.time);
    this.motes = this.makeMotes(); this.scene.add(this.motes);
    const colors = ENDING_SPARK_COLORS.slice(1);
    colors.forEach((color, i) => {
      const light = new LivingLight(color, .6 + (i % 3) * .13); this.companions.push(light); this.scene.add(light.group);
    });
    const pulseMaterial = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    for (let i = 0; i < 3; i++) {
      const pulse = ring(this.scene, 1, .014, pulseMaterial.clone(), 0, -.84, 3); this.pulses.push(pulse);
    }
    pulseMaterial.dispose();
    batchOpeningMeshes(this.architecture);
    // Polyhedra are non-indexed; normalize them before combining with indexed tubes.
    this.tree.traverse(object => {
      if (object instanceof THREE.Mesh && !(object instanceof THREE.InstancedMesh) && !object.geometry.index) {
        object.geometry.setIndex(Array.from({ length: object.geometry.attributes.position.count }, (_, i) => i));
      }
    });
    batchOpeningMeshes(this.tree);
    this.sample(0);
  }

  private buildSky() {
    const random = seeded(20269);
    const positions: number[] = [], colors: number[] = [], sizes: number[] = [];
    for (let i = 0; i < 1900; i++) {
      positions.push((random() - .5) * 260, 12 + random() * 100, -55 - random() * 120);
      const tint = new THREE.Color().setHSL(.10 + random() * .55, .2, .65 + random() * .3);
      colors.push(tint.r, tint.g, tint.b); sizes.push(random() > .99 ? 3 : .6 + random() * 1.3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    const time = { value: 0 }; this.shaderTimes.push(time);
    this.scene.add(new THREE.Points(geometry, new THREE.ShaderMaterial({
      uniforms: { time }, transparent: true, depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending,
      vertexShader: 'attribute float size;varying vec3 vColor;varying float vSeed;void main(){vColor=color;vSeed=position.x;gl_PointSize=size*1.4;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform float time;varying vec3 vColor;varying float vSeed;void main(){float a=pow(max(0.,1.-length(gl_PointCoord-.5)*2.),3.);gl_FragColor=vec4(vColor*1.6,a*(.7+.3*sin(time*.4+vSeed)));}',
    })));
    const auroraTime = { value: 0 }; this.shaderTimes.push(auroraTime);
    const aurora = new THREE.ShaderMaterial({
      uniforms: { time: auroraTime }, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'uniform float time;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.z+=sin(uv.x*9.+time*.04)*7.;p.y+=sin(uv.x*12.+time*.05)*3.;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
      fragmentShader: `${noise}uniform float time;varying vec2 vUv;void main(){float f=pow(sin(vUv.y*3.14159),2.)*pow(sin(vUv.x*3.14159),2.);
        float streak=.25+.75*pow(.5+.5*sin(vUv.x*210.+noise(vec3(vUv*14.,time*.04))*4.),4.);
        vec3 c=mix(vec3(.08,.52,.38),vec3(.3,.18,.5),vUv.y);gl_FragColor=vec4(c,f*streak*.28);}`,
    });
    put(this.scene, new THREE.PlaneGeometry(140, 24, 100, 12), aurora, 0, 39, -94).rotation.z = .13;
  }

  private buildIslands() {
    const pixels = new Uint8Array(128 * 128 * 4), textureRandom = seeded(841);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const v = 100 + Math.sin(x * .37 + Math.sin(y * .1)) * 24 + Math.sin(x * 1.1) * 14 + textureRandom() * 24;
      const n = (y * 128 + x) * 4; pixels[n] = v * .68; pixels[n + 1] = v * .88; pixels[n + 2] = v; pixels[n + 3] = 255;
    }
    const texture = new THREE.DataTexture(pixels, 128, 128); texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter; texture.generateMipmaps = true; texture.needsUpdate = true;
    const stone = new THREE.MeshStandardMaterial({ color: 0xaac3c7, map: texture, bumpMap: texture, bumpScale: .2, roughness: .9, metalness: .08 });
    const cap = new THREE.MeshStandardMaterial({ color: 0x557378, roughness: .6, metalness: .4 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xc29656, roughness: .28, metalness: .78 });
    const lit = lightMaterial(GOLD, 1.4);
    const locations = [
      [0, -2, 3, 7], [0, -2, -27, 12], [-19, 1, -28, 4.4], [19, 4, -43, 5.6], [-28, 7, -62, 5.5],
      [35, -1, -67, 8], [-42, -3, -88, 8], [8, 8, -81, 6], [-12, 12, -110, 9], [53, 13, -112, 10],
      [-12, -7, -9, 3.5], [14, -5, -16, 4.2], [-28, -9, -38, 6], [27, -9, -35, 5.2],
    ];
    const random = seeded(971);
    locations.forEach(([x, y, z, r], index) => {
      put(this.architecture, this.floatingRock(r, r * (1.6 + random() * .8), index + 6), stone, x, y - .2, z);
      for (let j = 0; j < 4; j++) {
        const a = j / 4 * TAU + index;
        put(this.architecture, this.floatingRock(r * .18, r * (.8 + random() * .9), j + index * 4), stone,
          x + Math.cos(a) * r * .65, y - r * .65, z + Math.sin(a) * r * .65);
      }
      put(this.architecture, new THREE.CylinderGeometry(r, r * .92, .6, 64), cap, x, y, z);
      ring(this.architecture, r, .07, gold, x, y + .28, z);
      ring(this.architecture, r * .96, .018, lit, x, y + .34, z);
      for (let j = 0; j < (index < 2 ? 12 : 6); j++) {
        const a = j / (index < 2 ? 12 : 6) * TAU;
        const px = x + Math.cos(a) * r * .83, pz = z + Math.sin(a) * r * .83;
        const h = .6 + random() * 1.2;
        put(this.architecture, new THREE.ConeGeometry(.10, h, 6), gold, px, y + .4 + h / 2, pz);
        put(this.architecture, new THREE.SphereGeometry(.07, 8, 6), lit, px, y + .45 + h, pz);
        if (index > 1 && j % 2 === 0) put(this.architecture, new THREE.ConeGeometry(.35, 1.6 + random() * 1.6, 5), stone, px, y + 1.1, pz);
      }
      const count = index < 2 ? 3 : 1;
      for (let j = 0; j < count; j++) {
        const a = (j / count) * 1.6 + .3, height = r * 2.8;
        const fall = put(this.architecture, new THREE.PlaneGeometry(r * .24, height, 3, 14), this.waterfalls,
          x + Math.cos(a) * r * .6, y - height / 2, z + Math.sin(a) * r * .6);
        fall.rotation.y = -.15 + j * .4;
      }
    });
    // Small gardens break up the terrace silhouettes and catch the warm rim light.
    const plants = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .9, metalness: 0 }), 1000);
    const pose = new THREE.Object3D(), tint = new THREE.Color();
    for (let i = 0; i < plants.count; i++) {
      const [x, y, z, r] = locations[i % locations.length];
      const a = random() * TAU, radius = r * (.72 + random() * .2);
      pose.position.set(x + Math.cos(a) * radius, y + .45 + random() * .3, z + Math.sin(a) * radius);
      pose.scale.set(.15 + random() * .4, .2 + random() * .5, .15 + random() * .4);
      pose.rotation.set(random(), random() * TAU, random()); pose.updateMatrix(); plants.setMatrixAt(i, pose.matrix);
      tint.setHSL(random() > .85 ? .11 : .44, .4, .09 + random() * .12); plants.setColorAt(i, tint);
    }
    this.architecture.add(plants);
    const flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.08, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff).multiplyScalar(1.8) }), 720);
    flowers.name = 'bioluminescent-gardens';
    for (let i = 0; i < flowers.count; i++) {
      const [x, y, z, r] = locations[i % locations.length], a = random() * TAU, radius = r * (.70 + random() * .24);
      pose.position.set(x + Math.cos(a) * radius, y + .7 + random() * .45, z + Math.sin(a) * radius);
      pose.scale.setScalar(.5 + random()); pose.updateMatrix(); flowers.setMatrixAt(i, pose.matrix);
      flowers.setColorAt(i, new THREE.Color(ENDING_SPARK_COLORS[i % ENDING_SPARK_COLORS.length]));
    }
    this.architecture.add(flowers);
    // Nested rings and radial inlays on the arrival terrace.
    for (const radius of [1.1, 2.8, 5.1, 6.4]) ring(this.architecture, radius, .018, lit, 0, -.88, 3);
    for (let i = 0; i < 48; i++) {
      const a = i / 48 * TAU;
      const rune = put(this.architecture, new THREE.BoxGeometry(i % 4 === 0 ? .035 : .018, .012, i % 4 === 0 ? .32 : .14), lit, Math.cos(a) * 5.8, -.87, 3 + Math.sin(a) * 5.8);
      rune.rotation.y = -a + Math.PI / 2;
    }
  }

  private floatingRock(radius: number, depth: number, seed: number) {
    const positions: number[] = [], uv: number[] = [], indices: number[] = [], sides = 36, levels = 9;
    for (let ring = 0; ring <= levels; ring++) {
      const t = ring / levels;
      for (let j = 0; j <= sides; j++) {
        const a = j / sides * TAU;
        const ridge = 1 + .10 * Math.sin(a * 7 + seed) + .07 * Math.cos(a * 13 + t * 2 + seed);
        const r = radius * Math.pow(1 - t * .985, .62) * ridge;
        positions.push(Math.cos(a) * r + Math.sin(t * 3 + seed) * t * radius * .13, -t * depth, Math.sin(a) * r);
        uv.push(j / sides * 3, t * 1.5);
        if (ring < levels && j < sides) {
          const k = ring * (sides + 1) + j; indices.push(k, k + 1, k + sides + 1, k + 1, k + sides + 2, k + sides + 1);
        }
      }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(indices); geo.computeVertexNormals(); return geo;
  }

  private buildTree() {
    const bark = new THREE.MeshStandardMaterial({ color: 0x776951, metalness: .58, roughness: .38 });
    const glow = lightMaterial(GOLD, 1.6);
    const random = seeded(70128);
    const branchEnds: THREE.Vector3[] = [];
    // A braided trunk opens into eight curved boughs; light continues through every branch.
    for (let i = 0; i < 8; i++) {
      const angle = i / 8 * TAU, points: THREE.Vector3[] = [];
      for (let j = 0; j <= 8; j++) {
        const t = j / 8, r = .3 + Math.pow(t, 2.2) * 9;
        const a = angle + Math.sin(t * Math.PI) * .4;
        points.push(new THREE.Vector3(Math.cos(a) * r, -1.3 + t * 18, -27 + Math.sin(a) * r * .7));
      }
      curve(this.tree, points, .23 - i * .01, bark, 50);
      this.life.addVein(this.tree, points.map(p => p.clone().add(new THREE.Vector3(0, 0, .11))), .048, i * .68, 50);
      for (let twig = 0; twig < 4; twig++) {
        const start = points[4 + twig].clone(), a = angle + (twig % 2 ? .5 : -.5);
        const end = new THREE.Vector3(start.x + Math.cos(a) * (3.3 + random() * 3), start.y + 2.8 + random() * 2.5, start.z + Math.sin(a) * 3.2);
        const mid = start.clone().lerp(end, .5).add(new THREE.Vector3(0, 1.6, 0));
        curve(this.tree, [start, mid, end], .09, bark, 22);
        this.life.addVein(this.tree, [start, mid, end], .025, i * .68 + 1.4 + twig * .16, 22);
        branchEnds.push(end);
      }
    }
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .86, metalness: 0 });
    const leaves = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), leafMaterial, 2400);
    const pose = new THREE.Object3D(), tint = new THREE.Color();
    for (let i = 0; i < leaves.count; i++) {
      const end = branchEnds[i % branchEnds.length];
      const a = random() * TAU, b = Math.acos(2 * random() - 1), r = Math.cbrt(random());
      pose.position.set(end.x + Math.cos(a) * Math.sin(b) * r * 3.7, end.y + Math.cos(b) * r * 1.3, end.z + Math.sin(a) * Math.sin(b) * r * 2.5);
      pose.rotation.set(random(), random() * TAU, random());
      pose.scale.set(.3 + random() * .5, .1 + random() * .16, .2 + random() * .3);
      pose.updateMatrix(); leaves.setMatrixAt(i, pose.matrix);
      tint.setHSL(random() > .83 ? .11 : .44, .3 + random() * .3, .08 + random() * .13); leaves.setColorAt(i, tint);
    }
    leaves.name = 'luma-leaves'; this.tree.add(leaves);
    // Hanging lanterns make the canopy read at a distance.
    for (let i = 0; i < 64; i++) {
      const end = branchEnds[i % branchEnds.length], length = .6 + random() * 2.8;
      const x = end.x + (random() - .5) * 2, z = end.z + (random() - .5) * 2;
      put(this.tree, new THREE.CylinderGeometry(.008, .008, length, 3), glow, x, end.y - length / 2, z);
      put(this.tree, new THREE.OctahedronGeometry(.07 + random() * .07), glow, x, end.y - length, z);
    }
    // An open crown surrounds the source of the signal.
    const crown = put(this.tree, new THREE.TorusGeometry(4.4, .065, 8, 128), glow, 0, 9, -27.8); crown.rotation.y = -.12;
    put(this.tree, new THREE.SphereGeometry(.35, 24, 16), lightMaterial(0xffe2a6, 4), 0, 9, -27);
  }

  private buildBridge() {
    const stone = new THREE.MeshStandardMaterial({ color: 0x53737b, metalness: .65, roughness: .34 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xcda96d, metalness: .8, roughness: .3 });
    const light = lightMaterial(GOLD, 1.5);
    const route = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -1.2, -3), new THREE.Vector3(-2, .1, -10), new THREE.Vector3(2, .4, -17), new THREE.Vector3(0, -1.4, -26)]);
    const geos: THREE.BufferGeometry[] = [];
    const points = route.getPoints(64);
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1];
      const g = new THREE.BoxGeometry(2.8, .22, a.distanceTo(b) + .04);
      const pose = new THREE.Object3D(); pose.position.copy(a).lerp(b, .5); pose.lookAt(b); pose.updateMatrix(); g.applyMatrix4(pose.matrix); geos.push(g);
    }
    const merged = mergeGeometries(geos)!; geos.forEach(g => g.dispose()); put(this.architecture, merged, stone);
    for (const side of [-1, 1]) {
      curve(this.architecture, points.map(p => p.clone().add(new THREE.Vector3(side * 1.4, .12, 0))), .05, gold, 80);
      curve(this.architecture, points.map(p => p.clone().add(new THREE.Vector3(side * 1.4, .2, 0))), .015, light, 80);
      for (let i = 4; i < points.length; i += 8) {
        const p = points[i]; put(this.architecture, new THREE.ConeGeometry(.09, .85, 5), gold, p.x + side * 1.4, p.y + .42, p.z);
        put(this.architecture, new THREE.SphereGeometry(.055, 8, 6), light, p.x + side * 1.4, p.y + .9, p.z);
      }
    }
    // Sweeping arches tie distant terraces together.
    for (const side of [-1, 1]) {
      const pts = [new THREE.Vector3(side * 5, -3, -25), new THREE.Vector3(side * 11, 1.2, -31), new THREE.Vector3(side * 19, 1.1, -31)];
      curve(this.architecture, pts, .10, gold, 50);
      curve(this.architecture, pts.map(p => p.clone().add(new THREE.Vector3(0, .12, 0))), .022, light, 50);
    }
  }

  private makeMotes() {
    const random = seeded(6684), positions: number[] = [], seeds: number[] = [];
    for (let i = 0; i < 1100; i++) { positions.push((random() - .5) * 42, -3 + random() * 27, 14 - random() * 60); seeds.push(random()); }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('seed', new THREE.Float32BufferAttribute(seeds, 1));
    const time = { value: 0 }; this.shaderTimes.push(time);
    return new THREE.Points(geometry, new THREE.ShaderMaterial({
      uniforms: { time, gathering: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'uniform float time;attribute float seed;varying float vSeed;void main(){vSeed=seed;vec3 p=position;p.y+=sin(time*.25+seed*30.)*.6;p.x+=sin(time*.18+seed*18.)*.5;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((40.+seed*45.)/-mv.z,1.,5.);}',
      fragmentShader: 'uniform float time,gathering;varying float vSeed;void main(){float a=pow(max(0.,1.-length(gl_PointCoord-.5)*2.),2.);vec3 c=mix(vec3(.4,.85,1.),vec3(1.5,.88,.3),vSeed);gl_FragColor=vec4(c,a*(.2+gathering*.45)*(.6+.4*sin(time*.6+vSeed*40.)));}',
    }));
  }

  sample(time: number, reduceMotion = false, ambientTime = time) {
    const state = sampleEnding(time);
    const elapsed = state.elapsed;
    const t = reduceMotion ? [5, 13, 23, 35][state.stage] : elapsed;
    const clock = reduceMotion ? t : Math.max(0, Number.isFinite(ambientTime) ? ambientTime : t);
    const arrival = smooth(0, 10, t), gather = smooth(9, 21, t), depart = smooth(28, 38, t);
    const portrait = this.camera.aspect < .85;
    // Continuous camera motion avoids cuts and lets the reunion breathe.
    this.camera.position.set(
      Math.sin(t * .055) * 3.5 * (1 - depart) + depart * 6,
      7 - arrival * 1.1 + depart * 6,
      31 - arrival * 5 + depart * 11 + (portrait ? 12 : 0),
    );
    this.target.set(0, 8 - gather * .4 + depart * 3.4 - (portrait ? 1.8 : 0), -12 - depart * 8);
    this.camera.lookAt(this.target);
    const fov = portrait ? 50 : 44;
    if (this.camera.fov !== fov) { this.camera.fov = fov; this.camera.updateProjectionMatrix(); }
    this.camera.updateMatrixWorld();
    this.hero.group.position.set(Math.sin(t * .32) * .10, 3.2 + (1 - arrival) * 3 + depart * 8, 13 - arrival * 10 - depart * 18);
    this.hero.group.scale.setScalar(1.25 * (1 + Math.sin(t * 1.7) * .025));
    this.hero.update(clock, this.camera); this.heroLight.position.copy(this.hero.group.position);
    this.chorusLight.intensity = gather * (1 - depart * .7) * 65;
    this.companions.forEach((light, i) => {
      const visible = smooth(9 + i * .24, 14 + i * .24, t);
      const a = i / this.companions.length * TAU + t * .045;
      const radius = 5.1 - gather * 2 + depart * 1.2;
      const reunion = this.reunion.set(Math.cos(a) * radius, 2.8 + Math.sin(a * 2 + t * .5) * .3 + (i % 3) * .6, 3 + Math.sin(a) * radius * .65);
      const voyage = this.voyage.set(Math.sin(i * 2.3) * (1.3 + i * .12), 11.3 + i * .35, -15 - i * 1.4);
      light.group.position.copy(reunion).lerp(voyage, depart);
      light.group.position.y -= (1 - visible) * 3;
      light.group.scale.setScalar((.6 + (i % 3) * .13) * visible);
      light.group.visible = visible > .001;
      light.update(clock + i * 1.7, this.camera);
    });
    this.shaderTimes.forEach(uniform => { uniform.value = clock; });
    this.life.update(clock, reduceMotion, this.camera);
    this.sky.uniforms.aspect.value = this.camera.aspect;
    this.pool.uniforms.arrival.value = gather;
    (this.motes.material as THREE.ShaderMaterial).uniforms.gathering.value = gather;
    this.pulses.forEach((pulse, i) => {
      const phase = (t - 9 - i * 1.3) / 5;
      pulse.visible = !reduceMotion && phase > 0 && phase < 1;
      pulse.scale.setScalar(1 + Math.max(0, phase) * 5);
      (pulse.material as THREE.MeshBasicMaterial).opacity = Math.max(0, Math.sin(Math.min(1, Math.max(0, phase)) * Math.PI)) * .5;
    });
    return state;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
    this.scene.traverse(object => {
      if (object instanceof THREE.InstancedMesh) object.dispose();
      if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
        geometries.add(object.geometry);
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
      }
    });
    const textures = new Set<THREE.Texture>();
    materials.forEach(material => Object.values(material).forEach(value => { if (value instanceof THREE.Texture) textures.add(value); }));
    textures.forEach(texture => texture.dispose());
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); this.scene.clear();
  }
}
