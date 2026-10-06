import { RenderEngine } from "@/engine";
import { AdminSkeleton } from "./admin-skeleton";
import { useDashboardControl } from "./use-dashboard-control";
import { NoConfigFound } from "@/components/admin/no-config-found";
const DashboardControl = ({
  activePage,
  config,
}: {
  config: any;
  activePage: any;
}) => {
  const { data: options, loading } = useDashboardControl({ activePage });
  return (
    <div>
      {loading ? (
        <div className="p-6">
          <AdminSkeleton />
        </div>
      ) : (
        <>
          {options?.data?.config || options?.data?.content ? (
            <RenderEngine
              config={{ activePage, menu: config?.data?.admin_menu }}
              data={
                options?.data?.config || [
                  {
                    id: `${activePage?.entity || "unknown"}-module`,
                    type: "default-admin",
                    properties: {
                      level: "base",
                      type: "dynamic",
                      // Engine contract is `properties.action` (singular)
                      // — `actions` silently parses as a dynamic def with
                      // zero actions, which leaves the first-load skeleton
                      // up forever.
                      action: [
                        {
                          key: "data",
                          endpoint: `/${activePage?.entity || ""}`,
                          method: "get",
                          queryParams: {},
                          responseMapping: {},
                        },
                      ],
                    },
                    content: options?.data?.content,
                  },
                ]
              }
            />
          ) : (
            <NoConfigFound />
          )}
        </>
      )}
    </div>
  );
};

export default DashboardControl;
