import { usePublicRender } from "./utils/use-public-render";
import { PageRenderer } from "../dynamic-page/page-renderer";
import { SiteNav } from "../site-nav/site-nav";

export const HomePage = ({ config }: any) => {
  const { data: content, loading } = usePublicRender({
    menu: config?.data?.menu || [],
    currentPage: "/",
  });
  const hasOwnNav = config?.data?.site_nav === false;
  return (
    <>
      {!hasOwnNav && <SiteNav config={config} />}
      <PageRenderer loading={loading} content={content} />
    </>
  );
};
