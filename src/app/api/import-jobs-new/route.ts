import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { importJobsNew, users } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

const VALID_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;
type ImportJobStatus = typeof VALID_STATUSES[number];

function isValidStatus(status: string): status is ImportJobStatus {
  return VALID_STATUSES.includes(status as ImportJobStatus);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const importJob = await db
        .select()
        .from(importJobsNew)
        .where(eq(importJobsNew.id, parseInt(id)))
        .limit(1);

      if (importJob.length === 0) {
        return NextResponse.json(
          { error: 'Import job not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(importJob[0], { status: 200 });
    }

    // List with filtering and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const importedById = searchParams.get('importedById');
    const status = searchParams.get('status');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Build where conditions
    const conditions = [];

    if (importedById) {
      if (isNaN(parseInt(importedById))) {
        return NextResponse.json(
          { error: 'Valid importedById is required', code: 'INVALID_IMPORTED_BY_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(importJobsNew.importedById, parseInt(importedById)));
    }

    if (status) {
      if (!isValidStatus(status)) {
        return NextResponse.json(
          { 
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 
            code: 'INVALID_STATUS' 
          },
          { status: 400 }
        );
      }
      conditions.push(eq(importJobsNew.status, status));
    }

    if (fromDate) {
      conditions.push(gte(importJobsNew.createdAt, fromDate));
    }

    if (toDate) {
      conditions.push(lte(importJobsNew.createdAt, toDate));
    }

    let query = db
      .select()
      .from(importJobsNew)
      .orderBy(desc(importJobsNew.createdAt));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

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
    const { 
      importedById, 
      fileName, 
      totalRecords, 
      successCount, 
      errorCount, 
      status, 
      errorLog 
    } = body;

    // Validate required fields
    if (!importedById) {
      return NextResponse.json(
        { error: 'importedById is required', code: 'MISSING_IMPORTED_BY_ID' },
        { status: 400 }
      );
    }

    if (typeof importedById !== 'number' || isNaN(importedById)) {
      return NextResponse.json(
        { error: 'importedById must be a valid number', code: 'INVALID_IMPORTED_BY_ID' },
        { status: 400 }
      );
    }

    if (!fileName || typeof fileName !== 'string' || fileName.trim() === '') {
      return NextResponse.json(
        { error: 'fileName is required and cannot be empty', code: 'MISSING_FILE_NAME' },
        { status: 400 }
      );
    }

    // Validate importedById references existing user
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.id, importedById))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User with specified importedById does not exist', code: 'INVALID_USER_REFERENCE' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !isValidStatus(status)) {
      return NextResponse.json(
        { 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    // Validate numeric fields if provided
    if (totalRecords !== undefined && (typeof totalRecords !== 'number' || isNaN(totalRecords) || totalRecords < 0)) {
      return NextResponse.json(
        { error: 'totalRecords must be a non-negative number', code: 'INVALID_TOTAL_RECORDS' },
        { status: 400 }
      );
    }

    if (successCount !== undefined && (typeof successCount !== 'number' || isNaN(successCount) || successCount < 0)) {
      return NextResponse.json(
        { error: 'successCount must be a non-negative number', code: 'INVALID_SUCCESS_COUNT' },
        { status: 400 }
      );
    }

    if (errorCount !== undefined && (typeof errorCount !== 'number' || isNaN(errorCount) || errorCount < 0)) {
      return NextResponse.json(
        { error: 'errorCount must be a non-negative number', code: 'INVALID_ERROR_COUNT' },
        { status: 400 }
      );
    }

    // Validate errorLog if provided
    if (errorLog !== undefined && errorLog !== null) {
      if (!Array.isArray(errorLog)) {
        return NextResponse.json(
          { error: 'errorLog must be an array', code: 'INVALID_ERROR_LOG' },
          { status: 400 }
        );
      }
    }

    // Prepare insert data with defaults
    const insertData = {
      importedById,
      fileName: fileName.trim(),
      totalRecords: totalRecords ?? 0,
      successCount: successCount ?? 0,
      errorCount: errorCount ?? 0,
      status: status ?? 'pending',
      errorLog: errorLog ?? null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    const newImportJob = await db
      .insert(importJobsNew)
      .values(insertData)
      .returning();

    return NextResponse.json(newImportJob[0], { status: 201 });
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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      totalRecords, 
      successCount, 
      errorCount, 
      status, 
      errorLog, 
      completedAt 
    } = body;

    // Check if trying to update restricted fields
    if ('importedById' in body || 'fileName' in body || 'createdAt' in body) {
      return NextResponse.json(
        { 
          error: 'Cannot update importedById, fileName, or createdAt fields', 
          code: 'RESTRICTED_FIELDS' 
        },
        { status: 400 }
      );
    }

    // Check if import job exists
    const existingJob = await db
      .select()
      .from(importJobsNew)
      .where(eq(importJobsNew.id, parseInt(id)))
      .limit(1);

    if (existingJob.length === 0) {
      return NextResponse.json(
        { error: 'Import job not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate status if provided
    if (status && !isValidStatus(status)) {
      return NextResponse.json(
        { 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    // Validate numeric fields if provided
    if (totalRecords !== undefined && (typeof totalRecords !== 'number' || isNaN(totalRecords) || totalRecords < 0)) {
      return NextResponse.json(
        { error: 'totalRecords must be a non-negative number', code: 'INVALID_TOTAL_RECORDS' },
        { status: 400 }
      );
    }

    if (successCount !== undefined && (typeof successCount !== 'number' || isNaN(successCount) || successCount < 0)) {
      return NextResponse.json(
        { error: 'successCount must be a non-negative number', code: 'INVALID_SUCCESS_COUNT' },
        { status: 400 }
      );
    }

    if (errorCount !== undefined && (typeof errorCount !== 'number' || isNaN(errorCount) || errorCount < 0)) {
      return NextResponse.json(
        { error: 'errorCount must be a non-negative number', code: 'INVALID_ERROR_COUNT' },
        { status: 400 }
      );
    }

    // Validate errorLog if provided
    if (errorLog !== undefined && errorLog !== null) {
      if (!Array.isArray(errorLog)) {
        return NextResponse.json(
          { error: 'errorLog must be an array', code: 'INVALID_ERROR_LOG' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (totalRecords !== undefined) updateData.totalRecords = totalRecords;
    if (successCount !== undefined) updateData.successCount = successCount;
    if (errorCount !== undefined) updateData.errorCount = errorCount;
    if (status !== undefined) updateData.status = status;
    if (errorLog !== undefined) updateData.errorLog = errorLog;

    // Auto-set completedAt if status changes to completed or failed and not provided
    if (status && (status === 'completed' || status === 'failed')) {
      if (completedAt !== undefined) {
        updateData.completedAt = completedAt;
      } else if (!existingJob[0].completedAt) {
        updateData.completedAt = new Date().toISOString();
      }
    } else if (completedAt !== undefined) {
      updateData.completedAt = completedAt;
    }

    const updatedJob = await db
      .update(importJobsNew)
      .set(updateData)
      .where(eq(importJobsNew.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedJob[0], { status: 200 });
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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if import job exists
    const existingJob = await db
      .select()
      .from(importJobsNew)
      .where(eq(importJobsNew.id, parseInt(id)))
      .limit(1);

    if (existingJob.length === 0) {
      return NextResponse.json(
        { error: 'Import job not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deletedJob = await db
      .delete(importJobsNew)
      .where(eq(importJobsNew.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Import job deleted successfully',
        deletedJob: deletedJob[0],
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