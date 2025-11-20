import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { callLogsNew, leadsNew, users } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

const VALID_CALL_OUTCOMES = ['no_answer', 'busy', 'answered', 'callback_requested', 'not_interested', 'interested', 'converted'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const callLog = await db.select()
        .from(callLogsNew)
        .where(eq(callLogsNew.id, parseInt(id)))
        .limit(1);

      if (callLog.length === 0) {
        return NextResponse.json({ 
          error: 'Call log not found',
          code: "NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(callLog[0]);
    }

    // List with filtering and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const leadId = searchParams.get('leadId');
    const callerId = searchParams.get('callerId');
    const callOutcome = searchParams.get('callOutcome');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    let query = db.select().from(callLogsNew);
    const conditions = [];

    // Filter by leadId
    if (leadId) {
      if (isNaN(parseInt(leadId))) {
        return NextResponse.json({ 
          error: "Valid leadId is required",
          code: "INVALID_LEAD_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(callLogsNew.leadId, parseInt(leadId)));
    }

    // Filter by callerId
    if (callerId) {
      if (isNaN(parseInt(callerId))) {
        return NextResponse.json({ 
          error: "Valid callerId is required",
          code: "INVALID_CALLER_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(callLogsNew.callerId, parseInt(callerId)));
    }

    // Filter by callOutcome
    if (callOutcome) {
      if (!VALID_CALL_OUTCOMES.includes(callOutcome)) {
        return NextResponse.json({ 
          error: `Invalid call outcome. Must be one of: ${VALID_CALL_OUTCOMES.join(', ')}`,
          code: "INVALID_CALL_OUTCOME" 
        }, { status: 400 });
      }
      conditions.push(eq(callLogsNew.callOutcome, callOutcome));
    }

    // Filter by date range
    if (fromDate) {
      conditions.push(gte(callLogsNew.callDate, fromDate));
    }
    if (toDate) {
      conditions.push(lte(callLogsNew.callDate, toDate));
    }

    // Apply conditions if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting, pagination
    const results = await query
      .orderBy(desc(callLogsNew.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, callerId, callDate, callOutcome, callDurationSeconds, nextFollowupDate, notes } = body;

    // Validate required fields
    if (!leadId) {
      return NextResponse.json({ 
        error: "leadId is required",
        code: "MISSING_LEAD_ID" 
      }, { status: 400 });
    }

    if (!callerId) {
      return NextResponse.json({ 
        error: "callerId is required",
        code: "MISSING_CALLER_ID" 
      }, { status: 400 });
    }

    if (!callDate) {
      return NextResponse.json({ 
        error: "callDate is required",
        code: "MISSING_CALL_DATE" 
      }, { status: 400 });
    }

    if (!callOutcome) {
      return NextResponse.json({ 
        error: "callOutcome is required",
        code: "MISSING_CALL_OUTCOME" 
      }, { status: 400 });
    }

    // Validate leadId and callerId are integers
    if (isNaN(parseInt(leadId))) {
      return NextResponse.json({ 
        error: "leadId must be a valid integer",
        code: "INVALID_LEAD_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(callerId))) {
      return NextResponse.json({ 
        error: "callerId must be a valid integer",
        code: "INVALID_CALLER_ID" 
      }, { status: 400 });
    }

    // Validate callOutcome enum
    if (!VALID_CALL_OUTCOMES.includes(callOutcome)) {
      return NextResponse.json({ 
        error: `Invalid call outcome. Must be one of: ${VALID_CALL_OUTCOMES.join(', ')}`,
        code: "INVALID_CALL_OUTCOME" 
      }, { status: 400 });
    }

    // Validate callDate format (basic ISO date check)
    const dateRegex = /^\d{4}-\d{2}-\d{2}/;
    if (!dateRegex.test(callDate)) {
      return NextResponse.json({ 
        error: "callDate must be a valid ISO date string",
        code: "INVALID_CALL_DATE" 
      }, { status: 400 });
    }

    // Validate nextFollowupDate if provided
    if (nextFollowupDate && !dateRegex.test(nextFollowupDate)) {
      return NextResponse.json({ 
        error: "nextFollowupDate must be a valid ISO date string",
        code: "INVALID_FOLLOWUP_DATE" 
      }, { status: 400 });
    }

    // Validate callDurationSeconds if provided
    if (callDurationSeconds !== undefined && callDurationSeconds !== null) {
      if (isNaN(parseInt(callDurationSeconds))) {
        return NextResponse.json({ 
          error: "callDurationSeconds must be a valid integer",
          code: "INVALID_DURATION" 
        }, { status: 400 });
      }
    }

    // Verify leadId exists in leadsNew table
    const leadExists = await db.select()
      .from(leadsNew)
      .where(eq(leadsNew.id, parseInt(leadId)))
      .limit(1);

    if (leadExists.length === 0) {
      return NextResponse.json({ 
        error: "Lead with specified leadId does not exist",
        code: "LEAD_NOT_FOUND" 
      }, { status: 400 });
    }

    // Verify callerId exists in users table
    const callerExists = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(callerId)))
      .limit(1);

    if (callerExists.length === 0) {
      return NextResponse.json({ 
        error: "User with specified callerId does not exist",
        code: "CALLER_NOT_FOUND" 
      }, { status: 400 });
    }

    // Prepare insert data
    const insertData: any = {
      leadId: parseInt(leadId),
      callerId: parseInt(callerId),
      callDate: callDate.trim(),
      callOutcome: callOutcome.trim(),
      createdAt: new Date().toISOString()
    };

    // Add optional fields if provided
    if (callDurationSeconds !== undefined && callDurationSeconds !== null) {
      insertData.callDurationSeconds = parseInt(callDurationSeconds);
    }

    if (nextFollowupDate) {
      insertData.nextFollowupDate = nextFollowupDate.trim();
    }

    if (notes) {
      insertData.notes = notes.trim();
    }

    // Insert call log
    const newCallLog = await db.insert(callLogsNew)
      .values(insertData)
      .returning();

    return NextResponse.json(newCallLog[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { callDate, callDurationSeconds, callOutcome, nextFollowupDate, notes } = body;

    // Check if call log exists
    const existingCallLog = await db.select()
      .from(callLogsNew)
      .where(eq(callLogsNew.id, parseInt(id)))
      .limit(1);

    if (existingCallLog.length === 0) {
      return NextResponse.json({ 
        error: 'Call log not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    // Validate callOutcome if provided
    if (callOutcome && !VALID_CALL_OUTCOMES.includes(callOutcome)) {
      return NextResponse.json({ 
        error: `Invalid call outcome. Must be one of: ${VALID_CALL_OUTCOMES.join(', ')}`,
        code: "INVALID_CALL_OUTCOME" 
      }, { status: 400 });
    }

    // Validate callDate if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}/;
    if (callDate && !dateRegex.test(callDate)) {
      return NextResponse.json({ 
        error: "callDate must be a valid ISO date string",
        code: "INVALID_CALL_DATE" 
      }, { status: 400 });
    }

    // Validate nextFollowupDate if provided
    if (nextFollowupDate && !dateRegex.test(nextFollowupDate)) {
      return NextResponse.json({ 
        error: "nextFollowupDate must be a valid ISO date string",
        code: "INVALID_FOLLOWUP_DATE" 
      }, { status: 400 });
    }

    // Validate callDurationSeconds if provided
    if (callDurationSeconds !== undefined && callDurationSeconds !== null && isNaN(parseInt(callDurationSeconds))) {
      return NextResponse.json({ 
        error: "callDurationSeconds must be a valid integer",
        code: "INVALID_DURATION" 
      }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {};

    if (callDate !== undefined) {
      updateData.callDate = callDate.trim();
    }

    if (callDurationSeconds !== undefined) {
      updateData.callDurationSeconds = callDurationSeconds !== null ? parseInt(callDurationSeconds) : null;
    }

    if (callOutcome !== undefined) {
      updateData.callOutcome = callOutcome.trim();
    }

    if (nextFollowupDate !== undefined) {
      updateData.nextFollowupDate = nextFollowupDate ? nextFollowupDate.trim() : null;
    }

    if (notes !== undefined) {
      updateData.notes = notes ? notes.trim() : null;
    }

    // Update call log
    const updatedCallLog = await db.update(callLogsNew)
      .set(updateData)
      .where(eq(callLogsNew.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedCallLog[0]);

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if call log exists
    const existingCallLog = await db.select()
      .from(callLogsNew)
      .where(eq(callLogsNew.id, parseInt(id)))
      .limit(1);

    if (existingCallLog.length === 0) {
      return NextResponse.json({ 
        error: 'Call log not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    // Delete call log
    const deletedCallLog = await db.delete(callLogsNew)
      .where(eq(callLogsNew.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Call log deleted successfully',
      deletedCallLog: deletedCallLog[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}