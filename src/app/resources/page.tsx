'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, User, Award, Briefcase, ChevronDown, ChevronUp, Edit2, Trash2, X } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import { Employee, Skill, Certification, ProjectExperience } from '@/types';

export default function ResourcesPage() {
  const router = useRouter();
  const { employees, setEmployees, addEmployee, updateEmployee, removeEmployee } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'partially_available' | 'unavailable'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);

  // Form state
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

  // New skill form
  const [newSkill, setNewSkill] = useState({ name: '', level: 'intermediate' as Skill['level'], yearsOfExperience: '' });
  const [newCert, setNewCert] = useState({ name: '', issuer: '', dateObtained: '', expiryDate: '', credentialId: '' });
  const [newExp, setNewExp] = useState({ projectName: '', role: '', duration: '', description: '', technologies: '' });

  useEffect(() => {
    // Mock data for demo
    if (employees.length === 0) {
      setEmployees([
        {
          id: 'emp-1',
          firstName: 'Max',
          lastName: 'Mustermann',
          email: 'max.mustermann@company.de',
          phone: '+49 123 456789',
          position: 'Senior Cloud Architect',
          department: 'Cloud Services',
          skills: [
            { id: 'skill-1', name: 'Azure', level: 'expert', yearsOfExperience: 5 },
            { id: 'skill-2', name: 'Kubernetes', level: 'advanced', yearsOfExperience: 3 },
            { id: 'skill-3', name: 'Terraform', level: 'advanced', yearsOfExperience: 4 },
          ],
          certifications: [
            { id: 'cert-1', name: 'Azure Solutions Architect Expert', issuer: 'Microsoft', dateObtained: new Date('2023-05-15') },
            { id: 'cert-2', name: 'CKA - Certified Kubernetes Administrator', issuer: 'CNCF', dateObtained: new Date('2022-08-20') },
          ],
          projectExperience: [
            { id: 'exp-1', projectName: 'Cloud Migration Firma A', role: 'Lead Architect', duration: '8 Monate', technologies: ['Azure', 'Terraform', 'Docker'] },
            { id: 'exp-2', projectName: 'Kubernetes Platform', role: 'Technical Lead', duration: '12 Monate', technologies: ['Kubernetes', 'Helm', 'ArgoCD'] },
          ],
          availability: 'available',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'emp-2',
          firstName: 'Anna',
          lastName: 'Schmidt',
          email: 'anna.schmidt@company.de',
          position: 'DevOps Engineer',
          department: 'DevOps',
          skills: [
            { id: 'skill-4', name: 'CI/CD', level: 'expert', yearsOfExperience: 6 },
            { id: 'skill-5', name: 'Jenkins', level: 'advanced', yearsOfExperience: 4 },
            { id: 'skill-6', name: 'Python', level: 'intermediate', yearsOfExperience: 2 },
          ],
          certifications: [
            { id: 'cert-3', name: 'AWS DevOps Professional', issuer: 'Amazon', dateObtained: new Date('2024-01-10') },
          ],
          projectExperience: [
            { id: 'exp-3', projectName: 'DevOps Transformation B AG', role: 'DevOps Engineer', duration: '6 Monate', technologies: ['Jenkins', 'GitLab CI', 'AWS'] },
          ],
          availability: 'partially_available',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'emp-3',
          firstName: 'Thomas',
          lastName: 'Müller',
          email: 'thomas.mueller@company.de',
          position: 'Security Consultant',
          department: 'Security',
          skills: [
            { id: 'skill-7', name: 'Penetration Testing', level: 'expert', yearsOfExperience: 7 },
            { id: 'skill-8', name: 'SIEM', level: 'advanced', yearsOfExperience: 4 },
          ],
          certifications: [
            { id: 'cert-4', name: 'CISSP', issuer: 'ISC2', dateObtained: new Date('2021-03-15') },
            { id: 'cert-5', name: 'CEH', issuer: 'EC-Council', dateObtained: new Date('2020-06-20') },
          ],
          projectExperience: [
            { id: 'exp-4', projectName: 'Security Audit Firma C', role: 'Lead Auditor', duration: '3 Monate', technologies: ['Nessus', 'Burp Suite', 'Splunk'] },
          ],
          availability: 'unavailable',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }
  }, [employees.length, setEmployees]);

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      availability: 'available',
    });
    setSkills([]);
    setCertifications([]);
    setProjectExperience([]);
    setNewSkill({ name: '', level: 'intermediate', yearsOfExperience: '' });
    setNewCert({ name: '', issuer: '', dateObtained: '', expiryDate: '', credentialId: '' });
    setNewExp({ projectName: '', role: '', duration: '', description: '', technologies: '' });
  };

  const openModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
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
    } else {
      setEditingEmployee(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    resetForm();
  };

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
    const employeeData: Employee = {
      id: editingEmployee?.id || `emp-${Date.now()}`,
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
      createdAt: editingEmployee?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, employeeData);
    } else {
      addEmployee(employeeData);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Möchten Sie diesen Mitarbeiter wirklich löschen?')) {
      removeEmployee(id);
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.skills.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesAvailability =
      availabilityFilter === 'all' || employee.availability === availabilityFilter;
    return matchesSearch && matchesAvailability;
  });

  const getAvailabilityBadge = (availability: Employee['availability']) => {
    switch (availability) {
      case 'available':
        return <Badge variant="success">Verfügbar</Badge>;
      case 'partially_available':
        return <Badge variant="warning">Teilweise verfügbar</Badge>;
      case 'unavailable':
        return <Badge variant="error">Nicht verfügbar</Badge>;
    }
  };

  const getSkillLevelBadge = (level: Skill['level']) => {
    switch (level) {
      case 'expert':
        return <Badge variant="success" size="sm">Experte</Badge>;
      case 'advanced':
        return <Badge variant="info" size="sm">Fortgeschritten</Badge>;
      case 'intermediate':
        return <Badge variant="warning" size="sm">Mittel</Badge>;
      case 'beginner':
        return <Badge variant="default" size="sm">Anfänger</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ressourcen</h1>
            <p className="text-gray-600 mt-1">
              Verwalten Sie Ihre Mitarbeiter, Skills und Zertifizierungen
            </p>
          </div>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => openModal()}>
            Neuer Mitarbeiter
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Nach Namen, Position oder Skills suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={availabilityFilter === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setAvailabilityFilter('all')}
                >
                  Alle ({employees.length})
                </Button>
                <Button
                  variant={availabilityFilter === 'available' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setAvailabilityFilter('available')}
                >
                  Verfügbar ({employees.filter((e) => e.availability === 'available').length})
                </Button>
                <Button
                  variant={availabilityFilter === 'partially_available' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setAvailabilityFilter('partially_available')}
                >
                  Teilweise ({employees.filter((e) => e.availability === 'partially_available').length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employees List */}
        {filteredEmployees.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Keine Mitarbeiter gefunden
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery
                  ? 'Versuchen Sie eine andere Suche'
                  : 'Fügen Sie Ihren ersten Mitarbeiter hinzu'}
              </p>
              <Button onClick={() => openModal()}>Mitarbeiter anlegen</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} className="overflow-hidden">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">{employee.position}</p>
                        {employee.department && (
                          <p className="text-xs text-gray-400">{employee.department}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getAvailabilityBadge(employee.availability)}
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/resources/${employee.id}/edit`)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(employee.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedEmployeeId(
                          expandedEmployeeId === employee.id ? null : employee.id
                        )}
                      >
                        {expandedEmployeeId === employee.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Skills Preview */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {employee.skills.slice(0, 5).map((skill) => (
                      <span
                        key={skill.id}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {skill.name}
                      </span>
                    ))}
                    {employee.skills.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                        +{employee.skills.length - 5} weitere
                      </span>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {expandedEmployeeId === employee.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
                      {/* Contact */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Kontakt</h4>
                        <p className="text-sm text-gray-600">{employee.email}</p>
                        {employee.phone && (
                          <p className="text-sm text-gray-600">{employee.phone}</p>
                        )}
                      </div>

                      {/* Skills */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Briefcase className="w-4 h-4" /> Skills
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {employee.skills.map((skill) => (
                            <div
                              key={skill.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <span className="text-sm text-gray-700">{skill.name}</span>
                              <div className="flex items-center gap-2">
                                {skill.yearsOfExperience && (
                                  <span className="text-xs text-gray-500">
                                    {skill.yearsOfExperience}J
                                  </span>
                                )}
                                {getSkillLevelBadge(skill.level)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Certifications */}
                      {employee.certifications.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Award className="w-4 h-4" /> Zertifizierungen
                          </h4>
                          <div className="space-y-2">
                            {employee.certifications.map((cert) => (
                              <div
                                key={cert.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded"
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-700">{cert.name}</p>
                                  <p className="text-xs text-gray-500">{cert.issuer}</p>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(cert.dateObtained).toLocaleDateString('de-DE')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Project Experience */}
                      {employee.projectExperience.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Projekterfahrung</h4>
                          <div className="space-y-3">
                            {employee.projectExperience.map((exp) => (
                              <div key={exp.id} className="p-3 bg-gray-50 rounded">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-gray-700">{exp.projectName}</p>
                                    <p className="text-xs text-gray-500">{exp.role}</p>
                                  </div>
                                  <span className="text-xs text-gray-500">{exp.duration}</span>
                                </div>
                                {exp.technologies && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {exp.technologies.map((tech, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                                      >
                                        {tech}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
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

      {/* Add/Edit Employee Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingEmployee ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'} size="lg">
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
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
          <Button variant="outline" onClick={closeModal}>Abbrechen</Button>
          <Button onClick={handleSave} disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.position}>
            {editingEmployee ? 'Speichern' : 'Anlegen'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
