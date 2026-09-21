import {t} from '../i18n';
import {ShopArt} from './ShopArt';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ECONOMY, type BoostId } from '../config/economy';
import { getCampaignLevel } from '../campaign/levels';
import type { SelectedBoosts } from '../campaign/types';
import { Button, GlassPanel, Screen, ScreenTitle, color, radius, space } from '../design';
import type { PersistentGameData } from '../persistence/GameSave';
import { worldForLevel } from '../campaign/worlds';

type Props = {
  save: PersistentGameData;
  levelNumber: number;
  onPlay: (boosts: SelectedBoosts) => void;
  onBack: () => void;
  onShop:()=>void;
};

const BOOSTS: { id: BoostId; label: string; costKey: keyof typeof ECONOMY.boostCosts }[] = [
  { id: 'portalBloom',label:t("levelreadyscreen.portal_bloom"),costKey:'portalBloom' },
  { id: 'guidance', label: t("levelreadyscreen.guidance"), costKey: 'guidance' },
  { id: 'slowField', label: t("levelreadyscreen.slow_field"), costKey: 'slowField' },
  { id: 'secondChance', label: t("levelreadyscreen.second_chance"), costKey: 'secondChance' },
];

export function LevelReadyScreen({ save, levelNumber, onPlay, onBack,onShop }: Props) {
  const [selected, setSelected] = useState<SelectedBoosts>({});
  const def = getCampaignLevel(levelNumber);
  const world = worldForLevel(levelNumber);
  const progress = def ? save.campaign.completedLevels[def.id] : undefined;
  const inv = save.campaign.boostInventory;
  const showBoosts = levelNumber > 5;

  return (
    <Screen onBack={onBack} backLabel={t("levelreadyscreen.back_to_game")}>
      <ScreenTitle eyebrow={world?.name ?? t("journeyscreen.journey")} title={t("levelreadyscreen.optional_boosts")} meta={t("levelreadyscreen.level_choose_before_your_first_shot", {value1: levelNumber})} />
      {def?.storyBeat ? <Text style={styles.beat}>{def.storyBeat}</Text> : null}
      <Text style={styles.best}>{t("levelreadyscreen.choose_boosts_now_stock_is_used_only_when_you_launch_cancelling_y")}</Text>
      {def?.windX ? <Text style={styles.wind}>{t("levelreadyscreen.wind_active")}</Text> : null}

      {showBoosts ? (
        <>
          <Text style={styles.section}>{t("gameplaycontrols.boosts_2")}</Text>
          {BOOSTS.map((boost) => {
            const owned = inv[boost.id] ?? 0;
            const on = Boolean(selected[boost.id]);
            return (
              <GlassPanel
                key={boost.id}
                style={[styles.boost, on && styles.boostOn]}
              >
                <ShopArt tile={{guidance:1,slowField:2,portalBloom:3,secondChance:4,hyperjump:1}[boost.id]} style={{width:"100%",height:125,borderTopLeftRadius:16,borderTopRightRadius:16}}/>
                <Pressable
                  accessibilityRole="checkbox" accessibilityState={{checked:on,disabled:owned<=0}} disabled={owned<=0}
                  style={styles.boostPress}
                  onPress={() => {
                    if (owned <= 0) {
                      return;
                    }
                    setSelected((current) => ({ ...current, [boost.id]: !current[boost.id] }));
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
                <Text style={{padding:12,color:color.creamFaint,fontSize:12,lineHeight:18}}>{boost.id==='portalBloom'?t("levelreadyscreen.a_25_larger_portal_for_this_attempt_obstacles_stay_unchanged"):boost.id==='guidance'?t("levelreadyscreen.preview_the_route_before_committing_to_your_shot"):boost.id==='slowField'?t("levelreadyscreen.slow_obstacle_movement_to_give_yourself_more_time"):t("levelreadyscreen.recover_from_one_failed_shot_during_this_attempt")}</Text>
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
  beat: { marginTop: space.sm, color: color.creamMuted, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  best: { marginTop: space.md, color: color.cyanBright, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  wind: { marginTop: space.xs, color: color.amberBright, fontSize: 12, fontWeight: '800', letterSpacing: 2, textAlign: 'center' },
  teaching: { marginTop: space.xl, color: color.cyanDim, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textAlign: 'center' },
  section: { marginTop: space.xl, color: color.cyanBright, fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  boost: { marginTop: space.xs, padding: 0, borderRadius: radius.md },
  boostPress: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space.sm, paddingHorizontal: space.sm },
  boostOn: { backgroundColor: color.cyanGlow, borderColor: color.cyanBright },
  boostLabel: { color: color.cream, fontSize: 13, fontWeight: '800' },
  boostMeta: { color: color.creamFaint, fontSize: 12, fontWeight: '700' },
  play: { marginTop: space.xl },
});
