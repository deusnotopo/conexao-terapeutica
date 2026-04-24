import { z } from 'zod';

export type Profile = z.infer<typeof ProfileSchema>;
export type Dependent = z.infer<typeof DependentSchema>;
export type Expense = z.infer<typeof ExpenseSchema>;
export type Event = z.infer<typeof EventSchema>;
export type Consultation = z.infer<typeof ConsultationSchema>;
export type Result<T, E = string> = import('./result').Result<T, E>;
export type PaginatedResponse<T> = { data: T[]; count: number };
export type Medication = z.infer<typeof MedicationSchema>;
export type MedicationLog = z.infer<typeof MedicationLogSchema>;
export type Vaccine = z.infer<typeof VaccineSchema>;
export type Professional = z.infer<typeof ProfessionalSchema>;
export type Goal = z.infer<typeof GoalSchema>;
export type GoalNote = z.infer<typeof GoalNoteSchema>;
export type TherapyNote = z.infer<typeof TherapyNoteSchema>;
export type SleepLog = z.infer<typeof SleepLogSchema>;
export type CrisisEvent = z.infer<typeof CrisisEventSchema>;
export type MedicalRecord = z.infer<typeof MedicalRecordSchema>;
export type CaregiverWellbeing = z.infer<typeof CaregiverWellbeingSchema>;
export type ParentDiary = z.infer<typeof ParentDiarySchema>;
export type GrowthMeasurement = z.infer<typeof GrowthMeasurementSchema>;


/**
 * Zod Schemas for Data Integrity (Akita Mode)
 * Ensures that IO at the service level is consistent.
 */

// User Profile Schema
export const ProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  phone_number: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

// Dependent Schema
export const DependentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1),
  birth_date: z.string().nullable().optional(),
  diagnosis: z.string().nullable().optional(),
  relationship: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

// Expense Schema
export const ExpenseSchema = z.object({
  id: z.string().uuid(),
  dependent_id: z.string().uuid(),
  category: z.string(),
  amount_cents: z.number().int().nonnegative(),
  date: z.string(),
  description: z.string().nullable().optional(),
  reimbursable: z.boolean().default(false),
  reimbursed: z.boolean().default(false),
  created_at: z.string().optional(),
});

