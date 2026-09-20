import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { color, space } from '../design';
import { GameLog } from '../debug/GameLog';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    GameLog.error(`UI error at ${info.componentStack?.slice(0, 500) ?? 'unknown component'}`, error);
  }

  render(): ReactNode {
    if (!this.state.error) {
      return this.props.children;
    }
    return (
      <View style={styles.root}>
        <Text style={styles.kicker}>SPARK RECOVERY</Text>
        <Text style={styles.title}>THE SIGNAL FLICKERED</Text>
        <Text style={styles.body}>
          Your saved journey is still on this device. Retry the interface, then share diagnostics
          from Settings if the problem returns.
        </Text>
        <Pressable style={styles.button} onPress={() => this.setState({ error: null })}>
          <Text style={styles.buttonText}>RETRY</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    backgroundColor: color.ink,
  },
  kicker: {
    color: color.cyanBright,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3,
  },
  title: {
    marginTop: space.sm,
    color: color.white,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  body: {
    marginTop: space.md,
    color: color.creamMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  button: {
    marginTop: space.xl,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    borderRadius: 18,
    backgroundColor: color.amber,
  },
  buttonText: {
    color: color.inkText,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
