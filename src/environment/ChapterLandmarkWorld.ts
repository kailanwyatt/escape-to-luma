import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { NULL_NOISE } from '../graphics/NullShaders';
import { SPARK_CATALOG } from '../customization/sparks';

export type LandmarkWorld = 'ancient_network' | 'the_machine' | 'the_signal' | 'homeward' | 'luma';
export const LANDMARK_WORLDS: readonly string[] = ['ancient_network', 'the_machine', 'the_signal', 'homeward', 'luma'];

/** One merged draw per material, retaining tube UVs for traveling light. */
class SculptureBatch {
  private parts = new Map<THREE.Material, THREE.BufferGeometry[]>();
  private pose = new THREE.Object3D();
  constructor(private parent: THREE.Group) {}
  put(g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, sx = 1, sy = sx, sz = sx, rz = 0) {
    this.pose.position.set(x, y, z); this.pose.rotation.set(0, 0, rz); this.pose.scale.set(sx, sy, sz); this.pose.updateMatrix();
    const copy = (g.index ? g.toNonIndexed() : g.clone()).applyMatrix4(this.pose.matrix);
    const list = this.parts.get(m) ?? []; list.push(copy); this.parts.set(m, list);
  }
  finish() {
    for (const [material, parts] of this.parts) {
      const geometry = mergeGeometries(parts, false); parts.forEach(p => p.dispose());
      if (geometry) this.parent.add(new THREE.Mesh(geometry, material));
    }
    this.parts.clear();
  }
}

