import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leadsNew } from '@/db/schema';
import { eq, like, or, and } from 'drizzle-orm';

const VALID_LEAD_SOURCES = ['website', 'referral', 'social_media', 'advertisement', 'walk_in', 'other'];
const VALID_LEAD_STAGES = ['new', 'contacted', 'qualified', 'demo_scheduled', 'proposal_sent', 'negotiation', 'converted', 'lost'];
const VALID_LEAD_STATUSES = ['active', 'inactive', 'junk'];

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const lead = await db.select()
        .from(leadsNew)
        .where(eq(leadsNew.id, parseInt(id)))
        .limit(1);

      if (lead.length === 0) {
        return NextResponse.json({ 
          error: 'Lead not found',
          code: 'LEAD_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(lead[0], { status: 200 });
    }

    // List with filtering and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const leadStage = searchParams.get('leadStage');
    const leadStatus = searchParams.get('leadStatus');
    const leadSource = searchParams.get('leadSource');
    const assignedTelecallerId = searchParams.get('assignedTelecallerId');
    const assignedCounselorId = searchParams.get('assignedCounselorId');

    let query = db.select().from(leadsNew);
    const conditions = [];

    // Search filter
    if (search) {
      conditions.push(
        or(
          like(leadsNew.name, `%${search}%`),
          like(leadsNew.email, `%${search}%`),
          like(leadsNew.phone, `%${search}%`)
        )
      );
    }

    // Lead stage filter
    if (leadStage) {
      conditions.push(eq(leadsNew.leadStage, leadStage));
    }

    // Lead status filter
    if (leadStatus) {
      conditions.push(eq(leadsNew.leadStatus, leadStatus));
    }

    // Lead source filter
    if (leadSource) {
      conditions.push(eq(leadsNew.leadSource, leadSource));
    }

    // Assigned telecaller filter
    if (assignedTelecallerId) {
      conditions.push(eq(leadsNew.assignedTelecallerId, parseInt(assignedTelecallerId)));
    }

    // Assigned counselor filter
    if (assignedCounselorId) {
      conditions.push(eq(leadsNew.assignedCounselorId, parseInt(assignedCounselorId)));
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
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
    const {
      name,
      email,
      phone,
      whatsappNumber,
      leadSource,
      leadStage,
      leadStatus,
      courseInterestId,
      assignedTelecallerId,
      assignedCounselorId,
      city,
      state,
      country,
      educationLevel,
      currentOccupation,
      notes
    } = body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json({ 
        error: "Name is required",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    if (!phone || phone.trim() === '') {
      return NextResponse.json({ 
        error: "Phone is required",
        code: "MISSING_PHONE" 
      }, { status: 400 });
    }

    if (!leadSource || leadSource.trim() === '') {
      return NextResponse.json({ 
        error: "Lead source is required",
        code: "MISSING_LEAD_SOURCE" 
      }, { status: 400 });
    }

    // Validate enum values
    if (!VALID_LEAD_SOURCES.includes(leadSource)) {
      return NextResponse.json({ 
        error: `Invalid lead source. Must be one of: ${VALID_LEAD_SOURCES.join(', ')}`,
        code: "INVALID_LEAD_SOURCE" 
      }, { status: 400 });
    }

    if (leadStage && !VALID_LEAD_STAGES.includes(leadStage)) {
      return NextResponse.json({ 
        error: `Invalid lead stage. Must be one of: ${VALID_LEAD_STAGES.join(', ')}`,
        code: "INVALID_LEAD_STAGE" 
      }, { status: 400 });
    }

    if (leadStatus && !VALID_LEAD_STATUSES.includes(leadStatus)) {
      return NextResponse.json({ 
        error: `Invalid lead status. Must be one of: ${VALID_LEAD_STATUSES.join(', ')}`,
        code: "INVALID_LEAD_STATUS" 
      }, { status: 400 });
    }

    // Validate email format if provided
    if (email && email.trim() !== '' && !validateEmail(email.trim())) {
      return NextResponse.json({ 
        error: "Invalid email format",
        code: "INVALID_EMAIL" 
      }, { status: 400 });
    }

    // Prepare insert data
    const insertData: any = {
      name: name.trim(),
      phone: phone.trim(),
      leadSource: leadSource.trim(),
      leadStage: leadStage?.trim() || 'new',
      leadStatus: leadStatus?.trim() || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add optional fields if provided
    if (email && email.trim() !== '') {
      insertData.email = email.trim().toLowerCase();
    }

    if (whatsappNumber && whatsappNumber.trim() !== '') {
      insertData.whatsappNumber = whatsappNumber.trim();
    }

    if (courseInterestId) {
      insertData.courseInterestId = parseInt(courseInterestId);
    }

    if (assignedTelecallerId) {
      insertData.assignedTelecallerId = parseInt(assignedTelecallerId);
    }

    if (assignedCounselorId) {
      insertData.assignedCounselorId = parseInt(assignedCounselorId);
    }

    if (city && city.trim() !== '') {
      insertData.city = city.trim();
    }

    if (state && state.trim() !== '') {
      insertData.state = state.trim();
    }

    if (country && country.trim() !== '') {
      insertData.country = country.trim();
    }

    if (educationLevel && educationLevel.trim() !== '') {
      insertData.educationLevel = educationLevel.trim();
    }

    if (currentOccupation && currentOccupation.trim() !== '') {
      insertData.currentOccupation = currentOccupation.trim();
    }

    if (notes && notes.trim() !== '') {
      insertData.notes = notes.trim();
    }

    const newLead = await db.insert(leadsNew)
      .values(insertData)
      .returning();

    return NextResponse.json(newLead[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      whatsappNumber,
      leadSource,
      leadStage,
      leadStatus,
      courseInterestId,
      assignedTelecallerId,
      assignedCounselorId,
      city,
      state,
      country,
      educationLevel,
      currentOccupation,
      conversionDate,
      lostReason,
      notes
    } = body;

    // Check if lead exists
    const existingLead = await db.select()
      .from(leadsNew)
      .where(eq(leadsNew.id, parseInt(id)))
      .limit(1);

    if (existingLead.length === 0) {
      return NextResponse.json({ 
        error: 'Lead not found',
        code: 'LEAD_NOT_FOUND' 
      }, { status: 404 });
    }

    // Validate enum values if provided
    if (leadSource && !VALID_LEAD_SOURCES.includes(leadSource)) {
      return NextResponse.json({ 
        error: `Invalid lead source. Must be one of: ${VALID_LEAD_SOURCES.join(', ')}`,
        code: "INVALID_LEAD_SOURCE" 
      }, { status: 400 });
    }

    if (leadStage && !VALID_LEAD_STAGES.includes(leadStage)) {
      return NextResponse.json({ 
        error: `Invalid lead stage. Must be one of: ${VALID_LEAD_STAGES.join(', ')}`,
        code: "INVALID_LEAD_STAGE" 
      }, { status: 400 });
    }

    if (leadStatus && !VALID_LEAD_STATUSES.includes(leadStatus)) {
      return NextResponse.json({ 
        error: `Invalid lead status. Must be one of: ${VALID_LEAD_STATUSES.join(', ')}`,
        code: "INVALID_LEAD_STATUS" 
      }, { status: 400 });
    }

    // Validate email format if provided
    if (email !== undefined && email !== null && email.trim() !== '' && !validateEmail(email.trim())) {
      return NextResponse.json({ 
        error: "Invalid email format",
        code: "INVALID_EMAIL" 
      }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    // Add fields to update if provided
    if (name !== undefined) {
      if (name.trim() === '') {
        return NextResponse.json({ 
          error: "Name cannot be empty",
          code: "INVALID_NAME" 
        }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      updateData.email = email && email.trim() !== '' ? email.trim().toLowerCase() : null;
    }

    if (phone !== undefined) {
      if (phone.trim() === '') {
        return NextResponse.json({ 
          error: "Phone cannot be empty",
          code: "INVALID_PHONE" 
        }, { status: 400 });
      }
      updateData.phone = phone.trim();
    }

    if (whatsappNumber !== undefined) {
      updateData.whatsappNumber = whatsappNumber && whatsappNumber.trim() !== '' ? whatsappNumber.trim() : null;
    }

    if (leadSource !== undefined) {
      updateData.leadSource = leadSource.trim();
    }

    if (leadStage !== undefined) {
      updateData.leadStage = leadStage.trim();
      
      // Auto-set conversionDate if leadStage changes to 'converted'
      if (leadStage.trim() === 'converted' && !conversionDate) {
        updateData.conversionDate = new Date().toISOString();
      }
    }

    if (leadStatus !== undefined) {
      updateData.leadStatus = leadStatus.trim();
    }

    if (courseInterestId !== undefined) {
      updateData.courseInterestId = courseInterestId ? parseInt(courseInterestId) : null;
    }

    if (assignedTelecallerId !== undefined) {
      updateData.assignedTelecallerId = assignedTelecallerId ? parseInt(assignedTelecallerId) : null;
    }

    if (assignedCounselorId !== undefined) {
      updateData.assignedCounselorId = assignedCounselorId ? parseInt(assignedCounselorId) : null;
    }

    if (city !== undefined) {
      updateData.city = city && city.trim() !== '' ? city.trim() : null;
    }

    if (state !== undefined) {
      updateData.state = state && state.trim() !== '' ? state.trim() : null;
    }

    if (country !== undefined) {
      updateData.country = country && country.trim() !== '' ? country.trim() : null;
    }

    if (educationLevel !== undefined) {
      updateData.educationLevel = educationLevel && educationLevel.trim() !== '' ? educationLevel.trim() : null;
    }

    if (currentOccupation !== undefined) {
      updateData.currentOccupation = currentOccupation && currentOccupation.trim() !== '' ? currentOccupation.trim() : null;
    }

    if (conversionDate !== undefined) {
      updateData.conversionDate = conversionDate && conversionDate.trim() !== '' ? conversionDate.trim() : null;
    }

    if (lostReason !== undefined) {
      updateData.lostReason = lostReason && lostReason.trim() !== '' ? lostReason.trim() : null;
    }

    if (notes !== undefined) {
      updateData.notes = notes && notes.trim() !== '' ? notes.trim() : null;
    }

    const updatedLead = await db.update(leadsNew)
      .set(updateData)
      .where(eq(leadsNew.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedLead[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if lead exists
    const existingLead = await db.select()
      .from(leadsNew)
      .where(eq(leadsNew.id, parseInt(id)))
      .limit(1);

    if (existingLead.length === 0) {
      return NextResponse.json({ 
        error: 'Lead not found',
        code: 'LEAD_NOT_FOUND' 
      }, { status: 404 });
    }

    const deletedLead = await db.delete(leadsNew)
      .where(eq(leadsNew.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Lead deleted successfully',
      lead: deletedLead[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}