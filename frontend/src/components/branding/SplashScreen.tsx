import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Logo } from './Logo';
import { colors, typography } from '../../theme';

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

const { height } = Dimensions.get('window');

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onAnimationComplete,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate logo entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Then animate tagline
      Animated.timing(taglineAnim, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }).start(() => {
        // Notify parent after animation
        if (onAnimationComplete) {
          setTimeout(onAnimationComplete, 800);
        }
      });
    });
  }, [fadeAnim, scaleAnim, taglineAnim, onAnimationComplete]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Logo size="splash" showText variant="default" />
      </Animated.View>

      <Animated.Text
        style={[
          styles.tagline,
          {
            opacity: taglineAnim,
            transform: [
              {
                translateY: taglineAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        Plan your week, love your meals
      </Animated.Text>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with love for family dinners</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: {
    marginTop: 24,
    fontSize: typography.sizes.body,
    color: colors.textLight,
    fontWeight: typography.weights.medium,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.sizes.small,
    color: colors.textMuted,
  },
});

export default SplashScreen;
