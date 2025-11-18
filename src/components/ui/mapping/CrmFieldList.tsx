import React, { useState, useMemo } from 'react';
import { CrmField, FieldMapping } from '../../../types/mapping';
import { RequiredBadge } from './MappingBadge';

interface CrmFieldListProps {
    crmFields: CrmField[];
    mappings: Record<string, FieldMapping>;
    onFieldSelect: (crmFieldId: string, csvColumnName: string) => void;
    searchTerm: string;
    filter: 'all' | 'required' | 'unmapped' | 'mapped';
}

export const CrmFieldList: React.FC<CrmFieldListProps> = ({
    crmFields,
    mappings,
    onFieldSelect,
    searchTerm,
    filter
}) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Get unique categories
    const categories = useMemo(() => {
        const cats = Array.from(new Set(crmFields.map(f => f.category)));
        return cats.sort();
    }, [crmFields]);

    // Filter and search CRM fields
    const filteredFields = useMemo(() => {
        let filtered = crmFields;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(field =>
                field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                field.category.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply status filter
        if (filter !== 'all') {
            filtered = filtered.filter(field => {
                const mappingValues = Object.values(mappings);
                const isMapped = mappingValues.some(m => m.crmFieldId === field.id);

                switch (filter) {
                    case 'required': return field.required;
                    case 'mapped': return isMapped;
                    case 'unmapped': return !isMapped;
                    default: return true;
                }
            });
        }

        // Apply category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(field => field.category === selectedCategory);
        }

        return filtered.sort((a, b) => {
            // Sort required fields first
            if (a.required && !b.required) return -1;
            if (!a.required && b.required) return 1;

            // Then by category, then by label
            if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
            }

            return a.label.localeCompare(b.label);
        });
    }, [crmFields, mappings, searchTerm, filter, selectedCategory]);

    const getMappingStatus = (crmField: CrmField) => {
        const mapping = Object.values(mappings).find(m => m.crmFieldId === crmField.id);
        if (!mapping) return null;

        return {
            csvColumnName: Object.keys(mappings).find(key => mappings[key] === mapping) || '',
            status: mapping.status
        };
    };

    return (
        <div className="space-y-4">
            {/* Category filter */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === 'all'
                            ? 'bg-primary-600 text-white'
                            : 'bg-muted text-subtle hover:bg-muted/80'
                    }`}
                >
                    All ({crmFields.length})
                </button>
                {categories.map(category => {
                    const count = crmFields.filter(f => f.category === category).length;
                    return (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                selectedCategory === category
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-muted text-subtle hover:bg-muted/80'
                            }`}
                        >
                            {category} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Field list */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredFields.map(crmField => {
                    const mappingStatus = getMappingStatus(crmField);

                    return (
                        <div
                            key={crmField.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                                mappingStatus
                                    ? 'border-green-200 bg-green-50 dark:bg-green-900/10'
                                    : 'border-muted hover:border-primary-300'
                            }`}
                            onClick={() => onFieldSelect(crmField.id, '')}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm text-on-surface">
                                            {crmField.label}
                                        </span>
                                        <RequiredBadge required={crmField.required} />
                                    </div>

                                    {crmField.unique && (
                                        <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded">
                                            Unique
                                        </span>
                                    )}
                                </div>

                                {mappingStatus && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                                            ← {mappingStatus.csvColumnName}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {crmField.description && (
                                <p className="text-xs text-subtle mt-1">
                                    {crmField.description}
                                </p>
                            )}

                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-subtle">
                                    Accepts: {crmField.accepts.join(', ')}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredFields.length === 0 && (
                <div className="text-center py-8 text-subtle">
                    <p>No fields match your current filters.</p>
                </div>
            )}
        </div>
    );
};


