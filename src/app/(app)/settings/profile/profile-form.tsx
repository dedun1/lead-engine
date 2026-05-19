'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toastSuccess } from '@/lib/toast/helpers';
import { resetMyOnboarding, updateDisplayName } from './actions';
import type { Database } from '@/types/database.types';

type Member = Database['public']['Tables']['team_members']['Row'];

export function ProfileForm({
  email,
  member,
  isAdmin,
}: {
  email: string;
  member: Member;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(member.display_name ?? '');
  const [saved, setSaved] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const saveName = useCallback(async (value: string) => {
    const res = await updateDisplayName(value);
    if (res.ok) {
      setSaved(true);
      toastSuccess('Saved');
      setTimeout(() => setSaved(false), 2000);
    } else {
      toast.error(res.error);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (name === (member.display_name ?? '')) return;
      void saveName(name);
    }, 500);
    return () => clearTimeout(t);
  }, [name, member.display_name, saveName]);

  const roleClass =
    member.role === 'admin'
      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
      : 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="profile-name">Display name</Label>
          <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
          {saved && <p className="text-xs text-muted-foreground">Saved</p>}
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <div className="flex items-center gap-2">
            <Input readOnly value={email} className="bg-muted" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                void navigator.clipboard.writeText(email);
                toastSuccess('Copied');
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label>Role</Label>
          <Badge className={roleClass}>{member.role}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Onboarding: {member.completed_onboarding ? 'Completed' : 'Not completed'}
        </p>
        {isAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                Reset onboarding
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset onboarding?</AlertDialogTitle>
                <AlertDialogDescription>
                  This user will see the setup flow again on next page load.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => void resetMyOnboarding(member.id).then((r) => {
                    if (r.ok) toastSuccess('Onboarding reset');
                    else toast.error(r.error);
                  })}
                >
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <div className="space-y-2">
          <Label>Theme</Label>
          <Select value={theme ?? 'system'} onValueChange={setTheme}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full" disabled={signingOut}>
              Sign out
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out?</AlertDialogTitle>
              <AlertDialogDescription>
                You will need to log in again to access Lead Engine.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  setSigningOut(true);
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  router.replace('/login');
                  router.refresh();
                }}
              >
                Sign out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

