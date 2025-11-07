import React, { useState, useMemo, useEffect } from 'react';
import { CsvColumn, CrmField, FieldMapping, MappingStatus, ImportTemplate } from '../../../types/mapping';
import { generateFieldSuggestions, validateMapping, generatePreviewData } from '../../../utils/mappingUtils';
import { CsvColumnCard } from './CsvColumnCard';
import { CrmFieldList } from './CrmFieldList';
import { PreviewDrawer } from './PreviewDrawer';

interface ModernMappingInterfaceProps {
    csvColumns: CsvColumn[];
    crmFields: CrmField[];
    initialMappings?: Record<string, FieldMapping>;
    onMappingsChange: (mappings: Record<string, FieldMapping>) => void;
    onValidationChange: (validation: { isValid: boolean; errors: string[]; warnings: string[] }) => void;
    previewData?: Record<string, string>[];
    templates?: ImportTemplate[];
    onTemplateSave?: (name: string, description?: string) => void;
    onTemplateLoad?: (templateId: string) => void;
}

export const ModernMappingInterface: React.FC<ModernMappingInterfaceProps> = ({
    csvColumns,
    crmFields,
    initialMappings = {},
    onMappingsChange,
    onValidationChange,
    previewData = [],
    templates = [],
    onTemplateSave,
    onTemplateLoad
}) => {
    const [mappings, setMappings] = useState<Record<string, FieldMapping>>(initialMappings);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'required' | 'unmapped' | 'mapped'>('all');
    const [selectedCsvColumn, setSelectedCsvColumn] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [skipInvalid, setSkipInvalid] = useState(true);
    const [showTemplates, setShowTemplates] = useState(false);

    // Generate suggestions when columns or fields change
    useEffect(() => {
        const suggestions = generateFieldSuggestions(csvColumns, crmFields);

        const newMappings: Record<string, FieldMapping> = {};
        csvColumns.forEach(column => {
            const existingMapping = mappings[column.name];
            const suggestion = suggestions[column.name];

            newMappings[column.name] = {
                csvColumnName: column.name,
                crmFieldId: existingMapping?.crmFieldId || null,
                transforms: existingMapping?.transforms || {},
                suggestion: suggestion ? {
                    crmFieldId: suggestion.crmFieldId,
                    confidence: suggestion.confidence,
                    reason: suggestion.reason
                } : undefined,
                status: existingMapping?.crmFieldId ? 'mapped' : (suggestion ? 'suggested' : 'unmapped'),
                validationErrors: existingMapping?.validationErrors || []
            };
        });

        setMappings(newMappings);
        onMappingsChange(newMappings);
    }, [csvColumns, crmFields]);

    // Update validation when mappings change
    useEffect(() => {
        const validation = validateMapping(mappings, csvColumns, crmFields);
        onValidationChange(validation);
    }, [mappings, csvColumns, crmFields, onValidationChange]);

    const handleMappingChange = (csvColumnName: string, crmFieldId: string | null) => {
        const newMappings = { ...mappings };

        // If mapping to a field that's already used, mark as conflict
        if (crmFieldId) {
            const existingMapping = Object.values(newMappings).find(m => m.crmFieldId === crmFieldId);
            if (existingMapping && existingMapping.csvColumnName !== csvColumnName) {
                newMappings[existingMapping.csvColumnName] = {
                    ...existingMapping,
                    status: 'conflict',
                    validationErrors: ['This CRM field is already mapped to another column']
                };
            }
        }

        // Update the current mapping
        newMappings[csvColumnName] = {
            ...newMappings[csvColumnName],
            crmFieldId,
            status: crmFieldId ? 'mapped' : 'unmapped',
            validationErrors: []
        };

        setMappings(newMappings);
        onMappingsChange(newMappings);
    };

    const handleTransformChange = (csvColumnName: string, transforms: any) => {
        const newMappings = { ...mappings };
        newMappings[csvColumnName] = {
            ...newMappings[csvColumnName],
            transforms: { ...newMappings[csvColumnName].transforms, ...transforms }
        };
        setMappings(newMappings);
        onMappingsChange(newMappings);
    };

    const handleBulkAutoMap = () => {
        const newMappings = { ...mappings };

        Object.values(newMappings).forEach(mapping => {
            if (mapping.suggestion && !mapping.crmFieldId) {
                // Only auto-map high confidence suggestions
                if (mapping.suggestion.confidence === 'high') {
                    handleMappingChange(mapping.csvColumnName, mapping.suggestion.crmFieldId);
                }
            }
        });
    };

    const handleClearAllMappings = () => {
        if (window.confirm('Are you sure you want to clear all mappings?')) {
            const newMappings: Record<string, FieldMapping> = {};
            csvColumns.forEach(column => {
                newMappings[column.name] = {
                    csvColumnName: column.name,
                    crmFieldId: null,
                    transforms: {},
                    status: 'unmapped'
                };
            });
            setMappings(newMappings);
            onMappingsChange(newMappings);
        }
    };

    const handleTemplateSave = () => {
        const name = prompt('Enter a name for this mapping template:');
        if (name && onTemplateSave) {
            onTemplateSave(name);
        }
    };

    // Calculate statistics
    const stats = useMemo(() => {
        const total = csvColumns.length;
        const mapped = Object.values(mappings).filter(m => m.crmFieldId).length;
        const suggested = Object.values(mappings).filter(m => m.suggestion && !m.crmFieldId).length;
        const requiredMapped = Object.values(mappings).filter(m =>
            m.crmFieldId && crmFields.find(f => f.id === m.crmFieldId)?.required
        ).length;
        const totalRequired = crmFields.filter(f => f.required).length;

        return { total, mapped, suggested, requiredMapped, totalRequired };
    }, [mappings, csvColumns, crmFields]);

    // Generate preview data
    const previewRows = useMemo(() => {
        if (previewData.length === 0) return [];
        return generatePreviewData(previewData, mappings, crmFields);
    }, [previewData, mappings, crmFields]);

    return (
        <div className="flex h-full bg-background">
            {/* Left Panel - CSV Columns */}
            <div className="flex-1 flex flex-col border-r border-muted">
                {/* Top Bar */}
                <div className="p-4 border-b border-muted bg-surface">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-on-surface">CSV Columns</h2>
                            <p className="text-sm text-subtle">
                                {stats.mapped} of {stats.total} mapped • {stats.requiredMapped} of {stats.totalRequired} required
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleBulkAutoMap}
                                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                                Auto-map Suggestions
                            </button>
                            <button
                                onClick={handleClearAllMappings}
                                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-muted rounded-full h-2 mb-4">
                        <div
                            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(stats.mapped / stats.total) * 100}%` }}
                        />
                    </div>

                    {/* Search and filter */}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Search columns..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 bg-background border border-muted p-2 rounded text-sm focus:border-primary-500 focus:outline-none"
                        />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="bg-background border border-muted p-2 rounded text-sm"
                        >
                            <option value="all">All</option>
                            <option value="unmapped">Unmapped</option>
                            <option value="mapped">Mapped</option>
                        </select>
                    </div>
                </div>

                {/* CSV Columns List */}
                <div className="flex-1 overflow-auto p-4">
                    <div className="space-y-3">
                        {csvColumns
                            .filter(column => {
                                if (searchTerm && !column.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                                    return false;
                                }
                                if (filter === 'mapped' && !mappings[column.name]?.crmFieldId) {
                                    return false;
                                }
                                if (filter === 'unmapped' && mappings[column.name]?.crmFieldId) {
                                    return false;
                                }
                                return true;
                            })
                            .map(column => (
                                <CsvColumnCard
                                    key={column.name}
                                    column={column}
                                    mapping={mappings[column.name] || {
                                        csvColumnName: column.name,
                                        crmFieldId: null,
                                        status: 'unmapped'
                                    }}
                                    availableCrmFields={crmFields}
                                    onMappingChange={handleMappingChange}
                                    onTransformChange={handleTransformChange}
                                    isSelected={selectedCsvColumn === column.name}
                                    onSelect={() => setSelectedCsvColumn(column.name)}
                                />
                            ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - CRM Fields */}
            <div className="w-80 flex flex-col border-r border-muted">
                <div className="p-4 border-b border-muted bg-surface">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-on-surface">CRM Fields</h2>
                        {templates.length > 0 && (
                            <button
                                onClick={() => setShowTemplates(!showTemplates)}
                                className="text-sm text-primary-600 hover:text-primary-700"
                            >
                                Templates ({templates.length})
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-4">
                    <CrmFieldList
                        crmFields={crmFields}
                        mappings={mappings}
                        onFieldSelect={(crmFieldId, csvColumnName) => {
                            if (csvColumnName) {
                                handleMappingChange(csvColumnName, crmFieldId);
                            }
                        }}
                        searchTerm=""
                        filter={filter}
                    />
                </div>
            </div>

            {/* Preview Drawer */}
            <PreviewDrawer
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                previewData={previewRows}
                errors={[]}
                skipInvalid={skipInvalid}
                onSkipInvalidChange={setSkipInvalid}
            />

            {/* Floating Action Button for Preview */}
            <button
                onClick={() => setShowPreview(true)}
                className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full shadow-lg"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            </button>

            {/* Template Modal */}
            {showTemplates && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-surface rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-on-surface mb-4">Import Templates</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {templates.map(template => (
                                <div key={template.id} className="flex items-center justify-between p-3 border border-muted rounded">
                                    <div>
                                        <div className="font-medium text-sm">{template.name}</div>
                                        <div className="text-xs text-subtle">
                                            {new Date(template.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            onTemplateLoad?.(template.id);
                                            setShowTemplates(false);
                                        }}
                                        className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700"
                                    >
                                        Load
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setShowTemplates(false)}
                                className="px-4 py-2 bg-muted text-on-surface rounded hover:bg-muted/80"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleTemplateSave}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Save Current
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


