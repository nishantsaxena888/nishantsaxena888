import React from "react";
import { PageLoader } from "../page-loader";
import { DynamicPage } from "./dynamic-page";
import { ErrorDisplay } from "../error-display/error-display";

interface PageRendererProps {
  loading: boolean;
  content: any;
}

export const PageRenderer = ({ loading, content }: PageRendererProps) => {
  return (
    <>
      {loading ? (
        <PageLoader />
      ) : (
        <>
          {content?.error || content?.status_code === 404 ? (
            <ErrorDisplay
              error={content}
              onRetry={() => window.location.reload()}
            />
          ) : (
            <DynamicPage content={content} />
          )}
        </>
      )}
    </>
  );
};
