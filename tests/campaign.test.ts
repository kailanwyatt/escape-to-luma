import { describe, expect, it } from 'vitest';

import {
  applyLevelSuccess,
  canStartLevel,
} from '../src/campaign/CampaignPlay';
import { getCampaignLevel, getPlayableCampaignLevels } from '../src/campaign/levels';
import { buildWorlds3to10 } from '../src/campaign/levels/worldsPack';
import { WORLDS } from '../src/campaign/worlds';
import { ECONOMY } from '../src/config/economy';
import { emptySave } from '../src/persistence/GameSave';

describe('campaign progression', () => {
  it('contains every visible level and finale', () => {
    const levels = getPlayableCampaignLevels();
    expect(levels).toHaveLength(150);
    expect(levels.map((level) => level.levelNumber)).toEqual(
      Array.from({ length: 150 }, (_, index) => index + 1),
    );
    for (const world of WORLDS) {
      expect(world.stub).toBe(false);
      expect(getCampaignLevel(world.lastLevel)?.isWorldFinale).toBe(true);
    }
  });

  it('generates later worlds deterministically', () => {
    expect(JSON.stringify(buildWorlds3to10())).toBe(JSON.stringify(buildWorlds3to10()));
  });

  it('starts with a static containment-glass escape', () => {
    const first = getCampaignLevel(1)!;
    expect(first.storyBeat).toBe('ESCAPE THE GLASS');
    expect(first.challenge.obstacles).toHaveLength(1);
    expect(first.challenge.obstacles[0]).toMatchObject({
      type: 'slidingGate',
      appearance: 'containmentGlass',
      amplitude: 0,
      speed: 0,
    });
  });

  it('introduces level 8 with three horizontal lasers moving vertically', () => {
    expect(getCampaignLevel(8)?.challenge.obstacles[0]).toMatchObject({
      type: 'laserGrid',
      orientation: 'horizontal',
      pattern: 'HORIZONTAL_WAVE',
      beamCount: 3,
      amplitude: 0.28,
      speed: 0.72,
      phaseOffset: 1.5,
    });
  });

  it('gives every campaign laser an independent beam pattern', () => {
    const lasers = getPlayableCampaignLevels().flatMap((level) =>
      level.challenge.obstacles.filter((obstacle) => obstacle.type === 'laserGrid'),
    );
    expect(lasers.length).toBeGreaterThan(0);
    for (const laser of lasers) {
      if (laser.type !== 'laserGrid') {
        continue;
      }
      expect(laser.pattern).toBeTruthy();
      expect(laser.beamCount).toBeGreaterThanOrEqual(3);
      expect(laser.amplitude).toBeGreaterThan(0);
      expect(laser.speed).toBeGreaterThan(0);
    }
  });

  it('awards a world finale only once', () => {
    const definition = getCampaignLevel(15)!;
    const first = applyLevelSuccess(emptySave(), definition, 'CLEAR', 0);
    const shardsAfterFirst = first.save.campaign.shards;
    expect(first.worldComplete).toBe(true);
    expect(first.save.campaign.stats.worldsCompleted).toBe(1);
    expect(first.shardsGained).toBeGreaterThanOrEqual(ECONOMY.shards.worldCompletion);

    const replay = applyLevelSuccess(first.save, definition, 'CLEAR', 0);
    expect(replay.worldComplete).toBe(false);
    expect(replay.save.campaign.stats.worldsCompleted).toBe(1);
    expect(replay.save.campaign.shards).toBe(shardsAfterFirst + ECONOMY.shards.repeatClear);
  });

  it('unlocks World 3 normally after level 30', () => {
    const save = emptySave();
    save.campaign.highestUnlockedLevel = 30;
    save.campaign.unlockedWorldIds.push('city');
    const result = applyLevelSuccess(save, getCampaignLevel(30)!, 'GREAT', 0);
    expect(result.nextLevel).toBe(31);
    expect(result.save.campaign.highestUnlockedLevel).toBe(31);
    expect(result.save.campaign.unlockedWorldIds).toContain('sky');
  });

  it('marks the full campaign complete without level 151', () => {
    const save = emptySave();
    save.campaign.highestUnlockedLevel = 150;
    const result = applyLevelSuccess(save, getCampaignLevel(150)!, 'CLEAR', 0);
    expect(result.campaignComplete).toBe(true);
    expect(result.nextLevel).toBe(150);
    expect(result.save.campaign.campaignCompleted).toBe(true);
  });

  it('does not repeat the ending or finale rewards after reaching home', () => {
    const finale = getCampaignLevel(150)!;
    const first = applyLevelSuccess(emptySave(), finale, 'CLEAR', 0);
    expect(first.campaignComplete).toBe(true);
    const replay = applyLevelSuccess(first.save, finale, 'CLEAR', 0);
    expect(replay.campaignComplete).toBe(false);
    expect(replay.worldComplete).toBe(false);
    expect(replay.shardsGained).toBe(ECONOMY.shards.repeatClear);
    expect(replay.save.campaign.campaignCompleted).toBe(true);
    for (const number of [1, 44, 68, 91, 149]) {
      const result = applyLevelSuccess(replay.save, getCampaignLevel(number)!, 'CLEAR', 0);
      expect(result.campaignComplete).toBe(false);
      expect(result.save.campaign.campaignCompleted).toBe(true);
    }
    // A previously uncleared world finale may award its own reward, never the ending.
    const world = applyLevelSuccess(replay.save, getCampaignLevel(30)!, 'CLEAR', 0);
    expect(world.worldComplete).toBe(true);
    expect(world.campaignComplete).toBe(false);
  });

  it('enforces energy for new levels and preserves level locks', () => {
    const save = emptySave();
    save.campaign.currentEnergy = 0;
    expect(canStartLevel(save.campaign, 1)).toEqual({ ok: false, reason:'energy' });
    expect(canStartLevel(save.campaign, 2).reason).toBe('locked');
    expect(canStartLevel(save.campaign, 151).reason).toBe('missing');
  });
});
