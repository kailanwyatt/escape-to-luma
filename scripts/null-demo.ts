import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { setWorldBackdropLoader } from '../src/graphics/WorldBackdrop';
import { CinematicNullScene, CurrentNullScene } from '../src/experiments/cinematic-null/NullStudyScenes';
import { frameNullStudy, NULL_SHOTS, NULL_STUDY_DURATION, sampleNullStudy, type NullShot } from '../src/experiments/cinematic-null/NullStudySequence';
import { openingRenderSize } from '../src/scene/OpeningQuality';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const copy = {
  presence: ['01 / THE PRESENCE', 'Even the stars fall silent.', 'Something vast waits beyond the light.', 'THE UNLIT EXPANSE', 'A world that reacts to its presence.', 'Layered nebula clouds, a fractured eclipse, tumbling debris and streams of captured starlight.'],
  lash: ['02 / NULL LASH', 'The dark has a pulse.', 'Watch it gather. Leave before it strikes.', 'LEVEL 112 / NULL LASH', 'One continuous, living surface.', 'A tight coil gathers amber light before the strike. Longitudinal veins travel along the body as it unwinds.'],
  encounter: ['03 / THE NULL', 'Find the light it couldn’t swallow.', 'A small passage through something immense.', 'LEVEL 113 / THE NULL', 'Depth without hiding the way through.', 'Breathing folds surround a clear cyan aperture. The passage follows the current encounter’s drift and opening size.'],
};
const phases = { coiled: 'CLEAR · COILED', warning: 'SURGE WARNING', lashing: 'STRIKE', extended: 'PASSAGE BLOCKED', retracting: 'UNWINDING' };

