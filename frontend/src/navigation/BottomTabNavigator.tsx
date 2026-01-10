import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Screens
import HomeScreen from '../screens/HomeScreen';
import RecipesScreen from '../screens/RecipesScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import RecipeEntryScreen from '../screens/RecipeEntryScreen';
import PlannerScreen from '../screens/PlannerScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Planning Flow Screens
import ConstraintsScreen from '../screens/planning/ConstraintsScreen';
import SuggestionsScreen from '../screens/planning/SuggestionsScreen';
import SuccessScreen from '../screens/planning/SuccessScreen';
import RecipePickerScreen from '../screens/planning/RecipePickerScreen';

// Components
import { LogoIcon } from '../components/branding';
import { AvatarMenu } from '../components/AvatarMenu';

// Theme
import { colors, spacing, typography } from '../theme';

// Types
import { Recipe, SuggestionConstraints, Plan } from '../types';
import { DaySuggestion } from '../services/api/suggestions';

export type RecipesStackParamList = {
  RecipesList: undefined;
  RecipeDetail: { recipe: Recipe };
  RecipeEntry: { recipe?: Recipe; mode?: 'create' | 'edit' };
};

export type PlannerStackParamList = {
  PlannerHome: { showCurrentWeek?: boolean } | undefined;
  Planning: undefined;
  Constraints: { startDate?: string; weekOffset?: number } | undefined;
  Suggestions: { constraints: SuggestionConstraints; suggestions: DaySuggestion[] };
  RecipePicker: { date: string; currentSuggestions: DaySuggestion[] };
  Success: { plans: Plan[] };
};

export type RootTabParamList = {
  HomeTab: undefined;
  RecipesTab: undefined;
  PlannerTab: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  Settings: undefined;
};

const RecipesStack = createNativeStackNavigator<RecipesStackParamList>();
const PlannerStack = createNativeStackNavigator<PlannerStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

// Header component with avatar that can navigate to settings
function HeaderRight() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <AvatarMenu
      onSettingsPress={() => navigation.navigate('Settings')}
    />
  );
}

function RecipesStackNavigator() {
  return (
    <RecipesStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.textOnPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitleVisible: false,
      }}
    >
      <RecipesStack.Screen
        name="RecipesList"
        component={RecipesScreen}
        options={{ title: 'Recipes' }}
      />
      <RecipesStack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={({ route }) => ({
          title: route.params.recipe.title,
          headerBackVisible: true,
        })}
      />
      <RecipesStack.Screen
        name="RecipeEntry"
        component={RecipeEntryScreen}
        options={{ title: 'Add Recipe' }}
      />
    </RecipesStack.Navigator>
  );
}

function PlannerStackNavigator() {
  return (
    <PlannerStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.textOnPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitleVisible: false,
      }}
    >
      <PlannerStack.Screen
        name="PlannerHome"
        component={PlannerScreen}
        options={{ title: 'Planner' }}
      />
      <PlannerStack.Screen
        name="Constraints"
        component={ConstraintsScreen}
        options={{ title: 'Plan Your Week' }}
      />
      <PlannerStack.Screen
        name="Suggestions"
        component={SuggestionsScreen}
        options={{ title: 'Your Suggestions' }}
      />
      <PlannerStack.Screen
        name="RecipePicker"
        component={RecipePickerScreen}
        options={{ title: 'Pick a Recipe' }}
      />
      <PlannerStack.Screen
        name="Success"
        component={SuccessScreen}
        options={{
          title: 'All Set!',
          headerBackVisible: false,
        }}
      />
    </PlannerStack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'RecipesTab') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'PlannerTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: spacing.xs,
          paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.textOnPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Home',
          headerTitle: () => (
            <View style={headerStyles.brandContainer}>
              <LogoIcon size={28} variant="light" />
              <Text style={headerStyles.brandText}>Meal Mate</Text>
            </View>
          ),
          headerRight: () => <HeaderRight />,
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.textOnPrimary,
        }}
      />
      <Tab.Screen
        name="RecipesTab"
        component={RecipesStackNavigator}
        options={{
          title: 'Recipes',
          headerShown: false, // Stack has its own header
        }}
      />
      <Tab.Screen
        name="PlannerTab"
        component={PlannerStackNavigator}
        options={{
          title: 'Planner',
          headerShown: false, // Stack has its own header
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={TabNavigator} />
      <RootStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: true,
          title: 'Settings',
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.textOnPrimary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          presentation: 'card',
        }}
      />
    </RootStack.Navigator>
  );
}

const headerStyles = StyleSheet.create({
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandText: {
    color: colors.textOnPrimary,
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
});
