import { EllipsisVerticalIcon, EllipsisIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/third-party-shadcn/dropdown-menu";
import { Button } from "@/components/third-party-shadcn/button";

export interface ActionMenuItem {
  label: string;
  onClick?: () => void;
  isDestructive?: boolean;
  isSeparator?: boolean;
}

export interface SharedActionMenuProps {
  items: ActionMenuItem[];
  icon?: "vertical" | "horizontal";
  align?: "start" | "center" | "end";
}

export function SharedActionMenu({
  items,
  icon = "vertical",
  align = "end",
}: SharedActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 app-action-menu-trigger">
          {icon === "vertical" ? (
            <EllipsisVerticalIcon className="h-4 w-4" />
          ) : (
            <EllipsisIcon className="h-4 w-4" />
          )}
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className="w-32 app-action-menu-content"
      >
        {items.map((item, index) => {
          if (item.isSeparator) {
            return <DropdownMenuSeparator key={`sep-${index}`} />;
          }

          return (
            <DropdownMenuItem
              key={`item-${index}`}
              onClick={item.onClick}
              variant={item.isDestructive ? "destructive" : "default"}
              className="app-action-menu-item cursor-pointer"
            >
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
