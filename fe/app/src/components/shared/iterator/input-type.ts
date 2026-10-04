export function inputType(field: any) {
  const { kind, options, ui } = field;
  const CheckBoxList: any = {
    multi_select_checkbox: "multi-select-checkbox",
    multi_select_color: "multi-select-color",
    multi_select_chip: "multi-select-chip",
  };

  if (ui.input === "password") {
    return "password";
  }

  if (kind === "button") {
    return "button";
  }
  if (kind === "bool") {
    return "switch";
  }

  if (options && options.length > 0) {
    if (ui.isMultiSelectCheck && CheckBoxList[ui.type]) {
      const multicheckbox = CheckBoxList[ui.type];
      return multicheckbox;
    }
    return "select";
  }

  if (kind === "number") {
    return "number";
  }
  if (kind === "price_range") {
    return "range_slider";
  }

  if (kind === "date") {
    return "date";
  }

  if (["file", "image"].includes(kind)) {
    return "document-picker";
  }

  if (["image_gallery"].includes(kind)) {
    return "image-gallery";
  }

  return "text";
}
