import * as THREE from 'three';
import { NullLashArt } from '../../obstacles/NullLashArt';
import { TheNullArt } from '../../obstacles/TheNullArt';
import { NullPresenceArt } from '../../environment/NullPresenceArt';
import { createJourneyWorldScene } from '../../environment/JourneyWorldScene';
import { createJourneyChapterArt } from '../../environment/JourneyChapterArt';
import { NULL_NOISE, SculptedNullEncounter, SculptedNullLash } from './NullSculptures';
import { STUDY_LASH, STUDY_NULL, type NullShot } from './NullStudySequence';

function seeded(seed: number) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
function mesh(parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geo, mat); object.position.set(x, y, z); parent.add(object); return object;
}
/** Own every demo resource once, including textures shared by multiple actors. */
export function disposeNullStudy(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  root.traverse(object => {
    if (object instanceof THREE.InstancedMesh) object.dispose();
    if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line) {
      geometries.add(object.geometry); (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
    }
  });
  materials.forEach(m => Object.values(m).forEach(v => { if (v instanceof THREE.Texture) textures.add(v); }));
  textures.forEach(t => t.dispose()); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); root.clear();
}

export class CinematicNullScene {
  readonly scene = new THREE.Scene();
  readonly lash = new SculptedNullLash();
  readonly encounter = new SculptedNullEncounter();
  private readonly clock = { value: 0 };
  private readonly aspect = { value: 1 };
  private readonly eclipseX = { value: -12 };
  private readonly moon = new THREE.Group();
  private readonly rocks: THREE.InstancedMesh;
  private readonly rockPoses: { x: number; y: number; z: number; scale: number; phase: number }[] = [];
  private readonly pose = new THREE.Object3D();
  private disposed = false;

