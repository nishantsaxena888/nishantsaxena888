import React from "react";
import { Download, Trash2 } from "lucide-react";
import { cn } from "@/common/lib/utils";
import { toast } from "@/common/lib/toast";
import { getDocIcon } from "./media-utils";
import { assetUrl } from "@/platform/asset";

interface MediaListProps {
  filteredList: any[];
  selectedIds: number[];
  handleSelectAll: () => void;
  handleItemClick: (item: any) => void;
  handleDeleteItem: (e: React.MouseEvent, item: any) => void;
  getDocColor: (type: string) => string;
  multiple?: boolean;
  allowedType?: "image" | "all";
}

export const MediaList: React.FC<MediaListProps> = ({
  filteredList,
  selectedIds,
  handleSelectAll,
  handleItemClick,
  handleDeleteItem,
  getDocColor,
  multiple,
  allowedType,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b bg-muted/20 text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <th className="py-3.5 px-4 w-[40px]">
              {multiple !== false && (
                <input
                  type="checkbox"
                  checked={filteredList.length > 0 && selectedIds.length === filteredList.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                />
              )}
            </th>
            <th className="py-3.5 px-4 w-[80px]">Icon</th>
            <th className="py-3.5 px-4">Title</th>
            <th className="py-3.5 px-4 w-[120px]">Type</th>
            <th className="py-3.5 px-4 w-[150px]">Status</th>
            <th className="py-3.5 px-4 w-[120px] text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y text-sm">
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
              <tr
                key={item.id}
                onClick={() => !isSelectionDisabled && handleItemClick(item)}
                className={cn(
                  isSelectionDisabled ? "opacity-40 cursor-not-allowed bg-muted/10" : "cursor-pointer hover:bg-muted/10",
                  isSelected ? "bg-accent/40" : "bg-transparent"
                )}
              >
                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
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
                </td>
                <td className="py-3 px-4">
                  {["png", "jpg", "jpeg", "webp", "gif", "image"].includes((item.type || "").toLowerCase()) ? (
                    <div className="w-10 h-10 rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                      <img
                        src={assetUrl(item.url)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <div className={cn("p-2 rounded-lg border w-10 h-10 flex items-center justify-center", colorClass)}>
                      {getDocIcon(item.type)}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 font-semibold text-foreground">
                  <div>
                    <span>{item.name}</span>
                    <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                      {item.file_name || item.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {item.type}
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {item.status || "active"}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info(`Downloading ${item.name}...`);
                      }}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteItem(e, item)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