function start() {
  const film = $('film'), preference = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = $<HTMLInputElement>('reduced'); reduced.checked = preference.matches;
  let mode = 'redesigned', fixed: NullShot | null = null, elapsed = .65;
  let playing = !reduced.checked, dirty = true, disposed = false, lost = false;
  let last = performance.now(), raf = 0, lastShot = '', mean = 1 / 60, samples = 0;
  let pixelBudget = matchMedia('(pointer: coarse)').matches ? 960_000 : 1_800_000;
  const textureLoader = new THREE.TextureLoader();
  setWorldBackdropLoader(async world => {
    if (world !== 'nebula') return null;
    const texture = await textureLoader.loadAsync('/assets/art/worlds/nebula.jpg');
    texture.colorSpace = THREE.SRGBColorSpace; dirty = true; return texture;
  });
  const redesigned = new CinematicNullScene(), current = new CurrentNullScene();
  const camera = new THREE.PerspectiveCamera(43, 1, .1, 180);
  function makeRenderer(id: string, scene: THREE.Scene, glow: boolean) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(1); renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    $(id).appendChild(renderer.domElement);
    const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
    const bloom = glow ? new UnrealBloomPass(new THREE.Vector2(1, 1), .52, .5, .9) : null;
    if (bloom) composer.addPass(bloom); composer.addPass(new OutputPass());
    renderer.domElement.addEventListener('webglcontextlost', event => {
      event.preventDefault(); lost = true; $('error-copy').textContent = 'The graphics connection was interrupted. Reload the preview to continue.'; $('error').classList.add('visible');
    });
    return { renderer, composer, bloom };
  }
  const newView = makeRenderer('redesigned', redesigned.scene, true), oldView = makeRenderer('current', current.scene, false);
  function resize() {
    const width = film.clientWidth, height = film.clientHeight; if (!width || !height) return;
    const dpr = Math.min(devicePixelRatio, 1.7), budget = pixelBudget * (mode === 'compare' ? .72 : 1);
    const size = openingRenderSize(width * dpr, height * dpr, budget);
    for (const view of [newView, oldView]) { view.renderer.setSize(size.width, size.height, false); view.composer.setSize(size.width, size.height); }
    camera.aspect = width / height; camera.updateProjectionMatrix(); dirty = true;
  }
  function updatePlay() { $('play').textContent = playing ? 'Ⅱ' : '▷'; $('play').setAttribute('aria-label', playing ? 'Pause preview' : 'Play preview'); }
  function seek(value: number) { elapsed = Math.max(0, Math.min(NULL_STUDY_DURATION - .001, value)); last = performance.now(); dirty = true; }
  function selectMode(value: string) {
    mode = value; film.dataset.mode = mode;
    document.querySelectorAll<HTMLElement>('[data-mode]').forEach(button => { if (button instanceof HTMLButtonElement) button.setAttribute('aria-pressed', String(button.dataset.mode === mode)); });
    $('mode-label').textContent = mode === 'compare' ? 'REDESIGNED / CURRENT' : mode === 'current' ? 'CURRENT ART' : 'REDESIGNED';
    $('split-control').classList.toggle('visible', mode === 'compare'); resize();
  }
  function format(portrait: boolean) {
    document.querySelector('.shell')!.classList.toggle('portrait', portrait);
    $('portrait').setAttribute('aria-pressed', String(portrait)); $('wide').setAttribute('aria-pressed', String(!portrait)); resize();
  }
  function selectShot(shot: string) {
    fixed = shot === 'sequence' ? null : shot as NullShot;
    seek(fixed ? NULL_SHOTS.indexOf(fixed) * 12 + .65 : .65);
    document.querySelectorAll<HTMLElement>('[data-shot]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.shot === shot)));
  }
  function frame(now: number) {
    if (disposed) return;
    const delta = Math.max(0, (now - last) / 1000); last = now;
    if (playing && !document.hidden && !lost) {
      elapsed += Math.min(delta, .15); dirty = true;
      if (delta > 0 && delta < .2) {
        mean += (delta - mean) * .04;
        if (++samples >= 120) { samples = 0; if (mean > 1 / 40 && pixelBudget > 540_000) { pixelBudget = Math.max(540_000, pixelBudget * .8); resize(); } }
      }
    }
    if (dirty && !document.hidden && !lost) {
      const state = sampleNullStudy(elapsed, fixed);
      const actorTime = fixed ? elapsed - NULL_SHOTS.indexOf(fixed) * 12 : state.local;
      frameNullStudy(camera, state.shot, actorTime, reduced.checked);
      const lash = redesigned.update(actorTime, state.shot, reduced.checked, camera.aspect);
      current.update(actorTime, state.shot, reduced.checked);
      if (mode !== 'current') { newView.bloom!.enabled = $<HTMLInputElement>('glow').checked; newView.composer.render(); }
      if (mode !== 'redesigned') oldView.composer.render();
      if (lastShot !== state.shot) {
        lastShot = state.shot; const c = copy[state.shot];
        $('shot-label').textContent = c[0]; $('shot-title').textContent = c[1]; $('shot-copy').textContent = c[2]; $('location').textContent = c[3];
        $('notes').innerHTML = `<strong>${c[4]}</strong> ${c[5]}`;
      }
      $('phase-label').textContent = state.shot === 'lash' ? 'MOTION STUDY' : state.shot === 'encounter' ? 'SURVIVING PASSAGE' : 'AMBIENT STUDY';
      $('phase-value').textContent = state.shot === 'lash' ? phases[lash.phase] : state.shot === 'encounter' ? 'FOLLOW THE CYAN LIGHT' : 'LIGHT DRAWN INWARD';
      $('phase').dataset.warning = String(state.shot === 'lash' && (lash.warning || lash.phase === 'extended'));
      $('transition').style.opacity = String(reduced.checked ? 0 : state.fade);
      $<HTMLInputElement>('timeline').value = String(state.elapsed);
      $('time').textContent = `00:${String(Math.floor(state.elapsed)).padStart(2, '0')} / 00:36`;
      dirty = false;
    }
    raf = requestAnimationFrame(frame);
  }
  $('play').onclick = () => { playing = !playing; last = performance.now(); dirty = true; updatePlay(); };
  $('replay').onclick = () => { selectShot(fixed ?? 'sequence'); playing = true; updatePlay(); };
  $('timeline').oninput = () => seek(Number($<HTMLInputElement>('timeline').value));
  $('split').oninput = () => film.style.setProperty('--split', `${$<HTMLInputElement>('split').value}%`);
  $('wide').onclick = () => format(false); $('portrait').onclick = () => format(true);
  document.querySelectorAll<HTMLButtonElement>('button[data-mode]').forEach(button => button.onclick = () => selectMode(button.dataset.mode!));
  document.querySelectorAll<HTMLButtonElement>('[data-shot]').forEach(button => button.onclick = () => selectShot(button.dataset.shot!));
  $('glow').onchange = () => { dirty = true; }; reduced.onchange = () => { dirty = true; };
  $('fullscreen').onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await film.requestFullscreen(); } catch { $('fullscreen').title = 'Fullscreen is unavailable in this browser'; } };
  function key(event: KeyboardEvent) {
    if (event.target instanceof HTMLButtonElement || event.target instanceof HTMLInputElement || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.code === 'Space') { event.preventDefault(); playing = !playing; last = performance.now(); updatePlay(); }
    if (event.code === 'ArrowRight') { event.preventDefault(); seek(elapsed + 1); }
    if (event.code === 'ArrowLeft') { event.preventDefault(); seek(elapsed - 1); }
  }
  function visibility() { last = performance.now(); dirty = true; }
  function motion(event: MediaQueryListEvent) { reduced.checked = event.matches; dirty = true; }
  const observer = new ResizeObserver(resize); observer.observe(film);
  window.addEventListener('keydown', key); document.addEventListener('visibilitychange', visibility); preference.addEventListener('change', motion);
  function dispose() {
    if (disposed) return; disposed = true; cancelAnimationFrame(raf); observer.disconnect();
    window.removeEventListener('keydown', key); document.removeEventListener('visibilitychange', visibility); preference.removeEventListener('change', motion);
    redesigned.dispose(); current.dispose();
    for (const view of [newView, oldView]) { view.composer.passes.forEach(pass => pass.dispose()); view.composer.dispose(); view.renderer.dispose(); }
    setWorldBackdropLoader(null);
  }
  window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); });
  resize(); updatePlay(); raf = requestAnimationFrame(frame);
}
$('retry').onclick = () => location.reload();
try { start(); } catch (error) { console.error('Null study failed:', error); $('error').classList.add('visible'); }
