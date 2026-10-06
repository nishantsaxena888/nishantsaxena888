import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, GripVertical, File as FileIcon } from "lucide-react";
import { Button } from "@/components/third-party-shadcn/button";
import { cn } from "@/lib/utils";
import { type GalleryStyle, type GalleryFile } from "./utils/gallery-style";
import { assetUrl } from "@/platform/asset";

interface GalleryItemProps {
  file: GalleryFile;
  onRemove: (id: string) => void;
  onClick: (id: string) => void;
  isSelected?: boolean;
  styles: GalleryStyle;
}

export function GalleryItem({
  file,
  onRemove,
  onClick,
  isSelected,
  styles,
}: GalleryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isImage = file.type === "image";

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onClick(file.id)}
      className={cn(
        styles.item,
        isDragging && styles.itemActive,
        isSelected && styles.selected,
      )}
    >
      {/* Preview Section */}
      <div className={styles.preview}>
        {isImage ? (
          <img
            src={assetUrl(file.url)}
            alt={file.name}
            className={styles.thumbnail}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className={styles.iconContainer}>
            <FileIcon className="w-12 h-12 mb-2 opacity-50 transition-transform group-hover:scale-110" />
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 text-center truncate w-full">
              {file.name}
            </span>
          </div>
        )}
      </div>

      {/* Overlay */}
      <div className={styles.overlay} />

      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className={styles.dragHandle}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Actions */}
      <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={styles.deleteBtn}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(file.id);
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
