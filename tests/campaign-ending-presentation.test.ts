import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { createCinematicBloom, disposeCinematicBloom } from '../src/scene/CinematicGrade';
import { CampaignEndingPresentation, ENDING_PIXEL_BUDGET } from '../src/scene/CampaignEndingPresentation';

function setup(hdr = true) {
  const renderer = {
    toneMapping: THREE.NoToneMapping, toneMappingExposure: .8, autoClear: true,
    target: null as THREE.WebGLRenderTarget | null,
    targets: new Set<THREE.WebGLRenderTarget>(),
    extensions: { has: () => hdr },
    getClearColor: (c: THREE.Color) => c.set(0), getClearAlpha: () => 1,
    setClearColor: vi.fn(), clear: vi.fn(),
    getRenderTarget() { return this.target; },
    setRenderTarget(t: THREE.WebGLRenderTarget | null) { this.target = t; if (t) this.targets.add(t); },
    getDrawingBufferSize: (v: THREE.Vector2) => v.set(1290, 2796),
    compile: vi.fn(), render: vi.fn(),
  };
  const typed = renderer as unknown as THREE.WebGLRenderer, ending = new CampaignEndingPresentation(), gameplay = vi.fn();
  const frame = (dt = .1) => { ending.advance(dt, typed, 390 / 844, false); ending.render(typed, gameplay); };
  return { renderer, typed, ending, gameplay, frame };
}

describe('mobile ending handoff', () => {
  it('releases the bloom threshold material as well as its render targets', () => {
    const bloom = createCinematicBloom(), dispose = vi.spyOn(bloom.materialHighPassFilter, 'dispose');
    disposeCinematicBloom(bloom); expect(dispose).toHaveBeenCalledOnce();
  });
  it.each([true, false])('covers gameplay before allocating and warming the film (HDR: %s)', hdr => {
    const { renderer, ending, gameplay, frame, typed } = setup(hdr);
    ending.begin(0x7ef0ff);
    ending.advance(1, typed, 390 / 844, false);
    for (let i = 0; i < 3; i++) ending.advance(.1, typed, 390 / 844, false);
    expect(renderer.targets.size).toBe(0); expect(ending.ready).toBe(false);
    ending.render(typed, gameplay);
    expect(gameplay).toHaveBeenCalledOnce();
    for (let i = 0; i < 10 && !ending.ready; i++) { frame(); expect(ending.time).toBe(0); }
    expect(ending.ready).toBe(true); expect(ending.copyOpacity).toBe(0);
    expect(gameplay).toHaveBeenCalledOnce();
    for (const target of renderer.targets) {
      expect(target.width * target.height).toBeLessThanOrEqual(ENDING_PIXEL_BUDGET.max);
      expect(target.texture.type).toBe(hdr ? THREE.HalfFloatType : THREE.UnsignedByteType);
    }
    frame(1.1); expect(ending.copyOpacity).toBe(1);
    expect(renderer.target).toBeNull(); expect(renderer.toneMapping).toBe(THREE.NoToneMapping);
    expect(renderer.toneMappingExposure).toBe(.8); expect(renderer.autoClear).toBe(true);
    ending.dispose();
  });

  it('caps sustained slow rendering, reuses the warmed film for replay, and releases every target once', () => {
    const { renderer, typed, ending, frame } = setup(); ending.begin(0x7ef0ff);
    for (let i = 0; i < 20 && !ending.ready; i++) frame();
    for (let i = 0; i < 300; i++) ending.noteFrame(.05, typed, 390 / 844);
    for (const target of renderer.targets) expect(target.width * target.height).toBeLessThanOrEqual(ENDING_PIXEL_BUDGET.min);
    ending.skip(false); expect(ending.complete).toBe(true);
    const targets = [...renderer.targets];
    ending.begin(0x7ef0ff);
    for (let i = 0; i < 20 && !ending.ready; i++) frame();
    expect([...renderer.targets]).toEqual(targets); expect(ending.time).toBe(0);
    const disposed = targets.map(t => vi.spyOn(t, 'dispose'));
    ending.release(); ending.dispose(); ending.dispose();
    expect(ending.active).toBe(false); disposed.forEach(spy => expect(spy).toHaveBeenCalledOnce());
  });

  it('restores renderer state if a film render is interrupted', () => {
    const { renderer, typed, ending, frame, gameplay } = setup(); ending.begin(0x7ef0ff);
    for (let i = 0; i < 20 && !ending.ready; i++) frame();
    renderer.render.mockImplementationOnce(() => { throw Error('context interrupted'); });
    expect(() => ending.render(typed, gameplay)).toThrow('context interrupted');
    expect(renderer.target).toBeNull(); expect(renderer.toneMapping).toBe(THREE.NoToneMapping);
    expect(renderer.autoClear).toBe(true); ending.dispose();
  });
});
