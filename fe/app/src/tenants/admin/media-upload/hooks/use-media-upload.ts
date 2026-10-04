import React, { useState, useRef, useMemo, useEffect } from "react";
import { useCurdEntity } from "../../default-admin/utils/use-curd-entity";
import { useFormStyleStore } from "@/store/use-form-style";
import { toast } from "@/lib/toast";

export const useMediaUpload = (prop: any) => {
  const resolvedProp = useMemo(() => {
    if (prop?.isPicker) {
      return {
        ...prop,
        config: {
          activePage: {
            entity: "document",
          },
          searchParameter: prop?.allowedType && prop?.allowedType !== "all" ? {
            type: prop.allowedType,
          } : {},
        },
      };
    }
    return prop;
  }, [prop]);

  const {
    list,
    config,
    onPost,
    onDelete,
    onUpdate,
    onChangeHandle,
    isSkeleton,
    searchValue,
    searchLoading,
    setProcess,
    can,
  } = useCurdEntity(resolvedProp);

  // Method RBAC from OPTIONS/configuration — upload = POST, remove =
  // DELETE, save details = PUT. Denied → handlers toast instead of
  // silently doing nothing (the hook-level 403 is the backstop anyway).
  const canUpload = can?.("post") !== false;
  const canDelete = can?.("delete") !== false;
  const canEdit = can?.("put") !== false;
  const denied = (what: string) => () =>
    toast.error(`Not permitted: ${what}`);

  const { styles, themeName } = useFormStyleStore();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<string>(
    prop?.allowedType === "image" ? "image" : "all"
  );
  const [filterDate, setFilterDate] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState("active");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prevAllowedType, setPrevAllowedType] = useState(prop?.allowedType);
  if (prop?.allowedType !== prevAllowedType) {
    setPrevAllowedType(prop?.allowedType);
    if (prop?.allowedType === "image") {
      setFilterType("image");
    }
  }

  const selectedItem = useMemo(() => {
    if (selectedIds.length === 1) {
      return list?.find((item: any) => item.id === selectedIds[0]) || null;
    }
    return null;
  }, [selectedIds, list]);

  useEffect(() => {
    if (selectedItem) {
      setEditName(selectedItem.name || "");
      setEditDesc(selectedItem.description || "");
      setEditStatus(selectedItem.status || "active");
    } else {
      setEditName("");
      setEditDesc("");
      setEditStatus("active");
    }
  }, [selectedItem]);

  const filteredList = useMemo(() => {
    if (!Array.isArray(list)) return [];
    return list.filter((item: any) => {
      const type = (item.type || "").toLowerCase();
      if (prop?.allowedType === "image" && !["png", "jpg", "jpeg", "webp", "gif", "image"].includes(type)) {
        return false;
      }
      if (filterType === "image" && !["png", "jpg", "jpeg", "webp", "gif", "image"].includes(type)) {
        return false;
      }
      if (filterType === "pdf" && type !== "pdf") {
        return false;
      }
      if (filterType === "docx" && !["docx", "doc"].includes(type)) {
        return false;
      }
      if (filterType === "xlsx" && !["xlsx", "xls", "csv"].includes(type)) {
        return false;
      }
      return true;
    });
  }, [list, filterType, prop?.allowedType]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const processUpload = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;

    let fileArray = Array.from(files);
    if (prop?.allowedType === "image") {
      const nonImages = fileArray.filter(
        (f) => !f.type.startsWith("image/") && !["png", "jpg", "jpeg", "webp", "gif"].includes(f.name.split(".").pop()?.toLowerCase() || "")
      );
      if (nonImages.length > 0) {
        toast.error("Only image files are allowed in this picker");
        fileArray = fileArray.filter(
          (f) => f.type.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif"].includes(f.name.split(".").pop()?.toLowerCase() || "")
        );
        if (fileArray.length === 0) return;
      }
    }
    setUploadingFiles(fileArray.map((f) => f.name));
    setProcess(true);

    try {
      for (const file of fileArray) {
        const ext = file.name.split(".").pop() || "PDF";
        await onPost({
          name: file.name.replace(/\.[^/.]+$/, ""),
          type: ext.toUpperCase(),
          status: "active",
          url: "/admin/document",
          file_name: file.name,
          description: `Uploaded media document: ${file.name}`,
        });
        toast.success(`"${file.name}" uploaded successfully!`);
        setUploadingFiles((prev) => prev.filter((x) => x !== file.name));
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload some files");
    } finally {
      setUploadingFiles([]);
      setProcess(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUpload(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUpload(e.dataTransfer.files);
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      setProcess(true);
      const res = await onDelete(item.id || item);
      if (res) {
        toast.success("Record deleted successfully");
        setSelectedIds((prev) => prev.filter((x) => x !== item.id));
      }
      setProcess(false);
    }
  };

  const handleItemClick = (item: any) => {
    const id = item.id;
    const isSingleSelect = prop?.multiple === false;

    // Enforce allowedType selection restriction
    if (prop?.allowedType && prop.allowedType !== "all") {
      const type = (item.type || "").toLowerCase();
      const isAllowed = prop.allowedType === "image"
        ? ["png", "jpg", "jpeg", "webp", "gif", "image"].includes(type)
        : type === prop.allowedType.toLowerCase();
      if (!isAllowed) {
        toast.error(`Only ${prop.allowedType} files can be selected in this picker`);
        return;
      }
    }

    setSelectedIds((prev) => {
      if (isSingleSelect) {
        return prev.includes(id) ? [] : [id];
      }
      if (isBulkMode || prop?.isPicker) {
        return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      } else {
        return prev.includes(id) && prev.length === 1 ? [] : [id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map((item: any) => item.id));
    }
  };

  const handleSaveDetails = async () => {
    if (!selectedItem) return;
    if (!editName.trim()) {
      toast.error("Document name cannot be empty");
      return;
    }

    setProcess(true);
    try {
      const response = await onUpdate(selectedItem.id, {
        name: editName,
        description: editDesc,
        status: editStatus,
        type: selectedItem.type,
        file_name: selectedItem.file_name,
        url: selectedItem.url,
      });

      if (response) {
        toast.success("File details updated successfully!");
      }
    } catch (err) {
      console.error("Save details error:", err);
      toast.error("Failed to update file details");
    } finally {
      setProcess(false);
    }
  };

  const getDocColor = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t === "pdf") return "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/30";
    if (["docx", "doc"].includes(t)) return "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/30";
    if (["xlsx", "xls", "csv"].includes(t)) return "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/30";
    return "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800";
  };

  return {
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
    handleUploadClick: canUpload ? handleUploadClick : denied("upload"),
    handleFileChange: canUpload ? handleFileChange : denied("upload"),
    handleDragOver: canUpload ? handleDragOver : undefined,
    handleDragLeave: canUpload ? handleDragLeave : undefined,
    handleDrop: canUpload ? handleDrop : denied("upload"),
    handleDeleteItem: canDelete ? handleDeleteItem : denied("delete"),
    handleItemClick,
    handleSelectAll,
    handleSaveDetails: canEdit ? handleSaveDetails : denied("edit"),
    getDocColor,
    canUpload,
    canDelete,
    canEdit,
  };
};
