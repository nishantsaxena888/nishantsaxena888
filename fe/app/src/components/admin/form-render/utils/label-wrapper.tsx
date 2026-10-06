import React, { type ElementType } from "react";

export const LabelWrapper = ({
  label,
  children,
  className,
  required,
  LabelComponent = "label",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
  LabelComponent?: ElementType;
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <LabelComponent className="text-sm font-bold text-zinc-900 dark:text-zinc-400 mb-1.5 block tracking-tight">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </LabelComponent>
      )}
      {children}
    </div>
  );
};
