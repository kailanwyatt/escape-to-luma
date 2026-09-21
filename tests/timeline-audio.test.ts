import { describe, it, expect, vi } from 'vitest';
import { TimelineAudio } from '../src/feedback/TimelineAudio';
function setup() {
  const player = {isLoaded: true, currentTime: 0, seekTo: vi.fn(async (_time: number) => {}), play: vi.fn(), pause: vi.fn()};
  return {player, transport: new TimelineAudio(player)};
}
const settle = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };
describe('cinematic audio lifecycle', () => {
  it('joins a late load at the current scene time', async () => {
    const {player, transport} = setup(); player.isLoaded = false;
    transport.sync(2); expect(player.seekTo).not.toHaveBeenCalled();
    player.isLoaded = true; transport.sync(8); await settle();
    expect(player.seekTo).toHaveBeenCalledWith(8); expect(player.play).toHaveBeenCalledTimes(1);
  });
  it('cannot start after skip while a seek is pending', async () => {
    const {player, transport} = setup(); let finish!: () => void;
    player.seekTo.mockImplementation(() => new Promise<void>(resolve => {finish = resolve;}));
    transport.sync(4); transport.stop(); finish(); await settle();
    expect(player.play).not.toHaveBeenCalled();
  });
  it('resumes at frozen scene time and never restarts the motif', async () => {
    const {player, transport} = setup(); transport.sync(13); await settle();
    transport.stop(); transport.sync(13); await settle();
    expect(player.seekTo.mock.calls.map(call => call[0])).toEqual([13, 13]);
  });
  it('mutes immediately and resynchronizes when enabled', async () => {
    const {player, transport} = setup(); transport.sync(3); await settle();
    transport.sync(4, false); transport.sync(9); await settle();
    expect(player.seekTo.mock.calls.map(call => call[0])).toEqual([3, 9]);
  });
  it('does not seek every frame but corrects substantial drift', async () => {
    const {player, transport} = setup(); transport.sync(0); await settle();
    transport.sync(.1); transport.sync(.3); expect(player.seekTo).toHaveBeenCalledTimes(1);
    transport.sync(2); await settle(); expect(player.seekTo).toHaveBeenCalledTimes(2);
  });
  it('contains rejected seek errors and allows a later retry', async () => {
    const {player} = setup(); const error = vi.fn(); const transport = new TimelineAudio(player, error);
    player.seekTo.mockRejectedValueOnce(new Error('unavailable'));
    transport.sync(0); await settle(); expect(error).toHaveBeenCalledTimes(1);
    transport.sync(1); await settle(); expect(player.play).toHaveBeenCalledTimes(1);
  });
});
