'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Award, Building2, Calendar, Briefcase, Edit2, Trash2, ChevronDown, ChevronUp, Quote, Globe, Lock } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import { Reference, Customer } from '@/types';

export default function ReferencesPage() {
  const router = useRouter();
  const { references, setReferences, addReference, updateReference, removeReference, customers } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReference, setEditingReference] = useState<Reference | null>(null);
  const [expandedReferenceId, setExpandedReferenceId] = useState<string | null>(null);
  const [filterCustomerId, setFilterCustomerId] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    customerId: '',
    projectTitle: '',
    description: '',
    industry: '',
    technologies: '',
    projectDuration: '',
    projectValue: '',
    completionDate: '',
    contactPerson: '',
    testimonial: '',
    isPublic: true,
  });

  useEffect(() => {
    // Mock data for demo
    if (references.length === 0 && customers.length > 0) {
      setReferences([
        {
          id: 'ref-1',
          customerId: 'cust-1',
          customerName: 'Firma A GmbH',
          projectTitle: 'Cloud Migration & Modernisierung',
          description: 'Vollständige Migration der On-Premise-Infrastruktur in die Azure Cloud. Implementierung von Kubernetes, CI/CD-Pipelines und Infrastructure as Code.',
          industry: 'IT & Software',
          technologies: ['Azure', 'Kubernetes', 'Terraform', 'GitHub Actions'],
          projectDuration: '8 Monate',
          projectValue: 450000,
          completionDate: new Date('2025-09-15'),
          contactPerson: 'Dr. Hans Weber',
          testimonial: 'Hervorragende Zusammenarbeit! Das Team hat unsere Erwartungen übertroffen und die Migration reibungslos durchgeführt.',
          isPublic: true,
          createdAt: new Date('2025-10-01'),
          updatedAt: new Date(),
        },
        {
          id: 'ref-2',
          customerId: 'cust-2',
          customerName: 'Firma B AG',
          projectTitle: 'DevOps Transformation',
          description: 'Einführung von DevOps-Praktiken und Automatisierung der Software-Entwicklungsprozesse. Aufbau einer vollständigen CI/CD-Pipeline mit Sicherheitsintegration.',
          industry: 'Finanzdienstleistungen',
          technologies: ['Jenkins', 'Docker', 'SonarQube', 'Vault'],
          projectDuration: '6 Monate',
          projectValue: 280000,
          completionDate: new Date('2025-11-20'),
          contactPerson: 'Maria Schmidt',
          testimonial: 'Die Deployment-Zeit wurde von Wochen auf Stunden reduziert. Eine echte Transformation unserer Entwicklungsprozesse.',
          isPublic: true,
          createdAt: new Date('2025-12-01'),
          updatedAt: new Date(),
        },
        {
          id: 'ref-3',
          customerId: 'cust-4',
          customerName: 'Firma D SE',
          projectTitle: 'E-Commerce Plattform Relaunch',
          description: 'Kompletter Relaunch der E-Commerce-Plattform mit modernem Tech-Stack. Implementierung von Microservices-Architektur und Headless CMS.',
          industry: 'E-Commerce',
          technologies: ['Next.js', 'Node.js', 'PostgreSQL', 'Redis', 'Stripe'],
          projectDuration: '10 Monate',
          projectValue: 520000,
          completionDate: new Date('2025-12-10'),
          contactPerson: 'Lisa Hoffmann',
          isPublic: false,
          createdAt: new Date('2026-01-05'),
          updatedAt: new Date(),
        },
      ]);
    }
  }, [references.length, customers.length, setReferences]);

  // Get customer name by ID
  const getCustomerName = (customerId: string): string => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.companyName || 'Unbekannter Kunde';
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      projectTitle: '',
      description: '',
      industry: '',
      technologies: '',
      projectDuration: '',
      projectValue: '',
      completionDate: '',
      contactPerson: '',
      testimonial: '',
      isPublic: true,
    });
  };

  const openModal = (reference?: Reference) => {
    if (reference) {
      setEditingReference(reference);
      setFormData({
        customerId: reference.customerId,
        projectTitle: reference.projectTitle,
        description: reference.description,
        industry: reference.industry || '',
        technologies: reference.technologies?.join(', ') || '',
        projectDuration: reference.projectDuration || '',
        projectValue: reference.projectValue?.toString() || '',
        completionDate: reference.completionDate
          ? new Date(reference.completionDate).toISOString().split('T')[0]
          : '',
        contactPerson: reference.contactPerson || '',
        testimonial: reference.testimonial || '',
        isPublic: reference.isPublic,
      });
    } else {
      setEditingReference(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingReference(null);
    resetForm();
  };

  const handleSave = () => {
    const customerName = getCustomerName(formData.customerId);
    const selectedCustomer = customers.find(c => c.id === formData.customerId);

    const referenceData: Reference = {
      id: editingReference?.id || `ref-${Date.now()}`,
      customerId: formData.customerId,
      customerName: customerName,
      projectTitle: formData.projectTitle,
      description: formData.description,
      industry: formData.industry || selectedCustomer?.industry || undefined,
      technologies: formData.technologies
        ? formData.technologies.split(',').map(t => t.trim()).filter(t => t)
        : undefined,
      projectDuration: formData.projectDuration || undefined,
      projectValue: formData.projectValue ? parseFloat(formData.projectValue) : undefined,
      completionDate: formData.completionDate ? new Date(formData.completionDate) : undefined,
      contactPerson: formData.contactPerson || selectedCustomer?.contactPerson || undefined,
      testimonial: formData.testimonial || undefined,
      isPublic: formData.isPublic,
      createdAt: editingReference?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (editingReference) {
      updateReference(editingReference.id, referenceData);
    } else {
      addReference(referenceData);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Möchten Sie diese Referenz wirklich löschen?')) {
      removeReference(id);
    }
  };

  const filteredReferences = useMemo(() => {
    return references.filter((reference) => {
      const matchesSearch =
        reference.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reference.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reference.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reference.technologies?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        reference.industry?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCustomer = !filterCustomerId || reference.customerId === filterCustomerId;

      return matchesSearch && matchesCustomer;
    });
  }, [references, searchQuery, filterCustomerId]);

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('de-DE', {
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Referenzen</h1>
            <p className="text-gray-600 mt-1">
              Verwalten Sie Ihre Projektreferenzen und Erfolgsgeschichten
            </p>
          </div>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => openModal()}>
            Neue Referenz
          </Button>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Nach Projekt, Kunde, Technologie oder Branche suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterCustomerId}
                onChange={(e) => setFilterCustomerId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Alle Kunden</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.companyName}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* References List */}
        {filteredReferences.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Keine Referenzen gefunden
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || filterCustomerId
                  ? 'Versuchen Sie eine andere Suche oder Filter'
                  : 'Fügen Sie Ihre erste Referenz hinzu'}
              </p>
              <Button onClick={() => openModal()}>Referenz anlegen</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReferences.map((reference) => (
              <Card key={reference.id} className="overflow-hidden">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Award className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {reference.projectTitle}
                          </h3>
                          {reference.isPublic ? (
                            <span title="Öffentlich"><Globe className="w-4 h-4 text-green-500" /></span>
                          ) : (
                            <span title="Intern"><Lock className="w-4 h-4 text-gray-400" /></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {reference.customerName}
                        </p>
                        {reference.industry && (
                          <p className="text-xs text-gray-400">{reference.industry}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {reference.projectValue && (
                        <Badge variant="success">{formatCurrency(reference.projectValue)}</Badge>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/references/${reference.id}/edit`)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(reference.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedReferenceId(
                          expandedReferenceId === reference.id ? null : reference.id
                        )}
                      >
                        {expandedReferenceId === reference.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Preview Info */}
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                    {reference.projectDuration && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {reference.projectDuration}
                      </span>
                    )}
                    {reference.completionDate && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        Abgeschlossen: {formatDate(reference.completionDate)}
                      </span>
                    )}
                  </div>

                  {/* Technologies */}
                  {reference.technologies && reference.technologies.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {reference.technologies.map((tech, index) => (
                        <Badge key={index} variant="default" size="sm">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Expanded Details */}
                  {expandedReferenceId === reference.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                      {/* Description */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Projektbeschreibung</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {reference.description}
                        </p>
                      </div>

                      {/* Testimonial */}
                      {reference.testimonial && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Quote className="w-4 h-4" /> Kundenstimme
                          </h4>
                          <blockquote className="text-sm text-gray-600 bg-amber-50 p-4 rounded border-l-4 border-amber-400 italic">
                            "{reference.testimonial}"
                            {reference.contactPerson && (
                              <footer className="mt-2 text-gray-500 not-italic">
                                — {reference.contactPerson}, {reference.customerName}
                              </footer>
                            )}
                          </blockquote>
                        </div>
                      )}

                      {/* Contact Person */}
                      {reference.contactPerson && !reference.testimonial && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Ansprechpartner</h4>
                          <p className="text-sm text-gray-600">{reference.contactPerson}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Reference Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingReference ? 'Referenz bearbeiten' : 'Neue Referenz'}
        size="lg"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kunde *</label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Kunde auswählen...</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Project Info */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Projekttitel *"
              value={formData.projectTitle}
              onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
              required
            />
            <Input
              label="Branche"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              placeholder="z.B. IT & Software"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Beschreiben Sie das Projekt und die durchgeführten Leistungen..."
              required
            />
          </div>

          {/* Technologies */}
          <Input
            label="Technologien"
            value={formData.technologies}
            onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
            placeholder="z.B. Azure, Kubernetes, Terraform (kommagetrennt)"
          />

          {/* Project Details */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Projektdetails</h4>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Projektdauer"
                value={formData.projectDuration}
                onChange={(e) => setFormData({ ...formData, projectDuration: e.target.value })}
                placeholder="z.B. 6 Monate"
              />
              <Input
                label="Projektwert (EUR)"
                type="number"
                value={formData.projectValue}
                onChange={(e) => setFormData({ ...formData, projectValue: e.target.value })}
                placeholder="z.B. 100000"
              />
              <Input
                label="Abschlussdatum"
                type="date"
                value={formData.completionDate}
                onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
              />
            </div>
          </div>

          {/* Contact & Testimonial */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Kundenstimme</h4>
            <Input
              label="Ansprechpartner"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              placeholder="Name des Kundenansprechpartners"
              className="mb-4"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial / Zitat</label>
              <textarea
                value={formData.testimonial}
                onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Kundenzitat oder Feedback zum Projekt..."
              />
            </div>
          </div>

          {/* Visibility */}
          <div className="border-t pt-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Öffentliche Referenz (kann in Angeboten verwendet werden)
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={closeModal}>Abbrechen</Button>
          <Button
            onClick={handleSave}
            disabled={!formData.customerId || !formData.projectTitle || !formData.description}
          >
            {editingReference ? 'Speichern' : 'Anlegen'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
