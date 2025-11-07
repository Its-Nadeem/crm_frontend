import React, { useState } from 'react';
import { Lead, CustomFieldDefinition, FieldMapping, LeadSource } from '../../types';
import Modal from '../ui/Modal';
import { AppIcons } from '../ui/Icons';
import FileUpload from '../../src/components/ui/FileUpload';
import ImportProgress from '../../src/components/ui/ImportProgress';
import { parseFile, ParsedFileData, ImportResult, validateLeadData } from '../../src/utils/fileParser';

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

// Step 2: Mapping
const MappingStep: React.FC<{
    customFieldDefs: CustomFieldDefinition[];
    mappings: FieldMapping[];
    setMappings: (mappings: FieldMapping[]) => void;
}> = ({ customFieldDefs, mappings, setMappings }) => {
    const crmStandardFields = ['name', 'email', 'phone', 'company', 'city', 'course'];
    const crmCustomFields = customFieldDefs.filter(f => f.isMappable).map(f => ({ id: f.id, name: f.name }));

    const handleMappingChange = (sourceField: string, crmField: string) => {
        setMappings(
            mappings.map(m => m.sourceField === sourceField ? { ...m, crmField } : m)
        );
    };

    return (
        <div>
            <p className="text-sm text-subtle mb-4">Map the columns from your file to the corresponding fields in the CRM.</p>
            <div className="space-y-3 max-h-80 overflow-y-auto">
                {mappings.map(({ sourceField, crmField }) => (
                    <div key={sourceField} className="grid grid-cols-2 gap-4 items-center">
                        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{sourceField}</span>
                        <select
                            value={crmField}
                            onChange={e => handleMappingChange(sourceField, e.target.value)}
                            className="w-full bg-surface border border-muted p-2 rounded-lg text-sm"
                        >
                            <option value="---">-- Do Not Import --</option>
                            <optgroup label="Standard Fields">
                                {crmStandardFields.map(f => <option key={f} value={f}>{f}</option>)}
                            </optgroup>
                            {crmCustomFields.length > 0 && <optgroup label="Custom Fields">
                                {crmCustomFields.map(f => <option key={f.id} value={`customFields.${f.id}`}>{f.name}</option>)}
                            </optgroup>}
                        </select>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Step 3: Review
const ReviewStep: React.FC<{ mappings: FieldMapping[] }> = ({ mappings }) => {
    const mappedFields = mappings.filter(m => m.crmField !== '---');
    
    return (
        <div>
            <p className="text-sm text-subtle mb-4">Review a sample of your data before importing. Only mapped fields will be imported.</p>
            <div className="overflow-x-auto bg-background rounded-lg p-2">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left">
                            {mappedFields.map(m => <th key={m.sourceField} className="p-2 font-semibold">{m.crmField}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {MOCK_CSV_ROWS.map((row, index) => (
                            <tr key={index} className="border-t border-muted">
                                {mappedFields.map(m => (
                                    <td key={m.sourceField} className="p-2 truncate" style={{maxWidth: '150px'}}>{row[m.sourceField as keyof typeof row]}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


interface ImportLeadsModalProps {
    customFieldDefs: CustomFieldDefinition[];
    onClose: () => void;
    onImport: (leads: Partial<Lead>[]) => void;
}

const ImportLeadsModal: React.FC<ImportLeadsModalProps> = ({ customFieldDefs, onClose, onImport }) => {
    const [step, setStep] = useState(1);
    const [mappings, setMappings] = useState<FieldMapping[]>(
        MOCK_CSV_HEADERS.map(header => ({ sourceField: header, crmField: '---' }))
    );

    const handleImport = () => {
        // In a real app, you'd process the whole file. Here, we'll just use the mock data.
        alert(`Successfully imported ${MOCK_CSV_ROWS.length} leads!`);
        onImport([]); // Pass empty array as this is just a simulation
        onClose();
    };

    const stepTitles = ["Upload File", "Map Fields", "Review & Import"];

    return (
        <Modal isOpen={true} onClose={onClose} title={`Import Leads (${step}/${stepTitles.length}) - ${stepTitles[step-1]}`}>
            <div className="p-4">
                {step === 1 && <UploadStep onNext={() => setStep(2)} />}
                {step === 2 && <MappingStep customFieldDefs={customFieldDefs} mappings={mappings} setMappings={setMappings} />}
                {step === 3 && <ReviewStep mappings={mappings} />}
            </div>
             <div className="flex justify-between items-center mt-6 pt-4 border-t border-muted">
                <button type="button" onClick={() => step > 1 ? setStep(step - 1) : onClose()} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">
                    {step === 1 ? 'Cancel' : 'Back'}
                </button>
                 <button 
                    type="button" 
                    onClick={() => step < 3 ? setStep(step + 1) : handleImport()}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                    {step < 3 ? 'Next' : 'Confirm & Import'}
                </button>
            </div>
        </Modal>
    );
};

export default ImportLeadsModal;



