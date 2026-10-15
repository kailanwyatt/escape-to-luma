import * as THREE from 'three';

const PALETTES = [
  { stone: 0x8b929f, mineral: 0xc3c7d1, specular: 0x343b49, shine: 8 },
  { stone: 0xae9175, mineral: 0xd6b994, specular: 0x685548, shine: 19 },
  { stone: 0xb7b1a3, mineral: 0xe0dccc, specular: 0x49473f, shine: 5 },
  { stone: 0x8cabb9, mineral: 0xc9e5e9, specular: 0x668494, shine: 28 },
];

/** Fractional obstacle seeds matter: adjacent rocks must not share the same surface. */
export function createAsteroidSurface(seed: number) {
  let state = Math.round(seed * 104729) >>> 0;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  const family = Math.floor(random() * PALETTES.length);
  const palette = PALETTES[family];
  const stone = new THREE.Color(palette.stone), mineral = new THREE.Color(palette.mineral);
  const phase = random() * Math.PI * 2;
  const shape = Math.floor(random() * 4);
  const axis = new THREE.Vector3(random() - .5, random() - .5, random() - .5).normalize();
  const cut = new THREE.Vector3(random() - .5, random() - .5, random() - .5).normalize();
  const craters = Array.from({ length: 9 }, (_, i) => {
    // Two large impacts face the gameplay camera; smaller impacts wrap around the rock.
    const center = i < 2
      ? new THREE.Vector3((random() - .5) * .9, (random() - .5) * .8, i ? 1 : -1).normalize()
      : new THREE.Vector3().setFromSphericalCoords(1, Math.acos(random() * 2 - 1), random() * Math.PI * 2);
    return { center, width: i < 2 ? .42 + random() * .12 : .17 + random() * .18, depth: i < 2 ? .22 + random() * .09 : .07 + random() * .12 };
  });
  const color = new THREE.Color();
  // Reused result: surface baking needs no per-vertex objects or runtime textures.
  const result = { relief: 0, broad: 0, color };
  return {
    family, shape, phase, palette,
    sample(x: number, y: number, z: number) {
      const broad = Math.sin(x * 3.4 + phase) * Math.cos(y * 3.1 - phase) * Math.sin(z * 3.7 + 1.2);
      const ridge = Math.sin(x * 9.1 + y * 4.3 + phase) * Math.cos(z * 8.3 - y * 5.2);
      const strata = Math.sin((x * axis.x + y * axis.y + z * axis.z) * 21 + broad * 2.7 + phase);
      const fault = Math.abs(x * cut.x + y * cut.y + z * cut.z + .18 + ridge * .025);
      const crack = Math.exp(-fault * 65);
      let relief = broad * .13 + ridge * .035 - crack * .075, cavity = 0, rim = 0;
      for (const crater of craters) {
        const d = Math.hypot(x - crater.center.x, y - crater.center.y, z - crater.center.z) / crater.width;
        if (d >= 1.4) continue;
        const bowl = Math.pow(Math.max(0, 1 - d * d), 1.5);
        const lip = Math.exp(-(((d - .96) / .13) ** 2));
        relief += crater.depth * (-bowl + lip * .32 + Math.exp(-d * d * 55) * .16);
        cavity += bowl; rim += lip;
      }
      const vein = Math.pow(Math.max(0, strata), 18) * (.24 + Math.max(0, ridge) * .55);
      color.copy(stone).lerp(mineral, vein).multiplyScalar(THREE.MathUtils.clamp(.89 + broad * .18 + ridge * .13 - cavity * .43 - crack * .32 + rim * .18, .29, 1.2));
      result.relief = relief; result.broad = broad;
      return result;
    },
  };
}

/** Smooth UV seams/poles after sculpting; only shared positions exchange normals. */
export function finishAsteroidGeometry(geometry: THREE.BufferGeometry, width: number, height: number) {
  geometry.computeVertexNormals();
  const normals = geometry.getAttribute('normal'), sum = new THREE.Vector3();
  for (let row = 0; row <= height; row++) {
    const start = row * (width + 1), end = start + width;
    sum.set(0, 0, 0);
    if (row === 0 || row === height) {
      for (let i = start; i <= end; i++) sum.x += normals.getX(i), sum.y += normals.getY(i), sum.z += normals.getZ(i);
      sum.normalize();
      for (let i = start; i <= end; i++) normals.setXYZ(i, sum.x, sum.y, sum.z);
    } else {
      sum.set(normals.getX(start) + normals.getX(end), normals.getY(start) + normals.getY(end), normals.getZ(start) + normals.getZ(end)).normalize();
      normals.setXYZ(start, sum.x, sum.y, sum.z); normals.setXYZ(end, sum.x, sum.y, sum.z);
    }
  }
  geometry.computeBoundingSphere();
}

/** Near rocks get small pits in the existing lighting pass. Distant batches stay vertex-lit. */
export function createAsteroidMaterial(family = 0, detail = true): THREE.MeshPhongMaterial {
  const palette = PALETTES[family % PALETTES.length];
  const material = new THREE.MeshPhongMaterial({ color: 0xffffff, vertexColors: true, shininess: palette.shine, specular: palette.specular });
  material.name = 'sculpted-asteroid-surface';
  if (!detail) return material;
  material.onBeforeCompile = shader => {
    shader.vertexShader = `varying vec3 vRockPosition;\n${shader.vertexShader}`.replace('#include <begin_vertex>', '#include <begin_vertex>\nvRockPosition = position;');
    shader.fragmentShader = `varying vec3 vRockPosition;
      float rockHash(vec3 p) { p=fract(p*.1031); p+=dot(p,p.yzx+33.33); return fract((p.x+p.y)*p.z); }
      float rockNoise(vec3 p) {
        vec3 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(mix(rockHash(i),rockHash(i+vec3(1,0,0)),f.x),mix(rockHash(i+vec3(0,1,0)),rockHash(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(rockHash(i+vec3(0,0,1)),rockHash(i+vec3(1,0,1)),f.x),mix(rockHash(i+vec3(0,1,1)),rockHash(i+vec3(1,1,1)),f.x),f.y),f.z);
      }
      ${shader.fragmentShader}`
      .replace('#include <color_fragment>', `#include <color_fragment>
        float rockFootprint=max(length(dFdx(vRockPosition)),length(dFdy(vRockPosition)));
        float rockDetail=1.-smoothstep(.012,.045,rockFootprint);
        float rockGrit=rockNoise(vRockPosition*54.);
        float rockChips=rockNoise(vRockPosition*16.+7.);
        float rockHeight=(rockGrit*.006+rockChips*rockChips*.014)*rockDetail;
        diffuseColor.rgb*=1.+(rockGrit-.5)*.24*rockDetail;
      `)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec3 rockDx=dFdx(-vViewPosition),rockDy=dFdy(-vViewPosition);
        vec3 rockR1=cross(rockDy,normal),rockR2=cross(normal,rockDx);
        float rockDet=dot(rockDx,rockR1)*faceDirection;
        vec3 rockGradient=sign(rockDet)*(dFdx(rockHeight)*rockR1+dFdy(rockHeight)*rockR2);
        normal=normalize(max(abs(rockDet),1.e-8)*normal-rockGradient);
      `);
  };
  material.customProgramCacheKey = () => 'asteroid-grit-v1';
  return material;
}
