export type ContainmentComposition = 'vessel' | 'research' | 'service' | 'security' | 'escape';
export type WorldPresentationProfile = {
  composition: ContainmentComposition;
  accent: number;
  alarm: number;
  signal: 'faint' | 'answering';
};
/** Presentation only. Authored challenge definitions remain authoritative. */
export function containmentProfile(level: number): WorldPresentationProfile {
  const composition = level === 1 ? 'vessel' : level <= 3 ? 'research' : level <= 7 ? 'service' : level <= 11 ? 'security' : 'escape';
  return { composition, accent: composition === 'escape' ? 0xffb84c : 0x64dce8,
    alarm: level < 8 ? 0 : (level - 7) / 8, signal: level === 15 ? 'answering' : 'faint' };
}
