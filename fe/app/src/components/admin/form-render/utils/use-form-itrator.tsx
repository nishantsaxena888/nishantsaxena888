import { useRenderEngine } from "@/common/engine";

// Field visibility rules — `visible` on a form input. Accepts a single
// rule {field, operator, value}, an array, or {conditions, logic:"AND"|"OR"}.
// Operators mirror the backend filter ops: eq/===, ne/!==, in/includes,
// nin, contains, gt/gte/lt/lte (numeric), exists.
export const evalVisibility = (visibleRules: any, values: any): boolean => {
  if (!visibleRules) return true;

  let rules: any[] = [];
  let logic: "AND" | "OR" = "AND";

  if (Array.isArray(visibleRules)) {
    rules = visibleRules;
  } else if (typeof visibleRules === "object" && visibleRules.conditions) {
    rules = visibleRules.conditions;
    logic = visibleRules.logic || "AND";
  } else if (typeof visibleRules === "object" && visibleRules.field) {
    rules = [visibleRules];
  }

  if (rules.length === 0) return true;

  const results = rules.map((rule) => {
    const fieldVal = rule.field
      .split(".")
      .reduce((acc: any, part: string) => acc?.[part], values);

    const numeric =
      !isNaN(Number(fieldVal)) && !isNaN(Number(rule.value));
    switch (rule.operator) {
      case "===":
      case "eq":
        return fieldVal === rule.value;
      case "!==":
      case "ne":
        return fieldVal !== rule.value;
      case "includes":
      case "in":
        return Array.isArray(fieldVal)
          ? fieldVal.includes(rule.value)
          : Array.isArray(rule.value)
            ? rule.value.includes(fieldVal)
            : String(fieldVal ?? "") === String(rule.value);
      case "nin":
        return Array.isArray(rule.value)
          ? !rule.value.includes(fieldVal)
          : String(fieldVal ?? "") !== String(rule.value);
      case "contains":
        return String(fieldVal ?? "")
          .toLowerCase()
          .includes(String(rule.value ?? "").toLowerCase());
      case "gt":
        return numeric && Number(fieldVal) > Number(rule.value);
      case "gte":
        return numeric && Number(fieldVal) >= Number(rule.value);
      case "lt":
        return numeric && Number(fieldVal) < Number(rule.value);
      case "lte":
        return numeric && Number(fieldVal) <= Number(rule.value);
      case "exists":
        return fieldVal !== undefined && fieldVal !== null && fieldVal !== "";
      default:
        return true;
    }
  });

  return logic === "OR" ? results.some((r) => r) : results.every((r) => r);
};

export const useFormItrator = ({ inputs, control }: any) => {
  const {
    state: { values },
  } = control;
  const checkVisibility = (visibleRules: any) =>
    evalVisibility(visibleRules, values);

  const getGridClasses = (column: any, grid?: string) => {
    if (grid) return grid;
    if (!column) return "col-span-12";
    if (typeof column === "string") return column;

    const classes = [];

    const map: Record<string, Record<number, string>> = {
      xs: {
        1: "col-span-1",
        2: "col-span-2",
        3: "col-span-3",
        4: "col-span-4",
        5: "col-span-5",
        6: "col-span-6",
        7: "col-span-7",
        8: "col-span-8",
        9: "col-span-9",
        10: "col-span-10",
        11: "col-span-11",
        12: "col-span-12",
      },
      sm: {
        1: "sm:col-span-1",
        2: "sm:col-span-2",
        3: "sm:col-span-3",
        4: "sm:col-span-4",
        5: "sm:col-span-5",
        6: "sm:col-span-6",
        7: "sm:col-span-7",
        8: "sm:col-span-8",
        9: "sm:col-span-9",
        10: "sm:col-span-10",
        11: "sm:col-span-11",
        12: "sm:col-span-12",
      },
      md: {
        1: "md:col-span-1",
        2: "md:col-span-2",
        3: "md:col-span-3",
        4: "md:col-span-4",
        5: "md:col-span-5",
        6: "md:col-span-6",
        7: "md:col-span-7",
        8: "md:col-span-8",
        9: "md:col-span-9",
        10: "md:col-span-10",
        11: "md:col-span-11",
        12: "md:col-span-12",
      },
      lg: {
        1: "lg:col-span-1",
        2: "lg:col-span-2",
        3: "lg:col-span-3",
        4: "lg:col-span-4",
        5: "lg:col-span-5",
        6: "lg:col-span-6",
        7: "lg:col-span-7",
        8: "lg:col-span-8",
        9: "lg:col-span-9",
        10: "lg:col-span-10",
        11: "lg:col-span-11",
        12: "lg:col-span-12",
      },
      xl: {
        1: "xl:col-span-1",
        2: "xl:col-span-2",
        3: "xl:col-span-3",
        4: "xl:col-span-4",
        5: "xl:col-span-5",
        6: "xl:col-span-6",
        7: "xl:col-span-7",
        8: "xl:col-span-8",
        9: "xl:col-span-9",
        10: "xl:col-span-10",
        11: "xl:col-span-11",
        12: "xl:col-span-12",
      },
    };

    if (column.xs) classes.push(map.xs[column.xs]);
    if (column.sm) classes.push(map.sm[column.sm]);
    if (column.md) classes.push(map.md[column.md]);
    if (column.lg) classes.push(map.lg[column.lg]);
    if (column.xl) classes.push(map.xl[column.xl]);

    return classes.length > 0 ? classes.join(" ") : "col-span-12";
  };

  const { formInput } = useRenderEngine();

  const InputList = formInput;

  const sortedInputs = [...(inputs || [])].sort((a, b) => {
    // Prioritize nonInput: regular inputs first, nonInputs last
    if (!!a.nonInput !== !!b.nonInput) {
      return a.nonInput ? 1 : -1;
    }

    const orderA = a.order !== undefined ? a.order : Infinity;
    const orderB = b.order !== undefined ? b.order : Infinity;
    return orderA - orderB;
  });
  return { sortedInputs, InputList, getGridClasses, checkVisibility };
};
