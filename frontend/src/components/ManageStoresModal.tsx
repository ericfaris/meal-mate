import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';
import { Store } from '../types';
import { storesApi } from '../services/api/stores';
import { alertManager } from '../utils/alertUtils';

type Props = {
  visible: boolean;
  onClose: () => void;
  stores: Store[];
  onStoresChanged: (stores: Store[]) => void;
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

export default function ManageStoresModal({ visible, onClose, stores, onStoresChanged }: Props) {
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);
  const [addingStore, setAddingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddStore = async () => {
    if (!newStoreName.trim()) return;
    try {
      setSaving(true);
      const store = await storesApi.create({ name: newStoreName.trim() });
      onStoresChanged([...stores, store].sort((a, b) => a.name.localeCompare(b.name)));
      setNewStoreName('');
      setAddingStore(false);
    } catch (error: any) {
      alertManager.showError({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to create store',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStore = (store: Store) => {
    alertManager.showConfirm({
      title: 'Delete Store',
      message: `Delete "${store.name}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmStyle: 'destructive',
      icon: 'trash-outline',
      onConfirm: async () => {
        try {
          await storesApi.delete(store._id);
          onStoresChanged(stores.filter((s) => s._id !== store._id));
          if (expandedStoreId === store._id) setExpandedStoreId(null);
        } catch {
          alertManager.showError({
            title: 'Error',
            message: 'Failed to delete store',
          });
        }
      },
    });
  };

  const handleMoveCategory = async (store: Store, index: number, direction: 'up' | 'down') => {
    const newOrder = [...store.categoryOrder];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newOrder.length) return;
    [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];

    // Optimistic update
    const updatedStores = stores.map((s) =>
      s._id === store._id ? { ...s, categoryOrder: newOrder } : s
    );
    onStoresChanged(updatedStores);

    try {
      await storesApi.update(store._id, { categoryOrder: newOrder });
    } catch {
      // Revert on failure
      onStoresChanged(stores);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Manage Stores</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.storeList}>
            {stores.map((store) => {
              const isExpanded = expandedStoreId === store._id;
              return (
                <View key={store._id} style={styles.storeCard}>
                  <TouchableOpacity
                    style={styles.storeRow}
                    onPress={() => setExpandedStoreId(isExpanded ? null : store._id)}
                  >
                    <Ionicons
                      name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                      size={18}
                      color={colors.textMuted}
                    />
                    <Text style={styles.storeName}>{store.name}</Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteStore(store)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.categoryList}>
                      {store.categoryOrder.map((cat, idx) => (
                        <View key={cat} style={styles.categoryRow}>
                          <Text style={styles.categoryEmoji}>{CATEGORY_EMOJIS[cat] || '📦'}</Text>
                          <Text style={styles.categoryName}>{cat}</Text>
                          <View style={styles.arrowButtons}>
                            <TouchableOpacity
                              onPress={() => handleMoveCategory(store, idx, 'up')}
                              disabled={idx === 0}
                              style={[styles.arrowBtn, idx === 0 && styles.arrowBtnDisabled]}
                            >
                              <Ionicons name="arrow-up" size={16} color={idx === 0 ? colors.divider : colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleMoveCategory(store, idx, 'down')}
                              disabled={idx === store.categoryOrder.length - 1}
                              style={[styles.arrowBtn, idx === store.categoryOrder.length - 1 && styles.arrowBtnDisabled]}
                            >
                              <Ionicons name="arrow-down" size={16} color={idx === store.categoryOrder.length - 1 ? colors.divider : colors.primary} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}

            {/* Add store */}
            {addingStore ? (
              <View style={styles.addStoreForm}>
                <TextInput
                  style={styles.addStoreInput}
                  placeholder="Store name"
                  placeholderTextColor={colors.textMuted}
                  value={newStoreName}
                  onChangeText={setNewStoreName}
                  autoFocus
                  onSubmitEditing={handleAddStore}
                />
                <View style={styles.addStoreButtons}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => { setAddingStore(false); setNewStoreName(''); }}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, !newStoreName.trim() && styles.saveBtnDisabled]}
                    onPress={handleAddStore}
                    disabled={!newStoreName.trim() || saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={colors.textOnPrimary} />
                    ) : (
                      <Text style={styles.saveBtnText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.addStoreBtn} onPress={() => setAddingStore(true)}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.addStoreBtnText}>Add Store</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  content: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  storeList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  storeCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  storeName: {
    flex: 1,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  categoryList: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingVertical: spacing.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    gap: spacing.sm,
  },
  categoryEmoji: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
  },
  categoryName: {
    flex: 1,
    fontSize: typography.sizes.small,
    color: colors.text,
  },
  arrowButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  arrowBtn: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
  },
  arrowBtnDisabled: {
    opacity: 0.3,
  },
  addStoreForm: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  addStoreInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.body,
    color: colors.text,
  },
  addStoreButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.textOnPrimary,
  },
  addStoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  addStoreBtnText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
});
