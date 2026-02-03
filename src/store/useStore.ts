import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Project, Document, RFPAnalysis, Question, Meeting, Proposal, Notification, Employee, Customer, Reference } from '@/types';

interface AppState {
  // Auth state
  user: User | null;
  setUser: (user: User | null) => void;

  // Projects state
  projects: Project[];
  currentProject: Project | null;
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;

  // Documents state
  documents: Document[];
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  removeDocument: (id: string) => void;

  // Analysis state
  currentAnalysis: RFPAnalysis | null;
  setCurrentAnalysis: (analysis: RFPAnalysis | null) => void;

  // Questions state
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
  addQuestion: (question: Question) => void;
  updateQuestion: (id: string, updates: Partial<Question>) => void;

  // Meeting state
  currentMeeting: Meeting | null;
  setCurrentMeeting: (meeting: Meeting | null) => void;

  // Proposal state
  currentProposal: Proposal | null;
  setCurrentProposal: (proposal: Proposal | null) => void;
  updateProposalChapter: (chapterId: string, content: string) => void;

  // Notifications
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;

  // Employees state (Ressourcen/Mitarbeiter)
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;

  // Customers state (Kunden)
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  removeCustomer: (id: string) => void;

  // References state (Referenzen)
  references: Reference[];
  setReferences: (references: Reference[]) => void;
  addReference: (reference: Reference) => void;
  updateReference: (id: string, updates: Partial<Reference>) => void;
  removeReference: (id: string) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  aiProcessing: boolean;
  setAiProcessing: (processing: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      setUser: (user) => set({ user }),

      // Projects
      projects: [],
      currentProject: null,
      setProjects: (projects) => set({ projects }),
      setCurrentProject: (currentProject) => set({ currentProject }),
      addProject: (project) => set((state) => ({
        projects: [...state.projects, project]
      })),
      updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
        currentProject: state.currentProject?.id === id
          ? { ...state.currentProject, ...updates }
          : state.currentProject
      })),

      // Documents
      documents: [],
      setDocuments: (documents) => set({ documents }),
      addDocument: (document) => set((state) => ({
        documents: [...state.documents, document]
      })),
      removeDocument: (id) => set((state) => ({
        documents: state.documents.filter((d) => d.id !== id)
      })),

      // Analysis
      currentAnalysis: null,
      setCurrentAnalysis: (currentAnalysis) => set({ currentAnalysis }),

      // Questions
      questions: [],
      setQuestions: (questions) => set({ questions }),
      addQuestion: (question) => set((state) => ({
        questions: [...state.questions, question]
      })),
      updateQuestion: (id, updates) => set((state) => ({
        questions: state.questions.map((q) =>
          q.id === id ? { ...q, ...updates } : q
        )
      })),

      // Meeting
      currentMeeting: null,
      setCurrentMeeting: (currentMeeting) => set({ currentMeeting }),

      // Proposal
      currentProposal: null,
      setCurrentProposal: (currentProposal) => set({ currentProposal }),
      updateProposalChapter: (chapterId, content) => set((state) => ({
        currentProposal: state.currentProposal
          ? {
              ...state.currentProposal,
              chapters: state.currentProposal.chapters.map((c) =>
                c.id === chapterId ? { ...c, content, status: 'edited' } : c
              )
            }
          : null
      })),

      // Notifications
      notifications: [],
      setNotifications: (notifications) => set({ notifications }),
      addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications]
      })),
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        )
      })),

      // Employees
      employees: [],
      setEmployees: (employees) => set({ employees }),
      addEmployee: (employee) => set((state) => ({
        employees: [...state.employees, employee]
      })),
      updateEmployee: (id, updates) => set((state) => ({
        employees: state.employees.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        )
      })),
      removeEmployee: (id) => set((state) => ({
        employees: state.employees.filter((e) => e.id !== id)
      })),

      // Customers
      customers: [],
      setCustomers: (customers) => set({ customers }),
      addCustomer: (customer) => set((state) => ({
        customers: [...state.customers, customer]
      })),
      updateCustomer: (id, updates) => set((state) => ({
        customers: state.customers.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        )
      })),
      removeCustomer: (id) => set((state) => ({
        customers: state.customers.filter((c) => c.id !== id)
      })),

      // References
      references: [],
      setReferences: (references) => set({ references }),
      addReference: (reference) => set((state) => ({
        references: [...state.references, reference]
      })),
      updateReference: (id, updates) => set((state) => ({
        references: state.references.map((r) =>
          r.id === id ? { ...r, ...updates } : r
        )
      })),
      removeReference: (id) => set((state) => ({
        references: state.references.filter((r) => r.id !== id)
      })),

      // UI
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
      aiProcessing: false,
      setAiProcessing: (aiProcessing) => set({ aiProcessing }),
    }),
    {
      name: 'sales-agent-storage',
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
