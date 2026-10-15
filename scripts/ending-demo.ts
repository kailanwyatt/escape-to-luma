import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CinematicEnding } from '../src/experiments/cinematic-ending/CinematicEnding';
import { ENDING_BEATS, ENDING_DURATION, ENDING_STARTS, sampleEnding } from '../src/experiments/cinematic-ending/EndingSequence';
import { openingRenderSize } from '../src/scene/OpeningQuality';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const icons = {
  play: '<svg viewBox="0 0 24 24"><path d="m8 4 12 8-12 8Z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
  muted: '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4V5ZM16 9l5 6m0-6-5 6"/></svg>',
  sound: '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4V5Zm5 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>',
};
const directions = [
  ['Let the world welcome you.', 'A luminous planet, flowing auroras and drifting asteroids surround Luma’s orbital gardens. Hundreds of colored lights fill the distant sky.'],
  ['Turn the signal into a chorus.', 'Beams travel from root to canopy in staggered waves. The terrace answers with warm water ripples as Sparks in the game’s own colors rise to meet you.'],
  ['Give the reunion room to breathe.', 'The camera settles as the lights gather around Spark. A quiet pause gives the player time to feel the distance they have travelled.'],
  ['Leave with possibility.', 'The camera pulls back as Spark and the others rise together. The living world keeps glowing after the final title: tree pulses, wandering Sparks and slow asteroid flybys.'],
];

/** Original guide score for this demo, synthesized once off the main rendering thread. */
async function buildScore() {
  const offline = new OfflineAudioContext(2, 44100 * (ENDING_DURATION + 3), 44100);
  const master = offline.createGain(); master.gain.value = .28; master.connect(offline.destination);
  const delay = offline.createDelay(2); delay.delayTime.value = .38;
  const echo = offline.createGain(); echo.gain.value = .23; delay.connect(echo); echo.connect(delay); echo.connect(master);
  function note(frequency: number, start: number, duration: number, volume: number, type: OscillatorType) {
    const oscillator = offline.createOscillator(), gain = offline.createGain();
    oscillator.type = type; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + Math.min(1.6, duration * .2));
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain); gain.connect(master); if (type === 'sine') gain.connect(delay);
    oscillator.start(start); oscillator.stop(start + duration);
  }
  const chords = [[146.83, 220, 293.66, 369.99], [130.81, 196, 261.63, 329.63], [164.81, 246.94, 329.63, 392], [146.83, 220, 293.66, 440]];
  chords.forEach((chord, index) => chord.forEach((f, voice) => {
    note(f * .5, index * 9.3, 10.5, .09 / (voice + 1), 'sine');
    note(f * 1.002, index * 9.3 + .02, 10.5, .028, 'triangle');
  }));
  [440, 587.33, 659.25, 587.33, 739.99, 880, 739.99, 659.25, 587.33, 440].forEach((f, i) => note(f, 9.3 + i * 2.35, 4, .09, 'sine'));
  return offline.startRendering();
}

