import { z } from "zod";

export interface EntityField {
  name: string;
  label?: string;
  type: "text" | "number" | "boolean" | "currency" | "dropdown";
  required?: boolean;
  options?: string[]; // For dropdowns
}

export interface EntitySchema {
  entityName: string;
  fields: EntityField[];
}

export type GenericEntityData = Record<string, any>;

export type Product = any;