  constructor() {
    this.scene.background = new THREE.Color(0x03040c);
    this.scene.add(this.lash.group, this.encounter.group, this.moon);
    this.scene.add(new THREE.HemisphereLight(0x9195d8, 0x060712, 1));
    const rim = new THREE.DirectionalLight(0x999bfa, 3.5); rim.position.set(-9, 12, -7); this.scene.add(rim);
    const cyan = new THREE.DirectionalLight(0x58a4cb, 1.2); cyan.position.set(8, -2, 4); this.scene.add(cyan);
    this.buildSky(); this.buildEclipse(); this.buildStars();
    const geometry = new THREE.IcosahedronGeometry(1, 2), p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), r = 1 + Math.sin(x * 11 + y * 7) * .13 + Math.cos(z * 17 - x * 6) * .08;
      p.setXYZ(i, x * r, y * r * 1.4, z * r * .64);
    }
    geometry.computeVertexNormals();
    this.rocks = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ color: 0x20202d, roughness: .65, metalness: .34 }), 18);
    this.rocks.name = 'null-orbital-fragments'; this.rocks.frustumCulled = false; this.rocks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const random = seeded(7317);
    for (let i = 0; i < this.rocks.count; i++) this.rockPoses.push({ x: (i % 2 ? -1 : 1) * (5.5 + random() * 18), y: -8 + random() * 26, z: 11 + random() * 36, scale: .3 + random() * 1.5, phase: random() * 7 });
    this.scene.add(this.rocks); this.update(0, 'presence', false, 1);
  }

  private buildSky() {
    const material = new THREE.ShaderMaterial({
      depthWrite: false, depthTest: false, uniforms: { time: this.clock, aspect: this.aspect },
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,.9999,1.);}',
      fragmentShader: `${NULL_NOISE}uniform float time,aspect;varying vec2 vUv;
        void main(){vec2 p=(vUv-.5)*vec2(aspect,1.);float cloud=fbm(vec3(p*2.8+vec2(time*.005,0.),2.));
        float n=fbm(vec3(p*7.+cloud*1.8,4.+time*.018));
        float river=exp(-pow((p.y-p.x*.23-.12+(cloud-.5)*.9)*5.,2.));
        vec3 c=vec3(.004,.006,.017)+vec3(.10,.027,.15)*n*n*river*2.5;
        c+=vec3(.025,.09,.13)*pow(cloud,3.)*exp(-pow((p.y+.16)*3.2,2.));
        float filaments=pow(1.-abs(sin(n*19.+cloud*9.)),16.);c+=vec3(.15,.065,.21)*filaments*river*.28;
        c*=.65+.35*smoothstep(.05,.75,length(p));gl_FragColor=vec4(c,1.);}`,
    });
    const sky = mesh(this.scene, new THREE.PlaneGeometry(2, 2), material); sky.frustumCulled = false; sky.renderOrder = -1000;
  }

  private buildEclipse() {
    this.moon.name = 'light-eating-eclipse'; this.moon.position.set(-12, 12, 54);
    const bodyMaterial = new THREE.ShaderMaterial({
      uniforms: { time: this.clock },
      vertexShader: 'varying vec3 vP,vN,vV;void main(){vP=position;vN=normalMatrix*normal;vec4 p=modelViewMatrix*vec4(position,1.);vV=p.xyz;gl_Position=projectionMatrix*p;}',
      fragmentShader: `${NULL_NOISE}uniform float time;varying vec3 vP,vN,vV;
        void main(){float rim=pow(1.-abs(dot(normalize(vN),normalize(-vV))),3.8);
        float n=fbm(vP*.3);float veins=pow(1.-abs(sin(n*29.)),26.);
        vec3 c=vec3(.006,.004,.014)+vec3(.04,.014,.065)*n;
        c+=vec3(.34,.13,.65)*rim*(.3+n*.8)+vec3(.18,.035,.29)*veins*(.3+.7*rim);
        gl_FragColor=vec4(c,1.);}`,
    });
    mesh(this.moon, new THREE.SphereGeometry(10.3, 80, 56), bodyMaterial);
    const corona = new THREE.ShaderMaterial({
      uniforms: { time: this.clock }, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `${NULL_NOISE}uniform float time;varying vec2 vUv;
        void main(){vec2 p=(vUv-.5)*2.;float r=length(p),a=atan(p.y,p.x);float n=fbm(vec3(p*8.,time*.04));
        float edge=exp(-abs(r-.495)*35.);float halo=exp(-abs(r-.51)*11.);
        float rays=pow(.5+.5*sin(a*23.+n*9.+time*.07),5.);
        vec3 c=mix(vec3(.20,.10,.50),vec3(.55,.4,.9),edge);float alpha=(edge*.8+halo*(.12+rays*.35))*smoothstep(.46,.50,r)*(1.-smoothstep(.75,1.,r));
        gl_FragColor=vec4(c,alpha);}`,
    });
    mesh(this.moon, new THREE.PlaneGeometry(42, 42), corona, 0, 0, 1);
    // Long, sparse fissures arc around the eclipse, silhouetted against the nebula.
    const mat = new THREE.MeshStandardMaterial({ color: 0x171020, metalness: .3, roughness: .7 });
    for (let i = 0; i < 5; i++) {
      const points: THREE.Vector3[] = [];
      for (let j = 0; j <= 30; j++) {
        const u = j / 30, a = i * 1.27 + u * 1.3, r = 10 + u * 10;
        points.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * .7, -1 + Math.sin(u * Math.PI) * 2));
      }
      mesh(this.moon, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 64, .10, 5, false), mat);
    }
  }

  private buildStars() {
    const random = seeded(1132026), positions: number[] = [], colors: number[] = [], phases: number[] = [];
    const palette = [0x7ef0ff, 0xb07cff, 0xff4ad2, 0xffb020, 0x6dffc8];
    for (let i = 0; i < 1500; i++) {
      positions.push((random() - .5) * 130, -30 + random() * 80, 50 + random() * 60);
      const color = new THREE.Color(palette[i % palette.length]); colors.push(color.r, color.g, color.b); phases.push(random());
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); g.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));
    this.scene.add(new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: { time: this.clock }, vertexColors: true, transparent: true, depthWrite: false,
      vertexShader: 'attribute float phase;uniform float time;varying vec3 c;varying float b;void main(){c=color;b=.25+phase*.6;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=1.+phase*2.;}',
      fragmentShader: 'varying vec3 c;varying float b;void main(){float r=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(c,exp(-r*r*7.)*b);}',
    })));
    const seed: number[] = []; for (let i = 0; i < 620; i++) seed.push(random(), random(), random());
    const eaten = new THREE.BufferGeometry(); eaten.setAttribute('position', new THREE.Float32BufferAttribute(seed, 3));
    const material = new THREE.ShaderMaterial({
      uniforms: { time: this.clock, eclipseX: this.eclipseX }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `uniform float time,eclipseX;varying vec3 c;varying float alpha;
        void main(){float life=fract(position.x+time*(.012+position.z*.006));float r=11.+(1.-life)*24.;float a=position.y*6.28318+life*1.8;
        vec3 p=vec3(eclipseX+cos(a)*r,12.+sin(a)*r*.63,53.+position.z*4.);
        c=mix(vec3(.2,.65,1.),vec3(.7,.16,.8),position.y);alpha=sin(life*3.14159)*.7;
        vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((80.+position.z*160.)/-mv.z,1.,6.);}`,
      fragmentShader: 'varying vec3 c;varying float alpha;void main(){float r=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(c,exp(-r*r*6.)*alpha);}',
    });
    const consumed = new THREE.Points(eaten, material); consumed.frustumCulled = false; consumed.name = 'consumed-starlight'; this.scene.add(consumed);
  }

  update(time: number, shot: NullShot, reduced: boolean, aspect: number) {
    const t = reduced ? (shot === 'lash' ? .2 : 2) : time; this.clock.value = t; this.aspect.value = aspect;
    this.lash.group.visible = shot === 'lash'; this.encounter.group.visible = shot === 'encounter';
    const state = this.lash.update(t); this.encounter.update(t);
    this.eclipseX.value = aspect < .85 ? -5 : -12;
    this.moon.position.x = this.eclipseX.value; this.moon.rotation.z = Math.sin(t * .045) * .028;
    this.rockPoses.forEach((p, i) => {
      this.pose.position.set(p.x + Math.sin(t * .08 + p.phase) * .25, p.y + Math.sin(t * .06 + p.phase) * .3, p.z);
      this.pose.rotation.set(p.phase + t * .014, p.phase * .3 + t * .02, p.phase); this.pose.scale.setScalar(p.scale); this.pose.updateMatrix(); this.rocks.setMatrixAt(i, this.pose.matrix);
    });
    this.rocks.instanceMatrix.needsUpdate = true; return state;
  }
  dispose() { if (this.disposed) return; this.disposed = true; disposeNullStudy(this.scene); }
}

