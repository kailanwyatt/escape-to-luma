import * as THREE from 'three';
import type { PistonLaneState } from './PistonFieldState';

/**
 * Cinematic piston (curation pass).
 * Mesh-local PBR + reflection; no scene-wide bloom/shadow maps (mobile-safe).
 * Only consumes the authoritative lane pose from PistonFieldState.
 */
export class CinematicPistonArt {
  readonly group = new THREE.Group();
  private readonly moving = new THREE.Group();
  private readonly materials: THREE.Material[] = [];
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly textures: THREE.Texture[] = [];
  private readonly body: THREE.Mesh;
  private readonly shaft: THREE.Mesh;
  private readonly highlight: THREE.Mesh;
  private readonly rails: THREE.Mesh[] = [];
  private readonly vents: THREE.Mesh[] = [];
  private readonly sleeves: THREE.Mesh[] = [];
  private readonly lamp: THREE.MeshStandardMaterial;
  private readonly lampCore: THREE.MeshStandardMaterial;

  constructor() {
    this.group.name = 'cinematic-piston';
    // Cool key + warm side strips — closer to the lookdev chamber lighting.
    const pixels = new Uint8Array(128 * 64 * 4);
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 128; x++) {
        const u = x / 128;
        const v = y / 64;
        const cool = Math.exp(-Math.pow((u - 0.18) / 0.028, 2)) * 1.05;
        const warm = Math.exp(-Math.pow((u - 0.74) / 0.05, 2)) * 0.78;
        const ceiling = Math.exp(-Math.pow((v - 0.22) / 0.09, 2)) * 0.42;
        const floorBounce = Math.exp(-Math.pow((v - 0.82) / 0.12, 2)) * 0.18;
        const value = Math.min(1, 0.18 + cool + warm + ceiling + floorBounce);
        const warmth = Math.exp(-Math.pow((u - 0.74) / 0.09, 2));
        const i = (y * 128 + x) * 4;
        pixels[i] = value * (190 + warmth * 65);
        pixels[i + 1] = value * (220 - warmth * 45);
        pixels[i + 2] = value * (255 - warmth * 140);
        pixels[i + 3] = 255;
      }
    }
    const env = new THREE.DataTexture(pixels, 128, 64);
    env.mapping = THREE.EquirectangularReflectionMapping;
    env.colorSpace = THREE.SRGBColorSpace;
    env.needsUpdate = true;
    this.textures.push(env);

    const grain = new Uint8Array(128 * 128 * 4);
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const value = 128 + 38 * Math.sin(x * 19.1) + 14 * Math.sin(x * 4.1 + y * 0.17);
        const i = (y * 128 + x) * 4;
        grain[i] = grain[i + 1] = grain[i + 2] = value;
        grain[i + 3] = 255;
      }
    }
    const brushed = new THREE.DataTexture(grain, 128, 128);
    brushed.wrapS = brushed.wrapT = THREE.RepeatWrapping;
    brushed.magFilter = brushed.minFilter = THREE.LinearFilter;
    brushed.needsUpdate = true;
    this.textures.push(brushed);

    const material = (color: number, metalness: number, roughness: number) => {
      const m = new THREE.MeshStandardMaterial({
        color,
        metalness,
        roughness,
        envMap: env,
        envMapIntensity: 2.85,
      });
      this.materials.push(m);
      return m;
    };

    const armor = material(0x4f5e6b, 0.78, 0.32);
    const recess = material(0x0c1218, 0.42, 0.58);
    const edge = material(0x9aabb6, 0.9, 0.22);
    const steel = material(0xd8e2e8, 0.92, 0.18);
    steel.bumpMap = brushed;
    steel.bumpScale = 0.002;
    steel.roughnessMap = brushed;
    this.finish(armor, 'armor');
    this.finish(edge, 'edge');
    this.finish(steel, 'steel');

    this.lamp = material(0xa85810, 0.1, 0.28);
    this.lamp.emissive.setHex(0xff7a08);
    this.lamp.emissiveIntensity = 0.85;
    this.lamp.customProgramCacheKey = () => 'piston-recessed-lens-v2';
    this.lamp.onBeforeCompile = (shader) => {
      shader.vertexShader = 'varying vec2 pistonLens;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\npistonLens=position.xy;',
      );
      shader.fragmentShader = 'varying vec2 pistonLens;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `
        #include <emissivemap_fragment>
        float core=exp(-pow(pistonLens.y/.016,2.))*(1.-smoothstep(.16,.24,abs(pistonLens.x)));
        totalEmissiveRadiance=mix(totalEmissiveRadiance*.28,vec3(1.55,.62,.12),core);
      `,
      );
    };

    this.lampCore = material(0xffc28a, 0.05, 0.2);
    this.lampCore.emissive.setHex(0xffb040);
    this.lampCore.emissiveIntensity = 1.35;

    // Solid envelope matches authoritative lane width × height.
    this.body = this.box('solid-envelope', 1, 1, 0.58, recess, this.group, 0, 0, 0.2, false);
    this.shaft = this.box('brushed-sliding-face', 0.56, 1, 0.12, steel, this.group, 0, 0, -0.05);
    const face = new THREE.CylinderGeometry(0.28, 0.28, 1, 36, 1);
    face.scale(1, 1, 0.46);
    this.geometries.push(face);
    this.shaft.geometry = face;

    // Narrow specular rib — stays inside silhouette, sells the curved face.
    this.highlight = this.box('specular-rib', 0.045, 1, 0.02, edge, this.group, 0, 0, -0.118, false);

    for (const side of [-1, 1]) {
      this.rails.push(this.box('armored-side', 0.17, 1, 0.56, armor, this.group, side * 0.415, 0, 0.185));
      this.rails.push(this.box('machined-edge', 0.02, 1, 0.045, edge, this.group, side * 0.3, 0, -0.11));
      this.sleeves.push(this.box('telescoping-sleeve', 0.15, 0.34, 0.6, armor, this.group, side * 0.415, 0, 0.185));
      // Side vent slots (recessed, inside width) — height posed in update().
      this.vents.push(this.box('vent-slot', 0.04, 1, 0.02, recess, this.group, side * 0.415, 0, -0.1, false));
    }

    this.group.add(this.moving);
    // Head sits fully under the tip (bevel allowance) so decorative metal never enters the clear gap.
    this.box('head-block', 1, 0.24, 0.68, armor, this.moving, 0, -0.145, 0.185);
    this.box('head-crown', 0.92, 0.042, 0.58, edge, this.moving, 0, -0.048, 0.185);
    this.box('lamp-pocket', 0.7, 0.12, 0.038, recess, this.moving, 0, -0.155, -0.165);
    this.box('amber-lens', 0.5, 0.058, 0.024, this.lamp, this.moving, 0, -0.155, -0.188);
    this.box('amber-core', 0.26, 0.024, 0.018, this.lampCore, this.moving, 0, -0.155, -0.2, false);
    for (const x of [-0.39, 0.39]) {
      for (const y of [-0.07, -0.22]) this.bolt(x, y, -0.165, this.moving, edge, recess);
    }

    this.box('lower-collar', 1, 0.24, 0.7, armor, this.group, 0, 0.12, 0.185);
    this.box('lower-edge', 0.95, 0.038, 0.62, edge, this.group, 0, 0.235, 0.185);
    for (const x of [-0.39, 0.39]) this.bolt(x, 0.115, -0.17, this.group, edge, recess);

    this.box('floor-socket', 1.14, 0.11, 0.9, armor, this.group, 0, -0.07, 0.21);
    this.box('socket-slot', 1.04, 0.016, 0.76, recess, this.group, 0, -0.014, 0.21, false);
    this.box('socket-ring', 1.08, 0.02, 0.82, edge, this.group, 0, -0.02, 0.21, false);

    const shadowGeometry = new THREE.PlaneGeometry(1.65, 1.45);
    const shadowMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader:
        'varying vec2 p; void main(){p=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:
        'varying vec2 p; void main(){float r=length(p);float a=(1.-smoothstep(.32,1.,r))*.62;gl_FragColor=vec4(.006,.01,.016,a);}',
    });
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.name = 'floor-contact-shadow';
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, -0.078, 0.21);
    this.group.add(shadow);
    this.geometries.push(shadowGeometry);
    this.materials.push(shadowMaterial);
  }

  private finish(material: THREE.MeshStandardMaterial, kind: 'armor' | 'edge' | 'steel') {
    material.customProgramCacheKey = () => `piston-finish-v2-${kind}`;
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = 'varying vec3 pistonSurface; varying vec3 pistonNormal;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\npistonSurface=position; pistonNormal=normal;',
      );
      shader.fragmentShader =
        `
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
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `
        #include <color_fragment>
        float grain=pistonNoise(pistonSurface*vec3(200.,110.,200.));
        float stain=pistonNoise(pistonSurface*vec3(21.,14.,21.));
        ${
          steel
            ? `
          float brush=pistonNoise(pistonSurface*vec3(320.,2.8,320.));
          float endOil=smoothstep(.27,.48,abs(pistonSurface.y));
          float ridge=pow(.5+.5*sin(pistonSurface.y*55.), 18.);
          diffuseColor.rgb*=mix(.68,1.08,brush)*(1.-endOil*.42);
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.1,.8,.55),endOil*.32);
          diffuseColor.rgb+=vec3(.08,.1,.12)*ridge;
        `
            : `
          vec3 nn=abs(normalize(pistonNormal));
          float bevel=1.-smoothstep(.75,.995,max(nn.x,max(nn.y,nn.z)));
          float chip=bevel*smoothstep(.3,.7,stain);
          diffuseColor.rgb*=mix(.58,1.12,stain)*mix(.86,1.08,grain);
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.42,.48,.52),chip*.7);
        `
        }
      `,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `
        #include <roughnessmap_fragment>
        roughnessFactor=clamp(roughnessFactor+${
          steel ? '.03+endOil*.22+(1.-brush)*.12' : '(1.-grain)*.18+(1.-stain)*.14'
        },.1,.88);
      `,
      );
    };
  }

  private box(
    name: string,
    w: number,
    h: number,
    d: number,
    material: THREE.Material,
    parent: THREE.Group,
    x: number,
    y: number,
    z: number,
    bevel = true,
  ): THREE.Mesh {
    let geometry: THREE.BufferGeometry;
    if (bevel) {
      const b = Math.min(0.025, w * 0.13, h * 0.18, d * 0.13);
      const shape = new THREE.Shape();
      shape.moveTo(-w / 2 + b, -h / 2 + b);
      shape.lineTo(w / 2 - b, -h / 2 + b);
      shape.lineTo(w / 2 - b, h / 2 - b);
      shape.lineTo(-w / 2 + b, h / 2 - b);
      shape.closePath();
      geometry = new THREE.ExtrudeGeometry(shape, {
        depth: d - 2 * b,
        bevelEnabled: true,
        bevelThickness: b,
        bevelSize: b,
        bevelSegments: 2,
        steps: 1,
        curveSegments: 1,
      });
      geometry.translate(0, 0, -d / 2 + b);
    } else {
      geometry = new THREE.BoxGeometry(w, h, d);
    }
    this.geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  private bolt(x: number, y: number, z: number, parent: THREE.Group, metal: THREE.Material, dark: THREE.Material) {
    const geometry = new THREE.CylinderGeometry(0.022, 0.022, 0.013, 6);
    geometry.rotateX(Math.PI / 2);
    this.geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, metal);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    this.box('bolt-slot', 0.019, 0.005, 0.002, dark, parent, x, y, z - 0.008, false);
  }

  update(s: PistonLaneState) {
    this.group.position.set(s.x, s.floorY, 0);
    this.group.scale.x = s.width;
    this.body.scale.y = s.height;
    this.body.position.y = s.height / 2;
    const exposed = Math.max(0.02, s.height - 0.42);
    this.shaft.scale.y = exposed;
    this.shaft.position.y = 0.22 + exposed / 2;
    this.highlight.scale.y = exposed * 0.92;
    this.highlight.position.y = 0.22 + exposed / 2;
    for (const rail of this.rails) {
      rail.scale.y = Math.max(0.02, s.height - 0.25);
      rail.position.y = (s.height - 0.25) / 2;
    }
    for (const sleeve of this.sleeves) sleeve.position.y = 0.23 + Math.max(0, s.height - 0.8) * 0.35;
    const ventH = Math.max(0.08, s.height * 0.42);
    for (const vent of this.vents) {
      vent.scale.y = ventH;
      vent.position.y = 0.18 + ventH / 2;
    }
    this.moving.position.y = s.height;
    this.lamp.emissiveIntensity = s.open ? 0.4 : 0.95;
    this.lampCore.emissiveIntensity = s.open ? 0.55 : 1.45;
  }

  dispose() {
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
    this.group.clear();
    this.group.removeFromParent();
  }
}
