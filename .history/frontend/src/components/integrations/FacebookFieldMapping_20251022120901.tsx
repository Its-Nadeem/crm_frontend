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
    options?: string[];
    isCustom?: boolean;
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
    const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

    // Update parent component when mappings change
    useEffect(() => {
        onMappingsChange(mappings);

        // Also notify about validation status
        if (onValidationChange) {
            const validation = validateMandatoryMappings();
            onValidationChange(validation.isValid, validation.unmappedFields);
        }
    }, [mappings, onMappingsChange, onValidationChange]);

    // Handle click outside to close dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.searchable-dropdown')) {
                setSearchTerms({});
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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

    // Helper functions for the new CRM-centric layout
    const getFacebookFieldForCrmField = (crmFieldKey: string) => {
        return mappings.find(m => m.crmField === crmFieldKey)?.facebookField;
    };

    const getCurrentMappingForCrmField = (crmFieldKey: string) => {
        return mappings.find(m => m.crmField === crmFieldKey);
    };

    const getAvailableFacebookFields = (crmFieldKey: string) => {
        const usedFacebookFields = mappings
            .filter(m => m.crmField !== crmFieldKey && m.facebookField)
            .map(m => m.facebookField);

        return facebookFields.filter(field => !usedFacebookFields.includes(field.name));
    };

    const handleMappingChangeFromCrm = (crmFieldKey: string, facebookField: string, customValue?: string) => {
        setMappings(prev => {
            const existingIndex = prev.findIndex(m => m.crmField === crmFieldKey);

            if (facebookField === '' && !customValue) {
                // Remove mapping if both Facebook field and custom value are empty
                return prev.filter(m => m.crmField !== crmFieldKey);
            }

            const newMapping: FieldMapping = {
                facebookField,
                crmField: crmFieldKey,
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

    // Sort Facebook fields in specific order: contact fields first, then metadata, then others
    const getSortedFacebookFields = () => {
        const contactFields = ['name', 'full_name', 'first_name', 'email', 'phone_number', 'phone', 'city'];
        const metadataFields = ['campaign_name', 'adset_name', 'ad_name', 'form_name', 'page_name', 'platform', 'lead_source'];
        const allPriorityFields = [...contactFields, ...metadataFields];

        const priorityMap = new Map(allPriorityFields.map((field, index) => [field, index]));

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

    // Check if a CRM field is mandatory (name, email, phone)
    const isMandatoryCrmField = (crmFieldKey: string) => {
        const fieldKeyLower = crmFieldKey.toLowerCase();
        return fieldKeyLower === 'name' ||
               fieldKeyLower === 'email' ||
               fieldKeyLower.includes('phone');
    };

    // Validate that all mandatory CRM fields are mapped
    const validateMandatoryMappings = () => {
        const mandatoryCrmFields = crmFields.filter(field => isMandatoryCrmField(field.key));
        const unmappedMandatory = mandatoryCrmFields.filter(field => !getCurrentMappingForCrmField(field.key)?.facebookField);

        return {
            isValid: unmappedMandatory.length === 0,
            unmappedFields: unmappedMandatory.map(f => f.label)
        };
    };

    return (
        <div className="space-y-6">
            <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-on-surface">
                    Available fields: <span className="font-medium">{facebookFields.length}</span>
                    <span className="text-red-600 ml-2">*</span> are required for mapping.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CRM Fields Column - FIXED FIELDS (Read Only) - "Field Name" */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                        <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Field Name
                        <span className="text-sm font-normal text-subtle">({crmFields.length} fields)</span>
                    </h3>
                </div>

                {/* Facebook Fields Column - MAPPING DROPDOWNS - "Form Field" */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                        <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Form Field
                    </h3>
                </div>

                {/* Custom Value Column */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                        <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Custom Value
                    </h3>
                </div>
            </div>

            {/* Single Scroll Container for All Three Columns */}
            <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* CRM Fields Column - FIXED FIELDS (Read Only) */}
                    <div className="space-y-3">
                        {crmFields.map(crmField => {
                            const facebookFieldMapped = getFacebookFieldForCrmField(crmField.key);
                            const isMapped = !!facebookFieldMapped;

                            return (
                                <div key={crmField.key} className="rounded-lg border border-muted p-3 shadow-sm min-h-[60px] flex items-center justify-start bg-background">
                                    <div className="flex items-center gap-2 w-full">
                                        {/* Status dot indicator */}
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isMapped ? 'bg-green-500' : 'bg-gray-400'}`}></div>

                                        <span className="font-medium text-on-surface flex-shrink-0">
                                            {crmField.label}
                                            {crmField.required && <span className="text-red-600 ml-1">*</span>}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Facebook Fields Column - MAPPING DROPDOWNS */}
                    <div className="space-y-3">
                        {crmFields.map(crmField => {
                            const currentMapping = getCurrentMappingForCrmField(crmField.key);
                            const availableFacebookFields = getAvailableFacebookFields(crmField.key);

                            return (
                                <div key={crmField.key} className="bg-background rounded-lg border border-muted p-3 shadow-sm min-h-[60px] flex items-center justify-start">
                                    <select
                                        value={currentMapping?.facebookField || ''}
                                        onChange={(e) => handleMappingChangeFromCrm(crmField.key, e.target.value)}
                                        className="w-full h-8 px-3 border-0 rounded-lg bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-background"
                                        title={`Map ${crmField.label} to Facebook field`}
                                    >
                                        <option value="">Select Facebook field...</option>
                                        {availableFacebookFields.map(facebookField => (
                                            <option key={facebookField.name} value={facebookField.name}>
                                                {facebookField.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            );
                        })}
                    </div>

                    {/* Custom Value Column */}
                    <div className="space-y-3">
                        {crmFields.map(crmField => {
                            const currentMapping = getCurrentMappingForCrmField(crmField.key);
                            const selectedFacebookField = facebookFields.find(fbField => fbField.name === currentMapping?.facebookField);

                            // Check if the selected Facebook field has specific values we should show
                            const hasFacebookFieldValues = selectedFacebookField && selectedFacebookField.values && selectedFacebookField.values.length > 0;

                            return (
                                <div key={crmField.key} className="bg-background rounded-lg border border-muted p-3 shadow-sm min-h-[60px] flex items-center justify-start">
                                    {hasFacebookFieldValues ? (
                                        // Show Facebook field values as options
                                        <select
                                            value={currentMapping?.customValue || ''}
                                            onChange={(e) => handleMappingChangeFromCrm(crmField.key, currentMapping?.facebookField || '', e.target.value)}
                                            className="w-full h-8 px-3 border-0 rounded-lg bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-background"
                                            title={`Select value for ${crmField.label}`}
                                        >
                                            <option value="">Select value...</option>
                                            {selectedFacebookField.values.map((value: string) => (
                                                <option key={value} value={value}>
                                                    {value}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        // Show text input for custom values
                                        <input
                                            type="text"
                                            value={currentMapping?.customValue || ''}
                                            onChange={(e) => handleMappingChangeFromCrm(crmField.key, currentMapping?.facebookField || '', e.target.value)}
                                            placeholder="Custom value..."
                                            className="w-full h-8 px-3 border-0 rounded-lg bg-background text-on-surface placeholder-subtle focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-background"
                                            title={`Custom value for ${crmField.label}`}
                                        />
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
                                        <span className="text-subtle">Total CRM fields:</span>
                                        <span className="font-medium text-on-surface ml-2">{crmFields.length}</span>
                                    </div>
                                    <div>
                                        <span className="text-subtle">Mapped fields:</span>
                                        <span className="font-medium text-green-600 ml-2">{mappings.filter(m => m.facebookField).length}</span>
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
                                        <span className="text-subtle">Total CRM fields:</span>
                                        <span className="font-medium text-on-surface ml-2">{crmFields.length}</span>
                                    </div>
                                    <div>
                                        <span className="text-subtle">Mapped fields:</span>
                                        <span className="font-medium text-green-600 ml-2">{mappings.filter(m => m.facebookField).length}</span>
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


