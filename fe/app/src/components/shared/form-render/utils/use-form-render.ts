import { useState, useCallback, useEffect } from "react";

export type ValidationRule = {
  rule:
    | "required"
    | "email"
    | "minLength"
    | "maxLength"
    | "pattern"
    | "match"
    | string;
  value?: any;
  message: string;
};

export type FormState<T = any> = {
  values: T;
  errors: Record<string, string>;
  pending: boolean;
};

export type UseFormRenderProps<T = any> = {
  populateData?: T;
  onSubmit: (values: T) => void | Promise<void>;
  serverError?: Record<string, string[]>;
};

export type ArrayHelpers = {
  append: (item: any) => void;
  prepend: (item: any) => void;
  remove: (index: number) => void;
  insert: (index: number, item: any) => void;
  move: (from: number, to: number) => void;
  replace: (index: number, item: any) => void;
};

/**
 * useFormRender Hook
 * Handles complex form state including nested values, dynamic fields, validation, and errors.
 */
export const useFormRender = <T extends Record<string, any> = any>({
  populateData,
  onSubmit,
  serverError,
}: UseFormRenderProps<T>) => {
  const [values, setStateValues] = useState<T>((populateData || {}) as T);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [rulesMap, setRulesMap] = useState<Record<string, ValidationRule[]>>(
    {},
  );
  const [defaultValuesMap, setDefaultValuesMap] = useState<Record<string, any>>(
    {},
  );

  const populateDataStr = JSON.stringify(populateData);
  const [prevPopulateStr, setPrevPopulateStr] = useState(populateDataStr);
  if (populateDataStr !== prevPopulateStr) {
    setPrevPopulateStr(populateDataStr);
    setStateValues((populateData || {}) as T);
  }

  useEffect(() => {
    if (serverError && Object.keys(serverError).length > 0) {
      const newErrors: Record<string, string> = {};
      Object.entries(serverError).forEach(([key, messages]) => {
        if (Array.isArray(messages)) {
          newErrors[key] = messages[0];
        } else if (typeof messages === "string") {
          newErrors[key] = messages;
        }
      });
      setErrors((prev) => ({ ...prev, ...newErrors }));
    }
  }, [serverError]);

  /**
   * validateField
   * Runs validation rules for a specific field path.
   */
  const validateField = useCallback(
    (path: string, fieldValues: any, rules: ValidationRule[]) => {
      if (!rules || rules.length === 0) return null;

      const val = path
        .split(".")
        .reduce((acc, part) => acc?.[part], fieldValues);

      for (const rule of rules) {
        let isValid = true;

        switch (rule.rule) {
          case "required":
            isValid =
              val !== undefined &&
              val !== null &&
              val !== "" &&
              (Array.isArray(val) ? val.length > 0 : true);
            break;
          case "email":
            isValid = !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
            break;
          case "minLength":
            isValid = !val || String(val).length >= rule.value;
            break;
          case "maxLength":
            isValid = !val || String(val).length <= rule.value;
            break;
          case "pattern":
            isValid = !val || new RegExp(rule.value).test(val);
            break;
          case "match": {
            const targetVal = rule.value
              .split(".")
              .reduce((acc: any, part: string) => acc?.[part], fieldValues);
            isValid = val === targetVal;
            break;
          }
          default:
            // Custom or unhandled rule
            break;
        }

        if (!isValid) return rule.message;
      }

      return null;
    },
    [],
  );

  /**
   * validateForm
   * Validates all registered fields and updates the errors state.
   */
  const validateForm = useCallback(
    (currentValues: any) => {
      const nextErrors: Record<string, string> = {};
      let hasErrors = false;

      Object.keys(rulesMap).forEach((path) => {
        const error = validateField(path, currentValues, rulesMap[path]);
        if (error) {
          nextErrors[path] = error;
          hasErrors = true;
        }
      });

      setErrors(nextErrors);
      return { isValid: !hasErrors, errors: nextErrors };
    },
    [rulesMap, validateField],
  );

  /**
   * validatePaths
   * Validates only a specific set of active field paths and updates the errors state.
   */
  const validatePaths = useCallback(
    (paths: string[]) => {
      let hasErrors = false;
      const nextErrors: Record<string, string> = {};

      paths.forEach((path) => {
        if (rulesMap[path]) {
          const error = validateField(path, values, rulesMap[path]);
          if (error) {
            nextErrors[path] = error;
            hasErrors = true;
          }
        }
      });

      setErrors((prev) => {
        const updatedErrors = { ...prev };
        // Remove previous errors for the validated paths
        paths.forEach((path) => delete updatedErrors[path]);
        // Merge new errors
        return { ...updatedErrors, ...nextErrors };
      });

      return !hasErrors;
    },
    [rulesMap, validateField, values],
  );

  /**
   * getValue
   * Retrieves value from nested path (e.g., "bio.0.name")
   */
  const getValue = useCallback(
    (path: string) => {
      if (!path) return values;
      return path.split(".").reduce((acc, part) => acc?.[part], values);
    },
    [values],
  );

  /**
   * setValue
   * Sets value for a specific path. Automatically handles nested objects/arrays.
   * Also clears error for the modified path.
   */
  const setValue = useCallback((path: string, value: any) => {
    setStateValues((prev) => {
      const next = { ...prev };
      const parts = path?.split(".");
      let current: any = next;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        const nextPart = parts[i + 1];

        if (current[part] === undefined || current[part] === null) {
          current[part] = !isNaN(Number(nextPart)) ? [] : {};
        } else {
          current[part] = Array.isArray(current[part])
            ? [...current[part]]
            : { ...current[part] };
        }
        current = current[part];
      }

      current[parts[parts.length - 1]] = value;
      return next;
    });

    // Clear error locally when user types
    setErrors((prev) => {
      if (!prev[path]) return prev;
      const nextErrors = { ...prev };
      delete nextErrors[path];
      return nextErrors;
    });
  }, []);

  /**
   * setValues
   * Updates multiple values at once.
   */
  const setValues = useCallback((newValues: T) => {
    setStateValues(newValues);
  }, []);

  /**
   * clearError
   * Clears error for a specific path or all errors if path is omitted.
   */
  const clearError = useCallback((path?: string) => {
    if (!path) {
      setErrors({});
    } else {
      setErrors((prev) => {
        if (!prev[path]) return prev;
        const nextErrors = { ...prev };
        delete nextErrors[path];
        return nextErrors;
      });
    }
  }, []);

  /**
   * resetFields

   * Resets the form fields to their default values (or populateData).
   * If paths array is provided, only resets the specified fields.
   */
  const resetFields = useCallback(
    (paths?: string[]) => {
      setStateValues((prev) => {
        const next = { ...prev };
        const fieldsToReset = paths || Object.keys(defaultValuesMap);

        fieldsToReset.forEach((path) => {
          // Get the default value: prioritize populateData, fallback to defaultValuesMap
          const initialVal = path
            .split(".")
            .reduce((acc: any, part) => acc?.[part], populateData || {});
          const defaultVal =
            initialVal !== undefined ? initialVal : defaultValuesMap[path];

          const parts = path?.split(".");
          if (!parts) return;

          let current: any = next;
          for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            const nextPart = parts[i + 1];
            if (current[part] === undefined || current[part] === null) {
              current[part] = !isNaN(Number(nextPart)) ? [] : {};
            } else {
              current[part] = Array.isArray(current[part])
                ? [...current[part]]
                : { ...current[part] };
            }
            current = current[part];
          }

          if (defaultVal === undefined) {
            delete current[parts[parts.length - 1]];
          } else {
            current[parts[parts.length - 1]] = defaultVal;
          }
        });

        return next;
      });

      // Clear errors for reset fields
      setErrors((prev) => {
        const nextErrors = { ...prev };
        const fieldsToReset = paths || Object.keys(defaultValuesMap);
        fieldsToReset.forEach((path) => delete nextErrors[path]);
        return nextErrors;
      });
    },
    [populateData, defaultValuesMap],
  );

  /**
   * registerField
   * Lifecycle function to register a field path, default value, and validation rules.
   */
  const registerField = useCallback(
    (path: string, defaultValue?: any, rules?: ValidationRule[]) => {
      if (rules) {
        setRulesMap((prev) => ({ ...prev, [path]: rules }));
      }

      setDefaultValuesMap((prev) => {
        if (path in prev) return prev;
        return { ...prev, [path]: defaultValue };
      });

      setStateValues((prev) => {
        const parts = path?.split(".");
        if (!parts) return prev;

        let exists = true;
        let current: any = prev;
        for (const part of parts) {
          if (current === undefined || current === null || !(part in current)) {
            exists = false;
            break;
          }
          current = current[part];
        }

        if ((exists && current !== undefined) || defaultValue === undefined)
          return prev;

        const next = { ...prev };
        let nested: any = next;

        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          const nextPart = parts[i + 1];

          if (nested[part] === undefined || nested[part] === null) {
            nested[part] = !isNaN(Number(nextPart)) ? [] : {};
          } else {
            nested[part] = Array.isArray(nested[part])
              ? [...nested[part]]
              : { ...nested[part] };
          }
          nested = nested[part];
        }

        nested[parts[parts.length - 1]] = defaultValue;
        return next;
      });
    },
    [],
  );

  /**
   * unregisterField
   * Removes field value, associated errors, and rules.
   */
  const unregisterField = useCallback((path: string) => {
    setRulesMap((prev) => {
      const next = { ...prev };
      delete next[path];
      return next;
    });

    setStateValues((prev) => {
      const parts = path?.split(".");
      const lastPart = parts?.pop();
      if (lastPart === undefined) return prev;

      const next = { ...prev };
      let current: any = next;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (current[part] === undefined || current[part] === null) return prev;

        current[part] = Array.isArray(current[part])
          ? [...current[part]]
          : { ...current[part] };
        current = current[part];
      }

      if (Array.isArray(current)) {
        current.splice(Number(lastPart), 1);
      } else {
        delete current[lastPart];
      }
      return next;
    });

    setErrors((prev) => {
      const nextErrors = { ...prev };
      let hasChange = false;

      if (nextErrors[path]) {
        delete nextErrors[path];
        hasChange = true;
      }

      const childPrefix = `${path}.`;
      Object.keys(nextErrors).forEach((key) => {
        if (key.startsWith(childPrefix)) {
          delete nextErrors[key];
          hasChange = true;
        }
      });

      return hasChange ? nextErrors : prev;
    });
  }, []);

  /**
   * handleSubmit
   * Validates form and handles submission.
   */
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      const { isValid, errors: validationErrors } = validateForm(values);
      if (!isValid) {
        console.warn("useFormRender: Validation failed", validationErrors);
        return;
      }

      setPending(true);
      try {
        await onSubmit(values);
      } catch (err) {
        console.error("useFormRender: onSubmit Error", err);
      } finally {
        setPending(false);
      }
    },
    [onSubmit, validateForm, values, errors],
  );

  /**
   * getArrayHelpers
   */
  const getArrayHelpers = useCallback(
    (path: string): ArrayHelpers => {
      const array: any = getValue(path) || [];

      return {
        append: (item: any) => setValue(path, [...array, item]),
        prepend: (item: any) => setValue(path, [item, ...array]),
        remove: (index: number) => {
          const next = [...array];
          next.splice(index, 1);
          setValue(path, next);
        },
        insert: (index: number, item: any) => {
          const next = [...array];
          next.splice(index, 0, item);
          setValue(path, next);
        },
        move: (from: number, to: number) => {
          const next = [...array];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          setValue(path, next);
        },
        replace: (index: number, item: any) => {
          const next = [...array];
          next[index] = item;
          setValue(path, next);
        },
      };
    },
    [getValue, setValue],
  );

  return {
    state: {
      values,
      errors,
      pending,
    },
    registerField,
    unregisterField,
    getValue,
    setValue,
    setValues,
    clearError,
    handleSubmit,
    validateForm,
    validatePaths,
    validateField: (path: string) =>
      validateField(path, values, rulesMap[path]),
    getArrayHelpers,
    resetFields,
    setErrors,
  };
};
