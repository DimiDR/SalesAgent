'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Building2 } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import type { Project, Customer } from '@/types';

export default function NewProjectPage() {
  const router = useRouter();
  const { addProject, user, customers, addCustomer } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    customerId: '',
    customer: '',
    description: '',
    deadline: '',
    proposalValue: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    companyName: '',
    contactPerson: '',
    contactEmail: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerId = e.target.value;
    if (customerId === 'new') {
      setIsNewCustomerModalOpen(true);
      return;
    }
    const selectedCustomer = customers.find(c => c.id === customerId);
    setFormData(prev => ({
      ...prev,
      customerId,
      customer: selectedCustomer?.companyName || '',
    }));
    if (errors.customerId) {
      setErrors(prev => ({ ...prev, customerId: '' }));
    }
  };

  const handleCreateNewCustomer = () => {
    if (!newCustomerData.companyName || !newCustomerData.contactPerson || !newCustomerData.contactEmail) {
      return;
    }

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      companyName: newCustomerData.companyName,
      contactPerson: newCustomerData.contactPerson,
      contactEmail: newCustomerData.contactEmail,
      proposals: [],
      appointments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addCustomer(newCustomer);
    setFormData(prev => ({
      ...prev,
      customerId: newCustomer.id,
      customer: newCustomer.companyName,
    }));
    setNewCustomerData({ companyName: '', contactPerson: '', contactEmail: '' });
    setIsNewCustomerModalOpen(false);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Angebotsname ist erforderlich';
    }
    if (!formData.customerId) {
      newErrors.customerId = 'Bitte wählen Sie einen Kunden aus';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);

    try {
      const newProject: Project = {
        id: crypto.randomUUID(),
        name: formData.name.trim(),
        customer: formData.customer.trim(),
        customerId: formData.customerId,
        description: formData.description.trim() || undefined,
        deadline: formData.deadline ? new Date(formData.deadline) : undefined,
        proposalValue: formData.proposalValue ? parseFloat(formData.proposalValue) : undefined,
        status: 'active',
        currentStep: 'rfp_received',
        createdBy: user?.id || 'unknown',
        teamMembers: [user?.id || 'unknown'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // In production, this would save to Firebase
      addProject(newProject);

      router.push(`/project/${newProject.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zum Dashboard
        </Link>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <h1 className="text-xl font-semibold">Neues Angebot erstellen</h1>
              <p className="text-gray-500 mt-1">
                Erfassen Sie die Grunddaten für das neue Angebot
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <Input
                label="Angebotsname *"
                name="name"
                placeholder="z.B. Cloud Migration Kunde X"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
              />

              {/* Kundenauswahl */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kunde *
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleCustomerChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white ${
                        errors.customerId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Kunde auswählen...</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.companyName} ({customer.contactPerson})
                        </option>
                      ))}
                      <option value="new">+ Neuen Kunden anlegen</option>
                    </select>
                  </div>
                </div>
                {errors.customerId && (
                  <p className="mt-1 text-sm text-red-500">{errors.customerId}</p>
                )}
                {formData.customerId && (
                  <p className="mt-1 text-sm text-gray-500">
                    Ausgewählt: {formData.customer}
                  </p>
                )}
              </div>

              <Textarea
                label="Beschreibung"
                name="description"
                placeholder="Kurze Beschreibung des Angebots..."
                value={formData.description}
                onChange={handleChange}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Angebotsfrist"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleChange}
                  helperText="Bis wann muss das Angebot eingereicht werden?"
                />
                <Input
                  label="Angebotswert (EUR)"
                  name="proposalValue"
                  type="number"
                  placeholder="z.B. 50000"
                  value={formData.proposalValue}
                  onChange={handleChange}
                  helperText="Geschätzter Angebotswert"
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-4">
              <Link href="/dashboard">
                <Button type="button" variant="ghost">
                  Abbrechen
                </Button>
              </Link>
              <Button type="submit" isLoading={isLoading}>
                Angebot erstellen
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>

      {/* Neuen Kunden anlegen Modal */}
      <Modal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        title="Neuen Kunden anlegen"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Firmenname *"
            value={newCustomerData.companyName}
            onChange={(e) => setNewCustomerData(prev => ({ ...prev, companyName: e.target.value }))}
            placeholder="z.B. Firma XYZ GmbH"
          />
          <Input
            label="Ansprechpartner *"
            value={newCustomerData.contactPerson}
            onChange={(e) => setNewCustomerData(prev => ({ ...prev, contactPerson: e.target.value }))}
            placeholder="z.B. Max Mustermann"
          />
          <Input
            label="E-Mail *"
            type="email"
            value={newCustomerData.contactEmail}
            onChange={(e) => setNewCustomerData(prev => ({ ...prev, contactEmail: e.target.value }))}
            placeholder="z.B. kontakt@firma.de"
          />
          <p className="text-sm text-gray-500">
            Weitere Kundendaten können Sie später in der Kundenübersicht ergänzen.
          </p>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsNewCustomerModalOpen(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleCreateNewCustomer}
            disabled={!newCustomerData.companyName || !newCustomerData.contactPerson || !newCustomerData.contactEmail}
          >
            Kunde anlegen
          </Button>
        </div>
      </Modal>
    </div>
  );
}
