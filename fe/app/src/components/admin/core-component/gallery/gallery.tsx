"use client";

import React, { useId, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { Upload, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { galleryStyles, type GalleryFile } from "./utils/gallery-style";
import { GalleryItem } from "./gallery-item";

// 🔥 IMPORTANT: Type-safe theme
type GalleryTheme = keyof typeof galleryStyles;

interface GalleryProps {
  value?: GalleryFile[];
  onChange?: (value: GalleryFile[]) => void;
  themeName?: GalleryTheme; // ✅ FIXED
  className?: string;
  maxFiles?: number;
}

export function Gallery({
  value = [],
  onChange,
  themeName = "default", // ✅ default safe
  className,
  maxFiles,
}: GalleryProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // ✅ FIXED (no TS error)
  const appliedTheme = galleryStyles[themeName];

  const inputId = useId();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = value.findIndex((f) => f.id === active.id);
      const newIndex = value.findIndex((f) => f.id === over.id);

      const newValue = arrayMove(value, oldIndex, newIndex);
      onChange?.(newValue);
    }
  };

  const handleRemove = (id: string) => {
    onChange?.(value.filter((f) => f.id !== id));
    setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleBulkDelete = () => {
    onChange?.(value.filter((f) => !selectedIds.includes(f.id)));
    setSelectedIds([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const newGalleryFiles: GalleryFile[] = files.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type.startsWith("image/")
        ? "image"
        : file.type === "application/pdf"
          ? "pdf"
          : "doc",
    }));

    onChange?.([...value, ...newGalleryFiles]);
  };

  return (
    <div className={cn(appliedTheme.container, className)}>
      {/* Header */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-xl border border-[#e5e7eb] animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-sm font-bold text-[#334155] ml-2">
            {selectedIds.length} item{selectedIds.length > 1 ? "s" : ""}{" "}
            selected
          </span>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="h-9 px-4 text-[#6b7280]"
            >
              Clear
            </Button>

            <Button
              size="sm"
              onClick={handleBulkDelete}
              className="bg-[#dc2626] hover:bg-black text-white h-9 px-4"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className={appliedTheme.grid}>
          <SortableContext
            items={value.map((f) => f.id)}
            strategy={rectSortingStrategy}
          >
            {value.map((file) => (
              <GalleryItem
                key={file.id}
                file={file}
                onRemove={handleRemove}
                onClick={handleToggleSelect}
                isSelected={selectedIds.includes(file.id)}
                styles={appliedTheme}
              />
            ))}
          </SortableContext>

          {/* Upload Card */}
          {(!maxFiles || value.length < maxFiles) && (
            <div
              className={appliedTheme.uploader}
              onClick={() => document.getElementById(inputId)?.click()}
            >
              <input
                suppressHydrationWarning
                id={inputId}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              />

              <Plus className="w-10 h-10" />
              <span className="text-sm font-bold">Add Media</span>
            </div>
          )}
        </div>
      </DndContext>

      {/* Empty State */}
      {value.length === 0 && (
        <div
          className={appliedTheme.emptyState}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          <div className="w-20 h-20 rounded-full bg-[#ffffff] shadow-xl flex items-center justify-center">
            <Upload className="w-10 h-10 text-[#9ca3af]" />
          </div>

          <div className="text-center">
            <p className="text-lg font-bold text-[#111827]">
              Upload your gallery
            </p>
            <p className="text-sm text-[#6b7280]">
              Drag files here or click to browse files from your computer.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
