import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { colors, typography, spacing } from '../theme';

interface PlanningLoaderProps {
  onComplete: () => void;
  duration?: number;
}

const LOADING_MESSAGES = [
  { text: 'Preparing your meal plan...', icon: '📚' },
  { text: 'Almost there...', icon: '✨' },
];

export const PlanningLoader: React.FC<PlanningLoaderProps> = ({
  onComplete,
  duration = 2500,
}) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    // Spin animation for the plate
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation for the icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Dot animation
    const animateDots = () => {
      Animated.loop(
        Animated.stagger(200, [
          Animated.sequence([
            Animated.timing(dotAnims[0], {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(dotAnims[0], {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(dotAnims[1], {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(dotAnims[1], {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(dotAnims[2], {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(dotAnims[2], {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };
    animateDots();

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    // Message rotation
    const messageInterval = duration / LOADING_MESSAGES.length;
    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => {
        if (prev < LOADING_MESSAGES.length - 1) {
          // Fade out and in for message change
          Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
          return prev + 1;
        }
        return prev;
      });
    }, messageInterval);

    // Complete after duration
    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearInterval(messageTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete, spinAnim, fadeAnim, progressAnim, pulseAnim, dotAnims]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const currentMessage = LOADING_MESSAGES[messageIndex];

  return (
    <View style={styles.container}>
      {/* Animated plate icon */}
      <View style={styles.iconContainer}>
        <Animated.View
          style={[
            styles.plateRing,
            { transform: [{ rotate: spin }] },
          ]}
        >
          <View style={styles.plateRingInner} />
        </Animated.View>
        <Animated.Text
          style={[
            styles.centerIcon,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          🍽️
        </Animated.Text>
      </View>

      {/* Current status */}
      <View style={styles.messageContainer}>
        <Animated.Text style={[styles.icon, { opacity: fadeAnim }]}>
          {currentMessage.icon}
        </Animated.Text>
        <Animated.Text style={[styles.message, { opacity: fadeAnim }]}>
          {currentMessage.text}
        </Animated.Text>
      </View>

      {/* Animated dots */}
      <View style={styles.dotsContainer}>
        {dotAnims.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                opacity: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
                transform: [
                  {
                    scale: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.3],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: progressWidth },
            ]}
          />
        </View>
      </View>

      {/* Bottom text */}
      <Text style={styles.bottomText}>
        Creating your perfect meal plan
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  plateRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.primary,
    borderTopColor: 'transparent',
    borderRightColor: colors.secondary,
  },
  plateRingInner: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    borderBottomColor: 'transparent',
  },
  centerIcon: {
    fontSize: 48,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    minHeight: 80,
  },
  icon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.medium,
    color: colors.text,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  progressContainer: {
    width: '80%',
    marginBottom: spacing.lg,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  bottomText: {
    fontSize: typography.sizes.small,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});

export default PlanningLoader;
