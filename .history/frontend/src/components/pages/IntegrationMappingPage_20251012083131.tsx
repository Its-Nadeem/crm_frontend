import React, { useState, useEffect } from 'react';
import { ModernMappingInterface } from '../ui/mapping/ModernMappingInterface';
import { CustomFieldManager } from '../ui/CustomFieldManager';
import { useCustomFields } from '../../hooks/useCustomFields';
import { useRealTimeSync } from '../../hooks/useRealTimeSync';
import { CsvColumn, CrmField, FieldMapping } from '../../types/mapping';
import { apiService } from '../../services/api';
import { useToast } from '../ui/Toast';

interface IntegrationMappingPageProps {
    organizationId: string;
    integrationType: 'csv' | 'facebook' | 'google' | 'website';
}

export const IntegrationMappingPage: React.FC<IntegrationMappingPageProps> = ({
    organizationId,
    integrationType
}) => {
    const [csvColumns, setCsvColumns] = useState<CsvColumn[]>([]);
    const [fileData, setFileData] = useState<Record<string, string>[]>([]);
    const [mappings, setMappings] = useState<Record<string, FieldMapping>>({});
    const [validation, setValidation] = useState<{ isValid: boolean; errors: string[]; warnings: string[] }>({ isValid: false, errors: [], warnings: [] });
    const [activeTab, setActiveTab] = useState<'mapping' | 'fields'>('mapping');
    const [isImporting, setIsImporting] = useState(false);

    const { mappableFields, refreshFields } = useCustomFields(organizationId);
    const { addToast } = useToast();

    // Real-time synchronization
    const { isConnected: syncConnected, syncCustomFields } = useRealTimeSync({
        organizationId,
        onCustomFieldsUpdate: (fields) => {
            addToast({ type: 'success', title: 'Custom fields updated in real-time' });
            refreshFields();
        },
        onIntegrationUpdate: (integration) => {
            addToast({ type: 'info', title: `${integrationType} integration updated` });
        }
    });

    // Convert mappable fields to CrmField format for the mapping interface
    const crmFields: CrmField[] = mappableFields.map(field => ({
        id: field.id,
        label: field.name,
        required: field.isRequired,
        accepts: [field.type as any],
        unique: false,
        category: 'Custom Fields',
        description: `Custom ${field.type} field`
    }));

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());

            if (lines.length === 0) {
                addToast({ type: 'error', title: 'Invalid file format' });
                return;
            }

            // Parse CSV header
            const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));

            // Parse sample data (first 5 rows for preview)
            const sampleData = lines.slice(1, 6).map(line => {
                const values = line.split(',').map(value => value.trim().replace(/"/g, ''));
                const row: Record<string, string> = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                return row;
            });

            // Infer column types
            const columns: CsvColumn[] = headers.map(header => {
                const sampleValues = sampleData.map(row => row[header]).filter(val => val);
                return {
                    name: header,
                    sampleValues,
                    inferredType: inferDataType(sampleValues),
                    rowCount: lines.length - 1
                };
            });

            setCsvColumns(columns);
            setFileData(sampleData);
        } catch (error) {
            console.error('Error parsing file:', error);
            addToast({ type: 'error', title: 'Failed to parse file' });
        }
    };

    const handleMappingsChange = (newMappings: Record<string, FieldMapping>) => {
        setMappings(newMappings);
    };

    const handleValidationChange = (newValidation: { isValid: boolean; errors: string[]; warnings: string[] }) => {
        setValidation(newValidation);
    };

    const handleImport = async () => {
        if (!validation.isValid) {
            addToast({ type: 'error', title: 'Please fix validation errors before importing' });
            return;
        }

        setIsImporting(true);
        try {
            // Transform file data using mappings
            const transformedData = fileData.map(row => {
                const transformedRow: Record<string, any> = {};

                Object.entries(mappings).forEach(([csvColumn, mapping]) => {
                    if (mapping.crmFieldId && row[csvColumn]) {
                        const field = crmFields.find(f => f.id === mapping.crmFieldId);
                        if (field) {
                            transformedRow[field.label] = applyTransform(row[csvColumn], mapping.transforms);
                        }
                    }
                });

                return transformedRow;
            });

            // Send to backend for processing
            await apiService.createLead({
                organizationId,
                customFields: transformedData,
                source: integrationType,
                importMappings: mappings
            });

            addToast({ type: 'success', title: 'Data imported successfully' });
        } catch (error) {
            console.error('Error importing data:', error);
            addToast({ type: 'error', title: 'Failed to import data' });
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="bg-surface border-b border-muted p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-on-surface">
                            {integrationType.charAt(0).toUpperCase() + integrationType.slice(1)} Integration
                        </h1>
                        <p className="text-subtle mt-1">
                            Map your {integrationType} data to CRM fields
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="file"
                            accept=".csv,.xlsx"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer"
                        >
                            Upload File
                        </label>

                        <button
                            onClick={handleImport}
                            disabled={!validation.isValid || isImporting || csvColumns.length === 0}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isImporting ? 'Importing...' : 'Import Data'}
                        </button>
                    </div>
                </div>

                {/* Real-time Sync Status */}
                <div className="mt-4 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${syncConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className={syncConnected ? 'text-green-700' : 'text-red-700'}>
                            {syncConnected ? 'Real-time sync active' : 'Real-time sync disconnected'}
                        </span>
                    </div>
                    {mappableFields.length > 0 && (
                        <span className="text-subtle">
                            {mappableFields.length} mappable field{mappableFields.length !== 1 ? 's' : ''} available
                        </span>
                    )}
                </div>

                {/* Validation Status */}
                {validation.errors.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <h3 className="font-medium text-red-800 mb-2">Validation Errors</h3>
                        <ul className="text-sm text-red-700 space-y-1">
                            {validation.errors.map((error, index) => (
                                <li key={index}>• {error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {validation.warnings.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h3 className="font-medium text-yellow-800 mb-2">Warnings</h3>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            {validation.warnings.map((warning, index) => (
                                <li key={index}>• {warning}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-muted">
                <div className="flex">
                    <button
                        onClick={() => setActiveTab('mapping')}
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                            activeTab === 'mapping'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-subtle hover:text-on-surface'
                        }`}
                    >
                        Field Mapping
                    </button>
                    <button
                        onClick={() => setActiveTab('fields')}
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                            activeTab === 'fields'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-subtle hover:text-on-surface'
                        }`}
                    >
                        Manage Custom Fields
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'mapping' && (
                    <div className="h-full">
                        {csvColumns.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-center p-8">
                                <div>
                                    <h3 className="text-lg font-medium text-on-surface mb-2">
                                        No file uploaded
                                    </h3>
                                    <p className="text-subtle mb-4">
                                        Upload a CSV file to start mapping your data
                                    </p>
                                    <label
                                        htmlFor="file-upload"
                                        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer"
                                    >
                                        Choose File
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <ModernMappingInterface
                                csvColumns={csvColumns}
                                crmFields={crmFields}
                                organizationId={organizationId}
                                includeMappableFields={true}
                                onMappingsChange={handleMappingsChange}
                                onValidationChange={handleValidationChange}
                                previewData={fileData}
                            />
                        )}
                    </div>
                )}

                {activeTab === 'fields' && (
                    <div className="h-full overflow-auto p-6">
                        <CustomFieldManager
                            organizationId={organizationId}
                            onFieldsChange={(fields) => {
                                // Refresh mapping interface when fields change
                                refreshFields();
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper functions (simplified versions from mappingUtils)
const inferDataType = (values: string[]): 'email' | 'phone' | 'date' | 'number' | 'text' | 'url' => {
    if (values.length === 0) return 'text';

    const sample = values.find(v => v && v.trim());
    if (sample && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sample)) return 'email';
    if (sample && /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/.test(sample)) return 'phone';
    if (sample && !isNaN(Number(sample))) return 'number';
    return 'text';
};

const applyTransform = (value: string, transforms?: any): string => {
    if (!value || !transforms) return value;
    let result = value.trim();
    if (transforms.toCase === 'upper') result = result.toUpperCase();
    if (transforms.toCase === 'lower') result = result.toLowerCase();
    return result;
};


