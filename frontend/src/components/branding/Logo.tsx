import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { colors, typography, spacing } from '../../theme';

const INK = '#FDFAF6';
const SMALL_CUT_MAX = 32;

// Mirrors PATHS in scripts/logoMark.js (logoMark.test.js enforces it).
const MARK = {
  full: {
    m: {
      d: 'M20.3 76.6V50A14.8 14.8 0 0 1 50 50V76.6M50 50A14.8 14.8 0 0 1 79.7 50V76.6',
      strokeWidth: 11,
    },
    knobs: { cy: 20.4, cxs: [35.2, 64.8], r: 6 },
    table: { x: 10.2, y: 78.6, width: 79.6, height: 7, rx: 3.5 },
  },
  small: {
    m: {
      d: 'M19 78V50A15.5 15.5 0 0 1 50 50V78M50 50A15.5 15.5 0 0 1 81 50V78',
      strokeWidth: 14,
    },
    knobs: { cy: 19.5, cxs: [34.5, 65.5], r: 7.5 },
    table: { x: 8, y: 80, width: 84, height: 9, rx: 4.5 },
  },
};

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
  // "Two Cloches" mark. Geometry mirrors scripts/logoMark.js (100x100 box).
  // default: terracotta badge + cream mark (for light surfaces)
  // light:   cream mark only, for placement on a terracotta surface (headers)
  // dark:    badge in dark text color
  // Icons at or below SMALL_CUT_MAX px use the heavier small-size cut.
  const badgeColor = variant === 'dark' ? colors.text : colors.primary;
  const geo = size <= SMALL_CUT_MAX ? MARK.small : MARK.full;
  const inset = variant === 'light' ? 'translate(0 0)' : 'translate(6 6) scale(0.88)';

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {variant !== 'light' && (
        <Rect width="100" height="100" rx="22" fill={badgeColor} />
      )}
      <G transform={inset}>
        <Path d={geo.m.d} fill="none" stroke={INK} strokeWidth={geo.m.strokeWidth} />
        {geo.knobs.cxs.map((cx) => (
          <Circle key={cx} cx={cx} cy={geo.knobs.cy} r={geo.knobs.r} fill={INK} />
        ))}
        <Rect
          x={geo.table.x}
          y={geo.table.y}
          width={geo.table.width}
          height={geo.table.height}
          rx={geo.table.rx}
          fill={INK}
        />
      </G>
    </Svg>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: typography.families.display,
    letterSpacing: 0.3,
  },
});

export default Logo;
