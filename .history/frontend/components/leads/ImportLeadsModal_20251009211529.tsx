import React, { useState } from 'react';
import { Lead, CustomFieldDefinition, FieldMapping, LeadSource, FollowUpStatus } from '../../types';
import Modal from '../ui/Modal';
import { AppIcons } from '../ui/Icons';
import FileUpload from '../../src/components/ui/FileUpload';
import ImportProgress from '../../src/components/ui/ImportProgress';
import { ModernMappingInterface } from '../../src/components/ui/mapping/ModernMappingInterface';
import { parseFile, ParsedFileData, ImportResult, validateLeadData, ImportError } from '../../src/utils/fileParser';
import { CsvColumn, CrmField, FieldMapping as NewFieldMapping } from '../../src/types/mapping';
import { inferDataType } from '../../src/utils/mappingUtils';

// Step 1: Upload
const UploadStep: React.FC<{
    onNext: (data: ParsedFileData) => void;
    onFileSelect: (file: File) => void;
    loading: boolean;
    error?: string;
}> = ({ onNext, onFileSelect, loading, error }) => (
    <div className="text-center">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Upload your file</h3>
        <p className="text-sm text-subtle mb-6">Supported formats: CSV, XLS, XLSX. Maximum size: 10MB</p>

        <FileUpload
            onFileSelect={onFileSelect}
            loading={loading}
            error={error}
        />

        <div className="mt-6 text-xs text-subtle">
            <p>Your file data will be processed securely and not stored permanently.</p>
        </div>
    </div>
);

