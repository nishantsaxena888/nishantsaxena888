import { cn } from "@/lib/utils";

type FormErrorProps = {
  message?: string;
  className?: string;
};

export const FormError = ({
  message,
  className,
}: FormErrorProps) => {
  if (!message) return null;

  return (
    <p className={cn("app-form-error", className)}>
      {message}
    </p>
  );
};