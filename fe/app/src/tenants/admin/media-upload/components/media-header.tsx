import React from "react";
import { Plus, LayoutGrid, List, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMediaManagerStore } from "@/store/use-media-manager";
import { toast } from "sonner";

interface MediaHeaderProps {
  activePageName?: string;
  onUploadClick: () => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  isPicker?: boolean;
}

export const MediaHeader: React.FC<MediaHeaderProps> = ({
  activePageName,
  onUploadClick,
  viewMode,
  setViewMode,
  isPicker = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {activePageName || "Media Library"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your library files, documents, and media uploads.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          onClick={onUploadClick}
          className="shadow-sm font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New File
        </Button>
        <div className="flex border rounded-md p-1 bg-muted/30">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-1.5 rounded transition-all",
              viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-1.5 rounded transition-all",
              viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default MediaHeader;
