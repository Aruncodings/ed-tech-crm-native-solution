import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { callLogsNew } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

// Helper function to escape CSV fields
function escapeCSVField(field: any): string {
  if (field === null || field === undefined) {
    return '';
  }
  
  const fieldStr = String(field);
  
  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n') || fieldStr.includes('\r')) {
    return `"${fieldStr.replace(/"/g, '""')}"`;
  }
  
  return fieldStr;
}

// Helper function to validate date format (YYYY-MM-DD)
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  const timestamp = date.getTime();
  
  if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
    return false;
  }
  
  return date.toISOString().startsWith(dateString);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract query parameters
    const telecallerIdParam = searchParams.get('telecallerId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const callOutcomeParam = searchParams.get('callOutcome');

    // Validate telecallerId if provided
    let telecallerId: number | undefined;
    if (telecallerIdParam) {
      const parsed = parseInt(telecallerIdParam);
      if (isNaN(parsed)) {
        return NextResponse.json({ 
          error: 'telecallerId must be a valid integer',
          code: 'INVALID_TELECALLER_ID'
        }, { status: 400 });
      }
      telecallerId = parsed;
    }

    // Validate startDate if provided
    if (startDateParam && !isValidDate(startDateParam)) {
      return NextResponse.json({ 
        error: 'startDate must be in YYYY-MM-DD format',
        code: 'INVALID_START_DATE'
      }, { status: 400 });
    }

    // Validate endDate if provided
    if (endDateParam && !isValidDate(endDateParam)) {
      return NextResponse.json({ 
        error: 'endDate must be in YYYY-MM-DD format',
        code: 'INVALID_END_DATE'
      }, { status: 400 });
    }

    // Build WHERE conditions dynamically
    const conditions = [];

    if (telecallerId !== undefined) {
      conditions.push(eq(callLogsNew.callerId, telecallerId));
    }

    if (startDateParam) {
      conditions.push(gte(callLogsNew.callDate, startDateParam));
    }

    if (endDateParam) {
      conditions.push(lte(callLogsNew.callDate, endDateParam));
    }

    if (callOutcomeParam) {
      conditions.push(eq(callLogsNew.callOutcome, callOutcomeParam));
    }

    // Build and execute query
    let query = db.select().from(callLogsNew);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const callLogs = await query.orderBy(desc(callLogsNew.callDate));

    // Generate CSV content
    const headers = [
      'ID',
      'Lead ID',
      'Caller ID',
      'Call Date',
      'Duration (seconds)',
      'Outcome',
      'Next Followup',
      'Notes',
      'Created At'
    ];

    const csvRows = [headers.join(',')];

    for (const log of callLogs) {
      const row = [
        escapeCSVField(log.id),
        escapeCSVField(log.leadId),
        escapeCSVField(log.callerId),
        escapeCSVField(log.callDate),
        escapeCSVField(log.callDurationSeconds),
        escapeCSVField(log.callOutcome),
        escapeCSVField(log.nextFollowupDate),
        escapeCSVField(log.notes),
        escapeCSVField(log.createdAt)
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `call_logs_export_${currentDate}.csv`;

    // Return CSV response
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}