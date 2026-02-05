import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { Staple } from '../../types';
import { staplesApi } from '../../services/api/staples';
import AddStapleModal from '../../components/AddStapleModal';
import { useResponsive, maxContentWidth } from '../../hooks/useResponsive';
import { useAuth } from '../../contexts/AuthContext';
import { alertManager } from '../../utils/alertUtils';

type Props = {
  navigation: any;
  route: { params: { listId?: string } };
};

const CATEGORY_EMOJIS: Record<string, string> = {
  Produce: '🥬',
  'Meat & Seafood': '🥩',
  'Dairy & Eggs': '🥚',
  Pantry: '🫙',
  Frozen: '🧊',
  Bakery: '🍞',
  Household: '🧹',
  Other: '📦',
};

const CATEGORY_ORDER = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Pantry',
  'Frozen',
  'Bakery',
  'Household',
  'Other',
];

export default function StaplesScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const listId = route.params?.listId;
  const [staples, setStaples] = useState<Staple[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [adding, setAdding] = useState(false);
  const contentMaxWidth = maxContentWidth.default;

  // Only admins (or users not in a household) can delete staples
  const canDelete = !user?.householdId || user?.role === 'admin';

  const loadStaples = useCallback(async () => {
    try {
      setLoading(true);
      const data = await staplesApi.getAll();
      setStaples(data);
    } catch {
      alertManager.showError({
        title: 'Error',
        message: 'Failed to load staples',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStaples();
    }, [loadStaples])
  );

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddStaple = async (data: { name: string; quantity: string; category: string }) => {
    try {
      await staplesApi.upsert(data);
      setAddModalVisible(false);
      loadStaples();
    } catch {
      alertManager.showError({
        title: 'Error',
        message: 'Failed to add staple',
      });
    }
  };

  const handleDeleteStaple = (staple: Staple) => {
    alertManager.showConfirm({
      title: 'Delete Staple',
      message: `Remove "${staple.name}" from your staples?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmStyle: 'destructive',
      icon: 'trash-outline',
      onConfirm: async () => {
        try {
          await staplesApi.delete(staple._id);
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(staple._id);
            return next;
          });
          loadStaples();
        } catch {
          alertManager.showError({
            title: 'Error',
            message: 'Failed to delete staple',
          });
        }
      },
    });
  };

  const handleAddToList = async () => {
    if (!listId || selectedIds.size === 0) return;
    try {
      setAdding(true);
      await staplesApi.addToGroceryList(listId, Array.from(selectedIds));
      setSelectedIds(new Set());
      navigation.goBack();
    } catch {
      alertManager.showError({
        title: 'Error',
        message: 'Failed to add staples to list',
      });
    } finally {
      setAdding(false);
    }
  };

  // Filter staples
  const filtered = staples.filter((s) => {
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedFilter && s.category !== selectedFilter) return false;
    return true;
  });

  // Group by category
  const sections = CATEGORY_ORDER.map((category) => ({
    title: category,
    emoji: CATEGORY_EMOJIS[category] || '📦',
    data: filtered.filter((s) => s.category === category),
  })).filter((s) => s.data.length > 0);

  // Get unique categories present for filter chips
  const presentCategories = [...new Set(staples.map((s) => s.category))];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header info */}
      <View style={[styles.headerSection, { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' }]}>
        <Text style={styles.subtitle}>Your go-to items — grab 'em quick!</Text>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search staples..."
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

      {/* Category filter chips */}
      {presentCategories.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={[{ paddingHorizontal: spacing.lg, gap: spacing.sm, maxWidth: contentMaxWidth, alignSelf: 'center' as const }]}
        >
          <TouchableOpacity
            style={[styles.filterChip, !selectedFilter && styles.filterChipSelected]}
            onPress={() => setSelectedFilter(null)}
          >
            <Text style={[styles.filterChipText, !selectedFilter && styles.filterChipTextSelected]}>
              All
            </Text>
          </TouchableOpacity>
          {CATEGORY_ORDER.filter((c) => presentCategories.includes(c as any)).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, selectedFilter === cat && styles.filterChipSelected]}
              onPress={() => setSelectedFilter(selectedFilter === cat ? null : cat)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === cat && styles.filterChipTextSelected,
                ]}
              >
                {CATEGORY_EMOJIS[cat]} {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Empty state */}
      {staples.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>No staples yet</Text>
          <Text style={styles.emptySubtitle}>
            Items you add to grocery lists will appear here automatically, or tap + to add one now.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{
            maxWidth: contentMaxWidth,
            alignSelf: 'center' as const,
            width: '100%',
            paddingBottom: listId && selectedIds.size > 0 ? 100 : 80,
          }}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>{section.emoji}</Text>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemRow}
              onPress={() => (listId ? handleToggleSelect(item._id) : null)}
              onLongPress={canDelete ? () => handleDeleteStaple(item) : undefined}
            >
              {listId ? (
                <Ionicons
                  name={selectedIds.has(item._id) ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={selectedIds.has(item._id) ? colors.primary : colors.textMuted}
                />
              ) : null}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.quantity ? (
                  <Text style={styles.itemQuantity}>{item.quantity}</Text>
                ) : null}
              </View>
              <View style={styles.usageBadge}>
                <Text style={styles.usageText}>{item.usageCount}x</Text>
              </View>
            </TouchableOpacity>
          )}
          stickySectionHeadersEnabled
        />
      )}

      {/* FAB to add staple */}
      <TouchableOpacity
        style={[styles.fab, listId && selectedIds.size > 0 ? { bottom: spacing.lg + 60 } : {}]}
        onPress={() => setAddModalVisible(true)}
      >
        <Ionicons name="add" size={28} color={colors.textOnPrimary} />
      </TouchableOpacity>

      {/* Bottom bar for bulk add */}
      {listId && selectedIds.size > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.addToListBtn}
            onPress={handleAddToList}
            disabled={adding}
          >
            {adding ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.addToListText}>
                Add {selectedIds.size} to List
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <AddStapleModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={handleAddStaple}
        title="Add Staple"
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
    backgroundColor: colors.background,
  },
  headerSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
    fontStyle: 'italic',
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
  filterRow: {
    maxHeight: 44,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
  },
  filterChipTextSelected: {
    color: colors.textOnPrimary,
    fontWeight: typography.weights.semibold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
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
  itemQuantity: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
    marginTop: 2,
  },
  usageBadge: {
    backgroundColor: colors.secondaryLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  usageText: {
    fontSize: typography.sizes.tiny,
    fontWeight: typography.weights.semibold,
    color: colors.secondary,
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.card,
  },
  addToListBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
  },
  addToListText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.textOnPrimary,
  },
});
