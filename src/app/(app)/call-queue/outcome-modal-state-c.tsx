'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CALL_NOTE_TAGS, type CallNoteTag } from '@/lib/calls/types';

const SENTIMENT_LABELS: Record<number, string> = {
  [-2]: 'Very negative',
  [-1]: 'Negative',
  0: 'Neutral',
  1: 'Positive',
  2: 'Very positive',
};

type Props = {
  notes: string;
  onNotesChange: (v: string) => void;
  selectedTags: CallNoteTag[];
  onToggleTag: (tag: CallNoteTag) => void;
  competitorName: string;
  onCompetitorNameChange: (v: string) => void;
  sentiment: number | null;
  onSentimentChange: (v: number | null) => void;
  saving: boolean;
  canSave: boolean;
  onSave: () => void;
  outcomeSummary: string;
};

export function OutcomeModalStateC({
  notes,
  onNotesChange,
  selectedTags,
  onToggleTag,
  competitorName,
  onCompetitorNameChange,
  sentiment,
  onSentimentChange,
  saving,
  canSave,
  onSave,
  outcomeSummary,
}: Props) {
  const competitorSelected = selectedTags.includes('Competitor mentioned');

  return (
    <div className="space-y-5">
      <p className="rounded-md bg-muted px-3 py-2 text-sm">
        Outcome: <strong>{outcomeSummary}</strong>
      </p>

      <div className="space-y-2">
        <Label htmlFor="call-notes">Notes from this call (optional but recommended)</Label>
        <Textarea
          id="call-notes"
          rows={4}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="2–3 sentences: who you spoke with, their reaction, and any next step you agreed on."
        />
      </div>

      <div className="space-y-2">
        <Label>Tags (optional)</Label>
        <div className="flex flex-wrap gap-2">
          {CALL_NOTE_TAGS.map((tag) => {
            const on = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onToggleTag(tag)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  on
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-muted',
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
        {competitorSelected && (
          <Input
            placeholder="Competitor name"
            value={competitorName}
            onChange={(e) => onCompetitorNameChange(e.target.value)}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label>How did the conversation feel? (optional)</Label>
        <Slider
          min={-2}
          max={2}
          step={1}
          value={[sentiment ?? 0]}
          onValueChange={(v) => onSentimentChange(v[0] ?? 0)}
        />
        <p className="text-center text-sm text-muted-foreground">
          {sentiment != null
            ? SENTIMENT_LABELS[sentiment]
            : 'Optional — drag to rate how it felt'}
        </p>
      </div>

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={!canSave || saving}
        onClick={onSave}
      >
        {saving ? 'Saving…' : 'Save outcome'}
      </Button>
    </div>
  );
}
