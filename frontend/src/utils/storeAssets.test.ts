import { describe, expect, it } from 'vitest';
import { getStoreAsset, hasStoreAsset } from './storeAssets';

describe('store assets', () => {
  it('returns an Image source with a bundled URL, case-insensitively', () => {
    const asset = getStoreAsset('ALDI');
    expect(asset).toBeDefined();
    expect(typeof asset!.uri).toBe('string');
    expect(asset!.uri).toMatch(/aldi/);
    expect(getStoreAsset("Trader Joe's")).toBeDefined();
  });

  it('returns undefined for stores without a logo', () => {
    expect(getStoreAsset('Whole Foods')).toBeUndefined();
    expect(hasStoreAsset('Whole Foods')).toBe(false);
    expect(hasStoreAsset('kroger')).toBe(true);
  });
});
