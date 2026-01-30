import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Animated,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { GroceryList, GroceryItem } from '../../types';
import { groceryListApi } from '../../services/api/groceryLists';
import { useResponsive, maxContentWidth } from '../../hooks/useResponsive';

type Props = {
  navigation: any;
  route: { params: { listId: string } };
};

const CATEGORY_EMOJIS: Record<string, string> = {
  'Produce': '🥬',
  'Meat & Seafood': '🥩',
  'Dairy & Eggs': '🥚',
  'Pantry': '🫙',
  'Frozen': '🧊',
  'Bakery': '🍞',
  'Other': '📦',
};

const CATEGORY_ORDER = ['Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Pantry', 'Frozen', 'Bakery', 'Other'];

export default function GroceryListStoreModeScreen({ navigation, route }: Props) {
  const { listId } = route.params;
  const [list, setList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [drillDownItem, setDrillDownItem] = useState<GroceryItem | null>(null);
  const [addItemVisible, setAddItemVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const { width } = useResponsive();

  const contentMaxWidth = maxContentWidth.default;

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const data = await groceryListApi.getById(listId);
      setList(data);
    } catch {
      Alert.alert('Error', 'Failed to load grocery list');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useFocusEffect(
    useCallback(() => {
      loadList();
    }, [loadList])
  );

  const handleToggleItem = async (itemIndex: number) => {
    if (!list) return;
    const item = list.items[itemIndex];
    try {
      const updated = await groceryListApi.updateItem(listId, itemIndex, {
        isChecked: !item.isChecked,
      });
      setList(updated);

      // Check if all items are now checked
      if (updated.items.length > 0 && updated.items.every((i) => i.isChecked)) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    } catch {
      // Silently fail — will sync on next load
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    try {
      const updated = await groceryListApi.addItem(listId, { name: newItemName.trim() });
      setList(updated);
      setNewItemName('');
      setAddItemVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const handleRemoveItem = (itemIndex: number) => {
    Alert.alert('Remove Item', 'Remove this item from the list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const updated = await groceryListApi.removeItem(listId, itemIndex);
            setList(updated);
          } catch {
            Alert.alert('Error', 'Failed to remove item');
          }
        },
      },
    ]);
  };

  if (loading || !list) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Filter items by search
  const filteredItems = searchQuery
    ? list.items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : list.items;

  // Group by category
  const sections = CATEGORY_ORDER
    .map((category) => ({
      title: category,
      emoji: CATEGORY_EMOJIS[category] || '📦',
      data: filteredItems
        .map((item, idx) => ({ item, originalIndex: list.items.indexOf(item) }))
        .filter(({ item }) => item.category === category),
    }))
    .filter((section) => section.data.length > 0);

  const checkedCount = list.items.filter((i) => i.isChecked).length;
  const totalCount = list.items.length;
  const progress = totalCount > 0 ? checkedCount / totalCount : 0;

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={[styles.progressContainer, { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' }]}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {checkedCount}/{totalCount} items
          </Text>
          <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Item list */}
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.originalIndex}-${index}`}
        contentContainerStyle={{ maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%', paddingBottom: 100 }}
        renderSectionHeader={({ section }) => {
          const isCollapsed = collapsedCategories.has(section.title);
          return (
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => {
                setCollapsedCategories((prev) => {
                  const next = new Set(prev);
                  if (next.has(section.title)) next.delete(section.title);
                  else next.add(section.title);
                  return next;
                });
              }}
            >
              <Text style={styles.sectionEmoji}>{section.emoji}</Text>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>{section.data.length}</Text>
              <Ionicons
                name={isCollapsed ? 'chevron-forward' : 'chevron-down'}
                size={16}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          );
        }}
        renderItem={({ item: { item, originalIndex }, section }) => {
          if (collapsedCategories.has(section.title)) return null;
          return (
            <TouchableOpacity
              style={styles.itemRow}
              onPress={() => handleToggleItem(originalIndex)}
              onLongPress={() => setDrillDownItem(item)}
            >
              <Ionicons
                name={item.isChecked ? 'checkbox' : 'square-outline'}
                size={24}
                color={item.isChecked ? colors.success : colors.textMuted}
              />
              <View style={styles.itemInfo}>
                <Text
                  style={[
                    styles.itemName,
                    item.isChecked && styles.itemNameChecked,
                  ]}
                >
                  {item.name}
                </Text>
                {item.quantity ? (
                  <Text style={styles.itemQuantity}>{item.quantity}</Text>
                ) : null}
              </View>
              {item.recipeNames.length > 1 && (
                <View style={styles.recipeBadge}>
                  <Text style={styles.recipeBadgeText}>{item.recipeNames.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        stickySectionHeadersEnabled
      />

      {/* FAB to add item */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setAddItemVisible(true)}
      >
        <Ionicons name="add" size={28} color={colors.textOnPrimary} />
      </TouchableOpacity>

      {/* Confetti overlay */}
      {showConfetti && (
        <View style={styles.confettiOverlay}>
          <Text style={styles.confettiText}>All done! 🎉</Text>
        </View>
      )}

      {/* Add item modal */}
      <Modal visible={addItemVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setAddItemVisible(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Add Item</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Item name"
              placeholderTextColor={colors.textMuted}
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
              onSubmitEditing={handleAddItem}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setAddItemVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalAdd} onPress={handleAddItem}>
                <Text style={styles.modalAddText}>Add</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Drill-down modal */}
      <Modal visible={!!drillDownItem} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setDrillDownItem(null)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>{drillDownItem?.name}</Text>
            {drillDownItem?.quantity ? (
              <Text style={styles.drillDownQuantity}>Total: {drillDownItem.quantity}</Text>
            ) : null}
            <Text style={styles.drillDownLabel}>Used in:</Text>
            {drillDownItem?.recipeNames.map((name, i) => (
              <View key={i} style={styles.drillDownRow}>
                <Ionicons name="restaurant-outline" size={14} color={colors.textLight} />
                <Text style={styles.drillDownRecipe}>{name}</Text>
              </View>
            ))}
            {drillDownItem?.originalTexts && drillDownItem.originalTexts.length > 0 && (
              <>
                <Text style={[styles.drillDownLabel, { marginTop: spacing.md }]}>Original:</Text>
                {drillDownItem.originalTexts.map((text, i) => (
                  <Text key={i} style={styles.drillDownOriginal}>• {text}</Text>
                ))}
              </>
            )}
            <TouchableOpacity
              style={[styles.modalAdd, { marginTop: spacing.md }]}
              onPress={() => setDrillDownItem(null)}
            >
              <Text style={styles.modalAddText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
    backgroundColor: colors.background,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressText: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
  },
  progressPercent: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.divider,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: borderRadius.full,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.sizes.body,
    color: colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sectionEmoji: {
    fontSize: 18,
  },
  sectionTitle: {
    flex: 1,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  sectionCount: {
    fontSize: typography.sizes.small,
    color: colors.textMuted,
    marginRight: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.sizes.body,
    color: colors.text,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  itemQuantity: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
    marginTop: 2,
  },
  recipeBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.full,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeBadgeText: {
    fontSize: typography.sizes.tiny,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.floating,
  },
  confettiOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  confettiText: {
    fontSize: 32,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.overlay,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.sizes.body,
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
  },
  modalAdd: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalAddText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.textOnPrimary,
  },
  drillDownQuantity: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  drillDownLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  drillDownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  drillDownRecipe: {
    fontSize: typography.sizes.body,
    color: colors.text,
  },
  drillDownOriginal: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
    marginLeft: spacing.sm,
  },
});
