import React from 'react';
import { useForm } from './use-form';
import { useRenderEngine } from '@/common/engine/render-engine/features/render-engine-context';
import type { FormSchema, FieldSchema } from './types';

interface OldFormRendererProps {
  schema: FormSchema;
  onSubmit: (data: any) => void | Promise<void>;
  fieldHeight?: string;
  fieldBorderRadius?: string;
  primaryColor?: string;
  fontSize?: string;
  gap?: string;
  columns?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  description?: string;
  onCancel?: () => void;
}

export const OldFormRenderer: React.FC<OldFormRendererProps> = ({ 
  schema, 
  onSubmit, 
  fieldHeight, 
  fieldBorderRadius,
  primaryColor = '#4f46e5',
  fontSize = '14px',
  gap = '1.5rem',
  columns,
  className,
  style,
  title,
  description,
  onCancel
}) => {
  const { formInput } = useRenderEngine();
  const form = useForm(schema.initialValues || {}, schema);
  const [openAccordions, setOpenAccordions] = React.useState<Record<string, boolean>>({});

  const effectiveColumns = columns || schema.columns || 1;
  const gridClass = effectiveColumns > 1 ? `form-grid cols-${effectiveColumns}` : 'flex flex-col';

  const getColSpanClass = (span?: number, totalCols: number = 1) => {
    if (!span || totalCols === 1) return '';
    if (span >= totalCols) return 'col-span-full';
    return `col-span-${span}`;
  };

  // Dynamic global styles based on props
  const globalVarStyle = {
    '--field-height': fieldHeight || 'auto',
    '--field-border-radius': fieldBorderRadius || '0.75rem',
    '--primary-color': primaryColor,
    '--font-size': fontSize,
    '--section-gap': gap,
    '--grid-cols': effectiveColumns,
  } as React.CSSProperties;

  const toggleAccordion = (id: string) => {
    setOpenAccordions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFormError = (currentErrors: Record<string, string>) => {
    const errorNames = Object.keys(currentErrors);
    if (errorNames.length === 0) return;

    const firstErrorFieldIndex = schema.fields.findIndex(field => 
      errorNames.some(name => name === field.name || name.startsWith(`${field.name}.`) || name.startsWith(`${field.name}[`))
    );

    if (firstErrorFieldIndex !== -1) {
      if (schema.layout === 'step') {
        form.setActiveStep(firstErrorFieldIndex);
      } else if (schema.layout === 'accordion') {
        const field = schema.fields[firstErrorFieldIndex];
        setOpenAccordions(prev => ({ ...prev, [field.name]: true }));
        const element = document.getElementById(`field-${field.name}`);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleNextStep = async () => {
    const currentField = schema.fields[form.activeStep];
    const shouldValidate = currentField.required !== false && (schema.validateBeforeNext || currentField.required);
    
    if (shouldValidate) {
      const isValid = await form.validateName(currentField.name);
      if (!isValid) return;
    }
    form.setActiveStep(s => s + 1);
  };

  const handleStepClick = async (index: number) => {
    if (index === form.activeStep) return;
    if (index > form.activeStep) {
      const currentField = schema.fields[form.activeStep];
      const shouldValidate = currentField.required !== false && (schema.validateBeforeNext || currentField.required);
      if (shouldValidate) {
        const isValid = await form.validateName(currentField.name);
        if (!isValid) return;
      }
    }
    form.setActiveStep(index);
  };

  const renderField = (field: FieldSchema) => {
    const { name } = field;
    
    // Visibility Check
    if (field.visible) {
      let isVisible = true;
      if (typeof field.visible === 'function') {
        isVisible = field.visible(form.values);
      } else if (typeof field.visible === 'string') {
        // Simple string evaluation (e.g. "type === 'admin'")
        try {
          // This is a bit risky but common in these types of engines
          // For a safer approach, we could use a parser
          const fn = new Function('values', `with(values) { return ${field.visible}; }`);
          isVisible = fn(form.values);
        } catch (e) {
          console.warn(`Failed to evaluate visibility for ${name}`, e);
        }
      }
      if (!isVisible) return null;
    }

    const isDisplay = field.type === 'display';
    const value = form.getValue(name);
    const error = form.errors[name];

    if (field.componentType === 'group') {
      const groupCols = field.columns || 1;
      const groupGridClass = groupCols > 1 ? `form-grid cols-${groupCols}` : 'flex flex-col gap-4';
      
      return (
        <div 
          key={name} 
          id={`field-${name}`} 
          className={`mb-6 p-6 border rounded-2xl bg-white shadow-sm transition-all ${error ? 'border-red-300 ring-2 ring-red-100' : ''} ${field.className || ''} ${getColSpanClass(field.colSpan, effectiveColumns)}`}
          style={field.style}
        >
          <label className="text-xl font-black text-gray-900 block mb-6 col-span-full border-b pb-2">{field.label}</label>
          <div className={groupGridClass} style={{ gap: 'var(--section-gap)' }}>
            {field.children?.map(child => {
              const childName = `${name}.${child.name}`;
              return renderField({ ...child, name: childName });
            })}
          </div>
          {error && <p className="mt-3 text-sm text-red-500 font-bold col-span-full">{error}</p>}
        </div>
      );
    }

    if (field.componentType === 'array') {
      const items = Array.isArray(value) ? value : [];
      return (
        <div key={name} id={`field-${name}`} className={`mb-6 p-4 border rounded-xl bg-gray-50/50 ${getColSpanClass(field.colSpan, effectiveColumns)}`}>
          <div className="flex justify-between items-center mb-4">
            <label className="text-lg font-semibold text-gray-800">{field.label}</label>
            <button
              type="button"
              onClick={() => form.addArrayItem(name, field.defaultValue || {})}
              className="px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              Add Item
            </button>
          </div>
          <div className="space-y-4">
            {items.map((_, index) => (
              <div key={`${name}[${index}]`} className="relative p-4 bg-white border rounded-lg shadow-sm">
                <button
                  type="button"
                  onClick={() => form.removeArrayItem(name, index)}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {field.children?.map(child => {
                  const childName = `${name}[${index}]${child.name.startsWith('.') ? child.name : '.' + child.name}`;
                  return renderField({ ...child, name: childName });
                })}
              </div>
            ))}
          </div>
          {error && <p className="mt-2 text-sm text-red-500 font-medium">{error}</p>}
        </div>
      );
    }

    const getComponent = (type: string) => {
      if (formInput[type]) return formInput[type];
      
      // Try case-insensitive lookup
      const lowerType = type.toLowerCase();
      const match = Object.keys(formInput).find(k => k.toLowerCase() === lowerType);
      if (match) return formInput[match];
      
      // Common aliases
      if (lowerType === 'textinput') return formInput['TextInput'];
      if (lowerType === 'textarea') return formInput['TextArea'];
      if (lowerType === 'switch') return formInput['Switch'];
      
      return null;
    };

    const Component = getComponent(field.componentType) || (() => (
      <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Component "{field.componentType}" not found
      </div>
    ));

    return (
      <div 
        key={name} 
        id={`field-${name}`} 
        className={`mb-4 ${field.className || ''} ${getColSpanClass(field.colSpan, effectiveColumns)}`} 
        style={field.style}
      >
        {field.label && !isDisplay && (
          <label className="block font-medium text-gray-700 mb-1" style={{ fontSize: 'var(--font-size)' }}>
            {field.label}
          </label>
        )}
        <Component
          value={value}
          onChange={!isDisplay ? ((val: any) => form.setValue(name, val)) : undefined}
          error={error}
          placeholder={field.placeholder}
          label={isDisplay ? field.label : undefined}
          props={field.props || {}}
          config={field.config}
          style={{ 
            height: fieldHeight, 
            borderRadius: fieldBorderRadius,
            fontSize: 'var(--font-size)',
            ...field.style 
          }}
          className={field.className}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500 animate-slide-in font-medium">
            {error}
          </p>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (schema.layout === 'step') {
      const currentField = schema.fields[form.activeStep];
      return (
        <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-100 mb-8 overflow-x-auto no-scrollbar scroll-smooth">
            {schema.fields.map((field, idx) => {
              const isActive = idx === form.activeStep;
              const isPast = idx < form.activeStep;
              
              return (
                <button 
                  key={idx}
                  type="button"
                  onClick={() => handleStepClick(idx)}
                  className={`relative px-8 py-4 text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 border-b-2`}
                  style={{ 
                    color: isActive ? 'var(--primary-color)' : isPast ? 'var(--primary-color)' : '#9ca3af',
                    borderColor: isActive ? 'var(--primary-color)' : 'transparent',
                    backgroundColor: isActive ? `${primaryColor}10` : 'transparent',
                    borderRadius: '12px 12px 0 0'
                  }}
                >
                  <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px]`}
                    style={{ 
                      backgroundColor: isActive ? 'var(--primary-color)' : isPast ? `${primaryColor}40` : '#f3f4f6',
                      color: isActive ? 'white' : isPast ? 'var(--primary-color)' : '#9ca3af',
                    }}
                  >
                    {idx + 1}
                  </span>
                  {field.label || `Step ${idx + 1}`}
                </button>
              );
            })}
          </div>

          <div 
            className={`p-8 rounded-2xl border border-gray-100 shadow-inner ${currentField.className || ''}`}
            style={{ 
              backgroundColor: '#f8fafc',
              ...currentField.style 
            }}
          >
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--primary-color)' }}>Section {form.activeStep + 1}</p>
                <h3 className="text-2xl font-black text-gray-900">{currentField.label}</h3>
              </div>
              {currentField.required && (
                <span className="px-3 py-1 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-100">
                  Required
                </span>
              )}
            </div>
            {/* GRID APPLIED TO TABS CONTENT */}
            <div className={gridClass} style={{ gap: 'var(--section-gap)' }}>
              {renderField(currentField)}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <div className="flex gap-3">
              <button
                type="button"
                disabled={form.activeStep === 0}
                onClick={() => form.setActiveStep(s => s - 1)}
                className="px-8 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-300 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                Back
              </button>
              <button
                type="button"
                onClick={form.resetForm}
                className="px-6 py-3 border-2 border-red-100 text-red-400 rounded-xl font-bold hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
              >
                Reset
              </button>
            </div>
            {form.activeStep < schema.fields.length - 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-8 py-3 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
                style={{ backgroundColor: 'var(--primary-color)' }}
              >
                Next Step
              </button>
            ) : (
              <button
                type="submit"
                disabled={form.isSubmitting}
                className="px-8 py-3 text-white rounded-xl font-black shadow-xl shadow-indigo-200 transition-all active:scale-95"
                style={{ 
                  background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd)`
                }}
              >
                {form.isSubmitting ? 'Finalizing...' : 'Complete Submission'}
              </button>
            )}
          </div>
        </div>
      );
    }

    if (schema.layout === 'accordion') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--section-gap) / 2)' }}>
          {schema.fields.map((field, idx) => {
            const isOpen = !!openAccordions[field.name];
            const hasErrorInField = Object.keys(form.errors).some(name => 
              name === field.name || name.startsWith(`${field.name}.`) || name.startsWith(`${field.name}[`)
            );
            
            return (
              <div 
                key={field.name} 
                className={`border overflow-hidden bg-white shadow-sm transition-all hover:shadow-md ${hasErrorInField ? 'border-red-200' : ''} ${field.className || ''}`}
                style={{ borderRadius: '16px', ...field.style }}
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(field.name)}
                  className={`w-full flex justify-between items-center p-5 text-left transition-colors ${hasErrorInField ? 'bg-red-50/50' : 'bg-gray-50/50 hover:bg-gray-100/50'}`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${hasErrorInField ? 'text-red-700' : 'text-gray-800'}`}>
                      {field.label || `Section ${idx + 1}`}
                    </span>
                    {field.required && <span className="text-red-500 font-bold">*</span>}
                    {hasErrorInField && (
                      <span className="p-1 bg-red-100 text-red-600 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-6 w-6 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100 p-6 border-t' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                  {/* GRID APPLIED TO ACCORDION CONTENT */}
                  <div className={gridClass} style={{ gap: 'var(--section-gap)' }}>
                    {renderField(field)}
                  </div>
                </div>
              </div>
            );
          })}
          <div className="pt-6 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={form.resetForm}
              className="px-8 py-3 border-2 border-red-100 text-red-400 rounded-xl font-bold hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={form.isSubmitting}
              className="px-8 py-3 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              Submit All Data
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="animate-slide-in">
        {/* GRID APPLIED TO DEFAULT CONTENT */}
        <div className={gridClass} style={{ gap: 'var(--section-gap)' }}>
          {schema.fields.map(field => renderField(field))}
        </div>
        <div className="pt-8 mt-8 border-t flex justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-3 border-2 border-gray-100 text-gray-400 rounded-xl font-bold hover:bg-gray-50 hover:text-gray-600 transition-all active:scale-95"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={form.resetForm}
            className="px-8 py-3 border-2 border-red-100 text-red-400 rounded-xl font-bold hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
          >
            Clear Form
          </button>
          <button
            type="submit"
            disabled={form.isSubmitting}
            className={`px-8 py-3 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2 ${form.isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            style={{ backgroundColor: 'var(--primary-color)' }}
          >
            {form.isSubmitting ? 'Submitting...' : 'Submit Form'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <form 
      onSubmit={form.handleSubmit(onSubmit, handleFormError)} 
      className={`w-full space-y-6 ${className || ''} ${schema.className || ''}`}
      style={{ ...globalVarStyle, ...style, ...schema.style }}
    >
      {(title || description) && (
        <div className="mb-8 border-b pb-6">
          {title && <h2 className="text-3xl font-black text-gray-900 tracking-tight">{title}</h2>}
          {description && <p className="text-gray-500 mt-2 font-medium">{description}</p>}
        </div>
      )}
      {renderContent()}
    </form>
  );
};
