import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('expo-asset', () => ({Asset: {fromModule: () => ({uri: 'local-score.wav'})}}));
vi.mock('../src/debug/GameLog', () => ({GameLog: {warnOnce: vi.fn()}}));
import { GameLog } from '../src/debug/GameLog';
import { createManagedAudioPlayer } from '../src/feedback/ManagedAudioPlayer.web';
class Media {
  readyState = 4;
  currentTime = 0;
  volume = 1;
  playbackRate = 1;
  preload = '';
  play = vi.fn(async () => {});
  pause = vi.fn();
  removeAttribute = vi.fn();
  load = vi.fn();
}
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe('web audio interruption ownership', () => {
  it('handles expected play/pause AbortError and releases the source', async () => {
    const media = new Media(); media.play.mockRejectedValue(new DOMException('paused', 'AbortError'));
    vi.stubGlobal('Audio', class { constructor() { return media; } });
    const player = createManagedAudioPlayer(1); player.play(); player.pause(); await settle();
    expect(GameLog.warnOnce).not.toHaveBeenCalled();
    player.release(); expect(media.removeAttribute).toHaveBeenCalledWith('src');
    expect(media.load).toHaveBeenCalledTimes(1);
  });
  it('reports actual playback refusal without an unhandled rejection', async () => {
    const media = new Media(); media.play.mockRejectedValue(new DOMException('blocked', 'NotAllowedError'));
    vi.stubGlobal('Audio', class { constructor() { return media; } });
    const player = createManagedAudioPlayer(1); player.play(); await settle();
    expect(GameLog.warnOnce).toHaveBeenCalledTimes(1);
    await player.seekTo(12); expect(media.currentTime).toBe(12);
  });
});
