import {t} from '../i18n';
import {ShopArt} from './ShopArt';
import {useMemo, useState} from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {BOOST_LOADOUT_LIMIT, type BoostId} from '../config/economy';
import {getCampaignLevel} from '../campaign/levels';
import type {SelectedBoosts} from '../campaign/types';
import {Button, Screen, color, fontDisplay, fontUi, radius, space} from '../design';
import type {PersistentGameData} from '../persistence/GameSave';
import {worldForLevel} from '../campaign/worlds';
import {sparkById} from '../customization/sparks';
import {abilityDefinitionForSpark} from '../customization/sparkAbilities';

type Props = {
  save: PersistentGameData;
  levelNumber: number;
  onPlay: (boosts: SelectedBoosts) => void;
  onBack: () => void;
  onShop: () => void;
  onSparks?: () => void;
};

type BoostCardDef = {
  id: BoostId;
  label: string;
  short: string;
  detail: string;
  activates: string;
  consumed: string;
  bestFor: string;
  tile: number;
};

const BOOSTS: BoostCardDef[] = [
  {
    id: 'portalBloom',
    label: t('levelreadyscreen.portal_bloom'),
    short: t('levelreadyscreen.short_portal_bloom'),
    detail: t('levelreadyscreen.a_25_larger_portal_for_this_attempt_obstacles_stay_unchanged'),
    activates: t('levelreadyscreen.activates_portal_bloom'),
    consumed: t('levelreadyscreen.consumed_on_launch'),
    bestFor: t('levelreadyscreen.best_portal_bloom'),
    tile: 3,
  },
  {
    id: 'timeLock',
    label: t('levelreadyscreen.time_lock'),
    short: t('levelreadyscreen.short_time_lock'),
    detail: t('levelreadyscreen.time_lock_desc'),
    activates: t('levelreadyscreen.activates_time_lock'),
    consumed: t('levelreadyscreen.consumed_on_launch'),
    bestFor: t('levelreadyscreen.best_time_lock'),
    tile: 1,
  },
  {
    id: 'phaseShield',
    label: t('levelreadyscreen.phase_shield'),
    short: t('levelreadyscreen.short_phase_shield'),
    detail: t('levelreadyscreen.phase_shield_desc'),
    activates: t('levelreadyscreen.activates_phase_shield'),
    consumed: t('levelreadyscreen.consumed_on_launch'),
    bestFor: t('levelreadyscreen.best_phase_shield'),
    tile: 2,
  },
  {
    id: 'guidance',
    label: t('levelreadyscreen.guidance'),
    short: t('levelreadyscreen.short_guidance'),
    detail: t('levelreadyscreen.preview_the_route_before_committing_to_your_shot'),
    activates: t('levelreadyscreen.activates_guidance'),
    consumed: t('levelreadyscreen.consumed_on_launch'),
    bestFor: t('levelreadyscreen.best_guidance'),
    tile: 1,
  },
  {
    id: 'slowField',
    label: t('levelreadyscreen.slow_field'),
    short: t('levelreadyscreen.short_slow_field'),
    detail: t('levelreadyscreen.slow_obstacle_movement_to_give_yourself_more_time'),
    activates: t('levelreadyscreen.activates_slow_field'),
    consumed: t('levelreadyscreen.consumed_on_launch'),
    bestFor: t('levelreadyscreen.best_slow_field'),
    tile: 2,
  },
  {
    id: 'secondChance',
    label: t('levelreadyscreen.second_chance'),
    short: t('levelreadyscreen.short_second_chance'),
    detail: t('levelreadyscreen.recover_from_one_failed_shot_during_this_attempt'),
    activates: t('levelreadyscreen.activates_second_chance'),
    consumed: t('levelreadyscreen.consumed_on_launch'),
    bestFor: t('levelreadyscreen.best_second_chance'),
    tile: 4,
  },
];

