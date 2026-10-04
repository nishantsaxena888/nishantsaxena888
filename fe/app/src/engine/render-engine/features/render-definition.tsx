import React from 'react';
import { type  Definition, type RenderComponentProps } from './types';
import { useRenderEngine } from './render-engine-context';
import { useDynamicData } from './use-dynamic-data';
import { useFormStyleStore } from '@/store/use-form-style';

interface RenderDefinitionProps {
  def: Definition;
  config?: any;
}

export function RenderDefinition({ def, config }: RenderDefinitionProps) {
  const { componentMap } = useRenderEngine();
  const { themeName } = useFormStyleStore();
  const Component = componentMap[def.type] as React.ComponentType<RenderComponentProps>;
  
  const { apiData, loading, skeletonLoading, error, firstLoadError, action, searchParameters } = useDynamicData(def);
  
  const children = def.children?.map(child => (
    <RenderDefinition key={child.id} def={child} config={config} />
  )) || [];

  const actionData = React.useMemo(() => {
    return def.properties.type === 'dynamic'
      ? { data: apiData, loading, skeletonLoading, error, firstLoadError, action, searchParameters }
      : undefined;
  }, [def.properties.type, apiData, loading, skeletonLoading, error, firstLoadError, action, searchParameters]);

  if (skeletonLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', opacity: 0.7, minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <strong>Loading Component...</strong>
      </div>
    );
  }

  if (firstLoadError) {
    return (
      <div style={{ padding: '15px', margin: '10px', border: '1px solid #f87171', backgroundColor: '#fff1f1', borderRadius: '4px', color: '#991b1b' }}>
        <strong>Initial Component Load Error:</strong> {firstLoadError}
      </div>
    );
  }

  if (Component) {
    return (
      <Component key={def.id} id={def.id} type={def.type} content={def.content} properties={def.properties} actionData={actionData} config={config} themeName={themeName}>
        {children}
      </Component>
    );
  }

  // Error for unmapped types
  return (
    <div key={def.id} style={{ padding: '15px', margin: '10px', border: '1px solid #f87171', backgroundColor: '#fff1f1', borderRadius: '4px', color: '#991b1b' }}>
      <strong>Component Matching Error:</strong> No component found for type "<strong>{def.type}</strong>" (ID: {def.id}).
    </div>
  );
}
