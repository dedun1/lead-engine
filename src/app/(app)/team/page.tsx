import { EmptyState } from '@/components/shell/empty-state';

export default function TeamPage() {
  return (
    <EmptyState
      phaseLabel="Phase 1"
      title="Team"
      description="Member list and admin invites land in the Phase 1 team-management prompt. Until then, manage users from the Supabase dashboard."
    />
  );
}