export function LevelReadyScreen({save, levelNumber, onPlay, onBack, onShop, onSparks}: Props) {
  const [selected, setSelected] = useState<SelectedBoosts>({});
  const [infoId, setInfoId] = useState<BoostId | null>(null);
  const [loadoutHint, setLoadoutHint] = useState(false);
  const {width} = useWindowDimensions();
  const def = getCampaignLevel(levelNumber);
  const world = worldForLevel(levelNumber);
  const inv = save.campaign.boostInventory;
  const showBoosts = levelNumber > 5;
  const spark = sparkById(save.campaign.equippedSparkId);
  const passive = abilityDefinitionForSpark(spark.id);
  const selectedCount = Object.values(selected).filter(Boolean).length;
  const infoBoost = useMemo(() => BOOSTS.find((b) => b.id === infoId) ?? null, [infoId]);
  const columns = width >= 700 ? 3 : 2;

  const toggleBoost = (id: BoostId, owned: number) => {
    if (owned <= 0) {
      onShop();
      return;
    }
    setSelected((current) => {
      const on = Boolean(current[id]);
      if (on) {
        setLoadoutHint(false);
        return {...current, [id]: false};
      }
      const count = Object.values(current).filter(Boolean).length;
      if (count >= BOOST_LOADOUT_LIMIT) {
        setLoadoutHint(true);
        return current;
      }
      setLoadoutHint(false);
      return {...current, [id]: true};
    });
  };

  return (
    <Screen onBack={onBack} backLabel={t('levelreadyscreen.back_to_game')}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {t('gameplaycontrols.boosts_2')}
        </Text>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.subtitle}>{t('levelreadyscreen.choose_up_to_n', {value1: BOOST_LOADOUT_LIMIT})}</Text>
            <Text style={styles.launchNote}>
              {t('levelreadyscreen.choose_boosts_now_stock_is_used_only_when_you_launch_cancelling_y')}
            </Text>
            <Text style={styles.levelMeta}>
              {(world?.name ?? t('journeyscreen.journey')).toUpperCase()} · L{levelNumber}
              {def?.windX ? ` · ${t('levelreadyscreen.wind_active')}` : ''}
            </Text>
          </View>
          {showBoosts ? (
            <View style={styles.maxBadge} accessibilityLabel={t('levelreadyscreen.max_slots', {value1: selectedCount, value2: BOOST_LOADOUT_LIMIT})}>
              <Text style={styles.maxLabel}>{t('levelreadyscreen.max_n', {value1: BOOST_LOADOUT_LIMIT})}</Text>
              <View style={styles.slots}>
                {Array.from({length: BOOST_LOADOUT_LIMIT}, (_, i) => (
                  <View key={i} style={[styles.slot, i < selectedCount && styles.slotFilled]} />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.sparkRow}>
        <View style={{flex: 1}}>
          <Text style={styles.sparkEyebrow}>{t('levelreadyscreen.equipped_spark')}</Text>
          <Text style={styles.sparkName}>{spark.name}</Text>
          <Text style={styles.sparkPassive} numberOfLines={2}>
            {t('levelreadyscreen.passive')}: {passive.summary}
          </Text>
        </View>
        {onSparks ? (
          <Pressable accessibilityRole="button" onPress={onSparks} style={styles.changeSpark}>
            <Text style={styles.changeSparkText}>{t('levelreadyscreen.change_collection')}</Text>
          </Pressable>
        ) : null}
      </View>

      {loadoutHint ? (
        <Text accessibilityLiveRegion="polite" style={styles.loadoutHint}>
          {t('levelreadyscreen.loadout_full_remove_one')}
        </Text>
      ) : null}

      {showBoosts ? (
        <View style={[styles.grid, columns === 3 && styles.gridWide]}>
          {BOOSTS.map((boost) => {
            const owned = inv[boost.id] ?? 0;
            const on = Boolean(selected[boost.id]);
            const needsShop = owned <= 0;
            return (
              <View
                key={boost.id}
                style={[
                  styles.card,
                  on && styles.cardOn,
                  needsShop && styles.cardLocked,
                  {width: columns === 3 ? '31.5%' : '48.5%'},
                ]}
              >
                <Pressable
                  accessibilityRole={needsShop ? 'button' : 'checkbox'}
                  accessibilityLabel={`${boost.label}. ${needsShop ? t('levelreadyscreen.get_in_shop') : boost.short}`}
                  accessibilityState={needsShop ? undefined : {checked: on}}
                  onPress={() => toggleBoost(boost.id, owned)}
                  style={styles.cardPress}
                >
                  <View style={styles.artWrap}>
                    <ShopArt tile={boost.tile} style={styles.art} />
                  </View>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {boost.label}
                  </Text>
                  <Text style={styles.cardShort} numberOfLines={2}>
                    {boost.short}
                  </Text>
                  <View style={styles.cardFooter}>
                    <View style={[styles.check, on && styles.checkOn]} />
                    <View style={[styles.qty, needsShop && styles.qtyShop]}>
                      <Text style={[styles.qtyText, needsShop && styles.qtyShopText]}>
                        {needsShop ? t('levelreadyscreen.get_in_shop') : `x${owned}`}
                      </Text>
                    </View>
                  </View>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('levelreadyscreen.info_about', {value1: boost.label})}
                  hitSlop={10}
                  onPress={() => setInfoId(boost.id)}
                  style={styles.infoBtn}
                >
                  <Text style={styles.infoGlyph}>ⓘ</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.teaching}>{t('levelreadyscreen.no_boosts_learn_the_throw')}</Text>
      )}

      <View style={styles.tip}>
        <Text style={styles.tipIcon}>💡</Text>
        <Text style={styles.tipText}>{t('levelreadyscreen.footer_tip')}</Text>
      </View>

      {showBoosts ? (
        <View style={styles.shopLink}>
          <Button label={t('levelreadyscreen.shop_get_boosts')} onPress={onShop} />
        </View>
      ) : null}
      <View style={styles.play}>
        <Button
          label={
            Object.values(selected).some(Boolean)
              ? t('levelreadyscreen.equip_return')
              : t('levelreadyscreen.return_to_game')
          }
          onPress={() => onPlay(selected)}
        />
      </View>

      <Modal
        transparent
        visible={infoBoost != null}
        animationType="fade"
        onRequestClose={() => setInfoId(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setInfoId(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            {infoBoost ? (
              <>
                <ShopArt tile={infoBoost.tile} style={styles.modalArt} />
                <Text style={styles.modalName}>{infoBoost.label}</Text>
                <Text style={styles.modalBody}>{infoBoost.detail}</Text>
                <Text style={styles.modalSection}>{t('levelreadyscreen.when_it_activates')}</Text>
                <Text style={styles.modalBody}>{infoBoost.activates}</Text>
                <Text style={styles.modalSection}>{t('levelreadyscreen.when_consumed')}</Text>
                <Text style={styles.modalBody}>{infoBoost.consumed}</Text>
                <Text style={styles.modalSection}>{t('levelreadyscreen.best_for')}</Text>
                <Text style={styles.modalBody}>{infoBoost.bestFor}</Text>
                <Text style={styles.modalStock}>
                  {(inv[infoBoost.id] ?? 0) > 0
                    ? t('levelreadyscreen.inventory_remaining', {value1: inv[infoBoost.id] ?? 0})
                    : t('levelreadyscreen.get_in_shop')}
                </Text>
                <View style={styles.modalActions}>
                  {(inv[infoBoost.id] ?? 0) <= 0 ? (
                    <Button
                      label={t('levelreadyscreen.shop_get_boosts')}
                      onPress={() => {
                        setInfoId(null);
                        onShop();
                      }}
                    />
                  ) : null}
                  <Pressable accessibilityRole="button" onPress={() => setInfoId(null)} style={styles.modalClose}>
                    <Text style={styles.modalCloseText}>{t('hud.cancel')}</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {marginTop: space.sm, marginBottom: space.sm, gap: 8},
  title: {
    color: color.white,
    fontFamily: fontDisplay,
    fontSize: 36,
    letterSpacing: 6,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 12},
  headerCopy: {flex: 1, gap: 6},
  subtitle: {
    color: color.cyanBright,
    fontFamily: fontUi,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
  },
  launchNote: {color: color.creamMuted, fontFamily: fontUi, fontSize: 12, lineHeight: 17},
  levelMeta: {color: color.creamFaint, fontFamily: fontUi, fontSize: 11, letterSpacing: 1, marginTop: 2},
  maxBadge: {
    borderWidth: 1,
    borderColor: color.panelBorder,
    backgroundColor: color.inkElevated,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 6,
    minWidth: 72,
  },
  maxLabel: {color: color.cream, fontFamily: fontUi, fontSize: 10, letterSpacing: 1.5, fontWeight: '700'},
  slots: {flexDirection: 'row', gap: 8},
  slot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: color.cyanDim,
    backgroundColor: 'transparent',
  },
  slotFilled: {backgroundColor: color.cyanBright, borderColor: color.cyanBright},
  sparkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.stroke,
    backgroundColor: color.panel,
    marginBottom: space.sm,
  },
  sparkEyebrow: {color: color.cyanDim, fontSize: 10, letterSpacing: 1.5, fontFamily: fontUi},
  sparkName: {color: color.cream, fontSize: 16, fontFamily: fontDisplay, marginTop: 2},
  sparkPassive: {color: color.creamFaint, fontSize: 12, lineHeight: 16, marginTop: 4, fontFamily: fontUi},
  changeSpark: {paddingVertical: 8, paddingHorizontal: 10},
  changeSparkText: {color: color.cyanBright, fontSize: 11, fontFamily: fontUi, letterSpacing: 0.5},
  loadoutHint: {
    color: color.amberBright,
    fontFamily: fontUi,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: space.sm,
    lineHeight: 17,
  },
  grid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12},
  gridWide: {justifyContent: 'flex-start'},
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.panelBorder,
    backgroundColor: '#071828',
    overflow: 'hidden',
    marginBottom: 2,
  },
  cardOn: {borderColor: color.cyanBright, backgroundColor: 'rgba(0,140,190,0.18)'},
  cardLocked: {opacity: 0.92},
  cardPress: {paddingBottom: 10},
  artWrap: {height: 118, width: '100%', backgroundColor: '#031522'},
  art: {width: '100%', height: '100%'},
  infoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: color.cyanDim,
    backgroundColor: 'rgba(5,20,35,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  infoGlyph: {color: color.cyanBright, fontSize: 14, fontWeight: '700'},
  cardName: {
    color: color.white,
    fontFamily: fontUi,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 6,
  },
  cardShort: {
    color: color.cyanBright,
    fontFamily: fontUi,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 8,
    minHeight: 28,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 8,
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: color.cyanDim,
  },
  checkOn: {backgroundColor: color.cyanBright, borderColor: color.cyanBright},
  qty: {
    borderRadius: radius.pill,
    backgroundColor: 'rgba(20,70,100,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  qtyShop: {backgroundColor: 'rgba(0,160,200,0.25)', borderWidth: 1, borderColor: color.cyanDim},
  qtyText: {color: color.cream, fontSize: 11, fontFamily: fontUi, fontWeight: '700'},
  qtyShopText: {color: color.cyanBright, fontSize: 9, letterSpacing: 0.4},
  teaching: {
    marginTop: space.xl,
    color: color.cyanDim,
    fontSize: 11,
    fontFamily: fontUi,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  tip: {
    marginTop: space.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.stroke,
    backgroundColor: 'rgba(6,20,34,0.9)',
  },
  tipIcon: {fontSize: 16, marginTop: 1},
  tipText: {flex: 1, color: color.creamMuted, fontFamily: fontUi, fontSize: 12, lineHeight: 17},
  shopLink: {marginTop: space.md},
  play: {marginTop: space.sm, marginBottom: space.md},
  modalBackdrop: {
    flex: 1,
    backgroundColor: color.overlayHeavy,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: color.panelBorder,
    backgroundColor: '#071a2b',
    padding: 18,
    gap: 8,
  },
  modalArt: {width: '100%', height: 160, borderRadius: radius.md, overflow: 'hidden'},
  modalName: {color: color.white, fontFamily: fontDisplay, fontSize: 22, letterSpacing: 2, marginTop: 6},
  modalSection: {
    color: color.cyanBright,
    fontFamily: fontUi,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginTop: 8,
  },
  modalBody: {color: color.creamMuted, fontFamily: fontUi, fontSize: 13, lineHeight: 19},
  modalStock: {color: color.amberBright, fontFamily: fontUi, fontSize: 13, marginTop: 10, fontWeight: '700'},
  modalActions: {marginTop: 12, gap: 8},
  modalClose: {paddingVertical: 12},
  modalCloseText: {color: color.cyanBright, textAlign: 'center', fontFamily: fontUi},
});
