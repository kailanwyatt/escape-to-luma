import { Asset } from 'expo-asset';

export type AssetPreloadGroup = 'boot' | 'world1' | 'world2' | 'optional';
export type RuntimeAssetKind = 'image' | 'model' | 'audio';

export type RuntimeAssetId =
  | 'world.nebulaBackdrop'
  | 'world.networkBackdrop'
  | 'world.homewardBackdrop'
  | 'world.cityBanner'
  | 'world.lockdownBanner'
  | 'world.ascentBanner'
  | 'world.stormBanner'
  | 'world.skyGoldBanner'
  | 'world.orbitBanner'
  | 'world.moonBanner'
  | 'world.beltBanner'
  | 'world.driftBanner'
  | 'world.lumaBanner'
  | 'home.cityGateway'
  | 'brand.wordmark'
  | 'ui.energy.full'
  | 'ui.energy.empty'
  | 'ui.shard'
  | 'ui.heart.full'
  | 'ui.heart.empty'
  | 'story.openingScore'
  | 'story.01'
  | 'story.02'
  | 'story.03'
  | 'story.04'
  | 'story.05'
  | 'spark.original'
  | 'spark.reactor'
  | 'spark.neon'
  | 'target.jumpGate'
  | 'world1.containment'
  | 'world1.crackEscape'
  | 'world1.rotor'
  | 'world1.gate'
  | 'world1.laser'
  | 'world2.rooftop'
  | 'world2.wind'
  | 'optional.gravityWell';

export type RuntimeAssetEntry = {
  id: RuntimeAssetId;
  kind: RuntimeAssetKind;
  group: AssetPreloadGroup;
  version: number;
  source: number | null;
  fallback: string;
  disposalOwner: 'expo-asset' | 'three-scene' | 'react-native' | 'audio-manager';
};

