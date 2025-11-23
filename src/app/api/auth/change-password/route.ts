import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, account } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Get session using better-auth
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { 
          error: 'Both currentPassword and newPassword are required',
          code: 'MISSING_REQUIRED_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate password requirements
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return NextResponse.json(
        { 
          error: 'Passwords must be strings',
          code: 'INVALID_PASSWORD_TYPE'
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { 
          error: 'New password must be at least 8 characters long',
          code: 'PASSWORD_TOO_SHORT'
        },
        { status: 400 }
      );
    }

    // Check if passwords are different
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { 
          error: 'New password must be different from current password',
          code: 'PASSWORDS_SAME'
        },
        { status: 400 }
      );
    }

    // Find user in users table by email
    const userRecords = await db.select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (userRecords.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const userRecord = userRecords[0];

    // Find account record by userId
    const accountRecords = await db.select()
      .from(account)
      .where(eq(account.userId, session.user.id))
      .limit(1);

    if (accountRecords.length === 0) {
      return NextResponse.json(
        { error: 'Account not found', code: 'ACCOUNT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const accountRecord = accountRecords[0];

    // Verify current password
    if (!accountRecord.password) {
      return NextResponse.json(
        { 
          error: 'No password set for this account',
          code: 'NO_PASSWORD_SET'
        },
        { status: 400 }
      );
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, accountRecord.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          error: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update account table
    await db.update(account)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(account.userId, session.user.id));

    // Update users table
    const now = new Date().toISOString();
    await db.update(users)
      .set({
        mustChangePassword: false,
        lastPasswordChange: now,
        updatedAt: now
      })
      .where(eq(users.id, userRecord.id));

    return NextResponse.json(
      { 
        message: 'Password changed successfully',
        success: true
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST /api/auth/change-password error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}