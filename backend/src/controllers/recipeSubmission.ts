import { Request, Response } from 'express';
import mongoose from 'mongoose';
import RecipeSubmission from '../models/recipeSubmission';
import User from '../models/user';
import { importRecipeFromUrl } from './recipeImport';
import { notifyHouseholdAdmins } from '../services/notificationService';

// Submit a recipe URL for household admin approval
export const submitRecipe = async (req: Request, res: Response) => {
  try {
    const { recipeUrl } = req.body;
    const userId = req.userId;

    if (!recipeUrl || !recipeUrl.trim()) {
      return res.status(400).json({ message: 'Recipe URL is required' });
    }

    // Validate URL format
    try {
      new URL(recipeUrl.trim());
    } catch {
      return res.status(400).json({ message: 'Invalid URL format' });
    }

    const user = await User.findById(userId);
    if (!user?.householdId) {
      return res.status(400).json({ message: 'User is not in a household' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Household admins cannot submit recipes for approval' });
    }

    // Check if this URL is already submitted and pending
    const existingSubmission = await RecipeSubmission.findOne({
      householdId: user.householdId,
      recipeUrl: recipeUrl.trim(),
      status: 'pending',
    });

    if (existingSubmission) {
      return res.status(400).json({ message: 'This recipe URL is already submitted and pending review' });
    }

    // Create submission
    const submission = new RecipeSubmission({
      householdId: user.householdId,
      submittedBy: userId,
      recipeUrl: recipeUrl.trim(),
      status: 'pending',
    });

    await submission.save();

    // Send push notification to household admins (don't await - fire and forget)
    notifyHouseholdAdmins(user.householdId, user.name).catch(err => {
      console.error('[RecipeSubmission] Failed to notify admins:', err);
    });

    res.status(201).json({
      message: 'Recipe submitted for approval',
      submission: {
        _id: submission._id,
        recipeUrl: submission.recipeUrl,
        status: submission.status,
        createdAt: submission.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error submitting recipe:', error);
    res.status(500).json({ message: 'Failed to submit recipe' });
  }
};

// Get pending submissions for household admin
export const getPendingSubmissions = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user?.householdId || user.role !== 'admin') {
      return res.status(403).json({ message: 'Only household admins can view submissions' });
    }

    const submissions = await RecipeSubmission.find({
      householdId: user.householdId,
      status: 'pending',
    })
      .populate('submittedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ submissions });
  } catch (error: any) {
    console.error('Error getting submissions:', error);
    res.status(500).json({ message: 'Failed to get submissions' });
  }
};

// Review a submission (approve/deny) and optionally import if approved
export const reviewSubmission = async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { action, reviewNotes } = req.body;
    const userId = req.userId;

    if (!['approve', 'deny'].includes(action)) {
      return res.status(400).json({ message: 'Action must be "approve" or "deny"' });
    }

    const user = await User.findById(userId);
    if (!user?.householdId || user.role !== 'admin') {
      return res.status(403).json({ message: 'Only household admins can review submissions' });
    }

    const submission = await RecipeSubmission.findOne({
      _id: submissionId,
      householdId: user.householdId,
      status: 'pending',
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found or already reviewed' });
    }

    let importResult = null;

    // Update submission status
    submission.status = action === 'approve' ? 'approved' : 'denied';
    submission.reviewedBy = new mongoose.Types.ObjectId(userId);
    submission.reviewedAt = new Date();
    if (reviewNotes?.trim()) {
      submission.reviewNotes = reviewNotes.trim();
    }

    // If approved, try to import the recipe
    if (action === 'approve') {
      try {
        // Create a mock request object for the import function
        const mockReq = {
          userId,
          body: { url: submission.recipeUrl }
        } as Request;

        const mockRes = {
          status: (code: number) => ({
            json: (data: any) => {
              importResult = { success: code < 400, data };
              return mockRes;
            }
          })
        } as Response;

        await importRecipeFromUrl(mockReq, mockRes);
      } catch (importError) {
        console.error('Error importing recipe:', importError);
        importResult = { success: false, error: 'Failed to import recipe' };
      }
    }

    await submission.save();

    res.json({
      message: `Recipe submission ${action}d`,
      submission: {
        _id: submission._id,
        recipeUrl: submission.recipeUrl,
        status: submission.status,
        reviewedAt: submission.reviewedAt,
        reviewNotes: submission.reviewNotes,
      },
      importResult,
    });
  } catch (error: any) {
    console.error('Error reviewing submission:', error);
    res.status(500).json({ message: 'Failed to review submission' });
  }
};

// Get user's own submissions
export const getMySubmissions = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const submissions = await RecipeSubmission.find({
      submittedBy: userId,
    })
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ submissions });
  } catch (error: any) {
    console.error('Error getting user submissions:', error);
    res.status(500).json({ message: 'Failed to get submissions' });
  }
};