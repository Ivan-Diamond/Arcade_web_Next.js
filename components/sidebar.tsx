'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { UserInfo } from '@/components/user-info';
import { VisitorStatusBadge } from '@/components/visitor-upgrade-prompt';

interface SidebarProps {
  navItems: Array<{
    href: string;
    label: string;
    icon: any;
  }>;
  pathname: string;
  user: any;
  handleLogout: () => void;
}

export function Sidebar({ navItems, pathname, user, handleLogout }: SidebarProps) {
  return (
    <aside className="hidden md:flex w-64 bg-dark-card border-r border-dark-border flex-col">
      <UserInfo user={user} />
      
      {/* Visitor Status Badge */}
      {user?.isVisitor && (
        <div className="px-4 pb-2">
          <VisitorStatusBadge />
        </div>
      )}
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                      : 'text-dark-text hover:bg-dark-hover'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Logout Button */}
      <div className="p-4 border-t border-dark-border">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-dark-text hover:bg-dark-hover w-full transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
