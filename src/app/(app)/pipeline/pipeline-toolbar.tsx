'use client';

import { LayoutGrid, List, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function PipelineToolbar({
  shown,
  total,
  loading,
  view,
  selectedCount,
  onRefresh,
  onViewTable,
  onViewCards,
  onBulkEnrich,
}: {
  shown: number;
  total: number;
  loading: boolean;
  view: 'table' | 'cards';
  selectedCount: number;
  onRefresh: () => void;
  onViewTable: () => void;
  onViewCards: () => void;
  onBulkEnrich: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Showing {shown} of {total} leads
        {loading ? ' · refreshing…' : ''}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button
          variant={view === 'table' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={onViewTable}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={view === 'cards' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={onViewCards}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={selectedCount === 0}>
              Bulk actions ({selectedCount})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              disabled={selectedCount === 0}
              onClick={onBulkEnrich}
            >
              Enrich selected
            </DropdownMenuItem>
            <DropdownMenuItem disabled>Assign — coming soon</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
