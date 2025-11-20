import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { exportJobsNew, users } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

// Enum validation
const VALID_ENTITY_TYPES = ['leads', 'call_logs', 'users'] as const;
const VALID_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;

type EntityType = typeof VALID_ENTITY_TYPES[number];
type Status = typeof VALID_STATUSES[number];

// GET - List export jobs or single export job by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      const exportJobId = parseInt(id);
      if (isNaN(exportJobId)) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const exportJob = await db
        .select()
        .from(exportJobsNew)
        .where(eq(exportJobsNew.id, exportJobId))
        .limit(1);

      if (exportJob.length === 0) {
        return NextResponse.json(
          { error: 'Export job not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(exportJob[0], { status: 200 });
    }

    // List with filters and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const exportedById = searchParams.get('exportedById');
    const entityType = searchParams.get('entityType');
    const status = searchParams.get('status');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Validate enum values
    if (entityType && !VALID_ENTITY_TYPES.includes(entityType as EntityType)) {
      return NextResponse.json(
        { error: `Invalid entity type. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`, code: 'INVALID_ENTITY_TYPE' },
        { status: 400 }
      );
    }

    if (status && !VALID_STATUSES.includes(status as Status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    // Build where conditions
    const conditions = [];

    if (exportedById) {
      const exportedByIdInt = parseInt(exportedById);
      if (isNaN(exportedByIdInt)) {
        return NextResponse.json(
          { error: 'Valid exportedById is required', code: 'INVALID_EXPORTED_BY_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(exportJobsNew.exportedById, exportedByIdInt));
    }

    if (entityType) {
      conditions.push(eq(exportJobsNew.entityType, entityType));
    }

    if (status) {
      conditions.push(eq(exportJobsNew.status, status));
    }

    if (fromDate) {
      conditions.push(gte(exportJobsNew.createdAt, fromDate));
    }

    if (toDate) {
      conditions.push(lte(exportJobsNew.createdAt, toDate));
    }

    let query = db
      .select()
      .from(exportJobsNew)
      .orderBy(desc(exportJobsNew.createdAt))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

// POST - Create new export job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { exportedById, entityType, filters, fileUrl, status } = body;

    // Validate required fields
    if (!exportedById) {
      return NextResponse.json(
        { error: 'exportedById is required', code: 'MISSING_EXPORTED_BY_ID' },
        { status: 400 }
      );
    }

    if (!entityType) {
      return NextResponse.json(
        { error: 'entityType is required', code: 'MISSING_ENTITY_TYPE' },
        { status: 400 }
      );
    }

    // Validate exportedById is a valid integer
    const exportedByIdInt = parseInt(exportedById);
    if (isNaN(exportedByIdInt)) {
      return NextResponse.json(
        { error: 'exportedById must be a valid integer', code: 'INVALID_EXPORTED_BY_ID' },
        { status: 400 }
      );
    }

    // Validate entity type enum
    if (!VALID_ENTITY_TYPES.includes(entityType as EntityType)) {
      return NextResponse.json(
        { error: `Invalid entity type. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`, code: 'INVALID_ENTITY_TYPE' },
        { status: 400 }
      );
    }

    // Validate status enum if provided
    if (status && !VALID_STATUSES.includes(status as Status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    // Validate exportedById references existing user
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.id, exportedByIdInt))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User with provided exportedById does not exist', code: 'INVALID_USER_REFERENCE' },
        { status: 400 }
      );
    }

    // Prepare insert data
    const insertData: any = {
      exportedById: exportedByIdInt,
      entityType: entityType.trim(),
      status: status?.trim() || 'pending',
      createdAt: new Date().toISOString(),
    };

    if (filters !== undefined) {
      insertData.filters = filters;
    }

    if (fileUrl !== undefined && fileUrl !== null) {
      insertData.fileUrl = typeof fileUrl === 'string' ? fileUrl.trim() : fileUrl;
    }

    // Insert new export job
    const newExportJob = await db
      .insert(exportJobsNew)
      .values(insertData)
      .returning();

    return NextResponse.json(newExportJob[0], { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT - Update existing export job
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required', code: 'MISSING_ID' },
        { status: 400 }
      );
    }

    const exportJobId = parseInt(id);
    if (isNaN(exportJobId)) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if export job exists
    const existingExportJob = await db
      .select()
      .from(exportJobsNew)
      .where(eq(exportJobsNew.id, exportJobId))
      .limit(1);

    if (existingExportJob.length === 0) {
      return NextResponse.json(
        { error: 'Export job not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { filters, fileUrl, status, completedAt } = body;

    // Validate status enum if provided
    if (status && !VALID_STATUSES.includes(status as Status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (filters !== undefined) {
      updateData.filters = filters;
    }

    if (fileUrl !== undefined) {
      updateData.fileUrl = typeof fileUrl === 'string' ? fileUrl.trim() : fileUrl;
    }

    if (status !== undefined) {
      updateData.status = status.trim();
      
      // Auto-set completedAt when status changes to completed or failed
      if ((status === 'completed' || status === 'failed') && !completedAt) {
        updateData.completedAt = new Date().toISOString();
      }
    }

    if (completedAt !== undefined) {
      updateData.completedAt = completedAt;
    }

    // Only proceed if there are fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update', code: 'NO_UPDATE_FIELDS' },
        { status: 400 }
      );
    }

    // Update the export job
    const updated = await db
      .update(exportJobsNew)
      .set(updateData)
      .where(eq(exportJobsNew.id, exportJobId))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete export job
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required', code: 'MISSING_ID' },
        { status: 400 }
      );
    }

    const exportJobId = parseInt(id);
    if (isNaN(exportJobId)) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if export job exists
    const existingExportJob = await db
      .select()
      .from(exportJobsNew)
      .where(eq(exportJobsNew.id, exportJobId))
      .limit(1);

    if (existingExportJob.length === 0) {
      return NextResponse.json(
        { error: 'Export job not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the export job
    const deleted = await db
      .delete(exportJobsNew)
      .where(eq(exportJobsNew.id, exportJobId))
      .returning();

    return NextResponse.json(
      {
        message: 'Export job deleted successfully',
        deletedExportJob: deleted[0],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}