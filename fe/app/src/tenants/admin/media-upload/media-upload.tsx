import React from "react";
import { Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { useMediaUpload } from "./hooks/use-media-upload";
import { MediaHeader } from "./components/media-header";
import { MediaToolbar } from "./components/media-toolbar";
import { MediaGrid } from "./components/media-grid";
import { MediaList } from "./components/media-list";
import { MediaSidebar } from "./components/media-sidebar";
import { DefaultPagination } from "../default-admin/utils/default-pagination";
import { ItemsPerPageInfo } from "../default-admin/utils/item-per-page-info";
import { AdminSkeleton } from "../default-admin/utils/admin-skeleton";

export const MediaUpload = (prop: any) => {
  const {
    list,
    config,
    onDelete,
    onChangeHandle,
    isSkeleton,
    searchValue,
    searchLoading,
    setProcess,
    viewMode,
    setViewMode,
    filterType,
    setFilterType,
    filterDate,
    setFilterDate,
    selectedIds,
    setSelectedIds,
    isBulkMode,
    setIsBulkMode,
    isDragging,
    uploadingFiles,
    selectedItem,
    editName,
    setEditName,
    editDesc,
    setEditDesc,
    editStatus,
    setEditStatus,
    fileInputRef,
    filteredList,
    handleUploadClick,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDeleteItem,
    handleItemClick,
    handleSelectAll,
    handleSaveDetails,
    getDocColor,
  } = useMediaUpload(prop);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-2">
      {/* Hidden File Picker Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={prop?.allowedType === "image" ? "image/*" : ".pdf,.docx,.doc,.xlsx,.xls,.csv,image/*"}
        multiple={prop?.multiple !== false}
      />

      {/* Header */}
      <MediaHeader
        activePageName={prop?.activePageName}
        onUploadClick={handleUploadClick}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isPicker={prop?.isPicker}
      />

      {/* Toolbar / Filters */}
      <MediaToolbar
        filterType={filterType}
        setFilterType={setFilterType}
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        isBulkMode={isBulkMode}
        setIsBulkMode={setIsBulkMode}
        setSelectedIds={setSelectedIds}
        searchValue={searchValue}
        searchLoading={searchLoading}
        onChangeHandle={onChangeHandle}
        allowedType={prop?.allowedType}
        multiple={prop?.multiple}
      />

      {isSkeleton ? (
        <AdminSkeleton />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Main Content (Grid or List) */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "lg:col-span-3 min-h-[450px] relative rounded-xl border border-dashed transition-all duration-300",
              isDragging ? "border-primary bg-primary/5 ring-2 ring-primary/20 scale-[0.99]" : "border-border/60",
              filteredList.length === 0 && "flex flex-col items-center justify-center text-center p-8"
            )}
          >
            {/* Drag & Drop Overlay */}
            {isDragging && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3">
                <div className="p-4 bg-primary/10 rounded-full text-primary animate-bounce">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-lg text-foreground">Drop files here to upload</h3>
                <p className="text-sm text-muted-foreground">Any document format accepted</p>
              </div>
            )}

            {/* Uploading progress indicator */}
            {uploadingFiles.length > 0 && (
              <div className="p-4 bg-muted/40 border-b border-border/50 flex flex-col gap-2 animate-pulse">
                {uploadingFiles.map((name) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-xs font-semibold">Uploading "{name}"...</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">In progress</span>
                  </div>
                ))}
              </div>
            )}

            {filteredList.length === 0 ? (
              <div className="flex flex-col items-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mb-4 border text-muted-foreground/75">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground">No media files found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  Drag and drop files here, or click "Add New File" to start uploading documents to your media library.
                </p>
                <Button onClick={handleUploadClick} variant="outline" className="mt-4 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Select File
                </Button>
              </div>
            ) : viewMode === "grid" ? (
              <MediaGrid
                filteredList={filteredList}
                selectedIds={selectedIds}
                isBulkMode={isBulkMode}
                handleItemClick={handleItemClick}
                handleDeleteItem={handleDeleteItem}
                getDocColor={getDocColor}
                multiple={prop?.multiple}
                allowedType={prop?.allowedType}
              />
            ) : (
              <MediaList
                filteredList={filteredList}
                selectedIds={selectedIds}
                handleSelectAll={handleSelectAll}
                handleItemClick={handleItemClick}
                handleDeleteItem={handleDeleteItem}
                getDocColor={getDocColor}
                multiple={prop?.multiple}
                allowedType={prop?.allowedType}
              />
            )}
          </div>

          {/* Sidebar / Document Details Panel */}
          <MediaSidebar
            selectedItem={selectedItem}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            editName={editName}
            setEditName={setEditName}
            editDesc={editDesc}
            setEditDesc={setEditDesc}
            editStatus={editStatus}
            setEditStatus={setEditStatus}
            handleSaveDetails={handleSaveDetails}
            handleDeleteItem={handleDeleteItem}
            getDocColor={getDocColor}
            onDelete={onDelete}
            setProcess={setProcess}
            isPicker={prop?.isPicker}
            onSelect={prop?.onSelect}
            list={list}
          />
        </div>
      )}

      {/* Pagination Footer */}
      {!isSkeleton && filteredList.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t pt-4 gap-4">
          <ItemsPerPageInfo
            itemPerPage={config?.itemPerPage || 10}
            total={config?.total || 0}
            listLength={list?.length || 0}
            onItemPerPageChange={(val) =>
              onChangeHandle({
                type: "itemPerPage",
                value: val,
              })
            }
          />
          <DefaultPagination
            currentPage={config?.currentPage || 1}
            totalPages={config?.pages || 1}
            onPageChange={(page) =>
              onChangeHandle({
                type: "page",
                value: page,
              })
            }
          />
        </div>
      )}
    </div>
  );
};
