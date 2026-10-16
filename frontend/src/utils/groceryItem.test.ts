import { describe, expect, it } from 'vitest';
import { itemSourceLine, listProgress } from './groceryItem';

describe('itemSourceLine', () => {
  it('lists every dinner that needs the item', () => {
    expect(itemSourceLine({ recipeNames: ['Fajitas', 'Chili', 'Pot roast'] })).toBe('Fajitas · Chili · Pot roast');
  });

  it('names who added a hand-added item by first name', () => {
    expect(itemSourceLine({ recipeNames: [], addedBy: { _id: 'u1', name: 'Jess Faris' } })).toBe('Added by Jess');
  });

  it('stays empty for an unresolved author id or no source', () => {
    expect(itemSourceLine({ recipeNames: [], addedBy: 'u1' })).toBe('');
    expect(itemSourceLine({ recipeNames: [] })).toBe('');
  });
});

describe('listProgress', () => {
  it('counts checked items', () => {
    expect(listProgress([{ isChecked: true }, { isChecked: false }, { isChecked: true }, { isChecked: false }]))
      .toEqual({ done: 2, total: 4, ratio: 0.5 });
  });

  it('handles an empty list', () => {
    expect(listProgress([])).toEqual({ done: 0, total: 0, ratio: 0 });
  });
});
