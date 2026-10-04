import * as React from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EntitySchema, GenericEntityData } from "../../types";

export interface EntityListPageProps {
    schema: EntitySchema;
    onEdit: (entity: GenericEntityData) => void;
    onCreate: () => void;
}

export function EntityListPage({ schema, onEdit, onCreate }: EntityListPageProps) {
    // Generate some mock rows based on schema
    const mockEntities: GenericEntityData[] = [
        { id: "1", [schema.fields[0]?.name || 'name']: "Test Entity Alpha" },
        { id: "2", [schema.fields[0]?.name || 'name']: "Test Entity Beta" }
    ];

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">{schema.entityName} Management</h2>
                    <p className="text-muted-foreground font-medium uppercase tracking-widest text-sm">
                        View and manage your dynamically generated records.
                    </p>
                </div>
                <Button onClick={onCreate} className="rounded-xl shadow-lg border-2 font-bold h-12 bg-primary">
                    <Plus className="w-5 h-5 mr-2" />
                    Create New {schema.entityName}
                </Button>
            </div>

            <div className="bg-card border-2 shadow-sm rounded-3xl overflow-hidden">
                <div className="p-4 border-b flex items-center bg-muted/20">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder={`Search ${schema.entityName}s...`} className="pl-9 bg-background rounded-xl border-2" />
                    </div>
                </div>
                
                {/* Generic Table Construction */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-bold uppercase tracking-widest text-xs">
                            <tr>
                                {schema.fields.slice(0, 4).map(f => (
                                    <th key={f.name} className="px-6 py-4">{f.label || f.name}</th>
                                ))}
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockEntities.map((entity, idx) => (
                                <tr key={idx} className="border-b last:border-0 hover:bg-muted/10">
                                    {schema.fields.slice(0, 4).map(f => (
                                        <td key={f.name} className="px-6 py-4 font-medium">
                                            {String(entity[f.name] || '—')}
                                        </td>
                                    ))}
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="outline" size="sm" onClick={() => onEdit(entity)} className="rounded-lg font-bold">
                                            Edit
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
