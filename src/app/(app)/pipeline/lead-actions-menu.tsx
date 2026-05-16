'use client';

import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Props = {
  onAssign: () => void;
  onBlock: () => void;
  onOpen: () => void;
};

export function LeadActionsMenu({ onAssign, onBlock, onOpen }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={onOpen}>Open detail</DropdownMenuItem>
        <DropdownMenuItem onClick={onAssign}>Quick assign</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={onBlock}>
          Quick block
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
