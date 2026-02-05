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

interface InfoOptions {
  title: string;
  message: string;
  buttonText?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onClose?: () => void;
}

interface Props {
  visible?: boolean;
  title?: string;
  message?: string;
  buttonText?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onClose?: () => void;
}

export interface InfoModalRef {
  show: (options: InfoOptions) => void;
}

const InfoModal = forwardRef<InfoModalRef, Props>(({
  visible: propVisible = false,
  title: propTitle = '',
  message: propMessage = '',
  buttonText: propButtonText = 'OK',
  icon: propIcon = 'information-circle',
  iconColor: propIconColor = colors.primary,
  onClose: propOnClose,
}, ref) => {
  const [visible, setVisible] = React.useState(propVisible);
  const [title, setTitle] = React.useState(propTitle);
  const [message, setMessage] = React.useState(propMessage);
  const [buttonText, setButtonText] = React.useState(propButtonText);
  const [icon, setIcon] = React.useState(propIcon);
  const [iconColor, setIconColor] = React.useState(propIconColor);
  const [onClose, setOnClose] = React.useState<(() => void) | undefined>(propOnClose);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    show: (options: InfoOptions) => {
      setTitle(options.title);
      setMessage(options.message);
      setButtonText(options.buttonText || 'OK');
      setIcon(options.icon || 'information-circle');
      setIconColor(options.iconColor || colors.primary);
      setOnClose(() => options.onClose);
      setVisible(true);
    },
  }));

  const handleClose = () => {
    setVisible(false);
    onClose?.();
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
    setButtonText(propButtonText);
    setIcon(propIcon);
    setIconColor(propIconColor);
    setOnClose(() => propOnClose);
  }, [propVisible, propTitle, propMessage, propButtonText, propIcon, propIconColor, propOnClose]);

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
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: iconColor + '20' }]}>
              <Ionicons name={icon} size={36} color={iconColor} />
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            {/* Button */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: iconColor }]}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>{buttonText}</Text>
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
  button: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.button,
  },
  buttonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold as any,
    color: colors.white,
  },
});

export default InfoModal;
