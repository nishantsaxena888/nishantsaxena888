import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { NotFound } from "@/pages/not-found/not-found";
import { usePublicRender } from "../home-page/utils/use-public-render";
import { PageRenderer } from "../dynamic-page/page-renderer";
import { SiteNav } from "../site-nav/site-nav";

export interface PublicRendererProps {
  config: any;
}

export const PublicRenderer = ({ config }: PublicRendererProps) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: content, loading } = usePublicRender({
    menu: config?.data?.menu || [],
    currentPage: `/${slug}`,
  });

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Find the menu item that matches the slug
  const menuList = Array.isArray(config?.data?.menu) ? config.data.menu : [];
  const activePage = menuList.find(
    (item: any) =>
      item.entity === slug || item.url?.replace(/^\/|\/$/g, "") === slug,
  );

  useEffect(() => {
    if (activePage?.auth_page && token) {
      const adminMenu = config?.data?.admin_menu;
      const firstAdminPage = adminMenu?.[0]?.url || "/admin/overview";
      navigate(firstAdminPage, { replace: true });
    }
  }, [activePage, token, config, navigate]);

  // If page doesn't exist in menu, 404
  if (!activePage) {
    return <NotFound />;
  }

  if (activePage.public === false) {
    console.warn(`Access denied: Page ${slug} is not public.`);
    return <NotFound />; // Or redirect to /login
  }

  return (
    <>
      <SiteNav config={config} />
      <PageRenderer loading={loading} content={content} />
    </>
  );
};
