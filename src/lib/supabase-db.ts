import { getSupabaseBrowserClient } from './supabase';
import type {
  Project,
  Customer,
  CustomerAppointment,
  Employee,
  Reference,
  Document,
  RFPAnalysis,
  Question,
  Meeting,
  Proposal,
  ProjectCalculation,
  Notification,
} from '@/types';

function sb() {
  return getSupabaseBrowserClient();
}

// ─── Helpers ────────────────────────────────────────────────

function parseDate(v: string | null | undefined): Date {
  return v ? new Date(v) : new Date();
}

function parseDateOpt(v: string | null | undefined): Date | undefined {
  return v ? new Date(v) : undefined;
}

// ─── Projects ───────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProject(r: any): Project {
  return {
    id: r.id,
    name: r.name,
    customer: r.customer,
    customerId: r.customer_id ?? undefined,
    description: r.description ?? undefined,
    deadline: parseDateOpt(r.deadline),
    status: r.status,
    currentStep: r.current_step,
    createdBy: r.created_by,
    teamMembers: r.team_members ?? [],
    proposalValue: r.proposal_value ? Number(r.proposal_value) : undefined,
    createdAt: parseDate(r.created_at),
    updatedAt: parseDate(r.updated_at),
  };
}

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await sb()
    .from('SALES_projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapProject);
}

