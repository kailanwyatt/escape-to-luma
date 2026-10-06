import * as THREE from 'three';
import type { TheNullConfig } from '../config/ObstacleConfig';
import { theNullSafeAtTime } from './StoryLibraryState';
import { NULL_PALETTE, makeNullScaleTextures } from './NullFleshKit';

/**
 * The Null boss — dark void-moon field with a drifting cool-cyan safe eye.
 * Collision aperture stays owned by theNullSafeAtTime.
 */
export class TheNullArt {
  readonly group = new THREE.Group();
  private readonly body = new THREE.Group();
  private readonly field: THREE.Mesh;
  private readonly fieldMat: THREE.MeshStandardMaterial;
  private readonly safeEdge: THREE.Mesh;
  private readonly safeGlow: THREE.Mesh;
  private readonly safeCore: THREE.Mesh;
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
    const { color, bump } = makeNullScaleTextures(256);
    this.scaleColor = color;
    this.scaleBump = bump;

    this.fieldMat = new THREE.MeshStandardMaterial({
      color: 0x2a1048,
      map: color,
      bumpMap: bump,
      bumpScale: 0.09,
      emissive: 0x3a1860,
      emissiveIntensity: 0.4,
      metalness: 0.06,
      roughness: 0.82,
      transparent: true,
      opacity: 0.94,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
    this.fieldMat.map!.repeat.set(4.5, 4.5);
    this.fieldMat.bumpMap!.repeat.set(4.5, 4.5);
    this.ownedMaterials.push(this.fieldMat);

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
      // Cool cyan rim on the safe eye — remaining light, not Null telegraph violet.
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         float nullRim = smoothstep(nullHole.z, nullHole.z + 0.14, length(nullWorldXY - nullHole.xy));
         diffuseColor.rgb = mix(vec3(0.78, 0.91, 1.0), diffuseColor.rgb, nullRim);`,
      );
      this.fieldMat.userData.shader = shader;
    };
    this.fieldMat.customProgramCacheKey = () => 'the-null-void-moon-v1';

    const fieldGeo = new THREE.CircleGeometry(1, 64);
    this.geometries.push(fieldGeo);
    this.field = new THREE.Mesh(fieldGeo, this.fieldMat);
    this.field.name = 'null-scaled-field';
    this.field.position.z = 0.02;
    this.body.add(this.field);

    const noduleMat = new THREE.MeshStandardMaterial({
      color: 0x3a1860,
      map: color,
      bumpMap: bump,
      bumpScale: 0.06,
      emissive: 0x2a1048,
      emissiveIntensity: 0.45,
      metalness: 0.04,
      roughness: 0.72,
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
      nod.scale.set(s * 1.4, s * 1.1, s * 0.55);
      this.body.add(nod);
      this.nodules.push(nod);
    }

    const edgeMat = new THREE.MeshBasicMaterial({
      color: NULL_PALETTE.safeLight,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.ownedMaterials.push(edgeMat);
    const edgeGeo = new THREE.RingGeometry(0.88, 1.02, 48);
    this.geometries.push(edgeGeo);
    this.safeEdge = new THREE.Mesh(edgeGeo, edgeMat);
    this.safeEdge.name = 'null-safe-edge';
    this.safeEdge.position.z = -0.04;
    this.group.add(this.safeEdge);

    const glowMat = new THREE.MeshBasicMaterial({
      color: NULL_PALETTE.safeLight,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.ownedMaterials.push(glowMat);
    const glowGeo = new THREE.RingGeometry(1.0, 1.28, 48);
    this.geometries.push(glowGeo);
    this.safeGlow = new THREE.Mesh(glowGeo, glowMat);
    this.safeGlow.name = 'null-safe-glow';
    this.safeGlow.position.z = -0.05;
    this.group.add(this.safeGlow);

    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xe8f6ff,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.ownedMaterials.push(coreMat);
    const coreGeo = new THREE.CircleGeometry(0.72, 32);
    this.geometries.push(coreGeo);
    this.safeCore = new THREE.Mesh(coreGeo, coreMat);
    this.safeCore.name = 'null-safe-core';
    this.safeCore.position.z = -0.03;
    this.group.add(this.safeCore);

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x1a0a2c,
      map: color,
      bumpMap: bump,
      bumpScale: 0.04,
      emissive: 0x2a1040,
      emissiveIntensity: 0.4,
      metalness: 0.1,
      roughness: 0.7,
    });
    this.ownedMaterials.push(rimMat);
    const rimGeo = new THREE.TorusGeometry(1, 0.035, 8, 48);
    this.geometries.push(rimGeo);
    this.fieldEdge = new THREE.Mesh(rimGeo, rimMat);
    this.fieldEdge.name = 'null-field-edge';
    this.fieldEdge.position.z = -0.02;
    this.body.add(this.fieldEdge);

    this.accent = new THREE.PointLight(NULL_PALETTE.safeLight, 14, 12, 2);
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
    this.safeCore.position.set(safe.x, safe.y, -0.03);
    this.safeCore.scale.setScalar(safe.radius);

    const scroll = time * 0.04;
    this.fieldMat.map!.offset.set(scroll * 0.15, scroll * 0.08);
    this.fieldMat.bumpMap!.offset.copy(this.fieldMat.map!.offset);
    this.fieldMat.emissiveIntensity = 0.35 + 0.12 * Math.sin(time * 1.3);

    for (const nod of this.nodules) {
      const wx = this.config.centerX + nod.position.x;
      const wy = this.config.centerY + nod.position.y;
      nod.visible = Math.hypot(wx - safe.x, wy - safe.y) > safe.radius + 0.12;
    }

    this.accent.position.set(safe.x, safe.y, -1.0);
    this.accent.intensity = 12 + 5 * Math.sin(time * 2.1);
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
