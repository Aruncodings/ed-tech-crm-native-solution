import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email } = body;

    // Validate email is provided
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Email is required',
          code: 'EMAIL_REQUIRED'
        },
        { status: 400 }
      );
    }

    // Validate email format (basic @ check)
    if (!email.includes('@')) {
      return NextResponse.json(
        { 
          error: 'Invalid email format',
          code: 'INVALID_EMAIL_FORMAT'
        },
        { status: 400 }
      );
    }

    // Find user by email (case-insensitive)
    const user = await db.select()
      .from(users)
      .where(sql`lower(${users.email}) = ${email.toLowerCase()}`)
      .limit(1);

    // Check if user exists
    if (user.length === 0) {
      return NextResponse.json(
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const foundUser = user[0];

    // Return password status with mustChangePassword as boolean
    return NextResponse.json(
      {
        mustChangePassword: Boolean(foundUser.mustChangePassword),
        lastPasswordChange: foundUser.lastPasswordChange
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST /api/auth/check-password-status error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}