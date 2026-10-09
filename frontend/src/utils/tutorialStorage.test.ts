import { beforeEach, describe, expect, it } from 'vitest';
import {
  hasPlannerTutorialCompleted,
  resetPlannerTutorial,
  setPlannerTutorialCompleted,
} from './tutorialStorage';

describe('planner tutorial flag', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to not completed, then persists completion and reset', async () => {
    expect(await hasPlannerTutorialCompleted()).toBe(false);
    await setPlannerTutorialCompleted();
    expect(await hasPlannerTutorialCompleted()).toBe(true);
    expect(localStorage.getItem('planner_tutorial_completed')).toBe('true');
    await resetPlannerTutorial();
    expect(await hasPlannerTutorialCompleted()).toBe(false);
  });
});