export async function fetchProject(id: string): Promise<Project | null> {
  const { data, error } = await sb()
    .from('SALES_projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProject(data) : null;
}

export async function createProject(p: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  const { data, error } = await sb()
    .from('SALES_projects')
    .insert({
      name: p.name,
      customer: p.customer,
      customer_id: p.customerId ?? null,
      description: p.description ?? null,
      deadline: p.deadline?.toISOString() ?? null,
      status: p.status,
      current_step: p.currentStep,
      created_by: p.createdBy,
      team_members: p.teamMembers,
      proposal_value: p.proposalValue ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapProject(data);
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: Record<string, any> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.customer !== undefined) row.customer = updates.customer;
  if (updates.customerId !== undefined) row.customer_id = updates.customerId ?? null;
  if (updates.description !== undefined) row.description = updates.description ?? null;
  if (updates.deadline !== undefined) row.deadline = updates.deadline?.toISOString() ?? null;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.currentStep !== undefined) row.current_step = updates.currentStep;
  if (updates.createdBy !== undefined) row.created_by = updates.createdBy;
  if (updates.teamMembers !== undefined) row.team_members = updates.teamMembers;
  if (updates.proposalValue !== undefined) row.proposal_value = updates.proposalValue ?? null;

  const { error } = await sb().from('SALES_projects').update(row).eq('id', id);
  if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await sb().from('SALES_projects').delete().eq('id', id);
  if (error) throw error;
}

// ─── Customers ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCustomer(r: any, appointments: CustomerAppointment[] = []): Customer {
  return {
    id: r.id,
    companyName: r.company_name,
    industry: r.industry ?? undefined,
    contactPerson: r.contact_person,
    contactEmail: r.contact_email,
    contactPhone: r.contact_phone ?? undefined,
    address: r.address ?? undefined,
    website: r.website ?? undefined,
    notes: r.notes ?? undefined,
    proposals: [], // computed dynamically from projects
    appointments,
    createdAt: parseDate(r.created_at),
    updatedAt: parseDate(r.updated_at),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAppointment(r: any): CustomerAppointment {
  return {
    id: r.id,
    title: r.title,
    date: parseDate(r.date),
    type: r.type,
    notes: r.notes ?? undefined,
  };
}

export async function fetchCustomers(): Promise<Customer[]> {
  const { data: custRows, error: custErr } = await sb()
    .from('SALES_customers')
    .select('*')
    .order('company_name');
  if (custErr) throw custErr;

  const { data: aptRows, error: aptErr } = await sb()
    .from('SALES_customer_appointments')
    .select('*')
    .order('date', { ascending: false });
  if (aptErr) throw aptErr;

  const aptMap = new Map<string, CustomerAppointment[]>();
  for (const r of aptRows ?? []) {
    const list = aptMap.get(r.customer_id) ?? [];
    list.push(mapAppointment(r));
    aptMap.set(r.customer_id, list);
  }

  return (custRows ?? []).map((r) => mapCustomer(r, aptMap.get(r.id) ?? []));
}

export async function createCustomer(c: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'proposals' | 'appointments'>): Promise<Customer> {
  const { data, error } = await sb()
    .from('SALES_customers')
    .insert({
      company_name: c.companyName,
      industry: c.industry ?? null,
      contact_person: c.contactPerson,
      contact_email: c.contactEmail,
      contact_phone: c.contactPhone ?? null,
      address: c.address ?? null,
      website: c.website ?? null,
      notes: c.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapCustomer(data);
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: Record<string, any> = {};
  if (updates.companyName !== undefined) row.company_name = updates.companyName;
  if (updates.industry !== undefined) row.industry = updates.industry ?? null;
  if (updates.contactPerson !== undefined) row.contact_person = updates.contactPerson;
  if (updates.contactEmail !== undefined) row.contact_email = updates.contactEmail;
  if (updates.contactPhone !== undefined) row.contact_phone = updates.contactPhone ?? null;
  if (updates.address !== undefined) row.address = updates.address ?? null;
  if (updates.website !== undefined) row.website = updates.website ?? null;
  if (updates.notes !== undefined) row.notes = updates.notes ?? null;

  if (Object.keys(row).length > 0) {
    const { error } = await sb().from('SALES_customers').update(row).eq('id', id);
    if (error) throw error;
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await sb().from('SALES_customers').delete().eq('id', id);
  if (error) throw error;
}

// ─── Appointments ───────────────────────────────────────────

export async function fetchAppointments(customerId: string): Promise<CustomerAppointment[]> {
  const { data, error } = await sb()
    .from('SALES_customer_appointments')
    .select('*')
    .eq('customer_id', customerId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapAppointment);
}

export async function createAppointment(customerId: string, a: Omit<CustomerAppointment, 'id'>): Promise<CustomerAppointment> {
  const { data, error } = await sb()
    .from('SALES_customer_appointments')
    .insert({
      customer_id: customerId,
      title: a.title,
      date: a.date instanceof Date ? a.date.toISOString() : a.date,
      type: a.type,
      notes: a.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapAppointment(data);
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await sb().from('SALES_customer_appointments').delete().eq('id', id);
  if (error) throw error;
}

// ─── Employees ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEmployee(r: any): Employee {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    phone: r.phone ?? undefined,
    position: r.position,
    department: r.department ?? undefined,
    skills: r.skills ?? [],
    certifications: (r.certifications ?? []).map((c: Record<string, unknown>) => ({
      ...c,
      dateObtained: c.dateObtained ? new Date(c.dateObtained as string) : new Date(),
      expiryDate: c.expiryDate ? new Date(c.expiryDate as string) : undefined,
    })),
    projectExperience: r.project_experience ?? [],
    availability: r.availability,
    avatarUrl: r.avatar_url ?? undefined,
    createdAt: parseDate(r.created_at),
    updatedAt: parseDate(r.updated_at),
  };
}

export async function fetchEmployees(): Promise<Employee[]> {
  const { data, error } = await sb()
    .from('SALES_employees')
    .select('*')
    .order('last_name');
  if (error) throw error;
  return (data ?? []).map(mapEmployee);
}

export async function createEmployee(e: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
  const { data, error } = await sb()
    .from('SALES_employees')
    .insert({
      first_name: e.firstName,
      last_name: e.lastName,
      email: e.email,
      phone: e.phone ?? null,
      position: e.position,
      department: e.department ?? null,
      skills: e.skills,
      certifications: e.certifications,
      project_experience: e.projectExperience,
      availability: e.availability,
      avatar_url: e.avatarUrl ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapEmployee(data);
}

export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: Record<string, any> = {};
  if (updates.firstName !== undefined) row.first_name = updates.firstName;
  if (updates.lastName !== undefined) row.last_name = updates.lastName;
  if (updates.email !== undefined) row.email = updates.email;
  if (updates.phone !== undefined) row.phone = updates.phone ?? null;
  if (updates.position !== undefined) row.position = updates.position;
  if (updates.department !== undefined) row.department = updates.department ?? null;
  if (updates.skills !== undefined) row.skills = updates.skills;
  if (updates.certifications !== undefined) row.certifications = updates.certifications;
  if (updates.projectExperience !== undefined) row.project_experience = updates.projectExperience;
  if (updates.availability !== undefined) row.availability = updates.availability;
  if (updates.avatarUrl !== undefined) row.avatar_url = updates.avatarUrl ?? null;

  if (Object.keys(row).length > 0) {
    const { error } = await sb().from('SALES_employees').update(row).eq('id', id);
    if (error) throw error;
  }
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await sb().from('SALES_employees').delete().eq('id', id);
  if (error) throw error;
}

// ─── References ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReference(r: any): Reference {
  return {
    id: r.id,
    customerId: r.customer_id,
    customerName: r.customer_name,
    projectTitle: r.project_title,
    description: r.description,
    industry: r.industry ?? undefined,
    technologies: r.technologies ?? undefined,
    projectDuration: r.project_duration ?? undefined,
    projectValue: r.project_value ? Number(r.project_value) : undefined,
    completionDate: parseDateOpt(r.completion_date),
    contactPerson: r.contact_person ?? undefined,
    testimonial: r.testimonial ?? undefined,
    isPublic: r.is_public,
    createdAt: parseDate(r.created_at),
    updatedAt: parseDate(r.updated_at),
  };
}

export async function fetchReferences(): Promise<Reference[]> {
  const { data, error } = await sb()
    .from('SALES_references')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapReference);
}

export async function createReference(ref: Omit<Reference, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reference> {
  const { data, error } = await sb()
    .from('SALES_references')
    .insert({
      customer_id: ref.customerId,
      customer_name: ref.customerName,
      project_title: ref.projectTitle,
      description: ref.description,
      industry: ref.industry ?? null,
      technologies: ref.technologies ?? [],
      project_duration: ref.projectDuration ?? null,
      project_value: ref.projectValue ?? null,
      completion_date: ref.completionDate?.toISOString() ?? null,
      contact_person: ref.contactPerson ?? null,
      testimonial: ref.testimonial ?? null,
      is_public: ref.isPublic,
    })
    .select()
    .single();
  if (error) throw error;
  return mapReference(data);
}

export async function updateReference(id: string, updates: Partial<Reference>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: Record<string, any> = {};
  if (updates.customerId !== undefined) row.customer_id = updates.customerId;
  if (updates.customerName !== undefined) row.customer_name = updates.customerName;
  if (updates.projectTitle !== undefined) row.project_title = updates.projectTitle;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.industry !== undefined) row.industry = updates.industry ?? null;
  if (updates.technologies !== undefined) row.technologies = updates.technologies ?? [];
  if (updates.projectDuration !== undefined) row.project_duration = updates.projectDuration ?? null;
  if (updates.projectValue !== undefined) row.project_value = updates.projectValue ?? null;
  if (updates.completionDate !== undefined) row.completion_date = updates.completionDate?.toISOString() ?? null;
  if (updates.contactPerson !== undefined) row.contact_person = updates.contactPerson ?? null;
  if (updates.testimonial !== undefined) row.testimonial = updates.testimonial ?? null;
  if (updates.isPublic !== undefined) row.is_public = updates.isPublic;

  if (Object.keys(row).length > 0) {
    const { error } = await sb().from('SALES_references').update(row).eq('id', id);
    if (error) throw error;
  }
}

export async function deleteReference(id: string): Promise<void> {
  const { error } = await sb().from('SALES_references').delete().eq('id', id);
  if (error) throw error;
}

// ─── Project Documents ──────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDocument(r: any): Document {
  return {
    id: r.id,
    projectId: r.project_id,
    name: r.name,
    type: r.type,
    mimeType: r.mime_type ?? '',
    url: r.url ?? '',
    storagePath: r.storage_path ?? '',
    size: Number(r.size ?? 0),
    uploadedBy: r.uploaded_by,
    metadata: r.metadata ?? undefined,
    ragDocumentId: r.rag_document_id ?? undefined,
    createdAt: parseDate(r.created_at),
  };
}

export async function fetchProjectDocuments(projectId: string): Promise<Document[]> {
  const { data, error } = await sb()
    .from('SALES_project_documents')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapDocument);
}

export async function createProjectDocument(doc: Omit<Document, 'id' | 'createdAt'>): Promise<Document> {
  const { data, error } = await sb()
    .from('SALES_project_documents')
    .insert({
      project_id: doc.projectId,
      name: doc.name,
      type: doc.type,
      mime_type: doc.mimeType,
      url: doc.url ?? null,
      storage_path: doc.storagePath ?? null,
      size: doc.size,
      uploaded_by: doc.uploadedBy,
      rag_document_id: doc.ragDocumentId ?? null,
      metadata: doc.metadata ?? {},
    })
    .select()
    .single();
  if (error) throw error;
  return mapDocument(data);
}

export async function deleteProjectDocument(id: string): Promise<void> {
  const { error } = await sb().from('SALES_project_documents').delete().eq('id', id);
  if (error) throw error;
}

// ─── Questions ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapQuestion(r: any): Question {
  return {
    id: r.id,
    projectId: r.project_id,
    persona: r.persona,
    question: r.question,
    reasoning: r.reasoning,
    priority: r.priority,
    answer: r.answer ?? undefined,
    status: r.status,
    createdAt: parseDate(r.created_at),
    answeredAt: parseDateOpt(r.answered_at),
  };
}

export async function fetchQuestions(projectId: string): Promise<Question[]> {
  const { data, error } = await sb()
    .from('SALES_questions')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at');
  if (error) throw error;
  return (data ?? []).map(mapQuestion);
}

export async function createQuestionsBatch(questions: Omit<Question, 'id' | 'createdAt'>[]): Promise<Question[]> {
  const rows = questions.map((q) => ({
    project_id: q.projectId,
    persona: q.persona,
    question: q.question,
    reasoning: q.reasoning,
    priority: q.priority,
    answer: q.answer ?? null,
    status: q.status,
    answered_at: q.answeredAt?.toISOString() ?? null,
  }));
  const { data, error } = await sb()
    .from('SALES_questions')
    .insert(rows)
    .select();
  if (error) throw error;
  return (data ?? []).map(mapQuestion);
}

export async function updateQuestion(id: string, updates: Partial<Question>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: Record<string, any> = {};
  if (updates.answer !== undefined) row.answer = updates.answer;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.answeredAt !== undefined) row.answered_at = updates.answeredAt?.toISOString() ?? null;

  if (Object.keys(row).length > 0) {
    const { error } = await sb().from('SALES_questions').update(row).eq('id', id);
    if (error) throw error;
  }
}

