import {t} from '../i18n';
import type { RuntimeAssetId } from '../graphics/assetRegistry';

export type SkinAcquisition = 'default' | 'shards' | 'world_completion' | 'mastery' | 'premium';

export type SparkOrbitStyle = 'calm' | 'reactor' | 'neon' | 'storm';
export type SparkTrailMode = 'soft' | 'hot' | 'ribbon';

export type SparkVisualProfile = {
  orbitStyle: SparkOrbitStyle;
  pulseRate: number;
  trailMode: SparkTrailMode;
  shellOpacity: number;
  glowScale: number;
  orbitSpeed: number;
  portraitAssetId?: RuntimeAssetId;
};

export type SparkDefinition = {
  id: string;
  name: string;
  acquisition: SkinAcquisition;
  shardCost?: number;
  worldId?: string;
  premium?: boolean;
  color: number;
  emissive: number;
  emissiveIntensity: number;
  shininess: number;
  trailWidth: number;
  trailColor: number;
  visualProfile?: SparkVisualProfile;
};

const DEFAULT_PROFILE: SparkVisualProfile = {
  orbitStyle: 'calm',
  pulseRate: 1,
  trailMode: 'soft',
  shellOpacity: 0.24,
  glowScale: 1,
  orbitSpeed: 1,
};

