import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { telecallerCallStats } from '@/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const telecallerId = searchParams.get('telecallerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '30'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Validate telecallerId
    if (!telecallerId) {
      return NextResponse.json(
        { 
          error: 'telecallerId is required',
          code: 'MISSING_TELECALLER_ID'
        },
        { status: 400 }
      );
    }

    const telecallerIdInt = parseInt(telecallerId);
    if (isNaN(telecallerIdInt)) {
      return NextResponse.json(
        { 
          error: 'telecallerId must be a valid integer',
          code: 'INVALID_TELECALLER_ID'
        },
        { status: 400 }
      );
    }

    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (startDate && !dateRegex.test(startDate)) {
      return NextResponse.json(
        { 
          error: 'startDate must be in YYYY-MM-DD format',
          code: 'INVALID_START_DATE_FORMAT'
        },
        { status: 400 }
      );
    }

    if (endDate && !dateRegex.test(endDate)) {
      return NextResponse.json(
        { 
          error: 'endDate must be in YYYY-MM-DD format',
          code: 'INVALID_END_DATE_FORMAT'
        },
        { status: 400 }
      );
    }

    // Build where conditions
    const conditions = [eq(telecallerCallStats.telecallerId, telecallerIdInt)];

    if (startDate) {
      conditions.push(gte(telecallerCallStats.date, startDate));
    }

    if (endDate) {
      conditions.push(lte(telecallerCallStats.date, endDate));
    }

    const whereCondition = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Fetch individual stats with pagination
    const stats = await db
      .select()
      .from(telecallerCallStats)
      .where(whereCondition)
      .orderBy(desc(telecallerCallStats.date))
      .limit(limit)
      .offset(offset);

    // Calculate aggregated totals
    const aggregationResult = await db
      .select({
        totalCallsMade: sql<number>`COALESCE(SUM(${telecallerCallStats.callsMade}), 0)`,
        totalCallsAnswered: sql<number>`COALESCE(SUM(${telecallerCallStats.callsAnswered}), 0)`,
        totalDurationSeconds: sql<number>`COALESCE(SUM(${telecallerCallStats.totalDurationSeconds}), 0)`,
        totalLeadsContacted: sql<number>`COALESCE(SUM(${telecallerCallStats.leadsContacted}), 0)`,
        totalLeadsConverted: sql<number>`COALESCE(SUM(${telecallerCallStats.leadsConverted}), 0)`,
        recordCount: sql<number>`COUNT(*)`,
      })
      .from(telecallerCallStats)
      .where(whereCondition);

    const aggregation = aggregationResult[0];

    // Calculate totals
    const totals = {
      callsMade: Number(aggregation.totalCallsMade) || 0,
      callsAnswered: Number(aggregation.totalCallsAnswered) || 0,
      totalDurationSeconds: Number(aggregation.totalDurationSeconds) || 0,
      leadsContacted: Number(aggregation.totalLeadsContacted) || 0,
      leadsConverted: Number(aggregation.totalLeadsConverted) || 0,
    };

    // Calculate averages
    const recordCount = Number(aggregation.recordCount) || 0;
    const callsPerDay = recordCount > 0 ? totals.callsMade / recordCount : 0;
    const answerRate = totals.callsMade > 0 ? (totals.callsAnswered / totals.callsMade) * 100 : 0;
    const avgDurationMinutes = totals.callsAnswered > 0 
      ? (totals.totalDurationSeconds / totals.callsAnswered) / 60 
      : 0;
    const conversionRate = totals.leadsContacted > 0 
      ? (totals.leadsConverted / totals.leadsContacted) * 100 
      : 0;

    const averages = {
      callsPerDay: parseFloat(callsPerDay.toFixed(2)),
      answerRate: parseFloat(answerRate.toFixed(2)),
      avgDurationMinutes: parseFloat(avgDurationMinutes.toFixed(2)),
      conversionRate: parseFloat(conversionRate.toFixed(2)),
    };

    return NextResponse.json({
      stats,
      totals,
      averages,
    });

  } catch (error) {
    console.error('GET telecaller stats error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}