import { useRouteParams } from "@/platform/navigation";

type MenuType = Record<string, unknown>;
type MenuTypeType = {
  menu: MenuType[];
  isHome?: boolean;
};
export const useCheckEntity = ({ menu, isHome }: MenuTypeType) => {
  const params = useRouteParams();
  console.log(params, menu, isHome);
  return {};
};
