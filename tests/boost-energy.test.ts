import {describe,it,expect} from 'vitest';
import {emptySave} from '../src/persistence/GameSave';
import {applyLevelFailure,consumeBoosts,canStartLevel} from '../src/campaign/CampaignPlay';
import {getCampaignLevel} from '../src/campaign/levels';
import {
  bumpRewardedEnergyAdCount,
  canWatchRewardedEnergyAd,
  energyRefillShardCost,
  missingEnergy,
  regenerateEnergy,
  rewardedEnergyAdsRemaining,
  msUntilFullEnergy,
  msUntilNextEnergy,
  utcDayKey,
} from '../src/economy/energy';
import {ECONOMY} from '../src/config/economy';
describe('consumable economy',()=>{
 it('consumes Portal Bloom alongside other boosts without mutating the original save',()=>{
  const c=emptySave().campaign;c.boostInventory.portalBloom=2;c.boostInventory.guidance=1;
  const n=consumeBoosts(c,{portalBloom:true,guidance:true});
  expect(n.boostInventory.portalBloom).toBe(1);expect(n.boostInventory.guidance).toBe(0);expect(c.boostInventory.portalBloom).toBe(2);
 });
 it('keeps elapsed recharge time across repeated failures',()=>{
  const s=emptySave();s.campaign.currentEnergy=3;const start=Date.now()-120000;s.campaign.energyUpdatedAt=start;
  const next=applyLevelFailure(s,getCampaignLevel(6)!,{consumeEnergy:true,usedSecondChance:false});
  expect(next.campaign.currentEnergy).toBe(2);expect(next.campaign.energyUpdatedAt).toBe(start);
  expect(regenerateEnergy(2,start,start+ECONOMY.energyRegenMinutes*60000).energy).toBe(3);
 });
 it('reports time until the energy meter is full',()=>{
  const start=1_000_000;
  expect(msUntilFullEnergy(ECONOMY.maxEnergy,start,start)).toBe(0);
  expect(msUntilFullEnergy(14,start,start)).toBe(msUntilNextEnergy(14,start,start));
  expect(msUntilFullEnergy(10,start,start)).toBe(msUntilNextEnergy(10,start,start)+4*ECONOMY.energyRegenMinutes*60000);
 });
 it('permits cleared-level replay at zero energy without charging for failures',()=>{
  const s=emptySave(),def=getCampaignLevel(1)!;
  s.campaign.currentEnergy=0;s.campaign.completedLevels[def.id]={cleared:true,bestRank:'CLEAR',bestScore:100,attempts:1,rewardsGranted:{clear:true,great:false,bullseye:false,perfect:false}};
  expect(canStartLevel(s.campaign,1).ok).toBe(true);
  expect(applyLevelFailure(s,def,{consumeEnergy:true,usedSecondChance:false}).campaign.currentEnergy).toBe(0);
 });
 it('does not spend energy during Containment practice (L1–5)',()=>{
  const s=emptySave();s.campaign.currentEnergy=15;s.campaign.highestUnlockedLevel=5;
  for(const n of [1,3,5]){
   const def=getCampaignLevel(n)!;
   const next=applyLevelFailure(s,def,{consumeEnergy:true,usedSecondChance:false});
   expect(next.campaign.currentEnergy).toBe(15);
   expect(canStartLevel({...s.campaign,currentEnergy:0},n).ok).toBe(true);
  }
 });
 it('spends energy after practice completes (L6+)',()=>{
  const s=emptySave();s.campaign.currentEnergy=15;s.campaign.highestUnlockedLevel=6;
  const def=getCampaignLevel(6)!;
  expect(applyLevelFailure(s,def,{consumeEnergy:true,usedSecondChance:false}).campaign.currentEnergy).toBe(14);
  expect(canStartLevel({...s.campaign,currentEnergy:0,highestUnlockedLevel:6},6).ok).toBe(false);
 });
 it('prices shard refill by missing energy only',()=>{
  expect(missingEnergy(ECONOMY.maxEnergy)).toBe(0);
  expect(energyRefillShardCost(ECONOMY.maxEnergy)).toBe(0);
  expect(energyRefillShardCost(0)).toBe(ECONOMY.maxEnergy*ECONOMY.energyRefillCostPerEnergy);
  expect(energyRefillShardCost(10)).toBe(5*ECONOMY.energyRefillCostPerEnergy);
  expect(energyRefillShardCost(0)).toBe(180);
 });
 it('caps rewarded energy ads per UTC day',()=>{
  const tracker={rewardedEnergyAdsDayKey:'',rewardedEnergyAdsToday:0};
  const now=Date.parse('2026-09-27T12:00:00.000Z');
  expect(utcDayKey(now)).toBe('2026-09-27');
  expect(rewardedEnergyAdsRemaining(tracker,now)).toBe(ECONOMY.maxRewardedEnergyAdsPerDay);
  expect(canWatchRewardedEnergyAd(tracker,0,now)).toBe(true);
  for(let i=0;i<ECONOMY.maxRewardedEnergyAdsPerDay;i++)bumpRewardedEnergyAdCount(tracker,now);
  expect(tracker.rewardedEnergyAdsToday).toBe(ECONOMY.maxRewardedEnergyAdsPerDay);
  expect(canWatchRewardedEnergyAd(tracker,0,now)).toBe(false);
  expect(rewardedEnergyAdsRemaining(tracker,now)).toBe(0);
  const nextDay=Date.parse('2026-09-28T01:00:00.000Z');
  expect(canWatchRewardedEnergyAd(tracker,0,nextDay)).toBe(true);
  bumpRewardedEnergyAdCount(tracker,nextDay);
  expect(tracker.rewardedEnergyAdsDayKey).toBe('2026-09-28');
  expect(tracker.rewardedEnergyAdsToday).toBe(1);
 });
});
