import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Users table - System users with different roles
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull(), // 'super_admin', 'admin', 'telecaller', 'counselor', 'auditor'
  phone: text('phone'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Leads table - Core lead management
export const leads = sqliteTable('leads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone').notNull(),
  courseInterest: text('course_interest'),
  leadSource: text('lead_source').notNull(), // 'website', 'referral', 'social_media', 'advertisement', 'other'
  leadStatus: text('lead_status').notNull().default('new'), // 'new', 'contacted', 'qualified', 'converted', 'lost'
  assignedTo: integer('assigned_to').references(() => users.id),
  leadScore: integer('lead_score').default(0), // 0-100
  nextFollowupDate: text('next_followup_date'),
  lastContactDate: text('last_contact_date'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Call logs table - Track all interactions
export const callLogs = sqliteTable('call_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  leadId: integer('lead_id').notNull().references(() => leads.id),
  callerId: integer('caller_id').notNull().references(() => users.id),
  callType: text('call_type').notNull(), // 'outbound', 'inbound'
  callStatus: text('call_status').notNull(), // 'answered', 'no_answer', 'busy', 'invalid', 'callback'
  callDuration: integer('call_duration'), // in seconds
  notes: text('notes'),
  nextFollowupDate: text('next_followup_date'),
  createdAt: text('created_at').notNull(),
});

// Courses table - Available courses
export const courses = sqliteTable('courses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  price: text('price'), // stored as text for decimal precision
  duration: text('duration'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Custom fields table - Dynamic field management
export const customFields = sqliteTable('custom_fields', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fieldName: text('field_name').notNull(),
  fieldType: text('field_type').notNull(), // 'text', 'number', 'date', 'dropdown', 'textarea', 'checkbox'
  fieldLabel: text('field_label').notNull(),
  isRequired: integer('is_required', { mode: 'boolean' }).notNull().default(false),
  isVisible: integer('is_visible', { mode: 'boolean' }).notNull().default(true),
  dropdownOptions: text('dropdown_options', { mode: 'json' }),
  displayOrder: integer('display_order').default(0),
  appliesTo: text('applies_to').notNull(), // 'lead', 'call_log', 'course'
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Schema versions table - Track schema changes
export const schemaVersions = sqliteTable('schema_versions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  versionNumber: integer('version_number').notNull(),
  changesDescription: text('changes_description'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: text('created_at').notNull(),
});

// Dropdown master table - Centralized dropdown values
export const dropdownMaster = sqliteTable('dropdown_master', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dropdownName: text('dropdown_name').notNull(),
  dropdownValues: text('dropdown_values', { mode: 'json' }).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Import jobs table - Track bulk imports
export const importJobs = sqliteTable('import_jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  uploadedBy: integer('uploaded_by').references(() => users.id),
  fileName: text('file_name'),
  totalRecords: integer('total_records').default(0),
  successfulImports: integer('successful_imports').default(0),
  failedImports: integer('failed_imports').default(0),
  status: text('status').notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed'
  errorLog: text('error_log', { mode: 'json' }),
  createdAt: text('created_at').notNull(),
});

// Export jobs table - Track data exports
export const exportJobs = sqliteTable('export_jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  requestedBy: integer('requested_by').references(() => users.id),
  exportType: text('export_type').notNull(), // 'leads', 'call_logs', 'reports'
  filters: text('filters', { mode: 'json' }),
  filePath: text('file_path'),
  status: text('status').notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed'
  createdAt: text('created_at').notNull(),
});

// Counselor notes table - Detailed counselor interactions
export const counselorNotes = sqliteTable('counselor_notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  leadId: integer('lead_id').notNull().references(() => leads.id),
  counselorId: integer('counselor_id').notNull().references(() => users.id),
  noteType: text('note_type').notNull(), // 'general', 'meeting', 'demo', 'followup'
  notes: text('notes').notNull(),
  isImportant: integer('is_important', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});