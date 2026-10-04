import * as React from "react";
import { GenericEntityForm } from "../../components/GenericEntityForm";
import type { EntitySchema, GenericEntityData } from "../../types";

export interface EditEntityPageProps {
    schema: EntitySchema;
    entity: GenericEntityData;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function EditEntityPage({ schema, entity, onSuccess, onCancel }: EditEntityPageProps) {
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = async (data: GenericEntityData) => {
        setIsLoading(true);
        try {
            console.log(`[Engine] Updated ${schema.entityName}:`, data);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            onSuccess?.();
        } catch (error) {
            console.error("Failed to update entity", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <GenericEntityForm
                schema={schema}
                initialData={entity}
                onSubmit={handleSubmit}
                onCancel={onCancel || (() => {})}
                isLoading={isLoading}
            />
        </div>
    );
}
