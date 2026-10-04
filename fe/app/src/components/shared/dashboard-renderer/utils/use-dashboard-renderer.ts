import { useParams } from "react-router-dom";

export const useDashboardRenderer = (config: any) => {
  const { slug } = useParams<{ slug: string }>();

  const flattenVisibleMenu = (data: any[]) => {
    const result: any[] = [];

    const walk = (items: any[]) => {
      if (!Array.isArray(items)) return;

      for (const item of items) {
        // skip hidden item and all nested children
        if (item?.hide === true) continue;

        const { menu, sub_menu, ...rest } = item;

        // add current item
        result.push(rest);

        // walk children recursively
        if (Array.isArray(menu)) {
          walk(menu);
        }

        if (Array.isArray(sub_menu)) {
          walk(sub_menu);
        }
      }
    };

    walk(data);
    return result;
  };

  const flatData = flattenVisibleMenu(config?.data?.admin_menu);

  const activePage = flatData.find(
    (item: any) =>
      item.entity === slug || item.url.replace(/^\/|\/$/g, "") === slug,
  );
  return { activePage };
};
