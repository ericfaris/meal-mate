import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Household, { IHousehold } from '../models/household';
import User from '../models/user';
import { generateInvitationToken, verifyInvitationToken } from '../utils/invitation';

// Create a new household (user becomes HOH/admin)
export const createHousehold = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const userId = req.userId;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Household name is required' });
    }

    // Check if user is already in a household
    const existingUser = await User.findById(userId);
    if (existingUser?.householdId) {
      return res.status(400).json({ message: 'User is already in a household' });
    }

    // Create household
    const household = new Household({
      name: name.trim(),
      createdBy: userId,
      members: [userId],
    });

    await household.save();

    // Update user to be admin of this household
    await User.findByIdAndUpdate(userId, {
      householdId: household._id,
      role: 'admin',
    });

    res.status(201).json({
      household: {
        _id: household._id,
        name: household.name,
        members: household.members.length,
        createdAt: household.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error creating household:', error);
    res.status(500).json({ message: 'Failed to create household' });
  }
};

// Get household details
export const getHousehold = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).populate('householdId');

    if (!user?.householdId) {
      return res.status(404).json({ message: 'User is not in a household' });
    }

    const household = user.householdId as unknown as IHousehold;
    const members = await User.find({ householdId: household._id })
      .select('name email role profilePicture')
      .sort({ role: -1, name: 1 }); // Admins first, then alphabetical

    res.json({
      household: {
        _id: household._id,
        name: household.name,
        members,
        createdAt: household.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error getting household:', error);
    res.status(500).json({ message: 'Failed to get household' });
  }
};

// Generate invitation link for new members
export const generateInviteLink = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user?.householdId || user.role !== 'admin') {
      return res.status(403).json({ message: 'Only household admins can generate invites' });
    }

    const token = generateInvitationToken(user.householdId.toString());
    const inviteUrl = `mealmate://join/${token}`;

    res.json({ inviteUrl });
  } catch (error: any) {
    console.error('Error generating invite link:', error);
    res.status(500).json({ message: 'Failed to generate invite link' });
  }
};

// Join household via invitation link
export const joinHousehold = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const userId = req.userId;

    // Verify token and get householdId
    const householdId = verifyInvitationToken(token);
    if (!householdId) {
      return res.status(400).json({ message: 'Invalid or expired invitation link' });
    }

    // Check if user is already in a household
    const existingUser = await User.findById(userId);
    if (existingUser?.householdId) {
      return res.status(400).json({ message: 'User is already in a household' });
    }

    // Check if household exists and add user as member
    const household = await Household.findById(householdId);
    if (!household) {
      return res.status(404).json({ message: 'Household not found' });
    }

    // Add user to household
    household.members.push(new mongoose.Types.ObjectId(userId!));
    await household.save();

    // Update user role to member
    await User.findByIdAndUpdate(userId, {
      householdId: household._id,
      role: 'member',
    });

    res.json({
      message: 'Successfully joined household',
      household: {
        _id: household._id,
        name: household.name,
      },
    });
  } catch (error: any) {
    console.error('Error joining household:', error);
    res.status(500).json({ message: 'Failed to join household' });
  }
};

// Leave household
export const leaveHousehold = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user?.householdId) {
      return res.status(400).json({ message: 'User is not in a household' });
    }

    const household = await Household.findById(user.householdId);

    if (!household) {
      return res.status(404).json({ message: 'Household not found' });
    }

    if (user.role === 'admin') {
      // If admin is leaving, we need to handle this carefully
      // For now, prevent admin from leaving - they must delete household instead
      return res.status(400).json({
        message: 'Household admin cannot leave. Delete the household instead or transfer admin role.'
      });
    }

    // Remove user from household members
    household.members = household.members.filter(id => !id.equals(userId));
    await household.save();

    // Remove household from user
    await User.findByIdAndUpdate(userId, {
      householdId: null,
      role: 'member', // Reset to default
    });

    res.json({ message: 'Successfully left household' });
  } catch (error: any) {
    console.error('Error leaving household:', error);
    res.status(500).json({ message: 'Failed to leave household' });
  }
};

// Delete household (admin only)
export const deleteHousehold = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user?.householdId || user.role !== 'admin') {
      return res.status(403).json({ message: 'Only household admins can delete households' });
    }

    const householdId = user.householdId;

    // Remove household from all members
    await User.updateMany(
      { householdId },
      { householdId: null, role: 'member' }
    );

    // Delete household
    await Household.findByIdAndDelete(householdId);

    res.json({ message: 'Household deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting household:', error);
    res.status(500).json({ message: 'Failed to delete household' });
  }
};