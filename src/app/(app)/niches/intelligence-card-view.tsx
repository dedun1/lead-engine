'use client';

import type { Database } from '@/types/database.types';
import type { EditableIntelligenceField } from '@/lib/ai/types';
import {
  EditableInput,
  EditableLevelSelect,
  EditableStringList,
  EditableTextarea,
  SectionTitle,
} from './intelligence-section';

type Row = Database['public']['Tables']['niche_intelligence']['Row'];

export function IntelligenceCardView({
  row,
  onPatch,
}: {
  row: Row;
  onPatch: (field: EditableIntelligenceField, value: unknown) => void;
}) {
  return (
    <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
      <EditableTextarea
        label="Pitch summary"
        value={row.summary ?? ''}
        onSave={(v) => onPatch('summary', v)}
      />
      <EditableStringList
        label="Pain points"
        items={row.pain_points ?? []}
        onSave={(v) => onPatch('pain_points', v)}
      />
      <EditableStringList
        label="Cold-call hooks (pitch angles)"
        items={row.twentyfour_pitch_angles ?? []}
        onSave={(v) => onPatch('twentyfour_pitch_angles', v)}
      />
      <EditableTextarea
        label="Typical owner / decision maker"
        value={row.typical_owner_persona ?? ''}
        onSave={(v) => onPatch('typical_owner_persona', v)}
      />
      <SectionTitle>Fit scores (1–10)</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        <EditableInput
          label="Automation demand"
          type="number"
          value={String(row.automation_demand_score ?? '')}
          onSave={(v) => onPatch('automation_demand_score', Number(v))}
        />
        <EditableInput
          label="Cold-call viability"
          type="number"
          value={String(row.cold_call_viability_score ?? '')}
          onSave={(v) => onPatch('cold_call_viability_score', Number(v))}
        />
        <EditableInput
          label="TwentyFour fit"
          type="number"
          value={String(row.twentyfour_fit_score ?? '')}
          onSave={(v) => onPatch('twentyfour_fit_score', Number(v))}
        />
      </div>
      <EditableStringList
        label="Best regions"
        items={row.best_regions ?? []}
        onSave={(v) => onPatch('best_regions', v)}
      />
      <div className="grid grid-cols-2 gap-2">
        <EditableLevelSelect
          label="Market fragmentation"
          value={row.market_fragmentation ?? 'medium'}
          onSave={(v) => onPatch('market_fragmentation', v)}
        />
        <EditableLevelSelect
          label="Phone dependency"
          value={row.phone_dependency ?? 'medium'}
          onSave={(v) => onPatch('phone_dependency', v)}
        />
        <EditableLevelSelect
          label="Automation adoption"
          value={row.existing_automation_adoption ?? 'medium'}
          onSave={(v) => onPatch('existing_automation_adoption', v)}
        />
      </div>
      <SectionTitle>Ticket & revenue</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <EditableInput
          label="Avg ticket low"
          type="number"
          value={String(row.avg_ticket_low ?? '')}
          onSave={(v) => onPatch('avg_ticket_low', Number(v))}
        />
        <EditableInput
          label="Avg ticket high"
          type="number"
          value={String(row.avg_ticket_high ?? '')}
          onSave={(v) => onPatch('avg_ticket_high', Number(v))}
        />
        <EditableInput
          label="Currency"
          value={row.currency ?? 'USD'}
          onSave={(v) => onPatch('currency', v)}
        />
        <EditableInput
          label="Monthly revenue low"
          type="number"
          value={String(row.typical_monthly_revenue_low ?? '')}
          onSave={(v) => onPatch('typical_monthly_revenue_low', Number(v))}
        />
        <EditableInput
          label="Monthly revenue high"
          type="number"
          value={String(row.typical_monthly_revenue_high ?? '')}
          onSave={(v) => onPatch('typical_monthly_revenue_high', Number(v))}
        />
      </div>
    </div>
  );
}
