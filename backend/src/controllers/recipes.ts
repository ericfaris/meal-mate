import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Recipe from '../models/recipe';
import Plan from '../models/plan';
import User from '../models/user';

// GET /api/recipes - List all recipes with optional search and tag filters
export const getRecipes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, tags } = req.query;
    const userId = req.userId;
    const user = await mongoose.model('User').findById(userId);

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // If user is in a household, get recipes from the household admin
    // Otherwise, get their own recipes
    let targetUserId = userId;
    if (user.householdId) {
      // Find the admin of this household
      const adminUser = await mongoose.model('User').findOne({
        householdId: user.householdId,
        role: 'admin'
      });
      if (adminUser) {
        targetUserId = adminUser._id;
      }
    }

    let query: any = { userId: targetUserId };

    // Text search on title
    if (search && typeof search === 'string') {
      query.$text = { $search: search };
    }

    // Filter by tags
    if (tags && typeof tags === 'string') {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    const recipes = await Recipe.find(query).sort({ updatedAt: -1 }).lean();

    // Get plan counts for each recipe (from the admin's plans)
    const recipeIds = recipes.map(r => r._id);
    const planCounts = await Plan.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(targetUserId),
          recipeId: { $in: recipeIds }
        }
      },
      { $group: { _id: '$recipeId', count: { $sum: 1 } } }
    ]);

    // Create a map of recipeId to count
    const countMap = new Map(planCounts.map(pc => [pc._id.toString(), pc.count]));

    // Add planCount to each recipe
    const recipesWithCounts = recipes.map(recipe => ({
      ...recipe,
      planCount: countMap.get(recipe._id.toString()) || 0
    }));

    res.json(recipesWithCounts);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
};

// GET /api/recipes/:id - Get single recipe by ID
export const getRecipeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const user = await mongoose.model('User').findById(userId);

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // If user is in a household, get recipes from the household admin
    let targetUserId = userId;
    if (user.householdId) {
      const adminUser = await mongoose.model('User').findOne({
        householdId: user.householdId,
        role: 'admin'
      });
      if (adminUser) {
        targetUserId = adminUser._id;
      }
    }

    const recipe = await Recipe.findOne({ _id: req.params.id, userId: targetUserId });

    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    res.json(recipe);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
};

// POST /api/recipes - Create new recipe
export const createRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    // Check if user is admin in their household
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Only household admins can create recipes' });
      return;
    }

    const {
      title,
      imageUrl,
      sourceUrl,
      ingredientsText,
      directionsText,
      notes,
      tags,
      lastUsedDate,
      isVegetarian,
      prepTime,
      cookTime,
      servings
    } = req.body;

    // Validation
    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const recipe = new Recipe({
      userId,
      title,
      imageUrl,
      sourceUrl,
      ingredientsText,
      directionsText,
      notes,
      tags: tags || [],
      lastUsedDate,
      isVegetarian: isVegetarian ?? false,
      prepTime,
      cookTime,
      servings,
    });

    await recipe.save();
    res.status(201).json(recipe);
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ error: 'Failed to create recipe' });
  }
};

// PUT /api/recipes/:id - Update recipe
export const updateRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Determine the recipe owner: if in a household, recipes belong to the admin
    let targetUserId: any = userId;
    if (user.householdId) {
      const adminUser = await User.findOne({
        householdId: user.householdId,
        role: 'admin'
      });
      if (adminUser) {
        targetUserId = adminUser._id;
      }
    }

    const {
      title,
      imageUrl,
      sourceUrl,
      ingredientsText,
      directionsText,
      notes,
      tags,
      lastUsedDate,
      isVegetarian,
      prepTime,
      cookTime,
      servings
    } = req.body;

    const recipe = await Recipe.findOneAndUpdate(
      { _id: req.params.id, userId: targetUserId },
      {
        title,
        imageUrl,
        sourceUrl,
        ingredientsText,
        directionsText,
        notes,
        tags,
        lastUsedDate,
        isVegetarian,
        prepTime,
        cookTime,
        servings,
      },
      { new: true, runValidators: true }
    );

    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    res.json(recipe);
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
};

// DELETE /api/recipes/:id - Delete recipe
export const deleteRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    // Check if user is admin in their household
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Only household admins can delete recipes' });
      return;
    }

    const recipe = await Recipe.findOneAndDelete({ _id: req.params.id, userId });

    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
};
