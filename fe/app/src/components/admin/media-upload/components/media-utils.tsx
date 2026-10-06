import React from "react";
import { FileText, FileSpreadsheet, FileImage, File } from "lucide-react";

export const getDocIcon = (type: string) => {
  const t = (type || "").toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "gif", "image"].includes(t)) {
    return <FileImage className="w-10 h-10" />;
  }
  if (t === "pdf") {
    return <FileText className="w-10 h-10" />;
  }
  if (["xlsx", "xls", "csv"].includes(t)) {
    return <FileSpreadsheet className="w-10 h-10" />;
  }
  return <File className="w-10 h-10" />;
};
