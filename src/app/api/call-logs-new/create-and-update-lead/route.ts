import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { callLogsNew, leadsNew, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const VALID_CALL_OUTCOMES = ['no_answer', 'busy', 'answered', 'callback_requested', 'not_interested', 'interested', 'converted'] as const;
const VALID_LEAD_STAGES = ['new', 'contacted', 'qualified', 'demo_scheduled', 'proposal_sent', 'negotiation', 'converted', 'lost'] as const;

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
      notes,
      newLeadStage
    } = body;

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

    // Validate leadId and callerId are valid integers
    const leadIdInt = parseInt(String(leadId));
    const callerIdInt = parseInt(String(callerId));

    if (isNaN(leadIdInt)) {
      return NextResponse.json({ 
        error: "leadId must be a valid integer",
        code: "INVALID_LEAD_ID" 
      }, { status: 400 });
    }

    if (isNaN(callerIdInt)) {
      return NextResponse.json({ 
        error: "callerId must be a valid integer",
        code: "INVALID_CALLER_ID" 
      }, { status: 400 });
    }

    // Validate callDate is valid ISO date
    const callDateObj = new Date(callDate);
    if (isNaN(callDateObj.getTime())) {
      return NextResponse.json({ 
        error: "callDate must be a valid ISO date string",
        code: "INVALID_CALL_DATE" 
      }, { status: 400 });
    }

    // Validate callOutcome enum
    if (!VALID_CALL_OUTCOMES.includes(callOutcome as any)) {
      return NextResponse.json({ 
        error: `callOutcome must be one of: ${VALID_CALL_OUTCOMES.join(', ')}`,
        code: "INVALID_CALL_OUTCOME" 
      }, { status: 400 });
    }

    // Validate newLeadStage if provided
    if (newLeadStage && !VALID_LEAD_STAGES.includes(newLeadStage as any)) {
      return NextResponse.json({ 
        error: `newLeadStage must be one of: ${VALID_LEAD_STAGES.join(', ')}`,
        code: "INVALID_LEAD_STAGE" 
      }, { status: 400 });
    }

    // Validate nextFollowupDate if provided
    if (nextFollowupDate) {
      const followupDateObj = new Date(nextFollowupDate);
      if (isNaN(followupDateObj.getTime())) {
        return NextResponse.json({ 
          error: "nextFollowupDate must be a valid ISO date string",
          code: "INVALID_FOLLOWUP_DATE" 
        }, { status: 400 });
      }
    }

    // Validate callDurationSeconds if provided
    if (callDurationSeconds !== undefined && callDurationSeconds !== null) {
      const duration = parseInt(String(callDurationSeconds));
      if (isNaN(duration) || duration < 0) {
        return NextResponse.json({ 
          error: "callDurationSeconds must be a non-negative integer",
          code: "INVALID_CALL_DURATION" 
        }, { status: 400 });
      }
    }

    // Verify leadId exists
    const existingLead = await db.select()
      .from(leadsNew)
      .where(eq(leadsNew.id, leadIdInt))
      .limit(1);

    if (existingLead.length === 0) {
      return NextResponse.json({ 
        error: "Lead not found",
        code: "LEAD_NOT_FOUND" 
      }, { status: 404 });
    }

    // Verify callerId exists
    const existingCaller = await db.select()
      .from(users)
      .where(eq(users.id, callerIdInt))
      .limit(1);

    if (existingCaller.length === 0) {
      return NextResponse.json({ 
        error: "Caller not found",
        code: "CALLER_NOT_FOUND" 
      }, { status: 404 });
    }

    // Prepare timestamps
    const now = new Date().toISOString();

    // Create call log
    const callLogData: any = {
      leadId: leadIdInt,
      callerId: callerIdInt,
      callDate: callDate,
      callOutcome: callOutcome,
      createdAt: now
    };

    if (callDurationSeconds !== undefined && callDurationSeconds !== null) {
      callLogData.callDurationSeconds = parseInt(String(callDurationSeconds));
    }

    if (nextFollowupDate) {
      callLogData.nextFollowupDate = nextFollowupDate;
    }

    if (notes) {
      callLogData.notes = String(notes).trim();
    }

    const newCallLog = await db.insert(callLogsNew)
      .values(callLogData)
      .returning();

    if (newCallLog.length === 0) {
      return NextResponse.json({ 
        error: "Failed to create call log",
        code: "CALL_LOG_CREATION_FAILED" 
      }, { status: 500 });
    }

    // Prepare lead update data
    const leadUpdateData: any = {
      updatedAt: now
    };

    // Determine lead stage to set
    if (callOutcome === 'converted') {
      // If call outcome is converted, set lead stage to converted and set conversion date
      leadUpdateData.leadStage = 'converted';
      leadUpdateData.conversionDate = now;
    } else if (newLeadStage) {
      // If newLeadStage is provided, use it
      leadUpdateData.leadStage = newLeadStage;
    }

    // Update lead
    const updatedLead = await db.update(leadsNew)
      .set(leadUpdateData)
      .where(eq(leadsNew.id, leadIdInt))
      .returning();

    if (updatedLead.length === 0) {
      return NextResponse.json({ 
        error: "Failed to update lead",
        code: "LEAD_UPDATE_FAILED" 
      }, { status: 500 });
    }

    return NextResponse.json({
      callLog: newCallLog[0],
      lead: updatedLead[0],
      message: "Call log created and lead updated successfully"
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}