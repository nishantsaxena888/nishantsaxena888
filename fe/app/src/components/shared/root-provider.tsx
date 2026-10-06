import { useState, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ProcessLoader } from "./process-loader";
import { LanguageProvider } from "./language-provider";
import { ThemeProvider } from "./theme-provider";
import AppProvider from "./app-provider";
import ApiProvider from "./api-provider";
import AppRouterProvider from "./app-router-provider";
import { componentsMap } from "@/tenants";
import { formInput } from "../shared/form-input/form-input";

const RootProvider = () => {
  useEffect(() => {
    import("../../index.css").catch((err) => {
      console.error("Failed to load CSS", err);
    });
  }, []);

  return (
    <LanguageProvider>
      <ApiProvider componentMap={componentsMap} formInput={formInput}>
        <AppProvider>
          {(data) => {
            return (
              <ThemeProvider defaultTheme="default">
                <TooltipProvider>
                  <AppRouterProvider data={data} />
                  <Toaster richColors />
                  <ProcessLoader />
                </TooltipProvider>
              </ThemeProvider>
            );
          }}
        </AppProvider>
      </ApiProvider>
    </LanguageProvider>
  );
};

export default RootProvider;
