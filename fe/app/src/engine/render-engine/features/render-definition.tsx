import React from 'react';
import { type  Definition, type RenderComponentProps, type SessionBridge } from './types';
import { useRenderEngine } from './render-engine-context';
import { useDynamicData } from './use-dynamic-data';
import { useFormStyleStore } from '@/store/use-form-style';
import { useConfigStore } from '@/store/use-config-store';
import { useGenericState } from '@/store/use-generic-state';
import { currentRole, roleAllowed } from '@/engine/library/rbac';
import { DefErrorBoundary } from '@/platform/error-boundary';

interface RenderDefinitionProps {
  def: Definition;
  config?: any;
}

// Implicit RBAC — def.roles (or properties.roles) gates the whole
// component. The backend should ALSO filter defs per role when serving
// the page; this is the render-side mirror so nothing role-locked mounts
// (no fetch, no DOM) even if it reaches the client. The gate lives in this
// outer wrapper — before useDynamicData's fetch effect — so a blocked def
// never fires its action calls.
export function RenderDefinition({ def, config }: RenderDefinitionProps) {
  const role = currentRole(useConfigStore((s: any) => s.config));
  if (!roleAllowed(def.roles ?? def.properties?.roles, role)) return null;
  return <RenderDefinitionInner def={def} config={config} />;
}

function RenderDefinitionInner({ def, config }: RenderDefinitionProps) {
  const { componentMap } = useRenderEngine();
  const { themeName } = useFormStyleStore();
  const Component = componentMap[def.type] as React.ComponentType<RenderComponentProps>;

  const { apiData, loading, skeletonLoading, error, firstLoadError, action, searchParameters } = useDynamicData(def);

  // Session bridge — components read/write configured sessions through
  // this prop instead of touching the store directly. items() re-renders
  // via the gsData subscription; update() runs the session's configured
  // reducer strategy (array_toggle, array_upsert, ...) and persists.
  const gsData = useGenericState((s: any) => s.data);
  const session: SessionBridge = React.useMemo(
    () => ({
      items: (name: string) =>
        Array.isArray(gsData?.[name]) ? gsData[name] : [],
      update: (name: string, value: any) =>
        useGenericState.getState().update(name, value),
      clear: (name: string) => useGenericState.getState().clear(name),
    }),
    [gsData],
  );

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
    // Per-def crash boundary — one broken component renders an inline
    // error and reports via platform/report; the rest of the page stays
    // mounted instead of bubbling to the route errorElement.
    return (
      <DefErrorBoundary label={def.type} resetKey={def.id}>
        <Component key={def.id} id={def.id} type={def.type} content={def.content} properties={def.properties} actionData={actionData} session={session} config={config} themeName={themeName}>
          {children}
        </Component>
      </DefErrorBoundary>
    );
  }

  // Error for unmapped types
  return (
    <div key={def.id} style={{ padding: '15px', margin: '10px', border: '1px solid #f87171', backgroundColor: '#fff1f1', borderRadius: '4px', color: '#991b1b' }}>
      <strong>Component Matching Error:</strong> No component found for type "<strong>{def.type}</strong>" (ID: {def.id}).
    </div>
  );
}
