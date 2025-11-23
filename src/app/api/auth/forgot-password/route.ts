import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, account, user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, creatorName } = body;

    // Validate required fields
    if (!email || !creatorName) {
      return NextResponse.json(
        { 
          error: 'Email and creator name are required',
          code: 'MISSING_REQUIRED_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          error: 'Invalid email format',
          code: 'INVALID_EMAIL_FORMAT'
        },
        { status: 400 }
      );
    }

    // Validate creator name (must be "Arun" - case insensitive)
    if (creatorName.toLowerCase() !== 'arun') {
      return NextResponse.json(
        { 
          error: 'Unauthorized: Invalid creator name',
          code: 'INVALID_CREATOR_NAME'
        },
        { status: 403 }
      );
    }

    // Find user in users table by email
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const systemUser = existingUser[0];

    // Validate user role (must be admin or super_admin)
    if (systemUser.role !== 'admin' && systemUser.role !== 'super_admin') {
      return NextResponse.json(
        { 
          error: 'Password reset only allowed for admin users',
          code: 'NOT_ADMIN_USER'
        },
        { status: 403 }
      );
    }

    // Find better-auth user record by email
    const authUser = await db.select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (authUser.length === 0) {
      return NextResponse.json(
        { 
          error: 'Auth user not found',
          code: 'AUTH_USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const betterAuthUser = authUser[0];

    // Find account record by userId
    const userAccount = await db.select()
      .from(account)
      .where(eq(account.userId, betterAuthUser.id))
      .limit(1);

    if (userAccount.length === 0) {
      return NextResponse.json(
        { 
          error: 'Account not found',
          code: 'ACCOUNT_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const accountRecord = userAccount[0];

    // Hash new password "Admin@123"
    const newPassword = 'Admin@123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update account table with new password
    await db.update(account)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(account.id, accountRecord.id));

    // Update users table with mustChangePassword flag
    const currentTimestamp = new Date().toISOString();
    await db.update(users)
      .set({
        mustChangePassword: 1,
        lastPasswordChange: currentTimestamp,
        updatedAt: currentTimestamp
      })
      .where(eq(users.id, systemUser.id));

    return NextResponse.json(
      { 
        message: 'Password reset successfully. New password: Admin@123'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST /api/auth/forgot-password error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}