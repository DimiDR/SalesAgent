import { create } from 'zustand';
import type { Project, Document, RFPAnalysis, Question, Meeting, Proposal, Notification, Employee, Customer, Reference, ProjectCalculation, CalculationResource, CustomerAppointment } from '@/types';
import * as db from '@/lib/supabase-db';

interface AppState {
  // Projects state
  projects: Project[];
  projectsLoaded: boolean;
  currentProject: Project | null;
  loadProjects: () => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  addProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;

  // Documents state
  documents: Document[];
  setDocuments: (documents: Document[]) => void;
  addDocument: (doc: Omit<Document, 'id' | 'createdAt'>) => Promise<Document>;
  loadProjectDocuments: (projectId: string) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;

  // Analysis state
  currentAnalysis: RFPAnalysis | null;
  setCurrentAnalysis: (analysis: RFPAnalysis | null) => void;
  saveAnalysis: (analysis: RFPAnalysis) => Promise<void>;
  loadAnalysis: (projectId: string) => Promise<void>;

  // Questions state
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
  addQuestions: (questions: Omit<Question, 'id' | 'createdAt'>[]) => Promise<void>;
  updateQuestion: (id: string, updates: Partial<Question>) => Promise<void>;
  loadQuestions: (projectId: string) => Promise<void>;

  // Meeting state
  currentMeeting: Meeting | null;
  setCurrentMeeting: (meeting: Meeting | null) => void;
  saveMeeting: (meeting: Meeting) => Promise<void>;
  loadMeeting: (projectId: string) => Promise<void>;

  // Calculation state
  currentCalculation: ProjectCalculation | null;
  setCurrentCalculation: (calculation: ProjectCalculation | null) => void;
  saveCalculation: (calculation: ProjectCalculation) => Promise<void>;
  loadCalculation: (projectId: string) => Promise<void>;
  updateCalculationResource: (resourceId: string, updates: Partial<CalculationResource>) => void;
  removeCalculationResource: (resourceId: string) => void;

  // Proposal state
  currentProposal: Proposal | null;
  setCurrentProposal: (proposal: Proposal | null) => void;
  saveProposal: (proposal: Proposal) => Promise<void>;
  loadProposal: (projectId: string) => Promise<void>;
  updateProposalChapter: (chapterId: string, content: string) => void;

  // Notifications
  notifications: Notification[];
  notificationsLoaded: boolean;
  loadNotifications: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;

  // Employees state
  employees: Employee[];
  employeesLoaded: boolean;
  loadEmployees: () => Promise<void>;
  addEmployee: (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Employee>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  removeEmployee: (id: string) => Promise<void>;

  // Customers state
  customers: Customer[];
  customersLoaded: boolean;
  loadCustomers: () => Promise<void>;
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'proposals' | 'appointments'>) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  removeCustomer: (id: string) => Promise<void>;
  addAppointment: (customerId: string, appointment: Omit<CustomerAppointment, 'id'>) => Promise<void>;
  deleteAppointment: (customerId: string, appointmentId: string) => Promise<void>;

