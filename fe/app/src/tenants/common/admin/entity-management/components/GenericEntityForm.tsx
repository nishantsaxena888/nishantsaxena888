import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Save, X } from "lucide-react";
import type { EntitySchema, GenericEntityData } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useEngine } from '../../../../../engine/contexts/EngineContext';

// We implement a dynamic generic loop rather than hardcoded fields!
export interface GenericEntityFormProps {
    schema?: EntitySchema;
    initialData?: GenericEntityData;
    onSubmit: (data: GenericEntityData) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export function GenericEntityForm({ schema, initialData, onSubmit, onCancel, isLoading }: GenericEntityFormProps) {
    const { t, currentLanguage } = useEngine();
    
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<GenericEntityData>({
        defaultValues: initialData || {}
    });

    if (!schema) {
        return <div className="p-8 text-center text-red-500 font-black tracking-widest">FATAL: NO ENTITY SCHEMA DEFINED</div>;
    }

    const formValues = watch();

    const onSubmitWrapper = (data: any) => {
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmitWrapper)} className="space-y-8 pb-20">
            {/* Context Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-20 py-4 border-b border-border shadow-sm">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight text-primary">
                        {initialData?.id ? t(`Edit ${schema.entityName}`, currentLanguage.code, 'ui') : t(`Create New ${schema.entityName}`, currentLanguage.code, 'ui')}
                    </h2>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
                        {t('Dynamic Schema Layout Engine', currentLanguage.code, 'ui')}
                    </p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="outline" type="button" onClick={onCancel} className="rounded-xl flex-1 sm:flex-none border-2 font-bold">
                        {t('Cancel', currentLanguage.code, 'ui')}
                    </Button>
                    <Button type="submit" className="rounded-xl flex-1 sm:flex-none shadow-xl shadow-primary/20 font-bold" disabled={isLoading}>
                        <Save className="w-4 h-4 mr-2" />
                        {t('Save Details', currentLanguage.code, 'ui')}
                    </Button>
                </div>
            </div>

            {/* Dynamic Metadata Generation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <Card className="rounded-[32px] border-2 shadow-sm bg-card/40 backdrop-blur">
                        <CardHeader className="bg-muted/30 border-b">
                            <CardTitle className="text-xl font-bold">{t(`${schema.entityName} Core Profile`, currentLanguage.code, 'ui')}</CardTitle>
                            <CardDescription>Automatically mapped from injected generic JSON attributes.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {schema.fields.map((field) => {
                                const fieldId = field.name;
                                
                                // Render logic purely depends on the JSON field type!
                                return (
                                    <div key={fieldId} className="space-y-3 p-4 rounded-2xl bg-background border shadow-sm">
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor={fieldId} className="text-xs font-black uppercase tracking-widest text-primary">
                                                {field.label || field.name}
                                                {field.required && <span className="text-red-500 ml-1">*</span>}
                                            </Label>
                                            <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-mono text-muted-foreground">Type: {field.type}</span>
                                        </div>

                                        {field.type === 'text' && (
                                            <Input
                                                id={fieldId}
                                                {...register(fieldId, { required: field.required })}
                                                className="h-12 border-2 rounded-xl focus-visible:ring-primary/30"
                                            />
                                        )}

                                        {field.type === 'number' && (
                                            <Input
                                                id={fieldId}
                                                type="number"
                                                {...register(fieldId, { required: field.required, valueAsNumber: true })}
                                                className="h-12 border-2 rounded-xl text-lg font-bold"
                                            />
                                        )}

                                        {field.type === 'boolean' && (
                                            <div className="flex items-center gap-4 py-2">
                                                <Switch 
                                                    id={fieldId}
                                                    checked={formValues[fieldId]}
                                                    onCheckedChange={(val) => setValue(fieldId, val)}
                                                />
                                                <span className="text-sm font-medium">{formValues[fieldId] ? "Yes (Enabled)" : "No (Disabled)"}</span>
                                            </div>
                                        )}

                                        {field.type === 'dropdown' && field.options && (
                                            <select 
                                                {...register(fieldId, { required: field.required })}
                                                className="w-full h-12 px-4 rounded-xl border-2 bg-background focus:ring-2 focus:ring-primary/20 appearance-none font-medium"
                                            >
                                                <option value="">{t('Select an option...', currentLanguage.code, 'ui')}</option>
                                                {field.options.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>
                
                {/* Visualizer sidebar to prove Schema to User */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="rounded-[32px] border-2 shadow-sm bg-zinc-950 text-zinc-300">
                        <CardHeader className="border-b border-zinc-800">
                            <CardTitle className="text-sm font-mono text-zinc-400">active_layout.json</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <pre className="text-xs font-mono text-green-400 overflow-x-auto">
                                {JSON.stringify(formValues, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
}
