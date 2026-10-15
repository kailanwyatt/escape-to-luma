import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { CinematicIntro } from '../src/scene/CinematicIntro';
import { CameraController } from '../src/scene/CameraController';
import { applyOpeningHandoff, OPENING_HANDOFF, sampleOpeningHandoff } from '../src/scene/OpeningHandoff';
import { DESKTOP_OPENING_QUALITY, MOBILE_OPENING_QUALITY, openingRenderSize } from '../src/scene/OpeningQuality';
import { CampaignOpeningPresentation } from '../src/scene/CampaignOpeningPresentation';

function snapshot(root: THREE.Object3D) {
  const poses: number[][] = [];
  root.traverseVisible(object => poses.push([...object.position.toArray(), ...object.quaternion.toArray(), ...object.scale.toArray()]));
  return poses;
}

describe('mobile cinematic art', () => {
  it('preserves every art setting from the approved demo on mobile', () => {
    const { maxPixels: _max, minPixels: _min, ...mobileArt } = MOBILE_OPENING_QUALITY;
    const { maxPixels: _desktopMax, minPixels: _desktopMin, ...demoArt } = DESKTOP_OPENING_QUALITY;
    expect(mobileArt).toEqual(demoArt);
  });
  it('keeps every shot within the mobile draw and geometry budget', () => {
    const art = new CinematicIntro(MOBILE_OPENING_QUALITY);
    for (const time of [0, 8, 15, 22, 28, 31.5]) {
      art.sample(time);
      let draws = 0, triangles = 0;
      art.scene.traverseVisible(object => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return;
        draws++;
        if (object instanceof THREE.Mesh) triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3 * (object instanceof THREE.InstancedMesh ? object.count : 1);
      });
      expect(draws, `draws at ${time}s`).toBeLessThan(55);
      expect(triangles, `triangles at ${time}s`).toBeLessThan(150_000);
    }
    art.dispose();
  });

  it('can replay or seek backwards without accumulating animation state', () => {
    const art = new CinematicIntro(MOBILE_OPENING_QUALITY);
    art.sample(8);
    const discovery = snapshot(art.scene);
    art.camera.updateMatrixWorld();
    const camera = art.camera.matrixWorld.clone();
    for (const time of [28, 15, 34, 0, 22, 8]) art.sample(time);
    art.camera.updateMatrixWorld();
    expect(snapshot(art.scene)).toEqual(discovery);
    expect(art.camera.matrixWorld.elements).toEqual(camera.elements);
    const count = art.scene.children.length;
    for (let frame = 0; frame < 120; frame++) art.sample(28);
    expect(art.scene.children.length).toBe(count);
    art.dispose();
  });

  it('holds the camera and disables flying fragments with reduced motion', () => {
    const art = new CinematicIntro(MOBILE_OPENING_QUALITY);
    art.sample(25.4, true);
    const camera = art.camera.position.toArray();
    art.sample(30.5, true);
    expect(art.camera.position.toArray()).toEqual(camera);
    expect(art.scene.getObjectByName('opening-fragments')?.visible).toBe(false);
    art.dispose();
  });
});

describe('gameplay handoff', () => {
  it('conceals both scene changes and finishes with no overlay', () => {
    expect(sampleOpeningHandoff(12).opacity).toBe(1);
    expect(sampleOpeningHandoff(OPENING_HANDOFF.sceneSwitch).opacity).toBe(1);
    expect(sampleOpeningHandoff(OPENING_HANDOFF.sceneSwitch - .0001).opacity).toBeGreaterThan(.999);
    expect(sampleOpeningHandoff(OPENING_HANDOFF.sceneSwitch - .0001).gameplay).toBe(false);
    expect(sampleOpeningHandoff(OPENING_HANDOFF.sceneSwitch).gameplay).toBe(true);
    expect(sampleOpeningHandoff(35)).toEqual({gameplay: true, opacity: 0, cameraProgress: 1});
  });

  it.each([false, true])('matches the next gameplay frame exactly (reduced motion: %s)', reduced => {
    const controller = new CameraController();
    const expected = controller.camera.clone();
    controller.camera.position.set(12, 2, -1);
    applyOpeningHandoff(controller.camera, 35, reduced);
    expect(controller.camera.position.distanceTo(expected.position)).toBeLessThan(1e-10);
    expect(controller.camera.quaternion.angleTo(expected.quaternion)).toBeLessThan(1e-7);
    expect(controller.camera.projectionMatrix.elements).toEqual(expected.projectionMatrix.elements);
    const before = controller.camera.matrixWorld.clone();
    controller.update(1 / 60);
    expect(controller.camera.matrixWorld.elements).toEqual(before.elements);
  });

  it.each([[1179, 2556], [1290, 2796], [2732, 2048], [390, 844], [0, 0]])('caps a %s × %s drawing buffer without upscaling', (w, h) => {
    const size = openingRenderSize(w, h, MOBILE_OPENING_QUALITY.maxPixels);
    expect(size.width * size.height).toBeLessThanOrEqual(MOBILE_OPENING_QUALITY.maxPixels);
    expect(size.width).toBeLessThanOrEqual(Math.max(1, w));
    expect(size.height).toBeLessThanOrEqual(Math.max(1, h));
  });
});

