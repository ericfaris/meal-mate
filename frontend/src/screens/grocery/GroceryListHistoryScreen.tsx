import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { GroceryList } from '../../types';
import { groceryListApi } from '../../services/api/groceryLists';
import { useResponsive, maxContentWidth } from '../../hooks/useResponsive';
import { useAuth } from '../../contexts/AuthContext';

type Props = {
  navigation: any;
};

export default function GroceryListHistoryScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [loading, setLoading] = useState(true);
  const { width } = useResponsive();

  const contentMaxWidth = maxContentWidth.default;

  // Only admins (or users not in a household) can delete lists
  const canDelete = !user?.householdId || user?.role === 'admin';

  const loadLists = useCallback(async () => {
    try {
      setLoading(true);
      const data = await groceryListApi.getAll();
      setLists(data);
    } catch {
      setLists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLists();
    }, [loadLists])
  );

  const handleArchive = async (list: GroceryList) => {
    const newStatus = list.status === 'archived' ? 'active' : 'archived';
    const action = newStatus === 'archived' ? 'Archive' : 'Restore';

    Alert.alert(
      `${action} List`,
      `${action} "${list.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          onPress: async () => {
            try {
              await groceryListApi.update(list._id, { status: newStatus });
              setLists((prev) =>
                prev.map((l) => (l._id === list._id ? { ...l, status: newStatus } : l))
              );
            } catch {
              Alert.alert('Error', `Failed to ${action.toLowerCase()} list`);
            }
          },
        },
      ]
    );
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete List', 'Are you sure you want to delete this grocery list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await groceryListApi.delete(id);
            setLists((prev) => prev.filter((l) => l._id !== id));
          } catch {
            Alert.alert('Error', 'Failed to delete list');
          }
        },
      },
    ]);
  };

  const handleLongPress = (list: GroceryList) => {
    const isArchived = list.status === 'archived';
    const archiveOption = {
      text: isArchived ? 'Restore' : 'Archive',
      onPress: () => handleArchive(list),
    };

    const options: any[] = [archiveOption];

    if (canDelete) {
      options.push({
        text: 'Delete',
        style: 'destructive',
        onPress: () => handleDelete(list._id),
      });
    }

    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('List Options', list.name, options);
  };

  const getCompletionPercent = (list: GroceryList) => {
    if (list.items.length === 0) return 0;
    return Math.round(
      (list.items.filter((i) => i.isChecked).length / list.items.length) * 100
    );
  };

  const formatDateRange = (start: string, end: string) => {
    const s = new Date(start + 'T12:00:00');
    const e = new Date(end + 'T12:00:00');
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${s.toLocaleDateString('en-US', opts)} — ${e.toLocaleDateString('en-US', opts)}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={lists}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{
          maxWidth: contentMaxWidth,
          alignSelf: 'center' as const,
          width: '100%',
          padding: spacing.lg,
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No grocery lists yet</Text>
            <Text style={styles.emptySubtext}>
              Generate one from the Grocery tab!
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const percent = getCompletionPercent(item);
          return (
            <TouchableOpacity
              style={styles.listCard}
              onPress={() => navigation.navigate('GroceryStoreMode', { listId: item._id })}
              onLongPress={() => handleLongPress(item)}
            >
              <View style={styles.listCardHeader}>
                <Text style={styles.listName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.status === 'archived' && (
                  <View style={styles.archivedBadge}>
                    <Text style={styles.archivedText}>Archived</Text>
                  </View>
                )}
              </View>
              <Text style={styles.listDateRange}>
                {formatDateRange(item.startDate, item.endDate)}
              </Text>
              <View style={styles.listFooter}>
                <View style={styles.miniProgressBar}>
                  <View style={[styles.miniProgressFill, { width: `${percent}%` }]} />
                </View>
                <Text style={styles.listPercent}>{percent}%</Text>
                <Text style={styles.listItemCount}>
                  {item.items.length} item{item.items.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
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
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxl * 2,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.semibold,
    color: colors.textMuted,
  },
  emptySubtext: {
    fontSize: typography.sizes.body,
    color: colors.textMuted,
  },
  listCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  listCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  listName: {
    flex: 1,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  archivedBadge: {
    backgroundColor: colors.divider,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  archivedText: {
    fontSize: typography.sizes.tiny,
    color: colors.textMuted,
  },
  listDateRange: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  listFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  miniProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.divider,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: borderRadius.full,
  },
  listPercent: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    width: 35,
    textAlign: 'right',
  },
  listItemCount: {
    fontSize: typography.sizes.small,
    color: colors.textMuted,
  },
});
