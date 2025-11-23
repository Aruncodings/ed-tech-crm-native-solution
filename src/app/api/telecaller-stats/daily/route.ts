import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { telecallerCallStats } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const telecallerIdParam = searchParams.get('telecallerId');
    const dateParam = searchParams.get('date');

    // Validate telecallerId
    if (!telecallerIdParam) {
      return NextResponse.json(
        { 
          error: 'Telecaller ID is required',
          code: 'MISSING_TELECALLER_ID'
        },
        { status: 400 }
      );
    }

    const telecallerId = parseInt(telecallerIdParam);
    if (isNaN(telecallerId)) {
      return NextResponse.json(
        { 
          error: 'Valid telecaller ID is required',
          code: 'INVALID_TELECALLER_ID'
        },
        { status: 400 }
      );
    }

    // Handle date parameter - default to today if not provided
    let queryDate: string;
    if (dateParam) {
      // Validate date format YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateParam)) {
        return NextResponse.json(
          { 
            error: 'Invalid date format. Expected YYYY-MM-DD',
            code: 'INVALID_DATE_FORMAT'
          },
          { status: 400 }
        );
      }

      // Additional validation to ensure it's a valid date
      const parsedDate = new Date(dateParam);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { 
            error: 'Invalid date value',
            code: 'INVALID_DATE_VALUE'
          },
          { status: 400 }
        );
      }

      queryDate = dateParam;
    } else {
      // Use today's date in YYYY-MM-DD format
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      queryDate = `${year}-${month}-${day}`;
    }

    // Query for stats with telecallerId and date
    const stats = await db.select()
      .from(telecallerCallStats)
      .where(
        and(
          eq(telecallerCallStats.telecallerId, telecallerId),
          eq(telecallerCallStats.date, queryDate)
        )
      )
      .limit(1);

    // Return 404 if no stats found
    if (stats.length === 0) {
      return NextResponse.json(
        { 
          error: 'No statistics found for this date',
          code: 'STATS_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Return the stats record
    return NextResponse.json(stats[0], { status: 200 });

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