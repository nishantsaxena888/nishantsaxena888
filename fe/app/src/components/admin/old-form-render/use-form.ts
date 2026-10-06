import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import type { FieldSchema, FormSchema, ValidationRule } from './types';
import { storage } from "@/platform/storage";

/**
 * Utility to get value from nested object by path
 */
const getByPath = (obj: any, path: string) => {
  if (!obj || !path) return undefined;
  // Handle array brackets
  const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
  const keys = normalizedPath.split('.');
  return keys.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
};

/**
 * Utility to set value in nested object by path without mutation
 */
const setByPath = (obj: any, path: string, value: any): any => {
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  const newObj = JSON.parse(JSON.stringify(obj || {}));
  let current = newObj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] === undefined) {
      // Check if next key is a number to decide between array or object
      const nextKey = keys[i + 1];
      current[key] = /^\d+$/.test(nextKey) ? [] : {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return newObj;
};

/**
 * Utility to delete value by path (for removing array items)
 */
const deleteByPath = (obj: any, path: string): any => {
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  const newObj = JSON.parse(JSON.stringify(obj || {}));
  let current = newObj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) return newObj;
    current = current[key];
  }

  const lastKey = keys[keys.length - 1];
  if (Array.isArray(current)) {
    current.splice(Number(lastKey), 1);
  } else {
    delete current[lastKey];
  }
  return newObj;
};

