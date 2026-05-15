export type ApiKeyService = {
  id: string;
  label: string;
  required?: boolean;
};

export const API_KEY_SERVICES: ApiKeyService[] = [
  { id: 'anthropic', label: 'Anthropic API Key', required: true },
  { id: 'google_places', label: 'Google Places API Key' },
  { id: 'apollo', label: 'Apollo.io API Key' },
  { id: 'hunter', label: 'Hunter.io API Key' },
  { id: 'serpapi', label: 'SerpAPI Key' },
  { id: 'apify', label: 'Apify Token' },
  { id: 'lusha', label: 'Lusha API Key' },
  { id: 'companies_house', label: 'UK Companies House API Key' },
  { id: 'noaa', label: 'NOAA API Key' },
];