const entries: RuntimeAssetEntry[] = [
  { id: 'world.nebulaBackdrop', kind: 'image', group: 'optional', version: 1, source: require('../../assets/art/worlds/nebula.jpg'), fallback: '3D scenery and starfield', disposalOwner: 'three-scene' },
  { id: 'world.networkBackdrop', kind: 'image', group: 'optional', version: 1, source: require('../../assets/art/worlds/network.jpg'), fallback: '3D scenery and starfield', disposalOwner: 'three-scene' },
  { id: 'world.homewardBackdrop', kind: 'image', group: 'optional', version: 1, source: require('../../assets/art/worlds/homeward.jpg'), fallback: '3D scenery and starfield', disposalOwner: 'three-scene' },
  { id: 'world.cityBanner', kind: 'image', group: 'boot', version: 1, source: require('../../assets/art/worlds/city/neon-night-wide.png'), fallback: 'city sky gradient', disposalOwner: 'react-native' },
  { id: 'world.lockdownBanner', kind: 'image', group: 'boot', version: 1, source: require('../../assets/art/worlds/city/construction-wide.png'), fallback: 'lockdown sky gradient', disposalOwner: 'react-native' },
  { id: 'world.ascentBanner', kind: 'image', group: 'boot', version: 1, source: require('../../assets/art/worlds/sky/sunlit-updraft-wide.png'), fallback: 'ascent sky gradient', disposalOwner: 'react-native' },
  { id: 'world.stormBanner', kind: 'image', group: 'boot', version: 1, source: require('../../assets/art/worlds/sky/stormfront-drift-wide.png'), fallback: 'storm sky gradient', disposalOwner: 'react-native' },
  { id: 'world.skyGoldBanner', kind: 'image', group: 'boot', version: 1, source: require('../../assets/art/worlds/sky/golden-cloudfalls-wide.png'), fallback: 'upper atmosphere gradient', disposalOwner: 'react-native' },
  { id: 'world.orbitBanner', kind: 'image', group: 'boot', version: 1, source: require('../../assets/art/worlds/space/orbit-wide.jpg'), fallback: 'orbit sky gradient', disposalOwner: 'react-native' },
  { id: 'world.moonBanner', kind: 'image', group: 'boot', version: 1, source: require('../../assets/art/worlds/space/moon-wide.jpg'), fallback: 'moon sky gradient', disposalOwner: 'react-native' },
  { id: 'world.beltBanner', kind: 'image', group: 'boot', version: 1, source: require('../../assets/art/worlds/space/belt-wide.jpg'), fallback: 'belt sky gradient', disposalOwner: 'react-native' },
  { id: 'world.driftBanner', kind: 'image', group: 'boot', version: 1, source: require('../../assets/art/worlds/space/drift-wide.jpg'), fallback: 'drift sky gradient', disposalOwner: 'react-native' },
  { id: 'world.lumaBanner', kind: 'image', group: 'boot', version: 1, source: require('../../assets/art/worlds/luma-celebration-v2.png'), fallback: 'homeward backdrop', disposalOwner: 'react-native' },

  { id: 'home.cityGateway', kind: 'image', group: 'boot', version: 1, source: require('../../assets/art/home/city-gateway.jpg'), fallback: 'navy home background', disposalOwner: 'react-native' },
  { id: 'story.openingScore', kind: 'audio', group: 'optional', version: 1,
    source: require('../../assets/sfx/opening-score.wav'), fallback: 'silent cinematic with captions', disposalOwner: 'audio-manager' },
  { id: 'brand.wordmark', kind: 'image', group: 'boot', version: 2, source: require('../../assets/art/brand/spark-wordmark.png'), fallback: 'BrandWordmark text', disposalOwner: 'react-native' },
  { id: 'ui.energy.full', kind: 'image', group: 'boot', version: 1, source: require('../../assets/art/shop/currency-icons.png'), fallback: 'energy glyph', disposalOwner: 'react-native' },
  { id: 'ui.energy.empty', kind: 'image', group: 'boot', version: 1, source: require('../../assets/art/shop/currency-icons.png'), fallback: 'energy outline glyph', disposalOwner: 'react-native' },
  { id: 'ui.shard', kind: 'image', group: 'boot', version: 1, source: require('../../assets/art/shop/currency-icons.png'), fallback: 'diamond glyph', disposalOwner: 'react-native' },
  { id: 'ui.heart.full', kind: 'image', group: 'optional', version: 1, source: null, fallback: 'filled heart glyph', disposalOwner: 'react-native' },
  { id: 'ui.heart.empty', kind: 'image', group: 'optional', version: 1, source: null, fallback: 'empty heart glyph', disposalOwner: 'react-native' },
  {
    id: 'story.01',
    kind: 'image',
    group: 'optional',
    version: 1,
    source: require('../../assets/art/story/story-01-living-light.png'),
    fallback: 'ContainmentScene living',
    disposalOwner: 'expo-asset',
  },
  {
    id: 'story.02',
    kind: 'image',
    group: 'optional',
    version: 1,
    source: require('../../assets/art/story/story-02-found.png'),
    fallback: 'ContainmentScene found',
    disposalOwner: 'expo-asset',
  },
  {
    id: 'story.03',
    kind: 'image',
    group: 'optional',
    version: 1,
    source: require('../../assets/art/story/story-03-signal.png'),
    fallback: 'ContainmentScene signal',
    disposalOwner: 'expo-asset',
  },
  {
    id: 'story.04',
    kind: 'image',
    group: 'optional',
    version: 1,
    source: require('../../assets/art/story/story-04-breach.png'),
    fallback: 'ContainmentScene breach',
    disposalOwner: 'expo-asset',
  },
  {
    id: 'story.05',
    kind: 'image',
    group: 'optional',
    version: 1,
    source: require('../../assets/art/story/story-05-mission.png'),
    fallback: 'ContainmentScene mission',
    disposalOwner: 'expo-asset',
  },
  {
    id: 'spark.original',
    kind: 'image',
    group: 'world1',
    version: 1,
    source: require('../../assets/art/sparks/spark-original.png'),
    fallback: 'procedural layered Spark',
    disposalOwner: 'expo-asset',
  },
  {
    id: 'spark.reactor',
    kind: 'image',
    group: 'world1',
    version: 1,
    source: require('../../assets/art/sparks/spark-reactor.png'),
    fallback: 'procedural Reactor tint',
    disposalOwner: 'expo-asset',
  },
  {
    id: 'spark.neon',
    kind: 'image',
    group: 'world2',
    version: 1,
    source: require('../../assets/art/sparks/spark-neon.png'),
    fallback: 'procedural Neon tint',
    disposalOwner: 'expo-asset',
  },
  { id: 'target.jumpGate', kind: 'model', group: 'world1', version: 2, source: null, fallback: 'procedural dimensional Jump Gate', disposalOwner: 'three-scene' },
  { id: 'world1.containment', kind: 'model', group: 'world1', version: 1, source: null, fallback: 'procedural workshop kit', disposalOwner: 'three-scene' },
  {
    id: 'world1.crackEscape',
    kind: 'image',
    group: 'optional',
    version: 1,
    source: require('../../assets/art/world1/containment-crack-escape.png'),
    fallback: 'procedural vessel + breach',
    disposalOwner: 'expo-asset',
  },
  { id: 'world1.rotor', kind: 'model', group: 'world1', version: 1, source: null, fallback: 'procedural modular rotor', disposalOwner: 'three-scene' },
  { id: 'world1.gate', kind: 'model', group: 'world1', version: 1, source: null, fallback: 'procedural sliding gate', disposalOwner: 'three-scene' },
  { id: 'world1.laser', kind: 'model', group: 'world1', version: 1, source: null, fallback: 'procedural emitters and beams', disposalOwner: 'three-scene' },
  { id: 'world2.rooftop', kind: 'model', group: 'world2', version: 1, source: null, fallback: 'procedural rooftop kit', disposalOwner: 'three-scene' },
  { id: 'world2.wind', kind: 'image', group: 'world2', version: 1, source: null, fallback: 'procedural wind streaks', disposalOwner: 'three-scene' },
  { id: 'optional.gravityWell', kind: 'image', group: 'optional', version: 1, source: null, fallback: 'procedural gravity rings', disposalOwner: 'three-scene' },
];