  // References state
  references: Reference[];
  referencesLoaded: boolean;
  loadReferences: () => Promise<void>;
  addReference: (data: Omit<Reference, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Reference>;
  updateReference: (id: string, updates: Partial<Reference>) => Promise<void>;
  removeReference: (id: string) => Promise<void>;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  aiProcessing: boolean;
  setAiProcessing: (processing: boolean) => void;
}

export const useStore = create<AppState>()((set, get) => ({
  // ─── Projects ─────────────────────────────────────────
  projects: [],
  projectsLoaded: false,
  currentProject: null,
  loadProjects: async () => {
    if (get().projectsLoaded) return;
    set({ isLoading: true });
    try {
      const projects = await db.fetchProjects();
      set({ projects, projectsLoaded: true });
    } finally {
      set({ isLoading: false });
    }
  },
  setCurrentProject: (currentProject) => set({ currentProject }),
  addProject: async (data) => {
    const project = await db.createProject(data);
    set((state) => ({ projects: [...state.projects, project] }));
    return project;
  },
  updateProject: async (id, updates) => {
    await db.updateProject(id, updates);
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      ),
      currentProject:
        state.currentProject?.id === id
          ? { ...state.currentProject, ...updates, updatedAt: new Date() }
          : state.currentProject,
    }));
  },

  // ─── Documents ────────────────────────────────────────
  documents: [],
  setDocuments: (documents) => set({ documents }),
  addDocument: async (doc) => {
    const created = await db.createProjectDocument(doc);
    set((state) => ({ documents: [...state.documents, created] }));
    return created;
  },
  loadProjectDocuments: async (projectId) => {
    const docs = await db.fetchProjectDocuments(projectId);
    set({ documents: docs });
  },
  removeDocument: async (id) => {
    await db.deleteProjectDocument(id);
    set((state) => ({ documents: state.documents.filter((d) => d.id !== id) }));
  },

  // ─── Analysis ─────────────────────────────────────────
  currentAnalysis: null,
  setCurrentAnalysis: (currentAnalysis) => set({ currentAnalysis }),
  saveAnalysis: async (analysis) => {
    const saved = await db.upsertAnalysis(analysis);
    set({ currentAnalysis: saved });
  },
  loadAnalysis: async (projectId) => {
    const analysis = await db.fetchAnalysis(projectId);
    set({ currentAnalysis: analysis });
  },

  // ─── Questions ────────────────────────────────────────
  questions: [],
  setQuestions: (questions) => set({ questions }),
  addQuestions: async (questions) => {
    const created = await db.createQuestionsBatch(questions);
    set((state) => ({ questions: [...state.questions, ...created] }));
  },
  updateQuestion: async (id, updates) => {
    await db.updateQuestion(id, updates);
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === id ? { ...q, ...updates } : q
      ),
    }));
  },
  loadQuestions: async (projectId) => {
    const questions = await db.fetchQuestions(projectId);
    set({ questions });
  },

  // ─── Meeting ──────────────────────────────────────────
  currentMeeting: null,
  setCurrentMeeting: (currentMeeting) => set({ currentMeeting }),
  saveMeeting: async (meeting) => {
    const saved = await db.upsertMeeting(meeting);
    set({ currentMeeting: saved });
  },
  loadMeeting: async (projectId) => {
    const meeting = await db.fetchMeeting(projectId);
    set({ currentMeeting: meeting });
  },

  // ─── Calculation ──────────────────────────────────────
  currentCalculation: null,
  setCurrentCalculation: (currentCalculation) => set({ currentCalculation }),
  saveCalculation: async (calculation) => {
    const saved = await db.upsertCalculation(calculation);
    set({ currentCalculation: saved });
  },
  loadCalculation: async (projectId) => {
    const calculation = await db.fetchCalculation(projectId);
    set({ currentCalculation: calculation });
  },
  updateCalculationResource: (resourceId, updates) =>
    set((state) => ({
      currentCalculation: state.currentCalculation
        ? {
            ...state.currentCalculation,
            resources: state.currentCalculation.resources.map((r) =>
              r.id === resourceId ? { ...r, ...updates } : r
            ),
            updatedAt: new Date(),
          }
        : null,
    })),
  removeCalculationResource: (resourceId) =>
    set((state) => ({
      currentCalculation: state.currentCalculation
        ? {
            ...state.currentCalculation,
            resources: state.currentCalculation.resources.filter((r) => r.id !== resourceId),
            updatedAt: new Date(),
          }
        : null,
    })),

  // ─── Proposal ─────────────────────────────────────────
  currentProposal: null,
  setCurrentProposal: (currentProposal) => set({ currentProposal }),
  saveProposal: async (proposal) => {
    const saved = await db.upsertProposal(proposal);
    set({ currentProposal: saved });
  },
  loadProposal: async (projectId) => {
    const proposal = await db.fetchProposal(projectId);
    set({ currentProposal: proposal });
  },
  updateProposalChapter: (chapterId, content) =>
    set((state) => ({
      currentProposal: state.currentProposal
        ? {
            ...state.currentProposal,
            chapters: state.currentProposal.chapters.map((c) =>
              c.id === chapterId ? { ...c, content, status: 'edited' as const } : c
            ),
          }
        : null,
    })),

  // ─── Notifications ────────────────────────────────────
  notifications: [],
  notificationsLoaded: false,
  loadNotifications: async () => {
    if (get().notificationsLoaded) return;
    try {
      const notifications = await db.fetchNotifications();
      set({ notifications, notificationsLoaded: true });
    } catch {
      // Non-critical, don't block the app
    }
  },
  addNotification: async (notification) => {
    try {
      const created = await db.createNotification(notification);
      set((state) => ({ notifications: [created, ...state.notifications] }));
    } catch {
      // Non-critical
    }
  },
  markNotificationRead: async (id) => {
    await db.markNotificationRead(id);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  // ─── Employees ────────────────────────────────────────
  employees: [],
  employeesLoaded: false,
  loadEmployees: async () => {
    if (get().employeesLoaded) return;
    set({ isLoading: true });
    try {
      const employees = await db.fetchEmployees();
      set({ employees, employeesLoaded: true });
    } finally {
      set({ isLoading: false });
    }
  },
  addEmployee: async (data) => {
    const employee = await db.createEmployee(data);
    set((state) => ({ employees: [...state.employees, employee] }));
    return employee;
  },
  updateEmployee: async (id, updates) => {
    await db.updateEmployee(id, updates);
    set((state) => ({
      employees: state.employees.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e
      ),
    }));
  },
  removeEmployee: async (id) => {
    await db.deleteEmployee(id);
    set((state) => ({
      employees: state.employees.filter((e) => e.id !== id),
    }));
  },

  // ─── Customers ────────────────────────────────────────
  customers: [],
  customersLoaded: false,
  loadCustomers: async () => {
    if (get().customersLoaded) return;
    set({ isLoading: true });
    try {
      const customers = await db.fetchCustomers();
      set({ customers, customersLoaded: true });
    } finally {
      set({ isLoading: false });
    }
  },
  addCustomer: async (data) => {
    const customer = await db.createCustomer(data);
    set((state) => ({ customers: [...state.customers, customer] }));
    return customer;
  },
  updateCustomer: async (id, updates) => {
    await db.updateCustomer(id, updates);
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
      ),
    }));
  },
  removeCustomer: async (id) => {
    await db.deleteCustomer(id);
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id),
    }));
  },
  addAppointment: async (customerId, appointment) => {
    const created = await db.createAppointment(customerId, appointment);
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId
          ? { ...c, appointments: [...c.appointments, created] }
          : c
      ),
    }));
  },
  deleteAppointment: async (customerId, appointmentId) => {
    await db.deleteAppointment(appointmentId);
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId
          ? { ...c, appointments: c.appointments.filter((a) => a.id !== appointmentId) }
          : c
      ),
    }));
  },

  // ─── References ───────────────────────────────────────
  references: [],
  referencesLoaded: false,
  loadReferences: async () => {
    if (get().referencesLoaded) return;
    set({ isLoading: true });
    try {
      const references = await db.fetchReferences();
      set({ references, referencesLoaded: true });
    } finally {
      set({ isLoading: false });
    }
  },
  addReference: async (data) => {
    const reference = await db.createReference(data);
    set((state) => ({ references: [...state.references, reference] }));
    return reference;
  },
  updateReference: async (id, updates) => {
    await db.updateReference(id, updates);
    set((state) => ({
      references: state.references.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
      ),
    }));
  },
  removeReference: async (id) => {
    await db.deleteReference(id);
    set((state) => ({
      references: state.references.filter((r) => r.id !== id),
    }));
  },

  // ─── UI ───────────────────────────────────────────────
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  aiProcessing: false,
  setAiProcessing: (aiProcessing) => set({ aiProcessing }),
}));
