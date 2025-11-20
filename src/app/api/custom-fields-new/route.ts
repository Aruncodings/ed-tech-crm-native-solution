import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customFieldsNew } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

const VALID_FIELD_TYPES = ['text', 'number', 'date', 'dropdown', 'checkbox', 'textarea'];
const VALID_ENTITY_TYPES = ['lead', 'call_log'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const customField = await db.select()
        .from(customFieldsNew)
        .where(eq(customFieldsNew.id, parseInt(id)))
        .limit(1);

      if (customField.length === 0) {
        return NextResponse.json({ 
          error: 'Custom field not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(customField[0], { status: 200 });
    }

    // List with filtering and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const entityType = searchParams.get('entityType');
    const fieldType = searchParams.get('fieldType');
    const isVisible = searchParams.get('isVisible');

    let query = db.select().from(customFieldsNew);

    // Build filter conditions
    const conditions = [];

    if (entityType) {
      if (!VALID_ENTITY_TYPES.includes(entityType)) {
        return NextResponse.json({ 
          error: `Invalid entityType. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`,
          code: 'INVALID_ENTITY_TYPE' 
        }, { status: 400 });
      }
      conditions.push(eq(customFieldsNew.entityType, entityType));
    }

    if (fieldType) {
      if (!VALID_FIELD_TYPES.includes(fieldType)) {
        return NextResponse.json({ 
          error: `Invalid fieldType. Must be one of: ${VALID_FIELD_TYPES.join(', ')}`,
          code: 'INVALID_FIELD_TYPE' 
        }, { status: 400 });
      }
      conditions.push(eq(customFieldsNew.fieldType, fieldType));
    }

    if (isVisible !== null && isVisible !== undefined) {
      const visibleValue = isVisible === 'true' ? 1 : 0;
      conditions.push(eq(customFieldsNew.isVisible, visibleValue));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(asc(customFieldsNew.displayOrder))
      .limit(limit)
      .offset(offset);

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
      fieldName, 
      fieldLabel, 
      fieldType, 
      entityType,
      isRequired,
      isVisible,
      displayOrder,
      validationRules,
      dropdownOptions
    } = body;

    // Validate required fields
    if (!fieldName || fieldName.trim() === '') {
      return NextResponse.json({ 
        error: "fieldName is required and cannot be empty",
        code: "MISSING_FIELD_NAME" 
      }, { status: 400 });
    }

    if (!fieldLabel || fieldLabel.trim() === '') {
      return NextResponse.json({ 
        error: "fieldLabel is required and cannot be empty",
        code: "MISSING_FIELD_LABEL" 
      }, { status: 400 });
    }

    if (!fieldType || fieldType.trim() === '') {
      return NextResponse.json({ 
        error: "fieldType is required",
        code: "MISSING_FIELD_TYPE" 
      }, { status: 400 });
    }

    if (!VALID_FIELD_TYPES.includes(fieldType)) {
      return NextResponse.json({ 
        error: `Invalid fieldType. Must be one of: ${VALID_FIELD_TYPES.join(', ')}`,
        code: "INVALID_FIELD_TYPE" 
      }, { status: 400 });
    }

    if (!entityType || entityType.trim() === '') {
      return NextResponse.json({ 
        error: "entityType is required",
        code: "MISSING_ENTITY_TYPE" 
      }, { status: 400 });
    }

    if (!VALID_ENTITY_TYPES.includes(entityType)) {
      return NextResponse.json({ 
        error: `Invalid entityType. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`,
        code: "INVALID_ENTITY_TYPE" 
      }, { status: 400 });
    }

    // Validate JSON fields if provided
    if (validationRules !== undefined && validationRules !== null) {
      try {
        if (typeof validationRules === 'string') {
          JSON.parse(validationRules);
        } else if (typeof validationRules !== 'object') {
          throw new Error('Invalid JSON');
        }
      } catch (e) {
        return NextResponse.json({ 
          error: "validationRules must be valid JSON",
          code: "INVALID_VALIDATION_RULES" 
        }, { status: 400 });
      }
    }

    if (dropdownOptions !== undefined && dropdownOptions !== null) {
      try {
        if (typeof dropdownOptions === 'string') {
          const parsed = JSON.parse(dropdownOptions);
          if (!Array.isArray(parsed)) {
            throw new Error('Must be array');
          }
        } else if (!Array.isArray(dropdownOptions)) {
          throw new Error('Must be array');
        }
      } catch (e) {
        return NextResponse.json({ 
          error: "dropdownOptions must be a valid JSON array",
          code: "INVALID_DROPDOWN_OPTIONS" 
        }, { status: 400 });
      }
    }

    const now = new Date().toISOString();

    const newCustomField = await db.insert(customFieldsNew)
      .values({
        fieldName: fieldName.trim(),
        fieldLabel: fieldLabel.trim(),
        fieldType: fieldType,
        entityType: entityType,
        isRequired: isRequired !== undefined ? (isRequired ? 1 : 0) : 0,
        isVisible: isVisible !== undefined ? (isVisible ? 1 : 0) : 1,
        displayOrder: displayOrder !== undefined ? displayOrder : 0,
        validationRules: validationRules !== undefined ? validationRules : null,
        dropdownOptions: dropdownOptions !== undefined ? dropdownOptions : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newCustomField[0], { status: 201 });

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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { 
      fieldName, 
      fieldLabel, 
      fieldType, 
      entityType,
      isRequired,
      isVisible,
      displayOrder,
      validationRules,
      dropdownOptions
    } = body;

    // Check if record exists
    const existingRecord = await db.select()
      .from(customFieldsNew)
      .where(eq(customFieldsNew.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ 
        error: 'Custom field not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Validate enum fields if provided
    if (fieldType && !VALID_FIELD_TYPES.includes(fieldType)) {
      return NextResponse.json({ 
        error: `Invalid fieldType. Must be one of: ${VALID_FIELD_TYPES.join(', ')}`,
        code: "INVALID_FIELD_TYPE" 
      }, { status: 400 });
    }

    if (entityType && !VALID_ENTITY_TYPES.includes(entityType)) {
      return NextResponse.json({ 
        error: `Invalid entityType. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`,
        code: "INVALID_ENTITY_TYPE" 
      }, { status: 400 });
    }

    // Validate required fields if provided
    if (fieldName !== undefined && (fieldName === null || fieldName.trim() === '')) {
      return NextResponse.json({ 
        error: "fieldName cannot be empty",
        code: "INVALID_FIELD_NAME" 
      }, { status: 400 });
    }

    if (fieldLabel !== undefined && (fieldLabel === null || fieldLabel.trim() === '')) {
      return NextResponse.json({ 
        error: "fieldLabel cannot be empty",
        code: "INVALID_FIELD_LABEL" 
      }, { status: 400 });
    }

    // Validate JSON fields if provided
    if (validationRules !== undefined && validationRules !== null) {
      try {
        if (typeof validationRules === 'string') {
          JSON.parse(validationRules);
        } else if (typeof validationRules !== 'object') {
          throw new Error('Invalid JSON');
        }
      } catch (e) {
        return NextResponse.json({ 
          error: "validationRules must be valid JSON",
          code: "INVALID_VALIDATION_RULES" 
        }, { status: 400 });
      }
    }

    if (dropdownOptions !== undefined && dropdownOptions !== null) {
      try {
        if (typeof dropdownOptions === 'string') {
          const parsed = JSON.parse(dropdownOptions);
          if (!Array.isArray(parsed)) {
            throw new Error('Must be array');
          }
        } else if (!Array.isArray(dropdownOptions)) {
          throw new Error('Must be array');
        }
      } catch (e) {
        return NextResponse.json({ 
          error: "dropdownOptions must be a valid JSON array",
          code: "INVALID_DROPDOWN_OPTIONS" 
        }, { status: 400 });
      }
    }

    // Build update object with only provided fields
    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (fieldName !== undefined) updates.fieldName = fieldName.trim();
    if (fieldLabel !== undefined) updates.fieldLabel = fieldLabel.trim();
    if (fieldType !== undefined) updates.fieldType = fieldType;
    if (entityType !== undefined) updates.entityType = entityType;
    if (isRequired !== undefined) updates.isRequired = isRequired ? 1 : 0;
    if (isVisible !== undefined) updates.isVisible = isVisible ? 1 : 0;
    if (displayOrder !== undefined) updates.displayOrder = displayOrder;
    if (validationRules !== undefined) updates.validationRules = validationRules;
    if (dropdownOptions !== undefined) updates.dropdownOptions = dropdownOptions;

    const updatedCustomField = await db.update(customFieldsNew)
      .set(updates)
      .where(eq(customFieldsNew.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedCustomField[0], { status: 200 });

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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists
    const existingRecord = await db.select()
      .from(customFieldsNew)
      .where(eq(customFieldsNew.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ 
        error: 'Custom field not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const deletedCustomField = await db.delete(customFieldsNew)
      .where(eq(customFieldsNew.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Custom field deleted successfully',
      deletedCustomField: deletedCustomField[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}