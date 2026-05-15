export type NicheRecord = {
  id: string;
  naics_code: string | null;
  name: string;
  country_scope: string[] | null;
  is_shortlist: boolean | null;
  is_favorited: boolean | null;
  is_actively_pitching: boolean | null;
  parent_sector: string | null;
  weather_sensitive: boolean | null;
  created_at: string | null;
};

export type FetchNichesParams = {
  shortlist_only: boolean;
  search: string;
  countries: string[];
};