function start() {
  const viewport = $('viewport'), film = $('film');
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  viewport.appendChild(renderer.domElement);
  const ending = new CinematicEnding();
  const composer = new EffectComposer(renderer);
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .38, .48, 1.2);
  composer.addPass(new RenderPass(ending.scene, ending.camera)); composer.addPass(bloom); composer.addPass(new OutputPass());
  const preference = matchMedia('(prefers-reduced-motion: reduce)'), reduced = $<HTMLInputElement>('reduced');
  reduced.checked = preference.matches;
  let ambientTime = 0;
  let elapsed = 0, playing = !reduced.checked, last = performance.now(), lastStage = -1;
  let raf = 0, disposed = false, contextLost = false, dirty = true;
  let audioContext: AudioContext | null = null, voice: AudioBufferSourceNode | null = null, sound = false;
  const score = buildScore().catch(() => null);
  let soundGeneration = 0;
  let pixelBudget = matchMedia('(pointer: coarse)').matches ? 1_250_000 : 2_200_000;
  let meanFrame = 1 / 60, frameSamples = 0;
  const reducedClass = () => document.documentElement.classList.toggle('reduced-motion', reduced.checked);
  reducedClass();

  async function syncSound() {
    const generation = ++soundGeneration;
    if (voice) { voice.stop(); voice.disconnect(); voice = null; }
    if (!sound || !playing || document.hidden || contextLost || elapsed >= ENDING_DURATION) return;
    try {
      audioContext ??= new AudioContext(); await audioContext.resume();
      const buffer = await score;
      if (!buffer || generation !== soundGeneration || disposed || !sound || !playing) return;
      voice = audioContext.createBufferSource(); voice.buffer = buffer; voice.connect(audioContext.destination); voice.start(0, elapsed);
    } catch { sound = false; updateSound(); }
  }
  function updateSound() {
    $('sound').innerHTML = `${sound ? icons.sound : icons.muted}<span id="sound-label">SOUND ${sound ? 'ON' : 'OFF'}</span>`;
    $('sound').setAttribute('aria-label', sound ? 'Mute soundtrack' : 'Enable soundtrack');
    $('sound').setAttribute('aria-pressed', String(sound));
  }
  function updatePlay() {
    $('play').innerHTML = playing ? icons.pause : icons.play;
    $('play').setAttribute('aria-label', playing ? 'Pause ending' : elapsed >= ENDING_DURATION ? 'Replay ending' : 'Play ending');
  }
  function seek(time: number) {
    elapsed = Math.max(0, Math.min(ENDING_DURATION, time)); ambientTime = elapsed; last = performance.now(); dirty = true;
    if (elapsed >= ENDING_DURATION) playing = false;
    updatePlay(); void syncSound();
  }
  function replay() { playing = true; seek(0); }
  function togglePlay() { if (elapsed >= ENDING_DURATION) { elapsed = 0; ambientTime = 0; } playing = !playing; last = performance.now(); dirty = true; updatePlay(); void syncSound(); }
  function resize() {
    const width = viewport.clientWidth, height = viewport.clientHeight; if (!width || !height) return;
    const dpr = Math.min(devicePixelRatio, 1.7);
    const size = openingRenderSize(width * dpr, height * dpr, pixelBudget);
    renderer.setSize(size.width, size.height, false); composer.setSize(size.width, size.height);
    ending.camera.aspect = width / height; ending.camera.updateProjectionMatrix(); dirty = true;
  }
  function format(portrait: boolean) {
    document.querySelector('.player-shell')!.classList.toggle('portrait', portrait);
    $('portrait').setAttribute('aria-pressed', String(portrait)); $('wide').setAttribute('aria-pressed', String(!portrait)); resize();
  }
  function text(stage: number) {
    const beat = ENDING_BEATS[stage];
    $('title').textContent = beat.title; $('story').textContent = beat.caption;
    $('location').textContent = beat.location; $('chapter-label').textContent = `${String(stage + 1).padStart(2, '0')} / ${beat.label}`;
    $('direction-title').textContent = directions[stage][0]; $('direction-copy').textContent = directions[stage][1];
    document.querySelectorAll<HTMLElement>('[data-chapter]').forEach(button => button.setAttribute('aria-current', String(Number(button.dataset.chapter) === stage)));
    $('caption').classList.remove('swap'); void $('caption').offsetWidth; $('caption').classList.add('swap');
  }
  function frame(now: number) {
    if (disposed) return;
    const raw = Math.max(0, (now - last) / 1000); last = now;
    if ((playing || elapsed >= ENDING_DURATION) && !document.hidden && !contextLost && !reduced.checked) { ambientTime += Math.min(raw, .25); dirty = true; }
    if (playing && !document.hidden && !contextLost) {
      elapsed = Math.min(ENDING_DURATION, elapsed + Math.min(raw, .25)); dirty = true;
      if (elapsed >= ENDING_DURATION) { playing = false; updatePlay(); void syncSound(); }
      if (raw > 0 && raw < .2) {
        meanFrame += (raw - meanFrame) * .04;
        if (++frameSamples >= 120) {
          frameSamples = 0;
          if (meanFrame > 1 / 40 && pixelBudget > 650_000) { pixelBudget = Math.max(650_000, Math.floor(pixelBudget * .8)); resize(); }
        }
      }
    }
    if (dirty && !document.hidden && !contextLost) {
      const state = ending.sample(elapsed, reduced.checked, ambientTime);
      if (state.stage !== lastStage) { lastStage = state.stage; text(state.stage); }
      bloom.enabled = $<HTMLInputElement>('bloom').checked; composer.render(); dirty = false;
      $<HTMLInputElement>('scrubber').value = String(elapsed);
      $('scrubber').setAttribute('aria-valuetext', `${elapsed.toFixed(1)} of ${ENDING_DURATION} seconds`);
      $('time').textContent = `00:${String(Math.floor(elapsed)).padStart(2, '0')} / 00:38`;
      $('ending-action').classList.toggle('visible', state.complete); film.classList.toggle('complete', state.complete);
    }
    raf = requestAnimationFrame(frame);
  }
  $('play').onclick = togglePlay; $('replay').onclick = replay; $('watch-again').onclick = replay;
  $('portrait').onclick = () => format(true); $('wide').onclick = () => format(false);
  $('sound').onclick = () => { sound = !sound; updateSound(); void syncSound(); };
  $('scrubber').oninput = () => seek(Number($<HTMLInputElement>('scrubber').value));
  reduced.onchange = () => { reducedClass(); dirty = true; };
  $('bloom').onchange = () => { dirty = true; };
  document.querySelectorAll<HTMLElement>('[data-chapter]').forEach(button => button.onclick = () => seek(ENDING_STARTS[Number(button.dataset.chapter)] + .1));
  $('fullscreen').onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await film.requestFullscreen(); } catch { $('fullscreen').title = 'Fullscreen is unavailable in this browser'; } };
  function keydown(event: KeyboardEvent) {
    if (event.target instanceof HTMLButtonElement || event.target instanceof HTMLInputElement || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.code === 'Space') { event.preventDefault(); togglePlay(); }
    if (event.code === 'KeyR') replay();
    if (event.code === 'ArrowRight') { event.preventDefault(); seek(elapsed + 2); }
    if (event.code === 'ArrowLeft') { event.preventDefault(); seek(elapsed - 2); }
  }
  function visibility() { last = performance.now(); dirty = true; void syncSound(); }
  function motion(event: MediaQueryListEvent) { reduced.checked = event.matches; reducedClass(); dirty = true; }
  const observer = new ResizeObserver(resize); observer.observe(viewport);
  window.addEventListener('keydown', keydown); document.addEventListener('visibilitychange', visibility); preference.addEventListener('change', motion);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault(); contextLost = true; void syncSound(); $('error-message').textContent = 'The graphics connection was interrupted. Reload to continue the film.'; $('error').classList.add('visible');
  });
  function dispose() {
    if (disposed) return; disposed = true; soundGeneration++; cancelAnimationFrame(raf); voice?.stop(); voice?.disconnect(); void audioContext?.close();
    observer.disconnect(); window.removeEventListener('keydown', keydown); document.removeEventListener('visibilitychange', visibility); preference.removeEventListener('change', motion);
    ending.dispose(); composer.passes.forEach(pass => pass.dispose()); composer.dispose(); renderer.dispose();
  }
  window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); });
  resize(); updatePlay(); raf = requestAnimationFrame(frame);
}
$('retry').onclick = () => location.reload();
try { start(); } catch (error) { console.error('Cinematic ending failed:', error); $('error').classList.add('visible'); }
