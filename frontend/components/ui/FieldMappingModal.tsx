import React, { useState } from 'react';
import { FieldMapping, CustomFieldDefinition, IntegrationSource } from '../../types';
import Modal from './Modal';
import { AppIcons } from './Icons';

// Simulate incoming fields from different sources
const SOURCE_FIELDS: Record<IntegrationSource, string[]> = {
    'Facebook': ['full_name', 'email', 'phone_number', 'city', 'form_name', 'campaign_name', 'adset_name', 'ad_name'],
    'Google Ads': ['given_name', 'family_name', 'email_address', 'phone', 'location', 'campaign_id'],
    'Website': ['name', 'email', 'phone', 'company', 'message', 'course_of_interest'],
    'Cloud Telephony': [],
    'Email Marketing': ['email', 'first_name', 'last_name', 'list_id'],
    'SMS Marketing': [],
};

interface FieldMappingModalProps {
    sourceName: IntegrationSource;
    currentMappings: FieldMapping[];
    customFieldDefs: CustomFieldDefinition[];
    onClose: () => void;
    onSave: (mappings: FieldMapping[]) => void;
}

const FieldMappingModal: React.FC<FieldMappingModalProps> = ({ sourceName, currentMappings, customFieldDefs, onClose, onSave }) => {
    const [mappings, setMappings] = useState<FieldMapping[]>(currentMappings);
    
    const crmStandardFields = [
        'name', 'email', 'phone', 'alternatePhone', 'company', 'city', 'course', 'campaign', 'facebookCampaign', 'facebookAdset', 'facebookAd'
    ];
    const crmCustomFields = customFieldDefs.filter(f => f.isMappable).map(f => ({ id: f.id, name: f.name }));

    const handleMappingChange = (sourceField: string, crmField: string) => {
        setMappings(prev => {
            const existingMappingIndex = prev.findIndex(m => m.sourceField === sourceField);
            if (crmField === "---") { // Unmap
                return prev.filter(m => m.sourceField !== sourceField);
            }
            if (existingMappingIndex > -1) {
                const newMappings = [...prev];
                newMappings[existingMappingIndex].crmField = crmField;
                return newMappings;
            } else {
                return [...prev, { sourceField, crmField }];
            }
        });
    };
    
    const handleSubmit = () => {
        onSave(mappings);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Map Fields for ${sourceName}`}>
            <div className="p-4 bg-background rounded-lg">
                <p className="text-sm text-subtle mb-4">
                    Match the incoming fields from your {sourceName} source to the corresponding fields in Clienn CRM. 
                    Unmapped fields will not be imported.
                </p>
                <div className="grid grid-cols-3 gap-4 items-center font-semibold text-on-surface mb-2">
                    <div className="col-span-1">Source Field ({sourceName})</div>
                    <div className="col-span-2">CRM Field</div>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {SOURCE_FIELDS[sourceName].map(sourceField => {
                        const currentMapping = mappings.find(m => m.sourceField === sourceField)?.crmField || "---";
                        return (
                             <div key={sourceField} className="grid grid-cols-3 gap-4 items-center">
                                <div className="col-span-1">
                                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{sourceField}</span>
                                </div>
                                <div className="col-span-2 flex items-center gap-2">
                                     <AppIcons.Mapping className="h-5 w-5 text-subtle" />
                                     <select 
                                        value={currentMapping} 
                                        onChange={e => handleMappingChange(sourceField, e.target.value)}
                                        className="w-full bg-surface border border-muted p-2 rounded-lg text-sm"
                                    >
                                        <option value="---">-- Do Not Map --</option>
                                        <optgroup label="Standard Fields">
                                            {crmStandardFields.map(f => <option key={f} value={f}>{f}</option>)}
                                        </optgroup>
                                         {crmCustomFields.length > 0 && <optgroup label="Custom Fields">
                                            {crmCustomFields.map(f => <option key={f.id} value={`customFields.${f.id}`}>{f.name}</option>)}
                                        </optgroup>}
                                    </select>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-muted">
                <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button type="button" onClick={handleSubmit} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Save Mapping</button>
            </div>
        </Modal>
    );
};

export default FieldMappingModal;


