import { cn } from "@/lib/utils";
import { useFormConfig } from "../form-config-context";

export type TabHeaderClassNamesType = {
  base?: string;
  button?: {
    base?: string;
    active?: string;
    inactive?: string;
    disabled?: string;
  };
};

type FormTabHeaderType = {
  validatedTabs: string[];
  /** Show only the active tab label */
  showActiveOnly?: boolean;
  /** Optional heading text displayed above the tabs */
  heading?: string;
};

export const FormTabHeader = ({
  validatedTabs = [],
  showActiveOnly = false,
  heading = "",
}: FormTabHeaderType) => {
  const { groupList: list, activeTab, onTabChange, groupLevelValidation, classNames, tabOrientation } = useFormConfig();

  const activeIndex = list?.findIndex((m: any) => m.name === activeTab) ?? 0;
  const headerClassNames = classNames?.tabs?.tabHeader;
  const isVertical = tabOrientation === "vertical";

  const baseClass = isVertical
    ? cn(
      "flex flex-col w-full border-r border-primary/20 pr-0 mb-0 pb-0 min-h-full",
      headerClassNames?.base
        ?.replace(/\bborder-b\b/g, "")
        ?.replace(/\bmb-\d+\b/g, "")
        ?.replace(/\bgap-x-\d+\b/g, "")
        ?.replace(/\bpx-\d+\b/g, "")
        ?.replace(/\bpt-\d+\b/g, "")
    )
    : cn("flex gap-4", headerClassNames?.base);

  const buttonBaseClass = isVertical
    ? cn(
      /*  "text-[12px] font-black py-2 px-2 transition-all uppercase tracking-widest text-left block w-full hover:bg-slate-100 dark:hover:bg-zinc-900/30 select-none border-r-4 border-transparent -mr-[2px] cursor-pointer", */
      "px-2 py-2 hover:bg-primary/5 rounded-l-[7px]",
      headerClassNames?.button?.base
        ?.replace(/\bpb-\d+\b/g, "")
        ?.replace(/\b-mb-px\b/g, "")
    )
    : headerClassNames?.button?.base;

  const buttonActiveClass = isVertical
    ? cn(
      "text-primary font-black border-r-4 border-primary/50 bg-transparent",
      headerClassNames?.button?.active
        ?.replace(/\bborder-[a-z]+-\d+\b/g, "")
        ?.replace(/\bborder-[a-z]+\b/g, "")
        ?.replace(/\btext-zinc-900\b/g, "")
        ?.replace(/\bbg-\S+\b/g, "")
    )
    : headerClassNames?.button?.active;

  const buttonInactiveClass = isVertical
    ? cn(
      "text-zinc-400 dark:text-zinc-500 font-bold hover:text-zinc-600  bg-transparent",
      headerClassNames?.button?.inactive
        ?.replace(/\bborder-[a-z]+-\d+\b/g, "")
        ?.replace(/\bborder-[a-z]+\b/g, "")
        ?.replace(/\btext-zinc-400\b/g, "")
        ?.replace(/\bbg-\S+\b/g, "")
    )
    : headerClassNames?.button?.inactive;

  const buttonActiveOnlyClass = isVertical
    ? cn("text-primary font-black border-r-4 border-primary bg-transparent")
    : headerClassNames?.button?.active;

  // Optional heading above tabs
  const headingElement = heading ? (
    <h3 className="text-lg font-semibold mb-2">{heading}</h3>
  ) : null;

  // Render only active tab label when requested
  if (showActiveOnly) {
    const activeMenu = list?.find((m: any) => m.name === activeTab);
    if (!activeMenu) return null;
    return (
      <>{headingElement}
        <div className={baseClass}>
          <div className={cn(buttonBaseClass, buttonActiveOnlyClass)}>
            {activeMenu.label}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {headingElement}
      <div className={baseClass}>
        {list?.map((menu: any, index: number) => {
          let isDisabled = false;

          if (groupLevelValidation) {
            if (index > activeIndex) {
              // Check if all previous tabs are validated
              const prevTabsCount = index;
              let validatedCount = 0;

              for (let i = 0; i < index; i++) {
                if (validatedTabs.includes(list[i].name)) {
                  validatedCount++;
                }
              }
              isDisabled = validatedCount !== prevTabsCount;
            }
          }

          return (
            <div
              key={menu.name}
              className={cn(
                buttonBaseClass,
                menu.name === activeTab ? buttonActiveClass : buttonInactiveClass,
                isDisabled
                  ? "opacity-50 cursor-not-allowed " + headerClassNames?.button?.disabled
                  : "cursor-pointer",
              )}
              onClick={() => {
                if (!isDisabled && onTabChange) onTabChange(menu.name);
              }}
            >
              {menu.label}
            </div>
          );
        })}
      </div>
    </>
  );
};
