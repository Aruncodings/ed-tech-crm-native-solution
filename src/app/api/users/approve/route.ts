import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, isApproved } = body;

    // Validate userId is provided
    if (userId === undefined || userId === null) {
      return NextResponse.json(
        { 
          error: 'User ID is required',
          code: 'MISSING_USER_ID'
        },
        { status: 400 }
      );
    }

    // Validate userId is a valid integer
    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
      return NextResponse.json(
        { 
          error: 'User ID must be a valid integer',
          code: 'INVALID_INPUT'
        },
        { status: 400 }
      );
    }

    // Validate isApproved is provided
    if (isApproved === undefined || isApproved === null) {
      return NextResponse.json(
        { 
          error: 'isApproved field is required',
          code: 'MISSING_IS_APPROVED'
        },
        { status: 400 }
      );
    }

    // Validate isApproved is a boolean
    if (typeof isApproved !== 'boolean') {
      return NextResponse.json(
        { 
          error: 'isApproved must be a boolean value',
          code: 'INVALID_INPUT'
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, parsedUserId))
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

    // Update user's isApproved status
    const updatedUser = await db.update(users)
      .set({
        isApproved: isApproved ? 1 : 0,
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.id, parsedUserId))
      .returning();

    return NextResponse.json(updatedUser[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}