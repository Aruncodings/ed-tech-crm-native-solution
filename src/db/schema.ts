import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Users table - System users with different roles
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull(), // 'super_admin', 'admin', 'telecaller', 'counselor', 'auditor'
  phone: text('phone'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  isApproved: integer('is_approved', { mode: 'boolean' }).notNull().default(false),
  authUserId: text('auth_user_id'),
  dailyCallLimit: integer('daily_call_limit').notNull().default(0), // New field: 0 = unlimited
  monthlyCallLimit: integer('monthly_call_limit').notNull().default(0), // New field: 0 = unlimited
  mustChangePassword: integer('must_change_password', { mode: 'boolean' }).notNull().default(true),
  lastPasswordChange: text('last_password_change'),
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

// New courses table with code field
export const coursesNew = sqliteTable('courses_new', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  durationMonths: integer('duration_months'),
  feeAmount: text('fee_amount'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// New leads table with enhanced fields
export const leadsNew = sqliteTable('leads_new', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone').notNull(),
  whatsappNumber: text('whatsapp_number'),
  leadSource: text('lead_source').notNull(),
  leadStage: text('lead_stage').notNull().default('new'),
  leadStatus: text('lead_status').notNull().default('active'),
  courseInterestId: integer('course_interest_id').references(() => coursesNew.id),
  assignedTelecallerId: integer('assigned_telecaller_id').references(() => users.id),
  assignedCounselorId: integer('assigned_counselor_id').references(() => users.id),
  city: text('city'),
  state: text('state'),
  country: text('country'),
  educationLevel: text('education_level'),
  currentOccupation: text('current_occupation'),
  conversionDate: text('conversion_date'),
  lostReason: text('lost_reason'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// New call logs table with enhanced fields
export const callLogsNew = sqliteTable('call_logs_new', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  leadId: integer('lead_id').notNull().references(() => leadsNew.id),
  callerId: integer('caller_id').notNull().references(() => users.id),
  callDate: text('call_date').notNull(),
  callDurationSeconds: integer('call_duration_seconds'),
  callOutcome: text('call_outcome').notNull(),
  nextFollowupDate: text('next_followup_date'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

// New counselor notes table
export const counselorNotesNew = sqliteTable('counselor_notes_new', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  leadId: integer('lead_id').notNull().references(() => leadsNew.id),
  counselorId: integer('counselor_id').notNull().references(() => users.id),
  noteType: text('note_type').notNull(),
  content: text('content').notNull(),
  isImportant: integer('is_important', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// New custom fields table
export const customFieldsNew = sqliteTable('custom_fields_new', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fieldName: text('field_name').notNull(),
  fieldLabel: text('field_label').notNull(),
  fieldType: text('field_type').notNull(),
  entityType: text('entity_type').notNull(),
  isRequired: integer('is_required', { mode: 'boolean' }).notNull().default(false),
  isVisible: integer('is_visible', { mode: 'boolean' }).notNull().default(true),
  displayOrder: integer('display_order').default(0),
  validationRules: text('validation_rules', { mode: 'json' }),
  dropdownOptions: text('dropdown_options', { mode: 'json' }),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// New dropdown master table
export const dropdownMasterNew = sqliteTable('dropdown_master_new', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  category: text('category').notNull(),
  value: text('value').notNull(),
  label: text('label').notNull(),
  displayOrder: integer('display_order').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
});

// New import jobs table
export const importJobsNew = sqliteTable('import_jobs_new', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  importedById: integer('imported_by_id').notNull().references(() => users.id),
  fileName: text('file_name').notNull(),
  totalRecords: integer('total_records').default(0),
  successCount: integer('success_count').default(0),
  errorCount: integer('error_count').default(0),
  status: text('status').notNull().default('pending'),
  errorLog: text('error_log', { mode: 'json' }),
  createdAt: text('created_at').notNull(),
  completedAt: text('completed_at'),
});

// New export jobs table
export const exportJobsNew = sqliteTable('export_jobs_new', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  exportedById: integer('exported_by_id').notNull().references(() => users.id),
  entityType: text('entity_type').notNull(),
  filters: text('filters', { mode: 'json' }),
  fileUrl: text('file_url'),
  status: text('status').notNull().default('pending'),
  createdAt: text('created_at').notNull(),
  completedAt: text('completed_at'),
});

// New table: telecaller_call_stats - Track telecaller call statistics
export const telecallerCallStats = sqliteTable('telecaller_call_stats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  telecallerId: integer('telecaller_id').notNull().references(() => users.id),
  date: text('date').notNull(), // Format: YYYY-MM-DD
  callsMade: integer('calls_made').notNull().default(0),
  callsAnswered: integer('calls_answered').notNull().default(0),
  totalDurationSeconds: integer('total_duration_seconds').notNull().default(0),
  leadsContacted: integer('leads_contacted').notNull().default(0),
  leadsConverted: integer('leads_converted').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});