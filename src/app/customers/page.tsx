'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Building2, Mail, Phone, MapPin, Calendar, FileText, ChevronDown, ChevronUp, Edit2, Trash2, X, ExternalLink } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import { Customer, CustomerProposal, CustomerAppointment, Project } from '@/types';

export default function CustomersPage() {
  const { customers, setCustomers, addCustomer, updateCustomer, removeCustomer, projects } = useStore();

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
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerForAppointment, setSelectedCustomerForAppointment] = useState<Customer | null>(null);
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

  useEffect(() => {
    // Mock data for demo - ohne proposals (werden dynamisch aus Projects geladen)
    if (customers.length === 0) {
      setCustomers([
        {
          id: 'cust-1',
          companyName: 'Firma A GmbH',
          industry: 'IT & Software',
          contactPerson: 'Dr. Hans Weber',
          contactEmail: 'h.weber@firma-a.de',
          contactPhone: '+49 89 123456',
          address: {
            street: 'Hauptstraße 42',
            city: 'München',
            postalCode: '80331',
            country: 'Deutschland',
          },
          website: 'https://www.firma-a.de',
          notes: 'Langjähriger Kunde, bevorzugt Azure-Lösungen',
          proposals: [], // Wird dynamisch aus Projects geladen
          appointments: [
            { id: 'apt-1', title: 'Kickoff Meeting', date: new Date('2026-01-18'), type: 'meeting', notes: 'Initiales Projektmeeting zur Cloud Migration' },
            { id: 'apt-2', title: 'Follow-up Call', date: new Date('2026-02-05'), type: 'call', notes: 'Statusbesprechung' },
          ],
          createdAt: new Date('2025-06-15'),
          updatedAt: new Date(),
        },
        {
          id: 'cust-2',
          companyName: 'Firma B AG',
          industry: 'Finanzdienstleistungen',
          contactPerson: 'Maria Schmidt',
          contactEmail: 'm.schmidt@firma-b.de',
          contactPhone: '+49 69 987654',
          address: {
            street: 'Bankstraße 100',
            city: 'Frankfurt',
            postalCode: '60311',
            country: 'Deutschland',
          },
          notes: 'Sehr sicherheitsbewusst, strenge Compliance-Anforderungen',
          proposals: [],
          appointments: [
            { id: 'apt-3', title: 'Anforderungsworkshop', date: new Date('2026-01-25'), type: 'meeting', notes: 'Detailierte Anforderungsaufnahme für DevOps' },
          ],
          createdAt: new Date('2025-08-20'),
          updatedAt: new Date(),
        },
        {
          id: 'cust-3',
          companyName: 'Firma C KG',
          industry: 'Produktion',
          contactPerson: 'Thomas Braun',
          contactEmail: 't.braun@firma-c.de',
          contactPhone: '+49 711 456789',
          address: {
            street: 'Industrieweg 5',
            city: 'Stuttgart',
            postalCode: '70173',
            country: 'Deutschland',
          },
          proposals: [],
          appointments: [],
          createdAt: new Date('2025-12-01'),
          updatedAt: new Date(),
        },
        {
          id: 'cust-4',
          companyName: 'Firma D SE',
          industry: 'E-Commerce',
          contactPerson: 'Lisa Hoffmann',
          contactEmail: 'l.hoffmann@firma-d.de',
          contactPhone: '+49 30 112233',
          address: {
            street: 'Digitalplatz 1',
            city: 'Berlin',
            postalCode: '10117',
            country: 'Deutschland',
          },
          website: 'https://www.firma-d.de',
          notes: 'Startup, sehr agil, kurze Entscheidungswege',
          proposals: [],
          appointments: [
            { id: 'apt-4', title: 'Präsentation Lösungskonzept', date: new Date('2026-02-10'), type: 'presentation', notes: 'Vorstellung des technischen Konzepts' },
          ],
          createdAt: new Date('2026-01-05'),
          updatedAt: new Date(),
        },
      ]);
    }
  }, [customers.length, setCustomers]);

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

  const handleSave = () => {
    const customerData: Customer = {
      id: editingCustomer?.id || `cust-${Date.now()}`,
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
      proposals: editingCustomer?.proposals || [],
      appointments: editingCustomer?.appointments || [],
      createdAt: editingCustomer?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, customerData);
    } else {
      addCustomer(customerData);
    }
    closeModal();
  };

  const handleAddAppointment = () => {
    if (selectedCustomerForAppointment && appointmentData.title && appointmentData.date) {
      const newAppointment: CustomerAppointment = {
        id: `apt-${Date.now()}`,
        title: appointmentData.title,
        date: new Date(appointmentData.date),
        type: appointmentData.type,
        notes: appointmentData.notes || undefined,
      };

      updateCustomer(selectedCustomerForAppointment.id, {
        appointments: [...selectedCustomerForAppointment.appointments, newAppointment],
        updatedAt: new Date(),
      });
      closeAppointmentModal();
    }
  };

  const handleDeleteAppointment = (customerId: string, appointmentId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      updateCustomer(customerId, {
        appointments: customer.appointments.filter(a => a.id !== appointmentId),
        updatedAt: new Date(),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Möchten Sie diesen Kunden wirklich löschen?')) {
      removeCustomer(id);
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
        return <Badge variant="danger">Abgelehnt</Badge>;
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
                      <Button variant="ghost" size="sm" onClick={() => openModal(customer)}>
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
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Angebote ({customer.proposals.length})
                        </h4>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
            <textarea
              value={appointmentData.notes}
              onChange={(e) => setAppointmentData({ ...appointmentData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Terminnotizen..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={closeAppointmentModal}>Abbrechen</Button>
          <Button onClick={handleAddAppointment} disabled={!appointmentData.title || !appointmentData.date}>
            Termin anlegen
          </Button>
        </div>
      </Modal>
    </div>
  );
}
