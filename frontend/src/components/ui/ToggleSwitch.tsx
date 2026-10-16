import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme';

interface Props {
  value: boolean;
}

/**
 * The landing page's pill switch (sage when on). Purely visual: the row that
 * contains it owns the press and the accessibility role, so the whole row is
 * the hit target.
 */
export function ToggleSwitch({ value }: Props) {
  return (
    <View style={[styles.track, value && styles.trackOn]}>
      <View style={[styles.knob, value && styles.knobOn]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    padding: 3,
    flexShrink: 0,
  },
  trackOn: {
    backgroundColor: colors.secondary,
  },
  knob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.card,
    transitionProperty: 'transform',
    transitionDuration: '150ms',
  } as any,
  knobOn: {
    transform: [{ translateX: 18 }],
  },
});
