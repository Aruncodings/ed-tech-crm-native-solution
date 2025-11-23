import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { callLogsNew, telecallerCallStats, leadsNew, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const VALID_CALL_OUTCOMES = [
  'answered',
  'no_answer',
  'busy',
  'callback_requested',
  'not_interested',
  'interested',
  'converted'
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      leadId,
      callerId,
      callDate,
      callOutcome,
      callDurationSeconds,
      nextFollowupDate,
      notes
    } = body;

    // Validate required fields
    if (!leadId) {
      return NextResponse.json({
        error: 'Lead ID is required',
        code: 'MISSING_LEAD_ID'
      }, { status: 400 });
    }

    if (!callerId) {
      return NextResponse.json({
        error: 'Caller ID is required',
        code: 'MISSING_CALLER_ID'
      }, { status: 400 });
    }

    if (!callDate) {
      return NextResponse.json({
        error: 'Call date is required',
        code: 'MISSING_CALL_DATE'
      }, { status: 400 });
    }

    if (!callOutcome) {
      return NextResponse.json({
        error: 'Call outcome is required',
        code: 'MISSING_CALL_OUTCOME'
      }, { status: 400 });
    }

    // Validate data types
    const leadIdInt = parseInt(leadId);
    if (isNaN(leadIdInt)) {
      return NextResponse.json({
        error: 'Lead ID must be a valid integer',
        code: 'INVALID_LEAD_ID'
      }, { status: 400 });
    }

    const callerIdInt = parseInt(callerId);
    if (isNaN(callerIdInt)) {
      return NextResponse.json({
        error: 'Caller ID must be a valid integer',
        code: 'INVALID_CALLER_ID'
      }, { status: 400 });
    }

    // Validate call date is valid ISO string
    const callDateObj = new Date(callDate);
    if (isNaN(callDateObj.getTime())) {
      return NextResponse.json({
        error: 'Call date must be a valid ISO date string',
        code: 'INVALID_CALL_DATE'
      }, { status: 400 });
    }

    // Validate call outcome
    if (!VALID_CALL_OUTCOMES.includes(callOutcome)) {
      return NextResponse.json({
        error: `Call outcome must be one of: ${VALID_CALL_OUTCOMES.join(', ')}`,
        code: 'INVALID_CALL_OUTCOME'
      }, { status: 400 });
    }

    // Validate call duration if provided
    if (callDurationSeconds !== undefined && callDurationSeconds !== null) {
      const durationInt = parseInt(callDurationSeconds);
      if (isNaN(durationInt) || durationInt < 0) {
        return NextResponse.json({
          error: 'Call duration must be a non-negative integer',
          code: 'INVALID_CALL_DURATION'
        }, { status: 400 });
      }
    }

    // Validate next followup date if provided
    if (nextFollowupDate) {
      const followupDateObj = new Date(nextFollowupDate);
      if (isNaN(followupDateObj.getTime())) {
        return NextResponse.json({
          error: 'Next followup date must be a valid ISO date string',
          code: 'INVALID_FOLLOWUP_DATE'
        }, { status: 400 });
      }
    }

    // Validate lead exists
    const leadExists = await db.select()
      .from(leadsNew)
      .where(eq(leadsNew.id, leadIdInt))
      .limit(1);

    if (leadExists.length === 0) {
      return NextResponse.json({
        error: 'Lead not found',
        code: 'LEAD_NOT_FOUND'
      }, { status: 404 });
    }

    // Validate caller exists
    const callerExists = await db.select()
      .from(users)
      .where(eq(users.id, callerIdInt))
      .limit(1);

    if (callerExists.length === 0) {
      return NextResponse.json({
        error: 'Caller not found',
        code: 'CALLER_NOT_FOUND'
      }, { status: 404 });
    }

    // Create call log entry
    const callLogData: any = {
      leadId: leadIdInt,
      callerId: callerIdInt,
      callDate: callDate,
      callOutcome: callOutcome,
      createdAt: new Date().toISOString()
    };

    if (callDurationSeconds !== undefined && callDurationSeconds !== null) {
      callLogData.callDurationSeconds = parseInt(callDurationSeconds);
    }

    if (nextFollowupDate) {
      callLogData.nextFollowupDate = nextFollowupDate;
    }

    if (notes) {
      callLogData.notes = notes.trim();
    }

    const newCallLog = await db.insert(callLogsNew)
      .values(callLogData)
      .returning();

    // Extract date in YYYY-MM-DD format
    const callDateObj2 = new Date(callDate);
    const dateString = callDateObj2.toISOString().split('T')[0];

    // Check if stats record exists for telecaller and date
    const existingStats = await db.select()
      .from(telecallerCallStats)
      .where(
        and(
          eq(telecallerCallStats.telecallerId, callerIdInt),
          eq(telecallerCallStats.date, dateString)
        )
      )
      .limit(1);

    let statsRecord;

    if (existingStats.length > 0) {
      // Update existing record
      const currentStats = existingStats[0];
      
      const updatedCallsMade = currentStats.callsMade + 1;
      
      // Increment callsAnswered if outcome is answered, interested, or converted
      const callsAnsweredIncrement = ['answered', 'interested', 'converted'].includes(callOutcome) ? 1 : 0;
      const updatedCallsAnswered = currentStats.callsAnswered + callsAnsweredIncrement;
      
      // Add duration to total
      const durationToAdd = callDurationSeconds ? parseInt(callDurationSeconds) : 0;
      const updatedTotalDuration = currentStats.totalDurationSeconds + durationToAdd;
      
      // Increment leadsContacted
      const updatedLeadsContacted = currentStats.leadsContacted + 1;
      
      // Increment leadsConverted if outcome is converted
      const leadsConvertedIncrement = callOutcome === 'converted' ? 1 : 0;
      const updatedLeadsConverted = currentStats.leadsConverted + leadsConvertedIncrement;

      const updated = await db.update(telecallerCallStats)
        .set({
          callsMade: updatedCallsMade,
          callsAnswered: updatedCallsAnswered,
          totalDurationSeconds: updatedTotalDuration,
          leadsContacted: updatedLeadsContacted,
          leadsConverted: updatedLeadsConverted,
          updatedAt: new Date().toISOString()
        })
        .where(eq(telecallerCallStats.id, currentStats.id))
        .returning();

      statsRecord = updated[0];
    } else {
      // Create new record
      const initialCallsAnswered = ['answered', 'interested', 'converted'].includes(callOutcome) ? 1 : 0;
      const initialDuration = callDurationSeconds ? parseInt(callDurationSeconds) : 0;
      const initialLeadsConverted = callOutcome === 'converted' ? 1 : 0;

      const newStats = await db.insert(telecallerCallStats)
        .values({
          telecallerId: callerIdInt,
          date: dateString,
          callsMade: 1,
          callsAnswered: initialCallsAnswered,
          totalDurationSeconds: initialDuration,
          leadsContacted: 1,
          leadsConverted: initialLeadsConverted,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .returning();

      statsRecord = newStats[0];
    }

    // Update lead stage if converted
    if (callOutcome === 'converted') {
      await db.update(leadsNew)
        .set({
          leadStage: 'converted',
          updatedAt: new Date().toISOString()
        })
        .where(eq(leadsNew.id, leadIdInt));
    }

    return NextResponse.json({
      callLog: newCallLog[0],
      stats: statsRecord,
      message: 'Call tracked and statistics updated successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}