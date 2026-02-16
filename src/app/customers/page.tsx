'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Building2, Mail, Phone, MapPin, Calendar, FileText, ChevronDown, ChevronUp, Edit2, Trash2, X, ExternalLink, Sparkles, Mic, MicOff, Loader2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import AiProposalModal from '@/components/ui/AiProposalModal';
import { useStore } from '@/store/useStore';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Customer, CustomerProposal, CustomerAppointment, Project } from '@/types';

export default function CustomersPage() {
  const router = useRouter();
  const { customers, loadCustomers, addCustomer, updateCustomer, removeCustomer, projects, loadProjects, addProject, addAppointment, deleteAppointment: storeDeleteAppointment } = useStore();

  // Dynamisch Proposals aus Projects laden basierend auf customerId
  const getCustomerProposals = (customerId: string): CustomerProposal[] => {
    return projects
      .filter(project => project.customerId === customerId)
      .map(project => ({
        id: project.id,
        projectId: project.id,
        projectName: project.name,
        status: project.status === 'completed'
          ? 'accepted' as const
          : project.currentStep === 'proposal_sent'
            ? 'sent' as const
            : 'draft' as const,
        sentAt: project.currentStep === 'proposal_sent' ? project.updatedAt : undefined,
        value: project.proposalValue,
      }));
  };

  // Kunden mit dynamischen Proposals anreichern
  const customersWithProposals = useMemo(() => {
    return customers.map(customer => ({
      ...customer,
      proposals: getCustomerProposals(customer.id),
    }));
  }, [customers, projects]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isAiProposalModalOpen, setIsAiProposalModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerForAppointment, setSelectedCustomerForAppointment] = useState<Customer | null>(null);
  const [selectedCustomerForAiProposal, setSelectedCustomerForAiProposal] = useState<Customer | null>(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    notes: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'Deutschland',
  });

  // Appointment form state
  const [appointmentData, setAppointmentData] = useState({
    title: '',
    date: '',
    type: 'meeting' as CustomerAppointment['type'],
    notes: '',
  });

  // Speech input state
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [speechParsing, setSpeechParsing] = useState(false);
  const [speechError, setSpeechError] = useState('');

  const handleSpeechResult = (text: string) => {
    setSpeechTranscript((prev) => (prev ? `${prev} ${text}` : text));
  };

  const { isListening, interimTranscript, isSupported: speechSupported, toggleListening } =
    useSpeechRecognition({ onTranscript: handleSpeechResult });

  const handleSpeechToCustomer = async () => {
    const text = speechTranscript.trim();
    if (!text) return;

    setSpeechParsing(true);
    setSpeechError('');

    try {
      const response = await fetch('/api/ai/parse-customer-from-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });
      const data = await response.json();

      if (data.error) {
        setSpeechError(data.error);
      } else if (data.customer) {
        const c = data.customer;
        setFormData({
          companyName: (c.companyName as string) || formData.companyName,
          industry: (c.industry as string) || formData.industry,
          contactPerson: (c.contactPerson as string) || formData.contactPerson,
          contactEmail: (c.contactEmail as string) || formData.contactEmail,
          contactPhone: (c.contactPhone as string) || formData.contactPhone,
          website: (c.website as string) || formData.website,
          notes: (c.notes as string) || formData.notes,
          street: (c.street as string) || formData.street,
          city: (c.city as string) || formData.city,
          postalCode: (c.postalCode as string) || formData.postalCode,
          country: (c.country as string) || formData.country,
        });
        setSpeechTranscript('');
      }
    } catch {
      setSpeechError('Fehler bei der Verarbeitung. Bitte versuchen Sie es erneut.');
    } finally {
      setSpeechParsing(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadProjects();
  }, [loadCustomers, loadProjects]);

  const resetForm = () => {
    setFormData({
      companyName: '',
      industry: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      website: '',
      notes: '',
      street: '',
      city: '',
      postalCode: '',
      country: 'Deutschland',
    });
  };

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        companyName: customer.companyName,
        industry: customer.industry || '',
        contactPerson: customer.contactPerson,
        contactEmail: customer.contactEmail,
        contactPhone: customer.contactPhone || '',
        website: customer.website || '',
        notes: customer.notes || '',
        street: customer.address?.street || '',
        city: customer.address?.city || '',
        postalCode: customer.address?.postalCode || '',
        country: customer.address?.country || 'Deutschland',
      });
    } else {
      setEditingCustomer(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    resetForm();
  };

  const openAppointmentModal = (customer: Customer) => {
    setSelectedCustomerForAppointment(customer);
    setAppointmentData({
      title: '',
      date: '',
      type: 'meeting',
      notes: '',
    });
    setIsAppointmentModalOpen(true);
  };

  const closeAppointmentModal = () => {
    setIsAppointmentModalOpen(false);
    setSelectedCustomerForAppointment(null);
  };

  const openAiProposalModal = (customer: Customer) => {
    setSelectedCustomerForAiProposal(customer);
    setIsAiProposalModalOpen(true);
  };

  const closeAiProposalModal = () => {
    setIsAiProposalModalOpen(false);
    setSelectedCustomerForAiProposal(null);
  };

  const handleCreateAiProposal = async (proposalData: {
    projectName?: string;
    description?: string;
    requirements?: string[];
    deadline?: string;
    budget?: string;
    notes?: string;
  }) => {
    if (!selectedCustomerForAiProposal) return;

    const newProject = await addProject({
      name: proposalData.projectName || `Neues Angebot für ${selectedCustomerForAiProposal.companyName}`,
      customer: selectedCustomerForAiProposal.companyName,
      customerId: selectedCustomerForAiProposal.id,
      description: proposalData.description,
      deadline: proposalData.deadline ? new Date(proposalData.deadline.split('.').reverse().join('-')) : undefined,
      status: 'active',
      currentStep: 'rfp_received',
      createdBy: 'system',
      teamMembers: [],
      proposalValue: proposalData.budget ? parseFloat(proposalData.budget.replace(',', '.')) : undefined,
    });

    closeAiProposalModal();
    router.push(`/project/${newProject.id}`);
  };

  const handleSave = async () => {
    const customerFields = {
      companyName: formData.companyName,
      industry: formData.industry || undefined,
      contactPerson: formData.contactPerson,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone || undefined,
      website: formData.website || undefined,
      notes: formData.notes || undefined,
      address: formData.street ? {
        street: formData.street,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country,
      } : undefined,
    };

    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, customerFields);
    } else {
      await addCustomer(customerFields);
    }
    closeModal();
  };

  const handleAddAppointment = async () => {
    if (selectedCustomerForAppointment && appointmentData.title && appointmentData.date) {
      await addAppointment(selectedCustomerForAppointment.id, {
        title: appointmentData.title,
        date: new Date(appointmentData.date),
        type: appointmentData.type,
        notes: appointmentData.notes || undefined,
      });
      closeAppointmentModal();
    }
  };

  const handleDeleteAppointment = async (customerId: string, appointmentId: string) => {
    await storeDeleteAppointment(customerId, appointmentId);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Möchten Sie diesen Kunden wirklich löschen?')) {
      await removeCustomer(id);
    }
  };

  const filteredCustomers = customersWithProposals.filter((customer) => {
    const matchesSearch =
      customer.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.industry?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const getProposalStatusBadge = (status: CustomerProposal['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="default">Entwurf</Badge>;
      case 'sent':
        return <Badge variant="info">Gesendet</Badge>;
      case 'accepted':
        return <Badge variant="success">Angenommen</Badge>;
      case 'rejected':
        return <Badge variant="error">Abgelehnt</Badge>;
      case 'expired':
        return <Badge variant="warning">Abgelaufen</Badge>;
    }
  };

  const getAppointmentTypeBadge = (type: CustomerAppointment['type']) => {
    switch (type) {
      case 'meeting':
        return <Badge variant="info" size="sm">Meeting</Badge>;
      case 'call':
        return <Badge variant="default" size="sm">Anruf</Badge>;
      case 'presentation':
        return <Badge variant="success" size="sm">Präsentation</Badge>;
      case 'other':
        return <Badge variant="warning" size="sm">Sonstiges</Badge>;
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kunden</h1>
            <p className="text-gray-600 mt-1">
              Verwalten Sie Ihre Kundenkontakte, Angebote und Termine
            </p>
          </div>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => openModal()}>
            Neuer Kunde
          </Button>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Nach Firma, Kontaktperson oder Branche suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers List */}
        {filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Keine Kunden gefunden
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery
                  ? 'Versuchen Sie eine andere Suche'
                  : 'Fügen Sie Ihren ersten Kunden hinzu'}
              </p>
              <Button onClick={() => openModal()}>Kunden anlegen</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="overflow-hidden">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {customer.companyName}
                        </h3>
                        <p className="text-sm text-gray-500">{customer.contactPerson}</p>
                        {customer.industry && (
                          <p className="text-xs text-gray-400">{customer.industry}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{customer.proposals.length} Angebote</Badge>
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/customers/${customer.id}/edit`)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(customer.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedCustomerId(
                          expandedCustomerId === customer.id ? null : customer.id
                        )}
                      >
                        {expandedCustomerId === customer.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Contact Preview */}
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                    <a href={`mailto:${customer.contactEmail}`} className="flex items-center gap-1 hover:text-blue-600">
                      <Mail className="w-4 h-4" />
                      {customer.contactEmail}
                    </a>
                    {customer.contactPhone && (
                      <a href={`tel:${customer.contactPhone}`} className="flex items-center gap-1 hover:text-blue-600">
                        <Phone className="w-4 h-4" />
                        {customer.contactPhone}
                      </a>
                    )}
                    {customer.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {customer.address.city}
                      </span>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {expandedCustomerId === customer.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
                      {/* Full Contact Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Kontaktdaten</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="text-gray-500">Ansprechpartner:</span> {customer.contactPerson}</p>
                            <p><span className="text-gray-500">E-Mail:</span> {customer.contactEmail}</p>
                            {customer.contactPhone && (
                              <p><span className="text-gray-500">Telefon:</span> {customer.contactPhone}</p>
                            )}
                            {customer.website && (
                              <p>
                                <span className="text-gray-500">Website:</span>{' '}
                                <a href={customer.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                                  {customer.website} <ExternalLink className="w-3 h-3" />
                                </a>
                              </p>
                            )}
                          </div>
                        </div>
                        {customer.address && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Adresse</h4>
                            <div className="text-sm text-gray-600">
                              <p>{customer.address.street}</p>
                              <p>{customer.address.postalCode} {customer.address.city}</p>
                              <p>{customer.address.country}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {customer.notes && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Notizen</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{customer.notes}</p>
                        </div>
                      )}

                      {/* Proposals */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Angebote ({customer.proposals.length})
                          </h4>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAiProposalModal(customer)}
                              className="text-purple-600 border-purple-200 hover:bg-purple-50"
                            >
                              <Sparkles className="w-3 h-3 mr-1" /> Mit KI anlegen
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => router.push(`/project/new?customerId=${customer.id}`)}>
                              <Plus className="w-3 h-3 mr-1" /> Neues Angebot
                            </Button>
                          </div>
                        </div>
                        {customer.proposals.length === 0 ? (
                          <p className="text-sm text-gray-500">Keine Angebote vorhanden</p>
                        ) : (
                          <div className="space-y-2">
                            {customer.proposals.map((proposal) => (
                              <div
                                key={proposal.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <Link href={`/project/${proposal.projectId}`} className="text-sm font-medium text-blue-600 hover:underline">
                                    {proposal.projectName}
                                  </Link>
                                  {getProposalStatusBadge(proposal.status)}
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm font-medium text-gray-700">
                                    {formatCurrency(proposal.value)}
                                  </span>
                                  {proposal.sentAt && (
                                    <span className="text-xs text-gray-500">
                                      Gesendet: {new Date(proposal.sentAt).toLocaleDateString('de-DE')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Appointments */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Terminnotizen ({customer.appointments.length})
                          </h4>
                          <Button variant="outline" size="sm" onClick={() => openAppointmentModal(customer)}>
                            <Plus className="w-3 h-3 mr-1" /> Termin
                          </Button>
                        </div>
                        {customer.appointments.length === 0 ? (
                          <p className="text-sm text-gray-500">Keine Termine vorhanden</p>
                        ) : (
                          <div className="space-y-2">
                            {customer.appointments
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map((appointment) => (
                                <div
                                  key={appointment.id}
                                  className="flex items-start justify-between p-3 bg-gray-50 rounded"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-gray-700">{appointment.title}</span>
                                      {getAppointmentTypeBadge(appointment.type)}
                                    </div>
                                    {appointment.notes && (
                                      <p className="text-xs text-gray-500 mt-1">{appointment.notes}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">
                                      {new Date(appointment.date).toLocaleDateString('de-DE', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                      })}
                                    </span>
                                    <button
                                      onClick={() => handleDeleteAppointment(customer.id, appointment.id)}
                                      className="text-gray-400 hover:text-red-500"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Customer Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCustomer ? 'Kunde bearbeiten' : 'Neuer Kunde'} size="lg">
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Speech Input */}
          {!editingCustomer && speechSupported && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h4 className="text-sm font-medium text-purple-800">Per Sprache anlegen</h4>
              </div>
              <p className="text-xs text-purple-600 mb-3">
                Beschreiben Sie den Kunden z.B.: &quot;Neuer Kunde Siemens AG, Branche Maschinenbau, Ansprechpartner ist Herr Dr. Weber, E-Mail weber at siemens punkt de, Telefon 089 1234567, Adresse Werner-von-Siemens-Straße 1, 80333 München&quot;
              </p>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={toggleListening}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isListening
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      Aufnahme stoppen
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      Aufnahme starten
                    </>
                  )}
                </button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSpeechToCustomer}
                  disabled={!speechTranscript.trim() || speechParsing}
                >
                  {speechParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      Erkennung...
                    </>
                  ) : (
                    'Felder ausfüllen'
                  )}
                </Button>
              </div>
              {(speechTranscript || interimTranscript) && (
                <div className="bg-white border border-purple-100 rounded p-2 text-sm text-gray-700">
                  {speechTranscript}
                  {interimTranscript && (
                    <span className="text-gray-400 italic"> {interimTranscript}</span>
                  )}
                </div>
              )}
              <textarea
                className="w-full mt-2 px-3 py-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows={2}
                placeholder="Oder Text hier eingeben..."
                value={speechTranscript}
                onChange={(e) => setSpeechTranscript(e.target.value)}
              />
              {speechError && (
                <p className="text-xs text-red-600 mt-1">{speechError}</p>
              )}
            </div>
          )}

          {/* Company Info */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Firmenname"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              required
            />
            <Input
              label="Branche"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
          </div>

          {/* Contact Person */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Ansprechpartner</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Name"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                required
              />
              <Input
                label="E-Mail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input
                label="Telefon"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
              <Input
                label="Website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.beispiel.de"
              />
            </div>
          </div>

          {/* Address */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Adresse</h4>
            <Input
              label="Straße"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              className="mb-4"
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="PLZ"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
              <Input
                label="Stadt"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
              <Input
                label="Land"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="border-t pt-4">
            <Textarea
              label="Notizen"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Zusätzliche Informationen über den Kunden..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={closeModal}>Abbrechen</Button>
          <Button onClick={handleSave} disabled={!formData.companyName || !formData.contactPerson || !formData.contactEmail}>
            {editingCustomer ? 'Speichern' : 'Anlegen'}
          </Button>
        </div>
      </Modal>

      {/* Add Appointment Modal */}
      <Modal isOpen={isAppointmentModalOpen} onClose={closeAppointmentModal} title="Neuer Termin" size="md">
        <div className="space-y-4">
          <Input
            label="Titel"
            value={appointmentData.title}
            onChange={(e) => setAppointmentData({ ...appointmentData, title: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Datum"
              type="date"
              value={appointmentData.date}
              onChange={(e) => setAppointmentData({ ...appointmentData, date: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
              <select
                value={appointmentData.type}
                onChange={(e) => setAppointmentData({ ...appointmentData, type: e.target.value as CustomerAppointment['type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="meeting">Meeting</option>
                <option value="call">Anruf</option>
                <option value="presentation">Präsentation</option>
                <option value="other">Sonstiges</option>
              </select>
            </div>
          </div>
          <Textarea
            label="Notizen"
            value={appointmentData.notes}
            onChange={(e) => setAppointmentData({ ...appointmentData, notes: e.target.value })}
            rows={3}
            placeholder="Terminnotizen..."
          />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={closeAppointmentModal}>Abbrechen</Button>
          <Button onClick={handleAddAppointment} disabled={!appointmentData.title || !appointmentData.date}>
            Termin anlegen
          </Button>
        </div>
      </Modal>

      {/* AI Proposal Modal */}
      {selectedCustomerForAiProposal && (
        <AiProposalModal
          isOpen={isAiProposalModalOpen}
          onClose={closeAiProposalModal}
          customerId={selectedCustomerForAiProposal.id}
          customerName={selectedCustomerForAiProposal.companyName}
          onCreateProposal={handleCreateAiProposal}
        />
      )}
    </div>
  );
}
