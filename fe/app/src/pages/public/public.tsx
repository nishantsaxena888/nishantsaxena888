import { PublicRenderer } from "@/components/site/public-renderer";

export const Public = ({ config }: { config: any }) => {
  return <PublicRenderer config={config} />;
};
