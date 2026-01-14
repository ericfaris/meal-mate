import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { Restaurant } from '../../types';
import { restaurantApi } from '../../services/api';

type RouletteStackParamList = {
  RouletteHome: undefined;
  RestaurantsList: undefined;
  RestaurantEntry: { restaurant?: Restaurant; mode?: 'create' | 'edit' };
};

type RestaurantsListScreenNavigationProp = NativeStackNavigationProp<
  RouletteStackParamList,
  'RestaurantsList'
>;

type RestaurantsListScreenRouteProp = RouteProp<RouletteStackParamList, 'RestaurantsList'>;

interface Props {
  navigation: RestaurantsListScreenNavigationProp;
  route: RestaurantsListScreenRouteProp;
}

export default function RestaurantsListScreen({ navigation }: Props) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    filterRestaurants();
  }, [restaurants, searchQuery]);

  const loadRestaurants = async () => {
    try {
      setIsLoading(true);
      const data = await restaurantApi.getAll();
      setRestaurants(data);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      Alert.alert('Error', 'Failed to load restaurants');
    } finally {
      setIsLoading(false);
    }
  };

  const filterRestaurants = () => {
    if (!searchQuery.trim()) {
      setFilteredRestaurants(restaurants);
      return;
    }

    const filtered = restaurants.filter(restaurant =>
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (restaurant.cuisine && restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredRestaurants(filtered);
  };

  const handleToggleActive = async (restaurant: Restaurant) => {
    try {
      await restaurantApi.update(restaurant._id, { isActive: !restaurant.isActive });
      loadRestaurants(); // Refresh the list
    } catch (error) {
      console.error('Error updating restaurant:', error);
      Alert.alert('Error', 'Failed to update restaurant');
    }
  };

  const handleDelete = (restaurant: Restaurant) => {
    Alert.alert(
      'Delete Restaurant',
      `Are you sure you want to delete "${restaurant.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await restaurantApi.delete(restaurant._id);
              loadRestaurants(); // Refresh the list
            } catch (error) {
              console.error('Error deleting restaurant:', error);
              Alert.alert('Error', 'Failed to delete restaurant');
            }
          },
        },
      ]
    );
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

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <View style={styles.restaurantCard}>
      <TouchableOpacity
        style={styles.restaurantContent}
        onPress={() => navigation.navigate('RestaurantEntry', { restaurant: item, mode: 'edit' })}
      >
        <View style={styles.restaurantHeader}>
          <Text style={[styles.restaurantName, !item.isActive && styles.inactiveText]}>
            {item.name}
          </Text>
          <Text style={styles.priceRange}>
            {getPriceRangeDisplay(item.priceRange)}
          </Text>
        </View>

        {item.cuisine && (
          <Text style={[styles.cuisine, !item.isActive && styles.inactiveText]}>
            {item.cuisine}
          </Text>
        )}

        <View style={styles.restaurantFooter}>
          <Text style={styles.visitInfo}>
            Last: {getDaysSinceVisit(item.lastVisitedDate)} • {item.visitCount} visits
          </Text>
        </View>

        {item.notes && (
          <Text style={[styles.notes, !item.isActive && styles.inactiveText]} numberOfLines={2}>
            {item.notes}
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, item.isActive && styles.activeButton]}
          onPress={() => handleToggleActive(item)}
        >
          <Ionicons
            name={item.isActive ? 'eye' : 'eye-off'}
            size={16}
            color={item.isActive ? colors.white : colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="restaurant" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>No restaurants yet</Text>
      <Text style={styles.emptySubtitle}>Add your favorite date night spots to get started</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading restaurants...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Add Button */}
      <View style={styles.header}>
        <Text style={styles.title}>My Restaurants</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('RestaurantEntry', { mode: 'create' })}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textSecondary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Restaurant List */}
      <FlatList
        data={filteredRestaurants}
        renderItem={renderRestaurant}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.lg,
    marginTop: 0,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  listContainer: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  restaurantCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
    overflow: 'hidden',
  },
  restaurantContent: {
    padding: spacing.lg,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  restaurantName: {
    ...typography.h2,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  inactiveText: {
    color: colors.textSecondary,
  },
  priceRange: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold',
  },
  cuisine: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  restaurantFooter: {
    marginBottom: spacing.sm,
  },
  visitInfo: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  notes: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    ...typography.h1,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});