// ─── Meetings ───────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMeeting(r: any): Meeting {
  return {
    id: r.id,
    projectId: r.project_id,
    date: parseDateOpt(r.date),
    agenda: r.agenda ?? [],
    notes: r.notes ?? undefined,
    insights: r.insights ?? undefined,
    actionItems: r.action_items ?? undefined,
    createdAt: parseDate(r.created_at),
    updatedAt: parseDate(r.updated_at),
  };
}

export async function fetchMeeting(projectId: string): Promise<Meeting | null> {
  const { data, error } = await sb()
    .from('SALES_meetings')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMeeting(data) : null;
}

export async function upsertMeeting(m: Meeting): Promise<Meeting> {
  const { data, error } = await sb()
    .from('SALES_meetings')
    .upsert({
      id: m.id,
      project_id: m.projectId,
      date: m.date instanceof Date ? m.date.toISOString() : m.date ?? null,
      agenda: m.agenda,
      notes: m.notes ?? null,
      insights: m.insights ?? [],
      action_items: m.actionItems ?? [],
    })
    .select()
    .single();
  if (error) throw error;
  return mapMeeting(data);
}

// ─── Proposals ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProposal(r: any): Proposal {
  return {
    id: r.id,
    projectId: r.project_id,
    templateId: r.template_id ?? undefined,
    chapters: r.chapters ?? [],
    status: r.status,
    version: r.version,
    createdAt: parseDate(r.created_at),
    updatedAt: parseDate(r.updated_at),
  };
}

