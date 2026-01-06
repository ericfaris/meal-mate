import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { colors, typography, spacing } from '../../theme';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'splash';
  showText?: boolean;
  variant?: 'default' | 'light' | 'dark';
}

const SIZES = {
  small: { icon: 32, text: 16, gap: 6 },
  medium: { icon: 48, text: 20, gap: 8 },
  large: { icon: 72, text: 28, gap: 12 },
  splash: { icon: 120, text: 36, gap: 16 },
};

export const Logo: React.FC<LogoProps> = ({
  size = 'medium',
  showText = true,
  variant = 'default',
}) => {
  const dimensions = SIZES[size];

  const textColor = variant === 'light'
    ? colors.white
    : variant === 'dark'
      ? colors.text
      : colors.primary;

  return (
    <View style={styles.container}>
      <LogoIcon size={dimensions.icon} variant={variant} />
      {showText && (
        <Text
          style={[
            styles.text,
            {
              fontSize: dimensions.text,
              color: textColor,
              marginTop: dimensions.gap,
            },
          ]}
        >
          Meal Mate
        </Text>
      )}
    </View>
  );
};

interface LogoIconProps {
  size: number;
  variant?: 'default' | 'light' | 'dark';
}

export const LogoIcon: React.FC<LogoIconProps> = ({
  size,
  variant = 'default'
}) => {
  // Color scheme based on variant
  const plateColor = variant === 'light' ? colors.white : colors.primary;
  const accentColor = variant === 'light' ? colors.primaryLight : colors.secondary;
  const steamColor = variant === 'light' ? 'rgba(255,255,255,0.7)' : colors.textMuted;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Plate/Bowl base */}
      <Circle
        cx="50"
        cy="55"
        r="40"
        fill={plateColor}
        opacity={0.2}
      />
      <Circle
        cx="50"
        cy="55"
        r="35"
        fill={plateColor}
        opacity={0.4}
      />
      <Circle
        cx="50"
        cy="55"
        r="28"
        fill={plateColor}
      />

      {/* Fork - left utensil */}
      <G transform="translate(25, 20) rotate(-15, 10, 30)">
        {/* Fork handle */}
        <Path
          d="M8 25 L8 55"
          stroke={accentColor}
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Fork tines */}
        <Path
          d="M4 10 L4 25 M8 8 L8 25 M12 10 L12 25"
          stroke={accentColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </G>

      {/* Knife - right utensil */}
      <G transform="translate(60, 20) rotate(15, 10, 30)">
        {/* Knife handle */}
        <Path
          d="M10 25 L10 55"
          stroke={accentColor}
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Knife blade */}
        <Path
          d="M10 10 L10 25 L14 25 L14 12 Z"
          fill={accentColor}
        />
      </G>

      {/* Steam wisps */}
      <G opacity={0.6}>
        <Path
          d="M40 35 Q38 28 42 22 Q40 18 44 12"
          stroke={steamColor}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M50 32 Q48 25 52 20 Q50 15 54 10"
          stroke={steamColor}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M60 35 Q58 28 62 22 Q60 18 64 12"
          stroke={steamColor}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </G>

      {/* Heart accent on plate */}
      <Path
        d="M50 60 C50 55 45 52 42 55 C38 58 38 62 42 66 L50 72 L58 66 C62 62 62 58 58 55 C55 52 50 55 50 60"
        fill={variant === 'light' ? colors.primary : colors.white}
        opacity={0.9}
        transform="scale(0.5) translate(50, 70)"
      />
    </Svg>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
});

export default Logo;