const registry = new Map(entries.map((entry) => [entry.id, entry]));
const disposers = new Map<RuntimeAssetId, Set<() => void>>();
const missingReported = new Set<RuntimeAssetId>();

export function assetCacheKey(id: RuntimeAssetId): string {
  const entry = getRuntimeAsset(id);
  return `${entry.id}@${entry.version}`;
}

export function getRuntimeAsset(id: RuntimeAssetId): RuntimeAssetEntry {
  const entry = registry.get(id);
  if (!entry) {
    throw new Error(`Unknown runtime asset: ${id}`);
  }
  if (__DEV__ && entry.source === null && !missingReported.has(id)) {
    missingReported.add(id);
    console.info(`[assets] ${assetCacheKeyUnsafe(entry)} uses fallback: ${entry.fallback}`);
  }
  return entry;
}

export function getAssetSource(id: RuntimeAssetId): number | null {
  return getRuntimeAsset(id).source;
}

export async function preloadAssetGroup(group: AssetPreloadGroup): Promise<void> {
  const assets = entries
    .filter((entry) => entry.group === group && entry.source !== null)
    .map((entry) => Asset.fromModule(entry.source as number));
  await Promise.all(assets.map((asset) => asset.downloadAsync()));
}

export function registerAssetDisposer(id: RuntimeAssetId, dispose: () => void): () => void {
  const set = disposers.get(id) ?? new Set<() => void>();
  set.add(dispose);
  disposers.set(id, set);
  return () => set.delete(dispose);
}

export function disposeAssetGroup(group: AssetPreloadGroup): void {
  for (const entry of entries) {
    if (entry.group !== group || entry.disposalOwner !== 'three-scene') {
      continue;
    }
    for (const dispose of disposers.get(entry.id) ?? []) {
      dispose();
    }
    disposers.delete(entry.id);
  }
}

export function runtimeAssetDiagnostics(): {
  loaded: string[];
  fallbacks: string[];
} {
  return {
    loaded: entries.filter((entry) => entry.source !== null).map(assetCacheKeyUnsafe),
    fallbacks: entries
      .filter((entry) => entry.source === null)
      .map((entry) => `${assetCacheKeyUnsafe(entry)} → ${entry.fallback}`),
  };
}

function assetCacheKeyUnsafe(entry: RuntimeAssetEntry): string {
  return `${entry.id}@${entry.version}`;
}