export const SPARK_CATALOG: SparkDefinition[] = [
  {
    id: 'original',
    name: t("sparks.original"),
    acquisition: 'default',
    color: 0x7ef0ff,
    emissive: 0x1aa8b8,
    emissiveIntensity: 0.7,
    shininess: 80,
    trailWidth: 0.07,
    trailColor: 0x7ef0ff,
    visualProfile: {
      orbitStyle: 'calm',
      pulseRate: 1,
      trailMode: 'soft',
      shellOpacity: 0.24,
      glowScale: 1,
      orbitSpeed: 1,
      portraitAssetId: 'spark.original',
    },
  },
  {
    id: 'neon',
    name: t("sparks.neon"),
    acquisition: 'world_completion',
    worldId: 'city',
    color: 0xff4ad2,
    emissive: 0xff2fb2,
    emissiveIntensity: 0.95,
    shininess: 60,
    trailWidth: 0.09,
    trailColor: 0xff7ae0,
    visualProfile: {
      orbitStyle: 'neon',
      pulseRate: 1.45,
      trailMode: 'hot',
      shellOpacity: 0.32,
      glowScale: 1.18,
      orbitSpeed: 1.55,
      portraitAssetId: 'spark.neon',
    },
  },
  {
    id: 'solar',
    name: t("sparks.solar"),
    acquisition: 'shards',
    shardCost: 1000,
    color: 0xffb020,
    emissive: 0xff7a00,
    emissiveIntensity: 0.85,
    shininess: 50,
    trailWidth: 0.09,
    trailColor: 0xffd060,
  },
  {
    id: 'frost',
    name: t("sparks.frost"),
    acquisition: 'shards',
    shardCost: 800,
    color: 0xe8f6ff,
    emissive: 0x7ec8ff,
    emissiveIntensity: 0.5,
    shininess: 100,
    trailWidth: 0.07,
    trailColor: 0xb8e4ff,
  },
  {
    id: 'storm',
    name: t("sparks.storm"),
    acquisition: 'shards',
    shardCost: 1200,
    color: 0x9eb4ff,
    emissive: 0x4a6cff,
    emissiveIntensity: 0.75,
    shininess: 70,
    trailWidth: 0.08,
    trailColor: 0xc0d0ff,
    visualProfile: {
      orbitStyle: 'storm',
      pulseRate: 1.2,
      trailMode: 'ribbon',
      shellOpacity: 0.28,
      glowScale: 1.1,
      orbitSpeed: 1.25,
    },
  },
  {
    id: 'aurora',
    name: t("sparks.aurora"),
    acquisition: 'world_completion',
    worldId: 'atmosphere',
    color: 0x6dffc8,
    emissive: 0x2bff9a,
    emissiveIntensity: 0.9,
    shininess: 65,
    trailWidth: 0.09,
    trailColor: 0xa0ffe0,
  },
  {
    id: 'plasma',
    name: t("sparks.plasma"),
    acquisition: 'shards',
    shardCost: 1500,
    color: 0xb07cff,
    emissive: 0x6a2bff,
    emissiveIntensity: 0.95,
    shininess: 70,
    trailWidth: 0.08,
    trailColor: 0xc9a0ff,
  },
  {
    id: 'lunar',
    name: t("sparks.lunar"),
    acquisition: 'world_completion',
    worldId: 'moon',
    color: 0xd8dde8,
    emissive: 0x8890a8,
    emissiveIntensity: 0.4,
    shininess: 90,
    trailWidth: 0.06,
    trailColor: 0xc8d0e0,
  },
  {
    id: 'meteor',
    name: t("sparks.meteor"),
    acquisition: 'world_completion',
    worldId: 'asteroid',
    color: 0xff7a2a,
    emissive: 0xff3b00,
    emissiveIntensity: 0.85,
    shininess: 40,
    trailWidth: 0.1,
    trailColor: 0xffb060,
  },
  {
    id: 'nebula',
    name: t("sparks.nebula"),
    acquisition: 'world_completion',
    worldId: 'nebula',
    color: 0xc070ff,
    emissive: 0x8020ff,
    emissiveIntensity: 0.9,
    shininess: 55,
    trailWidth: 0.09,
    trailColor: 0xe0a0ff,
  },
  {
    id: 'void',
    name: t("sparks.void"),
    acquisition: 'shards',
    shardCost: 2500,
    color: 0x2a1848,
    emissive: 0xb07cff,
    emissiveIntensity: 1.05,
    shininess: 30,
    trailWidth: 0.1,
    trailColor: 0xd4b8ff,
  },
  {
    id: 'reactor',
    name: t("sparks.reactor"),
    acquisition: 'world_completion',
    worldId: 'containment',
    color: 0x7dff9a,
    emissive: 0x2cff6a,
    emissiveIntensity: 0.88,
    shininess: 75,
    trailWidth: 0.085,
    trailColor: 0xa8ffc0,
    visualProfile: {
      orbitStyle: 'reactor',
      pulseRate: 1.25,
      trailMode: 'ribbon',
      shellOpacity: 0.3,
      glowScale: 1.14,
      orbitSpeed: 1.35,
      portraitAssetId: 'spark.reactor',
    },
  },
  {
    id: 'ancient',
    name: t("sparks.ancient"),
    acquisition: 'mastery',
    color: 0xffd24a,
    emissive: 0xc48a12,
    emissiveIntensity: 0.55,
    shininess: 110,
    trailWidth: 0.07,
    trailColor: 0xffe08a,
  },
  {
    id: 'origin',
    name: t("sparks.origin"),
    acquisition: 'world_completion',
    worldId: 'homeward',
    color: 0xffffff,
    emissive: 0x7ef0ff,
    emissiveIntensity: 1.0,
    shininess: 120,
    trailWidth: 0.11,
    trailColor: 0xffffff,
  },
  {
    id: 'prism',
    name: t("sparks.prism"),
    acquisition: 'premium',
    premium: true,
    color: 0xffe0ff,
    emissive: 0xff80ff,
    emissiveIntensity: 0.95,
    shininess: 100,
    trailWidth: 0.09,
    trailColor: 0xffffff,
  },
];

export const DEFAULT_SPARK_ID = 'original';

export function sparkById(id: string): SparkDefinition {
  return SPARK_CATALOG.find((spark) => spark.id === id) ?? SPARK_CATALOG[0];
}

export function sparkVisualProfile(spark: SparkDefinition): SparkVisualProfile {
  return spark.visualProfile ?? DEFAULT_PROFILE;
}
