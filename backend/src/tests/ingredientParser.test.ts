import {
  parseIngredientLine,
  parseIngredientsFallback,
  aggregateIngredients,
  guessCategory,
  mergeQuantities,
  parseQuantity,
} from '../services/ingredientParserService';

const recipe = (id: string, title: string, ingredientsText: string) =>
  ({ _id: { toString: () => id }, title, ingredientsText }) as any;

describe('parseIngredientLine', () => {
  // Regression: the list-marker strip used to eat the quantity itself.
  it('keeps leading quantities', () => {
    expect(parseIngredientLine('2 lb chicken thighs')).toEqual({ name: 'chicken thighs', quantity: '2 lb' });
    expect(parseIngredientLine('3 bell peppers')).toEqual({ name: 'bell peppers', quantity: '3' });
    expect(parseIngredientLine('1/4 cup soy sauce')).toEqual({ name: 'soy sauce', quantity: '1/4 cup' });
    expect(parseIngredientLine('1 1/2 cups rice')).toEqual({ name: 'rice', quantity: '1 1/2 cups' });
    expect(parseIngredientLine('1 wedge parmesan')).toEqual({ name: 'parmesan', quantity: '1 wedge' });
  });

  it('still strips list markers', () => {
    expect(parseIngredientLine('- 2 cups flour')).toEqual({ name: 'flour', quantity: '2 cups' });
    expect(parseIngredientLine('• 1 can black beans')).toEqual({ name: 'black beans', quantity: '1 can' });
    expect(parseIngredientLine('1. 2 eggs')).toEqual({ name: 'eggs', quantity: '2' });
    expect(parseIngredientLine('Salt and pepper')).toEqual({ name: 'Salt and pepper', quantity: '' });
  });
});

describe('guessCategory', () => {
  it('puts processed/canned goods in Pantry and frozen goods in Frozen', () => {
    expect(guessCategory('crushed tomatoes', '1 can')).toBe('Pantry');
    expect(guessCategory('beef broth', '1 cup')).toBe('Pantry');
    expect(guessCategory('tomato paste', '2 tbsp')).toBe('Pantry');
    expect(guessCategory('frozen peas', '1 bag')).toBe('Frozen');
  });

  it('recognizes common cuts and fresh items', () => {
    expect(guessCategory('chuck roast', '3 lb')).toBe('Meat & Seafood');
    expect(guessCategory('ground turkey', '1 lb')).toBe('Meat & Seafood');
    expect(guessCategory('yellow onions', '2')).toBe('Produce');
    expect(guessCategory('parmesan', '1 wedge')).toBe('Dairy & Eggs');
    expect(guessCategory('flour tortillas', '8')).toBe('Bakery');
  });
});

describe('quantities', () => {
  it('parses whole, fractional, mixed and unicode amounts', () => {
    expect(parseQuantity('3')).toEqual({ amount: 3, unit: '' });
    expect(parseQuantity('1 1/2 cups')).toEqual({ amount: 1.5, unit: 'cup' });
    expect(parseQuantity('½ lb')).toEqual({ amount: 0.5, unit: 'lb' });
    expect(parseQuantity('a pinch')).toBeNull();
  });

  it('sums matching units and keeps mismatched ones apart', () => {
    expect(mergeQuantities('1', '2')).toBe('3');
    expect(mergeQuantities('1 lb', '1/2 lbs')).toBe('1 1/2 lb');
    expect(mergeQuantities('1 lb', '2 cups')).toBe('1 lb + 2 cups');
    expect(mergeQuantities('1 lb + 2 cups', '1 cup')).toBe('1 lb + 3 cups');
    expect(mergeQuantities('1 can', '1 can')).toBe('2 cans');
  });
});

describe('aggregateIngredients (fallback parser end to end)', () => {
  // The landing page promises: three recipes need onions -> one line, summed.
  it('combines the same ingredient across recipes into one summed line with its dinners', () => {
    const parsed = parseIngredientsFallback([
      recipe('a', 'Fajitas', '2 lb chicken thighs\n1 yellow onion'),
      recipe('b', 'Chili', '1 yellow onion\n1 can black beans'),
      recipe('c', 'Pot roast', '2 yellow onions\n3 lb chuck roast'),
    ]);
    const items = aggregateIngredients(parsed);
    const onion = items.find((i) => i.name.startsWith('yellow onion'))!;
    expect(onion.quantity).toBe('4');
    expect(onion.recipeNames).toEqual(['Fajitas', 'Chili', 'Pot roast']);
    expect(onion.category).toBe('Produce');
    expect(items.filter((i) => i.name.startsWith('yellow onion'))).toHaveLength(1);
    expect(items.find((i) => i.name === 'chuck roast')!.category).toBe('Meat & Seafood');
    expect(items.find((i) => i.name === 'black beans')!.category).toBe('Pantry');
  });
});
