/**
 * SPARK design tokens — Escape to Luma.
 * Aligned with landing concept (deep space, cyan Spark, gold CTA).
 */

export const color = {
  ink: '#050B15',
  inkElevated: '#0A1524',
  inkSoft: '#0F1C2E',
  panel: 'rgba(8, 22, 40, 0.78)',
  panelBorder: 'rgba(0, 200, 255, 0.35)',
  cream: '#F4EFE6',
  creamMuted: 'rgba(244,239,230,0.7)',
  creamFaint: 'rgba(244,239,230,0.45)',
  amber: '#FFB800',
  amberBright: '#FFD54A',
  amberDim: 'rgba(255,184,0,0.45)',
  copper: '#FF8A00',
  copperHot: '#FFB020',
  cyan: '#00CCFF',
  cyanBright: '#7EF0FF',
  cyanDim: 'rgba(0,204,255,0.55)',
  cyanGlow: 'rgba(0,180,255,0.25)',
  energy: '#FFD54A',
  shard: '#7EF0FF',
  heart: '#FF5D6C',
  danger: '#FF3B3B',
  success: '#7EFFB0',
  overlay: 'rgba(5,11,21,0.55)',
  overlayHeavy: 'rgba(5,11,21,0.82)',
  stroke: 'rgba(0,200,255,0.22)',
  strokeStrong: 'rgba(0,204,255,0.45)',
  white: '#FFFFFF',
  inkText: '#0A0807',
} as const;

export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screenX: 20,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const type = {
  display: {
    fontSize: 52,
    fontWeight: '900' as const,
    letterSpacing: 8,
    lineHeight: 58,
  },
  title: {
    fontSize: 28,
    fontWeight: '900' as const,
    letterSpacing: 4,
    lineHeight: 34,
  },
  headline: {
    fontSize: 15,
    fontWeight: '800' as const,
    letterSpacing: 4,
    lineHeight: 20,
  },
  body: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.4,
    lineHeight: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '800' as const,
    letterSpacing: 1.5,
    lineHeight: 16,
  },
  caption: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    lineHeight: 14,
  },
  micro: {
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 2.5,
    lineHeight: 12,
  },
} as const;

export const zIndex = {
  screen: 1,
  hud: 10,
  modal: 20,
  toast: 30,
} as const;

export type ColorToken = keyof typeof color;
export type SpaceToken = keyof typeof space;
