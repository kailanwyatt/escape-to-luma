import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { GameSettings } from '../persistence/GameSave';

type Props = {
  settings: GameSettings;
  systemReduceMotion: boolean;
  removeAds: boolean;
  purchaseBusy: boolean;
  purchaseMessage: string | null;
  onToggle: (key: keyof GameSettings) => void;
  onRemoveAds: () => void;
  onRestore: () => void;
  onBack: () => void;
};

export function SettingsScreen({
  settings,
  systemReduceMotion,
  removeAds,
  purchaseBusy,
  purchaseMessage,
  onToggle,
  onRemoveAds,
  onRestore,
  onBack,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 24) + 48, paddingBottom: insets.bottom }]}>
      <Text style={styles.title}>SETTINGS</Text>
      <Toggle
        label="SOUND EFFECTS"
        value={settings.soundEnabled}
        onPress={() => onToggle('soundEnabled')}
      />
      <Toggle
        label="HAPTICS"
        value={settings.hapticsEnabled}
        onPress={() => onToggle('hapticsEnabled')}
      />
      <Toggle
        label="REDUCE MOTION"
        value={settings.reduceMotion || systemReduceMotion}
        locked={systemReduceMotion}
        onPress={() => onToggle('reduceMotion')}
      />
      {systemReduceMotion ? (
        <Text style={styles.note}>System Reduce Motion is on</Text>
      ) : null}
      <Text style={styles.section}>ADS</Text>
      <Text style={styles.blurb}>
        {removeAds
          ? 'Interstitials removed. Optional Continue ads still available.'
          : 'Enjoy uninterrupted runs. Optional Continue ads stay available.'}
      </Text>
      {removeAds ? (
        <Text style={styles.owned}>REMOVE ADS OWNED</Text>
      ) : (
        <Pressable
          style={[styles.purchase, purchaseBusy && styles.purchaseBusy]}
          disabled={purchaseBusy}
          onPress={onRemoveAds}
        >
          <Text style={styles.purchaseText}>{purchaseBusy ? 'WORKING…' : 'REMOVE ADS'}</Text>
        </Pressable>
      )}
      <Pressable style={styles.restore} disabled={purchaseBusy} onPress={onRestore}>
        <Text style={styles.restoreText}>RESTORE PURCHASES</Text>
      </Pressable>
      {purchaseMessage ? <Text style={styles.note}>{purchaseMessage}</Text> : null}
      <Pressable style={styles.back} onPress={onBack}>
        <Text style={styles.backText}>BACK</Text>
      </Pressable>
    </View>
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
    <Pressable style={styles.row} onPress={locked ? undefined : onPress}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, value && styles.on]}>{value ? 'ON' : 'OFF'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,8,7,0.94)',
    paddingTop: 72,
    paddingHorizontal: 28,
  },
  title: {
    color: '#ffd24a',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 28,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(244,239,230,0.12)',
  },
  label: {
    color: '#f4efe6',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  value: {
    color: 'rgba(244,239,230,0.45)',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  on: {
    color: '#7ef0ff',
  },
  note: {
    marginTop: 16,
    color: 'rgba(244,239,230,0.5)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginTop: 36,
    color: '#ffd24a',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3,
  },
  blurb: {
    marginTop: 10,
    color: 'rgba(244,239,230,0.62)',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  owned: {
    marginTop: 18,
    color: '#7ef0ff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  purchase: {
    marginTop: 18,
    alignSelf: 'flex-start',
    backgroundColor: '#d06a32',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  purchaseBusy: {
    opacity: 0.5,
  },
  purchaseText: {
    color: '#fff8ef',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  restore: {
    marginTop: 14,
    paddingVertical: 8,
  },
  restoreText: {
    color: '#7ef0ff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  back: {
    alignSelf: 'center',
    marginTop: 36,
    paddingVertical: 12,
  },
  backText: {
    color: '#7ef0ff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
