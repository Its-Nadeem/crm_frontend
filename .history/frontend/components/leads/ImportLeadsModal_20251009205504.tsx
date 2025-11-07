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

// Step 2: Modern Mapping Interface
const MappingStep: React.FC<{
    customFieldDefs: CustomFieldDefinition[];
    fileData: ParsedFileData;
    onMappingsChange: (mappings: Record<string, NewFieldMapping>) => void;
    onValidationChange: (validation: { isValid: boolean; errors: string[]; warnings: string[] }) => void;
}> = ({ customFieldDefs, fileData, onMappingsChange, onValidationChange }) => {
    // Convert file data to the new format
    const csvColumns: CsvColumn[] = fileData.headers.map(header => {
        const sampleValues = fileData.rows.slice(0, 3).map(row => row[header] || '');
        return {
            name: header,
            sampleValues,
            inferredType: inferDataType(sampleValues),
            rowCount: fileData.rows.length
        };
    });

    // Convert CRM fields to the new format
    const crmFields: CrmField[] = [
        { id: 'name', label: 'Full Name', required: true, accepts: ['text'], category: 'Basic Info' },
        { id: 'email', label: 'Email Address', required: true, accepts: ['email'], unique: true, category: 'Contact' },
        { id: 'phone', label: 'Phone Number', required: false, accepts: ['phone'], category: 'Contact' },
        { id: 'alternatePhone', label: 'Alternate Phone', required: false, accepts: ['phone'], category: 'Contact' },
        { id: 'company', label: 'Company', required: false, accepts: ['text'], category: 'Basic Info' },
        { id: 'city', label: 'City', required: false, accepts: ['text'], category: 'Location' },
        { id: 'course', label: 'Course/Program', required: false, accepts: ['text'], category: 'Education' },
        { id: 'source', label: 'Lead Source', required: false, accepts: ['text'], category: 'Marketing' },
        { id: 'stage', label: 'Pipeline Stage', required: false, accepts: ['text'], category: 'Sales' },
        { id: 'dealValue', label: 'Deal Value', required: false, accepts: ['number'], category: 'Sales' },
        { id: 'closeDate', label: 'Expected Close Date', required: false, accepts: ['date'], category: 'Sales' },
        { id: 'campaign', label: 'Marketing Campaign', required: false, accepts: ['text'], category: 'Marketing' },
        ...customFieldDefs.filter(f => f.isMappable).map(f => ({
            id: `customFields.${f.id}`,
            label: f.name,
            required: f.isRequired,
            accepts: ['text' as const, 'number' as const, 'date' as const],
            category: 'Custom Fields'
        }))
    ];

    return (
        <div className="h-96">
            <ModernMappingInterface
                csvColumns={csvColumns}
                crmFields={crmFields}
                onMappingsChange={onMappingsChange}
                onValidationChange={onValidationChange}
                previewData={fileData.rows}
            />
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
    const [modernMappings, setModernMappings] = useState<Record<string, NewFieldMapping>>({});
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

            // Initialize modern mappings
            const initialModernMappings: Record<string, NewFieldMapping> = {};
            parsed.headers.forEach(header => {
                initialModernMappings[header] = {
                    csvColumnName: header,
                    crmFieldId: null,
                    status: 'unmapped'
                };
            });
            setModernMappings(initialModernMappings);
            setStep(2);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse file');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!fileData || !mappings.length) return;

        setIsImporting(true);
        setImportProgress(0);
        setCurrentStep('Preparing import...');

        try {
            const mappedFields = mappings.filter(m => m.crmField !== '---');
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
                const rowErrors = validateLeadData(row, mappedFields);
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
                        if (value) {
                            if (mapping.crmField.startsWith('customFields.')) {
                                const fieldId = mapping.crmField.replace('customFields.', '');
                                leadData.customFields = leadData.customFields || {};
                                leadData.customFields[fieldId] = value;
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
                        mappings={mappings}
                        setMappings={setMappings}
                        fileHeaders={fileData.headers}
                        sampleData={fileData.rows}
                    />
                )}
                {step === 3 && fileData && (
                    <ReviewStep
                        mappings={mappings}
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
        if (!fileData || !mappings.length) return false;

        const mappedFields = mappings.filter(m => m.crmField !== '---');
        const requiredFields = ['name', 'email'];

        return requiredFields.every(field =>
            mappedFields.some(m => m.crmField === field)
        );
    }
};

export default ImportLeadsModal;



