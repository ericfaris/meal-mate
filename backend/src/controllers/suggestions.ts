import { Request, Response } from 'express';
import {
  generateWeekSuggestions,
  getAlternativeSuggestion,
  markRecipesAsUsed,
  SuggestionConstraints,
} from '../services/suggestionService';
import Plan from '../models/plan';
import User from '../models/user';

/**
 * POST /api/suggestions/generate
 * Generate a week of meal suggestions based on constraints
 */
export const generateSuggestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    // Check if user is admin in their household
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Only household admins can generate meal suggestions' });
      return;
    }
    const {
      startDate,
      daysToSkip = [],
      avoidRepeats = true,
      vegetarianOnly = false,
    } = req.body;

    // Validation
    if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      res.status(400).json({ error: 'Valid startDate (YYYY-MM-DD) is required' });
      return;
    }

    const constraints: SuggestionConstraints = {
      startDate,
      daysToSkip,
      avoidRepeats,
      vegetarianOnly,
    };

    const suggestions = await generateWeekSuggestions(constraints, userId);
    res.json(suggestions);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
};

/**
 * POST /api/suggestions/alternative
 * Get an alternative recipe for a specific date
 */
export const getAlternative = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    // Check if user is admin in their household
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Only household admins can get alternative suggestions' });
      return;
    }

    const {
      date,
      excludeRecipeIds = [],
      avoidRepeats = true,
      vegetarianOnly = false,
    } = req.body;

    // Validation
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'Valid date (YYYY-MM-DD) is required' });
      return;
    }

    const recipe = await getAlternativeSuggestion(date, excludeRecipeIds, {
      avoidRepeats,
      vegetarianOnly,
    }, userId);

    if (!recipe) {
      res.status(404).json({ error: 'No alternative recipes available' });
      return;
    }

    res.json(recipe);
  } catch (error) {
    console.error('Error getting alternative:', error);
    res.status(500).json({ error: 'Failed to get alternative' });
  }
};

/**
 * POST /api/suggestions/approve
 * Approve and save a week of suggestions as plans
 */
export const approveSuggestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    // Check if user is admin in their household
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Only household admins can approve suggestions' });
      return;
    }

    const { suggestions } = req.body;

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      res.status(400).json({ error: 'suggestions array is required' });
      return;
    }

    const createdPlans = [];
    const recipeUpdates: { recipeId: string; date: string }[] = [];

    for (const suggestion of suggestions) {
      const { date, recipeId, label, isSkipped } = suggestion;

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        continue; // Skip invalid dates
      }

      // Upsert the plan
      const planData: any = {
        userId,
        date,
        isConfirmed: true,
      };

      if (isSkipped && label) {
        planData.label = label;
        planData.recipeId = undefined;
      } else if (recipeId) {
        planData.recipeId = recipeId;
        planData.label = undefined;
        recipeUpdates.push({ recipeId, date });
      }

      const plan = await Plan.findOneAndUpdate(
        { userId, date },
        planData,
        { upsert: true, new: true }
      ).populate('recipeId');

      createdPlans.push(plan);
    }

    // Update lastUsedDate for all recipes that were planned
    if (recipeUpdates.length > 0) {
      await markRecipesAsUsed(recipeUpdates);
    }

    res.json({
      message: 'Week approved successfully!',
      plans: createdPlans,
    });
  } catch (error) {
    console.error('Error approving suggestions:', error);
    res.status(500).json({ error: 'Failed to approve suggestions' });
  }
};
