import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { imageSearchApi, SearchImage, ImageSource } from '../services/api/imageSearch';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md * 2) / 3;

interface Props {
  visible: boolean;
  recipeTitle: string;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
}

export default function ImagePickerModal({ visible, recipeTitle, onClose, onSelectImage }: Props) {
  const [images, setImages] = useState<SearchImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<ImageSource>('unsplash');

  const searchImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const results = await imageSearchApi.searchImages(recipeTitle, activeSource);
      setImages(results);
    } catch (err: any) {
      console.error('Error searching images:', err);
      const errorMessage = err.response?.data?.error || 'Failed to load images. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [recipeTitle, activeSource]);

  useEffect(() => {
    if (visible && recipeTitle) {
      searchImages();
    }
  }, [visible, recipeTitle, activeSource, searchImages]);

  const handleSelectImage = (image: SearchImage) => {
    onSelectImage(image.url);
    onClose();
  };

  const renderImage = ({ item }: { item: SearchImage }) => (
    <TouchableOpacity
      style={styles.imageCard}
      onPress={() => handleSelectImage(item)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.thumb }} style={styles.image} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Choose Image</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {recipeTitle}
              </Text>
            </View>
          </View>
          {/* Source Tabs */}
          <View style={styles.sourceTabs}>
            <TouchableOpacity
              style={[styles.sourceTab, activeSource === 'unsplash' && styles.sourceTabActive]}
              onPress={() => setActiveSource('unsplash')}
            >
              <Text style={[styles.sourceTabText, activeSource === 'unsplash' && styles.sourceTabTextActive]}>
                Unsplash
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sourceTab, activeSource === 'google' && styles.sourceTabActive]}
              onPress={() => setActiveSource('google')}
            >
              <Text style={[styles.sourceTabText, activeSource === 'google' && styles.sourceTabTextActive]}>
                Google
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Finding images...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={searchImages}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : images.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="images-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>No images found</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={images}
              renderItem={renderImage}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={styles.grid}
              showsVerticalScrollIndicator={false}
            />
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {activeSource === 'unsplash' ? (
                  <>Photos by <Text style={styles.footerLink}>Unsplash</Text></>
                ) : (
                  <>Images from <Text style={styles.footerLink}>Google</Text></>
                )}
              </Text>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.white,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.card,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sourceTabs: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  sourceTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  sourceTabActive: {
    backgroundColor: colors.primary,
  },
  sourceTabText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium as any,
    color: colors.textLight,
  },
  sourceTabTextActive: {
    color: colors.white,
  },
  closeButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
    marginTop: 2,
    maxWidth: SCREEN_WIDTH - 140,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: typography.sizes.body,
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold as any,
    color: colors.white,
  },
  emptyText: {
    fontSize: typography.sizes.body,
    color: colors.textLight,
    marginTop: spacing.md,
  },
  grid: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  imageCard: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: spacing.xs,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.divider,
    ...shadows.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  footer: {
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.sizes.tiny,
    color: colors.textMuted,
  },
  footerLink: {
    fontWeight: typography.weights.semibold as any,
    color: colors.primary,
  },
});
