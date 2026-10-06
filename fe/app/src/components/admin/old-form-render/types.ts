export interface ValidationRule {
  type:
    | "required"
    | "min"
    | "max"
    | "minLength"
    | "maxLength"
    | "pattern"
    | "email"
    | "regex"
    | "custom";
  value?: any;
  message: string;
  validate?: (value: any, formValues: any) => boolean | Promise<boolean>;
}

export interface FieldSchema {
  name: string;
  label?: string;
  placeholder?: string;
  componentType: string;
  type?: "input" | "display";
  defaultValue?: any;
  validation?: ValidationRule[];
  children?: FieldSchema[];
  props?: Record<string, any>;
  config?: any;
  persist?: boolean;
  required?: boolean;
  style?: React.CSSProperties;
  className?: string;
  columns?: number; // Number of columns for this field (for groups/arrays)
  colSpan?: number; // How many columns this field should span
  visible?: string | ((values: any) => boolean); // Condition or function to determine visibility
}

export interface FormPersistence {
  key: string;
  fields?: string[]; // If omitted, persist all
}

export interface FormSchema {
  id: string;
  title?: string;
  description?: string;
  layout?: "default" | "step" | "accordion";
  persistence?: FormPersistence;
  fields: FieldSchema[];
  initialValues?: any;
  config?: any;
  validateBeforeNext?: boolean;
  style?: React.CSSProperties;
  className?: string;
  columns?: number; // Global columns for the default layout or sections
}
