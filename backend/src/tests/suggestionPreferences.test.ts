import { applySimplePreference, effortMinutes, UNKNOWN_EFFORT_MINUTES } from '../services/suggestionService';

const r = (id: string, prepTime?: number, cookTime?: number) => ({ id, prepTime, cookTime });

describe('"Keep it quick" (applySimplePreference)', () => {
  it('measures effort as prep + cook, with unknown times treated as typical', () => {
    expect(effortMinutes(r('a', 10, 25))).toBe(35);
    expect(effortMinutes(r('b', undefined, 20))).toBe(20);
    expect(effortMinutes(r('c'))).toBe(UNKNOWN_EFFORT_MINUTES);
  });

  it('keeps only as many of the quickest recipes as there are days to fill', () => {
    const pool = [r('roast', 20, 180), r('tacos', 0, 20), r('chili', 0, 50), r('orzo', 5, 20), r('soup')];
    expect(applySimplePreference(pool, 3).map((x) => x.id)).toEqual(['tacos', 'orzo', 'soup']);
  });

  it('preserves the incoming order among equally quick recipes', () => {
    const pool = [r('x', 0, 20), r('y', 0, 20), r('z', 0, 20)];
    expect(applySimplePreference(pool, 2).map((x) => x.id)).toEqual(['x', 'y']);
  });

  it('uses the whole pool, quickest first, when there are fewer recipes than days', () => {
    const pool = [r('roast', 20, 180), r('tacos', 0, 20)];
    expect(applySimplePreference(pool, 7).map((x) => x.id)).toEqual(['tacos', 'roast']);
  });
});
