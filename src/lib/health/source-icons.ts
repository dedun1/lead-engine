import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Building2,
  CloudLightning,
  Globe,
  Share2,
  Mail,
  Map,
  Search,
  Zap,
} from 'lucide-react';

export function iconForHealthSource(source: string): LucideIcon {
  const s = source.toLowerCase();
  if (s.includes('noaa') || s.includes('storm')) return CloudLightning;
  if (s.includes('facebook')) return Share2;
  if (s.includes('smtp') || s.includes('mail') || s.includes('email')) return Mail;
  if (s.includes('google_maps') || s.includes('maps')) return Map;
  if (s.includes('duckduckgo') || s.includes('search')) return Search;
  if (s.includes('companies_house') || s.includes('sos') || s.includes('opencorporates'))
    return Building2;
  if (s.includes('website')) return Globe;
  if (s.startsWith('trigger_')) return Zap;
  return Activity;
}
