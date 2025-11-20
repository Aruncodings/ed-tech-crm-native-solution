import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { coursesNew } from '@/db/schema';
import { eq, like, or, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const course = await db
        .select()
        .from(coursesNew)
        .where(eq(coursesNew.id, parseInt(id)))
        .limit(1);

      if (course.length === 0) {
        return NextResponse.json(
          { error: 'Course not found', code: 'COURSE_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(course[0], { status: 200 });
    }

    // List with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const isActiveParam = searchParams.get('isActive');

    let query = db.select().from(coursesNew);
    const conditions = [];

    // Filter by isActive status
    if (isActiveParam !== null) {
      const isActiveValue = isActiveParam === 'true';
      conditions.push(eq(coursesNew.isActive, isActiveValue));
    }

    // Search across name, code, and description
    if (search) {
      const searchCondition = or(
        like(coursesNew.name, `%${search}%`),
        like(coursesNew.code, `%${search}%`),
        like(coursesNew.description, `%${search}%`)
      );
      conditions.push(searchCondition);
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const courses = await query
      .orderBy(desc(coursesNew.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, description, durationMonths, feeAmount, isActive } = body;

    // Validate required fields
    const trimmedName = name?.trim();
    const trimmedCode = code?.trim();

    if (!trimmedName) {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (!trimmedCode) {
      return NextResponse.json(
        { error: 'Code is required', code: 'MISSING_CODE' },
        { status: 400 }
      );
    }

    // Check if code already exists (unique constraint)
    const existingCourse = await db
      .select()
      .from(coursesNew)
      .where(eq(coursesNew.code, trimmedCode))
      .limit(1);

    if (existingCourse.length > 0) {
      return NextResponse.json(
        { error: 'Course code already exists', code: 'CODE_EXISTS' },
        { status: 409 }
      );
    }

    // Validate durationMonths if provided
    if (durationMonths !== undefined && durationMonths !== null) {
      const parsedDuration = parseInt(durationMonths);
      if (isNaN(parsedDuration)) {
        return NextResponse.json(
          { error: 'Duration months must be a valid integer', code: 'INVALID_DURATION' },
          { status: 400 }
        );
      }
    }

    // Prepare insert data
    const currentTimestamp = new Date().toISOString();
    const insertData: any = {
      name: trimmedName,
      code: trimmedCode,
      description: description?.trim() || null,
      durationMonths: durationMonths !== undefined && durationMonths !== null ? parseInt(durationMonths) : null,
      feeAmount: feeAmount?.trim() || null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };

    const newCourse = await db
      .insert(coursesNew)
      .values(insertData)
      .returning();

    return NextResponse.json(newCourse[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    
    // Handle unique constraint violation at database level
    if ((error as Error).message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'Course code already exists', code: 'CODE_EXISTS' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const courseId = parseInt(id);

    // Check if course exists
    const existingCourse = await db
      .select()
      .from(coursesNew)
      .where(eq(coursesNew.id, courseId))
      .limit(1);

    if (existingCourse.length === 0) {
      return NextResponse.json(
        { error: 'Course not found', code: 'COURSE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, code, description, durationMonths, feeAmount, isActive } = body;

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    // Update name if provided
    if (name !== undefined) {
      const trimmedName = name?.trim();
      if (!trimmedName) {
        return NextResponse.json(
          { error: 'Name cannot be empty', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      updateData.name = trimmedName;
    }

    // Update code if provided (check uniqueness)
    if (code !== undefined) {
      const trimmedCode = code?.trim();
      if (!trimmedCode) {
        return NextResponse.json(
          { error: 'Code cannot be empty', code: 'INVALID_CODE' },
          { status: 400 }
        );
      }

      // Check if new code already exists (excluding current course)
      if (trimmedCode !== existingCourse[0].code) {
        const codeExists = await db
          .select()
          .from(coursesNew)
          .where(eq(coursesNew.code, trimmedCode))
          .limit(1);

        if (codeExists.length > 0) {
          return NextResponse.json(
            { error: 'Course code already exists', code: 'CODE_EXISTS' },
            { status: 409 }
          );
        }
      }

      updateData.code = trimmedCode;
    }

    // Update description if provided
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    // Update durationMonths if provided
    if (durationMonths !== undefined) {
      if (durationMonths === null) {
        updateData.durationMonths = null;
      } else {
        const parsedDuration = parseInt(durationMonths);
        if (isNaN(parsedDuration)) {
          return NextResponse.json(
            { error: 'Duration months must be a valid integer', code: 'INVALID_DURATION' },
            { status: 400 }
          );
        }
        updateData.durationMonths = parsedDuration;
      }
    }

    // Update feeAmount if provided
    if (feeAmount !== undefined) {
      updateData.feeAmount = feeAmount?.trim() || null;
    }

    // Update isActive if provided
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    const updatedCourse = await db
      .update(coursesNew)
      .set(updateData)
      .where(eq(coursesNew.id, courseId))
      .returning();

    return NextResponse.json(updatedCourse[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);

    // Handle unique constraint violation at database level
    if ((error as Error).message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'Course code already exists', code: 'CODE_EXISTS' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const courseId = parseInt(id);

    // Check if course exists
    const existingCourse = await db
      .select()
      .from(coursesNew)
      .where(eq(coursesNew.id, courseId))
      .limit(1);

    if (existingCourse.length === 0) {
      return NextResponse.json(
        { error: 'Course not found', code: 'COURSE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deletedCourse = await db
      .delete(coursesNew)
      .where(eq(coursesNew.id, courseId))
      .returning();

    return NextResponse.json(
      {
        message: 'Course deleted successfully',
        course: deletedCourse[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}