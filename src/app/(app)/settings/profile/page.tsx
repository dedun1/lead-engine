import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/permissions';
import { ProfileForm } from './profile-form';
import { loadProfile } from './actions';

export default async function ProfileSettingsPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect('/login');
  const profile = await loadProfile();
  if (!profile) redirect('/login');

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Profile</h1>
      <ProfileForm
        email={profile.user.email ?? profile.member.email}
        member={profile.member}
        isAdmin={ctx.isAdmin}
      />
    </div>
  );
}
