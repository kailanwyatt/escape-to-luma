import {t} from '../i18n';
import {MenuBackBar} from '../design/components/MenuBackBar';
import {useEffect, useRef, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type View as RNView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {LinearGradient} from 'expo-linear-gradient';
import {getCommercialConfig} from '../config/commercial';
import {ECONOMY, SHARD_PACKS, type ShardPackId} from '../config/economy';
import {OVERCHARGE_PRODUCTS, type OverchargeProductId} from '../config/overcharge';
import {PurchaseService, type OverchargeStoreProduct, type ShardProduct} from '../services/purchases/PurchaseService';
import {hasUnlimitedEnergy, type PersistentGameData} from '../persistence/GameSave';
import {formatOverchargeRemaining, overchargeRemainingMs} from '../economy/overcharge';
import {
  canWatchRewardedEnergyAd,
  energyRefillShardCost,
  missingEnergy,
  regenerateEnergy,
  rewardedEnergyAdsRemaining,
} from '../economy/energy';
import {CurrencyIcon} from './CurrencyIcon';
import {ShopArt} from './ShopArt';

export type ShopBoost =
  | 'guidance'
  | 'slowField'
  | 'secondChance'
  | 'portalBloom'
  | 'phaseShield'
  | 'timeLock';

const boosts: readonly [ShopBoost, string, string, number][] = [
  [
    'guidance',
    t('shopscreen.guidance'),
    t('shopscreen.see_the_full_predicted_route_before_launching'),
    1,
  ],
  [
    'slowField',
    t('shopscreen.slow_field'),
    t('shopscreen.obstacles_move_slower_for_this_attempt', {
      value1: Math.round((1 - ECONOMY.boostSlowFieldMultiplier) * 100),
    }),
    2,
  ],
  [
    'portalBloom',
    t('shopscreen.portal_bloom'),
    t('shopscreen.a_larger_destination_obstacles_stay_unchanged', {
      value1: Math.round((ECONOMY.portalBloomMultiplier - 1) * 100),
    }),
    3,
  ],
  [
    'secondChance',
    t('shopscreen.second_chance'),
    t('shopscreen.recover_once_after_a_miss_and_keep_your_equipped_boosts'),
    4,
  ],
  ['phaseShield', t('shopscreen.phase_shield'), t('shopscreen.phase_shield_desc'), 2],
  ['timeLock', t('shopscreen.time_lock'), t('shopscreen.time_lock_desc'), 1],
];

export function ShopScreen({
  save,
  onBuyBoost,
  onWatchEnergy,
  onBuyEnergy,
  onShardPack,
  onOvercharge,
  onRestoreOvercharge,
  onBack,
  backLabel = t('screenchrome.back'),
  focusBoost = null,
}: {
  save: PersistentGameData;
  onBuyBoost: (id: ShopBoost) => void;
  onWatchEnergy: () => Promise<void>;
  onBuyEnergy: () => boolean;
  onShardPack: (
    id: ShardPackId,
  ) => Promise<'completed' | 'cancelled' | 'failed' | 'unavailable' | 'already'>;
  onOvercharge: (
    id: OverchargeProductId,
  ) => Promise<'completed' | 'cancelled' | 'failed' | 'unavailable' | 'already'>;
  onRestoreOvercharge: () => Promise<boolean>;
  onBack: () => void;
  backLabel?: string;
  focusBoost?: ShopBoost | null;
}) {
  const [busy, setBusy] = useState(false);
  const [busyPack, setBusyPack] = useState<ShardPackId | null>(null);
  const [busyOvercharge, setBusyOvercharge] = useState<OverchargeProductId | null>(null);
  const [products, setProducts] = useState<ShardProduct[]>([]);
  const [overchargeProducts, setOverchargeProducts] = useState<OverchargeStoreProduct[]>([]);
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(Date.now());
  const [showDurations, setShowDurations] = useState(false);
  const {width} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const c = save.campaign;
  const scrollRef = useRef<ScrollView>(null);
  const boostRefs = useRef<Partial<Record<ShopBoost, RNView | null>>>({});
  const scrollY = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    void PurchaseService.getShardProducts().then((next) => {
      if (active) setProducts(next);
    });
    void PurchaseService.getOverchargeProducts().then((next) => {
      if (active) setOverchargeProducts(next);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!focusBoost) return;
    const boostName = boosts.find(([id]) => id === focusBoost)?.[1];
    if (boostName) setNotice(t('shopscreen.focus_boost', {value1: boostName}));
    let tries = 0;
    const scrollToFocus = () => {
      const node = boostRefs.current[focusBoost];
      const scroll = scrollRef.current;
      if (!node || !scroll) {
        if (tries++ < 12) requestAnimationFrame(scrollToFocus);
        return;
      }
      node.measureInWindow((_x, y) => {
        scroll.measureInWindow((_sx, sy) => {
          const target = Math.max(0, scrollY.current + (y - sy) - 20);
          scroll.scrollTo({y: target, animated: true});
        });
      });
    };
    const timer = setTimeout(scrollToFocus, 80);
    return () => clearTimeout(timer);
  }, [focusBoost]);

  const wide = width >= 800;
  const columns = wide ? 4 : width >= 360 ? 2 : 1;
  const unlimited = hasUnlimitedEnergy(c, now);
  const energy = regenerateEnergy(c.currentEnergy, c.energyUpdatedAt, now, unlimited).energy;
  const refillMissing = missingEnergy(energy);
  const refillCost = energyRefillShardCost(energy);
  const adsOn = getCommercialConfig().adsEnabled;
  const adsLeft = rewardedEnergyAdsRemaining(c, now);
  const canAd = !unlimited && adsOn && canWatchRewardedEnergyAd(c, energy, now);
  const remaining = formatOverchargeRemaining(overchargeRemainingMs(c, now));

  const watch = async () => {
    setBusy(true);
    setNotice('');
    try {
      if (!canAd) {
        setNotice(t('shopscreen.energy_ad_limit_reached'));
        return;
      }
      await onWatchEnergy();
    } catch {
      setNotice(t('shopscreen.the_ad_could_not_complete_please_try_again'));
    } finally {
      setBusy(false);
    }
  };

  const buyPack = async (id: ShardPackId) => {
    setBusyPack(id);
    setNotice('');
    try {
      const result = await onShardPack(id);
      if (result === 'completed') setNotice(t('shopscreen.shards_added'));
      else if (result === 'already') setNotice(t('shopscreen.purchase_already_applied'));
      else if (result !== 'cancelled') setNotice(t('shopscreen.purchase_unavailable'));
    } finally {
      setBusyPack(null);
    }
  };

  const buyOvercharge = async (id: OverchargeProductId) => {
    setBusyOvercharge(id);
    setNotice('');
    try {
      const result = await onOvercharge(id);
      if (result === 'completed') {
        setNotice(t('shopscreen.overcharge_granted', {value1: remaining}));
        setShowDurations(false);
      } else if (result === 'already') setNotice(t('shopscreen.purchase_already_applied'));
      else if (result !== 'cancelled') setNotice(t('shopscreen.purchase_unavailable'));
    } finally {
      setBusyOvercharge(null);
    }
  };

  const restore = async () => {
    setBusy(true);
    setNotice('');
    try {
      const ok = await onRestoreOvercharge();
      setNotice(ok ? t('shopscreen.overcharge_restore') : t('shopscreen.purchase_unavailable'));
    } finally {
      setBusy(false);
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  };

  const button = (label: string, action: () => void, disabled = false, outline = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label.replace(/◆/g, t('shopscreen.shards'))}
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={action}
      style={({pressed}) => [
        s.button,
        outline && s.outline,
        disabled && {opacity: 0.4},
        pressed && {opacity: 0.75},
      ]}
    >
      <LinearGradient
        colors={outline ? ['#073244', '#031824'] : ['#FFE16B', '#FFC742']}
        style={s.buttonFill}
      >
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5}}>
          {label.includes('◆') ? <CurrencyIcon kind="shard" size={23} /> : null}
          <Text style={[s.buttonText, outline && {color: '#d8faff'}]}>
            {label.replace('◆ ', '')}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );

  return (
    <View style={s.root}>
      <MenuBackBar onBack={onBack} label={backLabel} />
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{flex: 1}}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: Math.max(insets.left, insets.right, 16),
          alignItems: 'center',
        }}
      >
        <View style={s.page}>
          <View style={[s.hero, {minHeight: wide ? 360 : 400}]}>
            <ShopArt
              tile={0}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: wide ? '62%' : '100%',
                opacity: wide ? 1 : 0.6,
              }}
            />
            <LinearGradient
              colors={['#031522', '#031522d9', '#03152200']}
              locations={[0, 0.4, 1]}
              start={{x: 0, y: 0.5}}
              end={{x: 1, y: 0.5}}
              style={StyleSheet.absoluteFill}
            />
            <View style={[s.heroCopy, {width: wide ? '54%' : '100%'}]}>
              <Text style={s.eyebrow}>{t('shopscreen.the_workshop')}</Text>
              <Text style={[s.title, {fontSize: wide ? 46 : 36}]}>
                {t('shopscreen.fuel_your')}
                {'\n'}
                {t('shopscreen.next_leap')}
              </Text>
              <Text style={s.lead}>{t('shopscreen.boosts_shards_more_possibilities')}</Text>
              <View style={s.wallet}>
                <View style={{flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6}}>
                  <CurrencyIcon kind="shard" />
                  <Text style={s.walletValue}>
                    {c.shards.toLocaleString()} {t('statuspanel.shards')}
                  </Text>
                  <CurrencyIcon kind="energy" />
                  <Text style={s.walletValue}>
                    {unlimited ? '∞' : `${energy}/${ECONOMY.maxEnergy}`} {t('statuspanel.energy')}
                  </Text>
                </View>
                <Text style={s.copy}>
                  {t(
                    'shopscreen.earn_shards_stock_your_kit_and_choose_boosts_before_launching_cos',
                  )}
                </Text>
              </View>
            </View>
          </View>

          <View style={s.sectionRow}>
            <Text style={s.section}>{t('shopscreen.overcharge')}</Text>
            <Text style={s.micro}>
              {unlimited
                ? t('shopscreen.overcharge_active', {value1: remaining})
                : t('shopscreen.overcharge_lead')}
            </Text>
          </View>
          <View style={[s.recharge, {minHeight: wide ? 200 : 240, marginTop: 0}]}>
            <ShopArt
              tile={5}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: wide ? '40%' : '100%',
                opacity: wide ? 1 : 0.3,
              }}
            />
            <LinearGradient
              colors={['#041522', '#041522cc', '#04152200']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={StyleSheet.absoluteFill}
            />
            <View style={{padding: 24, width: wide ? '70%' : '100%'}}>
              <Text style={s.cardHeading}>{t('shopscreen.overcharge')}</Text>
              <Text style={s.copy}>{t('shopscreen.overcharge_lead')}</Text>
              <Text style={s.copy}>{t('shopscreen.free_alternatives')}</Text>
              <View style={{flexDirection: wide ? 'row' : 'column', gap: 12, marginTop: 8}}>
                <View style={{flex: 1}}>
                  {button(
                    unlimited ? t('shopscreen.overcharge_extend') : t('shopscreen.overcharge_choose'),
                    () => setShowDurations(true),
                    false,
                    true,
                  )}
                </View>
                <View style={{flex: 1}}>
                  {button(t('shopscreen.overcharge_restore'), () => void restore(), busy, true)}
                </View>
              </View>
              {showDurations ? (
                <View style={{marginTop: 14, gap: 10}}>
                  {OVERCHARGE_PRODUCTS.map((product) => {
                    const store = overchargeProducts.find((item) => item.productId === product.id);
                    const purchasing = busyOvercharge === product.id;
                    return (
                      <View key={product.id}>
                        {button(
                          `${product.label} · ${purchasing ? t('shopscreen.processing') : store?.localizedPrice ?? product.fallbackPrice}`,
                          () => void buyOvercharge(product.id),
                          busyOvercharge !== null,
                        )}
                      </View>
                    );
                  })}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setShowDurations(false)}
                    style={{paddingVertical: 8}}
                  >
                    <Text style={{color: '#8aa8bb', textAlign: 'center'}}>
                      {t('shopscreen.overcharge_dismiss')}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>

          <View style={s.sectionRow}>
            <Text style={s.section}>{t('shopscreen.flight_kit')}</Text>
            <Text style={s.micro}>{t('shopscreen.temporary_boosts_for_your_next_attempt')}</Text>
          </View>
          <View style={s.grid}>
            {boosts.map(([id, name, description, tile]) => (
              <View
                key={id}
                ref={(node) => {
                  boostRefs.current[id] = node;
                }}
                collapsable={false}
                style={[
                  s.boost,
                  focusBoost === id && s.boostFocus,
                  {width: columns === 4 ? '23.8%' : columns === 2 ? '48%' : '100%'},
                ]}
              >
                <ShopArt tile={tile} style={{height: wide ? 155 : 145, width: '100%'}} />
                <View style={s.cardCopy}>
                  <Text style={s.cardTitle}>{name}</Text>
                  {focusBoost === id ? (
                    <Text style={s.focusTag}>{t('shopscreen.selected_from_boosts')}</Text>
                  ) : null}
                  <Text style={[s.description, {minHeight: wide ? 80 : 88}]}>{description}</Text>
                  {button(
                    `◆ ${ECONOMY.boostCosts[id]}`,
                    () => {
                      onBuyBoost(id);
                      setNotice(t('shopscreen.added_to_your_kit', {value1: name}));
                    },
                    c.shards < ECONOMY.boostCosts[id],
                  )}
                  <Text style={s.owned}>
                    {t('shopscreen.in_your_kit')}
                    {c.boostInventory[id]}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          {notice ? (
            <Text accessibilityLiveRegion="polite" style={s.notice}>
              {notice}
            </Text>
          ) : null}

          <View style={[s.recharge, {minHeight: wide ? 245 : 310}]}>
            <ShopArt
              tile={5}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: wide ? '46%' : '100%',
                opacity: wide ? 1 : 0.35,
              }}
            />
            <LinearGradient
              colors={['#041522', '#041522cc', '#04152200']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={StyleSheet.absoluteFill}
            />
            <View style={{padding: 24, width: wide ? '65%' : '100%'}}>
              <Text style={s.cardHeading}>{t('shopscreen.recharge_spark')}</Text>
              <Text style={s.copy}>
                {t('shopscreen.energy_returns_automatically_1_every')}
                {ECONOMY.energyRegenMinutes} {t('shopscreen.minutes_or_choose_a_refill_now')}
              </Text>
              {adsOn && !unlimited ? (
                <Text style={s.copy}>
                  {t('outofenergyscreen.energy_ads_left_today', {value1: adsLeft})}
                </Text>
              ) : null}
              <View style={{flexDirection: wide ? 'row' : 'column', gap: 12, marginTop: 8}}>
                <View style={{flex: 1}}>
                  {button(
                    busy
                      ? t('outofenergyscreen.please_wait')
                      : t('shopscreen.watch_ad_energy', {
                          value1: '',
                          value2: ECONOMY.rewardedAdEnergyAmount,
                        }),
                    () => void watch(),
                    busy || !canAd,
                    true,
                  )}
                </View>
                <View style={{flex: 1}}>
                  {button(
                    t('shopscreen.full_refill', {value1: refillCost, value2: refillMissing}),
                    () => {
                      if (onBuyEnergy()) setNotice(t('shopscreen.energy_refilled_spark_is_ready'));
                      else setNotice(t('shopscreen.energy_refill_unavailable'));
                    },
                    refillCost <= 0 || c.shards < refillCost,
                  )}
                </View>
              </View>
            </View>
          </View>

          <View style={s.sectionRow}>
            <Text style={s.section}>{t('shopscreen.optional_shard_packs')}</Text>
            <Text style={s.micro}>
              {products.length
                ? t('shopscreen.secure_apple_purchase')
                : t('shopscreen.connecting_to_store')}
            </Text>
          </View>
          <View style={s.grid}>
            {SHARD_PACKS.map((pack, i) => {
              const product = products.find((item) => item.packId === pack.id);
              const purchasing = busyPack === pack.id;
              return (
                <View key={pack.id} style={[s.pack, {width: width >= 700 ? '32%' : '100%'}]}>
                  <View style={s.packHeading}>
                    <Text style={s.cardTitle}>{pack.name}</Text>
                    <Text style={s.copy}>
                      {
                        [
                          t('shopscreen.a_small_boost_for_your_journey'),
                          t('shopscreen.for_those_who_explore_further'),
                          t('shopscreen.for_the_long_road_to_luma'),
                        ][i]
                      }
                    </Text>
                  </View>
                  <ShopArt
                    tile={6 + i}
                    style={{height: width >= 700 ? 220 : 240, width: '100%'}}
                  />
                  <View style={{padding: 14, paddingTop: 0}}>
                    {button(
                      `◆ ${pack.shards.toLocaleString()}\n${purchasing ? t('shopscreen.processing') : product?.localizedPrice ?? pack.fallbackPrice}`,
                      () => void buyPack(pack.id),
                      busyPack !== null || !product,
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={s.earn}>
            <ShopArt tile={6} style={{width: 70, height: 85, borderRadius: 12}} />
            <View style={{flex: 1}}>
              <Text style={[s.copy, {color: '#72ecf5'}]}>
                {t('shopscreen.first_clear')}
                {ECONOMY.shards.levelClear} {t('shopscreen.shards_replays')}
                {ECONOMY.shards.repeatClear} {t('shopscreen.shards')}
              </Text>
              <Text style={s.copy}>
                {t(
                  'shopscreen.precision_bonuses_and_world_rewards_add_more_equip_boosts_from_th',
                )}
              </Text>
            </View>
          </View>
          <View style={s.footer}>
            <Text style={[s.micro, {flex: 1, textAlign: 'right'}]}>
              {t('shopscreen.prepare_today')}
              {'\n'}
              {t('shopscreen.a_brighter_tomorrow')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {...StyleSheet.absoluteFill, backgroundColor: '#03121f'},
  page: {width: '100%', maxWidth: 1160},
  hero: {overflow: 'hidden', borderRadius: 22, justifyContent: 'center'},
  heroCopy: {padding: 20},
  eyebrow: {color: '#89c8f8', fontSize: 11, letterSpacing: 3},
  title: {color: '#f6fbff', fontWeight: '800', lineHeight: 51, marginTop: 10},
  lead: {color: '#abebff', fontSize: 16, marginVertical: 12},
  wallet: {
    borderColor: '#288cac',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#032235cc',
    marginTop: 8,
  },
  walletValue: {color: '#63ecfa', fontSize: 13, fontWeight: '800'},
  copy: {color: '#b7d7e8', fontSize: 14, lineHeight: 22, marginTop: 8},
  sectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 26,
    marginBottom: 14,
  },
  section: {color: '#38d9f7', fontSize: 17, letterSpacing: 2, fontWeight: '700'},
  micro: {color: '#91b7d6', fontSize: 9, letterSpacing: 1.4, lineHeight: 17},
  grid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12},
  boost: {
    overflow: 'hidden',
    borderColor: '#20627f',
    borderWidth: 1,
    borderRadius: 20,
    backgroundColor: '#031a2a',
  },
  boostFocus: {
    borderColor: '#3BE7FF',
    borderWidth: 2,
    backgroundColor: '#063048',
    shadowColor: '#3BE7FF',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 0},
    elevation: 6,
  },
  focusTag: {
    color: '#3BE7FF',
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginTop: 6,
  },
  cardCopy: {padding: 13, paddingTop: 5, flex: 1},
  cardTitle: {color: '#f3f7ff', fontSize: 18, fontWeight: '800'},
  description: {color: '#badced', fontSize: 13, lineHeight: 20, marginTop: 10, flex: 1},
  button: {borderRadius: 13, overflow: 'hidden', marginTop: 12},
  outline: {borderColor: '#39cde4', borderWidth: 1},
  buttonFill: {
    paddingVertical: 13,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  buttonText: {
    fontWeight: '800',
    fontSize: 13,
    color: '#211b0d',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.4,
  },
  owned: {color: '#58eafa', fontSize: 10, textAlign: 'center', marginTop: 12},
  recharge: {
    overflow: 'hidden',
    borderRadius: 22,
    borderColor: '#227899',
    borderWidth: 1,
    marginTop: 26,
    justifyContent: 'center',
  },
  cardHeading: {color: 'white', fontSize: 28, fontWeight: '800'},
  pack: {
    overflow: 'hidden',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#264f70',
    backgroundColor: '#051526',
  },
  packHeading: {padding: 18, minHeight: 106},
  earn: {
    marginTop: 22,
    borderWidth: 1,
    borderColor: '#275b72',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  footer: {flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 18},
  notice: {color: '#7ce8ef', textAlign: 'center', padding: 12},
});
