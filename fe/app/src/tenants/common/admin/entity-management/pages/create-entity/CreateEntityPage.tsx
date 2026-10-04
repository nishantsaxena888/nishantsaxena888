import * as React from "react";
import { GenericEntityForm } from "../../components/GenericEntityForm";
import type { EntitySchema, GenericEntityData } from "../../types";

export interface CreateEntityPageProps {
    schema: EntitySchema;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function CreateEntityPage({ schema, onSuccess, onCancel }: CreateEntityPageProps) {
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = async (data: GenericEntityData) => {
        setIsLoading(true);
        try {
            console.log(`[Engine] Created New ${schema.entityName}:`, data);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            onSuccess?.();
            alert(`Successfully published mock ${schema.entityName}!`);
        } catch (error) {
            console.error("Failed to create entity", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <GenericEntityForm
                schema={schema}
                onSubmit={handleSubmit}
                onCancel={onCancel || (() => {})}
                isLoading={isLoading}
            />
        </div>
    );
}
