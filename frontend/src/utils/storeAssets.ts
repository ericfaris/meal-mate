// Bundled store logo assets
// Maps store names (case-insensitive) to their bundled images

const STORE_ASSETS: Record<string, any> = {
  'aldi': require('../../assets/stores/aldi.png'),
  'costco': require('../../assets/stores/costco.png'),
  'kroger': require('../../assets/stores/kroger.png'),
  'meijer': require('../../assets/stores/meijer.png'),
  "sam's club": require('../../assets/stores/samsclub.png'),
  "trader joe's": require('../../assets/stores/trader-joes-seeklogo.png'),
  'walmart': require('../../assets/stores/walmart.png'),
  // Note: Whole Foods logo not yet added
};

/**
 * Get the bundled asset for a store by name
 * @param storeName - The store name (case-insensitive)
 * @returns The require() asset or undefined if not found
 */
export const getStoreAsset = (storeName: string): any | undefined => {
  return STORE_ASSETS[storeName.toLowerCase()];
};

/**
 * Check if a store has a bundled asset
 * @param storeName - The store name (case-insensitive)
 */
export const hasStoreAsset = (storeName: string): boolean => {
  return storeName.toLowerCase() in STORE_ASSETS;
};
