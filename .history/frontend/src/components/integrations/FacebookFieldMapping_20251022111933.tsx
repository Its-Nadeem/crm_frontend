import React, { useState, useEffect } from 'react';

interface FacebookField {
    name: string;
    values: string[];
}

interface CRMField {
    key: string;
    label: string;
    type: string;
    required?: boolean;
}

interface FieldMapping {
    facebookField: string;
    crmField: string;
    customValue?: string;
}

interface FacebookFieldMappingProps {
    facebookFields: FacebookField[];
    crmFields: CRMField[];
    initialMappings?: FieldMapping[];
    onMappingsChange: (mappings: FieldMapping[]) => void;
    onValidationChange?: (isValid: boolean, unmappedFields: string[]) => void;
    salesPipelineStages?: string[];
}

const FacebookFieldMapping: React.FC<FacebookFieldMappingProps> = ({
    facebookFields,
    crmFields,
    initialMappings = [],
    onMappingsChange,
    onValidationChange,
    salesPipelineStages = ['New Lead', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']
}) => {
    const [mappings, setMappings] = useState<FieldMapping[]>(initialMappings);
    const [selectedFacebookField, setSelectedFacebookField] = useState<string>('');

    // Update parent component when mappings change
    useEffect(() => {
        onMappingsChange(mappings);

        // Also notify about validation status
        if (onValidationChange) {
            const validation = validateMandatoryMappings();
            onValidationChange(validation.isValid, validation.unmappedFields);
        }
    }, [mappings, onMappingsChange, onValidationChange]);

    const handleMappingChange = (facebookField: string, crmField: string, customValue?: string) => {
        setMappings(prev => {
            const existingIndex = prev.findIndex(m => m.facebookField === facebookField);

            if (crmField === '' && !customValue) {
                // Remove mapping if both CRM field and custom value are empty
                return prev.filter(m => m.facebookField !== facebookField);
            }

            const newMapping: FieldMapping = {
                facebookField,
                crmField,
                customValue
            };

            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = newMapping;
                return updated;
            } else {
                return [...prev, newMapping];
            }
        });
    };

    const getCurrentMapping = (facebookField: string) => {
        return mappings.find(m => m.facebookField === facebookField);
    };

    const getAvailableCrmFields = (facebookField: string) => {
        const usedFields = mappings
            .filter(m => m.facebookField !== facebookField && m.crmField)
            .map(m => m.crmField);

        return crmFields.filter(field => !usedFields.includes(field.key));
    };

    const getSampleValue = (fieldName: string) => {
        const field = facebookFields.find(f => f.name === fieldName);
        return field?.values?.[0] || `Sample ${fieldName} value`;
    };

    // Sort Facebook fields in specific order: name, email, phone, city, then others
    const getSortedFacebookFields = () => {
        const priorityFields = ['name', 'full_name', 'first_name', 'email', 'phone_number', 'phone', 'city'];
        const priorityMap = new Map(priorityFields.map((field, index) => [field, index]));

        return [...facebookFields].sort((a, b) => {
            const aPriority = priorityMap.get(a.name) ?? 999;
            const bPriority = priorityMap.get(b.name) ?? 999;

            if (aPriority !== 999 && bPriority !== 999) {
                return aPriority - bPriority; // Both are priority fields, sort by priority order
            } else if (aPriority !== 999) {
                return -1; // A is priority field, B is not
            } else if (bPriority !== 999) {
                return 1; // B is priority field, A is not
            } else {
                return a.name.localeCompare(b.name); // Neither is priority, sort alphabetically
            }
        });
    };

    // Check if a field is mandatory (name, email, phone)
    const isMandatoryField = (fieldName: string) => {
        const mandatoryPatterns = ['name', 'full_name', 'first_name', 'email', 'phone_number', 'phone'];
        return mandatoryPatterns.some(pattern => fieldName.toLowerCase().includes(pattern.toLowerCase()));
    };

    // Validate that all mandatory fields are mapped
    const validateMandatoryMappings = () => {
        const mandatoryFields = getSortedFacebookFields().filter(field => isMandatoryField(field.name));
        const unmappedMandatory = mandatoryFields.filter(field => !getCurrentMapping(field.name)?.crmField);

        return {
            isValid: unmappedMandatory.length === 0,
            unmappedFields: unmappedMandatory.map(f => f.name)
        };
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Field Mapping Guide</h4>
                <p className="text-sm text-blue-800">
                    Map your Facebook Lead Form fields to your CRM fields. Fields with <span className="text-red-600">*</span> are required for proper lead creation.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Facebook Fields Column - FIXED FIELDS (Read Only) */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                        <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Facebook Form Fields
                        <span className="text-sm font-normal text-subtle">({facebookFields.length} fields)</span>
                    </h3>
                </div>

                {/* CRM Fields Column - MAPPING DROPDOWNS */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                        <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Map to CRM Fields
                    </h3>
                </div>
            </div>

            {/* Single Scroll Container for Both Columns */}
            <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Facebook Fields Column */}
                    <div className="space-y-3">
                        {getSortedFacebookFields().map(field => {
                            const currentMapping = getCurrentMapping(field.name);
                            const isMapped = !!currentMapping?.crmField;
                            const isMandatory = isMandatoryField(field.name);

                            return (
                                <div key={field.name} className={`rounded-lg border p-3 shadow-sm min-h-[60px] flex items-center justify-start ${
                                    isMapped ? 'bg-blue-50 border-blue-200' : 'bg-background border-muted'
                                }`}>
                                    <div className="flex items-center gap-2 w-full">
                                        {/* Status dot indicator */}
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isMapped ? 'bg-green-500' : 'bg-red-500'}`}></div>

                                        <span className="font-medium text-on-surface flex-shrink-0">
                                            {field.name}
                                            {isMandatory && <span className="text-red-600 ml-1">*</span>}
                                        </span>

                                        {isMapped && (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded ml-auto">
                                                → {crmFields.find(f => f.key === currentMapping.crmField)?.label || currentMapping.crmField}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* CRM Fields Column */}
                    <div className="space-y-3">
                        {getSortedFacebookFields().map(field => {
                            const currentMapping = getCurrentMapping(field.name);
                            const availableCrmFields = getAvailableCrmFields(field.name);
                            const isMandatory = isMandatoryField(field.name);

                            return (
                                <div key={field.name} className="bg-background rounded-lg border border-muted p-3 shadow-sm min-h-[60px] flex items-center">
                                    <select
                                        value={currentMapping?.crmField || ''}
                                        onChange={(e) => handleMappingChange(field.name, e.target.value)}
                                        className="w-full px-3 py-2 border-0 rounded-lg bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-background"
                                        title={`Map ${field.name} to CRM field`}
                                    >
                                        <option value="">Select CRM field...</option>
                                        {availableCrmFields.map(crmField => (
                                            <option key={crmField.key} value={crmField.key}>
                                                {crmField.label} {crmField.required ? '*' : ''}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Show stage selection when stage field is selected */}
                                    {currentMapping?.crmField === 'stage' && (
                                        <div className="mt-2">
                                            <select
                                                value={currentMapping.customValue || ''}
                                                onChange={(e) => handleMappingChange(field.name, 'stage', e.target.value)}
                                                className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            >
                                                <option value="">Select Sales Pipeline Stage</option>
                                                {salesPipelineStages.map(stage => (
                                                    <option key={stage} value={stage}>{stage}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Sales Pipeline Status Section */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Sales Pipeline Status
                </h4>
                <p className="text-sm text-green-800 mb-3">
                    All new leads from this Facebook form will be assigned the following sales pipeline stage:
                </p>
                <select
                    value={mappings.find(m => m.crmField === 'stage')?.customValue || ''}
                    onChange={(e) => handleMappingChange('sales_stage_default', 'stage', e.target.value)}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                    <option value="">Select default stage for new leads</option>
                    {salesPipelineStages.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                    ))}
                </select>
                <p className="text-xs text-green-700 mt-2">
                    💡 Tip: You can also map individual Facebook fields to the "Sales Pipeline Stage" field above for dynamic stage assignment.
                </p>
            </div>

            {/* Add Custom Field Button */}
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-on-surface">Mapping Summary</h4>
                <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-sm hover:shadow-md flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Custom Field
                </button>
            </div>

            {/* Validation Summary */}
            {(() => {
                const validation = validateMandatoryMappings();
                return (
                    <div className="bg-muted/30 rounded-lg p-4 mt-4">

                        {!validation.isValid ? (
                            <div className="space-y-2">
                                <p className="text-sm text-amber-800">
                                    <strong>Required fields:</strong> {validation.unmappedFields.join(', ')}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-subtle">Total Facebook fields:</span>
                                        <span className="font-medium text-on-surface ml-2">{facebookFields.length}</span>
                                    </div>
                                    <div>
                                        <span className="text-subtle">Mapped fields:</span>
                                        <span className="font-medium text-green-600 ml-2">{mappings.filter(m => m.crmField).length}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm text-green-800">
                                    All mandatory fields are properly mapped! ✅
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-subtle">Total Facebook fields:</span>
                                        <span className="font-medium text-on-surface ml-2">{facebookFields.length}</span>
                                    </div>
                                    <div>
                                        <span className="text-subtle">Mapped fields:</span>
                                        <span className="font-medium text-green-600 ml-2">{mappings.filter(m => m.crmField).length}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
};

export default FacebookFieldMapping;


