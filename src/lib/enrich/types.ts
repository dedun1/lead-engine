/** Lead shape passed into enrichment sources (subset of DB row). */
export type EnrichLead = {
  id: string;
  business_name: string;
  website: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  postal_code: string | null;
  business_phone: string | null;
  owner_name: string | null;
  owner_email: string | null;
  socials: Record<string, string> | null;
};

export type SourceLogEntry = {
  source: string;
  attempted_at: string;
  success: boolean;
  fields_found: string[];
  error?: string;
  duration_ms: number;
};

export type EnrichedFields = {
  owner_name?: string;
  owner_first_name?: string;
  owner_last_name?: string;
  owner_email?: string;
  owner_email_status?: 'verified' | 'risky' | 'invalid' | 'unverified';
  owner_linkedin_url?: string;
  emails_found?: string[];
  phones_found?: string[];
  social_links?: {
    facebook?: string;
    instagram?: string;
    linkedin_company?: string;
    twitter?: string;
  };
  business_registration?: {
    registry: string;
    registry_id: string;
    registered_name?: string;
    registered_at?: string;
    status?: string;
    officers?: Array<{ name: string; role: string }>;
  };
  source_log: SourceLogEntry[];
};

export type EnrichmentSource = {
  name: string;
  description: string;
  is_free: boolean;
  applicable_countries: string[];
  enrich: (lead: EnrichLead) => Promise<Partial<EnrichedFields>>;
};
