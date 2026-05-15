import { createAdminClient } from '@/lib/supabase/admin';
import { PRICING_CONFIG_DEFAULTS } from '@/lib/pricing/defaults';

export type CostLineItem = {
  source: string;
  unit: string;
  count: number;
  unit_cost_usd: number;
  line_total_usd: number;
  notes?: string;
};

export type CostEstimate = {
  line_items: CostLineItem[];
  total_usd: number;
};

async function unitCost(source: string): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('pricing_config')
      .select('cost_usd')
      .eq('source', source)
      .maybeSingle();
    if (data?.cost_usd != null) return Number(data.cost_usd);
  } catch {
    // fall through to defaults
  }
  const fallback = PRICING_CONFIG_DEFAULTS.find((r) => r.source === source);
  return fallback?.cost_usd ?? 0;
}

export async function estimateGenerationCost(params: {
  quantity: number;
  niche_id: string;
  enrichmentSources: string[];
}): Promise<CostEstimate> {
  const qty = params.quantity;
  const sources = new Set(params.enrichmentSources);
  const line_items: CostLineItem[] = [];

  const mapsCost = await unitCost('google_maps_scrape');
  line_items.push({
    source: 'google_maps_scrape',
    unit: 'per_listing',
    count: qty,
    unit_cost_usd: mapsCost,
    line_total_usd: mapsCost * qty,
    notes: 'Free self-hosted scrape',
  });

  const haiku = await unitCost('claude_haiku_summary');
  line_items.push({
    source: 'claude_haiku_summary',
    unit: 'per_lead',
    count: qty,
    unit_cost_usd: haiku,
    line_total_usd: haiku * qty,
  });

  if (sources.has('apollo')) {
    const apollo = await unitCost('apollo_enrichment');
    line_items.push({
      source: 'apollo_enrichment',
      unit: 'per_contact',
      count: qty,
      unit_cost_usd: apollo,
      line_total_usd: apollo * qty,
      notes: 'Upper bound (100% hit rate)',
    });
  }

  if (sources.has('hunter')) {
    const hunter = await unitCost('hunter_email');
    const lookups = Math.ceil(qty * 0.5);
    line_items.push({
      source: 'hunter_email',
      unit: 'per_lookup',
      count: lookups,
      unit_cost_usd: hunter,
      line_total_usd: hunter * lookups,
      notes: '~50% missing email',
    });
  }

  if (sources.has('lusha')) {
    const lusha = await unitCost('lusha_mobile');
    const lookups = Math.ceil(qty * 0.3);
    line_items.push({
      source: 'lusha_mobile',
      unit: 'per_lookup',
      count: lookups,
      unit_cost_usd: lusha,
      line_total_usd: lusha * lookups,
      notes: '~30% missing mobile',
    });
  }

  if (sources.has('noaa')) {
    line_items.push({
      source: 'noaa_weather',
      unit: 'per_lead',
      count: qty,
      unit_cost_usd: 0,
      line_total_usd: 0,
      notes: 'Free government API',
    });
  }

  const total_usd = line_items.reduce((s, l) => s + l.line_total_usd, 0);
  return { line_items, total_usd: Math.round(total_usd * 100) / 100 };
}

/** Client-side quick estimate without DB round-trip. */
export function estimateGenerationCostLocal(params: {
  quantity: number;
  paidSources: string[];
}): number {
  const qty = params.quantity;
  let total = 0;
  const haiku =
    PRICING_CONFIG_DEFAULTS.find((r) => r.source === 'claude_haiku_summary')
      ?.cost_usd ?? 0.001;
  total += haiku * qty;
  if (params.paidSources.includes('apollo')) {
    const apollo =
      PRICING_CONFIG_DEFAULTS.find((r) => r.source === 'apollo_enrichment')
        ?.cost_usd ?? 0.15;
    total += apollo * qty;
  }
  if (params.paidSources.includes('hunter')) {
    const hunter =
      PRICING_CONFIG_DEFAULTS.find((r) => r.source === 'hunter_email')
        ?.cost_usd ?? 0.04;
    total += hunter * Math.ceil(qty * 0.5);
  }
  if (params.paidSources.includes('lusha')) {
    const lusha =
      PRICING_CONFIG_DEFAULTS.find((r) => r.source === 'lusha_mobile')
        ?.cost_usd ?? 0.5;
    total += lusha * Math.ceil(qty * 0.3);
  }
  return Math.round(total * 100) / 100;
}
