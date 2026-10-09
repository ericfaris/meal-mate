import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from './icons/Ionicons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

interface Props {
  visible?: boolean;
  title?: string;
  message?: string;
  onClose?: () => void;
  confirmText?: string;
}

export interface ErrorModalRef {
  show: (title: string, message: string, onClose?: () => void) => void;
}

const ErrorModal = forwardRef<ErrorModalRef, Props>(({
  visible: propVisible = false,
  title: propTitle = '',
  message: propMessage = '',
  onClose: propOnClose,
  confirmText = 'OK',
}, ref) => {
  const [visible, setVisible] = React.useState(propVisible);
  const [title, setTitle] = React.useState(propTitle);
  const [message, setMessage] = React.useState(propMessage);
  const [onClose, setOnClose] = React.useState<(() => void) | undefined>(propOnClose);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    show: (newTitle: string, newMessage: string, newOnClose?: () => void) => {
      setTitle(newTitle);
      setMessage(newMessage);
      setOnClose(() => newOnClose);
      setVisible(true);
    },
  }));

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      shakeAnim.setValue(0);

      // Start entrance animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Add a subtle shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    setVisible(propVisible);
    setTitle(propTitle);
    setMessage(propMessage);
    setOnClose(() => propOnClose);
  }, [propVisible, propTitle, propMessage, propOnClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateX: shakeAnim },
              ],
            },
          ]}
        >
          {/* Error Icon */}
          <View style={styles.errorIconContainer}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={40} color={colors.white} />
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>{confirmText}</Text>
            </TouchableOpacity>
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
    maxWidth: 400,
    overflow: 'hidden',
    ...shadows.floating,
  },
  errorIconContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.button,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: typography.sizes.h2,
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
  closeButton: {
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.button,
  },
  closeButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold as any,
    color: colors.white,
  },
});

export default ErrorModal;
