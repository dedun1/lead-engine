'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/settings/admin', label: 'Overview', exact: true },
  { href: '/settings/admin/export', label: 'Data export' },
  { href: '/settings/admin/bulk', label: 'Bulk operations' },
  { href: '/settings/admin/audit', label: 'Audit log' },
];

export function AdminSubNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b pb-3">
      {LINKS.map(({ href, label, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent',
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