// Step 2: Simple Two-Column Mapping Interface (Exactly as requested)
const MappingStep: React.FC<{
    customFieldDefs: CustomFieldDefinition[];
    users: any[];
    fileData: ParsedFileData;
    onMappingsChange: (mappings: Record<string, string>) => void;
    onValidationChange: (validation: { isValid: boolean; errors: string[]; warnings: string[] }) => void;
}> = ({ customFieldDefs, users, fileData, onMappingsChange, onValidationChange }) => {
    const [mappings, setMappings] = useState<Record<string, string>>({});

    // Define comprehensive CRM fields (all lead details)
    const crmFields = [
        // Required fields
        { id: 'name', label: 'Full Name', required: true, category: 'Basic' },
        { id: 'email', label: 'Email Address', required: true, category: 'Contact' },

        // Contact details
        { id: 'phone', label: 'Phone Number', required: false, category: 'Contact' },
        { id: 'alternatePhone', label: 'Alternate Phone', required: false, category: 'Contact' },
        { id: 'city', label: 'City', required: false, category: 'Location' },
        { id: 'company', label: 'Company', required: false, category: 'Basic' },

        // Lead management
        { id: 'source', label: 'Lead Source', required: false, category: 'Marketing' },
        { id: 'stage', label: 'Pipeline Stage', required: false, category: 'Sales' },
        { id: 'assignedToId', label: 'Assigned User (Owner)', required: false, category: 'Assignment' },
        { id: 'dealValue', label: 'Deal Value', required: false, category: 'Sales' },
        { id: 'closeDate', label: 'Expected Close Date', required: false, category: 'Sales' },

        // Marketing campaign data
        { id: 'campaign', label: 'Campaign Name', required: false, category: 'Marketing' },
        { id: 'facebookCampaign', label: 'Facebook Campaign', required: false, category: 'Marketing' },
        { id: 'facebookAdset', label: 'Facebook Ad Set', required: false, category: 'Marketing' },
        { id: 'facebookAd', label: 'Facebook Ad', required: false, category: 'Marketing' },

        // Course/Program information
        { id: 'course', label: 'Course/Program', required: false, category: 'Education' },

        // Custom fields (dynamically included)
        ...customFieldDefs.filter(f => f.isMappable).map(f => ({
            id: `customFields.${f.id}`,
            label: f.name,
            required: f.isRequired,
            category: 'Custom Fields'
        }))
    ];

    // Auto-suggest mappings when file data changes
    useState(() => {
        const suggestions: Record<string, string> = {};
        fileData.headers.forEach(header => {
            const lowerHeader = header.toLowerCase();
            const sampleValue = fileData.rows[0]?.[header] || '';

            // Smart auto-mapping based on header names and sample data
            if (lowerHeader.includes('email') || sampleValue.includes('@')) {
                suggestions[header] = 'email';
            } else if (lowerHeader.includes('full_name') || lowerHeader.includes('name')) {
                suggestions[header] = 'name';
            } else if (lowerHeader.includes('phone')) {
                suggestions[header] = 'phone';
            } else if (lowerHeader.includes('city')) {
                suggestions[header] = 'city';
            } else if (lowerHeader.includes('job_title') || lowerHeader.includes('title')) {
                suggestions[header] = 'course';
            } else if (lowerHeader.includes('lead_status') || lowerHeader.includes('status')) {
                suggestions[header] = 'source';
            }
        });

        const newMappings = { ...suggestions, ...mappings };
        setMappings(newMappings);
        onMappingsChange(newMappings);

        // Validate required fields
        const requiredFields = ['name', 'email'];
        const mappedRequiredFields = Object.values(newMappings).filter(field => requiredFields.includes(field)).length;
        const isValid = mappedRequiredFields === requiredFields.length;

        onValidationChange({
            isValid,
            errors: isValid ? [] : [`Missing required field mappings: ${requiredFields.filter(f => !Object.values(newMappings).includes(f)).join(', ')}`],
            warnings: []
        });
    });

    const handleMappingChange = (csvHeader: string, crmFieldId: string) => {
        const newMappings = { ...mappings, [csvHeader]: crmFieldId };
        setMappings(newMappings);
        onMappingsChange(newMappings);

        // Re-validate
        const requiredFields = ['name', 'email'];
        const mappedRequiredFields = Object.values(newMappings).filter(field => requiredFields.includes(field)).length;
        const isValid = mappedRequiredFields === requiredFields.length;

        onValidationChange({
            isValid,
            errors: isValid ? [] : [`Missing required field mappings: ${requiredFields.filter(f => !Object.values(newMappings).includes(f)).join(', ')}`],
            warnings: []
        });
    };

    const handleAutoMap = () => {
        const suggestions: Record<string, string> = {};
        fileData.headers.forEach(header => {
            const lowerHeader = header.toLowerCase();
            const sampleValue = fileData.rows[0]?.[header] || '';

            if (lowerHeader.includes('email') || sampleValue.includes('@')) {
                suggestions[header] = 'email';
            } else if (lowerHeader.includes('full_name') || lowerHeader.includes('name')) {
                suggestions[header] = 'name';
            } else if (lowerHeader.includes('phone')) {
                suggestions[header] = 'phone';
            } else if (lowerHeader.includes('city')) {
                suggestions[header] = 'city';
            }
        });

        const newMappings = { ...suggestions, ...mappings };
        setMappings(newMappings);
        onMappingsChange(newMappings);
    };

    const getSampleValue = (header: string) => {
        const values = fileData.rows.slice(0, 2).map(row => row[header]).filter(Boolean);
        return values.length > 0 ? values.join(', ') : 'No data';
    };

    const mappedCount = Object.values(mappings).filter(Boolean).length;

    return (
        <div className="space-y-6">
            {/* Header with sample download */}
            <div className="text-center">
                <h3 className="text-xl font-semibold text-on-surface mb-2">Map Fields</h3>
                <p className="text-sm text-subtle mb-4">
                    {mappedCount} of {fileData.headers.length} columns mapped
                </p>

                {/* Sample CSV Download Button */}
                <button
                    onClick={() => {
                        const sampleHeaders = [
                            'full_name', 'email', 'phone_number', 'alternate_phone', 'city', 'company',
                            'lead_source', 'pipeline_stage', 'assigned_user_email', 'deal_value', 'expected_close_date',
                            'campaign_name', 'facebook_campaign', 'facebook_adset', 'facebook_ad', 'course_program'
                        ];

                        const sampleData = [
                            'John Doe', 'john.doe@example.com', '+1-555-0123', '+1-555-0124', 'New York', 'Acme Corp',
                            'Facebook', 'Qualified', 'sales@company.com', '50000', '2024-12-31',
                            'Q4 Campaign', 'FB_Q4_2024', 'AdSet_001', 'Ad_001', 'MBA Program'
                        ];

                        const csvContent = [
                            sampleHeaders.join(','),
                            sampleData.join(',')
                        ].join('\n');

                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');
                        const url = URL.createObjectURL(blob);
                        link.setAttribute('href', url);
                        link.setAttribute('download', 'crm_import_sample.csv');
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium mb-4"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l4-4m-4 4l-4-4m8 2h3m-3 0h-3m0 0v3m0-3v-3" />
                    </svg>
                    Download Sample CSV
                </button>
            </div>

            {/* Ultra-simple two-column layout - exactly as requested */}
            <div className="space-y-4">
                {/* Column headers */}
                <div className="grid grid-cols-2 gap-4 pb-2 border-b border-muted text-sm font-semibold text-on-surface">
                    <div>CSV Headers (from file)</div>
                    <div>CRM Fields (select to map)</div>
                </div>

                {/* Simple mapping rows */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {fileData.headers.map(header => {
                        const currentMapping = mappings[header] || '';

                        return (
                            <div key={header} className="grid grid-cols-2 gap-4 items-center py-2">
                                {/* Left: Simple CSV header name only */}
                                <div className="font-mono text-sm text-on-surface bg-muted/30 px-3 py-2 rounded">
                                    {header}
                                </div>

                                {/* Right: Simple CRM field dropdown */}
                                <select
                                    value={currentMapping}
                                    onChange={(e) => handleMappingChange(header, e.target.value)}
                                    className="bg-background border border-muted px-3 py-2 rounded text-sm focus:border-primary-500 focus:outline-none"
                                >
                                    <option value="">-- Select CRM Field --</option>
                                    {crmFields.map(field => (
                                        <option key={field.id} value={field.id}>
                                            {field.label} {field.required ? '*' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3 pt-4 border-t border-muted">
                <button
                    onClick={handleAutoMap}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                    Auto-Map Suggestions
                </button>
                <button
                    onClick={() => {
                        const newMappings = {};
                        fileData.headers.forEach(header => {
                            newMappings[header] = '';
                        });
                        setMappings(newMappings);
                        onMappingsChange(newMappings);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                    Clear All
                </button>
            </div>
        </div>
    );
};

// Step 3: Review
const ReviewStep: React.FC<{
    mappings: FieldMapping[];
    fileHeaders: string[];
    sampleData: Record<string, string>[];
    onImport: () => void;
}> = ({ mappings, fileHeaders, sampleData, onImport }) => {
    const mappedFields = mappings.filter(m => m.crmField !== '---');
    const requiredFields = ['name', 'email'];
    const missingRequiredFields = requiredFields.filter(field =>
        !mappedFields.some(m => m.crmField === field)
    );

    return (
        <div>
            <p className="text-sm text-subtle mb-4">
                Review a sample of your data before importing. Only mapped fields will be imported.
            </p>

            {missingRequiredFields.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
                        Missing required fields: {missingRequiredFields.join(', ')}
                    </p>
                    <p className="text-xs text-red-500 dark:text-red-300 mt-1">
                        Please map these fields to continue with the import.
                    </p>
                </div>
            )}

            <div className="mb-4">
                <h4 className="font-semibold text-on-surface mb-2">Field Mappings:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    {mappedFields.map(m => (
                        <div key={m.sourceField} className="flex items-center gap-2">
                            <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                                {m.sourceField}
                            </span>
                            <span className="text-subtle">→</span>
                            <span className="font-semibold">{m.crmField}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="overflow-x-auto bg-background rounded-lg p-2">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left border-b border-muted">
                            {mappedFields.map(m => (
                                <th key={m.sourceField} className="p-2 font-semibold">
                                    {m.crmField}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sampleData.slice(0, 5).map((row, index) => (
                            <tr key={index} className="border-t border-muted">
                                {mappedFields.map(m => (
                                    <td key={m.sourceField} className="p-2 truncate max-w-32" title={row[m.sourceField]}>
                                        {row[m.sourceField] || '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {sampleData.length > 5 && (
                    <p className="text-xs text-subtle mt-2 text-center">
                        Showing 5 of {sampleData.length} rows
                    </p>
                )}
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Ready to import {sampleData.length} leads.</strong>
                    {missingRequiredFields.length === 0 ? (
                        <> Click "Confirm & Import" to start the import process.</>
                    ) : (
                        <> Please go back and map the required fields first.</>
                    )}
                </p>
            </div>
        </div>
    );
};


interface ImportLeadsModalProps {
    customFieldDefs: CustomFieldDefinition[];
    onClose: () => void;
    onImport: (leads: Partial<Lead>[]) => void;
    currentOrganization: { id: string };
    existingLeads: Lead[];
}

const ImportLeadsModal: React.FC<ImportLeadsModalProps> = ({
    customFieldDefs,
    onClose,
    onImport,
    currentOrganization,
    existingLeads
}) => {
    const [step, setStep] = useState(1);
    const [fileData, setFileData] = useState<ParsedFileData | null>(null);
    const [mappings, setMappings] = useState<Record<string, string>>({});
    const [validation, setValidation] = useState<{ isValid: boolean; errors: string[]; warnings: string[] }>({ isValid: false, errors: [], warnings: [] });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [currentStep, setCurrentStep] = useState('');

    const handleFileSelect = async (file: File) => {
        setSelectedFile(file);
        setLoading(true);
        setError('');

        try {
            const parsed = await parseFile(file);
            setFileData(parsed);

            // Initialize simple mappings
            const initialMappings: Record<string, string> = {};
            parsed.headers.forEach(header => {
                initialMappings[header] = '';
            });
            setMappings(initialMappings);
            setStep(2);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse file');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!fileData || !mappings) return;

        setIsImporting(true);
        setImportProgress(0);
        setCurrentStep('Preparing import...');

        try {
            // Convert simple mappings to old format for compatibility
            const mappedFields = Object.entries(mappings)
                .filter(([_, crmFieldId]) => crmFieldId)
                .map(([sourceField, crmField]) => ({ sourceField, crmField }));
            const requiredFields = ['name', 'email'];
            const missingRequiredFields = requiredFields.filter(field =>
                !mappedFields.some(m => m.crmField === field)
            );

            if (missingRequiredFields.length > 0) {
                throw new Error(`Missing required field mappings: ${missingRequiredFields.join(', ')}`);
            }

            setCurrentStep('Validating data...');
            setImportProgress(10);

            // Validate all rows
            const allErrors: ImportError[] = [];
            fileData.rows.forEach((row, index) => {
                // Convert mappings to old format for validation
                const oldFormatMappings = Object.entries(mappings)
                    .filter(([_, crmFieldId]) => crmFieldId)
                    .map(([sourceField, crmField]) => ({ sourceField, crmField }));
                const rowErrors = validateLeadData(row, oldFormatMappings);
                rowErrors.forEach(error => {
                    allErrors.push({ ...error, row: index + 2 }); // +2 because row 1 is headers
                });
            });

            if (allErrors.length > 0 && allErrors.length > fileData.rows.length * 0.5) {
                throw new Error(`Too many validation errors (${allErrors.length}). Please check your data and mappings.`);
            }

            setCurrentStep('Detecting duplicates...');
            setImportProgress(30);

            // Process leads with duplicate detection
            const leadsToCreate: Partial<Lead>[] = [];
            const leadsToUpdate: Partial<Lead>[] = [];
            const skippedLeads: number[] = [];
            const failedLeads: ImportError[] = [];

            fileData.rows.forEach((row, index) => {
                try {
                    const leadData: Partial<Lead> = {
                        organizationId: currentOrganization.id,
                        activities: [],
                        score: 0,
                        tags: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };

                    // Map fields based on mappings
                    mappedFields.forEach(mapping => {
                        const value = row[mapping.sourceField];
                        if (value && mapping.crmField) {
                            if (mapping.crmField.startsWith('customFields.')) {
                                const fieldId = mapping.crmField.replace('customFields.', '');
                                leadData.customFields = leadData.customFields || {};
                                leadData.customFields[fieldId] = value;
                            } else if (mapping.crmField === 'assignedToId') {
                                // Handle user assignment by email lookup
                                const user = users.find(u => u.email.toLowerCase() === value.toLowerCase());
                                if (user) {
                                    leadData.assignedToId = user.id;
                                }
                            } else {
                                (leadData as any)[mapping.crmField] = value;
                            }
                        }
                    });

                    // Set defaults for required fields if not mapped
                    if (!leadData.source) leadData.source = LeadSource.WEBSITE;
                    if (!leadData.stage) leadData.stage = 'new';
                    if (!leadData.followUpStatus) leadData.followUpStatus = FollowUpStatus.PENDING;

                    // Check for duplicates
                    const existingLead = existingLeads.find(el =>
                        el.email.toLowerCase() === leadData.email?.toLowerCase()
                    );

                    if (existingLead) {
                        // Ask user what to do with duplicates (for now, skip)
                        skippedLeads.push(index + 2);
                    } else {
                        leadsToCreate.push(leadData);
                    }
                } catch (error) {
                    failedLeads.push({
                        row: index + 2,
                        message: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            });

            setCurrentStep('Creating leads...');
            setImportProgress(60);

            // Simulate API calls (replace with actual API calls)
            const createdLeads: Lead[] = [];
            for (let i = 0; i < leadsToCreate.length; i++) {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 100));
                createdLeads.push({
                    ...leadsToCreate[i],
                    id: `imported_${Date.now()}_${i}`,
                } as Lead);

                setImportProgress(60 + (i / leadsToCreate.length) * 30);
            }

            setCurrentStep('Finalizing...');
            setImportProgress(95);

            const result: ImportResult = {
                success: true,
                newLeads: createdLeads.length,
                updatedLeads: leadsToUpdate.length,
                failedLeads: failedLeads.length + skippedLeads.length,
                errors: [...failedLeads, ...skippedLeads.map(row => ({
                    row,
                    message: 'Duplicate lead (skipped)'
                }))]
            };

            setImportResult(result);
            setImportProgress(100);

            if (createdLeads.length > 0) {
                onImport(createdLeads);
            }

        } catch (error) {
            setImportResult({
                success: false,
                newLeads: 0,
                updatedLeads: 0,
                failedLeads: fileData.rows.length,
                errors: [{
                    row: 0,
                    message: error instanceof Error ? error.message : 'Import failed'
                }]
            });
        } finally {
            setIsImporting(false);
        }
    };

    const handleRetry = () => {
        setImportResult(null);
        setImportProgress(0);
        setIsImporting(false);
        setCurrentStep('');
    };

    const stepTitles = ["Upload File", "Map Fields", "Review & Import"];

    if (importResult) {
        return (
            <Modal isOpen={true} onClose={onClose} title="Import Results">
                <div className="p-4">
                    <ImportProgress
                        isImporting={false}
                        progress={100}
                        currentStep=""
                        result={importResult}
                        onClose={onClose}
                        onRetry={handleRetry}
                    />
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={true} onClose={onClose} title={`Import Leads (${step}/${stepTitles.length}) - ${stepTitles[step-1]}`}>
            <div className="p-4">
                {step === 1 && (
                    <UploadStep
                        onNext={(data) => {
                            setFileData(data);
                            setStep(2);
                        }}
                        onFileSelect={handleFileSelect}
                        loading={loading}
                        error={error}
                    />
                )}
                {step === 2 && fileData && (
                    <MappingStep
                        customFieldDefs={customFieldDefs}
                        fileData={fileData}
                        onMappingsChange={setMappings}
                        onValidationChange={setValidation}
                    />
                )}
                {step === 3 && fileData && (
                    <ReviewStep
                        mappings={Object.entries(mappings)
                            .filter(([_, crmField]) => crmField)
                            .map(([sourceField, crmField]) => ({
                                sourceField,
                                crmField
                            }))}
                        fileHeaders={fileData.headers}
                        sampleData={fileData.rows}
                        onImport={handleImport}
                    />
                )}
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-muted">
                <button
                    type="button"
                    onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                    className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg"
                    disabled={isImporting}
                >
                    {step === 1 ? 'Cancel' : 'Back'}
                </button>

                <button
                    type="button"
                    onClick={() => {
                        if (step < 3) {
                            setStep(step + 1);
                        } else {
                            handleImport();
                        }
                    }}
                    disabled={isImporting || (step === 3 && !canProceedWithImport())}
                    className="bg-primary-600 hover:bg-primary-700 disabled:bg-muted disabled:text-subtle text-white font-bold py-2 px-4 rounded-lg"
                >
                    {isImporting ? 'Importing...' : (step < 3 ? 'Next' : 'Confirm & Import')}
                </button>
            </div>

            {isImporting && (
                <div className="mt-4">
                    <ImportProgress
                        isImporting={true}
                        progress={importProgress}
                        currentStep={currentStep}
                        result={null}
                        onClose={() => {}}
                    />
                </div>
            )}
        </Modal>
    );

    function canProceedWithImport(): boolean {
        if (!fileData || !mappings) return false;

        const mappedFields = Object.values(mappings).filter(Boolean);
        const requiredFields = ['name', 'email'];

        return requiredFields.every(field =>
            mappedFields.includes(field)
        ) && validation.isValid;
    }
};

export default ImportLeadsModal;



