import React from "react";
import { Info, X, Calendar, User, Trash2, Upload } from "lucide-react";
import { Input } from "@/components/third-party-shadcn/input";
import { Button } from "@/components/third-party-shadcn/button";
import { cn } from "@/common/lib/utils";
import { toast } from "@/common/lib/toast";
import { getDocIcon } from "./media-utils";
import { assetUrl } from "@/platform/asset";
import { useConfirmDialog } from "@/common/hooks/use-confirm-dialog";

interface MediaSidebarProps {
  selectedItem: any;
  selectedIds: number[];
  setSelectedIds: (ids: number[]) => void;
  editName: string;
  setEditName: (val: string) => void;
  editDesc: string;
  setEditDesc: (val: string) => void;
  editStatus: string;
  setEditStatus: (val: string) => void;
  handleSaveDetails: () => void;
  handleDeleteItem: (e: React.MouseEvent, item: any) => void;
  getDocColor: (type: string) => string;
  onDelete: (id: any) => Promise<any>;
  setProcess: (val: boolean) => void;
  isPicker?: boolean;
  onSelect?: (selectedItems: any[]) => void;
  list?: any[];
}

export const MediaSidebar: React.FC<MediaSidebarProps> = ({
  selectedItem,
  selectedIds,
  setSelectedIds,
  editName,
  setEditName,
  editDesc,
  setEditDesc,
  editStatus,
  setEditStatus,
  handleSaveDetails,
  handleDeleteItem,
  getDocColor,
  onDelete,
  setProcess,
  isPicker,
  onSelect,
  list,
}) => {
  const handleUseSelected = () => {
    if (!onSelect) return;
    const selectedItems = (list || []).filter((item: any) => selectedIds.includes(item.id));
    onSelect(selectedItems);
  };

  const { confirm: confirmDelete, dialog } = useConfirmDialog();
  return (
    <div className="lg:col-span-1 border rounded-xl bg-background/60 shadow-sm p-4 relative min-h-[350px]">
      {selectedItem ? (
        <div className="space-y-5 animate-fade-in">
          {/* Details Header */}
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              File Details
            </h3>
            <button
              onClick={() => setSelectedIds([])}
              className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* File Thumbnail Preview */}
          <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/20">
            {["png", "jpg", "jpeg", "webp", "gif", "image"].includes((selectedItem.type || "").toLowerCase()) ? (
              <div className="w-32 h-32 rounded-lg border overflow-hidden bg-muted flex items-center justify-center mb-3">
                <img
                  src={assetUrl(selectedItem.url)}
                  alt={selectedItem.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className={cn("p-5 rounded-2xl border mb-3 shadow-inner", getDocColor(selectedItem.type))}>
                {getDocIcon(selectedItem.type)}
              </div>
            )}
            <span className="text-xs font-semibold text-center uppercase tracking-widest text-muted-foreground">
              {selectedItem.type} File
            </span>
          </div>

          {/* Details Attributes */}
          <div className="space-y-4 text-xs">
            <div>
              <label className="text-muted-foreground font-semibold block mb-1">Document Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 bg-background focus-visible:ring-1 text-xs"
                placeholder="e.g. Terms of Service..."
              />
            </div>
            <div>
              <label className="text-muted-foreground font-semibold block mb-1">Description</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                className="w-full bg-background border border-input rounded-md p-2 outline-none text-xs focus:ring-1 focus:ring-ring focus:border-ring resize-none"
                placeholder="e.g. Operating procedures for..."
              />
            </div>
            <div>
              <label className="text-muted-foreground font-semibold block mb-1">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full bg-background border border-input rounded-md p-1.5 outline-none text-xs focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            {selectedItem.file_name && (
              <div>
                <span className="text-muted-foreground block mb-1">Filename</span>
                <span className="font-semibold text-foreground font-mono bg-muted/40 p-1.5 rounded block truncate text-[11px]">
                  {selectedItem.file_name}
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 border-t pt-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <span className="text-[10px] text-muted-foreground block">Uploaded</span>
                  <span className="font-semibold text-foreground">May 17, 2026</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <span className="text-[10px] text-muted-foreground block">Author</span>
                  <span className="font-semibold text-foreground">admin</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="border-t pt-4 flex flex-col gap-2">
            {isPicker && onSelect && (
              <Button
                onClick={handleUseSelected}
                className="w-full text-xs font-bold bg-primary hover:bg-primary/95 text-white h-9 flex items-center justify-center gap-2 shadow-md mb-2 animate-fade-in"
              >
                Use Selected File
              </Button>
            )}
            <Button
              onClick={handleSaveDetails}
              className="w-full text-xs font-semibold h-8"
            >
              Save Changes
            </Button>
            <Button
              onClick={() => toast.info(`Viewing ${selectedItem.name}...`)}
              variant="outline"
              className="w-full text-xs font-semibold h-8"
            >
              View File
            </Button>
            <Button
              onClick={(e) => handleDeleteItem(e, selectedItem)}
              variant="destructive"
              className="w-full text-xs font-semibold bg-red-600 hover:bg-red-700 h-8"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Delete Permanently
            </Button>
          </div>
        </div>
      ) : selectedIds.length > 1 ? (
        <div className="space-y-5 animate-fade-in">
          {/* Details Header */}
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              Bulk Selection
            </h3>
            <button
              onClick={() => setSelectedIds([])}
              className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* File Thumbnail Preview */}
          <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/20 text-center">
            <div className="p-4 rounded-full bg-primary/10 text-primary mb-3">
              <Upload className="w-8 h-8" />
            </div>
            <span className="text-sm font-bold text-foreground">
              {selectedIds.length} Files Selected
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              Select bulk actions to apply to all selected media documents.
            </p>
          </div>

          {/* Action buttons */}
          <div className="border-t pt-4 flex flex-col gap-2">
            {isPicker && onSelect && (
              <Button
                onClick={handleUseSelected}
                className="w-full text-xs font-bold bg-primary hover:bg-primary/95 text-white h-9 flex items-center justify-center gap-2 shadow-md mb-2 animate-fade-in"
              >
                Use Selected Files ({selectedIds.length})
              </Button>
            )}
            <Button
              onClick={async () => {
                const res = await confirmDelete({ cancelText: "Cancel", confirmText: "Delete", description: "Are you sure you want to delete all selected files?", title: "Delete Confirmation" })
                if (res) {
                  setProcess(true);
                  for (const id of selectedIds) {
                    await onDelete(id);
                  }
                  setSelectedIds([]);
                  toast.success("Bulk delete completed successfully");
                  setProcess(false);
                }
              }}
              variant="destructive"
              className="w-full text-xs font-semibold bg-red-600 hover:bg-red-700 h-8"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Delete Selected ({selectedIds.length})
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-20 px-4 h-full">
          <Info className="w-8 h-8 text-muted-foreground/50 mb-3" />
          <h4 className="font-bold text-foreground text-sm">No selection</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
            Click on any file card or table row to view its full details and metadata.
          </p>
        </div>
      )}
      {dialog}
    </div>
  );
};
