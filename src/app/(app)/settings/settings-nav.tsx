'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Ban,
  DollarSign,
  Key,
  MessageSquare,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/settings/health', label: 'Health', icon: Activity },
  { href: '/settings/blocklist', label: 'Blocklist', icon: Ban },
  { href: '/settings/prompts', label: 'Prompts', icon: MessageSquare },
  { href: '/settings/api-keys', label: 'API Keys', icon: Key },
  { href: '/settings/pricing', label: 'Pricing', icon: DollarSign },
];

export function SettingsNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="w-48 shrink-0 space-y-1">
      <Link
        href="/settings"
        className="mb-3 block text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        ← All settings
      </Link>
      {isAdmin && (
        <>
          <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Admin
          </p>
          <Link
            href="/settings/admin"
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
              pathname.startsWith('/settings/admin')
                ? 'bg-accent font-medium'
                : 'text-muted-foreground hover:bg-accent/50',
            )}
          >
            <Shield className="h-4 w-4" />
            Admin tools
          </Link>
        </>
      )}
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
              active ? 'bg-accent font-medium' : 'text-muted-foreground hover:bg-accent/50',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
