'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, FolderOpen, Calendar, Users, MoreVertical, Sparkles } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import AiProposalModal from '@/components/ui/AiProposalModal';
import { useStore } from '@/store/useStore';
import { WORKFLOW_STEPS, Project, Customer } from '@/types';

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, setProjects, addProject, user, setUser, customers } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);

  useEffect(() => {
    // Mock user and projects for demo
    if (!user) {
      setUser({
        id: 'demo-user',
        email: 'demo@example.com',
        displayName: 'Demo Benutzer',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (projects.length === 0) {
      setProjects([
        {
          id: 'project-1',
          name: 'Cloud Migration Kunde A',
          customer: 'Firma A GmbH',
          customerId: 'cust-1',
          description: 'Vollständige Cloud-Migration auf Azure',
          deadline: new Date('2026-03-15'),
          proposalValue: 150000,
          status: 'active',
          currentStep: 'proposal_created',
          createdBy: 'demo-user',
          teamMembers: ['demo-user'],
          createdAt: new Date('2026-01-15'),
          updatedAt: new Date(),
        },
        {
          id: 'project-2',
          name: 'DevOps Transformation',
          customer: 'Firma B AG',
          customerId: 'cust-2',
          description: 'Einführung von CI/CD und Kubernetes',
          deadline: new Date('2026-04-01'),
          proposalValue: 85000,
          status: 'active',
          currentStep: 'questions_formulated',
          createdBy: 'demo-user',
          teamMembers: ['demo-user', 'user-2'],
          createdAt: new Date('2026-01-20'),
          updatedAt: new Date(),
        },
        {
          id: 'project-3',
          name: 'Security Audit',
          customer: 'Firma C KG',
          customerId: 'cust-3',
          description: 'Umfassendes Sicherheitsaudit',
          proposalValue: 45000,
          status: 'completed',
          currentStep: 'proposal_sent',
          createdBy: 'demo-user',
          teamMembers: ['demo-user'],
          createdAt: new Date('2026-01-05'),
          updatedAt: new Date(),
        },
        {
          id: 'project-4',
          name: 'Data Platform Modernisierung',
          customer: 'Firma D SE',
          customerId: 'cust-4',
          description: 'Migration auf moderne Data Platform',
          deadline: new Date('2026-05-01'),
          proposalValue: 200000,
          status: 'active',
          currentStep: 'rfp_received',
          createdBy: 'demo-user',
          teamMembers: ['demo-user', 'user-3'],
          createdAt: new Date('2026-02-01'),
          updatedAt: new Date(),
        },
      ]);
    }
  }, [user, projects.length, setUser, setProjects]);

  const handleOpenAiModal = () => {
    if (customers.length === 0) {
      alert('Bitte legen Sie zuerst einen Kunden an.');
      return;
    }
    setShowCustomerSelect(true);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerSelect(false);
    setIsAiModalOpen(true);
  };

  const handleCloseAiModal = () => {
    setIsAiModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleCreateAiProposal = (proposalData: {
    projectName?: string;
    description?: string;
    requirements?: string[];
    deadline?: string;
    budget?: string;
    notes?: string;
  }) => {
    if (!selectedCustomer) return;

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: proposalData.projectName || `Neues Angebot für ${selectedCustomer.companyName}`,
      customer: selectedCustomer.companyName,
      customerId: selectedCustomer.id,
      description: proposalData.description,
      deadline: proposalData.deadline ? new Date(proposalData.deadline.split('.').reverse().join('-')) : undefined,
      status: 'active',
      currentStep: 'rfp_received',
      createdBy: user?.id || 'current-user',
      teamMembers: user ? [user.id] : [],
      proposalValue: proposalData.budget ? parseFloat(proposalData.budget.replace(',', '.')) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addProject(newProject);
    handleCloseAiModal();
    router.push(`/project/${newProject.id}`);
  };

  const getStepLabel = (step: string) => {
    return WORKFLOW_STEPS.find((s) => s.step === step)?.label || step;
  };

  const getStepIndex = (step: string) => {
    return WORKFLOW_STEPS.findIndex((s) => s.step === step) + 1;
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Angebote</h1>
            <p className="text-gray-600 mt-1">
              Verwalten Sie Ihre Angebote
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              leftIcon={<Sparkles className="w-4 h-4" />}
              onClick={handleOpenAiModal}
              className="text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              Mit KI anlegen
            </Button>
            <Link href="/project/new">
              <Button leftIcon={<Plus className="w-4 h-4" />}>
                Neues Angebot
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Angebote durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  Alle ({projects.length})
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('active')}
                >
                  Aktiv ({projects.filter((p) => p.status === 'active').length})
                </Button>
                <Button
                  variant={statusFilter === 'completed' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('completed')}
                >
                  Abgeschlossen (
                  {projects.filter((p) => p.status === 'completed').length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Keine Angebote gefunden
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery
                  ? 'Versuchen Sie eine andere Suche'
                  : 'Erstellen Sie Ihr erstes Angebot'}
              </p>
              <Link href="/project/new">
                <Button>Angebot erstellen</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {project.customer}
                        </p>
                      </div>
                      <Badge
                        variant={
                          project.status === 'completed'
                            ? 'success'
                            : project.status === 'active'
                            ? 'info'
                            : 'default'
                        }
                      >
                        {project.status === 'completed'
                          ? 'Fertig'
                          : project.status === 'active'
                          ? 'Aktiv'
                          : 'Archiviert'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-500">Fortschritt</span>
                        <span className="font-medium text-gray-700">
                          Schritt {getStepIndex(project.currentStep)}/5
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{
                            width: `${(getStepIndex(project.currentStep) / 5) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {getStepLabel(project.currentStep)}
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{project.teamMembers.length}</span>
                      </div>
                      {project.deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(project.deadline).toLocaleDateString(
                              'de-DE',
                              { day: '2-digit', month: 'short' }
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Customer Selection Modal */}
      {showCustomerSelect && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowCustomerSelect(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Kunde auswählen</h2>
                <p className="text-sm text-gray-500">Für welchen Kunden möchten Sie ein Angebot erstellen?</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {customers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Keine Kunden vorhanden</p>
                ) : (
                  <div className="space-y-2">
                    {customers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                      >
                        <p className="font-medium text-gray-900">{customer.companyName}</p>
                        <p className="text-sm text-gray-500">{customer.contactPerson}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-100">
                <Button variant="outline" onClick={() => setShowCustomerSelect(false)} className="w-full">
                  Abbrechen
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* AI Proposal Modal */}
      {selectedCustomer && (
        <AiProposalModal
          isOpen={isAiModalOpen}
          onClose={handleCloseAiModal}
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.companyName}
          onCreateProposal={handleCreateAiProposal}
        />
      )}
    </div>
  );
}
