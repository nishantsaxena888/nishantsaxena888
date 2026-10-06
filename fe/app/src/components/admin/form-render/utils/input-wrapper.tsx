import { useEffect, type ReactNode, type ElementType } from "react";

type InputWrapperProps = {
  children: (props: {
    value: any;
    onChange: (value: any) => void;
    error?: string;
    onFocus: () => void;
  }) => ReactNode;
  label?: ReactNode;
  error?: string; // Prop based error
  name: string;
  defaultValue?: any;
  validation?: any[];
  control: any;
  LabelComponent?: ElementType;
};

export const InputWrapper = ({
  children,
  error: errorProp,
  control,
  name,
  defaultValue,
  validation,
}: InputWrapperProps) => {
  const {
    registerField,
    unregisterField,
    getValue,
    setValue,
    clearError,
    state,
  } = control;

  useEffect(() => {
    registerField(name, defaultValue, validation);
    return () => unregisterField(name);
  }, [name, registerField, unregisterField, defaultValue, validation]);

  const value = getValue(name);
  const error = errorProp || state?.errors?.[name];

  const onChange = (val: any) => {
    setValue(name, val);
  };

  const onFocus = () => {
    clearError(name);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {children({ value, onChange, error, onFocus })}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};
