import * as THREE from 'three';
import { CinematicEnding } from './ending/CinematicEnding';
import { ENDING_DURATION, sampleEnding } from './ending/EndingSequence';
import { createCinematicBloom, CINEMATIC_EXPOSURE, disposeCinematicBloom } from './CinematicGrade';
import { openingRenderSize } from './OpeningQuality';
import { disposeThreeObject } from '../utils/disposeThree';

export const ENDING_PIXEL_BUDGET = { max: 960_000, min: 540_000 } as const;
const COVER_SECONDS = .65, REVEAL_SECONDS = 1.1;
const WARM_BEATS = [0, 13, 23, 38];

/** Shares the game's GL context. Preparation is spread across covered frames, before film time starts. */
export class CampaignEndingPresentation {
  private art: CinematicEnding | null = null;
  private target: THREE.WebGLRenderTarget | null = null;
  private bloom: ReturnType<typeof createCinematicBloom> | null = null;
  private readonly screen = new THREE.Scene();
  private readonly camera = new THREE.Camera();
  private readonly size = new THREE.Vector2();
  private readonly output: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private readonly veil: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private phase: 'idle' | 'cover' | 'prepare' | 'play' = 'idle';
  private coverTime = 0;
  private coveredFrame = false;
  private warmStep = 0;
  private warm = false;
  private replaySource = false;
  private heroColor = 0x7ef0ff;
  private elapsed = 0;
  private ambientTime = 0;
  private pixelBudget: number = ENDING_PIXEL_BUDGET.max;
  private meanFrame = 1 / 60;
  private frames = 0;
  private disposed = false;

