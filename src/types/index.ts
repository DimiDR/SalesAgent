// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'team_member';
  createdAt: Date;
  updatedAt: Date;
}

// Project types
export interface Project {
  id: string;
  name: string;
  customer: string;
  customerId?: string; // Verknüpfung zum Kunden
  description?: string;
  deadline?: Date;
  status: 'active' | 'completed' | 'archived';
  currentStep: WorkflowStep;
  createdBy: string;
  teamMembers: string[];
  proposalValue?: number; // Angebotswert in EUR
  createdAt: Date;
  updatedAt: Date;
}

// Workflow types
export type WorkflowStep =
  | 'rfp_received'
  | 'questions_formulated'
  | 'customer_meeting'
  | 'proposal_created'
  | 'proposal_sent';

export interface WorkflowStatus {
  step: WorkflowStep;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string[];
  completedAt?: Date;
  notes?: string;
}

export const WORKFLOW_STEPS: { step: WorkflowStep; label: string; description: string }[] = [
  {
    step: 'rfp_received',
    label: 'RFP Erhalten',
    description: 'Upload und Analyse des RFP-Dokuments'
  },
  {
    step: 'questions_formulated',
    label: 'Fragen Gestellt',
    description: 'Generierung und Klärung offener Punkte mit dem Kunden'
  },
  {
    step: 'customer_meeting',
    label: 'Kundentermin Gehalten',
    description: 'Vorbereitung und Nachbereitung eines Meetings'
  },
  {
    step: 'proposal_created',
    label: 'Angebot Erstellt',
    description: 'Strukturierung und Schreiben des Angebots'
  },
  {
    step: 'proposal_sent',
    label: 'Angebot Angeschickt',
    description: 'Finalisierung und Export'
  }
];

// Document types
export interface Document {
  id: string;
  projectId: string;
  name: string;
  type: 'rfp' | 'template' | 'proposal' | 'questions' | 'answers' | 'notes' | 'other';
  mimeType: string;
  url: string;
  storagePath: string;
  size: number;
  uploadedBy: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

// AI Analysis types
export interface RFPAnalysis {
  id: string;
  projectId: string;
  documentId: string;
  summary: string;
  requirements: string[];
  deadlines: string[];
  budgetHints: string[];
  gaps: string[];
  matchScore: number;
  recommendedResources: ResourceRecommendation[];
  createdAt: Date;
}

export interface ResourceRecommendation {
  type: 'expert' | 'department' | 'tool' | 'template';
  name: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

// Question types
export interface Question {
  id: string;
  projectId: string;
  persona: 'sales' | 'technical' | 'project_management' | 'customer';
  question: string;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  answer?: string;
  status: 'pending' | 'answered';
  createdAt: Date;
  answeredAt?: Date;
}

// Meeting types
export interface Meeting {
  id: string;
  projectId: string;
  date?: Date;
  agenda: AgendaItem[];
  notes?: string;
  insights?: string[];
  actionItems?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AgendaItem {
  id: string;
  title: string;
  description?: string;
  duration?: number; // in minutes
  order: number;
}

// Proposal types
export interface Proposal {
  id: string;
  projectId: string;
  templateId?: string;
  chapters: ProposalChapter[];
  status: 'draft' | 'review' | 'approved' | 'sent';
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalChapter {
  id: string;
  title: string;
  content: string;
  order: number;
  status: 'pending' | 'generated' | 'edited' | 'approved';
  generatedBy?: 'ai' | 'user';
}

// Comment types
export interface Comment {
  id: string;
  projectId: string;
  stepId: WorkflowStep;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
}

// RAG types
export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// Vertex AI RAG types
export interface RAGCorpus {
  name: string;
  displayName: string;
  description?: string;
  projectId: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface RAGDocument {
  name: string;
  displayName: string;
  corpusName: string;
  gcsUri?: string;
  status: 'PENDING' | 'ACTIVE' | 'ERROR';
  createdAt: Date;
  updatedAt?: Date;
}

export interface RAGSearchResult {
  content: string;
  source: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface RAGContext {
  query: string;
  context: string;
  sources: RAGSearchResult[];
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  projectId?: string;
  type: 'task_assigned' | 'step_completed' | 'comment_added' | 'deadline_reminder';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

// Employee types (Ressourcen/Mitarbeiter)
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  department?: string;
  skills: Skill[];
  certifications: Certification[];
  projectExperience: ProjectExperience[];
  availability: 'available' | 'partially_available' | 'unavailable';
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Skill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  dateObtained: Date;
  expiryDate?: Date;
  credentialId?: string;
}

export interface ProjectExperience {
  id: string;
  projectName: string;
  role: string;
  duration: string;
  description?: string;
  technologies?: string[];
}

// Customer types (Kunden)
export interface Customer {
  id: string;
  companyName: string;
  industry?: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone?: string;
  address?: CustomerAddress;
  website?: string;
  notes?: string;
  proposals: CustomerProposal[];
  appointments: CustomerAppointment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface CustomerProposal {
  id: string;
  projectId: string;
  projectName: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  sentAt?: Date;
  value?: number;
}

export interface CustomerAppointment {
  id: string;
  title: string;
  date: Date;
  notes?: string;
  type: 'meeting' | 'call' | 'presentation' | 'other';
}

// Reference types (Referenzen)
export interface Reference {
  id: string;
  customerId: string;
  customerName: string;
  projectTitle: string;
  description: string;
  industry?: string;
  technologies?: string[];
  projectDuration?: string;
  projectValue?: number;
  completionDate?: Date;
  contactPerson?: string;
  testimonial?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}
