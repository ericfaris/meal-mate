// Bundled store logo assets
// Maps store names (case-insensitive) to their bundled images
import aldi from '../../assets/stores/aldi.png';
import costco from '../../assets/stores/costco.png';
import kroger from '../../assets/stores/kroger.png';
import meijer from '../../assets/stores/meijer.png';
import samsClub from '../../assets/stores/samsclub.png';
import traderJoes from '../../assets/stores/trader-joes-seeklogo.png';
import walmart from '../../assets/stores/walmart.png';

// Image sources (the bundler resolves each import to a URL)
const STORE_ASSETS: Record<string, { uri: string }> = {
  'aldi': { uri: aldi },
  'costco': { uri: costco },
  'kroger': { uri: kroger },
  'meijer': { uri: meijer },
  "sam's club": { uri: samsClub },
  "trader joe's": { uri: traderJoes },
  'walmart': { uri: walmart },
  // Note: Whole Foods logo not yet added
};

/**
 * Get the bundled asset for a store by name
 * @param storeName - The store name (case-insensitive)
 * @returns An Image source, or undefined if not found
 */
export const getStoreAsset = (storeName: string): { uri: string } | undefined => {
  return STORE_ASSETS[storeName.toLowerCase()];
};

/**
 * Check if a store has a bundled asset
 * @param storeName - The store name (case-insensitive)
 */
export const hasStoreAsset = (storeName: string): boolean => {
  return storeName.toLowerCase() in STORE_ASSETS;
};
