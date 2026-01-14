import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing } from '../theme';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 80;
const VISIBLE_ITEMS = 3;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface SlotMachineProps {
  items: string[];
  onSpinComplete: (index: number) => void;
  isSpinning: boolean;
  selectedIndex?: number;
}

function SlotMachine({
  items,
  onSpinComplete,
  isSpinning,
  selectedIndex,
}: SlotMachineProps) {
  const scrollY = useSharedValue(0);

  // Create extended list for infinite scroll effect
  const extendedItems = [
    ...items.slice(-5), // Add last 5 items to beginning
    ...items,
    ...items.slice(0, 5), // Add first 5 items to end
  ];

  useEffect(() => {
    if (isSpinning && selectedIndex !== undefined) {
      startSpinAnimation(selectedIndex);
    }
  }, [isSpinning, selectedIndex]);

  const startSpinAnimation = (targetIndex: number) => {
    // Calculate the target scroll position
    // We need to account for the extended items at the beginning
    const adjustedIndex = targetIndex + 5; // +5 because we added 5 items at the beginning
    const targetY = adjustedIndex * ITEM_HEIGHT;

    // Animation sequence: fast spin, then slow down
    scrollY.value = withSequence(
      // Fast initial spin (2 seconds)
      withTiming(extendedItems.length * ITEM_HEIGHT * 2, {
        duration: 2000,
        easing: Easing.linear,
      }),
      // Slow down to target (1.5 seconds)
      withTiming(targetY, {
        duration: 1500,
        easing: Easing.out(Easing.cubic),
      }, (finished) => {
        if (finished) {
          runOnJS(onSpinComplete)(targetIndex);
        }
      })
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -scrollY.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Slot machine frame */}
      <View style={styles.frame}>
        {/* Top gradient overlay */}
        <View style={[styles.overlay, styles.topOverlay]} />

        {/* Center highlight */}
        <View style={styles.highlight} />

        {/* Bottom gradient overlay */}
        <View style={[styles.overlay, styles.bottomOverlay]} />

        {/* Animated list - using simple Views instead of FlatList for better animation */}
        <View style={styles.listWrapper}>
          <Animated.View style={[styles.listContent, animatedStyle]}>
            {extendedItems.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.item}>
                <Text style={styles.itemText} numberOfLines={1}>{item}</Text>
              </View>
            ))}
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  frame: {
    width: width * 0.9,
    height: CONTAINER_HEIGHT,
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    zIndex: 10,
  },
  topOverlay: {
    top: 0,
    backgroundColor: 'rgba(253, 250, 246, 0.9)', // colors.background with opacity
  },
  bottomOverlay: {
    bottom: 0,
    backgroundColor: 'rgba(253, 250, 246, 0.9)', // colors.background with opacity
  },
  highlight: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: colors.primaryLight,
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderColor: colors.primary,
    zIndex: 5,
  },
  listWrapper: {
    height: CONTAINER_HEIGHT,
    overflow: 'hidden',
  },
  listContent: {
    paddingTop: ITEM_HEIGHT, // Offset so first item appears in center slot
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  itemText: {
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '700',
  },
});

export default SlotMachine;