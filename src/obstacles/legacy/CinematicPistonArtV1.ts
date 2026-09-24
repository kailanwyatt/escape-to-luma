import * as THREE from 'three';
import type { PistonLaneState } from '../PistonFieldState';

/** Archived V1 cinematic piston (pre-curation pass). Restore via PISTON_VISUAL_VARIANT. */
export class CinematicPistonArtV1 {
  readonly group = new THREE.Group();
  private readonly moving = new THREE.Group();
  private readonly materials: THREE.Material[] = [];
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly textures: THREE.Texture[] = [];
  private readonly body: THREE.Mesh;
  private readonly shaft: THREE.Mesh;
  private readonly rails: THREE.Mesh[] = [];
  private readonly sleeves: THREE.Mesh[] = [];
  private readonly lamp: THREE.MeshStandardMaterial;

  constructor() {
    this.group.name = 'cinematic-piston-v1';
    // Local studio reflection map: no global renderer, environment or light changes.
    const pixels = new Uint8Array(128 * 64 * 4);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 128; x++) {
      const u = x / 128, v = y / 64;
      const strip = Math.exp(-Math.pow((u - .20) / .032, 2)) * .85
        + Math.exp(-Math.pow((u - .71) / .055, 2)) * .60;
      const ceiling = Math.exp(-Math.pow((v - .25) / .1, 2)) * .35;
      const value = Math.min(1, .24 + strip + ceiling);
      const warm = Math.exp(-Math.pow((u - .71) / .10, 2));
      const i = (y * 128 + x) * 4;
      pixels[i] = value * (205 + warm * 50); pixels[i + 1] = value * (231 - warm * 38);
      pixels[i + 2] = value * (255 - warm * 127); pixels[i + 3] = 255;
    }
    const env = new THREE.DataTexture(pixels, 128, 64);
    env.mapping = THREE.EquirectangularReflectionMapping;
    env.colorSpace = THREE.SRGBColorSpace; env.needsUpdate = true;
    this.textures.push(env);
    const grain = new Uint8Array(128 * 128 * 4);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const value = 130 + 34 * Math.sin(x * 17.73) + 12 * Math.sin(x * 3.7 + y * .14);
      const i = (y * 128 + x) * 4;
      grain[i] = grain[i + 1] = grain[i + 2] = value; grain[i + 3] = 255;
    }
    const brushed = new THREE.DataTexture(grain, 128, 128);
    brushed.wrapS = brushed.wrapT = THREE.RepeatWrapping;
    brushed.magFilter = brushed.minFilter = THREE.LinearFilter; brushed.needsUpdate = true;
    this.textures.push(brushed);
    const material = (color: number, metalness: number, roughness: number) => {
      const m = new THREE.MeshStandardMaterial({color, metalness, roughness, envMap: env, envMapIntensity: 2.1});
      this.materials.push(m); return m;
    };
    const armor = material(0x596773, .72, .34);
    const recess = material(0x101820, .45, .55);
    const edge = material(0x8b9ba5, .85, .26);
    const steel = material(0xd1dbe0, .85, .23);
    steel.bumpMap = brushed; steel.bumpScale = .0015;
    steel.roughnessMap = brushed;
    this.finish(armor, 'armor');
    this.finish(edge, 'edge');
    this.finish(steel, 'steel');
    this.lamp = material(0xbf6c16, .12, .26);
    this.lamp.emissive.setHex(0xff7a08); this.lamp.emissiveIntensity = .7;
    this.lamp.customProgramCacheKey = () => 'piston-recessed-lens-v1';
    this.lamp.onBeforeCompile = shader => {
      shader.vertexShader = 'varying vec2 pistonLens;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\npistonLens=position.xy;');
      shader.fragmentShader = 'varying vec2 pistonLens;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
        #include <emissivemap_fragment>
        float core=exp(-pow(pistonLens.y/.018,2.))*(1.-smoothstep(.18,.25,abs(pistonLens.x)));
        totalEmissiveRadiance=mix(totalEmissiveRadiance*.35,vec3(1.35,.55,.10),core);
      `);
    };

    this.body = this.box('solid-envelope', 1, 1, .56, recess, this.group, 0, 0, .19, false);
    this.shaft = this.box('brushed-sliding-face', .56, 1, .12, steel, this.group, 0, 0, -.045);
    // A shallow convex steel face catches a continuous reflection gradient instead
    // of reading as another flat bright rectangle. The full envelope remains solid.
    const face = new THREE.CylinderGeometry(.28, .28, 1, 32, 1);
    face.scale(1, 1, .43);
    this.geometries.push(face); this.shaft.geometry = face;
    for (const side of [-1, 1]) {
      this.rails.push(this.box('armored-side', .18, 1, .55, armor, this.group, side * .41, 0, .18));
      this.rails.push(this.box('machined-edge', .022, 1, .04, edge, this.group, side * .297, 0, -.105));
      this.sleeves.push(this.box('telescoping-sleeve', .16, .32, .58, armor, this.group, side * .41, 0, .18));
    }
    this.group.add(this.moving);
    this.box('head-block', 1, .25, .66, armor, this.moving, 0, -.125, .18);
    this.box('head-crown', .94, .045, .58, edge, this.moving, 0, -.027, .18);
    this.box('lamp-pocket', .69, .13, .035, recess, this.moving, 0, -.145, -.16);
    this.box('amber-lens', .50, .062, .024, this.lamp, this.moving, 0, -.145, -.183);
    for (const x of [-.39, .39]) for (const y of [-.06, -.205]) this.bolt(x, y, -.161, this.moving, edge, recess);
    this.box('lower-collar', 1, .23, .67, armor, this.group, 0, .115, .18);
    this.box('lower-edge', .95, .035, .61, edge, this.group, 0, .229, .18);
    for (const x of [-.39, .39]) this.bolt(x, .11, -.166, this.group, edge, recess);
    // Socket flange stays below the collision floor and never narrows a lane gap.
    this.box('floor-socket', 1.12, .10, .85, armor, this.group, 0, -.065, .20);
    this.box('socket-slot', 1.03, .014, .73, recess, this.group, 0, -.012, .20, false);
    // Soft local contact occlusion, below the collision floor. No new solid object
    // and no global shadow-map/render settings (important for native GL cost).
    const shadowGeometry = new THREE.PlaneGeometry(1.55, 1.35);
    const shadowMaterial = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 p; void main(){p=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'varying vec2 p; void main(){float r=length(p);float a=(1.-smoothstep(.35,1.,r))*.55;gl_FragColor=vec4(.008,.012,.019,a);}',
    });
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.name = 'floor-contact-shadow'; shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, -.073, .20); this.group.add(shadow);
    this.geometries.push(shadowGeometry); this.materials.push(shadowMaterial);
  }

  /** Surface detail in mesh space: stays attached to the moving metal, never screen-space. */
  private finish(material: THREE.MeshStandardMaterial, kind: 'armor' | 'edge' | 'steel') {
    material.customProgramCacheKey = () => `piston-finish-v1-${kind}`;
    material.onBeforeCompile = shader => {
      shader.vertexShader = 'varying vec3 pistonSurface; varying vec3 pistonNormal;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\npistonSurface=position; pistonNormal=normal;');
      shader.fragmentShader = `
        varying vec3 pistonSurface;
        varying vec3 pistonNormal;
        float pistonHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
        float pistonNoise(vec3 p){
          vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
          return mix(mix(mix(pistonHash(i),pistonHash(i+vec3(1,0,0)),f.x),mix(pistonHash(i+vec3(0,1,0)),pistonHash(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(pistonHash(i+vec3(0,0,1)),pistonHash(i+vec3(1,0,1)),f.x),mix(pistonHash(i+vec3(0,1,1)),pistonHash(i+vec3(1,1,1)),f.x),f.y),f.z);
        }
      ` + shader.fragmentShader;
      const steel = kind === 'steel';
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
        #include <color_fragment>
        float grain=pistonNoise(pistonSurface*vec3(180.,95.,180.));
        float stain=pistonNoise(pistonSurface*vec3(19.,13.,19.));
        ${steel ? `
          float brush=pistonNoise(pistonSurface*vec3(290.,3.,290.));
          float endOil=smoothstep(.29,.50,abs(pistonSurface.y));
          diffuseColor.rgb*=mix(.72,1.03,brush)*(1.-endOil*.38);
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.08,.83,.58),endOil*.28);
        ` : `
          vec3 nn=abs(normalize(pistonNormal));
          float bevel=1.-smoothstep(.77,.995,max(nn.x,max(nn.y,nn.z)));
          float chip=bevel*smoothstep(.32,.68,stain);
          diffuseColor.rgb*=mix(.64,1.09,stain)*mix(.89,1.06,grain);
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.48,.53,.57),chip*.62);
        `}
      `);
      shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `
        #include <roughnessmap_fragment>
        roughnessFactor=clamp(roughnessFactor+${steel ? '.035+endOil*.19+(1.-brush)*.10' : '(1.-grain)*.16+(1.-stain)*.12'},.13,.85);
      `);
    };
  }

  private box(name: string, w: number, h: number, d: number, material: THREE.Material, parent: THREE.Group, x: number, y: number, z: number, bevel = true): THREE.Mesh {
    let geometry: THREE.BufferGeometry;
    if (bevel) {
      const b = Math.min(.025, w * .13, h * .18, d * .13);
      const shape = new THREE.Shape();
      shape.moveTo(-w / 2 + b, -h / 2 + b);
      shape.lineTo(w / 2 - b, -h / 2 + b);
      shape.lineTo(w / 2 - b, h / 2 - b);
      shape.lineTo(-w / 2 + b, h / 2 - b); shape.closePath();
      geometry = new THREE.ExtrudeGeometry(shape, {depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 1, steps: 1, curveSegments: 1});
      geometry.translate(0, 0, -d / 2 + b);
    } else geometry = new THREE.BoxGeometry(w, h, d);
    this.geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name; mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  }

  private bolt(x: number, y: number, z: number, parent: THREE.Group, metal: THREE.Material, dark: THREE.Material) {
    const geometry = new THREE.CylinderGeometry(.022, .022, .013, 6);
    geometry.rotateX(Math.PI / 2); this.geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, metal); mesh.position.set(x, y, z); parent.add(mesh);
    this.box('bolt-slot', .019, .005, .002, dark, parent, x, y, z - .008, false);
  }

  update(s: PistonLaneState) {
    this.group.position.set(s.x, s.floorY, 0);
    this.group.scale.x = s.width;
    this.body.scale.y = s.height; this.body.position.y = s.height / 2;
    const exposed = Math.max(.02, s.height - .42);
    this.shaft.scale.y = exposed; this.shaft.position.y = .22 + exposed / 2;
    for (const rail of this.rails) { rail.scale.y = Math.max(.02, s.height - .25); rail.position.y = (s.height - .25) / 2; }
    for (const sleeve of this.sleeves) sleeve.position.y = .23 + Math.max(0, s.height - .80) * .35;
    this.moving.position.y = s.height;
    // State changes only the lamp; solid surfaces never fade at a clear threshold.
    this.lamp.emissiveIntensity = s.open ? .35 : .7;
  }

  dispose() {
    this.geometries.forEach(g => g.dispose()); this.materials.forEach(m => m.dispose());
    this.textures.forEach(t => t.dispose()); this.group.clear(); this.group.removeFromParent();
  }
}
