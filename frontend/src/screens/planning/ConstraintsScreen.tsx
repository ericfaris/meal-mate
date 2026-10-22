import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, eyebrow, surface } from '../../theme';
import { suggestionApi, DaySuggestion } from '../../services/api/suggestions';
import { SuggestionConstraints } from '../../types';
import { PlannerStackParamList } from '../../navigation/BottomTabNavigator';
import { PlanningLoader } from '../../components/PlanningLoader';
import { parseDate, getNextMonday, dateToString, addDays, formatDateString } from '../../utils/dateUtils';
import { alertManager } from '../../utils/alertUtils';
import { useResponsive, maxContentWidth } from '../../hooks/useResponsive';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { Ionicons } from '../../components/icons/Ionicons';

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
  const { width } = useResponsive();

  // Calculate responsive content width
  const contentMaxWidth = maxContentWidth.default;
  const shouldConstrainWidth = width > contentMaxWidth + 96;

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
  const [preferSimple, setPreferSimple] = useState(false);
  const [vegetarianOnly, setVegetarianOnly] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  // Store results to navigate after loader completes
  const pendingResultsRef = useRef<{
    constraints: SuggestionConstraints;
    suggestions: DaySuggestion[];
  } | null>(null);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
        vegetarianOnly,
        preferSimple,
        useAI,
      };

      const suggestions = await suggestionApi.generateSuggestions(constraints);

      // Store results to use when loader completes
      pendingResultsRef.current = { constraints, suggestions };
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setShowLoader(false);
      alertManager.showError({
        title: 'Oops!',
        message: 'Something went wrong generating your meal plan. Please try again.',
      });
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
    <View style={[styles.outerContainer, shouldConstrainWidth && styles.desktopOuter]}>
      <ScrollView style={[styles.container, shouldConstrainWidth && styles.desktopContent, shouldConstrainWidth && { maxWidth: contentMaxWidth }]} contentContainerStyle={styles.content}>
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

      {/* Preferences — the landing page's "What's this week like?" panel */}
      <View style={styles.section}>
        <Text style={styles.eyebrow}>Preferences</Text>
        <Text style={styles.sectionTitle}>What's this week like?</Text>
        <View style={styles.prefsPanel}>
          {[
            {
              key: 'avoidRepeats',
              label: 'Avoid repeats',
              description: 'Recent dinners sit out (up to 10 days back)',
              value: avoidRepeats,
              toggle: () => setAvoidRepeats(!avoidRepeats),
            },
            {
              key: 'preferSimple',
              label: 'Keep it quick',
              description: 'Favor the shortest prep + cook times',
              value: preferSimple,
              toggle: () => setPreferSimple(!preferSimple),
            },
            {
              key: 'vegetarianOnly',
              label: 'Vegetarian only',
              description: 'Only recipes marked vegetarian',
              value: vegetarianOnly,
              toggle: () => setVegetarianOnly(!vegetarianOnly),
            },
            {
              key: 'useAI',
              label: 'AI-enhanced variety',
              description: 'Balance the week (light after heavy, mix it up)',
              value: useAI,
              toggle: () => setUseAI(!useAI),
            },
          ].map((pref, i, all) => (
            <TouchableOpacity
              key={pref.key}
              testID={`pref-${pref.key}`}
              style={[styles.prefRow, i === all.length - 1 && styles.prefRowLast]}
              onPress={pref.toggle}
              activeOpacity={0.7}
              accessibilityRole="switch"
              accessibilityState={{ checked: pref.value }}
            >
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>{pref.label}</Text>
                <Text style={styles.toggleDescription}>{pref.description}</Text>
              </View>
              <ToggleSwitch value={pref.value} />
            </TouchableOpacity>
          ))}
        </View>
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
        <Ionicons name="sparkles-outline" size={20} color={colors.textOnPrimary} />
        <Text style={styles.generateButtonText}>Suggest my week</Text>
      </TouchableOpacity>
      </ScrollView>
    </View>
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
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    minWidth: 70,
    position: 'relative',
  },
  strikethrough: {
    position: 'absolute',
    top: '50%',
    width: '70%',
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.5,
  },
  dayChipSelected: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  dayChipText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold as any,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.primary,
  },
  dayChipTextSelected: {
    color: colors.textMuted,
  },
  dayChipDate: {
    fontFamily: typography.families.display,
    fontSize: 17,
    fontWeight: typography.weights.semibold as any,
    color: colors.primary,
    marginTop: 2,
  },
  dayChipDateSelected: {
    color: colors.text,
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
  eyebrow: {
    ...eyebrow,
    marginBottom: spacing.xs,
  },
  prefsPanel: {
    ...surface,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderStyle: 'dashed',
  },
  prefRowLast: {
    borderBottomWidth: 0,
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
  generateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    marginTop: spacing.md,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: colors.textOnPrimary,
    fontFamily: typography.families.body,
    fontSize: 18,
    fontWeight: typography.weights.bold as any,
  },
  // Responsive desktop/tablet styles
  outerContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  desktopOuter: {
    backgroundColor: colors.divider,
    alignItems: 'center',
  },
  desktopContent: {
    alignSelf: 'center',
    backgroundColor: colors.background,
  },
});