export async function fetchProposal(projectId: string): Promise<Proposal | null> {
  const { data, error } = await sb()
    .from('SALES_proposals')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProposal(data) : null;
}

export async function upsertProposal(p: Proposal): Promise<Proposal> {
  const { data, error } = await sb()
    .from('SALES_proposals')
    .upsert({
      id: p.id,
      project_id: p.projectId,
      template_id: p.templateId ?? null,
      chapters: p.chapters,
      status: p.status,
      version: p.version,
    })
    .select()
    .single();
  if (error) throw error;
  return mapProposal(data);
}

// ─── Calculations ───────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCalculation(r: any): ProjectCalculation {
  return {
    id: r.id,
    projectId: r.project_id,
    resources: r.resources ?? [],
    projectStart: r.project_start ?? '',
    projectEnd: r.project_end ?? '',
    overheadPercent: Number(r.overhead_percent ?? 0),
    marginPercent: Number(r.margin_percent ?? 0),
    discountPercent: Number(r.discount_percent ?? 0),
    notes: r.notes ?? '',
    createdAt: parseDate(r.created_at),
    updatedAt: parseDate(r.updated_at),
  };
}

export async function fetchCalculation(projectId: string): Promise<ProjectCalculation | null> {
  const { data, error } = await sb()
    .from('SALES_calculations')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapCalculation(data) : null;
}

