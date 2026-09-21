import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => new Map<string, string>());

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      storage.delete(key);
    }),
  },
}));

import {
  SAVE_VERSION,
  emptySave,
  flushGameSaveWrites,
  loadGameSave,
  migrateSaveData,
  saveGameSave,
} from '../src/persistence/GameSave';

describe('save integrity', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('normalizes nested values and clamps numeric ranges', () => {
    const migrated = migrateSaveData(4, {
      playerProgress: {
        ...emptySave().playerProgress,
        totalXP: Number.POSITIVE_INFINITY,
      },
      campaign: {
        ...emptySave().campaign,
        highestUnlockedLevel: 999,
        currentEnergy: -20,
        shards: -5,
        lastPlayedLevel: 999,
        ownedSparkIds: ['unknown'],
        equippedSparkId: 'missing',
        boostInventory: {
          guidance: -1,
          slowField: 5_000,
          secondChance: Number.NaN,
          hyperjump: 2,
        },
        stats: undefined as never,
      },
    });
    expect(migrated.campaign.highestUnlockedLevel).toBe(150);
    expect(migrated.campaign.lastPlayedLevel).toBe(150);
    expect(migrated.campaign.currentEnergy).toBe(0);
    expect(migrated.campaign.shards).toBe(0);
    expect(migrated.campaign.boostInventory.guidance).toBe(0);
    expect(migrated.campaign.boostInventory.slowField).toBe(999);
    expect(migrated.campaign.ownedSparkIds).toContain('original');
    expect(migrated.campaign.equippedSparkId).toBe('original');
  });

  it('preserves story acknowledgements across saving and loading, and supports older saves', async () => {
    const save=emptySave();save.campaign.seenStoryIds=['containment.first-escape','arrival.level-4'];
    await saveGameSave(save);await flushGameSaveWrites();
    expect((await loadGameSave()).campaign.seenStoryIds).toEqual(save.campaign.seenStoryIds);
    const old=emptySave();delete old.campaign.seenStoryIds;
    expect(migrateSaveData(SAVE_VERSION,old).campaign.seenStoryIds).toEqual([]);
  });

  it('serializes writes and recovers the retained backup', async () => {
    const first = emptySave();
    first.campaign.shards = 10;
    const second = emptySave();
    second.campaign.shards = 20;

    await Promise.all([saveGameSave(first), saveGameSave(second)]);
    await flushGameSaveWrites();
    expect((await loadGameSave()).campaign.shards).toBe(20);

    storage.set('ball-game-cs.save.v1', '{broken');
    expect((await loadGameSave()).campaign.shards).toBe(10);
  });

  it('rejects future primary saves and uses a valid backup', async () => {
    const backup = emptySave();
    backup.campaign.shards = 42;
    storage.set('ball-game-cs.save.v1.backup', JSON.stringify(backup));
    storage.set(
      'ball-game-cs.save.v1',
      JSON.stringify({ ...emptySave(), saveVersion: SAVE_VERSION + 1 }),
    );
    expect((await loadGameSave()).campaign.shards).toBe(42);
  });
});
