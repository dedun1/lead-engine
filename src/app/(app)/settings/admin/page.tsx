import { fetchOverviewStats } from '@/lib/admin/overview-stats';
import { OverviewStatsGrid } from './overview-stats';

export default async function AdminOverviewPage() {
  const stats = await fetchOverviewStats();
  return <OverviewStatsGrid stats={stats} />;
}
