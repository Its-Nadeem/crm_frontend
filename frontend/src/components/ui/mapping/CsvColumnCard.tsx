import React, { useState } from 'react';
import { CsvColumn, FieldMapping, CrmField, MappingStatus } from '../../../types/mapping';
import { TypeIcon, StatusBadge, ConfidenceBadge } from './MappingBadge';

interface CsvColumnCardProps {
    column: CsvColumn;
    mapping: FieldMapping;
    availableCrmFields: CrmField[];
    onMappingChange: (csvColumnName: string, crmFieldId: string | null) => void;
    onTransformChange: (csvColumnName: string, transforms: any) => void;
    isSelected?: boolean;
    onSelect?: () => void;
}

export const CsvColumnCard: React.FC<CsvColumnCardProps> = ({
    column,
    mapping,
    availableCrmFields,
    onMappingChange,
    onTransformChange,
    isSelected = false,
    onSelect
}) => {
    const [showTransformMenu, setShowTransformMenu] = useState(false);

    const getStatusColor = (status: MappingStatus) => {
        switch (status) {
            case 'mapped': return 'border-green-200 bg-green-50 dark:bg-green-900/10';
            case 'suggested': return 'border-blue-200 bg-blue-50 dark:bg-blue-900/10';
            case 'conflict': return 'border-red-200 bg-red-50 dark:bg-red-900/10';
            case 'invalid': return 'border-red-200 bg-red-50 dark:bg-red-900/10';
            default: return 'border-gray-200 bg-white dark:bg-gray-800';
        }
    };

    const selectedCrmField = availableCrmFields.find(f => f.id === mapping.crmFieldId);

    return (
        <div
            className={`relative border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${getStatusColor(mapping.status)} ${isSelected ? 'ring-2 ring-primary-500' : ''}`}
            onClick={onSelect}
        >
            {/* Status indicator */}
            <div className="absolute top-2 right-2">
                <StatusBadge status={mapping.status} />
            </div>

            {/* Column header */}
            <div className="pr-16 mb-3">
                <div className="flex items-center gap-2 mb-2">
                    <TypeIcon type={column.inferredType} />
                    <h3 className="font-semibold text-sm text-on-surface truncate">
                        {column.name}
                    </h3>
                </div>

                {/* Sample values */}
                <div className="space-y-1">
                    {column.sampleValues.slice(0, 3).map((value, index) => (
                        <div key={index} className="text-xs text-subtle bg-muted/50 rounded px-2 py-1 truncate">
                            {value || '(empty)'}
                        </div>
                    ))}
                    {column.sampleValues.length > 3 && (
                        <div className="text-xs text-subtle">
                            +{column.sampleValues.length - 3} more...
                        </div>
                    )}
                </div>
            </div>

            {/* Mapping section */}
            <div className="space-y-2">
                {/* Current mapping display */}
                {selectedCrmField ? (
                    <div className="flex items-center justify-between p-2 bg-primary-50 dark:bg-primary-900/20 rounded border">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                                → {selectedCrmField.label}
                            </span>
                            {selectedCrmField.required && (
                                <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-1.5 py-0.5 rounded">
                                    Required
                                </span>
                            )}
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onMappingChange(column.name, null);
                            }}
                            className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                            Remove
                        </button>
                    </div>
                ) : (
                    <div className="text-center p-2 border-2 border-dashed border-muted rounded">
                        <span className="text-sm text-subtle">Click to map field</span>
                    </div>
                )}

                {/* Suggestion display */}
                {mapping.suggestion && !mapping.crmFieldId && (
                    <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded border">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-blue-700 dark:text-blue-300">
                                Suggested: {availableCrmFields.find(f => f.id === mapping.suggestion?.crmFieldId)?.label}
                            </span>
                            <ConfidenceBadge confidence={mapping.suggestion.confidence} />
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMappingChange(column.name, mapping.suggestion?.crmFieldId || null);
                                }}
                                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                            >
                                Accept
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowTransformMenu(!showTransformMenu);
                                }}
                                className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
                            >
                                Transform
                            </button>
                        </div>
                    </div>
                )}

                {/* Transform menu */}
                {showTransformMenu && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-muted rounded-lg shadow-lg z-10 p-3">
                        <div className="space-y-2">
                            <div className="text-xs font-medium text-on-surface mb-2">Transform Options</div>

                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={mapping.transforms?.trim || false}
                                    onChange={(e) => onTransformChange(column.name, {
                                        ...mapping.transforms,
                                        trim: e.target.checked
                                    })}
                                    className="rounded"
                                />
                                Trim whitespace
                            </label>

                            <div className="space-y-1">
                                <div className="text-xs text-subtle">Case transformation:</div>
                                <select
                                    value={mapping.transforms?.toCase || ''}
                                    onChange={(e) => onTransformChange(column.name, {
                                        ...mapping.transforms,
                                        toCase: e.target.value || undefined
                                    })}
                                    className="w-full text-sm bg-background border border-muted rounded p-1"
                                >
                                    <option value="">No change</option>
                                    <option value="upper">UPPERCASE</option>
                                    <option value="lower">lowercase</option>
                                    <option value="title">Title Case</option>
                                </select>
                            </div>

                            {column.inferredType === 'text' && (
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={mapping.transforms?.splitFullName?.intoFirstLast || false}
                                        onChange={(e) => onTransformChange(column.name, {
                                            ...mapping.transforms,
                                            splitFullName: e.target.checked ? { intoFirstLast: true } : undefined
                                        })}
                                        className="rounded"
                                    />
                                    Split full name
                                </label>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Validation errors */}
            {mapping.validationErrors && mapping.validationErrors.length > 0 && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                    {mapping.validationErrors.map((error, index) => (
                        <div key={index} className="text-xs text-red-600 dark:text-red-400">
                            • {error}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