/** Production art in a shared review camera, not a screenshot or a substitute renderer. */
export class CurrentNullScene {
  readonly scene = new THREE.Scene();
  private readonly lash = new NullLashArt(STUDY_LASH);
  private readonly encounter = new TheNullArt(STUDY_NULL);
  private readonly presence = new NullPresenceArt();
  private disposed = false;
  constructor() {
    this.scene.background = new THREE.Color(0x12081c); this.scene.fog = new THREE.Fog(0x12081c, 38, 78);
    this.scene.add(new THREE.AmbientLight(0x9a78c8, 1.15));
    const key = new THREE.DirectionalLight(0xd0b0ff, .95); key.position.set(-3, 7, -5); this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xb090e8, .45); fill.position.set(4.2, 3.4, 5); this.scene.add(fill);
    this.lash.group.position.z = STUDY_LASH.z; this.encounter.group.position.z = STUDY_NULL.z;
    this.scene.add(createJourneyWorldScene('the_null', 112), createJourneyChapterArt('the_null'), this.presence.group, this.lash.group, this.encounter.group);
  }
  update(time: number, shot: NullShot, reduced: boolean) {
    const t = reduced ? (shot === 'lash' ? .2 : 2) : time;
    this.lash.group.visible = shot === 'lash'; this.encounter.group.visible = shot === 'encounter';
    this.lash.update(t); this.encounter.update(t); this.presence.update(t, reduced);
  }
  dispose() {
    if (this.disposed) return; this.disposed = true;
    this.lash.dispose(); this.encounter.dispose(); this.presence.dispose(); disposeNullStudy(this.scene);
  }
}