  constructor() {
    this.output = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: { source: { value: null } }, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader: `uniform sampler2D source;varying vec2 vUv;void main(){gl_FragColor=texture2D(source,vUv);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    }));
    this.veil = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: { opacity: { value: 0 } }, transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
      vertexShader: 'void main(){gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader: 'uniform float opacity;void main(){gl_FragColor=vec4(.015,.025,.035,opacity);}',
    }));
    this.output.frustumCulled = this.veil.frustumCulled = false;
    this.veil.renderOrder = 10; this.screen.add(this.output, this.veil);
  }

  get active() { return this.phase !== 'idle'; }
  get ready() { return this.phase === 'play'; }
  get time() { return this.elapsed; }
  get complete() { return this.ready && this.elapsed >= ENDING_DURATION; }
  get stage() { return this.ready ? sampleEnding(this.elapsed).stage : -1; }
  get copyOpacity() { return this.ready ? THREE.MathUtils.smoothstep(this.elapsed, 0, REVEAL_SECONDS) : 0; }

  begin(heroColor: number) {
    if (this.disposed) return;
    this.replaySource = this.active && this.warm;
    this.heroColor = heroColor; this.coverTime = 0; this.coveredFrame = false;
    this.phase = 'cover'; this.frames = 0; this.meanFrame = 1 / 60;
  }

  /** Returns true for preparation frames so their work cannot advance the film or audio clock. */
  advance(dt: number, renderer: THREE.WebGLRenderer, aspect: number, reduceMotion: boolean): boolean {
    if (!this.active) return false;
    if (this.phase === 'cover') {
      this.coverTime = Math.min(COVER_SECONDS, this.coverTime + dt);
      if (this.coverTime >= COVER_SECONDS) this.phase = 'prepare';
      return false;
    }
    if (this.phase === 'prepare') {
      // Wait until the fully covered frame has actually been presented to the native GL surface.
      if (!this.coveredFrame) return false;
      if (!this.art) {
        this.art = new CinematicEnding(this.heroColor);
        const hdr = renderer.extensions.has('EXT_color_buffer_float');
        this.target = new THREE.WebGLRenderTarget(1, 1, { type: hdr ? THREE.HalfFloatType : THREE.UnsignedByteType, depthBuffer: true, stencilBuffer: false, generateMipmaps: false });
        this.output.material.uniforms.source.value = this.target.texture;
        this.bloom = createCinematicBloom(hdr);
        // Exactly the approved ending demo's lighting finish.
        this.bloom.strength = .38; this.bloom.radius = .48; this.bloom.threshold = hdr ? 1.2 : .82;
        this.resize(renderer, aspect);
        return true;
      }
      if (!this.warm) {
        const previousTarget = renderer.getRenderTarget(), previousTone = renderer.toneMapping, previousAutoClear = renderer.autoClear;
        try {
          renderer.autoClear = true; renderer.setRenderTarget(this.target); renderer.toneMapping = THREE.NoToneMapping;
          if (this.warmStep < WARM_BEATS.length) {
            this.art.sample(WARM_BEATS[this.warmStep++]);
            renderer.render(this.art.scene, this.art.camera);
          } else {
            this.bloom!.render(renderer, this.target!, this.target!, 0, false);
            renderer.setRenderTarget(previousTarget); renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.compile(this.screen, this.camera); this.warm = true;
          }
        } finally { renderer.setRenderTarget(previousTarget); renderer.toneMapping = previousTone; renderer.autoClear = previousAutoClear; }
        return true;
      }
      this.elapsed = this.ambientTime = 0; this.phase = 'play';
      this.art.sample(0, reduceMotion); return true;
    }
    this.elapsed = Math.min(ENDING_DURATION, this.elapsed + dt);
    if (!reduceMotion) this.ambientTime += dt;
    this.art!.sample(this.elapsed, reduceMotion, this.ambientTime);
    return false;
  }

  skip(reduceMotion: boolean) {
    if (!this.ready) return;
    this.elapsed = this.ambientTime = ENDING_DURATION;
    this.art!.sample(this.elapsed, reduceMotion, this.ambientTime);
  }

  resize(renderer: THREE.WebGLRenderer, aspect: number) {
    if (!this.art || !this.target) return;
    renderer.getDrawingBufferSize(this.size);
    const size = openingRenderSize(this.size.x, this.size.y, this.pixelBudget);
    if (this.target.width !== size.width || this.target.height !== size.height) {
      this.target.setSize(size.width, size.height); this.bloom?.setSize(size.width, size.height);
    }
    this.art.camera.aspect = aspect; this.art.camera.updateProjectionMatrix();
  }

  noteFrame(seconds: number, renderer: THREE.WebGLRenderer, aspect: number) {
    if (!this.ready || !(seconds > 0 && seconds < .2)) return;
    this.meanFrame += (seconds - this.meanFrame) * .05;
    if (++this.frames < 90) return;
    this.frames = 0;
    if (this.meanFrame > 1 / 45 && this.pixelBudget > ENDING_PIXEL_BUDGET.min) {
      this.pixelBudget = Math.max(ENDING_PIXEL_BUDGET.min, Math.floor(this.pixelBudget * .75)); this.resize(renderer, aspect);
    }
  }

  render(renderer: THREE.WebGLRenderer, renderGameplay: () => void) {
    if (!this.active) { renderGameplay(); return; }
    const target = renderer.getRenderTarget(), tone = renderer.toneMapping, exposure = renderer.toneMappingExposure, autoClear = renderer.autoClear;
    const film = this.ready || (this.phase === 'cover' && this.replaySource);
    const opacity = this.ready ? 1 - this.copyOpacity : THREE.MathUtils.smoothstep(this.coverTime, 0, COVER_SECONDS);
    try {
      renderer.autoClear = true;
      if (film && this.art && this.target) {
        renderer.toneMapping = THREE.NoToneMapping; renderer.setRenderTarget(this.target);
        renderer.render(this.art.scene, this.art.camera); this.bloom?.render(renderer, this.target, this.target, 0, false);
        renderer.setRenderTarget(target); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = CINEMATIC_EXPOSURE;
      } else if (!this.coveredFrame) renderGameplay();
      this.output.visible = film;
      this.veil.visible = opacity > 0; this.veil.material.uniforms.opacity.value = opacity;
      // Once covered, stop drawing the final level completely during shader preparation.
      renderer.autoClear = film || this.coveredFrame;
      renderer.render(this.screen, this.camera);
      if (this.phase === 'prepare') this.coveredFrame = true;
    } finally {
      renderer.setRenderTarget(target); renderer.toneMapping = tone; renderer.toneMappingExposure = exposure; renderer.autoClear = autoClear;
    }
  }

  release() {
    this.art?.dispose(); this.art = null; disposeCinematicBloom(this.bloom); this.bloom = null;
    this.target?.dispose(); this.target = null; this.output.material.uniforms.source.value = null;
    this.phase = 'idle'; this.warm = false; this.warmStep = 0; this.replaySource = false;
    this.elapsed = this.ambientTime = 0; this.coveredFrame = false; this.pixelBudget = ENDING_PIXEL_BUDGET.max;
  }
  dispose() { if (this.disposed) return; this.disposed = true; this.release(); disposeThreeObject(this.screen); }
}
