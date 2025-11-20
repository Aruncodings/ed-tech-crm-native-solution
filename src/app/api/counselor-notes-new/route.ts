import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { counselorNotesNew, leadsNew, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const VALID_NOTE_TYPES = ['general', 'demo', 'meeting', 'proposal', 'followup'] as const;
type NoteType = typeof VALID_NOTE_TYPES[number];

function isValidNoteType(value: string): value is NoteType {
  return VALID_NOTE_TYPES.includes(value as NoteType);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const note = await db
        .select()
        .from(counselorNotesNew)
        .where(eq(counselorNotesNew.id, parseInt(id)))
        .limit(1);

      if (note.length === 0) {
        return NextResponse.json(
          { error: 'Counselor note not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(note[0], { status: 200 });
    }

    // List with filtering and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const leadId = searchParams.get('leadId');
    const counselorId = searchParams.get('counselorId');
    const noteType = searchParams.get('noteType');
    const isImportant = searchParams.get('isImportant');

    let query = db.select().from(counselorNotesNew);

    // Build filter conditions
    const conditions = [];

    if (leadId) {
      if (isNaN(parseInt(leadId))) {
        return NextResponse.json(
          { error: 'Valid leadId is required', code: 'INVALID_LEAD_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(counselorNotesNew.leadId, parseInt(leadId)));
    }

    if (counselorId) {
      if (isNaN(parseInt(counselorId))) {
        return NextResponse.json(
          { error: 'Valid counselorId is required', code: 'INVALID_COUNSELOR_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(counselorNotesNew.counselorId, parseInt(counselorId)));
    }

    if (noteType) {
      if (!isValidNoteType(noteType)) {
        return NextResponse.json(
          { 
            error: `Invalid note type. Must be one of: ${VALID_NOTE_TYPES.join(', ')}`,
            code: 'INVALID_NOTE_TYPE' 
          },
          { status: 400 }
        );
      }
      conditions.push(eq(counselorNotesNew.noteType, noteType));
    }

    if (isImportant !== null) {
      const isImportantBool = isImportant === 'true';
      conditions.push(eq(counselorNotesNew.isImportant, isImportantBool));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(counselorNotesNew.createdAt))
      .limit(limit)
      .offset(offset);

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
    const { leadId, counselorId, noteType, content, isImportant } = body;

    // Validate required fields
    if (!leadId) {
      return NextResponse.json(
        { error: 'leadId is required', code: 'MISSING_LEAD_ID' },
        { status: 400 }
      );
    }

    if (!counselorId) {
      return NextResponse.json(
        { error: 'counselorId is required', code: 'MISSING_COUNSELOR_ID' },
        { status: 400 }
      );
    }

    if (!noteType) {
      return NextResponse.json(
        { error: 'noteType is required', code: 'MISSING_NOTE_TYPE' },
        { status: 400 }
      );
    }

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'content is required and cannot be empty', code: 'MISSING_CONTENT' },
        { status: 400 }
      );
    }

    // Validate leadId is a valid integer
    if (isNaN(parseInt(leadId))) {
      return NextResponse.json(
        { error: 'leadId must be a valid integer', code: 'INVALID_LEAD_ID' },
        { status: 400 }
      );
    }

    // Validate counselorId is a valid integer
    if (isNaN(parseInt(counselorId))) {
      return NextResponse.json(
        { error: 'counselorId must be a valid integer', code: 'INVALID_COUNSELOR_ID' },
        { status: 400 }
      );
    }

    // Validate noteType enum
    if (!isValidNoteType(noteType)) {
      return NextResponse.json(
        { 
          error: `Invalid note type. Must be one of: ${VALID_NOTE_TYPES.join(', ')}`,
          code: 'INVALID_NOTE_TYPE' 
        },
        { status: 400 }
      );
    }

    // Validate leadId exists
    const leadExists = await db
      .select()
      .from(leadsNew)
      .where(eq(leadsNew.id, parseInt(leadId)))
      .limit(1);

    if (leadExists.length === 0) {
      return NextResponse.json(
        { error: 'Lead not found', code: 'LEAD_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Validate counselorId exists
    const counselorExists = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(counselorId)))
      .limit(1);

    if (counselorExists.length === 0) {
      return NextResponse.json(
        { error: 'Counselor not found', code: 'COUNSELOR_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Create the counselor note
    const newNote = await db
      .insert(counselorNotesNew)
      .values({
        leadId: parseInt(leadId),
        counselorId: parseInt(counselorId),
        noteType: noteType,
        content: content.trim(),
        isImportant: isImportant ?? false,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newNote[0], { status: 201 });
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { noteType, content, isImportant } = body;

    // Check if note exists
    const existingNote = await db
      .select()
      .from(counselorNotesNew)
      .where(eq(counselorNotesNew.id, parseInt(id)))
      .limit(1);

    if (existingNote.length === 0) {
      return NextResponse.json(
        { error: 'Counselor note not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updates: {
      noteType?: string;
      content?: string;
      isImportant?: boolean;
    } = {};

    // Validate and add noteType if provided
    if (noteType !== undefined) {
      if (!isValidNoteType(noteType)) {
        return NextResponse.json(
          { 
            error: `Invalid note type. Must be one of: ${VALID_NOTE_TYPES.join(', ')}`,
            code: 'INVALID_NOTE_TYPE' 
          },
          { status: 400 }
        );
      }
      updates.noteType = noteType;
    }

    // Validate and add content if provided
    if (content !== undefined) {
      if (content.trim() === '') {
        return NextResponse.json(
          { error: 'content cannot be empty', code: 'EMPTY_CONTENT' },
          { status: 400 }
        );
      }
      updates.content = content.trim();
    }

    // Add isImportant if provided
    if (isImportant !== undefined) {
      updates.isImportant = Boolean(isImportant);
    }

    // If no fields to update
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existingNote[0], { status: 200 });
    }

    // Update the note
    const updatedNote = await db
      .update(counselorNotesNew)
      .set(updates)
      .where(eq(counselorNotesNew.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedNote[0], { status: 200 });
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if note exists
    const existingNote = await db
      .select()
      .from(counselorNotesNew)
      .where(eq(counselorNotesNew.id, parseInt(id)))
      .limit(1);

    if (existingNote.length === 0) {
      return NextResponse.json(
        { error: 'Counselor note not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the note
    const deletedNote = await db
      .delete(counselorNotesNew)
      .where(eq(counselorNotesNew.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Counselor note deleted successfully',
        deletedNote: deletedNote[0],
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