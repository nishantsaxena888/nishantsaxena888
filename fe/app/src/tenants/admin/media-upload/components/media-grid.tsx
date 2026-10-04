import React from "react";
import { Download, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { getDocIcon } from "./media-utils";
import { assetUrl } from "@/platform/asset";

interface MediaGridProps {
  filteredList: any[];
  selectedIds: number[];
  isBulkMode: boolean;
  handleItemClick: (item: any) => void;
  handleDeleteItem: (e: React.MouseEvent, item: any) => void;
  getDocColor: (type: string) => string;
  multiple?: boolean;
  allowedType?: "image" | "all";
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  filteredList,
  selectedIds,
  isBulkMode,
  handleItemClick,
  handleDeleteItem,
  getDocColor,
  multiple,
  allowedType,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
      {filteredList.map((item: any) => {
        const colorClass = getDocColor(item.type);
        const isSelected = selectedIds.includes(item.id);

        let isSelectionDisabled = false;
        if (allowedType && allowedType !== "all") {
          const type = (item.type || "").toLowerCase();
          const isAllowed = allowedType === "image"
            ? ["png", "jpg", "jpeg", "webp", "gif", "image"].includes(type)
            : type === (allowedType as string).toLowerCase();
          isSelectionDisabled = !isAllowed;
        }

        return (
          <div
            key={item.id}
            onClick={() => !isSelectionDisabled && handleItemClick(item)}
            className={cn(
              "group relative aspect-square rounded-lg border overflow-hidden transition-all duration-300 shadow-sm",
              isSelectionDisabled ? "opacity-40 cursor-not-allowed border-dashed bg-muted/30" : "cursor-pointer",
              isSelected ? "ring-2 ring-primary border-primary bg-accent/40" : 
              !isSelectionDisabled ? "hover:border-border/90 hover:shadow-md border-border/50 bg-background/50 hover:bg-background" : ""
            )}
          >
            {/* Checkbox overlay in Grid view if selected or in Bulk Mode */}
            {(isBulkMode || isSelected || multiple === false) && (
              <div className="absolute top-2.5 left-2.5 z-20" onClick={(e) => e.stopPropagation()}>
                <input
                  type={multiple !== false ? "checkbox" : "radio"}
                  checked={isSelected}
                  disabled={isSelectionDisabled}
                  onChange={() => !isSelectionDisabled && handleItemClick(item)}
                  className={cn(
                    "w-4 h-4 border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary",
                    multiple !== false ? "rounded" : "rounded-full"
                  )}
                />
              </div>
            )}

            <div className="absolute inset-0 flex flex-col items-center justify-center p-0">
              {["png", "jpg", "jpeg", "webp", "gif", "image"].includes((item.type || "").toLowerCase()) ? (
                <div className="w-full h-full relative flex items-center justify-center bg-muted overflow-hidden">
                  <img
                    src={assetUrl(item.url)}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  {/* Subtle overlay for the image title so it is readable */}
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-center z-10">
                    <span className="text-[11px] font-medium text-white line-clamp-1">
                      {item.name}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-3 w-full h-full">
                  <div className={cn("p-4 rounded-xl border mb-3 transition-transform duration-300 group-hover:scale-105", colorClass)}>
                    {getDocIcon(item.type)}
                  </div>
                  <span className="text-xs font-semibold text-foreground text-center line-clamp-1 w-full px-2">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                    {item.type}
                  </span>
                </div>
              )}
            </div>

            {/* Hover action overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
              <span className="text-[10px] text-white/90 truncate max-w-[60%] pl-1">
                {item.file_name || item.name}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.info(`Downloading ${item.name}...`);
                  }}
                  className="p-1 rounded bg-white/20 hover:bg-white/40 text-white transition-colors"
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleDeleteItem(e, item)}
                  className="p-1 rounded bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
