import * as React from "react";
import { EntityListPage } from "./pages/entity-list/EntityListPage";
import { CreateEntityPage } from "./pages/create-entity/CreateEntityPage";
import { EditEntityPage } from "./pages/edit-entity/EditEntityPage";
import type { EntitySchema, GenericEntityData } from "./types";
import { useEngine } from '../../../../engine/contexts/EngineContext';

// EntityManagement bridges the Host (POS) to the Layout Engine.
// It receives the active schema explicitly from the host route wrapper.
export interface EntityManagementProps {
    schema?: EntitySchema;
    targetEntity?: string;
    initialView?: "list" | "create" | "edit";
}

export function EntityManagement(props: EntityManagementProps) {
    const { activeTenant, fetchEntityOptions } = useEngine();
    
    // We now support resolving schema via an async fetch to the Host, or direct prop injection
    const [schema, setSchema] = React.useState<EntitySchema | undefined>(props.schema);
    const [isLoadingSchema, setIsLoadingSchema] = React.useState<boolean>(!!props.targetEntity && !props.schema);
    
    const initialView = props.initialView || "list";
    const [view, setView] = React.useState<"list" | "create" | "edit">(initialView as any);
    const [editingEntity, setEditingEntity] = React.useState<GenericEntityData | null>(null);

    React.useEffect(() => {
        if (!props.schema && props.targetEntity && activeTenant?.id && fetchEntityOptions) {
            setIsLoadingSchema(true);
            fetchEntityOptions(activeTenant.id, props.targetEntity)
                .then(res => {
                    setSchema(res as EntitySchema);
                    setIsLoadingSchema(false);
                })
                .catch(err => {
                    console.error("Failed to load schema for targetEntity:", props.targetEntity, err);
                    setIsLoadingSchema(false);
                });
        }
    }, [props.schema, props.targetEntity, activeTenant?.id, fetchEntityOptions]);

    // Fallback UI if schema is loading or missing
    if (isLoadingSchema) {
        return <div className="p-12 border border-zinc-800 bg-zinc-900/50 rounded-2xl animate-pulse flex flex-col gap-4">
            <div className="h-8 bg-zinc-800 rounded w-1/4"></div>
            <div className="h-32 bg-zinc-800/50 rounded w-full"></div>
            <div className="text-zinc-500 font-mono text-xs">Resolving SDUI mapping for {props.targetEntity}...</div>
        </div>;
    }

    if (!schema) {
        return <div className="p-12 border-2 border-red-500 bg-red-50 text-red-500 font-bold rounded-2xl">
            FATAL: EntityManagement rendered without a generic schema configuration.
            <br /> <br />
            Ensure the targetEntity or schema prop is explicitly assigned via the SDUI layout.
        </div>;
    }

    const handleEdit = (entityContext: GenericEntityData) => {
        setEditingEntity(entityContext);
        setView("edit");
    };

    const handleBack = () => {
        setEditingEntity(null);
        setView("list");
    };

    return (
        <div className="w-full h-full text-foreground animate-in fade-in zoom-in-95 duration-500">
            {view === "list" && (
                <EntityListPage
                    schema={schema}
                    onEdit={handleEdit}
                    onCreate={() => setView("create")}
                />
            )}

            {view === "create" && (
                <CreateEntityPage
                    schema={schema}
                    onSuccess={handleBack}
                    onCancel={handleBack}
                />
            )}

            {view === "edit" && editingEntity && (
                <EditEntityPage
                    schema={schema}
                    entity={editingEntity}
                    onSuccess={handleBack}
                    onCancel={handleBack}
                />
            )}
        </div>
    );
}
