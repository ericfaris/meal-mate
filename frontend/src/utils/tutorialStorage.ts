import AsyncStorage from '@react-native-async-storage/async-storage';

const PLANNER_TUTORIAL_KEY = 'planner_tutorial_completed';

/**
 * Check if the planner tutorial has been completed
 */
export const hasPlannerTutorialCompleted = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(PLANNER_TUTORIAL_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking tutorial status:', error);
    return false;
  }
};

/**
 * Mark the planner tutorial as completed
 */
export const setPlannerTutorialCompleted = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(PLANNER_TUTORIAL_KEY, 'true');
  } catch (error) {
    console.error('Error setting tutorial status:', error);
  }
};

/**
 * Reset the planner tutorial (for replaying)
 */
export const resetPlannerTutorial = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PLANNER_TUTORIAL_KEY);
  } catch (error) {
    console.error('Error resetting tutorial:', error);
  }
};
