import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Restaurant from '../models/restaurant';
import User from '../models/user';
import { selectWeightedRestaurant } from '../services/restaurantService';

// GET /api/restaurants - Get all restaurants (user's own + household shared)
export const getRestaurants = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Get restaurants owned by user or shared with household
    const orConditions: any[] = [{ userId: userId }];
    if (user.householdId) {
      orConditions.push({ householdId: user.householdId });
    }

    const query = {
      $or: orConditions,
      isActive: true
    };

    const restaurants = await Restaurant.find(query).sort({ updatedAt: -1 });
    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ message: 'Failed to fetch restaurants' });
  }
};

// GET /api/restaurants/:id - Get single restaurant by ID
export const getRestaurant = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    // Check if user has access to this restaurant
    const hasAccess = restaurant.userId.equals(userId) ||
                      (user.householdId && restaurant.householdId?.equals(user.householdId));

    if (!hasAccess) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    res.json(restaurant);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ message: 'Failed to fetch restaurant' });
  }
};

// POST /api/restaurants - Create new restaurant
export const createRestaurant = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { name, cuisine, priceRange, notes, isActive } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ message: 'Restaurant name is required' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    const restaurant = new Restaurant({
      userId,
      householdId: user.householdId, // Share with household if user is in one
      name: name.trim(),
      cuisine: cuisine?.trim(),
      priceRange,
      notes: notes?.trim(),
      isActive: isActive !== undefined ? isActive : true,
      visitCount: 0
    });

    const savedRestaurant = await restaurant.save();
    res.status(201).json(savedRestaurant);
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ message: 'Failed to create restaurant' });
  }
};

// PUT /api/restaurants/:id - Update restaurant
export const updateRestaurant = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { name, cuisine, priceRange, notes, isActive } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    // Check if user has access to update this restaurant
    const hasAccess = restaurant.userId.equals(userId) ||
                      (user.householdId && restaurant.householdId?.equals(user.householdId));

    if (!hasAccess) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    // Update fields
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ message: 'Restaurant name cannot be empty' });
        return;
      }
      restaurant.name = name.trim();
    }

    if (cuisine !== undefined) {
      restaurant.cuisine = cuisine?.trim() || undefined;
    }

    if (priceRange !== undefined) {
      restaurant.priceRange = priceRange;
    }

    if (notes !== undefined) {
      restaurant.notes = notes?.trim() || undefined;
    }

    if (isActive !== undefined) {
      restaurant.isActive = isActive;
    }

    const updatedRestaurant = await restaurant.save();
    res.json(updatedRestaurant);
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ message: 'Failed to update restaurant' });
  }
};

// DELETE /api/restaurants/:id - Delete restaurant
export const deleteRestaurant = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    // Check if user has access to delete this restaurant
    const hasAccess = restaurant.userId.equals(userId) ||
                      (user.householdId && restaurant.householdId?.equals(user.householdId));

    if (!hasAccess) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    await Restaurant.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).json({ message: 'Failed to delete restaurant' });
  }
};

// POST /api/restaurants/:id/visit - Record visit (after spin selection)
export const recordVisit = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    // Check if user has access to this restaurant
    const hasAccess = restaurant.userId.equals(userId) ||
                      (user.householdId && restaurant.householdId?.equals(user.householdId));

    if (!hasAccess) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    // Update visit tracking
    const today = new Date().toISOString().split('T')[0];
    restaurant.lastVisitedDate = today;
    restaurant.visitCount += 1;

    const updatedRestaurant = await restaurant.save();
    res.json(updatedRestaurant);
  } catch (error) {
    console.error('Error recording visit:', error);
    res.status(500).json({ message: 'Failed to record visit' });
  }
};

// GET /api/restaurants/stats - Get visit statistics
export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Get restaurants user has access to
    const orConditions: any[] = [{ userId: userId }];
    if (user.householdId) {
      orConditions.push({ householdId: user.householdId });
    }

    const query = {
      $or: orConditions,
      isActive: true
    };

    const restaurants = await Restaurant.find(query);

    const totalRestaurants = restaurants.length;
    const totalVisits = restaurants.reduce((sum, r) => sum + r.visitCount, 0);
    const mostVisited = restaurants.length > 0
      ? restaurants.reduce((prev, current) =>
          (prev.visitCount > current.visitCount) ? prev : current)
      : undefined;
    const leastRecent = restaurants
      .filter(r => r.lastVisitedDate)
      .sort((a, b) => new Date(b.lastVisitedDate!).getTime() - new Date(a.lastVisitedDate!).getTime())[0];

    res.json({
      totalRestaurants,
      totalVisits,
      mostVisited: mostVisited || undefined,
      leastRecent: leastRecent || undefined
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

// POST /api/restaurants/spin - Get weighted random restaurant selection
export const spin = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Get active restaurants user has access to
    const orConditions: any[] = [{ userId: userId }];
    if (user.householdId) {
      orConditions.push({ householdId: user.householdId });
    }

    const query = {
      $or: orConditions,
      isActive: true
    };

    const restaurants = await Restaurant.find(query);

    if (restaurants.length === 0) {
      res.status(404).json({ message: 'No restaurants available' });
      return;
    }

    const selectedRestaurant = selectWeightedRestaurant(restaurants);
    res.json(selectedRestaurant);
  } catch (error) {
    console.error('Error spinning:', error);
    res.status(500).json({ message: 'Failed to spin' });
  }
};