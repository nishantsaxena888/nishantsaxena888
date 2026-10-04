 
import React from "react";
import { NotFound } from "@/pages/not-found/not-found";
import { useDashboardRenderer } from "./utils/use-dashboard-renderer";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { useFormStyleStore } from "@/store/use-form-style";
import DashboardControl from "@/tenants/admin/default-admin/utils/dashboard-control";
import { MediaManager } from "@/tenants/admin/media-upload/media-manager";
import { AdminSurfaceProvider } from "@/engine";

export interface DashboardRendererProps {
  config: any;
}

export const DashboardRenderer = ({ config }: DashboardRendererProps) => {
  const { activePage } = useDashboardRenderer(config);
  const { styles } = useFormStyleStore();

  if (!activePage) {
    return <NotFound />;
  }

  return (
    <AdminSurfaceProvider>
      <SidebarProvider
      side={styles.sidebarPosition}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        variant={styles.sidebarVariant}
        collapsible={styles.sidebarCollapsible}
        config={config}
      />
      <SidebarInset>
        <SiteHeader activePage={activePage} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 ">
              <DashboardControl config={config} activePage={activePage} />
              <MediaManager />
            </div>
          </div>
        </div>
      </SidebarInset>
      </SidebarProvider>
    </AdminSurfaceProvider>
  );
};
