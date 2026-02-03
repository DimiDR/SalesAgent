'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Building2,
  FileText,
  Settings,
  HelpCircle,
} from 'lucide-react';

const sidebarLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Angebote', icon: FolderOpen },
  { href: '/resources', label: 'Ressourcen', icon: Users },
  { href: '/customers', label: 'Kunden', icon: Building2 },
  { href: '/documents', label: 'Dokumente', icon: FileText },
];

const bottomLinks = [
  { href: '/settings', label: 'Einstellungen', icon: Settings },
  { href: '/help', label: 'Hilfe', icon: HelpCircle },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
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
      </nav>

      <div className="px-4 py-6 border-t border-gray-200">
        <div className="space-y-1">
          {bottomLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
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
    </aside>
  );
}
