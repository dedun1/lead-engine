'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { NicheViewMode } from './niche-toolbar';
import { NicheToolbar } from './niche-toolbar';
import { NicheCard } from './niche-card';
import { NicheDetailDrawer } from './niche-detail-drawer';
import {
  fetchNiches,
  toggleActivelyPitching,
  toggleFavorited,
} from './actions';
import type { NicheRecord } from '@/lib/niches/types';

const DEFAULT_COUNTRIES = ['US', 'CA', 'UK', 'AU'];

export function NicheGrid({
  initialNiches,
  isAdmin,
}: {
  initialNiches: NicheRecord[];
  isAdmin: boolean;
}) {
  const [viewMode, setViewMode] = useState<NicheViewMode>('shortlist');
  const [search, setSearch] = useState('');
  const [countries, setCountries] = useState<string[]>(DEFAULT_COUNTRIES);
  const [niches, setNiches] = useState(initialNiches);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<NicheRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchNiches({
      shortlist_only: viewMode === 'shortlist',
      search,
      countries,
    });
    setNiches(rows);
    setLoading(false);
  }, [viewMode, search, countries]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleFavorite(niche: NicheRecord) {
    const result = await toggleFavorited(niche.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    void load();
    if (selected?.id === niche.id) {
      setSelected({ ...niche, is_favorited: !niche.is_favorited });
    }
  }

  async function handlePitching() {
    if (!selected) return;
    const result = await toggleActivelyPitching(selected.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if (result.startedBaselineGeneration) {
      toast.message(
        'Marked as actively pitching. Generating baseline openers in background…',
      );
    }
    void load();
    setSelected({
      ...selected,
      is_actively_pitching: !selected.is_actively_pitching,
    });
  }

  return (
  <>
      <NicheToolbar
        viewMode={viewMode}
        search={search}
        countries={countries}
        onViewModeChange={setViewMode}
        onSearchChange={setSearch}
        onCountriesChange={setCountries}
      />
      {loading && (
        <p className="text-sm text-muted-foreground">Loading niches…</p>
      )}
      {!loading && niches.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No niches match your filters.
        </p>
      )}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {niches.map((niche) => (
          <NicheCard
            key={niche.id}
            niche={niche}
            onOpen={() => {
              setSelected(niche);
              setDrawerOpen(true);
            }}
            onToggleFavorite={() => handleFavorite(niche)}
          />
        ))}
      </div>
      <NicheDetailDrawer
        niche={selected}
        open={drawerOpen}
        isAdmin={isAdmin}
        onClose={() => setDrawerOpen(false)}
        onToggleFavorite={() => selected && handleFavorite(selected)}
        onTogglePitching={handlePitching}
      />
    </>
  );
}
