'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Factory,
  Flame,
  Inbox,
  Phone,
  ScrollText,
  Settings,
  Target,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SignOutButton } from './sign-out-button';

// Order matches PROJECT_SPEC §12. Badges (e.g. trigger count on Hot List) are
// added in later phases — left empty for now.
const NAV = [
  { href: '/hot-list', label: 'Hot List', icon: Flame },
  { href: '/call-queue', label: 'Call Queue', icon: Phone },
  { href: '/pipeline', label: 'Lead Pipeline', icon: Inbox },
  { href: '/generator', label: 'Lead Generator', icon: Target },
  { href: '/niches', label: 'Niche Explorer', icon: Factory },
  { href: '/dashboard', label: 'Learning Dashboard', icon: BarChart3 },
  { href: '/history', label: 'Generation History', icon: ScrollText },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

export function Sidebar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        // 64px collapsed → 240px on hover, per PROJECT_SPEC §12.
        'group/sidebar fixed inset-y-0 left-0 z-30 flex w-16 flex-col overflow-hidden',
        'border-r border-border bg-card transition-[width] duration-150 ease-out',
        'hover:w-60',
      )}
    >
      <div className="flex h-14 items-center px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
          L
        </div>
        <span className="ml-3 whitespace-nowrap text-sm font-semibold opacity-0 transition-opacity group-hover/sidebar:opacity-100">
          Lead Engine
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex h-10 items-center rounded-md px-3 text-sm transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="ml-3 whitespace-nowrap opacity-0 transition-opacity group-hover/sidebar:opacity-100">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-2">
        <div className="overflow-hidden text-ellipsis whitespace-nowrap px-3 pb-2 text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover/sidebar:opacity-100">
          {userEmail ?? 'Signed out'}
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
