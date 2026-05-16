'use server';

import { revalidatePath } from 'next/cache';
import type { Json } from '@/types/database.types';
import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity/log';
import type { EnrichedFields } from './types';

export async function persistEnrichment(
  leadId: string,
  fields: EnrichedFields,
  userId: string,
): Promise<void> {
  const supabase = createClient();
  const now = new Date().toISOString();

  const existingLog = await supabase
    .from('leads')
    .select('source_log')
    .eq('id', leadId)
    .maybeSingle();

  const prior = (existingLog.data?.source_log as Json[]) ?? [];
  const mergedLog = [...prior, ...fields.source_log] as Json;

  const socialsPatch = fields.social_links
    ? {
        facebook: fields.social_links.facebook,
        instagram: fields.social_links.instagram,
        linkedin: fields.social_links.linkedin_company,
        x: fields.social_links.twitter,
      }
    : undefined;

  await supabase
    .from('leads')
    .update({
      owner_name: fields.owner_name ?? undefined,
      owner_email: fields.owner_email ?? undefined,
      owner_email_status: fields.owner_email_status ?? undefined,
      owner_linkedin_url: fields.owner_linkedin_url ?? undefined,
      business_registration: fields.business_registration ?? undefined,
      source_log: mergedLog,
      enriched_at: now,
      updated_at: now,
      ...(socialsPatch ? { socials: socialsPatch } : {}),
    })
    .eq('id', leadId);

  const summary = fields.source_log.map(
    (s) => `${s.source}:${s.success ? 'ok' : 'fail'}`,
  );

  await logActivity({
    lead_id: leadId,
    user_id: userId,
    activity_type: 'enrichment_added',
    payload: { sources: summary, fields_found: Object.keys(fields).filter((k) => k !== 'source_log') },
  });

  revalidatePath('/pipeline');
  revalidatePath('/call-queue');
}

export async function loadLeadForEnrich(leadId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('leads')
    .select(
      'id, business_name, website, country, region, city, postal_code, business_phone, owner_name, owner_email, socials, enriched_at',
    )
    .eq('id', leadId)
    .eq('is_blocked', false)
    .maybeSingle();
  return data;
}

export async function isEnrichmentFresh(
  enrichedAt: string | null,
): Promise<boolean> {
  if (!enrichedAt) return false;
  const age = Date.now() - new Date(enrichedAt).getTime();
  return age < 7 * 24 * 60 * 60 * 1000;
}
