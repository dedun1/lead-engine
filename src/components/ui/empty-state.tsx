import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  icon: LucideIcon;
  headline: string;
  description: string;
  ctaLabel: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  learnMoreHref?: string;
  children?: React.ReactNode;
};

export function EmptyState({
  icon: Icon,
  headline,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
  learnMoreHref,
  children,
}: Props) {
  const cta =
    ctaHref != null ? (
      <Button asChild>
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    ) : (
      <Button type="button" onClick={onCtaClick}>
        {ctaLabel}
      </Button>
    );

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <Icon className="mb-4 h-16 w-16 text-muted-foreground/60" strokeWidth={1.25} />
      <h2 className="text-xl font-semibold tracking-tight">{headline}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {children}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {cta}
        {learnMoreHref && (
          <Button variant="ghost" asChild>
            <Link href={learnMoreHref}>Learn more</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
