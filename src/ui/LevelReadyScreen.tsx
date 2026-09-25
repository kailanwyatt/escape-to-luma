import {t} from '../i18n';
import {ShopArt} from './ShopArt';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BOOST_LOADOUT_LIMIT, ECONOMY, type BoostId } from '../config/economy';
import { getCampaignLevel } from '../campaign/levels';
import type { SelectedBoosts } from '../campaign/types';
import { Button, GlassPanel, Screen, ScreenTitle, color, fontDisplay, fontUi, radius, space } from '../design';
import type { PersistentGameData } from '../persistence/GameSave';
import { worldForLevel } from '../campaign/worlds';
import { sparkById } from '../customization/sparks';
import { abilityDefinitionForSpark } from '../customization/sparkAbilities';
import { BriefingFrame } from './BriefingFrame';
import { HomeSignalMeter } from './HomeSignalMeter';

type Props = {
  save: PersistentGameData;
  levelNumber: number;
  onPlay: (boosts: SelectedBoosts) => void;
  onBack: () => void;
  onShop:()=>void;
  onSparks?: () => void;
};

const BOOSTS: { id: BoostId; label: string; costKey: keyof typeof ECONOMY.boostCosts; description: string }[] = [
  { id: 'portalBloom',label:t("levelreadyscreen.portal_bloom"),costKey:'portalBloom', description:t("levelreadyscreen.a_25_larger_portal_for_this_attempt_obstacles_stay_unchanged") },
  { id: 'guidance', label: t("levelreadyscreen.guidance"), costKey: 'guidance', description:t("levelreadyscreen.preview_the_route_before_committing_to_your_shot") },
  { id: 'slowField', label: t("levelreadyscreen.slow_field"), costKey: 'slowField', description:t("levelreadyscreen.slow_obstacle_movement_to_give_yourself_more_time") },
  { id: 'secondChance', label: t("levelreadyscreen.second_chance"), costKey: 'secondChance', description:t("levelreadyscreen.recover_from_one_failed_shot_during_this_attempt") },
  { id: 'phaseShield', label: t("levelreadyscreen.phase_shield"), costKey: 'phaseShield', description:t("levelreadyscreen.phase_shield_desc") },
  { id: 'timeLock', label: t("levelreadyscreen.time_lock"), costKey: 'timeLock', description:t("levelreadyscreen.time_lock_desc") },
];

const TILE: Partial<Record<BoostId, number>> = {
  guidance: 1,
  slowField: 2,
  portalBloom: 3,
  secondChance: 4,
  phaseShield: 2,
  timeLock: 1,
  hyperjump: 1,
};

