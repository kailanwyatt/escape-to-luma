import * as THREE from 'three';

type KitOptions = { cinematic?: boolean };

/** Owned, reusable hard-surface resources; independent of gameplay and global lighting. */
export class FacilityArtKit {
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];
  private readonly environment: THREE.DataTexture;
  private readonly cinematic: boolean;

  constructor(opts: KitOptions = {}) {
    this.cinematic = !!opts.cinematic;
    const data = new Uint8Array(128 * 64 * 4);
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 128; x++) {
        const u = x / 128;
        const v = y / 64;
        const cool = Math.exp(-Math.pow((u - 0.18) / (this.cinematic ? 0.032 : 0.05), 2));
        const warm = Math.exp(-Math.pow((u - 0.74) / (this.cinematic ? 0.055 : 0.09), 2));
        const ceiling = Math.exp(-Math.pow((v - 0.22) / 0.11, 2)) * (this.cinematic ? 0.4 : 0.28);
        const floor = this.cinematic ? Math.exp(-Math.pow((v - 0.82) / 0.12, 2)) * 0.16 : 0;
        const i = (y * 128 + x) * 4;
        data[i] = Math.min(255, 48 + cool * 165 + warm * 210 + ceiling * 180 + floor * 120);
        data[i + 1] = Math.min(255, 58 + cool * 190 + warm * 120 + ceiling * 200 + floor * 90);
        data[i + 2] = Math.min(255, 68 + cool * 200 + warm * 45 + ceiling * 220 + floor * 140);
        data[i + 3] = 255;
      }
    }
    this.environment = new THREE.DataTexture(data, 128, 64);
    this.environment.mapping = THREE.EquirectangularReflectionMapping;
    this.environment.colorSpace = THREE.SRGBColorSpace;
    this.environment.needsUpdate = true;
  }

  metal(color: number, roughness = 0.4, wear = true) {
    const m = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness: this.cinematic ? 0.82 : 0.72,
      envMap: this.environment,
      envMapIntensity: this.cinematic ? 2.7 : 1.6,
    });
    this.materials.push(m);
    if (wear) {
      const key = this.cinematic ? 'facility-metal-v2' : 'facility-metal-v1';
      m.customProgramCacheKey = () => key;
      m.onBeforeCompile = (shader) => {
        shader.vertexShader = 'varying vec3 facilityP; varying vec3 facilityN;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nfacilityP=position;facilityN=normal;',
        );
        shader.fragmentShader =
          `varying vec3 facilityP; varying vec3 facilityN;
          float fh(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
          float fn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
            return mix(mix(mix(fh(i),fh(i+vec3(1,0,0)),f.x),mix(fh(i+vec3(0,1,0)),fh(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(fh(i+vec3(0,0,1)),fh(i+vec3(1,0,1)),f.x),mix(fh(i+vec3(0,1,1)),fh(i+vec3(1,1,1)),f.x),f.y),f.z);}
        ` + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <color_fragment>',
          `
          #include <color_fragment>
          float patina=fn(facilityP*${this.cinematic ? '16.' : '13.'});float grain=fn(facilityP*${this.cinematic ? '130.' : '105.'});
          vec3 nn=abs(normalize(facilityN));float bevel=1.-smoothstep(.78,.995,max(nn.x,max(nn.y,nn.z)));
          diffuseColor.rgb*=mix(.68,1.1,patina)*mix(.9,1.05,grain);
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.4,.46,.5),bevel*smoothstep(.35,.72,patina)*.${this.cinematic ? '55' : '45'});
        `,
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <roughnessmap_fragment>',
          `
          #include <roughnessmap_fragment>
          roughnessFactor=clamp(roughnessFactor+(1.-patina)*.${this.cinematic ? '18' : '15'},.14,.88);
        `,
        );
      };
    }
    return m;
  }

  lamp() {
    const m = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffb449,
      emissiveIntensity: this.cinematic ? 0.95 : 0.8,
      roughness: 0.25,
      metalness: 0.08,
    });
    this.materials.push(m);
    m.customProgramCacheKey = () => (this.cinematic ? 'facility-lens-v2' : 'facility-lens-v1');
    m.onBeforeCompile = (shader) => {
      shader.vertexShader = 'varying vec2 lensUV;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nlensUV=uv;',
      );
      shader.fragmentShader = 'varying vec2 lensUV;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `
        #include <emissivemap_fragment>
        float core=pow(sin(clamp(lensUV.y,0.,1.)*3.14159), ${this.cinematic ? '1.35' : '1.'});
        totalEmissiveRadiance*=.35+1.1*core;
      `,
      );
    };
    return m;
  }

  /** Brighter inner filament for cinematic status bars. */
  lampCore() {
    const m = new THREE.MeshStandardMaterial({
      color: 0xffe0b0,
      emissive: 0xffb449,
      emissiveIntensity: 1.4,
      roughness: 0.18,
      metalness: 0.05,
    });
    this.materials.push(m);
    return m;
  }

  box(
    parent: THREE.Group,
    name: string,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
    bevel = 0.035,
  ) {
    let geometry: THREE.BufferGeometry;
    const b = Math.min(bevel, w * 0.12, h * 0.12, d * 0.15);
    if (b > 0) {
      const s = new THREE.Shape();
      s.moveTo(-w / 2 + b, -h / 2 + b);
      s.lineTo(w / 2 - b, -h / 2 + b);
      s.lineTo(w / 2 - b, h / 2 - b);
      s.lineTo(-w / 2 + b, h / 2 - b);
      s.closePath();
      geometry = new THREE.ExtrudeGeometry(s, {
        depth: d - 2 * b,
        bevelEnabled: true,
        bevelThickness: b,
        bevelSize: b,
        bevelSegments: this.cinematic ? 2 : 1,
        steps: 1,
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

  dispose() {
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.environment.dispose();
    this.geometries = [];
    this.materials = [];
  }
}
