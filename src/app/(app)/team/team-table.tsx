'use client';

import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  setTeamMemberActive,
  updateTeamMemberRole,
} from './actions';

export type TeamMemberView = {
  id: string;
  display_name: string | null;
  email: string;
  role: string;
  is_active: boolean | null;
};

export function TeamTable({
  members,
  isAdmin,
  currentUserId,
}: {
  members: TeamMemberView[];
  isAdmin: boolean;
  currentUserId: string | null;
}) {
  async function changeRole(memberId: string, role: 'admin' | 'member') {
    const result = await updateTeamMemberRole(memberId, role);
    if (!result.ok) toast.error(result.error);
    else toast.success('Role updated');
  }

  async function toggleActive(memberId: string, active: boolean) {
    const result = await setTeamMemberActive(memberId, active);
    if (!result.ok) toast.error(result.error);
    else toast.success(active ? 'Member activated' : 'Member deactivated');
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Display name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Last seen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>{member.display_name ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">
                {member.email}
              </TableCell>
              <TableCell>
                {isAdmin ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className="inline-flex">
                        <Badge
                          variant={
                            member.role === 'admin' ? 'default' : 'secondary'
                          }
                        >
                          {member.role}
                        </Badge>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        onClick={() => changeRole(member.id, 'admin')}
                      >
                        admin
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => changeRole(member.id, 'member')}
                      >
                        member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Badge
                    variant={
                      member.role === 'admin' ? 'default' : 'secondary'
                    }
                  >
                    {member.role}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Switch
                  checked={member.is_active !== false}
                  disabled={
                    !isAdmin ||
                    (member.id === currentUserId && member.is_active !== false)
                  }
                  onCheckedChange={(checked) =>
                    toggleActive(member.id, checked)
                  }
                />
              </TableCell>
              <TableCell className="text-muted-foreground">—</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
