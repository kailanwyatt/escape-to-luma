import * as THREE from 'three';
import { SPARK_CATALOG } from '../../customization/sparks';
import { batchOpeningMeshes } from '../batchOpeningMeshes';

export const ENDING_SPARK_COLORS = SPARK_CATALOG.map(spark => spark.color);
export const TREE_PULSE_PERIOD = 9;
export const TREE_PULSE_TRAVEL = 3;
export function treePulsePosition(time: number, delay: number) {
  const phase = THREE.MathUtils.euclideanModulo(time - delay, TREE_PULSE_PERIOD);
  return phase <= TREE_PULSE_TRAVEL ? phase / TREE_PULSE_TRAVEL : null;
}
function seeded(seed: number) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let n = Math.imul(seed ^ seed >>> 15, 1 | seed); n ^= n + Math.imul(n ^ n >>> 7, 61 | n); return ((n ^ n >>> 14) >>> 0) / 4294967296; };
}
const noise = `
float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=noise(p)*a;p=p*2.03+vec3(5.1,7.2,4.8);a*=.5;}return v;}`;

/** Background life uses batched points/instances and an absolute clock so seeking is deterministic. */
export class EndingWorldLife {
  readonly group = new THREE.Group();
  readonly time = { value: 0 };
  readonly veins = new THREE.ShaderMaterial({
    uniforms: { time: this.time, period: { value: TREE_PULSE_PERIOD }, travel: { value: TREE_PULSE_TRAVEL } },
    vertexShader: 'attribute float pulseOffset;varying vec2 vUv;varying float vOffset;void main(){vUv=uv;vOffset=pulseOffset;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `uniform float time,period,travel;varying vec2 vUv;varying float vOffset;
      void main(){float phase=mod(time-vOffset+period*100.,period);float head=phase/travel;
      float beam=exp(-pow((vUv.x-head)*18.,2.))*step(phase,travel);
      float tail=exp(-pow((vUv.x-head+.10)*7.,2.))*step(phase,travel)*.2;
      vec3 base=vec3(.60,.27,.07);vec3 pulse=mix(vec3(.4,1.7,1.4),vec3(3.5,1.9,.55),vUv.x);
      gl_FragColor=vec4(base+pulse*(beam+tail)*2.,1.);}`,
  });
  private readonly asteroids: THREE.InstancedMesh;
  private readonly asteroidSeeds: { phase: number; period: number; y: number; z: number; size: number; direction: number }[] = [];
  private readonly pose = new THREE.Object3D();
  private readonly planet = new THREE.Group();
  private readonly comets = new THREE.Group();
  private readonly cometOpacity = { value: 0 };

  constructor() {
    this.group.name = 'luma-world-life';
    this.buildPlanet();
    this.buildDistantSparks();
    this.asteroids = this.buildAsteroids();
    this.buildComets();
    this.buildGrove(-19, 1.4, -28, .42, 2.1);
    this.buildGrove(19, 4.4, -43, .52, 4.4);
    this.buildGrove(-28, 7.4, -62, .40, 6.3);
    this.buildGrove(8, 8.4, -81, .48, 1.3);
    batchOpeningMeshes(this.group);
  }

  addVein(parent: THREE.Object3D, points: THREE.Vector3[], radius: number, delay: number, segments = 32) {
    const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, radius, 5, false);
    geometry.setAttribute('pulseOffset', new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count).fill(delay), 1));
    const vein = new THREE.Mesh(geometry, this.veins); vein.name = 'living-tree-vein'; parent.add(vein); return vein;
  }

  private buildPlanet() {
    this.planet.position.set(43, 32, -112);
    this.planet.name = 'planet-of-light';
    const material = new THREE.ShaderMaterial({
      uniforms: { time: this.time },
      vertexShader: 'varying vec3 vP,vN,vV;void main(){vP=position;vN=normalMatrix*normal;vec4 p=modelViewMatrix*vec4(position,1.);vV=p.xyz;gl_Position=projectionMatrix*p;}',
      fragmentShader: `${noise}uniform float time;varying vec3 vP,vN,vV;
        void main(){vec3 n=normalize(vP);float terrain=fbm(vP*.21);float land=smoothstep(.39,.55,terrain);
        float rivers=pow(1.-abs(sin(fbm(vP*.48)*24.)),15.)*land;
        float settlements=pow(noise(vP*4.),16.)*land*10.;
        float rim=pow(1.-max(0.,dot(normalize(vN),normalize(-vV))),3.5);
        float pulse=.8+.2*sin(time*.22+terrain*12.);
        vec3 col=mix(vec3(.008,.055,.09),vec3(.035,.12,.10),land);
        col+=vec3(.05,.7,.58)*rivers*pulse*2.;col+=vec3(2.8,1.2,.25)*settlements;
        col+=vec3(.08,.55,.72)*rim*1.6;
        float cloud=smoothstep(.49,.65,fbm(vP*.32+vec3(time*.01,3.,0.)));col+=vec3(.08,.16,.2)*cloud;
        gl_FragColor=vec4(col,1.);}`,
    });
    const globe = new THREE.Mesh(new THREE.SphereGeometry(20, 80, 56), material); globe.rotation.z = -.22;
    // Keep rotating actors out of the static geometry batch.
    globe.userData.animated = true; this.planet.add(globe);
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(20.65, 64, 40), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec3 vN,vV;void main(){vN=normalMatrix*normal;vec4 p=modelViewMatrix*vec4(position,1.);vV=p.xyz;gl_Position=projectionMatrix*p;}',
      fragmentShader: 'varying vec3 vN,vV;void main(){float rim=pow(1.-abs(dot(normalize(vN),normalize(-vV))),3.);gl_FragColor=vec4(.12,.65,.85,rim*.5);}',
    })); this.planet.add(atmosphere);
    const orbitMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x80dccc).multiplyScalar(1.4), transparent: true, opacity: .25, depthWrite: false, blending: THREE.AdditiveBlending });
    for (let i = 0; i < 3; i++) {
      const orbit = new THREE.Mesh(new THREE.TorusGeometry(24 + i * .45, .04 + i * .015, 4, 160), orbitMat);
      orbit.rotation.set(1.15, .25, -.36); this.planet.add(orbit);
    }
    this.group.add(this.planet);
  }

  private buildDistantSparks() {
    const random = seeded(19412), positions: number[] = [], colors: number[] = [], sizes: number[] = [], seeds: number[] = [];
    for (let i = 0; i < 1800; i++) {
      const lane = i % 5, depth = 30 + random() * 125;
      const spread = lane === 0 ? 35 : 95;
      const x = (random() - .5) * spread;
      const y = (lane === 0 ? 3 : 9) + Math.sin(x * .055 + lane * 1.7) * 7 + random() * 10;
      positions.push(x, y, -depth);
      const tint = new THREE.Color(ENDING_SPARK_COLORS[i % ENDING_SPARK_COLORS.length]);
      colors.push(tint.r, tint.g, tint.b); sizes.push(i % 11 === 0 ? 4 : 1 + random() * 1.4); seeds.push(random());
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1)); geo.setAttribute('seed', new THREE.Float32BufferAttribute(seeds, 1));
    const points = new THREE.Points(geo, new THREE.ShaderMaterial({
      uniforms: { time: this.time }, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'uniform float time;attribute float size,seed;varying vec3 vColor;varying float vSeed;void main(){vColor=color;vSeed=seed;vec3 p=position;p.x+=sin(time*.07+seed*30.)*3.;p.y+=sin(time*.18+seed*40.)*.8;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(size*210./-mv.z,1.2,13.);}',
      fragmentShader: 'uniform float time;varying vec3 vColor;varying float vSeed;void main(){float r=length(gl_PointCoord-.5)*2.;float core=exp(-r*r*28.);float halo=exp(-r*r*5.)*(1.-smoothstep(.7,1.,r));float pulse=.7+.3*sin(time*.45+vSeed*50.);gl_FragColor=vec4(vColor*(.9+core*1.6),(core+halo*.38)*pulse);}',
    }));
    points.name = 'distant-colored-sparks'; this.group.add(points);
  }

  private buildAsteroids() {
    const random = seeded(4901), geometry = new THREE.IcosahedronGeometry(1, 3), pos = geometry.attributes.position;
    const colors: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const r = 1 + Math.sin(x * 14 + y * 8) * .08 + Math.cos(y * 19 + z * 7) * .055 + Math.sin(z * 27 - x * 11) * .025;
      pos.setXYZ(i, x * r, y * r * .72, z * r * .87);
      const shade = .6 + .2 * Math.sin(x * 24 + y * 17 + z * 13); colors.push(shade * .73, shade * .86, shade);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geometry.computeVertexNormals();
    const rocks = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ color: 0xa5b5bd, vertexColors: true, roughness: .94, metalness: .12 }), 11);
    rocks.name = 'passing-asteroids'; rocks.instanceMatrix.setUsage(THREE.DynamicDrawUsage); rocks.frustumCulled = false;
    for (let i = 0; i < rocks.count; i++) {
      this.asteroidSeeds.push({ phase: random(), period: 25 + random() * 21, y: 11 + random() * 18, z: i < 2 ? 3 - i * 21 : -38 - random() * 65, size: i < 2 ? 1.2 : .9 + random() * 1.4, direction: i % 3 === 0 ? -1 : 1 });
    }
    this.group.add(rocks); return rocks;
  }

  private buildComets() {
    const material = new THREE.ShaderMaterial({
      uniforms: { opacity: this.cometOpacity },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform float opacity;varying vec2 vUv;void main(){float glow=pow(1.-vUv.x,2.)*pow(max(0.,1.-abs(vUv.y-.5)*2.),1.4);gl_FragColor=vec4(.8,1.4,1.7,glow*.7*opacity);}',
    });
    for (let i = 0; i < 4; i++) {
      const streak = new THREE.Mesh(new THREE.PlaneGeometry(7 - i, .10), material); streak.position.set(i * 1.8, i * .45, -i * .8); this.comets.add(streak);
    }
    this.comets.name = 'shooting-star-formation'; this.comets.rotation.z = .26; this.group.add(this.comets);
  }

  private buildGrove(x: number, y: number, z: number, scale: number, delay: number) {
    const root = new THREE.Group(); root.position.set(x, y, z); root.scale.setScalar(scale); this.group.add(root);
    const bark = new THREE.MeshStandardMaterial({ color: 0x4e726a, roughness: .7, metalness: .2 });
    const random = seeded(Math.floor(delay * 1000));
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos(a) * .8, 4, Math.sin(a) * .8), new THREE.Vector3(Math.cos(a) * 4.2, 8 + i % 2, Math.sin(a) * 3)];
      root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, .13, 5, false), bark));
      this.addVein(root, points.map(p => p.clone().add(new THREE.Vector3(0, 0, .1))), .035, delay + i * .48, 24);
    }
    const leaves = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0x225847, emissive: 0x18483d, emissiveIntensity: .25, roughness: .8, metalness: .05 }), 480);
    const pose = new THREE.Object3D();
    for (let i = 0; i < leaves.count; i++) {
      const a = random() * Math.PI * 2, r = Math.sqrt(random()) * 5.2;
      pose.position.set(Math.cos(a) * r, 7.5 + random() * 2, Math.sin(a) * r * .8); pose.rotation.set(random(), a, random());
      pose.scale.set(.5 + random() * .4, .17, .35 + random() * .3); pose.updateMatrix(); leaves.setMatrixAt(i, pose.matrix);
    }
    root.add(leaves);
    // Luminous fruit hangs below each canopy, away from the hero's silhouette.
    const fruits = new THREE.InstancedMesh(new THREE.SphereGeometry(.09, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(delay > 4 ? 0x85edce : 0xffc772).multiplyScalar(2) }), 40);
    for (let i = 0; i < fruits.count; i++) {
      const a = random() * Math.PI * 2, r = 1 + random() * 3.5; pose.position.set(Math.cos(a) * r, 5.2 + random() * 2.3, Math.sin(a) * r * .8); pose.scale.setScalar(1); pose.updateMatrix(); fruits.setMatrixAt(i, pose.matrix);
    }
    root.add(fruits);
  }

  update(time: number, reduceMotion: boolean, camera: THREE.PerspectiveCamera) {
    this.time.value = time;
    // Keep the illuminated limb in the portrait composition as the camera pulls back.
    this.planet.position.x = THREE.MathUtils.lerp(28, 43, THREE.MathUtils.smoothstep(camera.aspect, .55, 1.1));
    this.planet.rotation.y = Math.sin(time * .012) * .10;
    this.asteroidSeeds.forEach((seed, i) => {
      const phase = THREE.MathUtils.euclideanModulo(time / seed.period + seed.phase, 1);
      const span = Math.max(45, (camera.position.z - seed.z) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect + 24);
      this.pose.position.set(camera.position.x + (phase * 2 - 1) * span * seed.direction, seed.y + Math.sin(phase * Math.PI) * 2, seed.z);
      this.pose.rotation.set(time * (.025 + i * .002), time * .04 + i, time * .015);
      this.pose.scale.setScalar(seed.size); this.pose.updateMatrix(); this.asteroids.setMatrixAt(i, this.pose.matrix);
    });
    this.asteroids.instanceMatrix.needsUpdate = true;
    const cometTime = THREE.MathUtils.euclideanModulo(time - 5, 17);
    this.comets.visible = !reduceMotion && cometTime < 2.6;
    this.cometOpacity.value = THREE.MathUtils.smoothstep(cometTime, 0, .25) * (1 - THREE.MathUtils.smoothstep(cometTime, 2.1, 2.6));
    this.comets.position.set(55 - cometTime * 38, 37 - cometTime * 9, -75);
  }
}
