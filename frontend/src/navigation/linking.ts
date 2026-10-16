import type { LinkingOptions } from '@react-navigation/native';

/**
 * URL routes for the web app. Screen names must match the navigators in
 * BottomTabNavigator.tsx: RootStack { MainTabs, Settings, Household }.
 * (Regression: this used to nest everything under a nonexistent `Main`
 * screen, so /join/:token invite links and /grocery/:listId never routed.)
 */
export const linking: LinkingOptions<any> = {
  // Web linking reads the browser URL directly; prefixes are unused.
  prefixes: [],
  config: {
    screens: {
      MainTabs: {
        screens: {
          GroceryTab: {
            screens: {
              GroceryStoreMode: 'grocery/:listId',
            },
          },
        },
      },
      Settings: 'join/:token',
    },
  },
};