export const useForm = <T extends Record<string, any>>(initialValues: T, schema?: FormSchema) => {
  // Persistence initialization
  const getInitialValues = () => {
    if (!schema?.persistence) return initialValues;
    
    try {
      const persisted = storage.getItem(`form_persist_${schema.persistence.key}`);
      if (persisted) {
        const parsed = JSON.parse(persisted);
        const merge = (target: any, source: any) => {
          for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
              if (!target[key]) target[key] = {};
              merge(target[key], source[key]);
            } else {
              target[key] = source[key];
            }
          }
          return target;
        };
        return merge({ ...initialValues }, parsed);
      }
    } catch (e) {
      console.error("Failed to load persisted form data", e);
    }
    return initialValues;
  };

  const [values, setValues] = useState<T>(getInitialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  // Sync values when initialValues or schema changes — render-phase
  // adjust keyed on the schema id + serialized initial values.
  const initKey = `${schema?.id ?? ""}|${JSON.stringify(initialValues)}`;
  const [prevInitKey, setPrevInitKey] = useState(initKey);
  if (initKey !== prevInitKey) {
    setPrevInitKey(initKey);
    setValues(getInitialValues());
    setErrors({});
  }
  // Persistence Effect
  useEffect(() => {
    if (!schema?.persistence) return;

    const dataToPersist: any = {};
    const persistFields = schema.persistence.fields;

    if (!persistFields) {
      storage.setItem(`form_persist_${schema.persistence.key}`, JSON.stringify(values));
    } else {
      persistFields.forEach(name => {
        const val = getByPath(values, name);
        if (val !== undefined) {
          setByPath(dataToPersist, name, val);
        }
      });
      storage.setItem(`form_persist_${schema.persistence.key}`, JSON.stringify(dataToPersist));
    }
  }, [values, schema?.persistence]);

  const validationRules = useRef<Record<string, ValidationRule[]>>({});

  // Initialize validation rules from schema — computed in useMemo, then
  // committed to the ref in an effect (refs must not be written in render).
  const flattenedRules = useMemo(() => {
    if (schema) {
      const flattenedRules: Record<string, ValidationRule[]> = {};
      
      const traverse = (fields: FieldSchema[], parentName: string = '') => {
        fields.forEach(field => {
          const fieldName = parentName ? (field.name.startsWith('.') ? `${parentName}${field.name}` : `${parentName}.${field.name}`) : field.name;
          
          // Register rules for the field itself (even if it's a group or array)
          if (field.validation && field.validation.length > 0) {
            flattenedRules[fieldName] = field.validation;
          }

          if (field.componentType === 'array' || field.componentType === 'group') {
            if (field.children) {
              if (field.componentType === 'array') {
                const items = getByPath(values, fieldName);
                if (Array.isArray(items)) {
                  items.forEach((_, index) => {
                    const itemName = `${fieldName}[${index}]`;
                    traverse(field.children!, itemName);
                  });
                }
              } else {
                traverse(field.children, fieldName);
              }
            }
          }
        });
      };
      
      traverse(schema.fields);
      return flattenedRules;
    }
    return {};
  }, [schema, values]);

  useEffect(() => {
    validationRules.current = flattenedRules;
  }, [flattenedRules]);

  const validateField = useCallback(async (fieldName: string, value: any, currentValues: any) => {
    const rules = validationRules.current[fieldName];
    if (!rules) return '';

    for (const rule of rules) {
      switch (rule.type) {
        case 'required':
          if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
            return rule.message;
          }
          break;
        case 'min':
          if (typeof value === 'number' && value < rule.value) return rule.message;
          break;
        case 'max':
          if (typeof value === 'number' && value > rule.value) return rule.message;
          break;
        case 'minLength':
          if (typeof value === 'string' && value.length < rule.value) return rule.message;
          break;
        case 'maxLength':
          if (typeof value === 'string' && value.length > rule.value) return rule.message;
          break;
        case 'email': {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (typeof value === 'string' && value && !emailRegex.test(value)) return rule.message;
          break;
        }
        case 'regex': {
          const pattern = typeof rule.value === 'string' ? new RegExp(rule.value) : rule.value;
          if (pattern instanceof RegExp && !pattern.test(value)) return rule.message;
          break;
        }
        case 'pattern':
          if (rule.value instanceof RegExp && !rule.value.test(value)) return rule.message;
          break;
        case 'custom':
          if (rule.validate) {
            const isValid = await rule.validate(value, currentValues);
            if (!isValid) return rule.message;
          }
          break;
      }
    }
    return '';
  }, []);

  const setValue = useCallback(async (fieldName: string, value: any) => {
    setValues(prev => {
      const nextValues = setByPath(prev, fieldName, value);
      
      setErrors(prevErrors => {
        if (prevErrors[fieldName]) {
            const newErrors = { ...prevErrors };
            delete newErrors[fieldName];
            return newErrors;
        }
        return prevErrors;
      });

      validateField(fieldName, value, nextValues).then(error => {
        if (error) {
          setErrors(prevErrors => ({ ...prevErrors, [fieldName]: error }));
        }
      });

      return nextValues;
    });
  }, [validateField]);

  const getValue = useCallback((name: string) => {
    return getByPath(values, name);
  }, [values]);

  const addArrayItem = useCallback((name: string, defaultValue: any = '') => {
    setValues(prev => {
      const currentArray = getByPath(prev, name) || [];
      const nextArray = [...currentArray, defaultValue];
      return setByPath(prev, name, nextArray);
    });
  }, []);

  const removeArrayItem = useCallback((name: string, index: number) => {
    setValues(prev => {
      const fieldName = `${name}[${index}]`;
      const nextValues = deleteByPath(prev, fieldName);
      
      setErrors(prevErrors => {
        const nextErrors: Record<string, string> = {};
        Object.keys(prevErrors).forEach(errName => {
          if (errName.startsWith(name)) {
            const regex = new RegExp(`${name.replace(/\[/g, '\\[').replace(/\]/g, '\\]')}\\[(\\d+)\\](.*)`);
            const match = errName.match(regex);
            if (match) {
              const itemIndex = parseInt(match[1]);
              const suffix = match[2];
              if (itemIndex < index) {
                nextErrors[errName] = prevErrors[errName];
              } else if (itemIndex > index) {
                const newName = `${name}[${itemIndex - 1}]${suffix}`;
                nextErrors[newName] = prevErrors[errName];
              }
            } else {
              nextErrors[errName] = prevErrors[errName];
            }
          } else {
            nextErrors[errName] = prevErrors[errName];
          }
        });
        return nextErrors;
      });

      return nextValues;
    });
  }, []);

  const validateAll = useCallback(async (currentValues: any) => {
    const newErrors: Record<string, string> = {};
    const names = Object.keys(validationRules.current);
    
    for (const name of names) {
      const val = getByPath(currentValues, name);
      const error = await validateField(name, val, currentValues);
      if (error) {
        newErrors[name] = error;
      }
    }
    
    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  }, [validateField]);

  const handleSubmit = useCallback((callback: (data: T) => void | Promise<void>, onError?: (errors: Record<string, string>) => void) => {
    return async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setIsSubmitting(true);
      
      const { isValid, errors: currentErrors } = await validateAll(values);
      if (isValid) {
        await callback(values);
      } else if (onError) {
        onError(currentErrors);
      }
      
      setIsSubmitting(false);
    };
  }, [values, validateAll]);

  const setError = useCallback((name: string, message: string) => {
    setErrors(prev => ({ ...prev, [name]: message }));
  }, []);

  const validateName = useCallback(async (baseName: string) => {
    const currentValues = values; 
    let hasError = false;
    const newErrors = { ...errors };

    const namesToValidate = Object.keys(validationRules.current).filter(n => 
      n === baseName || n.startsWith(`${baseName}.`) || n.startsWith(`${baseName}[`)
    );

    for (const name of namesToValidate) {
      const val = getByPath(currentValues, name);
      const error = await validateField(name, val, currentValues);
      if (error) {
        newErrors[name] = error;
        hasError = true;
      } else {
        delete newErrors[name];
      }
    }

    setErrors(newErrors);
    return !hasError;
  }, [values, errors, validateField]);

  const persistKey = schema?.persistence?.key;
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    if (persistKey) {
      storage.removeItem(`form_persistence_${persistKey}`);
    }
  }, [initialValues, persistKey]);

  return {
    values,
    errors,
    isSubmitting,
    setValue,
    getValue,
    addArrayItem,
    removeArrayItem,
    handleSubmit,
    setError,
    setValues,
    activeStep,
    setActiveStep,
    validateName,
    resetForm,
    isValid: Object.keys(errors).length === 0
  };
};
