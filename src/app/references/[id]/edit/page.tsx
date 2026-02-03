'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useStore } from '@/store/useStore';
import { Reference } from '@/types';

export default function EditReferencePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { references, updateReference, customers } = useStore();
  const reference = references.find((r) => r.id === id);

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
    if (reference) {
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
    }
  }, [reference]);

  const getCustomerName = (customerId: string): string => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.companyName || 'Unbekannter Kunde';
  };

  const handleSave = () => {
    if (!reference) return;

    const customerName = getCustomerName(formData.customerId);
    const selectedCustomer = customers.find(c => c.id === formData.customerId);

    const referenceData: Partial<Reference> = {
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
      updatedAt: new Date(),
    };

    updateReference(reference.id, referenceData);
    router.push('/references');
  };

  if (!reference) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Referenz nicht gefunden
              </h3>
              <Button onClick={() => router.push('/references')}>
                Zurück zur Übersicht
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.push('/references')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Referenz bearbeiten</h1>
            <p className="text-gray-600 mt-1">
              {reference.projectTitle}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="py-6">
            <div className="space-y-6">
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
              <Button variant="outline" onClick={() => router.push('/references')}>Abbrechen</Button>
              <Button
                onClick={handleSave}
                disabled={!formData.customerId || !formData.projectTitle || !formData.description}
              >
                Speichern
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
