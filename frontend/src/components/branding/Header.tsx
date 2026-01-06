import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LogoIcon } from './Logo';
import { colors, spacing } from '../../theme';

interface HeaderLogoProps {
  tintColor?: string;
}

export const HeaderLogo: React.FC<HeaderLogoProps> = ({ tintColor }) => {
  return (
    <View style={styles.container}>
      <LogoIcon size={32} variant="light" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: spacing.sm,
  },
});

export default HeaderLogo;
