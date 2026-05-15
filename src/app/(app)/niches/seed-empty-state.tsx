'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Factory } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { runSeed } from './actions';

export function SeedEmptyState({
  isAdmin,
  hasNiches,
}: {
  isAdmin: boolean;
  hasNiches: boolean;
}) {
  const router = useRouter();
  const [nichesDone, setNichesDone] = useState(hasNiches);
  const [busy, setBusy] = useState<'niches' | 'shortlist' | null>(null);

  async function handleSeed(type: 'niches' | 'shortlist') {
    setBusy(type);
    const toastId = toast.loading(
      type === 'niches' ? 'Seeding niches…' : 'Loading shortlist…',
    );
    const result = await runSeed(type);
    setBusy(null);
    toast.dismiss(toastId);
    if (!result.ok) {
      toast.error(result.error);
      if (result.stdout) console.error(result.stdout);
      return;
    }
    toast.success(result.stdout || 'Done');
    if (type === 'niches') {
      setNichesDone(true);
      router.refresh();
    } else {
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <Card className="max-w-lg text-center">
        <CardHeader className="items-center">
          <Factory className="h-10 w-10 text-muted-foreground" />
          <CardTitle>No niches seeded yet</CardTitle>
          <CardDescription>
            Seed the taxonomy before exploring industries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            disabled={!isAdmin || busy !== null}
            onClick={() => handleSeed('niches')}
          >
            Seed niches now
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!isAdmin || !nichesDone || busy !== null}
            onClick={() => handleSeed('shortlist')}
          >
            Then load shortlist
          </Button>
          <p className="text-xs italic text-muted-foreground">
            Optional: download NAICS CSV from census.gov 2022 6-digit codes and
            place at supabase/seed/naics_codes.csv to seed the full taxonomy.
            Without it, a 20-row placeholder is used.
          </p>
          {!isAdmin && (
            <p className="text-xs text-muted-foreground">
              Admin only — ask an admin to run the seed.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
