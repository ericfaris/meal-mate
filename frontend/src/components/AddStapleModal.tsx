import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

const CATEGORIES = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Pantry',
  'Frozen',
  'Bakery',
  'Household',
  'Other',
] as const;

type Category = (typeof CATEGORIES)[number];

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; quantity: string; category: Category }) => void;
  initialName?: string;
  initialQuantity?: string;
  initialCategory?: Category;
  title?: string;
}

export default function AddStapleModal({
  visible,
  onClose,
  onAdd,
  initialName = '',
  initialQuantity = '',
  initialCategory = 'Other',
  title = 'Add Item',
}: Props) {
  const [name, setName] = useState(initialName);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [category, setCategory] = useState<Category>(initialCategory);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setQuantity(initialQuantity);
      setCategory(initialCategory);
    }
  }, [visible, initialName, initialQuantity, initialCategory]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), quantity: quantity.trim(), category });
    setName('');
    setQuantity('');
    setCategory('Other');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>

          <TextInput
            style={styles.input}
            placeholder="Item name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <TextInput
            style={styles.input}
            placeholder="Quantity (optional)"
            placeholderTextColor={colors.textMuted}
            value={quantity}
            onChangeText={setQuantity}
          />

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipSelected]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextSelected]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, !name.trim() && styles.addBtnDisabled]}
              onPress={handleSubmit}
              disabled={!name.trim()}
            >
              <Text style={styles.addText}>Add</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.overlay,
  },
  content: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '85%',
    maxWidth: 400,
  },
  title: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.sizes.body,
    color: colors.text,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    maxHeight: 40,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.white,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
  },
  chipTextSelected: {
    color: colors.textOnPrimary,
    fontWeight: typography.weights.semibold,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
  },
  addBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.textOnPrimary,
  },
});
