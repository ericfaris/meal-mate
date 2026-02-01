import { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import User from '../models/user';

// POST /api/recipes/import-photo - Extract recipe data from a photo using Claude Vision
export const importRecipeFromPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    console.log('[PhotoImport] Request received from user:', userId);

    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      console.log('[PhotoImport] Access denied - user role:', user?.role);
      res.status(403).json({ error: 'Only household admins can import recipes' });
      return;
    }

    if (!req.file) {
      console.log('[PhotoImport] No file in request. Content-Type:', req.headers['content-type']);
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    console.log('[PhotoImport] File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer?.length,
    });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.log('[PhotoImport] ANTHROPIC_API_KEY not configured');
      res.status(500).json({ error: 'AI service is not configured' });
      return;
    }

    // Convert uploaded file buffer to base64
    const base64Image = req.file.buffer.toString('base64');
    const mediaType = req.file.mimetype as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    console.log('[PhotoImport] Sending to Claude Vision API, base64 length:', base64Image.length, 'mediaType:', mediaType);

    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `Analyze this recipe photo and extract the recipe information. Return ONLY valid JSON with no other text, in this exact format:
{
  "title": "recipe name",
  "ingredientsText": "one ingredient per line, separated by newlines",
  "directionsText": "one step per line, separated by newlines",
  "prepTime": null,
  "cookTime": null,
  "servings": null,
  "tags": ["suggested", "tags"]
}

For prepTime and cookTime, use numbers (minutes) or null if not found.
For servings, use a number or null if not found.
For tags, suggest relevant tags like cuisine type, meal type, protein, etc.
If the image is not a recipe or you cannot extract recipe data, return:
{"error": "Description of the problem"}`,
            },
          ],
        },
      ],
    });

    console.log('[PhotoImport] Claude API response received, content blocks:', message.content.length);

    // Extract text response
    const textBlock = message.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      console.error('[PhotoImport] No text block in response:', JSON.stringify(message.content));
      res.status(500).json({ error: 'Failed to get response from AI' });
      return;
    }

    console.log('[PhotoImport] Raw AI response:', textBlock.text.substring(0, 500));

    let extracted: any;
    try {
      extracted = JSON.parse(textBlock.text);
    } catch (parseError) {
      console.error('[PhotoImport] JSON parse error:', parseError);
      console.error('[PhotoImport] Raw text was:', textBlock.text);
      res.status(500).json({ error: 'Failed to parse AI response' });
      return;
    }

    if (extracted.error) {
      console.log('[PhotoImport] AI returned error:', extracted.error);
      res.status(400).json({ error: extracted.error });
      return;
    }

    console.log('[PhotoImport] Successfully extracted recipe:', extracted.title);
    res.json({
      title: extracted.title || '',
      ingredientsText: extracted.ingredientsText || '',
      directionsText: extracted.directionsText || '',
      prepTime: extracted.prepTime || null,
      cookTime: extracted.cookTime || null,
      servings: extracted.servings || null,
      tags: extracted.tags || [],
    });
  } catch (error: any) {
    console.error('[PhotoImport] Unhandled error:', error);
    console.error('[PhotoImport] Error stack:', error.stack);
    console.error('[PhotoImport] Error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
    });
    res.status(500).json({ error: 'Failed to analyze recipe photo. Please try again.' });
  }
};
