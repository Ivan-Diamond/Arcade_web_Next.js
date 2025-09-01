'use client';

import { Menu } from 'lucide-react';
import { VisitorStatusBadge } from '@/components/visitor-upgrade-prompt';

interface MainNavProps {
  setIsSidebarOpen: (open: boolean) => void;
  user: any;
}

export function MainNav({ setIsSidebarOpen, user }: MainNavProps) {
  return (
    <header className="md:hidden sticky top-0 z-30 bg-dark-card border-b border-dark-border p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
        >
          <Menu className="h-6 w-6 text-dark-text" />
        </button>
        <h1 className="text-xl font-bold text-dark-text">MSA Arcade</h1>
        <div className="flex items-center gap-2">
          <VisitorStatusBadge />
          <div className="text-sm text-dark-muted">
            {user?.coins ?? 0} coins
          </div>
        </div>
      </div>
    </header>
  );
}
