import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    // Validate userId parameter
    if (!userId) {
      return NextResponse.json({ 
        error: "User ID is required",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
      return NextResponse.json({ 
        error: "Valid user ID is required",
        code: "INVALID_USER_ID" 
      }, { status: 400 });
    }

    // Fetch user by ID
    const user = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      dailyCallLimit: users.dailyCallLimit,
      monthlyCallLimit: users.monthlyCallLimit
    })
      .from(users)
      .where(eq(users.id, parsedUserId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ 
        error: "User not found",
        code: "USER_NOT_FOUND" 
      }, { status: 404 });
    }

    return NextResponse.json(user[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    // Validate userId parameter
    if (!userId) {
      return NextResponse.json({ 
        error: "User ID is required",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
      return NextResponse.json({ 
        error: "Valid user ID is required",
        code: "INVALID_USER_ID" 
      }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { dailyCallLimit, monthlyCallLimit } = body;

    // Validate that at least one field is provided
    if (dailyCallLimit === undefined && monthlyCallLimit === undefined) {
      return NextResponse.json({ 
        error: "At least one of dailyCallLimit or monthlyCallLimit must be provided",
        code: "MISSING_REQUIRED_FIELDS" 
      }, { status: 400 });
    }

    // Validate dailyCallLimit if provided
    if (dailyCallLimit !== undefined) {
      const parsedDailyLimit = parseInt(dailyCallLimit);
      if (isNaN(parsedDailyLimit) || parsedDailyLimit < 0) {
        return NextResponse.json({ 
          error: "Daily call limit must be a non-negative integer",
          code: "INVALID_DAILY_CALL_LIMIT" 
        }, { status: 400 });
      }
    }

    // Validate monthlyCallLimit if provided
    if (monthlyCallLimit !== undefined) {
      const parsedMonthlyLimit = parseInt(monthlyCallLimit);
      if (isNaN(parsedMonthlyLimit) || parsedMonthlyLimit < 0) {
        return NextResponse.json({ 
          error: "Monthly call limit must be a non-negative integer",
          code: "INVALID_MONTHLY_CALL_LIMIT" 
        }, { status: 400 });
      }
    }

    // Check if user exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, parsedUserId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        error: "User not found",
        code: "USER_NOT_FOUND" 
      }, { status: 404 });
    }

    // Prepare update object with only provided fields
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (dailyCallLimit !== undefined) {
      updateData.dailyCallLimit = parseInt(dailyCallLimit);
    }

    if (monthlyCallLimit !== undefined) {
      updateData.monthlyCallLimit = parseInt(monthlyCallLimit);
    }

    // Update user
    const updatedUser = await db.update(users)
      .set(updateData)
      .where(eq(users.id, parsedUserId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        dailyCallLimit: users.dailyCallLimit,
        monthlyCallLimit: users.monthlyCallLimit,
        updatedAt: users.updatedAt
      });

    return NextResponse.json(updatedUser[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}