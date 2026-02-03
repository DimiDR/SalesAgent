'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Building2, Users, Settings, Euro } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import WorkflowStepper from '@/components/workflow/WorkflowStepper';
import StepRFPReceived from '@/components/workflow/StepRFPReceived';
import StepQuestionsFormulated from '@/components/workflow/StepQuestionsFormulated';
import StepCustomerMeeting from '@/components/workflow/StepCustomerMeeting';
import StepProposalCreated from '@/components/workflow/StepProposalCreated';
import StepProposalSent from '@/components/workflow/StepProposalSent';
import { useStore } from '@/store/useStore';
import { WORKFLOW_STEPS, WorkflowStep, WorkflowStatus } from '@/types';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { projects, currentProject, setCurrentProject, updateProject, customers } = useStore();
  const [stepStatuses, setStepStatuses] = useState<Record<WorkflowStep, WorkflowStatus>>({
    rfp_received: { step: 'rfp_received', status: 'pending' },
    questions_formulated: { step: 'questions_formulated', status: 'pending' },
    customer_meeting: { step: 'customer_meeting', status: 'pending' },
    proposal_created: { step: 'proposal_created', status: 'pending' },
    proposal_sent: { step: 'proposal_sent', status: 'pending' },
  });

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    customerId: '',
    customer: '',
    description: '',
    deadline: '',
    proposalValue: '',
  });

  const openEditModal = () => {
    if (currentProject) {
      setEditFormData({
        name: currentProject.name,
        customerId: currentProject.customerId || '',
        customer: currentProject.customer,
        description: currentProject.description || '',
        deadline: currentProject.deadline
          ? new Date(currentProject.deadline).toISOString().split('T')[0]
          : '',
        proposalValue: currentProject.proposalValue?.toString() || '',
      });
      setIsEditModalOpen(true);
    }
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerId = e.target.value;
    const selectedCustomer = customers.find(c => c.id === customerId);
    setEditFormData(prev => ({
      ...prev,
      customerId,
      customer: selectedCustomer?.companyName || '',
    }));
  };

  const handleSaveEdit = () => {
    if (!currentProject) return;

    updateProject(projectId, {
      name: editFormData.name,
      customerId: editFormData.customerId || undefined,
      customer: editFormData.customer,
      description: editFormData.description || undefined,
      deadline: editFormData.deadline ? new Date(editFormData.deadline) : undefined,
      proposalValue: editFormData.proposalValue ? parseFloat(editFormData.proposalValue) : undefined,
      updatedAt: new Date(),
    });

    setIsEditModalOpen(false);
  };

  useEffect(() => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setCurrentProject(project);

      // Set step statuses based on current step
      const currentStepIndex = WORKFLOW_STEPS.findIndex(
        (s) => s.step === project.currentStep
      );

      const newStatuses: Record<WorkflowStep, WorkflowStatus> = {} as Record<WorkflowStep, WorkflowStatus>;
      WORKFLOW_STEPS.forEach((step, index) => {
        if (index < currentStepIndex) {
          newStatuses[step.step] = { step: step.step, status: 'completed' };
        } else if (index === currentStepIndex) {
          newStatuses[step.step] = { step: step.step, status: 'in_progress' };
        } else {
          newStatuses[step.step] = { step: step.step, status: 'pending' };
        }
      });
      setStepStatuses(newStatuses);
    }
  }, [projectId, projects, setCurrentProject]);

  const handleStepComplete = () => {
    if (!currentProject) return;

    const currentStepIndex = WORKFLOW_STEPS.findIndex(
      (s) => s.step === currentProject.currentStep
    );

    if (currentStepIndex < WORKFLOW_STEPS.length - 1) {
      const nextStep = WORKFLOW_STEPS[currentStepIndex + 1].step;
      updateProject(projectId, { currentStep: nextStep });

      // Update step statuses
      setStepStatuses((prev) => ({
        ...prev,
        [currentProject.currentStep]: {
          ...prev[currentProject.currentStep],
          status: 'completed',
          completedAt: new Date(),
        },
        [nextStep]: {
          ...prev[nextStep],
          status: 'in_progress',
        },
      }));
    } else {
      // Last step completed
      updateProject(projectId, { status: 'completed' });
      setStepStatuses((prev) => ({
        ...prev,
        proposal_sent: {
          ...prev.proposal_sent,
          status: 'completed',
          completedAt: new Date(),
        },
      }));
    }
  };

  const handleStepClick = (step: WorkflowStep) => {
    if (!currentProject) return;
    updateProject(projectId, { currentStep: step });
  };

  const renderCurrentStep = () => {
    if (!currentProject) return null;

    switch (currentProject.currentStep) {
      case 'rfp_received':
        return (
          <StepRFPReceived
            projectId={projectId}
            onComplete={handleStepComplete}
          />
        );
      case 'questions_formulated':
        return (
          <StepQuestionsFormulated
            projectId={projectId}
            onComplete={handleStepComplete}
          />
        );
      case 'customer_meeting':
        return (
          <StepCustomerMeeting
            projectId={projectId}
            onComplete={handleStepComplete}
          />
        );
      case 'proposal_created':
        return (
          <StepProposalCreated
            projectId={projectId}
            onComplete={handleStepComplete}
          />
        );
      case 'proposal_sent':
        return (
          <StepProposalSent
            projectId={projectId}
            onComplete={handleStepComplete}
          />
        );
      default:
        return null;
    }
  };

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-500">Angebot wird geladen...</p>
          </div>
        </main>
      </div>
    );
  }

  const currentStepInfo = WORKFLOW_STEPS.find(
    (s) => s.step === currentProject.currentStep
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zum Dashboard
        </Link>

        {/* Project Header */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {currentProject.name}
                  </h1>
                  <Badge
                    variant={
                      currentProject.status === 'completed'
                        ? 'success'
                        : currentProject.status === 'active'
                        ? 'info'
                        : 'default'
                    }
                  >
                    {currentProject.status === 'completed'
                      ? 'Abgeschlossen'
                      : currentProject.status === 'active'
                      ? 'Aktiv'
                      : 'Archiviert'}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  {currentProject.customerId ? (
                    <Link
                      href="/customers"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <Building2 className="w-4 h-4" />
                      {currentProject.customer}
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {currentProject.customer}
                    </span>
                  )}
                  {currentProject.deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Frist:{' '}
                      {new Date(currentProject.deadline).toLocaleDateString(
                        'de-DE'
                      )}
                    </span>
                  )}
                  {currentProject.proposalValue && (
                    <span className="flex items-center gap-1">
                      <Euro className="w-4 h-4" />
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(currentProject.proposalValue)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {currentProject.teamMembers.length} Teammitglied(er)
                  </span>
                </div>
              </div>
              <Button variant="outline" onClick={openEditModal} leftIcon={<Settings className="w-4 h-4" />}>
                Bearbeiten
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Stepper */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <WorkflowStepper
              currentStep={currentProject.currentStep}
              stepStatuses={stepStatuses}
              onStepClick={handleStepClick}
            />
          </CardContent>
        </Card>

        {/* Current Step Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {currentStepInfo?.label}
                </h2>
                <p className="text-gray-500 mt-1">
                  {currentStepInfo?.description}
                </p>
              </div>
              <Badge variant="info">
                Schritt{' '}
                {WORKFLOW_STEPS.findIndex(
                  (s) => s.step === currentProject.currentStep
                ) + 1}{' '}
                von {WORKFLOW_STEPS.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>{renderCurrentStep()}</CardContent>
        </Card>
      </main>

      {/* Edit Project Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Angebot bearbeiten"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Angebotsname"
            value={editFormData.name}
            onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
          />

          {/* Kundenauswahl */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kunde
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={editFormData.customerId}
                onChange={handleCustomerChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="">Kein Kunde zugeordnet</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.companyName} ({customer.contactPerson})
                  </option>
                ))}
              </select>
            </div>
            {editFormData.customerId && (
              <p className="mt-1 text-sm text-green-600">
                Verknüpft mit: {editFormData.customer}
              </p>
            )}
            {!editFormData.customerId && editFormData.customer && (
              <p className="mt-1 text-sm text-amber-600">
                Aktuell: {editFormData.customer} (nicht verknüpft)
              </p>
            )}
          </div>

          <Textarea
            label="Beschreibung"
            value={editFormData.description}
            onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Angebotsfrist"
              type="date"
              value={editFormData.deadline}
              onChange={(e) => setEditFormData(prev => ({ ...prev, deadline: e.target.value }))}
            />
            <Input
              label="Angebotswert (EUR)"
              type="number"
              placeholder="z.B. 50000"
              value={editFormData.proposalValue}
              onChange={(e) => setEditFormData(prev => ({ ...prev, proposalValue: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSaveEdit} disabled={!editFormData.name}>
            Speichern
          </Button>
        </div>
      </Modal>
    </div>
  );
}