/** Chapter silhouettes live behind the target; foreground trees remain outboard. */
export function createChapterLandmarkWorld(world: LandmarkWorld, level: number): THREE.Group {
  const root = new THREE.Group(); root.name = `world-${world}`; root.userData.decorativeOnly = true;
  const living = world === 'homeward' || world === 'luma';
  const clock = { value: 0 }, progress = THREE.MathUtils.clamp((level - 140) / 10, .05, 1);
  const tint = new THREE.Color(living ? 0x326d6a : world === 'the_machine' ? 0x795330 : world === 'the_signal' ? 0x24556d : 0x343755);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false, uniforms: { time: clock, tint: { value: tint } },
    vertexShader: 'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,.9999,1.);}',
    fragmentShader: `${NULL_NOISE}uniform float time;uniform vec3 tint;varying vec2 v;
      void main(){float n=fbm(vec3(v*3.2+vec2(time*.003,0.),8.));float band=exp(-pow((v.y-.62+sin(v.x*4.)*.12)*4.,2.));
      vec3 c=vec3(.003,.008,.016)+tint*(.08+n*n*.55)*band;
      c+=tint*pow(1.-abs(sin(n*15.)),22.)*.035;gl_FragColor=vec4(c,1.);}`,
  })); sky.frustumCulled = false; sky.renderOrder = -1000; root.add(sky);
  const stone = new THREE.MeshStandardMaterial({ color: living ? 0x183c39 : 0x26333b, roughness: .75, metalness: .28, fog: false });
  const alloy = new THREE.MeshStandardMaterial({ color: living ? 0x3c786d : world === 'the_machine' ? 0x8a6645 : 0x647c86, roughness: .4, metalness: .65, fog: false });
  const glow = new THREE.MeshBasicMaterial({ color: living ? 0x7de7cb : world === 'the_machine' ? 0xd59454 : 0x6fc3dc, fog: false });
  const batch = new SculptureBatch(root), cube = new THREE.BoxGeometry(1, 1, 1);
  const box = (m: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, a = 0) => batch.put(cube, m, x, y, z, w, h, d, a);
  const rotors: THREE.Group[] = [];

  if (world === 'ancient_network') {
    root.userData.landmark = 'broken-transit-aqueduct';
    // Vast broken transit bridges give this chapter a horizontal silhouette.
    for (let row = 0; row < 3; row++) for (let i = -3; i <= 3; i++) {
      const x = i * 9 + row * 2, z = 36 + row * 13, y = 7 + row * 3;
      box(stone, x, y - 5, z, 1.8, 14, 2.1); box(alloy, x, y + 2, z, 3.6, .5, 2.5);
      const arch = new THREE.TorusGeometry(4.4, .5, 8, 32, Math.PI);
      batch.put(arch, stone, x + 4.5, y, z); arch.dispose();
      if ((i + row) % 3 !== 0) box(alloy, x + 4.5, y + 4.8, z, 8.5, .55, 2.3);
      for (let rune = 0; rune < 5; rune++) box(glow, x, y - 2 + rune * .65, z - 1.08, .16 + rune % 2 * .3, .08, .04);
      box(glow, x + 4.5, y + 5.12, z - .3, 7.8, .035, .08);
    }
  } else if (world === 'the_machine') {
    root.userData.landmark = 'colossal-counterrotating-engine';
    // A suspended vertical engine with counter-rotating turbine crowns.
    for (const side of [-1, 1]) {
      box(stone, side * 13, 5, 43, 4, 30, 5);
      for (let i = 0; i < 12; i++) { box(alloy, side * 13, -7 + i * 2.3, 40, 4.8, .35, 1.2); box(glow, side * 10.8, -7 + i * 2.3, 39.8, .12, 1.3, .08); }
    }
    for (let k = 0; k < 3; k++) {
      const rotor = new THREE.Group(); rotor.name = `engine-crown-${k}`; rotor.position.set(0, 14, 47 + k * 5); root.add(rotor); rotors.push(rotor);
      const blades = new SculptureBatch(rotor), r = 7.5 + k * 1.25;
      const ring = new THREE.TorusGeometry(r, .5, 10, 64); blades.put(ring, alloy, 0, 0, 0); ring.dispose();
      for (let j = 0; j < 18; j++) { const a = j * Math.PI / 9; blades.put(cube, stone, Math.cos(a) * r, Math.sin(a) * r, -.4, .7, 3.2, 1.5, a + .45); blades.put(cube, glow, Math.cos(a) * (r + 1.1), Math.sin(a) * (r + 1.1), -1.2, .15, .7, .06, a); }
      blades.finish();
    }
    box(alloy, 0, 14, 56, 3, 26, 4); box(glow, 0, 14, 53.9, .13, 21, .05);
  } else if (world === 'the_signal') {
    root.userData.landmark = 'phased-transmission-array';
    // Open fan of dishes, with a broad traveling wave above the route.
    for (let i = -3; i <= 3; i++) {
      const x = i * 7, y = 9 + Math.abs(i) * 1.5, z = 42 + Math.abs(i) * 4;
      box(stone, x, y - 8, z, .8, 18, 1.1);
      const dish = new THREE.TorusGeometry(3.1, .22, 8, 48, Math.PI * 1.4);
      batch.put(dish, alloy, x, y, z, 1, .7, 1, -.2); dish.dispose();
      for (let spoke = 0; spoke < 5; spoke++) { const a = -.5 + spoke * .45; box(alloy, x + Math.sin(a) * 1.3, y + Math.cos(a) * 1.3, z, .07, 2.6, .09, -a); }
      box(glow, x, y + .8, z - .4, .16, 2, .16);
    }
    const wave = new THREE.Mesh(new THREE.PlaneGeometry(60, 24), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      uniforms: { time: clock }, vertexShader: 'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform float time;varying vec2 v;void main(){vec2 p=(v-.5)*vec2(2.5,1.);float r=length(p);float wave=pow(.5+.5*sin(r*33.-time*1.5),32.);float fade=sin(v.x*3.14159)*sin(v.y*3.14159);gl_FragColor=vec4(.16,.65,.85,wave*fade*.24);}',
    })); wave.name = 'transmitted-light-waves'; wave.position.set(0, 22, 57); root.add(wave);
  } else {
    root.userData.landmark = world === 'luma' ? 'luminous-reunion-grove' : 'approaching-living-world';
    const vein = new THREE.ShaderMaterial({
      uniforms: { time: clock },
      vertexShader: 'attribute float delay;varying vec2 v;varying float d;void main(){v=uv;d=delay;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform float time;varying vec2 v;varying float d;void main(){float cycle=mod(time+d,9.);float pulse=exp(-pow((v.x-cycle/3.)*18.,2.))*step(cycle,3.5);gl_FragColor=vec4(vec3(.05,.4,.32)+vec3(.5,1.5,1.2)*pulse,1.);}',
    });
    const veinParts: THREE.BufferGeometry[] = [];
    const leafGeo = new THREE.SphereGeometry(1, 8, 6), leafPoses: THREE.Matrix4[] = [], pose = new THREE.Object3D();
    const count = world === 'luma' ? 10 : 6;
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? -1 : 1, x = side * (6.5 + Math.floor(i / 2) * 1.7), z = 22 + Math.floor(i / 2) * 8;
      const height = 6 + (i % 3) * 1.3;
      for (let limb = 0; limb < 3; limb++) {
        const points = [new THREE.Vector3(x, -2, z), new THREE.Vector3(x - side * .7, height * .3, z + .4), new THREE.Vector3(x + side * (limb - .5), height * .75, z), new THREE.Vector3(x + side * (limb + .5), height, z - 1)];
        const curve = new THREE.CatmullRomCurve3(points), bark = new THREE.TubeGeometry(curve, 28, .19 - limb * .025, 7, false);
        batch.put(bark, stone, 0, 0, 0); bark.dispose();
        const lightCurve = new THREE.CatmullRomCurve3(points.map(p => p.clone().add(new THREE.Vector3(0, 0, -.17))));
        const g = new THREE.TubeGeometry(lightCurve, 28, .035, 5, false).toNonIndexed();
        g.setAttribute('delay', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(i * .77 + limb * .41), 1)); veinParts.push(g);
        const end = points[3];
        for (let j = 0; j < 7; j++) {
          pose.position.set(end.x + Math.sin(j * 2.4) * 1.1, end.y - j * .17, end.z + Math.cos(j * 2.4) * .75);
          pose.rotation.set(.2, j, side * (.4 + j * .13)); pose.scale.set(.22, .85, .12); pose.updateMatrix(); leafPoses.push(pose.matrix.clone());
        }
      }
      box(alloy, x, -2.8, z, 3.3, .65, 3.2, side * .1);
    }
    const veinGeo = mergeGeometries(veinParts, false)!; veinParts.forEach(g => g.dispose());
    const veins = new THREE.Mesh(veinGeo, vein); veins.name = 'staggered-tree-veins'; root.add(veins);
    const leaves = new THREE.InstancedMesh(leafGeo, alloy, leafPoses.length); leafPoses.forEach((m, i) => leaves.setMatrixAt(i, m)); root.add(leaves);
    const planet = new THREE.Mesh(new THREE.SphereGeometry(8, 48, 32), new THREE.ShaderMaterial({
      uniforms: { time: clock },
      vertexShader: 'varying vec3 p,n,v;void main(){p=position;n=normalMatrix*normal;vec4 q=modelViewMatrix*vec4(position,1.);v=-q.xyz;gl_Position=projectionMatrix*q;}',
      fragmentShader: `${NULL_NOISE}uniform float time;varying vec3 p,n,v;void main(){float f=fbm(p*.48);float veins=pow(1.-abs(sin(f*27.)),24.);float rim=pow(1.-abs(dot(normalize(n),normalize(v))),3.);vec3 c=mix(vec3(.008,.038,.05),vec3(.06,.22,.18),f);c+=vec3(.15,.8,.55)*veins*(.35+.15*sin(time*.3))+vec3(.14,.6,.65)*rim;gl_FragColor=vec4(c,1.);}`,
    })); planet.name = 'revealed-planet-of-light'; planet.position.set(-7 + progress * 3, 17 - progress * 2, 65); planet.scale.setScalar(.65 + progress * .5); root.add(planet);
  }
  batch.finish(); cube.dispose();
  if (living) glow.dispose();
  // Colored Sparks use the game's own palette and stay well beyond the flight plane.
  const p: number[] = [], colors: number[] = [], seeds: number[] = [];
  for (let i = 0; i < (living ? 480 : 240); i++) {
    p.push(Math.sin(i * 12.73) * 42, 4 + (i * 7.13 % 30), 48 + i % 24); seeds.push(i * 1.618);
    const c = new THREE.Color(living ? SPARK_CATALOG[i % SPARK_CATALOG.length].color : 0x8daccb); colors.push(c.r, c.g, c.b);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geo.setAttribute('seed', new THREE.Float32BufferAttribute(seeds, 1));
  const stars = new THREE.Points(geo, new THREE.ShaderMaterial({
    vertexColors: true, transparent: true, depthWrite: false, uniforms: { time: clock },
    vertexShader: 'attribute float seed;uniform float time;varying vec3 c;void main(){c=color;vec3 p=position;p.x+=sin(time*.08+seed)*.4;p.y+=cos(time*.1+seed)*.3;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=1.5+mod(seed,2.);}',
    fragmentShader: 'varying vec3 c;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(c,exp(-d*d*25.)*.65);}',
  })); stars.name = living ? 'distant-colored-sparks' : 'landmark-stars'; root.add(stars);
  root.userData.updateAtmosphere = (time: number, reduced: boolean) => { clock.value = reduced ? 0 : time; rotors.forEach((r, i) => r.rotation.z = (reduced ? 0 : time) * (i % 2 ? -.035 : .025) + i * .7); };
  root.userData.updateAtmosphere(0, true);
  return root;
}