// Event Schema
export const EventSchema = z.object({
  id: z.string().uuid(),
  dependent_id: z.string().uuid(),
  title: z.string().min(1, 'Título é obrigatório'),
  event_type: z.string().default('Outro'),
  description: z.string().nullable().optional(),
  pre_notes: z.string().nullable().optional(),
  start_time: z.string(),
  end_time: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

// Crisis Event Schema
export const CrisisEventSchema = z.object({
  id: z.string().uuid(),
  dependent_id: z.string().uuid(),
  date: z.string(),
  time: z.string().nullable().optional(),
  type: z.string(),
  severity: z.number().min(1).max(5),
  duration_minutes: z.number().nullable().optional(),
  triggers: z.string().nullable().optional(),
  symptoms: z.string().nullable().optional(),
  post_episode: z.string().nullable().optional(),
  medication_given: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

// Growth Measurement Schema
export const GrowthMeasurementSchema = z.object({
  id: z.string().uuid(),
  dependent_id: z.string().uuid(),
  date: z.string(),
  weight_kg: z.number().nullable().optional(),
  height_cm: z.number().nullable().optional(),
  head_cm: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

// Therapy Note Schema
export const TherapyNoteSchema = z.object({
  id: z.string().uuid(),
  dependent_id: z.string().uuid(),
  therapist_id: z.string().uuid(),
  content: z.string(),
  session_date: z.string(),
  progress_rating: z.number().min(1).max(5),
  created_at: z.string().optional(),
  profiles: z
    .object({
      full_name: z.string().nullable().optional(),
    })
    .optional(),
});

// Medication Schema
export const MedicationSchema = z.object({
  id: z.string().uuid(),
  dependent_id: z.string().uuid(),
  name: z.string().min(1),
  dosage: z.string().nullable().optional(),
  frequency_desc: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  stock_count: z.number().nullable().optional(),
  stock_alert_at: z.number().nullable().optional(),
  reminder_times: z.array(z.string()).nullable().optional().default([]),
  created_at: z.string().optional(),
});

// Medication Log Schema
export const MedicationLogSchema = z.object({
  id: z.string().uuid(),
  medication_id: z.string().uuid(),
  scheduled_for: z.string().nullable().optional(),
  taken_at: z.string().nullable().optional(),
  status: z.enum(['taken', 'missed', 'late']).default('taken'),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

// Professional Schema
export const ProfessionalSchema = z.object({
  id: z.string().uuid(),
  dependent_id: z.string().uuid(),
  name: z.string().min(1),
  specialty: z.string(),
  clinic: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  is_primary: z.boolean().default(false),
  created_at: z.string().optional(),
});

// Consultation Schema
export const ConsultationSchema = z.object({
  id: z.string().uuid(),
  dependent_id: z.string().uuid(),
  professional_id: z.string().uuid().nullable().optional(),
  date: z.string(),
  specialty: z.string(),
  physician_name: z.string().nullable().optional(),
  cid_code: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  next_appointment: z.string().nullable().optional(),
  created_at: z.string().optional(),
});


// Therapeutic Goal Schema
export const GoalSchema = z.object({
  id: z.string().uuid(),
  dependent_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  status: z.enum(['pending', 'in_progress', 'achieved', 'abandoned']).default('pending'),
  target_date: z.string().nullable().optional(),
  achieved_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

// Goal Progress Note Schema
export const GoalNoteSchema = z.object({
  id: z.string().uuid(),
  goal_id: z.string().uuid(),
  note: z.string().min(1),
  created_at: z.string().optional(),
});

// Sleep Log Schema
export const SleepLogSchema = z.object({
  id: z.string().uuid(),
  dependent_id: z.string().uuid(),
  date: z.string(),
  sleep_time: z.string().nullable().optional(),
  wake_time: z.string().nullable().optional(),
  duration_hours: z.number().nullable().optional(),
  quality: z.number().min(1).max(5).nullable().optional(),
  awakenings: z.number().int().nonnegative().default(0),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

// Vaccine Schema
export const VaccineSchema = z.object({
  id: z.string().uuid(),
  dependent_id: z.string().uuid(),
  name: z.string().min(1),
  applied_date: z.string().nullable().optional(),
  next_dose_date: z.string().nullable().optional(),
  dose_number: z.number().int().nonnegative().default(1),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

// Caregiver Wellbeing Schema
export const CaregiverWellbeingSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  date: z.string(),
  mood: z.string(),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

// Parent Diary Schema
export const ParentDiarySchema = z.object({
  id: z.string().uuid(),
  dependent_id: z.string().uuid(),
  date: z.string(),
  mood: z.string(),
  content: z.string().min(1),
  created_at: z.string().optional(),
});

// Medical Record Schema
export const MedicalRecordSchema = z.object({
  id: z.string().uuid().optional(),
  dependent_id: z.string().uuid(),
  blood_type: z.string().nullable().optional(),
  health_plan: z.string().nullable().optional(),
  health_plan_number: z.string().nullable().optional(),
  allergies: z.string().nullable().optional(),
  primary_physician_name: z.string().nullable().optional(),
  primary_physician_phone: z.string().nullable().optional(),
  emergency_contact_name: z.string().nullable().optional(),
  emergency_contact_phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  updated_at: z.string().optional(),
});

// Document Schema
export const DocumentSchema = z.object({
  id: z.string().uuid().optional(),
  dependent_id: z.string().uuid(),
  title: z.string().min(1, 'Título é obrigatório'),
  category: z.string().default('Outro'),
  file_path: z.string().min(1, 'Caminho do arquivo é obrigatório'),
  file_type: z.string().nullable().optional(),
  uploaded_by: z.string().uuid().nullable().optional(),
  uploaded_at: z.string().optional(),
});
export type Document = z.infer<typeof DocumentSchema>;
export const DocumentListSchema = z.array(DocumentSchema);


export const GoalListSchema = z.array(GoalSchema);
export const GoalNoteListSchema = z.array(GoalNoteSchema);
export const SleepLogListSchema = z.array(SleepLogSchema);
export const VaccineListSchema = z.array(VaccineSchema);
export const CaregiverWellbeingListSchema = z.array(CaregiverWellbeingSchema);
export const ParentDiaryListSchema = z.array(ParentDiarySchema);
export const MedicalRecordListSchema = z.array(MedicalRecordSchema);

export const TherapyNoteListSchema = z.array(TherapyNoteSchema);

// Collection Schemas
export const ProfileListSchema = z.array(ProfileSchema);
export const DependentListSchema = z.array(DependentSchema);
export const ExpenseListSchema = z.array(ExpenseSchema);
export const EventListSchema = z.array(EventSchema);
export const CrisisEventListSchema = z.array(CrisisEventSchema);
export const GrowthMeasurementListSchema = z.array(GrowthMeasurementSchema);
export const MedicationListSchema = z.array(MedicationSchema);
export const MedicationLogListSchema = z.array(MedicationLogSchema);
export const ProfessionalListSchema = z.array(ProfessionalSchema);
export const ConsultationListSchema = z.array(ConsultationSchema);

// Helper for Paginated Result validation
export const PaginatedExpenseSchema = z.object({
  data: ExpenseListSchema,
  count: z.number().int().nonnegative(),
});

export const PaginatedCrisisSchema = z.object({
  data: CrisisEventListSchema,
  count: z.number().int().nonnegative(),
});

export const PaginatedConsultationSchema = z.object({
  data: ConsultationListSchema,
  count: z.number().int().nonnegative(),
});

export const PaginatedWellbeingSchema = z.object({
  data: CaregiverWellbeingListSchema,
  count: z.number().int().nonnegative(),
});

export const PaginatedDiarySchema = z.object({
  data: ParentDiaryListSchema,
  count: z.number().int().nonnegative(),
});

export const PaginatedSleepLogSchema = z.object({
  data: SleepLogListSchema,
  count: z.number().int().nonnegative(),
});

export const PaginatedGoalSchema = z.object({
  data: GoalListSchema,
  count: z.number().int().nonnegative(),
});

// --- Creation & Update Schemas (Hardening) ---

export const ProfileUpdateSchema = ProfileSchema.partial().omit({ id: true, created_at: true });

export const DependentCreateSchema = DependentSchema.omit({ id: true, created_at: true });
export const DependentUpdateSchema = DependentSchema.partial().omit({ id: true, user_id: true, created_at: true });

export const ExpenseCreateSchema = ExpenseSchema.omit({ id: true, created_at: true });
export const ExpenseUpdateSchema = ExpenseSchema.partial().omit({ id: true, dependent_id: true, created_at: true });

export const EventCreateSchema = EventSchema.omit({ id: true, created_at: true });
export const EventUpdateSchema = EventSchema.partial().omit({ id: true, dependent_id: true, created_at: true });

export const CrisisEventCreateSchema = CrisisEventSchema.omit({ id: true, created_at: true });
export const CrisisEventUpdateSchema = CrisisEventSchema.partial().omit({ id: true, dependent_id: true, created_at: true });

export const MedicationCreateSchema = MedicationSchema.omit({ id: true, created_at: true });
export const MedicationUpdateSchema = MedicationSchema.partial().omit({ id: true, dependent_id: true, created_at: true });

export const ProfessionalCreateSchema = ProfessionalSchema.omit({ id: true, created_at: true });
export const ProfessionalUpdateSchema = ProfessionalSchema.partial().omit({ id: true, dependent_id: true, created_at: true });

export const ConsultationCreateSchema = ConsultationSchema.omit({ id: true, created_at: true });
export const ConsultationUpdateSchema = ConsultationSchema.partial().omit({ id: true, dependent_id: true, created_at: true });

export const GoalCreateSchema = GoalSchema.omit({ id: true, created_at: true });
export const GoalUpdateSchema = GoalSchema.partial().omit({ id: true, dependent_id: true, created_at: true });

export const SleepLogCreateSchema = SleepLogSchema.omit({ id: true, created_at: true });
export const SleepLogUpdateSchema = SleepLogSchema.partial().omit({ id: true, dependent_id: true, created_at: true });

export const VaccineCreateSchema = VaccineSchema.omit({ id: true, created_at: true });
export const VaccineUpdateSchema = VaccineSchema.partial().omit({ id: true, dependent_id: true, created_at: true });

export const GrowthCreateSchema = GrowthMeasurementSchema.omit({ id: true, created_at: true });
export const GrowthUpdateSchema = GrowthMeasurementSchema.partial().omit({ id: true, dependent_id: true, created_at: true });

export const GoalNoteCreateSchema = GoalNoteSchema.omit({ id: true, created_at: true });

export const ParentDiaryCreateSchema = ParentDiarySchema.omit({ id: true, created_at: true });
export const ParentDiaryUpdateSchema = ParentDiarySchema.partial().omit({ id: true, dependent_id: true, created_at: true });

export const WellbeingCreateSchema = CaregiverWellbeingSchema.omit({ id: true, created_at: true });
export const WellbeingUpdateSchema = CaregiverWellbeingSchema.partial().omit({ id: true, user_id: true, created_at: true });

export const DocumentCreateSchema = DocumentSchema.omit({ id: true, uploaded_at: true });

