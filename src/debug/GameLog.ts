const seen = new Set<string>();
const events: { at: string; level: 'info' | 'warn' | 'error'; message: string }[] = [];
const MAX_EVENTS = 80;

function record(level: 'info' | 'warn' | 'error', message: string): void {
  events.push({ at: new Date().toISOString(), level, message: message.slice(0, 500) });
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
}

export const GameLog = {
  info(message: string): void {
    record('info', message);
    if (__DEV__) {
      console.info(`[SPARK] ${message}`);
    }
  },
  warnOnce(key: string, message: string): void {
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    record('warn', message);
    console.warn(`[SPARK] ${message}`);
  },
  error(message: string, error?: unknown): void {
    const detail = error instanceof Error ? `${message}: ${error.message}` : message;
    record('error', detail);
    console.error(`[SPARK] ${detail}`);
  },
  snapshot(): readonly { at: string; level: 'info' | 'warn' | 'error'; message: string }[] {
    return [...events];
  },
};
