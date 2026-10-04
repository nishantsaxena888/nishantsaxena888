import { Skeleton } from "@/components/ui/skeleton";

export const AdminSkeleton = () => {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Header section: views, search, and action buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-muted/50 p-1 rounded-lg gap-1">
            <Skeleton className="h-7 w-20 rounded-md" />
            <Skeleton className="h-7 w-20 rounded-md" />
            <Skeleton className="h-7 w-20 rounded-md" />
          </div>
          <div className="relative w-64">
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* Table Mockup Section */}
      <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
        {/* Table Header */}
        <div className="bg-muted/50 p-4 border-b">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-1/4 rounded" />
            <Skeleton className="h-4 w-1/6 rounded" />
            <Skeleton className="h-4 w-1/6 rounded" />
            <Skeleton className="h-4 w-1/6 rounded" />
          </div>
        </div>
        {/* Table Rows */}
        <div className="divide-y divide-muted/50">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <Skeleton
                className="h-4 w-4 rounded"
                style={{ opacity: 1 - i * 0.1 }}
              />
              <Skeleton
                className="h-4 w-1/4 rounded"
                style={{ opacity: 1 - i * 0.1 }}
              />
              <Skeleton
                className="h-4 w-1/6 rounded"
                style={{ opacity: 1 - i * 0.1 }}
              />
              <Skeleton
                className="h-4 w-1/6 rounded"
                style={{ opacity: 1 - i * 0.1 }}
              />
              <Skeleton
                className="h-4 w-1/6 rounded"
                style={{ opacity: 1 - i * 0.1 }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer Section: Items per page and pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-2 pt-2 gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-64 rounded-md" />
        </div>
      </div>
    </div>
  );
};
