import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leadsNew } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const assignedTelecallerId = searchParams.get('assignedTelecallerId');
    const assignedCounselorId = searchParams.get('assignedCounselorId');

    // Validate date formats if provided
    if (fromDate && isNaN(Date.parse(fromDate))) {
      return NextResponse.json({
        error: 'Invalid fromDate format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)',
        code: 'INVALID_FROM_DATE'
      }, { status: 400 });
    }

    if (toDate && isNaN(Date.parse(toDate))) {
      return NextResponse.json({
        error: 'Invalid toDate format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)',
        code: 'INVALID_TO_DATE'
      }, { status: 400 });
    }

    // Build where conditions
    const conditions = [];
    
    if (fromDate) {
      conditions.push(gte(leadsNew.createdAt, fromDate));
    }
    
    if (toDate) {
      conditions.push(lte(leadsNew.createdAt, toDate));
    }
    
    if (assignedTelecallerId) {
      const telecallerId = parseInt(assignedTelecallerId);
      if (isNaN(telecallerId)) {
        return NextResponse.json({
          error: 'Invalid assignedTelecallerId. Must be a valid integer',
          code: 'INVALID_TELECALLER_ID'
        }, { status: 400 });
      }
      conditions.push(eq(leadsNew.assignedTelecallerId, telecallerId));
    }
    
    if (assignedCounselorId) {
      const counselorId = parseInt(assignedCounselorId);
      if (isNaN(counselorId)) {
        return NextResponse.json({
          error: 'Invalid assignedCounselorId. Must be a valid integer',
          code: 'INVALID_COUNSELOR_ID'
        }, { status: 400 });
      }
      conditions.push(eq(leadsNew.assignedCounselorId, counselorId));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch all leads matching the conditions
    let query = db.select().from(leadsNew);
    if (whereCondition) {
      query = query.where(whereCondition);
    }
    const allLeads = await query;

    // Calculate total leads
    const total_leads = allLeads.length;

    // Calculate leads by stage
    const leads_by_stage = {
      new: 0,
      contacted: 0,
      qualified: 0,
      demo_scheduled: 0,
      proposal_sent: 0,
      negotiation: 0,
      converted: 0,
      lost: 0
    };

    allLeads.forEach(lead => {
      const stage = lead.leadStage?.toLowerCase() || 'new';
      if (stage in leads_by_stage) {
        leads_by_stage[stage as keyof typeof leads_by_stage]++;
      }
    });

    // Calculate leads by status
    const leads_by_status = {
      active: 0,
      inactive: 0,
      junk: 0
    };

    allLeads.forEach(lead => {
      const status = lead.leadStatus?.toLowerCase() || 'active';
      if (status in leads_by_status) {
        leads_by_status[status as keyof typeof leads_by_status]++;
      }
    });

    // Calculate leads by source
    const leads_by_source = {
      website: 0,
      referral: 0,
      social_media: 0,
      advertisement: 0,
      walk_in: 0,
      other: 0
    };

    allLeads.forEach(lead => {
      const source = lead.leadSource?.toLowerCase().replace(/[_\s-]/g, '_') || 'other';
      if (source in leads_by_source) {
        leads_by_source[source as keyof typeof leads_by_source]++;
      } else {
        leads_by_source.other++;
      }
    });

    // Calculate conversion rate
    const convertedLeads = leads_by_stage.converted;
    const conversion_rate = total_leads > 0 ? parseFloat(((convertedLeads / total_leads) * 100).toFixed(2)) : 0;

    // Calculate recent leads count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    const recentLeadsConditions = [];
    recentLeadsConditions.push(gte(leadsNew.createdAt, sevenDaysAgoISO));
    
    if (conditions.length > 0) {
      recentLeadsConditions.push(...conditions);
    }

    const recentLeadsQuery = db.select().from(leadsNew)
      .where(and(...recentLeadsConditions));
    
    const recentLeads = await recentLeadsQuery;
    const recent_leads_count = recentLeads.length;

    // Calculate pending followups (leads with next followup date set)
    // Note: The schema doesn't show a nextFollowupDate field in leadsNew table
    // This would typically be in callLogsNew table. For now, returning 0
    // If you need this functionality, you'll need to join with callLogsNew
    const pending_followups = 0;

    // Construct response
    const statistics = {
      total_leads,
      leads_by_stage,
      leads_by_status,
      leads_by_source,
      conversion_rate,
      recent_leads_count,
      pending_followups
    };

    return NextResponse.json(statistics, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}