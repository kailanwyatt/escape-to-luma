/** A small transport driven by game time, independent of native audio APIs. */
export interface TimelinePlayer {
  readonly isLoaded: boolean;
  readonly currentTime: number;
  seekTo(seconds: number): Promise<void>;
  play(): void;
  pause(): void;
}

export class TimelineAudio {
  private revision = 0;
  private pending = false;
  private playing = false;
  private wanted: number | null = null;

  constructor(private readonly player: TimelinePlayer, private readonly onError: () => void = () => {}) {}

  sync(seconds: number | null, enabled = true): void {
    if (!enabled || seconds === null || !Number.isFinite(seconds)) {
      this.stop();
      return;
    }
    this.wanted = Math.max(0, seconds);
    if (!this.player.isLoaded || this.pending) return;
    // Expo status updates are sampled; tolerate minor clock skew rather than seek each frame.
    if (this.playing && Math.abs(this.player.currentTime - this.wanted) < 1) return;
    const revision = this.revision;
    const startAt = this.wanted;
    this.pending = true;
    this.playing = false;
    try {
      this.player.pause();
      void this.player.seekTo(startAt).then(() => {
        if (revision !== this.revision || this.wanted === null) return;
        // Slow loads must catch up to game time before playback, without replaying old cues.
        if (Math.abs(this.wanted - startAt) >= 1) return;
        this.player.play();
        this.playing = true;
      }).catch(this.onError).finally(() => { this.pending = false; });
    } catch {
      this.pending = false;
      this.onError();
    }
  }

  stop(): void {
    this.revision += 1;
    this.wanted = null;
    this.playing = false;
    try { this.player.pause(); } catch { this.onError(); }
  }
}
