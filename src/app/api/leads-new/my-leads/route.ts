import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leadsNew } from '@/db/schema';
import { eq, like, or, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Required parameter validation
    const telecallerId = searchParams.get('telecaller_id');
    if (!telecallerId || isNaN(parseInt(telecallerId))) {
      return NextResponse.json({ 
        error: 'Valid telecaller_id is required',
        code: 'INVALID_TELECALLER_ID' 
      }, { status: 400 });
    }

    // Optional filters
    const leadStage = searchParams.get('leadStage');
    const leadStatus = searchParams.get('leadStatus') ?? 'active';
    const search = searchParams.get('search');
    
    // Pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Validate enum values for leadStage if provided
    const validLeadStages = ['new', 'contacted', 'qualified', 'negotiation', 'converted', 'lost'];
    if (leadStage && !validLeadStages.includes(leadStage)) {
      return NextResponse.json({ 
        error: `Invalid leadStage. Must be one of: ${validLeadStages.join(', ')}`,
        code: 'INVALID_LEAD_STAGE' 
      }, { status: 400 });
    }

    // Validate enum values for leadStatus if provided
    const validLeadStatuses = ['active', 'inactive', 'archived'];
    if (leadStatus && !validLeadStatuses.includes(leadStatus)) {
      return NextResponse.json({ 
        error: `Invalid leadStatus. Must be one of: ${validLeadStatuses.join(', ')}`,
        code: 'INVALID_LEAD_STATUS' 
      }, { status: 400 });
    }

    // Build query conditions
    const conditions = [
      eq(leadsNew.assignedTelecallerId, parseInt(telecallerId))
    ];

    // Add leadStage filter if provided
    if (leadStage) {
      conditions.push(eq(leadsNew.leadStage, leadStage));
    }

    // Add leadStatus filter (default to 'active')
    conditions.push(eq(leadsNew.leadStatus, leadStatus));

    // Add search conditions if search parameter is provided
    if (search) {
      const searchCondition = or(
        like(leadsNew.name, `%${search}%`),
        like(leadsNew.email, `%${search}%`),
        like(leadsNew.phone, `%${search}%`)
      );
      conditions.push(searchCondition);
    }

    // Execute query with all conditions
    const results = await db.select()
      .from(leadsNew)
      .where(and(...conditions))
      .orderBy(desc(leadsNew.updatedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET telecaller leads error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}