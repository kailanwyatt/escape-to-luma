import * as THREE from 'three';
import type { TheNullConfig } from '../config/ObstacleConfig';
import { theNullSafeAtTime } from './StoryLibraryState';

/**
 * Procedural purple scale / bumpy skin for The Null field.
 * Color + bump only — never changes the safe aperture.
 */
function makeScaleTextures(size = 256): {
  color: THREE.DataTexture;
  bump: THREE.DataTexture;
} {
  const colorData = new Uint8Array(size * size * 4);
  const bumpData = new Uint8Array(size * size * 4);
  const hexW = 18;
  const hexH = hexW * 0.866;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const row = Math.floor(y / hexH);
      const colOffset = (row % 2) * (hexW * 0.5);
      const col = Math.floor((x - colOffset) / hexW);
      const cx = col * hexW + colOffset + hexW * 0.5;
      const cy = row * hexH + hexH * 0.5;
      const dx = (x - cx) / (hexW * 0.48);
      const dy = (y - cy) / (hexH * 0.52);
      const dist = Math.hypot(dx, dy);
      // Soft oval scale plate with raised rim.
      const plate = Math.max(0, 1 - dist);
      const rim = Math.pow(Math.max(0, 1 - Math.abs(dist - 0.72) * 4.2), 2);
      const dome = Math.pow(plate, 1.35);
      const grain =
        ((Math.sin(x * 0.37 + y * 0.19) * 0.5 + 0.5) * 0.12 +
          (Math.sin(x * 1.1 - y * 0.7) * 0.5 + 0.5) * 0.08);

      const height = Math.min(1, dome * 0.75 + rim * 0.55 + grain);
      const i = (y * size + x) * 4;
      const b = Math.floor(height * 255);
      bumpData[i] = b;
      bumpData[i + 1] = b;
      bumpData[i + 2] = b;
      bumpData[i + 3] = 255;

      // Purple flesh — darker seams, brighter scale crowns.
      const r = Math.floor(28 + height * 90 + rim * 40);
      const g = Math.floor(10 + height * 28 + rim * 18);
      const bCol = Math.floor(48 + height * 120 + rim * 55);
      colorData[i] = Math.min(255, r);
      colorData[i + 1] = Math.min(255, g);
      colorData[i + 2] = Math.min(255, bCol);
      colorData[i + 3] = 255;
    }
  }

  const color = new THREE.DataTexture(colorData, size, size);
  color.wrapS = color.wrapT = THREE.RepeatWrapping;
  color.magFilter = THREE.LinearFilter;
  color.minFilter = THREE.LinearMipmapLinearFilter;
  color.needsUpdate = true;
  color.colorSpace = THREE.SRGBColorSpace;

  const bump = new THREE.DataTexture(bumpData, size, size);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.magFilter = THREE.LinearFilter;
  bump.minFilter = THREE.LinearMipmapLinearFilter;
  bump.needsUpdate = true;

  return { color, bump };
}

/**
 * The Null — purple scaled void-field with a drifting safe eye (Moving Safe Zone lesson).
 */
export class TheNullArt {
  readonly group = new THREE.Group();
  private readonly body = new THREE.Group();
  private readonly field: THREE.Mesh;
  private readonly fieldMat: THREE.MeshStandardMaterial;
  private readonly safeEdge: THREE.Mesh;
  private readonly safeGlow: THREE.Mesh;
  private readonly fieldEdge: THREE.Mesh;
  private readonly nodules: THREE.Mesh[] = [];
  private readonly accent: THREE.PointLight;
  private readonly scaleColor: THREE.DataTexture;
  private readonly scaleBump: THREE.DataTexture;
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly ownedMaterials: THREE.Material[] = [];
  private readonly holeUniform = { value: new THREE.Vector3(0, 3, 0.95) };

