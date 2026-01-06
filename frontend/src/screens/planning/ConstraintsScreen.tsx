import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { suggestionApi, DaySuggestion } from '../../services/api/suggestions';
import { SuggestionConstraints } from '../../types';
import { PlannerStackParamList } from '../../navigation/BottomTabNavigator';
import { PlanningLoader } from '../../components/PlanningLoader';
import { parseDate, getNextMonday, dateToString, addDays, formatDateString } from '../../utils/dateUtils';

type ConstraintsScreenNavigationProp = NativeStackNavigationProp<
  PlannerStackParamList,
  'Constraints'
>;

type ConstraintsScreenRouteProp = RouteProp<PlannerStackParamList, 'Constraints'>;

interface Props {
  navigation: ConstraintsScreenNavigationProp;
  route?: ConstraintsScreenRouteProp;
}

export default function ConstraintsScreen({ navigation, route }: Props) {
  // Get start date from route params or calculate next Monday
  const getStartDate = (): Date => {
    if (route?.params?.startDate) {
      // Parse the provided date string (YYYY-MM-DD) using timezone-safe utility
      return parseDate(route.params.startDate);
    }

    // Default: Get next Monday using timezone-safe utility
    const mondayStr = getNextMonday();
    return parseDate(mondayStr);
  };

  const [startDate] = useState(getStartDate());
  // Days to cook - all days selected by default
  const [dinnerDays, setDinnerDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [avoidRepeats, setAvoidRepeats] = useState(true);
  const [showLoader, setShowLoader] = useState(false);

  // Store results to navigate after loader completes
  const pendingResultsRef = useRef<{
    constraints: SuggestionConstraints;
    suggestions: DaySuggestion[];
  } | null>(null);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const fullDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (dayIndex: number) => {
    setDinnerDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex].sort((a, b) => a - b)
    );
  };

  // Convert selected dinner days to days to skip (inverse)
  const getDaysToSkip = (): number[] => {
    return [0, 1, 2, 3, 4, 5, 6].filter((d) => !dinnerDays.includes(d));
  };

  const getDayDate = (dayIndex: number): string => {
    // Use timezone-safe date utilities
    const startDateStr = dateToString(startDate);
    const targetDateStr = addDays(startDateStr, dayIndex);

    return formatDateString(targetDateStr, { month: 'short', day: 'numeric' });
  };

  const formatStartDate = (): string => {
    return dateToString(startDate);
  };

  const handleGeneratePlan = async () => {
    // Show the loader immediately
    setShowLoader(true);

    try {
      const constraints: SuggestionConstraints = {
        startDate: formatStartDate(),
        daysToSkip: getDaysToSkip(),
        avoidRepeats,
        preferSimple: false,
        vegetarianOnly: false,
      };

      const suggestions = await suggestionApi.generateSuggestions(constraints);

      // Store results to use when loader completes
      pendingResultsRef.current = { constraints, suggestions };
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setShowLoader(false);
      Alert.alert(
        'Oops!',
        'Something went wrong generating your meal plan. Please try again.'
      );
    }
  };

  const handleLoaderComplete = () => {
    setShowLoader(false);
    if (pendingResultsRef.current) {
      const { constraints, suggestions } = pendingResultsRef.current;
      pendingResultsRef.current = null;
      navigation.navigate('Suggestions', {
        constraints,
        suggestions,
      });
    }
  };

  // Show loading screen while generating
  if (showLoader) {
    return <PlanningLoader onComplete={handleLoaderComplete} duration={2500} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Greeting */}
      <View style={styles.greetingContainer}>
        <Text style={styles.greeting}>Hey! Ready to plan this week's dinners?</Text>
        <Text style={styles.subGreeting}>
          Week of {startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
        </Text>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={styles.progressLine} />
        <View style={styles.progressDot} />
        <View style={styles.progressLine} />
        <View style={styles.progressDot} />
        <Text style={styles.progressText}>Step 1 of 3</Text>
      </View>

      {/* Day Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Which days do you want dinner?</Text>
        <Text style={styles.sectionSubtitle}>Tap to select or deselect days</Text>
        <View style={styles.daysContainer}>
          {dayNames.map((day, index) => {
            const isSelected = dinnerDays.includes(index);
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayChip,
                  isSelected && styles.dayChipSelected,
                ]}
                onPress={() => toggleDay(index)}
                activeOpacity={0.7}
              >
                {!isSelected && <View style={styles.strikethrough} />}
                <Text
                  style={[
                    styles.dayChipText,
                    isSelected && styles.dayChipTextSelected,
                  ]}
                >
                  {day}
                </Text>
                <Text
                  style={[
                    styles.dayChipDate,
                    isSelected && styles.dayChipDateSelected,
                  ]}
                >
                  {getDayDate(index)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {dinnerDays.length < 7 && dinnerDays.length > 0 && (
          <Text style={styles.planningInfo}>
            Planning {dinnerDays.length} dinner{dinnerDays.length !== 1 ? 's' : ''} this week
          </Text>
        )}
        {dinnerDays.length === 0 && (
          <Text style={styles.warningInfo}>
            Select at least one day to plan dinners
          </Text>
        )}
      </View>

      {/* Filter Toggles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Any preferences?</Text>

        <TouchableOpacity
          style={[styles.toggleRow, avoidRepeats && styles.toggleRowActive]}
          onPress={() => setAvoidRepeats(!avoidRepeats)}
          activeOpacity={0.7}
        >
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Avoid recent repeats</Text>
            <Text style={styles.toggleDescription}>
              Skip recipes from the last 10 days
            </Text>
          </View>
          <View style={[styles.toggle, avoidRepeats && styles.toggleActive]}>
            {avoidRepeats && <Text style={styles.toggleCheck}>✓</Text>}
          </View>
        </TouchableOpacity>
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        style={[
          styles.generateButton,
          dinnerDays.length === 0 && styles.generateButtonDisabled,
        ]}
        onPress={handleGeneratePlan}
        disabled={dinnerDays.length === 0}
        activeOpacity={0.8}
      >
        <Text style={styles.generateButtonText}>Generate Plan</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  greetingContainer: {
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subGreeting: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
    maxWidth: 40,
  },
  progressText: {
    marginLeft: spacing.md,
    fontSize: typography.sizes.small,
    color: colors.textLight,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.medium as any,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dayChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    minWidth: 70,
    position: 'relative',
  },
  strikethrough: {
    position: 'absolute',
    width: '90%',
    height: 2,
    backgroundColor: colors.textLight,
    opacity: 0.4,
  },
  dayChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayChipText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium as any,
    color: colors.text,
  },
  dayChipTextSelected: {
    color: colors.white,
  },
  dayChipDate: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
    marginTop: 2,
  },
  dayChipDateSelected: {
    color: colors.white,
    opacity: 0.9,
  },
  planningInfo: {
    marginTop: spacing.md,
    fontSize: typography.sizes.small,
    color: colors.primary,
    fontWeight: typography.weights.medium as any,
  },
  warningInfo: {
    marginTop: spacing.md,
    fontSize: typography.sizes.small,
    color: colors.error || '#DC3545',
    fontStyle: 'italic',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  toggleRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium as any,
    color: colors.text,
  },
  toggleDescription: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
    marginTop: 2,
  },
  toggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleCheck: {
    color: colors.white,
    fontWeight: typography.weights.bold as any,
    fontSize: 14,
  },
  generateButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    marginTop: spacing.lg,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: colors.textOnPrimary,
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold as any,
  },
});
