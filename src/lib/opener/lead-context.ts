import { createClient } from '@/lib/supabase/server';
import { isOpenNow, type WeeklyHours } from '@/lib/hours';
import { parseWeeklyHours } from '@/lib/pipeline/lead-utils';

export type LeadOpenerContext = {
  lead: {
    id: string;
    niche_id: string | null;
    country: string | null;
    business_name: string;
    city: string | null;
    region: string | null;
    google_rating: number | null;
    google_review_count: number | null;
    has_website: boolean | null;
    owner_name: string | null;
    business_hours: unknown;
    timezone: string | null;
    current_opener_variant_id: string | null;
  };
  niche: { id: string; name: string };
  intelligence: {
    summary: string | null;
    pain_points: string[] | null;
    twentyfour_pitch_angles: string[] | null;
  };
  is_open_now: boolean;
};

export async function loadLeadOpenerContext(
  leadId: string,
): Promise<LeadOpenerContext | null> {
  const supabase = createClient();
  const { data: lead } = await supabase
    .from('leads')
    .select(
      'id, niche_id, country, business_name, city, region, google_rating, google_review_count, has_website, owner_name, business_hours, timezone, current_opener_variant_id',
    )
    .eq('id', leadId)
    .eq('is_blocked', false)
    .maybeSingle();

  if (!lead?.niche_id) return null;

  const { data: niche } = await supabase
    .from('niches')
    .select('id, name')
    .eq('id', lead.niche_id)
    .maybeSingle();
  if (!niche) return null;

  const country = lead.country ?? 'US';
  const { data: intel } = await supabase
    .from('niche_intelligence')
    .select('summary, pain_points, twentyfour_pitch_angles')
    .eq('niche_id', lead.niche_id)
    .eq('country', country)
    .maybeSingle();

  if (!intel?.summary) return null;

  const tz = lead.timezone ?? 'America/New_York';
  const hours = parseWeeklyHours(lead.business_hours);
  const open = hours ? isOpenNow(hours as WeeklyHours, tz) : false;

  return {
    lead: lead as LeadOpenerContext['lead'],
    niche,
    intelligence: {
      summary: intel.summary,
      pain_points: (intel.pain_points as string[] | null) ?? [],
      twentyfour_pitch_angles:
        (intel.twentyfour_pitch_angles as string[] | null) ?? [],
    },
    is_open_now: open,
  };
}
