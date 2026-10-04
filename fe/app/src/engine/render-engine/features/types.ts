import type { ReactNode } from "react";
interface PropertiesProp {
  level: "base" | "nested";
  type: "static" | "dynamic";
  action?: Action[];
  [key: string]: any;
}
export interface Definition {
  id: string;
  type: string;
  properties: PropertiesProp;
  content: any;
  children?: Definition[];
  config?: any;
  // Implicit RBAC — role names allowed to render this def; absent/"*" = all.
  roles?: string[];
}

interface Action {
  key: string;
  endpoint: string;
  method:
    | "GET"
    | "POST"
    | "PUT"
    | "DELETE"
    | "PATCH"
    | "HEAD"
    | "OPTIONS"
    | "TRACE"
    | "CONNECT";
  queryParams: {
    [key: string]: any;
  };
  "responseMapping?": {
    [key: string]: any;
  };
}

export interface Config {
  meta: {
    title: string;
    description: string;
  };
  definitions: Definition[];
}

export interface RenderComponentProps {
  id: string;
  type: string;
  content: any;
  properties: PropertiesProp;
  actionData?: {
    data: any;
    loading: boolean;
    skeletonLoading: boolean;
    error: string | null;
    firstLoadError: string | null;
    action: (params: any) => Promise<any>;
    searchParameters: any;
  };
  config?: any;
  themeName?: string;
  children?: ReactNode;
}
