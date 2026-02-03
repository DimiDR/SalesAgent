'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useStore } from '@/store/useStore';
import { Customer } from '@/types';

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { customers, updateCustomer } = useStore();
  const customer = customers.find((c) => c.id === id);

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

  useEffect(() => {
    if (customer) {
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
    }
  }, [customer]);

  const handleSave = () => {
    if (!customer) return;

    const customerData: Partial<Customer> = {
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
      updatedAt: new Date(),
    };

    updateCustomer(customer.id, customerData);
    router.push('/customers');
  };

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Kunde nicht gefunden
              </h3>
              <Button onClick={() => router.push('/customers')}>
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
          <Button variant="ghost" onClick={() => router.push('/customers')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kunde bearbeiten</h1>
            <p className="text-gray-600 mt-1">
              {customer.companyName}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="py-6">
            <div className="space-y-6">
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
              <Button variant="outline" onClick={() => router.push('/customers')}>Abbrechen</Button>
              <Button onClick={handleSave} disabled={!formData.companyName || !formData.contactPerson || !formData.contactEmail}>
                Speichern
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
