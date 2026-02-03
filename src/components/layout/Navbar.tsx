'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Building2,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Settings,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useStore } from '@/store/useStore';

export default function Navbar() {
  const pathname = usePathname();
  const { user, notifications, setUser } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/projects', label: 'Angebote', icon: FolderOpen },
    { href: '/resources', label: 'Ressourcen', icon: Users },
    { href: '/customers', label: 'Kunden', icon: Building2 },
  ];

  const handleLogout = () => {
    setUser(null);
    window.location.href = '/auth/login';
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="font-semibold text-xl text-gray-900 hidden sm:block">
                SalesAgent
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                      ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user?.displayName || 'Benutzer'}
                </span>
              </button>

              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Einstellungen
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Abmelden
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-lg
                    ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
