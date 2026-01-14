import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { Restaurant, RestaurantInput } from '../../types';
import { restaurantApi } from '../../services/api';

type RouletteStackParamList = {
  RouletteHome: undefined;
  RestaurantsList: undefined;
  RestaurantEntry: { restaurant?: Restaurant; mode?: 'create' | 'edit' };
};

type RestaurantEntryScreenNavigationProp = NativeStackNavigationProp<
  RouletteStackParamList,
  'RestaurantEntry'
>;

type RestaurantEntryScreenRouteProp = RouteProp<RouletteStackParamList, 'RestaurantEntry'>;

interface Props {
  navigation: RestaurantEntryScreenNavigationProp;
  route: RestaurantEntryScreenRouteProp;
}

export default function RestaurantEntryScreen({ navigation, route }: Props) {
  const { restaurant, mode = 'create' } = route.params || {};
  const isEditing = mode === 'edit';

  const [name, setName] = useState(restaurant?.name || '');
  const [cuisine, setCuisine] = useState(restaurant?.cuisine || '');
  const [priceRange, setPriceRange] = useState<1 | 2 | 3 | 4 | undefined>(restaurant?.priceRange);
  const [notes, setNotes] = useState(restaurant?.notes || '');
  const [isActive, setIsActive] = useState(restaurant?.isActive ?? true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Restaurant' : 'Add Restaurant',
    });
  }, [navigation, isEditing]);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Error', 'Restaurant name is required');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const restaurantData: RestaurantInput = {
        name: name.trim(),
        cuisine: cuisine.trim() || undefined,
        priceRange,
        notes: notes.trim() || undefined,
        isActive,
      };

      if (isEditing && restaurant) {
        await restaurantApi.update(restaurant._id, restaurantData);
        Alert.alert('Success', 'Restaurant updated successfully');
      } else {
        await restaurantApi.create(restaurantData);
        Alert.alert('Success', 'Restaurant added successfully');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving restaurant:', error);
      Alert.alert('Error', 'Failed to save restaurant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const PriceRangeSelector = () => (
    <View style={styles.priceRangeContainer}>
      <Text style={styles.label}>Price Range</Text>
      <View style={styles.priceButtons}>
        {[1, 2, 3, 4].map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.priceButton,
              priceRange === range && styles.priceButtonSelected,
            ]}
            onPress={() => setPriceRange(priceRange === range ? undefined : range)}
          >
            <Text
              style={[
                styles.priceButtonText,
                priceRange === range && styles.priceButtonTextSelected,
              ]}
            >
              {'$'.repeat(range)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.priceHint}>
        $ = Budget • $$ = Moderate • $$$ = Expensive • $$$$ = Fine Dining
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Name Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Restaurant Name *</Text>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="Enter restaurant name"
          placeholderTextColor={colors.textSecondary}
          maxLength={100}
        />
      </View>

      {/* Cuisine Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Cuisine (Optional)</Text>
        <TextInput
          style={styles.textInput}
          value={cuisine}
          onChangeText={setCuisine}
          placeholder="e.g., Italian, Mexican, Chinese"
          placeholderTextColor={colors.textSecondary}
          maxLength={50}
        />
      </View>

      {/* Price Range Selector */}
      <PriceRangeSelector />

      {/* Notes Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Notes (Optional)</Text>
        <TextInput
          style={[styles.textInput, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Special occasions, dietary notes, etc."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
          maxLength={500}
        />
      </View>

      {/* Active Toggle */}
      <View style={styles.toggleGroup}>
        <Text style={styles.label}>Active</Text>
        <Switch
          value={isActive}
          onValueChange={setIsActive}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={isActive ? colors.white : colors.textSecondary}
        />
      </View>
      <Text style={styles.toggleHint}>
        Inactive restaurants won't appear in the roulette wheel
      </Text>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={[styles.saveButtonText, isLoading && styles.saveButtonDisabledText]}>
            {isLoading ? 'Saving...' : (isEditing ? 'Update' : 'Add Restaurant')}
          </Text>
        </TouchableOpacity>
      </View>
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
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  textInput: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  priceRangeContainer: {
    marginBottom: spacing.lg,
  },
  priceButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  priceButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  priceButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  priceButtonText: {
    ...typography.button,
    color: colors.text,
  },
  priceButtonTextSelected: {
    color: colors.white,
  },
  priceHint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  toggleGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  toggleHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.white,
  },
  saveButtonDisabledText: {
    color: colors.textSecondary,
  },
});