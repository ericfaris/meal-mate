import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { Restaurant } from '../../types';
import { restaurantApi } from '../../services/api';
import SlotMachine from '../../components/SlotMachine';

// Conditionally import confetti if available
let ConfettiCannon: any = null;
try {
  ConfettiCannon = require('react-native-confetti-cannon').default;
} catch (e) {
  // Library not installed, will skip confetti
}

type RouletteStackParamList = {
  RouletteHome: undefined;
  RestaurantsList: undefined;
  RestaurantEntry: { restaurant?: Restaurant; mode?: 'create' | 'edit' };
};

type RouletteScreenNavigationProp = NativeStackNavigationProp<
  RouletteStackParamList,
  'RouletteHome'
>;

type RouletteScreenRouteProp = RouteProp<RouletteStackParamList, 'RouletteHome'>;

interface Props {
  navigation: RouletteScreenNavigationProp;
  route: RouletteScreenRouteProp;
}

type ScreenState = 'idle' | 'spinning' | 'result';

export default function RouletteScreen({ navigation }: Props) {
  const [state, setState] = useState<ScreenState>('idle');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>(undefined);
  const [stats, setStats] = useState({ totalRestaurants: 0, totalVisits: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [restaurantsData, statsData] = await Promise.all([
        restaurantApi.getAll(),
        restaurantApi.getStats(),
      ]);
      setRestaurants(restaurantsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load restaurants');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpin = async () => {
    if (restaurants.length === 0) {
      Alert.alert('No Restaurants', 'Add some restaurants first to start spinning!');
      return;
    }

    setState('spinning');

    try {
      const winner = await restaurantApi.spin();
      setSelectedRestaurant(winner);

      // Find the index of the winner in our local array for the animation
      const winnerIndex = restaurants.findIndex(r => r._id === winner._id);
      setSelectedIndex(winnerIndex);

      // The SlotMachine component will handle the animation and call onSpinComplete
    } catch (error) {
      console.error('Error spinning:', error);
      Alert.alert('Error', 'Failed to spin the wheel');
      setState('idle');
    }
  };

  const handleSpinComplete = (index: number) => {
    setState('result');
    // Confetti will be triggered in the result state
  };

  const handlePickThis = async () => {
    if (!selectedRestaurant) return;

    try {
      await restaurantApi.recordVisit(selectedRestaurant._id);
      Alert.alert('Enjoy!', `Have a great time at ${selectedRestaurant.name}!`);
      setState('idle');
      setSelectedRestaurant(null);
      loadData(); // Refresh data to update visit counts
    } catch (error) {
      console.error('Error recording visit:', error);
      Alert.alert('Error', 'Failed to record visit');
    }
  };

  const handleSpinAgain = () => {
    setState('idle');
    setSelectedRestaurant(null);
    setSelectedIndex(undefined);
  };

  const getPriceRangeDisplay = (priceRange?: number) => {
    if (!priceRange) return '';
    return '$'.repeat(priceRange);
  };

  const getDaysSinceVisit = (lastVisitedDate?: string) => {
    if (!lastVisitedDate) return 'Never';
    const days = Math.floor((Date.now() - new Date(lastVisitedDate).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading restaurants...</Text>
      </View>
    );
  }

  const restaurantNames = restaurants.map(r => r.name);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Date Night 🎰</Text>
        <TouchableOpacity
          style={styles.manageButton}
          onPress={() => navigation.navigate('RestaurantsList')}
        >
          <Text style={styles.manageButtonText}>Manage List</Text>
        </TouchableOpacity>
      </View>

      {state === 'idle' && (
        <>
          {/* Slot Machine */}
          <View style={styles.slotMachineContainer}>
            {restaurants.length > 0 ? (
              <SlotMachine
                items={restaurantNames}
                onSpinComplete={handleSpinComplete}
                isSpinning={state === 'spinning'}
                selectedIndex={selectedIndex}
              />
            ) : (
              <View style={styles.emptySlot}>
                <Text style={styles.emptySlotEmoji}>🍽️🎰</Text>
                <Text style={styles.emptySlotText}>No restaurants yet!</Text>
                <Text style={styles.emptySlotSubtext}>Add your favorite date spots to get started</Text>
              </View>
            )}
          </View>

          {/* Spin Button */}
          <TouchableOpacity
            style={[styles.spinButton, restaurants.length === 0 && styles.spinButtonDisabled]}
            onPress={handleSpin}
            disabled={restaurants.length === 0}
          >
            <Text style={styles.spinButtonText}>🎰 SPIN!</Text>
          </TouchableOpacity>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {stats.totalRestaurants} restaurants • {stats.totalVisits} total visits
            </Text>
            {stats.totalVisits > 0 && (
              <Text style={styles.lastSpinText}>
                Last spin: {stats.leastRecent?.name || 'Unknown'}
              </Text>
            )}
          </View>
        </>
      )}

      {state === 'spinning' && (
        <View style={styles.spinningContainer}>
          <SlotMachine
            items={restaurantNames}
            onSpinComplete={handleSpinComplete}
            isSpinning={true}
            selectedIndex={selectedIndex}
          />
          <Text style={styles.spinningText}>Spinning...</Text>
        </View>
      )}

      {state === 'result' && selectedRestaurant && (
        <>
          {/* Confetti */}
          {ConfettiCannon && (
            <ConfettiCannon
              ref={confettiRef}
              count={100}
              origin={{ x: 0, y: 0 }}
              colors={['#9D4EDD', '#E040FB', '#FFD700', colors.primary]}
              fadeOut={true}
            />
          )}

          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>🎉 Tonight's Pick! 🎉</Text>

            <View style={styles.winnerCard}>
              <Text style={styles.winnerName}>🍝 {selectedRestaurant.name}</Text>
              <Text style={styles.winnerDetails}>
                {selectedRestaurant.cuisine && `${selectedRestaurant.cuisine} • `}
                {getPriceRangeDisplay(selectedRestaurant.priceRange)}
              </Text>
              <Text style={styles.winnerStats}>
                Last visit: {getDaysSinceVisit(selectedRestaurant.lastVisitedDate)}
              </Text>
              <Text style={styles.winnerStats}>
                Total visits: {selectedRestaurant.visitCount}
              </Text>
            </View>

            <View style={styles.resultButtons}>
              <TouchableOpacity style={styles.resultButton} onPress={handleSpinAgain}>
                <Text style={styles.resultButtonText}>Spin Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.resultButton, styles.pickButton]} onPress={handlePickThis}>
                <Text style={styles.pickButtonText}>Pick This! 🍽️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  manageButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  manageButtonText: {
    ...typography.button,
    color: colors.white,
  },
  slotMachineContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptySlot: {
    width: '80%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  emptySlotEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptySlotText: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  emptySlotSubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  spinButton: {
    backgroundColor: '#9D4EDD',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignSelf: 'center',
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  spinButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  spinButtonText: {
    ...typography.h1,
    color: colors.white,
    fontWeight: 'bold',
  },
  statsContainer: {
    alignItems: 'center',
  },
  statsText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  lastSpinText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  spinningContainer: {
    alignItems: 'center',
  },
  spinningText: {
    ...typography.h2,
    color: colors.primary,
    marginTop: spacing.lg,
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultTitle: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  winnerCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.md,
    minWidth: '80%',
  },
  winnerName: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  winnerDetails: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  winnerStats: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  resultButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  resultButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
  },
  resultButtonText: {
    ...typography.button,
    color: colors.text,
    textAlign: 'center',
  },
  pickButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pickButtonText: {
    ...typography.button,
    color: colors.white,
  },
});