/**
 * Tests for recipe import URL fetching, including the proxy fallback used
 * when a site blocks requests coming directly from our server's IP.
 */

import axios from 'axios';
import { parseRecipeFromUrl } from '../services/recipeParser';

// Factory mock avoids loading the real (ESM) axios package, which jest's
// default transformIgnorePatterns won't transpile.
jest.mock('axios', () => ({ get: jest.fn() }));
const mockedAxios = axios as unknown as { get: jest.Mock };

const RECIPE_URL = 'https://example.com/some-recipe';

function jsonLdHtml(overrides: Record<string, any> = {}) {
  const recipe = {
    '@type': 'Recipe',
    name: 'Test Casserole',
    recipeIngredient: ['1 cup rice', '2 chicken breasts'],
    recipeInstructions: [
      { '@type': 'HowToStep', text: 'Preheat oven to 350F.' },
      { '@type': 'HowToStep', text: 'Bake for 30 minutes.' },
    ],
    ...overrides,
  };
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': [recipe] });
  return `<html><head><script type="application/ld+json">${json}</script></head><body></body></html>`;
}

describe('parseRecipeFromUrl', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('parses a recipe from the direct fetch when the site is not blocking us', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: jsonLdHtml() });

    const result = await parseRecipeFromUrl(RECIPE_URL);

    expect(result.title).toBe('Test Casserole');
    expect(result.ingredientsText).toBe('1 cup rice\n2 chicken breasts');
    expect(result.directionsText).toBe('Preheat oven to 350F.\nBake for 30 minutes.');
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('falls back to the read-through proxy when the direct fetch is blocked (403)', async () => {
    mockedAxios.get
      .mockRejectedValueOnce({ response: { status: 403 } })
      .mockResolvedValueOnce({ data: jsonLdHtml() });

    const result = await parseRecipeFromUrl(RECIPE_URL);

    expect(result.title).toBe('Test Casserole');
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);

    // Second call should go through the jina.ai reader proxy with the original URL embedded.
    const [proxyUrl, proxyOpts] = mockedAxios.get.mock.calls[1];
    expect(proxyUrl).toBe(`https://r.jina.ai/${RECIPE_URL}`);
    expect(proxyOpts?.headers?.['X-Return-Format']).toBe('html');
  });

  it('falls back to the proxy when the direct fetch times out', async () => {
    mockedAxios.get
      .mockRejectedValueOnce({ code: 'ECONNABORTED' })
      .mockResolvedValueOnce({ data: jsonLdHtml() });

    const result = await parseRecipeFromUrl(RECIPE_URL);

    expect(result.title).toBe('Test Casserole');
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it('throws a BLOCKED error when both the direct fetch and the proxy fail', async () => {
    mockedAxios.get
      .mockRejectedValueOnce({ response: { status: 403 } })
      .mockRejectedValueOnce(new Error('proxy unreachable'));

    await expect(parseRecipeFromUrl(RECIPE_URL)).rejects.toThrow(/BLOCKED/);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it('does not use the proxy for a plain 404 (no blocking involved)', async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 404 } });

    await expect(parseRecipeFromUrl(RECIPE_URL)).rejects.toThrow(/not found/i);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('throws when no structured recipe data can be found on either fetch', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: '<html><body><p>No recipe here</p></body></html>' });

    await expect(parseRecipeFromUrl(RECIPE_URL)).rejects.toThrow(/could not find recipe data/i);
  });
});