export function LevelReadyScreen({ save, levelNumber, onPlay, onBack,onShop, onSparks }: Props) {
  const [selected, setSelected] = useState<SelectedBoosts>({});
  const def = getCampaignLevel(levelNumber);
  const world = worldForLevel(levelNumber);
  const inv = save.campaign.boostInventory;
  const showBoosts = levelNumber > 5;
  const spark = sparkById(save.campaign.equippedSparkId);
  const passive = abilityDefinitionForSpark(spark.id);
  const selectedCount = Object.values(selected).filter(Boolean).length;
  const wellCount = def?.gravityWells?.length ?? 0;

  return (
    <Screen onBack={onBack} backLabel={t("levelreadyscreen.back_to_game")}>
      <ScreenTitle
        eyebrow={world?.name ?? t("journeyscreen.journey")}
        title={t("levelreadyscreen.optional_boosts")}
        meta={t("levelreadyscreen.level_choose_before_your_first_shot", {value1: levelNumber})}
      />

      <BriefingFrame
        eyebrow="JUMP GATE BRIEFING"
        title={`LEVEL ${levelNumber}`}
        accent={def?.windX ? 'amber' : 'cyan'}
        style={styles.briefing}
        meta={
          <View style={styles.briefMeta}>
            {world ? <HomeSignalMeter strength={world.homeSignalStrength} compact /> : null}
            {def?.storyBeat ? <Text style={styles.beat}>{def.storyBeat}</Text> : null}
            <View style={styles.cues}>
              {def?.windX ? (
                <Text style={styles.cueAmber}>{t("levelreadyscreen.wind_active")}</Text>
              ) : (
                <Text style={styles.cueMuted}>WIND CLEAR</Text>
              )}
              {wellCount > 0 ? (
                <Text style={styles.cueCyan}>GRAVITY ×{wellCount}</Text>
              ) : (
                <Text style={styles.cueMuted}>NO WELLS</Text>
              )}
            </View>
          </View>
        }
      >
        <Text style={styles.best}>{t("levelreadyscreen.choose_boosts_now_stock_is_used_only_when_you_launch_cancelling_y")}</Text>
      </BriefingFrame>

      <GlassPanel style={styles.sparkPanel}>
        <Text style={styles.section}>{t("levelreadyscreen.equipped_spark")}</Text>
        <Text style={styles.sparkName}>{spark.name}</Text>
        <Text style={styles.passive}>{t("levelreadyscreen.passive")}: {passive.summary}</Text>
        {onSparks ? (
          <Pressable accessibilityRole="button" onPress={onSparks} style={styles.changeCollection}>
            <Text style={styles.changeCollectionText}>{t("levelreadyscreen.change_collection")}</Text>
          </Pressable>
        ) : null}
      </GlassPanel>

      {showBoosts ? (
        <>
          <Text style={styles.section}>{t("gameplaycontrols.boosts_2")} · max {BOOST_LOADOUT_LIMIT}</Text>
          {BOOSTS.map((boost) => {
            const owned = inv[boost.id] ?? 0;
            const on = Boolean(selected[boost.id]);
            const blocked = !on && selectedCount >= BOOST_LOADOUT_LIMIT;
            return (
              <GlassPanel
                key={boost.id}
                style={[styles.boost, on && styles.boostOn]}
              >
                <ShopArt tile={TILE[boost.id] ?? 1} style={{width:"100%",height:125,borderTopLeftRadius:16,borderTopRightRadius:16}}/>
                <Pressable
                  accessibilityRole="checkbox" accessibilityState={{checked:on,disabled:owned<=0||blocked}} disabled={owned<=0||blocked}
                  style={styles.boostPress}
                  onPress={() => {
                    if (owned <= 0) return;
                    setSelected((current) => {
                      const nextOn = !current[boost.id];
                      if (nextOn && Object.values(current).filter(Boolean).length >= BOOST_LOADOUT_LIMIT) {
                        return current;
                      }
                      return { ...current, [boost.id]: nextOn };
                    });
                  }}
                >
                  <Text style={styles.boostLabel}>
                    {on ? t("levelreadyscreen.x") : '[ ] '}
                    {boost.label}
                  </Text>
                  <Text style={styles.boostMeta}>
                    {owned > 0 ? `×${owned}` : t("levelreadyscreen.get_in_shop")}
                  </Text>
                </Pressable>
                <Text style={{padding:12,color:color.creamFaint,fontSize:12,lineHeight:18,fontFamily:fontUi}}>{boost.description}</Text>
              </GlassPanel>
            );
          })}
        </>
      ) : (
        <Text style={styles.teaching}>{t("levelreadyscreen.no_boosts_learn_the_throw")}</Text>
      )}

      <View style={{marginTop:20}}><Button label={t("levelreadyscreen.shop_get_boosts")} onPress={onShop}/></View>
      <View style={styles.play}><Button label={Object.values(selected).some(Boolean)?t("levelreadyscreen.equip_return"):t("levelreadyscreen.return_to_game")} onPress={() => onPlay(selected)} /></View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  briefing: { marginTop: space.md },
  briefMeta: { alignItems: 'center', gap: 8, width: '100%' },
  beat: { color: color.creamMuted, fontSize: 13, fontFamily: fontUi, textAlign: 'center', lineHeight: 18 },
  cues: { flexDirection: 'row', gap: 12, marginTop: 2 },
  cueAmber: { color: color.amberBright, fontSize: 11, fontFamily: fontUi, letterSpacing: 1.5 },
  cueCyan: { color: color.cyanBright, fontSize: 11, fontFamily: fontUi, letterSpacing: 1.5 },
  cueMuted: { color: color.creamFaint, fontSize: 11, fontFamily: fontUi, letterSpacing: 1.5 },
  best: { marginTop: space.sm, color: color.cyanBright, fontSize: 13, fontFamily: fontUi, textAlign: 'center' },
  teaching: { marginTop: space.xl, color: color.cyanDim, fontSize: 11, fontFamily: fontUi, letterSpacing: 1.5, textAlign: 'center' },
  section: { marginTop: space.xl, color: color.cyanBright, fontSize: 12, fontFamily: fontUi, letterSpacing: 2 },
  sparkPanel: { marginTop: space.md, padding: space.sm },
  sparkName: { color: color.cream, fontSize: 18, fontFamily: fontDisplay, marginTop: 6 },
  passive: { color: color.creamFaint, fontSize: 13, lineHeight: 18, marginTop: 6, fontFamily: fontUi },
  changeCollection: { marginTop: 10, alignSelf: 'flex-start' },
  changeCollectionText: { color: color.cyanBright, fontSize: 12, fontFamily: fontUi, letterSpacing: 1 },
  boost: { marginTop: space.xs, padding: 0, borderRadius: radius.md },
  boostPress: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space.sm, paddingHorizontal: space.sm },
  boostOn: { backgroundColor: color.cyanGlow, borderColor: color.cyanBright },
  boostLabel: { color: color.cream, fontSize: 13, fontFamily: fontUi },
  boostMeta: { color: color.creamFaint, fontSize: 12, fontFamily: fontUi },
  play: { marginTop: space.xl },
});
