import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

interface ActionOption {
  text: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: 'default' | 'destructive' | 'cancel';
  onPress?: () => void | Promise<void>;
}

interface ActionSheetOptions {
  title?: string;
  message?: string;
  options: ActionOption[];
}

interface Props {
  visible?: boolean;
  title?: string;
  message?: string;
  options?: ActionOption[];
  onClose?: () => void;
}

export interface ActionSheetModalRef {
  show: (options: ActionSheetOptions) => void;
  hide: () => void;
}

const ActionSheetModal = forwardRef<ActionSheetModalRef, Props>(({
  visible: propVisible = false,
  title: propTitle = '',
  message: propMessage = '',
  options: propOptions = [],
  onClose: propOnClose,
}, ref) => {
  const [visible, setVisible] = React.useState(propVisible);
  const [title, setTitle] = React.useState(propTitle);
  const [message, setMessage] = React.useState(propMessage);
  const [options, setOptions] = React.useState<ActionOption[]>(propOptions);
  const [onClose, setOnClose] = React.useState<(() => void) | undefined>(propOnClose);

  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    show: (opts: ActionSheetOptions) => {
      setTitle(opts.title || '');
      setMessage(opts.message || '');
      setOptions(opts.options);
      setVisible(true);
    },
    hide: () => {
      handleClose();
    },
  }));

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      onClose?.();
    });
  };

  const handleOptionPress = async (option: ActionOption) => {
    if (option.style === 'cancel') {
      handleClose();
      return;
    }

    if (option.onPress) {
      await option.onPress();
    }
    handleClose();
  };

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(300);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 9,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    setVisible(propVisible);
    setTitle(propTitle);
    setMessage(propMessage);
    setOptions(propOptions);
    setOnClose(() => propOnClose);
  }, [propVisible, propTitle, propMessage, propOptions, propOnClose]);

  const getOptionTextColor = (style?: ActionOption['style']) => {
    if (style === 'destructive') return colors.error;
    if (style === 'cancel') return colors.textLight;
    return colors.primary;
  };

  // Separate cancel option from other options
  const actionOptions = options.filter(opt => opt.style !== 'cancel');
  const cancelOption = options.find(opt => opt.style === 'cancel');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={styles.overlayPressable} onPress={handleClose} />

        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          {(title || message) && (
            <View style={styles.header}>
              {title && <Text style={styles.title}>{title}</Text>}
              {message && <Text style={styles.message}>{message}</Text>}
            </View>
          )}

          {/* Action Options */}
          <View style={styles.optionsContainer}>
            {actionOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.option,
                  index < actionOptions.length - 1 && styles.optionBorder,
                ]}
                onPress={() => handleOptionPress(option)}
                activeOpacity={0.7}
              >
                {option.icon && (
                  <Ionicons
                    name={option.icon}
                    size={22}
                    color={getOptionTextColor(option.style)}
                    style={styles.optionIcon}
                  />
                )}
                <Text style={[styles.optionText, { color: getOptionTextColor(option.style) }]}>
                  {option.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel Button */}
          {cancelOption && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleOptionPress(cancelOption)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>{cancelOption.text}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayPressable: {
    flex: 1,
  },
  sheetContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
    ...shadows.card,
  },
  title: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold as any,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: typography.sizes.body,
    color: colors.text,
    textAlign: 'center',
  },
  optionsContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  optionIcon: {
    marginRight: spacing.sm,
  },
  optionText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium as any,
  },
  cancelButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    ...shadows.card,
  },
  cancelText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold as any,
    color: colors.textLight,
  },
});

export default ActionSheetModal;
