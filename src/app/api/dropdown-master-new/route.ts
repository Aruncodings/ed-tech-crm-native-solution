import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dropdownMasterNew } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const record = await db
        .select()
        .from(dropdownMasterNew)
        .where(eq(dropdownMasterNew.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json(
          { error: 'Dropdown master entry not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with filtering and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const category = searchParams.get('category');
    const isActiveParam = searchParams.get('isActive');

    let query = db.select().from(dropdownMasterNew);

    // Build filter conditions
    const conditions = [];
    if (category) {
      conditions.push(eq(dropdownMasterNew.category, category));
    }
    if (isActiveParam !== null) {
      const isActive = isActiveParam === 'true';
      conditions.push(eq(dropdownMasterNew.isActive, isActive));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting: category ASC, then displayOrder ASC
    const results = await query
      .orderBy(asc(dropdownMasterNew.category), asc(dropdownMasterNew.displayOrder))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
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
    const { category, value, label, displayOrder, isActive } = body;

    // Validate required fields
    if (!category || typeof category !== 'string' || category.trim() === '') {
      return NextResponse.json(
        { error: 'Category is required and must be non-empty', code: 'MISSING_CATEGORY' },
        { status: 400 }
      );
    }

    if (!value || typeof value !== 'string' || value.trim() === '') {
      return NextResponse.json(
        { error: 'Value is required and must be non-empty', code: 'MISSING_VALUE' },
        { status: 400 }
      );
    }

    if (!label || typeof label !== 'string' || label.trim() === '') {
      return NextResponse.json(
        { error: 'Label is required and must be non-empty', code: 'MISSING_LABEL' },
        { status: 400 }
      );
    }

    // Prepare insert data with defaults
    const insertData = {
      category: category.trim(),
      value: value.trim(),
      label: label.trim(),
      displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdAt: new Date().toISOString(),
    };

    // Insert into database
    const newRecord = await db
      .insert(dropdownMasterNew)
      .values(insertData)
      .returning();

    return NextResponse.json(newRecord[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
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

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { category, value, label, displayOrder, isActive } = body;

    // Check if record exists
    const existingRecord = await db
      .select()
      .from(dropdownMasterNew)
      .where(eq(dropdownMasterNew.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Dropdown master entry not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate fields if provided
    if (category !== undefined && (typeof category !== 'string' || category.trim() === '')) {
      return NextResponse.json(
        { error: 'Category must be non-empty if provided', code: 'INVALID_CATEGORY' },
        { status: 400 }
      );
    }

    if (value !== undefined && (typeof value !== 'string' || value.trim() === '')) {
      return NextResponse.json(
        { error: 'Value must be non-empty if provided', code: 'INVALID_VALUE' },
        { status: 400 }
      );
    }

    if (label !== undefined && (typeof label !== 'string' || label.trim() === '')) {
      return NextResponse.json(
        { error: 'Label must be non-empty if provided', code: 'INVALID_LABEL' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (category !== undefined) updateData.category = category.trim();
    if (value !== undefined) updateData.value = value.trim();
    if (label !== undefined) updateData.label = label.trim();
    if (displayOrder !== undefined) updateData.displayOrder = parseInt(displayOrder);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    // Update record
    const updatedRecord = await db
      .update(dropdownMasterNew)
      .set(updateData)
      .where(eq(dropdownMasterNew.id, parseInt(id)))
      .returning();

    if (updatedRecord.length === 0) {
      return NextResponse.json(
        { error: 'Dropdown master entry not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedRecord[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
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

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if record exists
    const existingRecord = await db
      .select()
      .from(dropdownMasterNew)
      .where(eq(dropdownMasterNew.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Dropdown master entry not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete record
    const deletedRecord = await db
      .delete(dropdownMasterNew)
      .where(eq(dropdownMasterNew.id, parseInt(id)))
      .returning();

    if (deletedRecord.length === 0) {
      return NextResponse.json(
        { error: 'Dropdown master entry not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Dropdown master entry deleted successfully',
        deleted: deletedRecord[0],
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