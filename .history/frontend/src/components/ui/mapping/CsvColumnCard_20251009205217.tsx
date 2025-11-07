
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



