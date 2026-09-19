const seen = new Set<string>();

export const GameLog = {
  warnOnce(key: string, message: string): void {
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    console.warn(`[Aperture] ${message}`);
  },
};
