import { useState } from "react";

export const useFormLogic = ({
  formSchema,
  validateForm,
  state,
  handleSubmit,
}: any) => {
  const [process, setProcess] = useState(false);
  const formTypes = formSchema?.formType;
  const groupLevelValidation = formSchema?.groupLevelValidation;

  const groupList = formSchema?.inputs?.map((input: any) => ({
    name: input.name,
    label: input.label,
  }));

  const [activeTab, setActiveTab] = useState(groupList?.[0]?.name);
  const [validatedTabs, setValidatedTabs] = useState<string[]>([]);

  const handleTabChange = (newTab: string, isValidated = false) => {
    if (isValidated) {
      setValidatedTabs((prev) => [...new Set([...prev, activeTab])]);
    }
    setActiveTab(newTab);
  };

  const handleFormSubmit = async () => {
    if (formTypes === "tabs" && !groupLevelValidation) {
      const { isValid, errors: validationErrors } = validateForm(state.values);

      if (!isValid) {
        const errorFields = Object.keys(validationErrors);

        const getFieldPaths = (inputs: any[]): string[] => {
          let paths: string[] = [];
          inputs?.forEach((input) => {
            if (
              input.name &&
              !["submit", "button", "tabs"].includes(input.type)
            ) {
              paths.push(input.name);
            }
            if (input.inputs) paths = paths.concat(getFieldPaths(input.inputs));
            if (input.children)
              paths = paths.concat(getFieldPaths(input.children));
          });
          return paths;
        };

        // Find the first tab that contains a field with an error
        for (const tab of formSchema?.inputs || []) {
          if (tab.type === "tabs" || tab.type === "group") {
            const tabFields = getFieldPaths(tab.inputs || tab.children || []);
            if (tabFields.some((field) => errorFields.includes(field))) {
              setActiveTab(tab.name);
              break;
            }
          }
        }
        return;
      }
    }

    // Validation passed (or handled by specific component), proceed with normal submit
    setProcess(true);
    await handleSubmit();
    setProcess(false);
  };
  return {
    formTypes,
    groupLevelValidation,
    groupList,
    activeTab,
    validatedTabs,
    handleTabChange,
    handleFormSubmit,
    process,
  };
};
