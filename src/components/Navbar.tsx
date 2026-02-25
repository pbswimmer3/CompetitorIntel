'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Activity, Building2, FileText, TrendingUp, Briefcase, GitBranch, Scale } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Activity },
  { href: '/briefing', label: 'Briefing', icon: FileText },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/github', label: 'GitHub', icon: GitBranch },
  { href: '/sec', label: 'SEC Filings', icon: Scale },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg">CompetitorIntel</span>
            </Link>

            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span>Process Mining Intelligence</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