describe('opening renderer lifecycle', () => {
  function setup(floatTarget = true) {
    const renderer = {
      toneMapping: THREE.NoToneMapping, toneMappingExposure: .8, autoClear: true,
      target: null as THREE.WebGLRenderTarget | null,
      targets: [] as THREE.WebGLRenderTarget[],
      extensions: { has: () => floatTarget },
      getClearColor: (color: THREE.Color) => color.set(0), getClearAlpha: () => 1,
      setClearColor: vi.fn(), clear: vi.fn(),
      getRenderTarget() { return this.target; },
      setRenderTarget(target: THREE.WebGLRenderTarget | null) { this.target = target; if (target) this.targets.push(target); },
      getDrawingBufferSize(size: THREE.Vector2) { return size.set(1179, 2556); },
      compile: vi.fn(), render: vi.fn((_scene: THREE.Scene, _camera: THREE.Camera) => {}),
    };
    const opening = new CampaignOpeningPresentation();
    const scene = new THREE.Scene(), camera = new CameraController().camera;
    const typed = renderer as unknown as THREE.WebGLRenderer;
    opening.prepare(typed, scene, camera, false);
    return { renderer, typed, opening, scene, camera };
  }

  it.each([true, false])('warms both locations once and restores renderer state (float target: %s)', floating => {
    const { renderer, typed, opening, scene, camera } = setup(floating);
    expect(renderer.render.mock.calls.filter(([object]) => object instanceof THREE.Scene)).toHaveLength(6);
    opening.prepare(typed, scene, camera, false);
    expect(renderer.render.mock.calls.filter(([object]) => object instanceof THREE.Scene)).toHaveLength(6);
    for (const time of [8, 15, 32.1, 32.5, 34.9]) {
      opening.sample(time, camera, false); opening.render(typed, scene, camera);
      expect(renderer.target).toBeNull();
      expect(renderer.toneMapping).toBe(THREE.NoToneMapping);
      expect(renderer.toneMappingExposure).toBe(.8);
      expect(renderer.autoClear).toBe(true);
    }
    opening.dispose(); opening.dispose();
  });

  it('bounds adaptive resolution and restores state even when rendering throws', () => {
    const { renderer, typed, opening, scene, camera } = setup();
    for (let frame = 0; frame < 500; frame++) opening.noteFrame(.06, typed, camera.aspect);
    opening.sample(8, camera, false); opening.render(typed, scene, camera);
    const source = renderer.render.mock.calls.at(-1)?.[0] as THREE.Scene;
    const material = (source.children[0] as THREE.Mesh).material as THREE.ShaderMaterial;
    const texture = material.uniforms.source.value as THREE.Texture;
    const dimensions = texture.image as { width: number; height: number };
    expect(dimensions.width * dimensions.height).toBeLessThanOrEqual(MOBILE_OPENING_QUALITY.minPixels);
    const release = vi.fn(); renderer.targets[0].addEventListener('dispose', release);
    renderer.render.mockImplementationOnce(() => { throw new Error('lost context'); });
    expect(() => opening.render(typed, scene, camera)).toThrow('lost context');
    expect(renderer.target).toBeNull();
    expect(renderer.toneMapping).toBe(THREE.NoToneMapping);
    opening.dispose(); opening.dispose();
    expect(release).toHaveBeenCalledTimes(1);
  });
});
