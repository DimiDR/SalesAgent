'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Plus, FolderOpen, Clock, CheckCircle, TrendingUp, FileText } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useStore } from '@/store/useStore';
import { WORKFLOW_STEPS } from '@/types';

export default function DashboardPage() {
  const { projects, user, setUser, setProjects } = useStore();

  useEffect(() => {
    // Mock user if not logged in
    if (!user) {
      setUser({
        id: 'demo-user',
        email: 'demo@example.com',
        displayName: 'Demo Benutzer',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Mock some projects for demo
    if (projects.length === 0) {
      setProjects([
        {
          id: 'project-1',
          name: 'Cloud Migration Kunde A',
          customer: 'Firma A GmbH',
          description: 'Vollständige Cloud-Migration auf Azure',
          deadline: new Date('2026-03-15'),
          status: 'active',
          currentStep: 'proposal_created',
          createdBy: 'demo-user',
          teamMembers: ['demo-user'],
          createdAt: new Date('2026-01-15'),
          updatedAt: new Date(),
        },
        {
          id: 'project-2',
          name: 'DevOps Transformation',
          customer: 'Firma B AG',
          description: 'Einführung von CI/CD und Kubernetes',
          deadline: new Date('2026-04-01'),
          status: 'active',
          currentStep: 'questions_formulated',
          createdBy: 'demo-user',
          teamMembers: ['demo-user'],
          createdAt: new Date('2026-01-20'),
          updatedAt: new Date(),
        },
        {
          id: 'project-3',
          name: 'Security Audit',
          customer: 'Firma C KG',
          description: 'Umfassendes Sicherheitsaudit und Penetration Testing',
          status: 'completed',
          currentStep: 'proposal_sent',
          createdBy: 'demo-user',
          teamMembers: ['demo-user'],
          createdAt: new Date('2026-01-05'),
          updatedAt: new Date(),
        },
      ]);
    }
  }, [user, projects.length, setUser, setProjects]);

  const activeProjects = projects.filter((p) => p.status === 'active');
  const completedProjects = projects.filter((p) => p.status === 'completed');

  const getStepLabel = (step: string) => {
    return WORKFLOW_STEPS.find((s) => s.step === step)?.label || step;
  };

  const getStepIndex = (step: string) => {
    return WORKFLOW_STEPS.findIndex((s) => s.step === step) + 1;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Willkommen zurück, {user?.displayName}
            </h1>
            <p className="text-gray-600 mt-1">
              Hier ist eine Übersicht Ihrer aktiven Angebote
            </p>
          </div>
          <Link href="/project/new">
            <Button leftIcon={<Plus className="w-4 h-4" />}>
              Neues Angebot
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FolderOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeProjects.length}
                  </p>
                  <p className="text-sm text-gray-500">Aktive Angebote</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {completedProjects.length}
                  </p>
                  <p className="text-sm text-gray-500">Abgeschlossen</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeProjects.filter((p) => p.deadline).length}
                  </p>
                  <p className="text-sm text-gray-500">Mit Deadline</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">85%</p>
                  <p className="text-sm text-gray-500">Erfolgsrate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Projects */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Aktive Angebote</h2>
              <Link
                href="/projects"
                className="text-sm text-blue-600 hover:underline"
              >
                Alle anzeigen
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeProjects.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Keine aktiven Angebote</p>
                <Link href="/project/new">
                  <Button variant="outline" className="mt-4">
                    Erstes Angebot erstellen
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/project/${project.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-gray-900 truncate">
                            {project.name}
                          </h3>
                          <Badge variant="info">
                            Schritt {getStepIndex(project.currentStep)}/5
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {project.customer}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium text-gray-700">
                          {getStepLabel(project.currentStep)}
                        </p>
                        {project.deadline && (
                          <p className="text-xs text-gray-500 mt-1">
                            Frist:{' '}
                            {new Date(project.deadline).toLocaleDateString(
                              'de-DE'
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Schnellaktionen</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/project/new">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Neues Angebot anlegen
                </Button>
              </Link>
              <Link href="/documents">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Dokumente verwalten
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Statistiken ansehen
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
