import jwt from 'jsonwebtoken';

// Generate invitation token for household
export const generateInvitationToken = (householdId: string): string => {
  const secret = process.env.JWT_SECRET!;
  return jwt.sign(
    {
      householdId,
      type: 'household_invite',
    },
    secret,
    { expiresIn: '7d' } // Invites expire in 7 days
  );
};

// Verify invitation token and return householdId
export const verifyInvitationToken = (token: string): string | null => {
  try {
    const secret = process.env.JWT_SECRET!;
    const decoded = jwt.verify(token, secret) as any;

    if (decoded.type !== 'household_invite') {
      return null;
    }

    return decoded.householdId;
  } catch (error) {
    return null;
  }
};