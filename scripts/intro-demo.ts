import { CINEMATIC_OPENING_COPY } from '../src/scene/CinematicOpeningCopy';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { CINEMATIC_EXPOSURE, createCinematicBloom } from '../src/scene/CinematicGrade';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CinematicIntro } from '../src/experiments/cinematic-intro/CinematicIntro';
import { OpeningScene } from '../src/scene/OpeningScene';
import { OPENING_BEATS, OPENING_DURATION, sampleOpening } from '../src/scene/OpeningSequence';
import { EnvironmentManager } from '../src/environment/EnvironmentManager';
import { Projectile } from '../src/projectile/Projectile';
import { setWorldBackdropLoader } from '../src/graphics/WorldBackdrop';
import { disposeThreeObject } from '../src/utils/disposeThree';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const icons = {
  play: '<svg viewBox="0 0 24 24"><path d="m8 4 12 8-12 8Z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
  muted: '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4V5ZM16 9l5 6m0-6-5 6"/></svg>',
  sound: '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4V5Zm5 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>',
};
const titles = CINEMATIC_OPENING_COPY.map(beat => beat.title);
const captions = CINEMATIC_OPENING_COPY.map(beat => beat.caption);
const locations = CINEMATIC_OPENING_COPY.map(beat => beat.location);
const labels = CINEMATIC_OPENING_COPY.map(beat => beat.label);
const directions = [
  ['Small light. Vast universe.', 'Layered nebulae, planetary atmosphere and a living energy core. A slow camera drift lets the scale of the world arrive before the story does.'],
  ['Wonder turns to unease.', 'A mechanical iris, segmented solar arrays and a visible scanning cone. The camera moves closer as the probe closes around Spark.'],
  ['Give the darkness a place.', 'Repeated structural bays, suspended machinery, illuminated glass and atmospheric depth make the facility feel like a real place beneath the city.'],
  ['Let color tell the story.', 'Warm signal rings interrupt the cold chamber. Spark grows brighter as the camera moves inward, turning a distant transmission into a personal moment.'],
  ['A release, with weight.', 'The glass breaks into dimensional fragments. A spreading pulse and warm emergency lighting carry the impact without a full-screen flash.'],
  ['End with a direction.', 'The camera follows Spark toward the depth of the facility. The in-game version connects the final shot to the playable escape.'],
];
const starts = OPENING_BEATS.map((_, i) => OPENING_BEATS.slice(0, i).reduce((sum, beat) => sum + beat.duration, 0));
const formatTime = (time: number) => `00:${Math.floor(time).toString().padStart(2, '0')}`;

