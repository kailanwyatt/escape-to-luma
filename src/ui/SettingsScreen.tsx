import {t} from '../i18n';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';

import { RELEASE_POLICY } from '../config/release';
import { Screen, ScreenTitle, color, space } from '../design';
import type { GameSettings } from '../persistence/GameSave';

type Props = {
  devUnlockAll?:boolean;
  onToggleDevUnlock?:()=>void;
  settings: GameSettings;
  systemReduceMotion: boolean;
  removeAds: boolean;
  purchaseBusy: boolean;
  purchaseMessage: string | null;
  onToggle: (key: keyof GameSettings) => void;
  onRemoveAds: () => void;
  onRestore: () => void;
  onShareDiagnostics: () => void;
  onReplayOpening: () => void;
  onBack: () => void;
};

export function SettingsScreen({
  devUnlockAll=false,onToggleDevUnlock,
  settings,
  systemReduceMotion,
  removeAds,
  purchaseBusy,
  purchaseMessage,
  onToggle,
  onRemoveAds,
  onRestore,
  onShareDiagnostics,
  onBack,
  onReplayOpening,
}: Props) {
  return (
    <Screen onBack={onBack} backLabel={t("journeyscreen.back_to_home")}>
      <ScreenTitle title={t("settingsscreen.settings")} />
      {__DEV__ && onToggleDevUnlock ? <View><Text style={styles.section}>{t("settingsscreen.development")}</Text><Toggle label={t("settingsscreen.unlock_all_levels")} value={devUnlockAll} onPress={onToggleDevUnlock}/><Text style={styles.note}>{t("settingsscreen.session_only_unlocking_grants_no_rewards_played_levels_still_save")}</Text></View> : null}
      <Toggle
        label={t("settingsscreen.sound_effects")}
        value={settings.soundEnabled}
        onPress={() => onToggle('soundEnabled')}
      />
      <Toggle
        label={t("settingsscreen.haptics")}
        value={settings.hapticsEnabled}
        onPress={() => onToggle('hapticsEnabled')}
      />
      <Toggle
        label={t("settingsscreen.reduce_motion")}
        value={settings.reduceMotion || systemReduceMotion}
        locked={systemReduceMotion}
        onPress={() => onToggle('reduceMotion')}
      />
      {systemReduceMotion ? (
        <Text style={styles.note}>{t("settingsscreen.system_reduce_motion_is_on")}</Text>
      ) : null}
      {RELEASE_POLICY.purchasesEnabled || RELEASE_POLICY.adsEnabled ? (
        <>
          <Text style={styles.section}>{t("settingsscreen.ads")}</Text>
          <Text style={styles.blurb}>
            {removeAds
              ? t("settingsscreen.interstitials_removed_optional_continue_ads_still_available")
              : t("settingsscreen.enjoy_uninterrupted_runs_optional_continue_ads_stay_available")}
          </Text>
          {removeAds ? (
            <Text style={styles.owned}>{t("settingsscreen.remove_ads_owned")}</Text>
          ) : (
            <Pressable
              style={[styles.purchase, purchaseBusy && styles.purchaseBusy]}
              disabled={purchaseBusy}
              onPress={onRemoveAds}
            >
              <Text style={styles.purchaseText}>{purchaseBusy ? 'WORKING…' : t("settingsscreen.remove_ads")}</Text>
            </Pressable>
          )}
          <Pressable style={styles.restore} disabled={purchaseBusy} onPress={onRestore}>
            <Text style={styles.restoreText}>{t("settingsscreen.restore_purchases")}</Text>
          </Pressable>
          {purchaseMessage ? <Text style={styles.note}>{purchaseMessage}</Text> : null}
        </>
      ) : (
        <Text style={styles.betaNote}>{t("settingsscreen.beta_no_ads_or_purchases")}</Text>
      )}
      <Pressable style={styles.diagnostics} onPress={onShareDiagnostics}>
        <Text style={styles.restoreText}>{t("settingsscreen.share_diagnostics")}</Text>
      </Pressable>
      <Text style={styles.build}>
        {t("settingsscreen.version")}{Constants.expoConfig?.version ?? t("settingsscreen.local")} {t("settingsscreen.build")}{Constants.expoConfig?.ios?.buildNumber ?? t("settingsscreen.dev")}
      </Text>
      <Pressable accessibilityRole="button" style={styles.diagnostics} onPress={onReplayOpening}>
        <Text style={styles.restoreText}>{t("settingsscreen.replay_opening")}</Text>
      </Pressable>
    </Screen>
  );
}

function Toggle({
  label,
  value,
  locked,
  onPress,
}: {
  label: string;
  value: boolean;
  locked?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{checked:value,disabled:locked}} style={styles.row} onPress={locked ? undefined : onPress}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, value && styles.on]}>{value ? t("debugoverlay.on") : t("debugoverlay.off")}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.stroke,
  },
  label: {
    color: color.cream,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  value: {
    color: color.creamFaint,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  on: {
    color: color.cyanBright,
  },
  note: {
    marginTop: 16,
    color: color.creamFaint,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  betaNote: {
    marginTop: 36,
    color: 'rgba(126,240,255,0.7)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
  section: {
    marginTop: 36,
    color: color.amberBright,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3,
  },
  blurb: {
    marginTop: 10,
    color: color.creamMuted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  owned: {
    marginTop: 18,
    color: color.cyanBright,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  purchase: {
    marginTop: 18,
    alignSelf: 'flex-start',
    backgroundColor: color.copper,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  purchaseBusy: {
    opacity: 0.5,
  },
  purchaseText: {
    color: color.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  restore: {
    marginTop: 14,
    paddingVertical: 8,
  },
  diagnostics: {
    marginTop: space.lg,
    alignSelf: 'center',
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderColor: color.panelBorder,
    borderRadius: 12,
  },
  build: {
    marginTop: space.md,
    color: color.creamFaint,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  restoreText: {
    color: color.cyanBright,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
