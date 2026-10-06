import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/third-party-shadcn/dialog";
import { useMediaManagerStore } from "@/common/store/use-media-manager";
import { MediaUpload } from "./media-upload";

export const MediaManager = () => {
  const { isOpen, multiple, allowedType, onSelect, close } = useMediaManagerStore();

  const handleSelect = (selectedItems: any[]) => {
    if (onSelect) {
      onSelect(selectedItems);
    }
    close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-[95vw] sm:max-w-[1400px] w-full max-h-[90vh] h-[800px] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle className="text-xl font-bold">Media Manager</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select files from your library or upload new files to use.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto mt-0 pr-1">
          <MediaUpload
            activePageName="Library"
            isPicker={true}
            multiple={multiple}
            allowedType={allowedType}
            onSelect={handleSelect}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default MediaManager;
