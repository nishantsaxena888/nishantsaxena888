export const useFormTabFooter = ({
  currentIndex,
  totalTabs,
  groupList,
  onTabChange,
  control,
  config,
  groupLevelValidation,
}: any) => {
  const isNextDisabled = currentIndex === totalTabs - 1;
  const isPrevDisabled = currentIndex === 0;
  const isLast = currentIndex === totalTabs - 1;

  const getFieldPaths = (inputs: any[]): string[] => {
    let paths: string[] = [];
    inputs.forEach((input) => {
      if (input.name && !["submit", "button", "tabs"].includes(input.type)) {
        paths.push(input.name);
      }
      if (input.inputs) paths = paths.concat(getFieldPaths(input.inputs));
      if (input.children) paths = paths.concat(getFieldPaths(input.children));
    });
    return paths;
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isNextDisabled) return;

    if (groupLevelValidation && config?.inputs && control?.validatePaths) {
      const paths = getFieldPaths(config.inputs);
      const isValid = control.validatePaths(paths);

      if (!isValid) return; // Prevent next tab if validation fails
    }

    if (groupList[currentIndex + 1]) {
      // Since validation passed (or was skipped), mark current as validated
      onTabChange(groupList[currentIndex + 1].name, true);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isPrevDisabled && groupList[currentIndex - 1]) {
      onTabChange(groupList[currentIndex - 1].name);
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    if (config?.inputs && control?.resetFields) {
      const paths = getFieldPaths(config.inputs);
      control.resetFields(paths);
    }
  };

  return { isNextDisabled, isPrevDisabled, handleNext, handlePrev, handleReset, isLast };
};
