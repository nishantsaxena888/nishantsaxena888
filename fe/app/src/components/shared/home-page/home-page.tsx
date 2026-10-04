import { usePublicRender } from "./utils/use-public-render";
import { PageRenderer } from "../dynamic-page/page-renderer";

export const HomePage = ({ config }: any) => {
  const { data: content, loading } = usePublicRender({
    menu: config?.data?.menu || [],
    currentPage: "/",
  });
  return <PageRenderer loading={loading} content={content} />;
};
