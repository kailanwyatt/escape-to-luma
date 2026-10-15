import * as THREE from 'three';
import { CinematicIntro } from './CinematicIntro';
import { applyOpeningHandoff, sampleOpeningHandoff } from './OpeningHandoff';
import { MOBILE_OPENING_QUALITY, openingRenderSize, type OpeningQuality } from './OpeningQuality';
import { disposeThreeObject } from '../utils/disposeThree';
import { CINEMATIC_EXPOSURE, createCinematicBloom, disposeCinematicBloom } from './CinematicGrade';

/** The demo's HDR scene, bloom and ACES finish, rendered within a mobile pixel budget. */
export class CampaignOpeningPresentation {
  private art: CinematicIntro | null = null;
  private target: THREE.WebGLRenderTarget | null = null;
  private bloom: ReturnType<typeof createCinematicBloom> | null = null;
  private readonly screen = new THREE.Scene();
  private readonly screenCamera = new THREE.Camera();
  private readonly output: THREE.ShaderMaterial;
  private readonly veil: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private readonly size = new THREE.Vector2();
  private pixelBudget: number;
  private elapsed = 0;
  private frameSamples = 0;
  private frameMean = 1 / 60;
  private warm = false;
  private disposed = false;

  constructor(private readonly quality: Readonly<OpeningQuality> = MOBILE_OPENING_QUALITY) {
    this.pixelBudget = quality.maxPixels;
    this.output = new THREE.ShaderMaterial({
      uniforms: { source: { value: null } }, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader: `uniform sampler2D source;varying vec2 vUv;void main(){
        gl_FragColor=texture2D(source,vUv);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.output);
    quad.frustumCulled = false;
    this.screen.add(quad);
    this.veil = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: { opacity: { value: 0 } }, transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
      vertexShader: 'void main(){gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader: 'uniform float opacity;void main(){gl_FragColor=vec4(0.015,0.025,0.035,opacity);}',
    }));
    this.veil.frustumCulled = false;
    this.veil.renderOrder = 10;
    this.screen.add(this.veil);
  }

  /** All construction and initial GPU uploads happen before the opening clock starts. Replays reuse them. */
  prepare(renderer: THREE.WebGLRenderer, gameplay: THREE.Scene, camera: THREE.PerspectiveCamera, reduceMotion: boolean) {
    if (this.disposed) return;
    if (!this.art) this.art = new CinematicIntro(this.quality);
    if (!this.target) {
      const hdr = renderer.extensions.has('EXT_color_buffer_float');
      this.target = new THREE.WebGLRenderTarget(1, 1, {
        type: hdr ? THREE.HalfFloatType : THREE.UnsignedByteType,
        depthBuffer: true, stencilBuffer: false, generateMipmaps: false,
      });
      this.output.uniforms.source.value = this.target.texture;
      this.bloom = createCinematicBloom(hdr);
    }
    this.resize(renderer, camera.aspect);
    const previousTarget = renderer.getRenderTarget();
    const previousToneMapping = renderer.toneMapping;
    try {
      if (!this.warm) {
        renderer.setRenderTarget(this.target);
        // Compile light-count variants and upload geometry for every beat, including the shards.
        for (const time of [0, 8, 15, 22, 28, 31]) {
          this.art.sample(time, false);
          renderer.render(this.art.scene, this.art.camera);
        }
        this.bloom?.render(renderer, this.target!, this.target!, 0, false);
        renderer.setRenderTarget(null);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.compile(this.screen, this.screenCamera);
        this.warm = true;
      }
      // The playable scene is prepared at its starting obstacle phase, before the fade can reveal it.
      renderer.setRenderTarget(null);
      renderer.toneMapping = previousToneMapping;
      renderer.compile(gameplay, camera);
    } finally {
      renderer.setRenderTarget(previousTarget);
      renderer.toneMapping = previousToneMapping;
    }
    this.frameSamples = 0; this.frameMean = 1 / 60;
    this.sample(0, camera, reduceMotion);
  }

  resize(renderer: THREE.WebGLRenderer, aspect: number) {
    if (!this.art || !this.target) return;
    renderer.getDrawingBufferSize(this.size);
    const size = openingRenderSize(this.size.x, this.size.y, this.pixelBudget);
    if (size.width !== this.target.width || size.height !== this.target.height) {
      this.target.setSize(size.width, size.height);
      this.bloom?.setSize(size.width, size.height);
    }
    this.art.camera.aspect = aspect;
    this.art.camera.updateProjectionMatrix();
  }

  /** Sustained slow frames lower fill cost once per 90 samples. Pauses and startup spikes are ignored. */
  noteFrame(seconds: number, renderer: THREE.WebGLRenderer, aspect: number) {
    if (!(seconds > 0 && seconds < .2) || sampleOpeningHandoff(this.elapsed).gameplay) return;
    this.frameMean += (seconds - this.frameMean) * .05;
    this.frameSamples++;
    if (this.frameSamples < 90) return;
    this.frameSamples = 0;
    if (this.frameMean > 1 / 45 && this.pixelBudget > this.quality.minPixels) {
      this.pixelBudget = Math.max(this.quality.minPixels, Math.floor(this.pixelBudget * .75));
      this.resize(renderer, aspect);
    }
  }

  sample(elapsed: number, gameplayCamera: THREE.PerspectiveCamera, reduceMotion: boolean) {
    this.elapsed = elapsed;
    const state = sampleOpeningHandoff(elapsed);
    if (state.gameplay) applyOpeningHandoff(gameplayCamera, elapsed, reduceMotion);
    else this.art?.sample(elapsed, reduceMotion);
    this.veil.material.uniforms.opacity.value = state.opacity;
  }

  render(renderer: THREE.WebGLRenderer, gameplay: THREE.Scene, gameplayCamera: THREE.PerspectiveCamera) {
    if (!this.art || !this.target) { renderer.render(gameplay, gameplayCamera); return; }
    const state = sampleOpeningHandoff(this.elapsed);
    const previousTarget = renderer.getRenderTarget();
    const previousToneMapping = renderer.toneMapping;
    const previousExposure = renderer.toneMappingExposure;
    const previousAutoClear = renderer.autoClear;
    const quad = this.screen.children[0];
    try {
      renderer.autoClear = true;
      if (state.gameplay) {
        renderer.setRenderTarget(previousTarget);
        renderer.render(gameplay, gameplayCamera);
        quad.visible = false;
      } else {
        renderer.setRenderTarget(this.target);
        renderer.render(this.art.scene, this.art.camera);
        this.bloom?.render(renderer, this.target, this.target, 0, false);
        renderer.setRenderTarget(previousTarget);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = CINEMATIC_EXPOSURE;
        quad.visible = true;
      }
      this.veil.visible = state.opacity > 0;
      renderer.autoClear = !state.gameplay;
      if (quad.visible || this.veil.visible) renderer.render(this.screen, this.screenCamera);
    } finally {
      renderer.setRenderTarget(previousTarget);
      renderer.toneMapping = previousToneMapping;
      renderer.toneMappingExposure = previousExposure;
      renderer.autoClear = previousAutoClear;
    }
  }

  release() {
    this.art?.dispose(); this.art = null;
    this.target?.dispose(); this.target = null;
    disposeCinematicBloom(this.bloom); this.bloom = null;
    this.output.uniforms.source.value = null;
    this.warm = false;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.release();
    disposeThreeObject(this.screen);
  }
}
