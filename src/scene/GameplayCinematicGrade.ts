import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { openingRenderSize } from './OpeningQuality';

/** Retains the approved Null lighting finish with bounded mobile render targets. */
export class GameplayCinematicGrade {
  enabled = false;
  private composer: EffectComposer | null = null;
  private size = new THREE.Vector2();
  setWorld(world: string | null) {
    this.enabled = world === 'the_null';
    if (!this.enabled) this.dispose();
  }
  resize(renderer: THREE.WebGLRenderer) {
    if (!this.composer) return;
    renderer.getDrawingBufferSize(this.size);
    const size = openingRenderSize(this.size.x, this.size.y, 1_200_000);
    this.composer.setSize(size.width, size.height);
  }
  render(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    if (!this.enabled) { renderer.render(scene, camera); return; }
    if (!this.composer) {
      const hdr = renderer.extensions.has('EXT_color_buffer_float');
      const target = new THREE.WebGLRenderTarget(1, 1, { type: hdr ? THREE.HalfFloatType : THREE.UnsignedByteType });
      this.composer = new EffectComposer(renderer, target); this.composer.setPixelRatio(1);
      this.composer.addPass(new RenderPass(scene, camera));
      const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .52, .5, .9);
      if (!hdr) for (const target of [bloom.renderTargetBright, ...bloom.renderTargetsHorizontal, ...bloom.renderTargetsVertical]) target.texture.type = THREE.UnsignedByteType;
      this.composer.addPass(bloom); this.composer.addPass(new OutputPass()); this.resize(renderer);
    }
    const tone = renderer.toneMapping, exposure = renderer.toneMappingExposure, target = renderer.getRenderTarget();
    try { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15; this.composer.render(); }
    finally { renderer.toneMapping = tone; renderer.toneMappingExposure = exposure; renderer.setRenderTarget(target); }
  }
  dispose() {
    this.composer?.passes.forEach(pass => pass.dispose()); this.composer?.dispose(); this.composer = null;
  }
}
