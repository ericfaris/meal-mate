import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { getStoreAsset } from '../../utils/storeAssets';
import { GroceryList, GroceryItem, Store } from '../../types';
import { groceryListApi } from '../../services/api/groceryLists';
import { storesApi } from '../../services/api/stores';
import { useResponsive, maxContentWidth } from '../../hooks/useResponsive';
import AddStapleModal from '../../components/AddStapleModal';
import ManageStoresModal from '../../components/ManageStoresModal';
import { alertManager } from '../../utils/alertUtils';

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
  'Household': '🧹',
  'Other': '📦',
};

const CATEGORY_ORDER = ['Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Pantry', 'Frozen', 'Bakery', 'Household', 'Other'];

export default function GroceryListStoreModeScreen({ navigation, route }: Props) {
  const { listId } = route.params;
  const [list, setList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [drillDownItem, setDrillDownItem] = useState<GroceryItem | null>(null);
  const [addItemVisible, setAddItemVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [manageStoresVisible, setManageStoresVisible] = useState(false);
  const [reorderingStore, setReorderingStore] = useState<Store | null>(null);
  const { width } = useResponsive();

  const contentMaxWidth = maxContentWidth.default;

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const data = await groceryListApi.getById(listId);
      setList(data);
    } catch {
      alertManager.showError({
        title: 'Error',
        message: 'Failed to load grocery list',
        onClose: () => navigation.goBack(),
      });
    } finally {
      setLoading(false);
    }
  }, [listId]);

  const loadStores = useCallback(async () => {
    try {
      const data = await storesApi.getAll();
      setStores(data);
      const defaultStore = data.find((s) => s.isDefault);
      if (defaultStore && !selectedStore) {
        setSelectedStore(defaultStore);
      }
    } catch {
      // Non-critical, silently fail
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadList();
      loadStores();
    }, [loadList, loadStores])
  );

  // Set the header title to the list name
  useEffect(() => {
    if (list?.name) {
      navigation.setOptions({ title: list.name });
    }
  }, [list?.name, navigation]);

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

  const handleAddItem = async (data: { name: string; quantity: string; category: string }) => {
    try {
      const updated = await groceryListApi.addItem(listId, {
        name: data.name,
        quantity: data.quantity || undefined,
        category: data.category,
      });
      setList(updated);
      setAddItemVisible(false);
    } catch {
      alertManager.showError({
        title: 'Error',
        message: 'Failed to add item',
      });
    }
  };

  const handleRemoveItem = async (itemIndex: number) => {
    try {
      const updated = await groceryListApi.removeItem(listId, itemIndex);
      setList(updated);
    } catch {
      alertManager.showError({
        title: 'Error',
        message: 'Failed to remove item',
      });
    }
  };

  const handleSelectStore = async (store: Store | null) => {
    // If in reorder mode, handle the move
    if (reorderingStore && store) {
      handleMoveStore(store);
      return;
    }
    setSelectedStore(store);
    // Fire-and-forget: mark as default
    if (store) {
      storesApi.update(store._id, { isDefault: true }).catch(() => {});
    }
  };

  const handleLongPressStore = (store: Store) => {
    setReorderingStore(store);
  };

  const handleMoveStore = async (targetStore: Store) => {
    if (!reorderingStore || reorderingStore._id === targetStore._id) {
      setReorderingStore(null);
      return;
    }

    // Reorder: move reorderingStore to targetStore's position
    const newOrder = stores.filter((s) => s._id !== reorderingStore._id);
    const targetIndex = newOrder.findIndex((s) => s._id === targetStore._id);
    newOrder.splice(targetIndex, 0, reorderingStore);

    // Optimistic update
    setStores(newOrder);
    setReorderingStore(null);

    // Persist to backend
    try {
      const storeIds = newOrder.map((s) => s._id);
      await storesApi.reorder(storeIds);
    } catch {
      // Revert on failure
      loadStores();
    }
  };

  const cancelReorder = () => {
    setReorderingStore(null);
  };

  const activeCategoryOrder = selectedStore?.categoryOrder ?? CATEGORY_ORDER;

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
  const sections = activeCategoryOrder
    .map((category) => ({
      title: category,
      emoji: CATEGORY_EMOJIS[category] || '📦',
      data: filteredItems
        .map((item, idx) => ({ item, originalIndex: list.items.indexOf(item) }))
        .filter(({ item }) => item.category === category),
    }))
    .filter((section) => section.data.length > 0);

  return (
    <View style={styles.container}>
      {/* Store selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storeChipsContent}
        style={[styles.storeChipsContainer, { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' }]}
      >
        {!reorderingStore && (
          <TouchableOpacity
            style={styles.storeChipManage}
            onPress={() => setManageStoresVisible(true)}
          >
            <Ionicons name="settings-outline" size={14} color={colors.primary} />
            <Text style={styles.storeChipManageText}>Manage</Text>
          </TouchableOpacity>
        )}
        {reorderingStore && (
          <TouchableOpacity
            style={styles.storeChipCancel}
            onPress={cancelReorder}
          >
            <Ionicons name="close" size={16} color={colors.error} />
            <Text style={styles.storeChipCancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.storeChip, !selectedStore && !reorderingStore && styles.storeChipActive]}
          onPress={() => reorderingStore ? cancelReorder() : handleSelectStore(null)}
        >
          <Text style={[styles.storeChipText, !selectedStore && !reorderingStore && styles.storeChipTextActive]}>All</Text>
        </TouchableOpacity>
        {stores.map((store) => {
          const bundledAsset = getStoreAsset(store.name);
          const isActive = selectedStore?._id === store._id;
          const isBeingMoved = reorderingStore?._id === store._id;
          const isDropTarget = reorderingStore && !isBeingMoved;
          return (
            <TouchableOpacity
              key={store._id}
              style={[
                styles.storeChip,
                isActive && !reorderingStore && styles.storeChipActive,
                isBeingMoved && styles.storeChipMoving,
                isDropTarget && styles.storeChipDropTarget,
              ]}
              onPress={() => reorderingStore ? handleMoveStore(store) : handleSelectStore(store)}
              onLongPress={() => handleLongPressStore(store)}
              delayLongPress={300}
              accessibilityLabel={store.name}
            >
              {bundledAsset ? (
                <Image source={bundledAsset} style={[styles.storeChipImage, isActive && styles.storeChipImageActive]} />
              ) : store.imageUrl ? (
                <Image source={{ uri: store.imageUrl }} style={[styles.storeChipImage, isActive && styles.storeChipImageActive]} />
              ) : (
                <Text style={[styles.storeChipInitial, isActive && styles.storeChipInitialActive]}>
                  {store.name.charAt(0).toUpperCase()}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
            <View style={styles.itemRow}>
              <Pressable
                style={styles.itemRowMain}
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
              </Pressable>
              <Pressable
                style={styles.removeButton}
                onPress={() => handleRemoveItem(originalIndex)}
              >
                <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
              </Pressable>
            </View>
          );
        }}
        stickySectionHeadersEnabled
      />

      {/* Staples button */}
      <TouchableOpacity
        style={styles.staplesButton}
        onPress={() => navigation.navigate('Staples', { listId })}
      >
        <Ionicons name="star" size={20} color={colors.textOnPrimary} />
        <Text style={styles.staplesButtonText}>Staples</Text>
      </TouchableOpacity>

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
      <AddStapleModal
        visible={addItemVisible}
        onClose={() => setAddItemVisible(false)}
        onAdd={handleAddItem}
        title="Add Item"
      />

      {/* Manage stores modal */}
      <ManageStoresModal
        visible={manageStoresVisible}
        onClose={() => setManageStoresVisible(false)}
        stores={stores}
        onStoresChanged={(updated) => {
          setStores(updated);
          // If selected store was deleted, deselect
          if (selectedStore && !updated.find((s) => s._id === selectedStore._id)) {
            setSelectedStore(null);
          }
          // Update selectedStore's categoryOrder if it changed
          if (selectedStore) {
            const updatedStore = updated.find((s) => s._id === selectedStore._id);
            if (updatedStore) setSelectedStore(updatedStore);
          }
        }}
      />

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
  storeChipsContainer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  storeChipsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  storeChip: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  storeChipActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  storeChipMoving: {
    borderColor: colors.secondary,
    borderWidth: 2,
    opacity: 0.7,
    transform: [{ scale: 1.1 }],
  },
  storeChipDropTarget: {
    borderColor: colors.primaryLight,
    borderStyle: 'dashed',
  },
  storeChipCancel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.white,
  },
  storeChipCancelText: {
    fontSize: typography.sizes.small,
    color: colors.error,
    fontWeight: typography.weights.medium,
  },
  storeChipImage: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
  },
  storeChipImageActive: {
    width: 38,
    height: 38,
  },
  storeChipInitial: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
  },
  storeChipInitialActive: {
    color: colors.primary,
  },
  storeChipText: {
    fontSize: typography.sizes.small,
    color: colors.text,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  storeChipTextActive: {
    color: colors.textOnPrimary,
  },
  storeChipManage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    backgroundColor: colors.white,
  },
  storeChipManageText: {
    fontSize: typography.sizes.small,
    color: colors.primary,
    fontWeight: typography.weights.medium,
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
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  itemRowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.lg,
    paddingVertical: spacing.sm + 4,
    gap: spacing.md,
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
  removeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    justifyContent: 'center',
  },
  recipeBadgeText: {
    fontSize: typography.sizes.tiny,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  staplesButton: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg + 56 + spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...shadows.floating,
  },
  staplesButtonText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.textOnPrimary,
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
