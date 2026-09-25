import {
  Orbitron_700Bold,
  Orbitron_800ExtraBold,
  Orbitron_900Black,
  useFonts as useOrbitron,
} from '@expo-google-fonts/orbitron';
import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold,
  useFonts as useBarlow,
} from '@expo-google-fonts/barlow-condensed';

/** Display face — titles, ranks, wordmark-adjacent chrome. */
export const fontDisplay = 'Orbitron_800ExtraBold';
export const fontDisplayBlack = 'Orbitron_900Black';
export const fontDisplayBold = 'Orbitron_700Bold';

/** Condensed UI face — labels, HUD, buttons, meta. */
export const fontUi = 'BarlowCondensed_700Bold';
export const fontUiSemi = 'BarlowCondensed_600SemiBold';
export const fontUiHeavy = 'BarlowCondensed_800ExtraBold';

export function useAppFonts(): boolean {
  const [orbitron] = useOrbitron({
    Orbitron_700Bold,
    Orbitron_800ExtraBold,
    Orbitron_900Black,
  });
  const [barlow] = useBarlow({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
  });
  return orbitron && barlow;
}
