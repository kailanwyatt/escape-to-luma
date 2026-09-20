import { StyleSheet } from 'react-native';

import { color, type } from './tokens';

export const textStyles = StyleSheet.create({
  kicker: {
    ...type.micro,
    color: color.creamFaint,
    textTransform: 'uppercase',
  },
  brand: {
    ...type.display,
    color: color.white,
    textAlign: 'center',
    textShadowColor: color.cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  productLine: {
    ...type.headline,
    color: color.amber,
    textAlign: 'center',
  },
  tagline: {
    ...type.caption,
    color: color.creamMuted,
    textAlign: 'center',
    letterSpacing: 1.2,
  },
  title: {
    ...type.title,
    color: color.cream,
  },
  section: {
    ...type.label,
    color: color.creamMuted,
    textTransform: 'uppercase',
  },
  body: {
    ...type.body,
    color: color.cream,
  },
  bodyMuted: {
    ...type.body,
    color: color.creamMuted,
  },
  label: {
    ...type.label,
    color: color.cream,
  },
  labelCyan: {
    ...type.label,
    color: color.cyanBright,
  },
  labelAmber: {
    ...type.label,
    color: color.amber,
  },
  caption: {
    ...type.caption,
    color: color.creamFaint,
  },
  micro: {
    ...type.micro,
    color: color.creamFaint,
  },
  buttonPrimary: {
    ...type.label,
    color: color.inkText,
    letterSpacing: 2,
    fontSize: 14,
    fontWeight: '900',
  },
  buttonSecondary: {
    ...type.label,
    color: color.cyanBright,
  },
  buttonGhost: {
    ...type.caption,
    color: color.creamMuted,
  },
  quote: {
    ...type.micro,
    color: color.creamFaint,
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 1.5,
  },
});

export type TextRole = keyof typeof textStyles;

export function textRole(role: TextRole) {
  return textStyles[role];
}
