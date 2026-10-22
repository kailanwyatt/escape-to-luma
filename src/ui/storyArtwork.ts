import type {StoryMoment} from '../campaign/StoryMoments';
import {worldForLevel} from '../campaign/worlds';
import type {RuntimeAssetId} from '../graphics/assetRegistry';
import {journeyLookFor} from './journeyPresentation';

export function storyArtwork(story: Pick<StoryMoment, 'id' | 'visual'>, level: number): RuntimeAssetId {
  if (story.visual === 'reunion') return 'world.homewardBackdrop';
  if (story.visual === 'key') return 'world.networkBackdrop';
  if (story.visual === 'relay') return 'world.nebulaBackdrop';
  if (story.id === 'containment.first-escape') return 'story.04';
  const world = story.id.startsWith('departure.') ? story.id.split('.')[1] : worldForLevel(level)?.id ?? 'containment';
  return journeyLookFor(world).image ?? 'story.03';
}
