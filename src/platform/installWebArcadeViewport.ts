/**
 * React Native Web sizes itself from window.visualViewport. The Arcade page
 * hosts the game in a cabinet that is smaller than the browser, so report that
 * element's box instead. The standalone /arcade/game/ document is unchanged.
 */

type ViewportListener = (event: Event) => void;

export function isEmbeddedWebArcade(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  const root = document.getElementById('root');
  return Boolean(root && root.parentElement && root.parentElement !== document.body);
}

export function installWebArcadeViewport(): void {
  if (
    process.env.EXPO_PUBLIC_WEB_MODE !== 'arcade' ||
    typeof window === 'undefined' ||
    typeof document === 'undefined'
  ) {
    return;
  }

  const root = document.getElementById('root');
  if (!root || root.parentElement === document.body) {
    return;
  }

  const real = window.visualViewport;
  const listeners = new Set<ViewportListener>();

  const notify = () => {
    const event = new Event('resize');
    listeners.forEach((listener) => listener(event));
  };

  const viewport = {
    get width() {
      return root.clientWidth;
    },
    get height() {
      return root.clientHeight;
    },
    get scale() {
      return 1;
    },
    offsetLeft: 0,
    offsetTop: 0,
    pageLeft: 0,
    pageTop: 0,
    addEventListener(type: string, listener: EventListener) {
      if (type === 'resize') {
        listeners.add(listener as ViewportListener);
      }
    },
    removeEventListener(type: string, listener: EventListener) {
      if (type === 'resize') {
        listeners.delete(listener as ViewportListener);
      }
    },
  };

  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    enumerable: true,
    get: () => viewport,
  });

  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(() => notify());
    observer.observe(root);
  }
  real?.addEventListener('resize', notify);
  window.addEventListener('resize', notify);
}

installWebArcadeViewport();
