import {
  NICHE_INTELLIGENCE_PROMPT_SYSTEM,
  NICHE_INTELLIGENCE_PROMPT_USER,
  OPENER_BASELINE_PROMPT_SYSTEM,
  OPENER_BASELINE_PROMPT_USER,
  OPENER_GENERATION_PROMPT_SYSTEM,
  OPENER_GENERATION_PROMPT_USER,
} from '@/lib/ai/prompts';
import { WEEKLY_INSIGHT_PROMPT_SYSTEM } from '@/lib/ai/weekly-insight';

export type PromptRegistryEntry = {
  id: string;
  title: string;
  source_file: string;
  export_name: string;
  getText: () => string;
};

export const PROMPT_REGISTRY: PromptRegistryEntry[] = [
  {
    id: 'niche-intelligence-system',
    title: 'Niche Intelligence — System',
    source_file: 'src/lib/ai/prompts.ts',
    export_name: 'NICHE_INTELLIGENCE_PROMPT_SYSTEM',
    getText: () => NICHE_INTELLIGENCE_PROMPT_SYSTEM,
  },
  {
    id: 'niche-intelligence-user',
    title: 'Niche Intelligence — User Template',
    source_file: 'src/lib/ai/prompts.ts',
    export_name: 'NICHE_INTELLIGENCE_PROMPT_USER',
    getText: () => NICHE_INTELLIGENCE_PROMPT_USER('Example Niche', 'US'),
  },
  {
    id: 'opener-generation-system',
    title: 'Opener Generation — System',
    source_file: 'src/lib/ai/prompts.ts',
    export_name: 'OPENER_GENERATION_PROMPT_SYSTEM',
    getText: () => OPENER_GENERATION_PROMPT_SYSTEM,
  },
  {
    id: 'opener-generation-user',
    title: 'Opener Generation — User Template (includes trigger_context branch)',
    source_file: 'src/lib/ai/prompts.ts',
    export_name: 'OPENER_GENERATION_PROMPT_USER',
    getText: () =>
      OPENER_GENERATION_PROMPT_USER({
        niche_name: 'Example',
        niche_summary: '…',
        pain_points: [],
        twentyfour_pitch_angles: [],
        business_name: 'Example Co',
        rating: 4.5,
        review_count: 42,
        city: 'Austin',
        region: 'TX',
        is_open_now: true,
        has_website: true,
        owner_name: 'Alex',
        variant_seed: 1,
        trigger_context: {
          trigger_type: 'recent_negative_review',
          payload_summary: '2★ review yesterday',
        },
      }),
  },
  {
    id: 'opener-baseline-system',
    title: 'Opener Baseline — System',
    source_file: 'src/lib/ai/prompts.ts',
    export_name: 'OPENER_BASELINE_PROMPT_SYSTEM',
    getText: () => OPENER_BASELINE_PROMPT_SYSTEM,
  },
  {
    id: 'opener-baseline-user',
    title: 'Opener Baseline — User Template',
    source_file: 'src/lib/ai/prompts.ts',
    export_name: 'OPENER_BASELINE_PROMPT_USER',
    getText: () => OPENER_BASELINE_PROMPT_USER('Roofing', 'Summary…', 2),
  },
  {
    id: 'weekly-insight-system',
    title: 'Weekly Insight — System',
    source_file: 'src/lib/ai/weekly-insight.ts',
    export_name: 'WEEKLY_INSIGHT_PROMPT_SYSTEM',
    getText: () => WEEKLY_INSIGHT_PROMPT_SYSTEM,
  },
  {
    id: 'weekly-insight-user',
    title: 'Weekly Insight — User Template',
    source_file: 'src/lib/ai/weekly-insight.ts',
    export_name: '(runtime JSON metrics)',
    getText: () =>
      'Built at runtime from last week’s call metrics, opener performance, niches, objections (keyword counts), and heatmap slots — see generateWeeklyInsight() in weekly-insight.ts.',
  },
];
