import { FormRender } from "../form-render";
import { useGenericForm } from "./utils/use-generic-form";

export const GenericForm = (props: any) => {
  const { themeName, styles, serverError, handleSubmit, finalOptions, populateData } =
    useGenericForm(props);

  const formSchema =
    finalOptions?.form ||
    finalOptions?.content?.form ||
    (finalOptions?.inputs ? finalOptions : null);

  return (
    <div className="w-full">
      {formSchema ? (
        <FormRender
          formSchema={formSchema}
          onSubmit={props.onSubmit || handleSubmit}
          labels={formSchema?.labels}
          themeName={themeName}
          styles={styles}
          serverError={serverError}
          populateData={props.populateData || populateData}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground animate-pulse">
            Configuring secure form...
          </p>
        </div>
      )}
    </div>
  );
};
