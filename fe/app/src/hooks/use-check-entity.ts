import { useParams } from "react-router-dom";

type MenuType = {};
type MenuTypeType = {
  menu: MenuType[];
  isHome?: boolean;
};
export const useCheckEntity = ({ menu, isHome }: MenuTypeType) => {
  const params = useParams();
  console.log(params, menu, isHome);
  return {};
};
