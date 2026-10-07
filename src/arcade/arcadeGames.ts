import type {TranslationKey} from '../i18n';
import {isEndlessUnlocked, type PersistentGameData} from '../persistence/GameSave';

/**
 * The Arcade catalog is intentionally independent from Home navigation. Add a
 * game here and its card will appear on the Arcade landing screen.
 */
export type ArcadeGameId = 'endlessVoyage';

export type ArcadeGame = {
  id: ArcadeGameId;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  availabilityKey: TranslationKey;
  unlocked: boolean;
};

export function arcadeGames(
  save: PersistentGameData,
  options: { unlockWebArcade?: boolean } = {},
): readonly ArcadeGame[] {
  const endlessUnlocked = options.unlockWebArcade || isEndlessUnlocked(save.campaign);
  return [
    {
      id: 'endlessVoyage',
      titleKey: 'arcadescreen.endless_voyage',
      descriptionKey: 'arcadescreen.endless_voyage_description',
      availabilityKey: endlessUnlocked
        ? 'arcadescreen.ready_to_launch'
        : 'arcadescreen.unlock_after_campaign',
      unlocked: endlessUnlocked,
    },
  ];
}
