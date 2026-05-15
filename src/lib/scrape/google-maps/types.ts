export type RawGoogleMapsListing = {
  business_name: string;
  address: string;
  phone_raw: string | null;
  website: string | null;
  rating: number | null;
  review_count: number | null;
  hours_raw: string | null;
  lat: number | null;
  lng: number | null;
  types: string[];
  google_place_id: string | null;
};

export type ScrapeSearchParams = {
  nicheKeyword: string;
  country: string;
  region: string;
  city: string;
  postalCode?: string;
  maxResults?: number;
};

export function buildMapsQuery(params: ScrapeSearchParams): string {
  const geo = params.postalCode
    ? `${params.city}, ${params.postalCode}, ${params.region}, ${params.country}`
    : `${params.city}, ${params.region}, ${params.country}`;
  return `${params.nicheKeyword} in ${geo}`;
}
