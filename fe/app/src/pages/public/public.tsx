import { PublicRenderer } from "@/components/shared/public-renderer";

export const Public = ({ config }: { config: any }) => {
  return <PublicRenderer config={config} />;
};