function start() {
  const viewport = $('viewport');
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = CINEMATIC_EXPOSURE;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  viewport.appendChild(renderer.domElement);
  const cinematic = new CinematicIntro();
  const textureLoader = new THREE.TextureLoader();
  setWorldBackdropLoader(async world => {
    if (world !== 'opening') return null;
    const texture = await textureLoader.loadAsync('/assets/art/worlds/opening-space.png');
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  });
  // The comparison uses the production scene, environment, Spark and camera path.
  // The browser shell supplies identical playback controls, not the React Native HUD.
  const originalScene = new THREE.Scene();
  const originalEnvironment = new EnvironmentManager(originalScene);
  originalEnvironment.setCampaignLevel(1);
  const original = new OpeningScene();
  const originalSpark = new Projectile();
  const originalCamera = new THREE.PerspectiveCamera(45, 1, .1, 150);
  originalScene.add(original.group, originalSpark.mesh);

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(cinematic.scene, cinematic.camera);
  const bloomPass = createCinematicBloom();
  composer.addPass(renderPass); composer.addPass(bloomPass); composer.addPass(new OutputPass());
  const audio = new Audio('/assets/sfx/opening-score.wav');
  audio.preload = 'auto'; audio.volume = .6;
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = $<HTMLInputElement>('reduced');
  reduced.checked = motionPreference.matches;
  document.documentElement.classList.toggle('reduced-motion', reduced.checked);
  let elapsed = 0;
  let playing = !reduced.checked;
  let sound = false;
  let current = false;
  let last = performance.now();
  let lastStage = -1;
  let raf = 0;
  let destroyed = false;
  let contextLost = false;

  function syncAudio() {
    if (!sound || !playing || document.hidden || contextLost || elapsed >= OPENING_DURATION) { audio.pause(); return; }
    if (Number.isFinite(audio.duration)) audio.currentTime = Math.min(elapsed, audio.duration);
    void audio.play().catch(() => {
      sound = false; updateSound();
    });
  }
  function updateSound() {
    $('sound').innerHTML = `${sound ? icons.sound : icons.muted}<span id="sound-label">SOUND ${sound ? 'ON' : 'OFF'}</span>`;
    $('sound').setAttribute('aria-pressed', String(sound));
    $('sound').setAttribute('aria-label', sound ? 'Mute soundtrack' : 'Enable soundtrack');
  }
  function updatePlay() {
    $('play').innerHTML = playing ? icons.pause : icons.play;
    $('play').setAttribute('aria-label', playing ? 'Pause opening' : elapsed >= OPENING_DURATION ? 'Replay opening' : 'Play opening');
  }
  function seek(time: number) {
    elapsed = Math.max(0, Math.min(OPENING_DURATION, time));
    last = performance.now();
    if (elapsed >= OPENING_DURATION) playing = false;
    updatePlay(); syncAudio();
  }
  function togglePlay() {
    if (elapsed >= OPENING_DURATION) elapsed = 0;
    playing = !playing; last = performance.now(); updatePlay(); syncAudio();
  }
  function setTreatment(isCurrent: boolean) {
    current = isCurrent; lastStage = -1;
    $('current').setAttribute('aria-pressed', String(current));
    $('cinematic').setAttribute('aria-pressed', String(!current));
    $('take').textContent = current ? 'Previous intro' : 'Cinematic treatment';
    $<HTMLInputElement>('bloom').disabled = current;
  }
  function setPortrait(portrait: boolean) {
    document.querySelector('.player-shell')!.classList.toggle('portrait', portrait);
    $('portrait').setAttribute('aria-pressed', String(portrait));
    $('wide').setAttribute('aria-pressed', String(!portrait));
    resize();
  }
  function resize() {
    const width = viewport.clientWidth, height = viewport.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false); composer.setSize(width, height);
    cinematic.camera.aspect = originalCamera.aspect = width / height;
    cinematic.camera.updateProjectionMatrix(); originalCamera.updateProjectionMatrix();
  }
  function updateText(stage: number) {
    $('title').textContent = current ? OPENING_BEATS[stage].title : titles[stage];
    $('story').textContent = current ? OPENING_BEATS[stage].caption : captions[stage];
    $('chapter-label').textContent = `${String(stage + 1).padStart(2, '0')} / ${labels[stage]}`;
    $('location').textContent = locations[stage];
    $('direction-title').textContent = current ? 'The previous intro, on the same clock.' : directions[stage][0];
    $('direction-copy').textContent = current
      ? 'Original opening meshes, background artwork, Spark, workshop and camera path. This comparison uses shared preview controls; gameplay obstacles and the in-app HUD are not included.'
      : directions[stage][1];
    document.querySelectorAll<HTMLElement>('[data-chapter]').forEach(button => button.setAttribute('aria-current', String(Number(button.dataset.chapter) === stage)));
    $('caption').classList.remove('swap');
    void $('caption').offsetWidth;
    $('caption').classList.add('swap');
  }
  function frame(now: number) {
    if (destroyed) return;
    const dt = Math.min(.1, Math.max(0, (now - last) / 1000)); last = now;
    if (playing && !document.hidden && !contextLost) {
      elapsed = Math.min(OPENING_DURATION, elapsed + dt);
      if (elapsed >= OPENING_DURATION) { playing = false; updatePlay(); syncAudio(); }
    }
    if (!document.hidden && !contextLost) {
      const { stage, progress } = sampleOpening(elapsed);
      if (stage !== lastStage) { lastStage = stage; updateText(stage); }
      if (current) {
        renderer.toneMapping = THREE.NoToneMapping;
        originalEnvironment.setReduceMotion(reduced.checked);
        originalEnvironment.setOpeningLighting(stage, progress);
        originalEnvironment.group.visible = !original.sample(elapsed, originalCamera, reduced.checked);
        originalSpark.updateVisual(elapsed, reduced.checked, stage === 3 ? 'signal' : 'idle', stage >= 2);
        renderer.render(originalScene, originalCamera);
        $('transfer').style.opacity = '0';
      } else {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        const pose = cinematic.sample(elapsed, reduced.checked);
        bloomPass.enabled = $<HTMLInputElement>('bloom').checked;
        composer.render();
        $('transfer').style.opacity = String(pose.transferOpacity);
      }
      $<HTMLInputElement>('scrubber').value = String(elapsed);
      $('time').textContent = `${formatTime(elapsed)} / 00:35`;
      $<HTMLInputElement>('scrubber').setAttribute('aria-valuetext', `${elapsed.toFixed(1)} of 35 seconds`);
      if (sound && playing && !audio.paused && Math.abs(audio.currentTime - elapsed) > .3) syncAudio();
    }
    raf = requestAnimationFrame(frame);
  }

  $('play').onclick = togglePlay;
  $('replay').onclick = () => { playing = true; seek(0); };
  $('current').onclick = () => setTreatment(true);
  $('cinematic').onclick = () => setTreatment(false);
  $('portrait').onclick = () => setPortrait(true);
  $('wide').onclick = () => setPortrait(false);
  $('sound').onclick = () => { sound = !sound; updateSound(); syncAudio(); };
  $('scrubber').oninput = () => seek(Number($<HTMLInputElement>('scrubber').value));
  reduced.onchange = () => {
    originalEnvironment.setReduceMotion(reduced.checked);
    document.documentElement.classList.toggle('reduced-motion', reduced.checked);
  };
  document.querySelectorAll<HTMLElement>('[data-chapter]').forEach(button => {
    button.onclick = () => seek(starts[Number(button.dataset.chapter)] + .1);
  });
  $('fullscreen').onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if ($('film').requestFullscreen) await $('film').requestFullscreen();
    } catch { $('fullscreen').title = 'Fullscreen is unavailable in this browser'; }
  };
  function keydown(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.code === 'Space') { event.preventDefault(); togglePlay(); }
    if (event.code === 'KeyR') { playing = true; seek(0); }
    if (event.code === 'ArrowRight') { event.preventDefault(); seek(elapsed + 2); }
    if (event.code === 'ArrowLeft') { event.preventDefault(); seek(elapsed - 2); }
  }
  function visibility() { last = performance.now(); syncAudio(); }
  function preference(event: MediaQueryListEvent) {
    reduced.checked = event.matches;
    document.documentElement.classList.toggle('reduced-motion', event.matches);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(viewport);
  window.addEventListener('keydown', keydown);
  document.addEventListener('visibilitychange', visibility);
  motionPreference.addEventListener('change', preference);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault(); contextLost = true; syncAudio();
    $('error-message').textContent = 'The graphics context was interrupted. Reload the preview to continue.';
    $('error').classList.add('visible');
  });
  function dispose() {
    if (destroyed) return;
    destroyed = true; cancelAnimationFrame(raf); audio.pause(); audio.removeAttribute('src'); audio.load();
    observer.disconnect(); window.removeEventListener('keydown', keydown);
    document.removeEventListener('visibilitychange', visibility); motionPreference.removeEventListener('change', preference);
    cinematic.dispose(); disposeThreeObject(originalScene);
    bloomPass.dispose(); composer.passes.forEach(pass => { if (pass !== bloomPass) pass.dispose(); });
    composer.dispose(); renderer.dispose(); setWorldBackdropLoader(null);
  }
  window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); });
  updatePlay(); resize(); raf = requestAnimationFrame(frame);
}

$('retry').onclick = () => location.reload();
try { start(); } catch (error) {
  console.error('Cinematic opening preview failed:', error);
  $('error').classList.add('visible');
}
