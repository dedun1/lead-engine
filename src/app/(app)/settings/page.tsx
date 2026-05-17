import Link from 'next/link';
import {
  Activity,
  Ban,
  DollarSign,
  Key,
  MessageSquare,
} from 'lucide-react';

const SECTIONS = [
  {
    href: '/settings/health',
    label: 'Source Health',
    desc: 'Scraper status — green / yellow / red',
    icon: Activity,
  },
  {
    href: '/settings/blocklist',
    label: 'Blocklist Review',
    desc: 'Permanently blocked leads — review monthly',
    icon: Ban,
  },
  {
    href: '/settings/prompts',
    label: 'AI Prompts',
    desc: 'Haiku prompt templates (read-only)',
    icon: MessageSquare,
  },
  {
    href: '/settings/api-keys',
    label: 'API Keys',
    desc: 'Anthropic + optional paid sources, encrypted at rest',
    icon: Key,
  },
  {
    href: '/settings/pricing',
    label: 'Pricing Config',
    desc: 'Per-source unit costs used by the estimator',
    icon: DollarSign,
  },
];

export default function SettingsIndexPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Per-team configuration for Lead Engine.
        </p>
      </div>
      <ul className="space-y-2">
        {SECTIONS.map(({ href, label, desc, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
            >
              <Icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
