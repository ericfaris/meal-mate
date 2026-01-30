import { Request, Response } from 'express';
import Plan from '../models/plan';
import User from '../models/user';
import { markRecipeAsUsed } from '../services/suggestionService';

// GET /api/plans?start=YYYY-MM-DD&days=7 - Get plans for date range
export const getPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start, days } = req.query;
    const userId = req.userId;

    if (!start || !days) {
      res.status(400).json({ error: 'start and days query parameters are required' });
      return;
    }

    const startDate = new Date(start as string);
    const numDays = parseInt(days as string, 10);

    if (isNaN(startDate.getTime()) || isNaN(numDays)) {
      res.status(400).json({ error: 'Invalid start date or days value' });
      return;
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Calculate date range
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + numDays - 1);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    let planQuery;

    if (user.householdId) {
      // User is in a household - show plans from all household members
      const householdMembers = await User.find({ householdId: user.householdId }).select('_id');
      const memberIds = householdMembers.map(member => member._id);

      planQuery = {
        userId: { $in: memberIds },
        date: { $gte: startStr, $lte: endStr },
      };
    } else {
      // User is not in a household - show only their own plans
      planQuery = {
        userId: userId,
        date: { $gte: startStr, $lte: endStr },
      };
    }

    const plans = await Plan.find(planQuery)
      .populate('recipeId')
      .sort({ date: 1 });

    res.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
};

// GET /api/plans/:date - Get plan for specific date
export const getPlanByDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { date } = req.params;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let planQuery;

    if (user.householdId) {
      // User is in a household - check if any household member has a plan for this date
      const householdMembers = await User.find({ householdId: user.householdId }).select('_id');
      const memberIds = householdMembers.map(member => member._id);

      planQuery = {
        userId: { $in: memberIds },
        date: date,
      };
    } else {
      // User is not in a household - check only their own plans
      planQuery = {
        userId: userId,
        date: date,
      };
    }

    const plan = await Plan.findOne(planQuery).populate('recipeId');

    if (!plan) {
      res.status(404).json({ error: 'Plan not found for this date' });
      return;
    }

    res.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
};

// PUT /api/plans/:date - Update or create plan for specific date
export const updatePlanByDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { date } = req.params;
    const { recipeId, label, isConfirmed } = req.body;

    // Check if user is admin in their household
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Only household admins can create or update plans' });
      return;
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    // Build update object
    const updateData: any = {
      userId,
      isConfirmed: isConfirmed !== undefined ? isConfirmed : false,
    };

    // Handle recipeId - if provided, set it; if not provided but label is, clear it
    if (recipeId) {
      updateData.recipeId = recipeId;
      updateData.label = null; // Clear label when setting a recipe
    } else if (label) {
      updateData.label = label;
      updateData.recipeId = null; // Clear recipeId when setting a label
    }

    // Update or create plan
    const plan = await Plan.findOneAndUpdate(
      { userId, date },
      updateData,
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    ).populate('recipeId');

    // Update the recipe's lastUsedDate whenever a recipe is planned
    if (recipeId) {
      await markRecipeAsUsed(recipeId, date);
    }

    res.json(plan);
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
};

// DELETE /api/plans - Delete all plans for current user
export const deleteAllPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    // Check if user is admin in their household
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Only household admins can delete all plans' });
      return;
    }

    const result = await Plan.deleteMany({ userId });

    res.json({
      message: 'All plans deleted successfully',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting all plans:', error);
    res.status(500).json({ error: 'Failed to delete all plans' });
  }
};

// DELETE /api/plans/:date - Delete plan for specific date
export const deletePlanByDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    // Check if user is admin in their household
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Only household admins can delete plans' });
      return;
    }

    const plan = await Plan.findOneAndDelete({ userId, date: req.params.date });

    if (!plan) {
      res.status(404).json({ error: 'Plan not found for this date' });
      return;
    }

    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
};
