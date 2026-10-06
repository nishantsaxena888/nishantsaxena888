import * as React from "react";
import { Anchor } from "@/platform/primitives";
import { usePath } from "@/platform/navigation";
import {
  LayoutDashboardIcon,
  Settings2Icon,
  UsersIcon,
  FolderIcon,
  ListIcon,
  DatabaseIcon,
  CommandIcon,
  ChevronRightIcon,
  FileText,
} from "lucide-react";

import { NavMain } from "@/components/admin/nav-main";
import { NavUser } from "@/components/admin/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const iconMap: Record<string, React.ReactNode> = {
  home: <LayoutDashboardIcon />,
  dashboard: <LayoutDashboardIcon />,
  settings: <Settings2Icon />,
  user: <UsersIcon />,
  product: <FolderIcon />,
  order: <ListIcon />,
  transaction: <DatabaseIcon />,
  document: <FileText />,
};

export function AppSidebar({
  config,
  ...props
}: React.ComponentProps<typeof Sidebar> & { config?: any }) {
  const pathname = usePath();

  const meta = config?.data?.meta || config?.meta || {};
  const adminMenu = config?.data?.admin_menu || [];

  const mapItems = (items: any[]): any[] => {
    return items.map((item: any) => ({
      title: item.name,
      url: item.url,
      icon: item.icon || iconMap[item.entity],
      entity: item.entity,
      isActive:
        pathname === item.url ||
        pathname.startsWith(item.url + "/"),
      items: mapItems(item.sub_menu || item.menu || []),
    }));
  };

  const mappedNavMain = mapItems(adminMenu);

  const userData = {
    name: "Admin User",
    email: "admin@nishify.com",
    avatar: "/avatars/admin.jpg",
  };

  return (
    <Sidebar
      collapsible="icon"
      className="bg-sidebar-background text-sidebar-foreground border-sidebar-border transition-colors duration-300"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Anchor to="/admin/">
                {typeof meta.logo === "string" &&
                meta.logo.trim() !== "" &&
                meta.logo !== "/logo.png" ? (
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground overflow-hidden">
                    <img
                      src={meta.logo}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-sparkles size-4"
                    >
                      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
                      <path d="M20 3v4"></path>
                      <path d="M22 5h-4"></path>
                      <path d="M4 17v2"></path>
                      <path d="M5 18H3"></path>
                    </svg>
                  </div>
                )}
                <div className="flex flex-col gap-0.5 leading-none overflow-hidden">
                  <span className="font-semibold truncate">
                    {meta.display_name || "Acme Inc."}
                  </span>
                </div>
              </Anchor>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mappedNavMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
//   return (
//     <Sidebar {...props}>
//       <SidebarHeader>
//         <SidebarMenu>
//           <SidebarMenuItem>
//             <SidebarMenuButton
//               asChild
//               size="lg"
//               className="data-[slot=sidebar-menu-button]:p-1.5!"
//             >
//               <Link to="/admin/overview">
//                 <div className="flex aspect-square size-8 items-center justify-center rounded-lg  text-sidebar-primary-foreground">
//                   {meta.logo ? (
//                     <img
//                       src={meta.logo}
//                       alt={meta.display_name}
//                       className="size-5 object-contain"
//                     />
//                   ) : meta.logoIcon ? (
//                     <span className="text-lg">{meta.logoIcon}</span>
//                   ) : (
//                     <CommandIcon className="size-4" />
//                   )}
//                 </div>
//                 <div className="grid flex-1 text-left text-sm leading-tight">
//                   <span className="truncate font-semibold text-base">
//                     {meta.display_name || "Nishify App"}
//                   </span>
//                   <span className="truncate text-xs text-muted-foreground font-medium">
//                     {meta.client?.replace("-", " ").toUpperCase() ||
//                       "Admin Dashboard"}
//                   </span>
//                 </div>
//               </Link>
//             </SidebarMenuButton>
//           </SidebarMenuItem>
//         </SidebarMenu>
//       </SidebarHeader>
//       <SidebarContent>
//         <NavMain items={mappedNavMain} />
//       </SidebarContent>
//       <SidebarFooter>
//         <NavUser user={userData} />
//       </SidebarFooter>
//     </Sidebar>
//   );
// }
