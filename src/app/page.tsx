'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, FileText, Users, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { useStore } from '@/store/useStore';

export default function Home() {
  const router = useRouter();
  const { user } = useStore();

  useEffect(() => {
    // If user is logged in, redirect to dashboard
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const features = [
    {
      icon: FileText,
      title: 'RFP-Analyse',
      description: 'Automatische Analyse von RFP-Dokumenten mit KI-Unterstützung',
    },
    {
      icon: Sparkles,
      title: 'KI-Generierung',
      description: 'Generierung von Fragen, Agenden und Angebotsinhalten',
    },
    {
      icon: Users,
      title: 'Team-Kollaboration',
      description: 'Einfache Zusammenarbeit im Team mit Aufgabenzuweisung',
    },
    {
      icon: TrendingUp,
      title: 'Workflow-Management',
      description: 'Strukturierter 5-Schritte-Prozess für jeden Angebotsprozess',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="font-bold text-xl text-gray-900">SalesAgent</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Anmelden</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Demo starten</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Powered by xAI Grok 4.1
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            KI-gestütztes{' '}
            <span className="text-blue-600">RFP-Management</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Automatisieren Sie Ihre Angebotsprozesse mit künstlicher Intelligenz.
            Von der RFP-Analyse bis zum fertigen Angebot - in einem
            strukturierten Workflow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Kostenlos starten
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg">
                Mehr erfahren
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="mt-32">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Alles, was Sie brauchen
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workflow Preview */}
        <div className="mt-32">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            5-Schritte-Workflow
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Ein strukturierter Prozess führt Sie durch jeden Angebotsprozess -
            von der ersten Analyse bis zum Versand.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { num: 1, label: 'RFP Erhalten' },
              { num: 2, label: 'Fragen Stellen' },
              { num: 3, label: 'Kundentermin' },
              { num: 4, label: 'Angebot Erstellen' },
              { num: 5, label: 'Angebot Senden' },
            ].map((step, index) => (
              <div key={step.num} className="flex items-center">
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-5 py-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    {step.num}
                  </div>
                  <span className="font-medium text-gray-700">{step.label}</span>
                </div>
                {index < 4 && (
                  <ArrowRight className="w-5 h-5 text-gray-300 mx-2 hidden lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 bg-blue-600 rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Bereit, loszulegen?
          </h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            Starten Sie noch heute mit SalesAgent und erleben Sie, wie KI Ihren
            Angebotsprozess revolutioniert.
          </p>
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              Demo starten
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 mt-20 border-t border-gray-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <span className="font-semibold text-gray-900">SalesAgent</span>
          </div>
          <p className="text-gray-500 text-sm">
            &copy; 2026 SalesAgent. Alle Rechte vorbehalten.
          </p>
        </div>
      </footer>
    </div>
  );
}
