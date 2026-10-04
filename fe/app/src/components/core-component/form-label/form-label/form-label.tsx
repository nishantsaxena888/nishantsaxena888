import { Label as ShadcnLabel } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type LabelFieldProps = {
  htmlFor?: string;
  label?: string;
  children?: React.ReactNode;
  required?: boolean;
  className?: string;
};

export const FormLabel = ({
  htmlFor,
  label,
  children,
  required,
  className,
}: LabelFieldProps) => {
  const content = children || label;
  if (!content) return null;

  return (
    <ShadcnLabel
      htmlFor={htmlFor}
      className={cn("app-form-label", className)}
    >
      {content}
      {required && <span className="text-red-500"> *</span>}
    </ShadcnLabel>
  );
};