import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing } from '../theme';
import HouseholdSection from '../components/HouseholdSection';

export default function HouseholdScreen() {
  const handleHouseholdChange = () => {
    // Household changes are handled internally by the HouseholdSection component
    // This callback is kept for consistency but may not be needed
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <HouseholdSection onHouseholdChange={handleHouseholdChange} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
});