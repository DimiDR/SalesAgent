'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useStore } from '@/store/useStore';
import { Employee, Skill, Certification, ProjectExperience } from '@/types';

export default function EditResourcePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { employees, updateEmployee } = useStore();
  const employee = employees.find((e) => e.id === id);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    availability: 'available' as Employee['availability'],
  });
  const [skills, setSkills] = useState<Skill[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [projectExperience, setProjectExperience] = useState<ProjectExperience[]>([]);

  const [newSkill, setNewSkill] = useState({ name: '', level: 'intermediate' as Skill['level'], yearsOfExperience: '' });
  const [newCert, setNewCert] = useState({ name: '', issuer: '', dateObtained: '', expiryDate: '', credentialId: '' });
  const [newExp, setNewExp] = useState({ projectName: '', role: '', duration: '', description: '', technologies: '' });

  useEffect(() => {
    if (employee) {
      setFormData({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone || '',
        position: employee.position,
        department: employee.department || '',
        availability: employee.availability,
      });
      setSkills([...employee.skills]);
      setCertifications([...employee.certifications]);
      setProjectExperience([...employee.projectExperience]);
    }
  }, [employee]);

  const handleAddSkill = () => {
    if (newSkill.name) {
      setSkills([...skills, {
        id: `skill-${Date.now()}`,
        name: newSkill.name,
        level: newSkill.level,
        yearsOfExperience: newSkill.yearsOfExperience ? parseInt(newSkill.yearsOfExperience) : undefined,
      }]);
      setNewSkill({ name: '', level: 'intermediate', yearsOfExperience: '' });
    }
  };

  const handleAddCertification = () => {
    if (newCert.name && newCert.issuer) {
      setCertifications([...certifications, {
        id: `cert-${Date.now()}`,
        name: newCert.name,
        issuer: newCert.issuer,
        dateObtained: new Date(newCert.dateObtained),
        expiryDate: newCert.expiryDate ? new Date(newCert.expiryDate) : undefined,
        credentialId: newCert.credentialId || undefined,
      }]);
      setNewCert({ name: '', issuer: '', dateObtained: '', expiryDate: '', credentialId: '' });
    }
  };

  const handleAddExperience = () => {
    if (newExp.projectName && newExp.role) {
      setProjectExperience([...projectExperience, {
        id: `exp-${Date.now()}`,
        projectName: newExp.projectName,
        role: newExp.role,
        duration: newExp.duration,
        description: newExp.description || undefined,
        technologies: newExp.technologies ? newExp.technologies.split(',').map(t => t.trim()) : undefined,
      }]);
      setNewExp({ projectName: '', role: '', duration: '', description: '', technologies: '' });
    }
  };

  const handleSave = () => {
    if (!employee) return;

    const employeeData: Partial<Employee> = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone || undefined,
      position: formData.position,
      department: formData.department || undefined,
      skills,
      certifications,
      projectExperience,
      availability: formData.availability,
      updatedAt: new Date(),
    };

    updateEmployee(employee.id, employeeData);
    router.push('/resources');
  };

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Mitarbeiter nicht gefunden
              </h3>
              <Button onClick={() => router.push('/resources')}>
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
          <Button variant="ghost" onClick={() => router.push('/resources')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mitarbeiter bearbeiten</h1>
            <p className="text-gray-600 mt-1">
              {employee.firstName} {employee.lastName}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="py-6">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Vorname"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
                <Input
                  label="Nachname"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="E-Mail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Input
                  label="Telefon"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  required
                />
                <Input
                  label="Abteilung"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verfügbarkeit</label>
                <select
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value as Employee['availability'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="available">Verfügbar</option>
                  <option value="partially_available">Teilweise verfügbar</option>
                  <option value="unavailable">Nicht verfügbar</option>
                </select>
              </div>

              {/* Skills Section */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Skills</h4>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded"
                      >
                        {skill.name} ({skill.level})
                        <button
                          onClick={() => setSkills(skills.filter((_, i) => i !== idx))}
                          className="hover:text-blue-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Skill Name"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                    className="flex-1"
                  />
                  <select
                    value={newSkill.level}
                    onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value as Skill['level'] })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="beginner">Anfänger</option>
                    <option value="intermediate">Mittel</option>
                    <option value="advanced">Fortgeschritten</option>
                    <option value="expert">Experte</option>
                  </select>
                  <Input
                    placeholder="Jahre"
                    type="number"
                    value={newSkill.yearsOfExperience}
                    onChange={(e) => setNewSkill({ ...newSkill, yearsOfExperience: e.target.value })}
                    className="w-20"
                  />
                  <Button variant="outline" onClick={handleAddSkill}>+</Button>
                </div>
              </div>

              {/* Certifications Section */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Zertifizierungen</h4>
                {certifications.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {certifications.map((cert, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div>
                          <span className="text-sm font-medium">{cert.name}</span>
                          <span className="text-xs text-gray-500 ml-2">({cert.issuer})</span>
                        </div>
                        <button
                          onClick={() => setCertifications(certifications.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Input
                    placeholder="Zertifikatsname"
                    value={newCert.name}
                    onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                  />
                  <Input
                    placeholder="Aussteller"
                    value={newCert.issuer}
                    onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder="Erhalten am"
                    value={newCert.dateObtained}
                    onChange={(e) => setNewCert({ ...newCert, dateObtained: e.target.value })}
                  />
                  <Input
                    type="date"
                    placeholder="Ablauf (optional)"
                    value={newCert.expiryDate}
                    onChange={(e) => setNewCert({ ...newCert, expiryDate: e.target.value })}
                  />
                  <Button variant="outline" onClick={handleAddCertification}>+</Button>
                </div>
              </div>

              {/* Project Experience Section */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Projekterfahrung</h4>
                {projectExperience.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {projectExperience.map((exp, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div>
                          <span className="text-sm font-medium">{exp.projectName}</span>
                          <span className="text-xs text-gray-500 ml-2">({exp.role})</span>
                        </div>
                        <button
                          onClick={() => setProjectExperience(projectExperience.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Input
                    placeholder="Projektname"
                    value={newExp.projectName}
                    onChange={(e) => setNewExp({ ...newExp, projectName: e.target.value })}
                  />
                  <Input
                    placeholder="Rolle"
                    value={newExp.role}
                    onChange={(e) => setNewExp({ ...newExp, role: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Dauer (z.B. 6 Monate)"
                    value={newExp.duration}
                    onChange={(e) => setNewExp({ ...newExp, duration: e.target.value })}
                  />
                  <Input
                    placeholder="Technologien (kommasepariert)"
                    value={newExp.technologies}
                    onChange={(e) => setNewExp({ ...newExp, technologies: e.target.value })}
                  />
                  <Button variant="outline" onClick={handleAddExperience}>+</Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => router.push('/resources')}>Abbrechen</Button>
              <Button onClick={handleSave} disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.position}>
                Speichern
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
