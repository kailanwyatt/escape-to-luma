import { useFonts as useOrbitron } from '@expo-google-fonts/orbitron/useFonts';
import { useFonts as useBarlow } from '@expo-google-fonts/barlow-condensed/useFonts';

// Import the used files directly. The package index requires every weight.
const Orbitron_700Bold = require('@expo-google-fonts/orbitron/700Bold/Orbitron_700Bold.ttf') as number;
const Orbitron_800ExtraBold = require('@expo-google-fonts/orbitron/800ExtraBold/Orbitron_800ExtraBold.ttf') as number;
const Orbitron_900Black = require('@expo-google-fonts/orbitron/900Black/Orbitron_900Black.ttf') as number;
const BarlowCondensed_400Regular = require('@expo-google-fonts/barlow-condensed/400Regular/BarlowCondensed_400Regular.ttf') as number;
const BarlowCondensed_600SemiBold = require('@expo-google-fonts/barlow-condensed/600SemiBold/BarlowCondensed_600SemiBold.ttf') as number;
const BarlowCondensed_700Bold = require('@expo-google-fonts/barlow-condensed/700Bold/BarlowCondensed_700Bold.ttf') as number;
const BarlowCondensed_800ExtraBold = require('@expo-google-fonts/barlow-condensed/800ExtraBold/BarlowCondensed_800ExtraBold.ttf') as number;

/** Display face — titles, ranks, wordmark-adjacent chrome. */
export const fontDisplay = 'Orbitron_800ExtraBold';
export const fontDisplayBlack = 'Orbitron_900Black';
export const fontDisplayBold = 'Orbitron_700Bold';

/** Condensed UI face — labels, HUD, buttons, meta. */
export const fontUi = 'BarlowCondensed_700Bold';
export const fontUiRegular = 'BarlowCondensed_400Regular';
export const fontUiSemi = 'BarlowCondensed_600SemiBold';
export const fontUiHeavy = 'BarlowCondensed_800ExtraBold';

export function useAppFonts(): boolean {
  const [orbitron] = useOrbitron({
    Orbitron_700Bold,
    Orbitron_800ExtraBold,
    Orbitron_900Black,
  });
  const [barlow] = useBarlow({
    BarlowCondensed_400Regular,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
  });
  return orbitron && barlow;
}
