import { Anchor } from "@/platform/primitives";
import { usePath } from "@/platform/navigation";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/third-party-shadcn/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/third-party-shadcn/sidebar";
import { cn } from "@/lib/utils";
import { prefetchEntity } from "@/engine/library/api-cache";

import { type IconName, Icon } from "@/components/third-party-shadcn/icon-picker";
import { dynamicIconImports } from "lucide-react/dynamic";

interface NavItem {
  title: string;
  url: string;
  icon?: React.ReactNode;
  entity?: string;
  isActive?: boolean;
  items?: NavItem[];
}

export function NavMain({ items }: { items: NavItem[] }) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <NavMenuItem key={item.title} item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavMenuItem({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePath();

  const hasSubMenu = !!item.items?.length;

  const isActive = pathname === item.url || pathname.startsWith(item.url + "/");

  const isChildActive = item.items?.some(
    (subItem) =>
      pathname === subItem.url || pathname.startsWith(subItem.url + "/"),
  );

  const active = isActive || isChildActive;

  if (depth === 0) {
    const iconAndTitle = (
      <>
        {typeof item.icon === "string" || !item.icon ? (
          <Icon
            name={
              typeof item?.icon === "string" && item.icon in dynamicIconImports
                ? (item.icon as IconName)
                : "calendar-cog"
            }
          />
        ) : (
          item.icon
        )}
        <span>{item.title}</span>
      </>
    );

    const content = (
      <SidebarMenuItem className="space-y-1">
        {hasSubMenu ? (
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={active}
              className={cn(
                "h-[40px] px-3 transition-all duration-200 font-medium text-sidebar-foreground cursor-pointer",
                "data-[active=true]:font-semibold",
                "data-[active=true]:bg-menu-active-bg",
                "data-[active=true]:text-menu-active-foreground",
              )}
            >
              {iconAndTitle}
            </SidebarMenuButton>
          </CollapsibleTrigger>
        ) : (
          <SidebarMenuButton
            asChild
            tooltip={item.title}
            isActive={active}
            className={cn(
              "h-[40px] px-3 transition-all duration-200 font-medium text-sidebar-foreground",
              "data-[active=true]:font-semibold",
              "data-[active=true]:bg-menu-active-bg",
              "data-[active=true]:text-menu-active-foreground",
            )}
          >
            <Anchor to={item.url} onMouseEnter={() => prefetchEntity(item.entity)}>
              {iconAndTitle}
            </Anchor>
          </SidebarMenuButton>
        )}

        {hasSubMenu && (
          <>
            <CollapsibleTrigger asChild>
              <SidebarMenuAction className={cn("top-2.5 data-[state=open]:rotate-90", active && "text-menu-active-foreground")}>
                <ChevronRight className="size-4" />
                <span className="sr-only">Toggle</span>
              </SidebarMenuAction>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <SidebarMenuSub>
                {item.items?.map((subItem) => (
                  <NavMenuItem
                    key={subItem.title}
                    item={subItem}
                    depth={depth + 1}
                  />
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </>
        )}
      </SidebarMenuItem>
    );

    return hasSubMenu ? (
      <Collapsible asChild defaultOpen={active}>
        {content}
      </Collapsible>
    ) : (
      content
    );
  }

  const subContent = (
    <SidebarMenuSubItem>
      {hasSubMenu ? (
        <CollapsibleTrigger asChild>
          <SidebarMenuSubButton
            isActive={active}
            className={active ? "font-bold text-primary cursor-pointer" : "font-normal cursor-pointer"}
          >
            <span>{item.title}</span>
          </SidebarMenuSubButton>
        </CollapsibleTrigger>
      ) : (
        <SidebarMenuSubButton
          asChild
          isActive={active}
          className={active ? "font-bold text-primary" : "font-normal"}
        >
          <Anchor to={item.url} onMouseEnter={() => prefetchEntity(item.entity)}>
            <span>{item.title}</span>
          </Anchor>
        </SidebarMenuSubButton>
      )}

      {hasSubMenu && (
        <>
          <CollapsibleTrigger asChild>
            <SidebarMenuAction className={cn("absolute right-2 top-0.5 h-6 w-6 data-[state=open]:rotate-90", active && "text-primary")}>
              <ChevronRight className="size-3" />
            </SidebarMenuAction>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items?.map((subItem) => (
                <NavMenuItem
                  key={subItem.title}
                  item={subItem}
                  depth={depth + 1}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </>
      )}
    </SidebarMenuSubItem>
  );

  return hasSubMenu ? (
    <Collapsible asChild defaultOpen={active}>
      {subContent}
    </Collapsible>
  ) : (
    subContent
  );
}
