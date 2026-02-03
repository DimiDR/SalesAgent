'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { useStore } from '@/store/useStore';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // In production, this would use Firebase Auth
      // For demo, we'll just set a mock user
      if (formData.email && formData.password) {
        setUser({
          id: 'demo-user',
          email: formData.email,
          displayName: formData.email.split('@')[0],
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        router.push('/dashboard');
      } else {
        setError('Bitte E-Mail und Passwort eingeben');
      }
    } catch (err) {
      setError('Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setUser({
      id: 'demo-user',
      email: 'demo@example.com',
      displayName: 'Demo Benutzer',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            Willkommen zurück
          </h1>
          <p className="text-gray-600 mt-2">
            Melden Sie sich bei SalesAgent an
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <h2 className="text-lg font-semibold">Anmelden</h2>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                  {error}
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  name="email"
                  placeholder="E-Mail-Adresse"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  name="password"
                  placeholder="Passwort"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Angemeldet bleiben</span>
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Passwort vergessen?
                </Link>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Anmelden
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">oder</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleDemoLogin}
              >
                Als Demo-Benutzer fortfahren
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-600 mt-6">
          Noch kein Konto?{' '}
          <Link href="/auth/register" className="text-blue-600 hover:underline">
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