export async function upsertCalculation(c: ProjectCalculation): Promise<ProjectCalculation> {
  const { data, error } = await sb()
    .from('SALES_calculations')
    .upsert({
      id: c.id,
      project_id: c.projectId,
      resources: c.resources,
      project_start: c.projectStart,
      project_end: c.projectEnd,
      overhead_percent: c.overheadPercent,
      margin_percent: c.marginPercent,
      discount_percent: c.discountPercent,
      notes: c.notes,
    })
    .select()
    .single();
  if (error) throw error;
  return mapCalculation(data);
}

// ─── RFP Analyses ───────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAnalysis(r: any): RFPAnalysis {
  return {
    id: r.id,
    projectId: r.project_id,
    documentId: r.document_id,
    summary: r.summary,
    requirements: r.requirements ?? [],
    deadlines: r.deadlines ?? [],
    budgetHints: r.budget_hints ?? [],
    gaps: r.gaps ?? [],
    matchScore: r.match_score,
    recommendedResources: r.recommended_resources ?? [],
    createdAt: parseDate(r.created_at),
  };
}

export async function fetchAnalysis(projectId: string): Promise<RFPAnalysis | null> {
  const { data, error } = await sb()
    .from('SALES_rfp_analyses')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAnalysis(data) : null;
}

export async function upsertAnalysis(a: RFPAnalysis): Promise<RFPAnalysis> {
  const { data, error } = await sb()
    .from('SALES_rfp_analyses')
    .upsert({
      id: a.id,
      project_id: a.projectId,
      document_id: a.documentId,
      summary: a.summary,
      requirements: a.requirements,
      deadlines: a.deadlines,
      budget_hints: a.budgetHints,
      gaps: a.gaps,
      match_score: a.matchScore,
      recommended_resources: a.recommendedResources,
    })
    .select()
    .single();
  if (error) throw error;
  return mapAnalysis(data);
}

// ─── Notifications ──────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNotification(r: any): Notification {
  return {
    id: r.id,
    projectId: r.project_id ?? undefined,
    type: r.type,
    title: r.title,
    message: r.message,
    read: r.read,
    createdAt: parseDate(r.created_at),
  };
}

export async function fetchNotifications(): Promise<Notification[]> {
  const { data, error } = await sb()
    .from('SALES_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map(mapNotification);
}

export async function createNotification(n: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
  const { data, error } = await sb()
    .from('SALES_notifications')
    .insert({
      project_id: n.projectId ?? null,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
    })
    .select()
    .single();
  if (error) throw error;
  return mapNotification(data);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await sb()
    .from('SALES_notifications')
    .update({ read: true })
    .eq('id', id);
  if (error) throw error;
}
