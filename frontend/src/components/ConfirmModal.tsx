import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: 'default' | 'destructive';
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface Props {
  visible?: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: 'default' | 'destructive';
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface ConfirmModalRef {
  show: (options: ConfirmOptions) => void;
}

const ConfirmModal = forwardRef<ConfirmModalRef, Props>(({
  visible: propVisible = false,
  title: propTitle = '',
  message: propMessage = '',
  confirmText: propConfirmText = 'Confirm',
  cancelText: propCancelText = 'Cancel',
  confirmStyle: propConfirmStyle = 'default',
  icon: propIcon,
  iconColor: propIconColor,
  onConfirm: propOnConfirm,
  onCancel: propOnCancel,
}, ref) => {
  const [visible, setVisible] = React.useState(propVisible);
  const [title, setTitle] = React.useState(propTitle);
  const [message, setMessage] = React.useState(propMessage);
  const [confirmText, setConfirmText] = React.useState(propConfirmText);
  const [cancelText, setCancelText] = React.useState(propCancelText);
  const [confirmStyle, setConfirmStyle] = React.useState(propConfirmStyle);
  const [icon, setIcon] = React.useState(propIcon);
  const [iconColor, setIconColor] = React.useState(propIconColor);
  const [onConfirm, setOnConfirm] = React.useState<(() => void | Promise<void>) | undefined>(propOnConfirm);
  const [onCancel, setOnCancel] = React.useState<(() => void) | undefined>(propOnCancel);
  const [loading, setLoading] = React.useState(false);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    show: (options: ConfirmOptions) => {
      setTitle(options.title);
      setMessage(options.message);
      setConfirmText(options.confirmText || 'Confirm');
      setCancelText(options.cancelText || 'Cancel');
      setConfirmStyle(options.confirmStyle || 'default');
      setIcon(options.icon);
      setIconColor(options.iconColor);
      setOnConfirm(() => options.onConfirm);
      setOnCancel(() => options.onCancel);
      setLoading(false);
      setVisible(true);
    },
  }));

  const handleCancel = () => {
    setVisible(false);
    onCancel?.();
  };

  const handleConfirm = async () => {
    if (onConfirm) {
      setLoading(true);
      try {
        await onConfirm();
      } finally {
        setLoading(false);
      }
    }
    setVisible(false);
  };

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
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
    setConfirmText(propConfirmText);
    setCancelText(propCancelText);
    setConfirmStyle(propConfirmStyle);
    setIcon(propIcon);
    setIconColor(propIconColor);
    setOnConfirm(() => propOnConfirm);
    setOnCancel(() => propOnCancel);
  }, [propVisible, propTitle, propMessage, propConfirmText, propCancelText, propConfirmStyle, propIcon, propIconColor, propOnConfirm, propOnCancel]);

  const getIconBgColor = () => {
    if (iconColor) return iconColor + '20';
    if (confirmStyle === 'destructive') return colors.error + '20';
    return colors.primary + '20';
  };

  const getIconColor = () => {
    if (iconColor) return iconColor;
    if (confirmStyle === 'destructive') return colors.error;
    return colors.primary;
  };

  const getConfirmBgColor = () => {
    if (confirmStyle === 'destructive') return colors.error;
    return colors.primary;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icon */}
          {icon && (
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: getIconBgColor() }]}>
                <Ionicons name={icon} size={32} color={getIconColor()} />
              </View>
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.confirmButton,
                  { backgroundColor: getConfirmBgColor() },
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg * 2,
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
    ...shadows.floating,
  },
  iconContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: typography.sizes.body * 1.5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.divider,
  },
  cancelButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold as any,
    color: colors.text,
  },
  confirmButton: {
    ...shadows.button,
  },
  confirmButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold as any,
    color: colors.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default ConfirmModal;