  constructor(private readonly config: TheNullConfig) {
    this.group.name = 'the-null-art';
    this.body.name = 'null-body';
    this.group.add(this.body);
    const { color, bump } = makeScaleTextures(256);
    this.scaleColor = color;
    this.scaleBump = bump;

    this.fieldMat = new THREE.MeshStandardMaterial({
      color: 0x6a3a9a,
      map: color,
      bumpMap: bump,
      bumpScale: 0.085,
      emissive: 0x4a2080,
      emissiveIntensity: 0.35,
      metalness: 0.08,
      roughness: 0.78,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
    this.fieldMat.map!.repeat.set(4.5, 4.5);
    this.fieldMat.bumpMap!.repeat.set(4.5, 4.5);
    this.ownedMaterials.push(this.fieldMat);

    // Punch the drifting safe hole in the fragment shader (aperture stays collision-owned).
    this.fieldMat.onBeforeCompile = (shader) => {
      shader.uniforms.nullHole = this.holeUniform;
      shader.vertexShader = `varying vec2 nullWorldXY;\n` + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <project_vertex>',
        `#include <project_vertex>
         vec4 nullWorld = modelMatrix * vec4(transformed, 1.0);
         nullWorldXY = nullWorld.xy;`,
      );
      shader.fragmentShader =
        `varying vec2 nullWorldXY;\nuniform vec3 nullHole;\n` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
         if (length(nullWorldXY - nullHole.xy) < nullHole.z) discard;`,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         float nullRim = smoothstep(nullHole.z, nullHole.z + 0.12, length(nullWorldXY - nullHole.xy));
         diffuseColor.rgb = mix(vec3(0.72, 0.55, 1.0), diffuseColor.rgb, nullRim);`,
      );
      this.fieldMat.userData.shader = shader;
    };
    this.fieldMat.customProgramCacheKey = () => 'the-null-scaled-v1';

    const fieldGeo = new THREE.CircleGeometry(1, 64);
    this.geometries.push(fieldGeo);
    this.field = new THREE.Mesh(fieldGeo, this.fieldMat);
    this.field.name = 'null-scaled-field';
    this.field.position.z = 0.02;
    this.body.add(this.field);

    // Raised scale nodules across the field for 3D bumpiness.
    const noduleMat = new THREE.MeshStandardMaterial({
      color: 0x5a2888,
      map: color,
      bumpMap: bump,
      bumpScale: 0.06,
      emissive: 0x3a1860,
      emissiveIntensity: 0.4,
      metalness: 0.05,
      roughness: 0.7,
    });
    this.ownedMaterials.push(noduleMat);
    const noduleGeo = new THREE.SphereGeometry(1, 10, 8);
    this.geometries.push(noduleGeo);
    const R = config.fieldRadius;
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2 + (i % 3) * 0.15;
      const u = 0.42 + (i % 5) * 0.1;
      const rr = R * u;
      const nod = new THREE.Mesh(noduleGeo, noduleMat);
      nod.name = `null-scale-${i}`;
      nod.position.set(Math.cos(a) * rr, Math.sin(a) * rr, 0.06);
      const s = 0.07 + (i % 4) * 0.018;
      nod.scale.set(s * 1.35, s * 1.1, s * 0.55);
      this.body.add(nod);
      this.nodules.push(nod);
    }

    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0xc8b8ff,
      emissive: 0x9a70e0,
      emissiveIntensity: 0.95,
      metalness: 0.1,
      roughness: 0.28,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.ownedMaterials.push(edgeMat);
    const edgeGeo = new THREE.RingGeometry(0.92, 1.02, 48);
    this.geometries.push(edgeGeo);
    this.safeEdge = new THREE.Mesh(edgeGeo, edgeMat);
    this.safeEdge.name = 'null-safe-edge';
    this.safeEdge.position.z = -0.04;
    this.group.add(this.safeEdge);

    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x8b6fc0,
      emissive: 0x6a40c8,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.ownedMaterials.push(glowMat);
    const glowGeo = new THREE.RingGeometry(1.02, 1.14, 48);
    this.geometries.push(glowGeo);
    this.safeGlow = new THREE.Mesh(glowGeo, glowMat);
    this.safeGlow.name = 'null-safe-glow';
    this.safeGlow.position.z = -0.05;
    this.group.add(this.safeGlow);

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x3a1848,
      map: color,
      bumpMap: bump,
      bumpScale: 0.05,
      emissive: 0x2a1038,
      emissiveIntensity: 0.45,
      metalness: 0.12,
      roughness: 0.65,
    });
    this.ownedMaterials.push(rimMat);
    const rimGeo = new THREE.TorusGeometry(1, 0.04, 8, 48);
    this.geometries.push(rimGeo);
    this.fieldEdge = new THREE.Mesh(rimGeo, rimMat);
    this.fieldEdge.name = 'null-field-edge';
    this.fieldEdge.position.z = -0.02;
    this.body.add(this.fieldEdge);

    this.accent = new THREE.PointLight(0x9a60e0, 12, 12, 2);
    this.accent.name = 'null-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const safe = theNullSafeAtTime(this.config, time);
    const R = this.config.fieldRadius;
    this.body.position.set(this.config.centerX, this.config.centerY, 0);
    this.field.scale.setScalar(R);
    this.fieldEdge.scale.setScalar(R);
    this.holeUniform.value.set(safe.x, safe.y, safe.radius);

    this.safeEdge.position.set(safe.x, safe.y, -0.04);
    this.safeEdge.scale.setScalar(safe.radius);
    this.safeGlow.position.set(safe.x, safe.y, -0.05);
    this.safeGlow.scale.setScalar(safe.radius);

    // Slow living crawl of the scale pattern.
    const scroll = time * 0.04;
    this.fieldMat.map!.offset.set(scroll * 0.15, scroll * 0.08);
    this.fieldMat.bumpMap!.offset.copy(this.fieldMat.map!.offset);
    this.fieldMat.emissiveIntensity = 0.32 + 0.12 * Math.sin(time * 1.3);

    // Hide scale nodules under the safe eye so the hole stays clean.
    for (const nod of this.nodules) {
      const wx = this.config.centerX + nod.position.x;
      const wy = this.config.centerY + nod.position.y;
      nod.visible = Math.hypot(wx - safe.x, wy - safe.y) > safe.radius + 0.12;
    }

    this.accent.position.set(safe.x, safe.y, -1.0);
    this.accent.intensity = 10 + 4 * Math.sin(time * 2.1);
  }

  dispose() {
    for (const g of this.geometries) g.dispose();
    for (const m of this.ownedMaterials) m.dispose();
    this.scaleColor.dispose();
    this.scaleBump.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
