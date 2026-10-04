import React from "react";
import { RenderEngine } from "@/engine";

interface DynamicPageProps {
  content: any;
}

export const DynamicPage = ({ content }: DynamicPageProps) => {
  if (!content?.data) return null;

  const { meta } = content.data;
  const config = content.data.config || content.data.data;

  return (
    <>
      <title>{meta?.title}</title>
      <meta name="description" content={meta?.description} />
      <meta property="og:title" content={meta?.title} />
      <meta property="og:description" content={meta?.description} />
      <RenderEngine data={config as any} />
    </>
  );
};
