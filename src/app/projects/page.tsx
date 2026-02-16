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
import type { ProposalData } from '@/components/ui/AiProposalModal';
import { useStore } from '@/store/useStore';
import { WORKFLOW_STEPS, Project, Customer } from '@/types';

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, loadProjects, addProject, customers, loadCustomers, addCustomer } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    loadProjects();
    loadCustomers();
  }, [loadProjects, loadCustomers]);

  const handleOpenAiModal = () => {
    setIsAiModalOpen(true);
  };

  const handleCloseAiModal = () => {
    setIsAiModalOpen(false);
  };

  const handleCreateAiProposal = async (proposalData: ProposalData) => {
    let customerId: string | undefined;
    let customerCompanyName: string;

    const extractedCompany = proposalData.customerCompany;

    if (extractedCompany) {
      // Search for existing customer (case-insensitive, partial match)
      const existingCustomer = customers.find((c) => {
        const existing = c.companyName.toLowerCase();
        const search = extractedCompany.toLowerCase();
        return existing.includes(search) || search.includes(existing);
      });

      if (existingCustomer) {
        customerId = existingCustomer.id;
        customerCompanyName = existingCustomer.companyName;
      } else {
        // Create new customer
        const newCustomer = await addCustomer({
          companyName: extractedCompany,
          contactPerson: proposalData.customerContact || 'Nicht angegeben',
          contactEmail: proposalData.customerEmail || '',
        });
        customerId = newCustomer.id;
        customerCompanyName = newCustomer.companyName;
      }
    } else {
      customerCompanyName = 'Unbekannter Kunde';
    }

    const newProject = await addProject({
      name: proposalData.projectName || `Neues Angebot für ${customerCompanyName}`,
      customer: customerCompanyName,
      customerId: customerId,
      description: proposalData.description,
      deadline: proposalData.deadline ? new Date(proposalData.deadline.split('.').reverse().join('-')) : undefined,
      status: 'active',
      currentStep: 'rfp_received',
      createdBy: 'system',
      teamMembers: [],
      proposalValue: proposalData.budget ? parseFloat(proposalData.budget.replace(',', '.')) : undefined,
    });

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

      {/* AI Proposal Modal */}
      <AiProposalModal
        isOpen={isAiModalOpen}
        onClose={handleCloseAiModal}
        onCreateProposal={handleCreateAiProposal}
      />
    </div>
  );
}
