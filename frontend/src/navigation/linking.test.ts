import { describe, expect, it } from 'vitest';
// From core: same function, without @react-navigation/native's CJS react-native import.
import { getStateFromPath } from '@react-navigation/core';
import { linking } from './linking';

const leaf = (state: any): any => {
  let route = state.routes[state.index ?? state.routes.length - 1];
  const chain = [route.name];
  while (route.state) {
    route = route.state.routes[route.state.index ?? route.state.routes.length - 1];
    chain.push(route.name);
  }
  return { chain, params: route.params };
};

describe('web linking', () => {
  it('routes invite links to Settings with the token', () => {
    const state = getStateFromPath('/join/abc.def.ghi', linking.config as any);
    expect(leaf(state)).toEqual({ chain: ['Settings'], params: { token: 'abc.def.ghi' } });
  });

  it('routes /grocery/:listId to Store Mode inside the tabs', () => {
    const state = getStateFromPath('/grocery/123', linking.config as any);
    expect(leaf(state)).toEqual({
      chain: ['MainTabs', 'GroceryTab', 'GroceryStoreMode'],
      params: { listId: '123' },
    });
  });
});
