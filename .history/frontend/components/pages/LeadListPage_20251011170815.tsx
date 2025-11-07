import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Lead, User, Stage, Task, CustomFieldDefinition, FilterCondition, FilterOperator, Permission, SavedFilter, WhatsAppTemplate, UserRole, LeadSource, ScheduledMessage, SMSTemplate } from '../../types';
import AssignUserModal from '../leads/AssignUserModal';
import { AppIcons } from '../ui/Icons';
import { LEAD_SOURCES } from '../../constants';
import ImportLeadsModal from '../leads/ImportLeadsModal';
import Modal from '../ui/Modal';
import { Link } from 'react-router-dom';
import FilterBuilder from '../ui/FilterBuilder';
import { apiService } from '../../src/services/api';


const BulkEditModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    selectedLeads: Lead[];
    users: User[];
    pipelineStages: Stage[];
    customFieldDefs: CustomFieldDefinition[];
    onBulkUpdate: (updates: any) => void;
    onBulkDelete: () => void;
}> = ({ isOpen, onClose, selectedLeads, users, pipelineStages, customFieldDefs, onBulkUpdate, onBulkDelete }) => {
    const [bulkUpdates, setBulkUpdates] = useState<any>({
        stage: '',
        assignedToId: '',
        customFields: {}
    });

    const handleFieldChange = (field: string, value: any) => {
        setBulkUpdates(prev => ({ ...prev, [field]: value }));
    };

    const handleCustomFieldChange = (id: string, value: any) => {
        setBulkUpdates(prev => ({
            ...prev,
            customFields: { ...prev.customFields, [id]: value }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Filter out empty fields
        const updates: any = {};
        if (bulkUpdates.stage) updates.stage = bulkUpdates.stage;
        if (bulkUpdates.assignedToId) updates.assignedToId = parseInt(bulkUpdates.assignedToId);
        if (Object.keys(bulkUpdates.customFields).length > 0) {
            updates.customFields = {};
            Object.keys(bulkUpdates.customFields).forEach(key => {
                if (bulkUpdates.customFields[key]) {
                    updates.customFields[key] = bulkUpdates.customFields[key];
                }
            });
        }

        if (Object.keys(updates).length > 0) {
            onBulkUpdate(updates);
            onClose();
        }
    };

    const handleDeleteAll = () => {
        if (window.confirm(`Are you sure you want to delete ${selectedLeads.length} selected leads? This action cannot be undone.`)) {
            onBulkDelete();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-muted">
                    <h2 className="text-2xl font-bold">Bulk Edit {selectedLeads.length} Leads</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Pipeline Stage */}
                    <div>
                        <label className="block text-sm font-medium text-subtle mb-2">Pipeline Stage</label>
                        <select
                            value={bulkUpdates.stage}
                            onChange={e => handleFieldChange('stage', e.target.value)}
                            className="w-full bg-background border border-muted p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">No change</option>
                            {pipelineStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    {/* Assigned To */}
                    <div>
                        <label className="block text-sm font-medium text-subtle mb-2">Assign To</label>
                        <select
                            value={bulkUpdates.assignedToId}
                            onChange={e => handleFieldChange('assignedToId', e.target.value)}
                            className="w-full bg-background border border-muted p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">No change</option>
                            {users.filter(u => u.role !== "Admin").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>

                    {/* Custom Fields */}
                    {customFieldDefs.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-subtle mb-2">Custom Fields</label>
                            <div className="space-y-3">
                                {customFieldDefs.map(def => (
                                    <div key={def.id}>
                                        <label className="text-xs text-subtle">{def.name}</label>
                                        {def.type === 'date' ? (
                                            <input
                                                type="date"
                                                value={bulkUpdates.customFields[def.id] || ''}
                                                onChange={e => handleCustomFieldChange(def.id, e.target.value)}
                                                className="w-full bg-background border border-muted p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="No change"
                                            />
                                        ) : def.type === 'number' ? (
                                            <input
                                                type="number"
                                                value={bulkUpdates.customFields[def.id] || ''}
                                                onChange={e => handleCustomFieldChange(def.id, Number(e.target.value))}
                                                className="w-full bg-background border border-muted p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="No change"
                                            />
                                        ) : def.type === 'dropdown' ? (
                                            <select
                                                value={bulkUpdates.customFields[def.id] || ''}
                                                onChange={e => handleCustomFieldChange(def.id, e.target.value)}
                                                className="w-full bg-background border border-muted p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            >
                                                <option value="">No change</option>
                                                {def.options?.map(option => (
                                                    <option key={`option-${option}`} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={bulkUpdates.customFields[def.id] || ''}
                                                onChange={e => handleCustomFieldChange(def.id, e.target.value)}
                                                className="w-full bg-background border border-muted p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="No change"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-4 border-t border-muted">
                        <button
                            type="button"
                            onClick={handleDeleteAll}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
                        >
                            <AppIcons.Delete className="w-4 h-4" />
                            Delete All ({selectedLeads.length})
                        </button>

                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">
                                Cancel
                            </button>
                            <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">
                                Update Leads
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ExportLeadsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onExport: (scope: 'selected' | 'filtered' | 'all', fields: string[]) => void;
    allLeadsCount: number;
    filteredLeadsCount: number;
    selectedLeadsCount: number;
    allColumns: { id: string; name: string }[];
}> = ({ isOpen, onClose, onExport, allLeadsCount, filteredLeadsCount, selectedLeadsCount, allColumns }) => {
    const [scope, setScope] = useState<'selected' | 'filtered' | 'all'>(selectedLeadsCount > 0 ? 'selected' : 'filtered');
    const [selectedFields, setSelectedFields] = useState<Set<string>>(() => new Set(allColumns.map(c => c.id)));

    useEffect(() => {
        if (selectedLeadsCount > 0) {
            setScope('selected');
        } else if (scope === 'selected') {
            setScope('filtered');
        }
    }, [selectedLeadsCount, scope]);

    const handleToggleField = (fieldId: string) => {
        setSelectedFields(prev => {
            const newSet = new Set(prev);
            if (newSet.has(fieldId)) {
                newSet.delete(fieldId);
            } else {
                newSet.add(fieldId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => setSelectedFields(new Set(allColumns.map(c => c.id)));
    const handleDeselectAll = () => setSelectedFields(new Set());

    const handleExportClick = () => {
        if (selectedFields.size === 0) {
            alert('Please select at least one field to export.');
            return;
        }
        onExport(scope, Array.from(selectedFields));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Export Leads">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left side: Options */}
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-lg">What to export?</h3>
                        <div className="space-y-2 mt-2">
                            <label className="flex items-center p-3 bg-background rounded-lg hover:bg-muted/50 transition-colors cursor-pointer has-[:disabled]:opacity-50 has-[:disabled]:cursor-not-allowed">
                                <input type="radio" name="export-scope" value="selected" checked={scope === 'selected'} onChange={() => setScope('selected')} disabled={selectedLeadsCount === 0} className="h-4 w-4 text-primary-600 focus:ring-primary-500"/>
                                <span className="ml-3 font-medium text-on-surface">Selected leads <span className="text-subtle">({selectedLeadsCount})</span></span>
                            </label>
                             <label className="flex items-center p-3 bg-background rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                <input type="radio" name="export-scope" value="filtered" checked={scope === 'filtered'} onChange={() => setScope('filtered')} className="h-4 w-4 text-primary-600 focus:ring-primary-500"/>
                                <span className="ml-3 font-medium text-on-surface">Leads from current view <span className="text-subtle">({filteredLeadsCount})</span></span>
                            </label>
                             <label className="flex items-center p-3 bg-background rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                <input type="radio" name="export-scope" value="all" checked={scope === 'all'} onChange={() => setScope('all')} className="h-4 w-4 text-primary-600 focus:ring-primary-500"/>
                                <span className="ml-3 font-medium text-on-surface">All leads <span className="text-subtle">({allLeadsCount})</span></span>
                            </label>
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold text-lg">File format</h3>
                         <select className="w-full mt-2 bg-background border border-muted rounded-lg py-2 px-3 text-sm">
                            <option value="csv">CSV (Comma-Separated Values)</option>
                        </select>
                    </div>
                </div>

                {/* Right side: Fields */}
                <div>
                    <h3 className="font-semibold text-lg">Which fields to include?</h3>
                     <div className="flex items-center gap-2 mt-2">
                        <button onClick={handleSelectAll} className="text-xs font-semibold text-primary-500">Select All</button>
                        <span>|</span>
                        <button onClick={handleDeselectAll} className="text-xs font-semibold text-primary-500">Deselect All</button>
                    </div>
                    <div className="mt-2 space-y-2 max-h-72 overflow-y-auto border border-muted rounded-lg p-3 grid grid-cols-2 gap-2">
                        {allColumns.map(col => (
                            <label key={col.id} className="flex items-center p-2 hover:bg-muted/50 rounded-md cursor-pointer">
                                <input type="checkbox" checked={selectedFields.has(col.id)} onChange={() => handleToggleField(col.id)} className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500" />
                                <span className="ml-2 text-sm text-on-surface truncate" title={col.name}>{col.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-muted">
                <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button type="button" onClick={handleExportClick} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                    <AppIcons.Export className="w-5 h-5"/>
                    Export Leads
                </button>
            </div>
        </Modal>
    );
};


const AddLeadModal: React.FC<{ users: User[]; pipelineStages: Stage[]; customFieldDefs: CustomFieldDefinition[]; onClose: () => void; onAddLead: (lead: any) => void; }> = ({ users, pipelineStages, customFieldDefs, onClose, onAddLead }) => {
    const [leadData, setLeadData] = useState<Partial<Lead>>({
        name: '', email: '', phone: '', company: '', dealValue: 0,
        source: undefined, stage: pipelineStages[0]?.id || '',
        assignedToId: users.filter(u => u.role === "Sales Rep")[0]?.id || 0,
        tags: [], campaign: '', customFields: {}, city: '', course: '', alternatePhone: '',
        facebookAd: '', facebookAdset: '', facebookCampaign: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLeadData(prev => ({ ...prev, [name]: name === 'dealValue' || name === 'assignedToId' ? Number(value) : value }));
    };

    const handleCustomFieldChange = (id: string, value: string | number) => {
        setLeadData(prev => ({ ...prev, customFields: { ...prev.customFields, [id]: value } }));
    };

    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
        setLeadData(prev => ({ ...prev, tags }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const mandatoryFields = customFieldDefs.filter(f => f.isRequired);
        const missingField = mandatoryFields.find(f => !leadData.customFields?.[f.id]);
        if (missingField) {
            alert(`Mandatory field "${missingField.name}" is missing.`);
            return;
        }
        if (!leadData.source) {
            alert(`Lead Source is a mandatory field.`);
            return;
        }

        onAddLead(leadData);
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-surface rounded-lg shadow-xl w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-muted">
                    <h2 className="text-2xl font-bold">Add New Lead</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Column 1 */}
                    <div className="space-y-4">
                         <input name="name" value={leadData.name} onChange={handleChange} placeholder="Full Name *" className="w-full bg-background border border-muted p-2 rounded" required/>
                         <input name="email" type="email" value={leadData.email} onChange={handleChange} placeholder="Email Address *" className="w-full bg-background border border-muted p-2 rounded" required/>
                         <input name="phone" value={leadData.phone} onChange={handleChange} placeholder="Phone Number" className="w-full bg-background border border-muted p-2 rounded"/>
                         <input name="alternatePhone" value={leadData.alternatePhone} onChange={handleChange} placeholder="Alternate Phone" className="w-full bg-background border border-muted p-2 rounded"/>
                         <input name="company" value={leadData.company} onChange={handleChange} placeholder="Company" className="w-full bg-background border border-muted p-2 rounded"/>
                         <input name="city" value={leadData.city} onChange={handleChange} placeholder="City" className="w-full bg-background border border-muted p-2 rounded"/>
                    </div>
                    {/* Column 2 */}
                    <div className="space-y-4">
                         <select name="source" value={leadData.source} onChange={handleChange} className="w-full bg-background border border-muted p-2 rounded" required>
                             <option value="" disabled>Select Lead Source *</option>
                             {LEAD_SOURCES.map(s => <option key={`source-${s}`} value={s}>{s}</option>)}
                         </select>
                         <select name="stage" value={leadData.stage} onChange={handleChange} className="w-full bg-background border border-muted p-2 rounded">
                            {pipelineStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                         </select>
                         <select name="assignedToId" value={leadData.assignedToId} onChange={handleChange} className="w-full bg-background border border-muted p-2 rounded">
                            {users.filter(u => u.role !== "Admin").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                         </select>
                        <input name="dealValue" type="number" value={leadData.dealValue} onChange={handleChange} placeholder="Deal Value" className="w-full bg-background border border-muted p-2 rounded"/>
                        <input name="course" value={leadData.course} onChange={handleChange} placeholder="Course Interested In" className="w-full bg-background border border-muted p-2 rounded"/>
                        <input name="tags" value={Array.isArray(leadData.tags) ? leadData.tags.join(', ') : ''} onChange={handleTagsChange} placeholder="Tags (comma-separated)" className="w-full bg-background border border-muted p-2 rounded"/>
                    </div>
                    {/* Column 3 */}
                    <div className="space-y-4">
                         <input name="campaign" value={leadData.campaign} onChange={handleChange} placeholder="Marketing Campaign" className="w-full bg-background border border-muted p-2 rounded"/>
                         <h4 className="text-sm font-semibold text-subtle pt-2">Facebook Details (Optional)</h4>
                         <input name="facebookCampaign" value={leadData.facebookCampaign} onChange={handleChange} placeholder="Facebook Campaign" className="w-full bg-background border border-muted p-2 rounded"/>
                         <input name="facebookAdset" value={leadData.facebookAdset} onChange={handleChange} placeholder="Facebook Adset" className="w-full bg-background border border-muted p-2 rounded"/>
                         <input name="facebookAd" value={leadData.facebookAd} onChange={handleChange} placeholder="Facebook Ad" className="w-full bg-background border border-muted p-2 rounded"/>
                    </div>
                    {/* Custom Fields */}
                    {customFieldDefs.length > 0 && <h3 className="md:col-span-3 text-lg font-semibold border-t border-muted pt-4 mt-2">Custom Information</h3>}
                    {customFieldDefs.map(def => (
                         <div key={def.id}>
                             <label className="text-sm text-subtle">{def.name}{def.isRequired && ' *'}</label>
                             <input 
                                name={def.id}
                                type={def.type === 'date' ? 'date' : def.type}
                                value={leadData.customFields?.[def.id] as string || ''}
                                onChange={e => handleCustomFieldChange(def.id, e.target.value)}
                                placeholder={def.name}
                                required={def.isRequired}
                                className="w-full bg-background border border-muted p-2 rounded mt-1"
                            />
                         </div>
                    ))}
                </div>
                 <div className="md:col-span-3 flex justify-end gap-3 mt-4 p-6 border-t border-muted">
                    <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Add Lead</button>
                </div>
            </form>
        </div>
    );
};

const CustomizeColumnsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    allColumns: { id: string; name: string }[];
    visibleColumns: string[];
    onSave: (newColumns: string[]) => void;
}> = ({ isOpen, onClose, allColumns, visibleColumns, onSave }) => {
    const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set(visibleColumns));

    const handleToggle = (columnId: string) => {
        const newSelection = new Set(selectedColumns);
        if (newSelection.has(columnId)) {
            newSelection.delete(columnId);
        } else {
            newSelection.add(columnId);
        }
        setSelectedColumns(newSelection);
    };

    const handleSave = () => {
        const orderedVisibleColumns = allColumns
            .filter(col => selectedColumns.has(col.id))
            .map(col => col.id);
        onSave(orderedVisibleColumns);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Customize Columns">
            <div className="space-y-4">
                <p className="text-sm text-subtle">Select the columns you want to display in the leads table.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {allColumns.map(col => (
                        <label key={col.id} className="flex items-center p-3 bg-background rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedColumns.has(col.id)}
                                onChange={() => handleToggle(col.id)}
                                className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-3 font-medium text-on-surface">{col.name}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-muted">
                <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button type="button" onClick={handleSave} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Apply Changes</button>
            </div>
        </Modal>
    );
};


interface LeadListPageProps {
    leads: Lead[]; 
    users: User[]; 
    pipelineStages: Stage[]; 
    customFieldDefs: CustomFieldDefinition[];
    tasks: Task[];
    whatsAppTemplates: WhatsAppTemplate[];
    smsTemplates: SMSTemplate[];
    addLead: (leadData: any) => void;
    deleteLead: (leadId: string) => void; 
    currentUser: User; 
    hasPermission: (p: Permission) => boolean;
    savedFilters: SavedFilter[];
    onSaveFilter: (filter: Omit<SavedFilter, 'id' | 'organizationId'>) => void; 
    onDeleteFilter: (id: string) => void;
    onBulkAssign: (leadIds: string[], assignToId: number) => void;
    onBulkDelete: (leadIds: string[]) => void;
    onUpdateLead: (lead: Lead, oldLead: Lead) => void;
    onUpdateTask: (task: Task) => void;
    onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'organizationId'>) => void;
    onScheduleMessage: (message: Omit<ScheduledMessage, 'id' | 'organizationId'>) => void;
    onImportLeads: (leads: Partial<Lead>[]) => void;
}

const SourceDisplay: React.FC<{ source: LeadSource }> = ({ source }) => {
    let icon: React.ReactNode = null;
    let color = 'text-subtle';
    if (source === LeadSource.FACEBOOK) {
        icon = <svg className="h-4 w-4 mr-1.5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.494v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.323-1.325z"/></svg>;
        color = 'text-on-surface';
    }
    // You could add more icons for other sources like Google Ads here
    return (
        <div className={`flex items-center text-sm ${color}`}>
            {icon}
            <span>{source}</span>
        </div>
    );
};

const LeadListPage: React.FC<LeadListPageProps> = ({
    leads, users, pipelineStages, customFieldDefs, tasks, whatsAppTemplates, smsTemplates,
    addLead, deleteLead, onUpdateLead, onUpdateTask, onAddTask, onScheduleMessage, onImportLeads,
    currentUser, hasPermission,
    savedFilters, onSaveFilter, onDeleteFilter, onBulkAssign, onBulkDelete
}) => {
    // Route prefetch for lead navigation - only if QueryClient is available
    const prefetchLead = useCallback(async (leadId: string) => {
        try {
            // Simple API prefetch without React Query - just warm the cache
            await apiService.getLeadById(leadId);
        } catch (error) {
            // Silently fail prefetch - it's not critical
            console.warn('Failed to prefetch lead data:', leadId, error);
        }
    }, []);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [isExportModalOpen, setExportModalOpen] = useState(false);
    const [isBulkEditModalOpen, setBulkEditModalOpen] = useState(false);
    const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [conditions, setConditions] = useState<FilterCondition[]>([]);

    // Pagination and Columns State
    const [recordsPerPage, setRecordsPerPage] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);
    const [isCustomizeModalOpen, setCustomizeModalOpen] = useState(false);
    const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
    const resizingColumnRef = useRef<{ id: string; startX: number; startWidth: number } | null>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
        try {
            const savedWidths = localStorage.getItem('leadColumnWidths');
            const defaults: Record<string, number> = { name: 250, stage: 150, assignedToId: 180, source: 150, actions: 80 };
            return savedWidths ? { ...defaults, ...JSON.parse(savedWidths) } : defaults;
        } catch {
            return { name: 250, stage: 150, assignedToId: 180, source: 150, actions: 80 };
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('leadColumnWidths', JSON.stringify(columnWidths));
        } catch (error) {
            console.error("Could not save column widths to localStorage", error);
        }
    }, [columnWidths]);

    const handleResizeMove = useCallback((e: MouseEvent) => {
        if (!resizingColumnRef.current) return;
        const { id, startX, startWidth } = resizingColumnRef.current;
        const newWidth = startWidth + (e.clientX - startX);
        if (newWidth > 60) { // Minimum width of 60px
            setColumnWidths(prev => ({ ...prev, [id]: newWidth }));
        }
    }, []);

    const handleResizeEnd = useCallback(() => {
        resizingColumnRef.current = null;
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    }, [handleResizeMove]);

    const handleResizeStart = (e: React.MouseEvent, columnId: string) => {
        e.preventDefault();
        e.stopPropagation();
        const th = (e.currentTarget as HTMLElement).parentElement;
        if (th) {
            resizingColumnRef.current = {
                id: columnId,
                startX: e.clientX,
                startWidth: th.offsetWidth
            };
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            window.addEventListener('mousemove', handleResizeMove);
            window.addEventListener('mouseup', handleResizeEnd);
        }
    };


    const allPossibleColumns = useMemo(() => [
        { id: 'name', name: 'Lead Name' },
        { id: 'email', name: 'Email' },
        { id: 'phone', name: 'Phone' },
        { id: 'stage', name: 'Stage' },
        { id: 'assignedToId', name: 'Assigned To' },
        { id: 'source', name: 'Source' },
        { id: 'campaign', name: 'Campaign' },
        { id: 'facebookCampaign', name: 'FB Campaign' },
        { id: 'facebookAdset', name: 'FB Adset' },
        { id: 'facebookAd', name: 'FB Ad' },
        { id: 'updatedAt', name: 'Last Activity' },
        { id: 'dealValue', name: 'Deal Value' },
        { id: 'score', name: 'Lead Score' },
        ...customFieldDefs.map(cf => ({ id: `customFields.${cf.id}`, name: cf.name }))
    ], [customFieldDefs]);

    const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
        try {
            const savedColumns = localStorage.getItem('visibleLeadColumns');
            return savedColumns ? JSON.parse(savedColumns) : ['name', 'stage', 'assignedToId', 'createdAt', 'source'];
        } catch {
            return ['name', 'stage', 'assignedToId', 'createdAt', 'source'];
        }
    });
    
    useEffect(() => {
        localStorage.setItem('visibleLeadColumns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);


    // Quick Filters State
    const [stageFilter, setStageFilter] = useState('all');
    const [ownerFilter, setOwnerFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [showQuickFilters, setShowQuickFilters] = useState(false);


    const getProperty = (obj: any, path: string): any => {
        if (path.startsWith('customFields.')) {
            const customFieldId = path.replace('customFields.', '');
            return obj.customFields?.[customFieldId];
        }
        return obj[path as keyof Lead];
    };

    const checkCondition = (lead: Lead, cond: FilterCondition): boolean => {
        const leadValue = getProperty(lead, cond.field);
        const filterValue = cond.value;

        if (leadValue === undefined || leadValue === null || filterValue === '') return false;
        
        const numericFields = ['score', 'dealValue', ...customFieldDefs.filter(f => f.type === 'number').map(f => `customFields.${f.id}`)];
        if (numericFields.includes(cond.field)) {
            const numLeadValue = Number(leadValue);
            const numFilterValue = Number(filterValue);
            if(isNaN(numLeadValue) || isNaN(numFilterValue)) return false;

            switch (cond.operator) {
                case 'equals': return numLeadValue === numFilterValue;
                case 'not_equals': return numLeadValue !== numFilterValue;
                case 'gt': return numLeadValue > numFilterValue;
                case 'gte': return numLeadValue >= numFilterValue;
                case 'lt': return numLeadValue < numFilterValue;
                case 'lte': return numLeadValue <= numFilterValue;
                default: return false;
            }
        }
        
        if (cond.field === 'tags' && Array.isArray(leadValue)) {
            const lowerCaseTags = leadValue.map(t => String(t).toLowerCase());
            const lowerCaseFilter = String(filterValue).toLowerCase();
            switch(cond.operator) {
                case 'contains': return lowerCaseTags.some(tag => tag.includes(lowerCaseFilter));
                case 'equals': return lowerCaseTags.includes(lowerCaseFilter);
                case 'not_equals': return !lowerCaseTags.includes(lowerCaseFilter);
                default: return false; 
            }
        }

        const strLeadValue = String(leadValue).toLowerCase();
        const strFilterValue = String(filterValue).toLowerCase();

        switch (cond.operator) {
            case 'contains': return strLeadValue.includes(strFilterValue);
            case 'equals': return strLeadValue === strFilterValue;
            case 'not_equals': return strLeadValue !== strFilterValue;
            default: return false;
        }
    };
    
    const evaluateAdvancedFilters = (lead: Lead): boolean => {
        if (conditions.length === 0) return true;
        
        let result = checkCondition(lead, conditions[0]);
        for (let i = 1; i < conditions.length; i++) {
            const conditionResult = checkCondition(lead, conditions[i]);
            if (conditions[i].logic === 'AND') {
                result = result && conditionResult;
            } else { // OR
                result = result || conditionResult;
            }
        }
        return result;
    };


    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            const quickStageMatch = stageFilter === 'all' || lead.stage === stageFilter;
            const quickOwnerMatch = ownerFilter === 'all' || lead.assignedToId === parseInt(ownerFilter);
            const quickSourceMatch = sourceFilter === 'all' || lead.source === sourceFilter;

            if (!quickStageMatch || !quickOwnerMatch || !quickSourceMatch) {
                return false;
            }
            
            return evaluateAdvancedFilters(lead);
        });
    }, [leads, conditions, stageFilter, ownerFilter, sourceFilter]);
    
    // Pagination Logic
    const totalRecords = filteredLeads.length;
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;

    const currentLeads = useMemo(() => {
        if (isMobile) {
            return filteredLeads;
        }
        return filteredLeads.slice(indexOfFirstRecord, indexOfLastRecord);
    }, [filteredLeads, currentPage, recordsPerPage, isMobile, indexOfFirstRecord, indexOfLastRecord]);
    
    const handleDragStart = (e: React.DragEvent<HTMLTableCellElement>, columnId: string) => {
        setDraggedColumn(columnId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', columnId); // Required for Firefox
    };

    const handleDragOver = (e: React.DragEvent<HTMLTableCellElement>) => {
        e.preventDefault();
    };

    const handleDragEnter = (e: React.DragEvent<HTMLTableCellElement>, columnId: string) => {
        e.preventDefault();
        if (columnId !== draggedColumn) {
            setDragOverColumn(columnId);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLTableCellElement>, targetColumnId: string) => {
        e.preventDefault();
        if (!draggedColumn || draggedColumn === targetColumnId) {
            setDraggedColumn(null);
            setDragOverColumn(null);
            return;
        }

        const fromIndex = visibleColumns.indexOf(draggedColumn);
        const toIndex = visibleColumns.indexOf(targetColumnId);

        if (fromIndex !== -1 && toIndex !== -1) {
            const newVisibleColumns = [...visibleColumns];
            const [movedColumn] = newVisibleColumns.splice(fromIndex, 1);
            newVisibleColumns.splice(toIndex, 0, movedColumn);
            setVisibleColumns(newVisibleColumns);
        }
        setDraggedColumn(null);
        setDragOverColumn(null);
    };

    const handleDragEnd = () => {
        setDraggedColumn(null);
        setDragOverColumn(null);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [filteredLeads.length, recordsPerPage]);

    useEffect(() => {
        setSelectedLeadIds([]);
    }, [conditions, stageFilter, ownerFilter, sourceFilter, currentPage, recordsPerPage]);

    const headerCheckboxRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (headerCheckboxRef.current) {
            const selectedCount = selectedLeadIds.length;
            const pageRecordsCount = currentLeads.length;
            headerCheckboxRef.current.checked = selectedCount > 0 && selectedCount === pageRecordsCount;
            headerCheckboxRef.current.indeterminate = selectedCount > 0 && selectedCount < pageRecordsCount;
        }
    }, [selectedLeadIds, currentLeads]);

    const handleSelectOne = (leadId: string) => {
        setSelectedLeadIds(prev =>
            prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
        );
    };

    const handleSelectAllOnPage = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedLeadIds(currentLeads.map(l => l.id));
        } else {
            setSelectedLeadIds([]);
        }
    };
    
    const handleBulkDelete = () => {
        onBulkDelete(selectedLeadIds);
        setSelectedLeadIds([]);
    };

    const handleBulkAssign = (userId: number) => {
        onBulkAssign(selectedLeadIds, userId);
        setIsAssignModalOpen(false);
        setSelectedLeadIds([]);
    }

    const handleBulkUpdate = async (updates: any) => {
        try {
            await apiService.bulkUpdateLeads(selectedLeadIds, updates);
            // Refresh leads data
            window.location.reload();
        } catch (error) {
            console.error('Bulk update error:', error);
            alert('Failed to update leads. Please try again.');
        }
    };


    const handleSaveFilter = (name: string) => {
        onSaveFilter({ name, conditions, logic: 'AND' });
    };

    const loadFilter = (filterId: string) => {
        if (filterId === 'none') {
            setConditions([]);
            return;
        }
        const filter = savedFilters.find(f => f.id === filterId);
        if (filter) {
            setConditions(filter.conditions);
        }
    };

    const renderCellContent = (lead: Lead, columnId: string) => {
        const owner = users.find(u => u.id === lead.assignedToId);
        const stage = pipelineStages.find(s => s.id === lead.stage);

        if (columnId.startsWith('customFields.')) {
            const customFieldId = columnId.replace('customFields.', '');
            const value = lead.customFields?.[customFieldId];
            const def = customFieldDefs.find(d => d.id === customFieldId);
            if (def?.type === 'date' && typeof value === 'string') {
                return new Date(value + 'T00:00:00').toLocaleDateString();
            }
            return value || 'N/A';
        }

        switch (columnId) {
            case 'name':
                return (
                    <Link
                        to={`/leads/${lead.id}`}
                        className="font-semibold text-on-surface hover:text-primary-500"
                        onMouseEnter={() => prefetchLead(lead.id)}
                        title={`Click to view ${lead.name} details`}
                    >
                        {lead.name}
                    </Link>
                );
            case 'email':
                return lead.email;
            case 'phone':
                return lead.phone;
            case 'stage':
                return (
                    <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full" style={{backgroundColor: `${stage?.color}20`, color: stage?.color}}>
                        {stage?.name || 'N/A'}
                    </span>
                );
            case 'assignedToId': return owner?.name || 'Unassigned';
            case 'createdAt': return new Date(lead.createdAt).toLocaleDateString();
            case 'updatedAt': return new Date(lead.updatedAt).toLocaleDateString();
            case 'source': return <SourceDisplay source={lead.source} />;
            case 'campaign': return lead.campaign || 'N/A';
            case 'facebookCampaign': return lead.facebookCampaign || 'N/A';
            case 'facebookAdset': return lead.facebookAdset || 'N/A';
            case 'facebookAd': return lead.facebookAd || 'N/A';
            case 'dealValue': return `$${lead.dealValue.toLocaleString()}`;
            case 'score': return <span className="font-semibold">{lead.score}</span>;
            default: return 'N/A';
        }
    };

    const handleExportLeads = (scope: 'selected' | 'filtered' | 'all', fields: string[]) => {
        let leadsToExport: Lead[];
        if (scope === 'selected') {
            leadsToExport = leads.filter(l => selectedLeadIds.includes(l.id));
        } else if (scope === 'filtered') {
            leadsToExport = filteredLeads;
        } else {
            leadsToExport = leads;
        }

        const headers = fields.map(fieldId => allPossibleColumns.find(c => c.id === fieldId)?.name || fieldId);

        const getCellData = (lead: Lead, columnId: string): string => {
            const owner = users.find(u => u.id === lead.assignedToId);
            const stage = pipelineStages.find(s => s.id === lead.stage);

            let value: any;

            if (columnId.startsWith('customFields.')) {
                const customFieldId = columnId.replace('customFields.', '');
                value = lead.customFields?.[customFieldId];
            } else {
                switch (columnId) {
                    case 'stage': value = stage?.name; break;
                    case 'assignedToId': value = owner?.name; break;
                    default: value = (lead as any)[columnId];
                }
            }
            return value === null || value === undefined ? '' : String(value);
        };
        
        const escapeCsvCell = (cellData: string): string => {
            if (cellData.includes(',') || cellData.includes('\n') || cellData.includes('"')) {
                return `"${cellData.replace(/"/g, '""')}"`;
            }
            return cellData;
        };

        const csvRows = [
            headers.map(escapeCsvCell).join(','),
            ...leadsToExport.map(lead =>
                fields.map(fieldId =>
                    escapeCsvCell(getCellData(lead, fieldId))
                ).join(',')
            )
        ];

        const csvContent = csvRows.join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'Clienn CRM_leads_export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setExportModalOpen(false);
    };

    const filterHeader = (
        <div className="flex items-center gap-2">
            <select onChange={(e) => loadFilter(e.target.value)} className="bg-background border border-muted rounded-lg p-2 text-sm">
                <option value="none">Load Saved View</option>
                {savedFilters.map(f => <option key={`filter-${f.id}`} value={f.id}>{f.name}</option>)}
            </select>
            <button onClick={() => {
                const name = prompt('Enter a name for this filter view:');
                if (name) handleSaveFilter(name);
            }} className="text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-semibold py-2 px-3 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900">Save View</button>
        </div>
    );

    return (
        <div className="flex flex-col h-full space-y-6">
            {isAddModalOpen && <AddLeadModal users={users} pipelineStages={pipelineStages} customFieldDefs={customFieldDefs} onClose={() => setAddModalOpen(false)} onAddLead={addLead} />}
            {isImportModalOpen && <ImportLeadsModal customFieldDefs={customFieldDefs} users={users} onClose={() => setImportModalOpen(false)} onImport={onImportLeads} currentOrganization={{ id: 'org-1' }} existingLeads={leads} />}
            {isExportModalOpen && <ExportLeadsModal isOpen={isExportModalOpen} onClose={() => setExportModalOpen(false)} onExport={handleExportLeads} allLeadsCount={leads.length} filteredLeadsCount={filteredLeads.length} selectedLeadsCount={selectedLeadIds.length} allColumns={allPossibleColumns} />}
            {isAssignModalOpen && hasPermission(Permission.ASSIGN_LEADS) && (
                <AssignUserModal
                    users={users.filter(u => u.role === UserRole.SALES_REP || u.role === UserRole.MANAGER)}
                    onClose={() => setIsAssignModalOpen(false)}
                    onAssign={handleBulkAssign}
                />
            )}
            {isCustomizeModalOpen && (
                <CustomizeColumnsModal
                    isOpen={isCustomizeModalOpen}
                    onClose={() => setCustomizeModalOpen(false)}
                    allColumns={allPossibleColumns}
                    visibleColumns={visibleColumns}
                    onSave={setVisibleColumns}
                />
            )}
            {isBulkEditModalOpen && (
                <BulkEditModal
                    isOpen={isBulkEditModalOpen}
                    onClose={() => setBulkEditModalOpen(false)}
                    selectedLeads={selectedLeadIds.map(id => leads.find(l => l.id === id)).filter((lead): lead is Lead => lead !== undefined)}
                    users={users}
                    pipelineStages={pipelineStages}
                    customFieldDefs={customFieldDefs}
                    onBulkUpdate={handleBulkUpdate}
                    onBulkDelete={handleBulkDelete}
                />
            )}

            <div className="flex flex-wrap gap-4 justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-on-surface">Leads</h1>
                    <p className="text-subtle mt-1">All your potential customers in one place.</p>
                </div>
                <div className="flex items-center gap-2">
                     <button onClick={() => setCustomizeModalOpen(true)} className="bg-surface hover:bg-muted text-on-surface font-semibold py-2 px-4 rounded-lg flex items-center border border-muted">
                        <AppIcons.Columns className="w-5 h-5 mr-2" /> Columns
                    </button>
                     <button onClick={() => setImportModalOpen(true)} className="bg-surface hover:bg-muted text-on-surface font-semibold py-2 px-4 rounded-lg flex items-center border border-muted">
                        <AppIcons.Import className="w-5 h-5 mr-2" /> Import
                    </button>
                    <button onClick={() => setExportModalOpen(true)} className="bg-surface hover:bg-muted text-on-surface font-semibold py-2 px-4 rounded-lg flex items-center border border-muted">
                        <AppIcons.Export className="w-5 h-5 mr-2" /> Export
                    </button>
                    <button onClick={() => setAddModalOpen(true)} className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center">
                        <AppIcons.Add className="w-5 h-5 mr-2" /> Add Lead
                    </button>
                </div>
            </div>

            {/* Quick Filters */}
            <div className="bg-surface p-4 rounded-xl border border-muted shadow-sm">
                 <button onClick={() => setShowQuickFilters(!showQuickFilters)} className="md:hidden w-full flex justify-between items-center font-semibold mb-2">
                    <span>Quick Filters</span>
                    <AppIcons.ChevronRight className={`h-5 w-5 text-subtle transition-transform ${showQuickFilters ? 'rotate-90' : ''}`} />
                </button>
                <div className={`grid-cols-1 md:grid-cols-4 gap-4 ${showQuickFilters ? 'grid' : 'hidden'} md:grid`}>
                    <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="bg-background border border-muted p-2 rounded-lg text-sm w-full focus:ring-2 focus:ring-primary-500 focus:outline-none">
                        <option value="all">All Stages</option>
                        {pipelineStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)} className="bg-background border border-muted p-2 rounded-lg text-sm w-full focus:ring-2 focus:ring-primary-500 focus:outline-none">
                        <option value="all">All Owners</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="bg-background border border-muted p-2 rounded-lg text-sm w-full focus:ring-2 focus:ring-primary-500 focus:outline-none">
                        <option value="all">All Sources</option>
                        {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className="flex items-center justify-center gap-2 bg-background border border-muted py-2 px-4 rounded-lg hover:bg-muted focus:ring-2 focus:ring-primary-500 focus:outline-none">
                        <AppIcons.Filter className="w-5 h-5 text-subtle" />
                        <span className="font-semibold text-sm">Advanced Filter</span>
                        {conditions.length > 0 && <span className="bg-primary-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{conditions.length}</span>}
                    </button>
                </div>
            </div>


            {showAdvancedFilters && <FilterBuilder 
                conditions={conditions} 
                onConditionsChange={setConditions}
                users={users}
                pipelineStages={pipelineStages}
                customFieldDefs={customFieldDefs}
                headerContent={filterHeader}
            />}

            {selectedLeadIds.length > 0 && (
                 <div className="bg-primary-900/80 border border-primary-700/50 p-3 rounded-lg flex justify-between items-center animate-fade-in">
                     <span className="text-sm font-medium text-white">{selectedLeadIds.length} lead(s) selected</span>
                     <div className="flex items-center gap-2">
                         <button onClick={() => setBulkEditModalOpen(true)} className="bg-green-500 hover:bg-green-400 text-white text-xs font-bold py-1.5 px-3 rounded-md">Bulk Edit</button>
                         {hasPermission(Permission.ASSIGN_LEADS) && <button onClick={() => setIsAssignModalOpen(true)} className="bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold py-1.5 px-3 rounded-md">Assign</button>}
                         {hasPermission(Permission.DELETE_LEADS) && <button onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-400 text-white text-xs font-bold py-1.5 px-3 rounded-md">Delete</button>}
                     </div>
                  </div>
             )}
            
            <div className="flex-grow overflow-hidden bg-surface rounded-xl shadow-sm border border-muted flex flex-col">
                <div className="flex-grow overflow-auto">
                    <table className="min-w-full divide-y divide-muted" style={{ tableLayout: 'fixed' }}>
                        <thead className="bg-surface">
                            <tr>
                                <th scope="col" className="px-6 py-3 sticky top-0 bg-surface z-10 border-b border-muted" style={{ width: '48px' }}>
                                     <input 
                                        type="checkbox"
                                        ref={headerCheckboxRef}
                                        onChange={handleSelectAllOnPage}
                                        className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-subtle/50 bg-background"
                                    />
                                </th>
                                <th 
                                    scope="col" 
                                    className="group relative px-6 py-3 text-left text-xs font-semibold text-subtle uppercase tracking-wider sticky top-0 bg-surface z-10 border-b border-muted"
                                    style={{ width: columnWidths['actions'] ? `${columnWidths['actions']}px` : 'auto' }}
                                >
                                    Actions
                                    <div
                                        onMouseDown={e => handleResizeStart(e, 'actions')}
                                        className="absolute top-0 right-0 h-full w-2.5 cursor-col-resize z-20 flex items-center justify-end"
                                    >
                                        <div className="w-px h-4 bg-muted/70 group-hover:bg-primary-400 transition-colors"></div>
                                    </div>
                                </th>
                                {visibleColumns.map(colId => {
                                    const colDef = allPossibleColumns.find(c => c.id === colId);
                                    const isDragging = draggedColumn === colId;
                                    const isDragOver = dragOverColumn === colId;
                                    return (
                                        <th 
                                            key={colId} 
                                            scope="col" 
                                            className={`group relative px-6 py-3 text-left text-xs font-semibold text-subtle uppercase tracking-wider sticky top-0 bg-surface z-10 border-b border-muted cursor-move transition-opacity ${isDragging ? 'opacity-50' : ''}`}
                                            style={{ width: columnWidths[colId] ? `${columnWidths[colId]}px` : 'auto' }}
                                            draggable="true"
                                            onDragStart={(e) => handleDragStart(e, colId)}
                                            onDragOver={handleDragOver}
                                            onDragEnter={(e) => handleDragEnter(e, colId)}
                                            onDrop={(e) => handleDrop(e, colId)}
                                            onDragEnd={handleDragEnd}
                                        >
                                            {colDef?.name || colId}
                                            {isDragOver && draggedColumn !== colId && (
                                                <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary-500"></div>
                                            )}
                                            <div
                                                onMouseDown={e => handleResizeStart(e, colId)}
                                                className="absolute top-0 right-0 h-full w-2.5 cursor-col-resize z-20 flex items-center justify-end"
                                            >
                                                <div className="w-px h-4 bg-muted/70 group-hover:bg-primary-400 transition-colors"></div>
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted">
                            {currentLeads.map(lead => (
                                <tr key={lead.id} className="hover:bg-muted/50 transition-colors duration-150">
                                    <td data-label="Select" className="px-6 py-4">
                                        <input 
                                            type="checkbox"
                                            checked={selectedLeadIds.includes(lead.id)}
                                            onChange={() => handleSelectOne(lead.id)}
                                            className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-subtle/50 bg-background"
                                        />
                                    </td>
                                    <td data-label="Actions" className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Link to={`/leads/${lead.id}`} className="text-subtle hover:text-primary-500 p-1 rounded-full hover:bg-muted" title="View Lead Details">
                                            <AppIcons.Eye className="h-5 w-5"/>
                                        </Link>
                                    </td>
                                    {visibleColumns.map(colId => {
                                         const colDef = allPossibleColumns.find(c => c.id === colId);
                                        return (
                                            <td key={colId} data-label={colDef?.name || colId} className="px-6 py-4 whitespace-nowrap text-sm text-on-surface overflow-hidden text-ellipsis">
                                                <div className="overflow-hidden text-ellipsis">
                                                    {renderCellContent(lead, colId)}
                                                </div>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex-shrink-0 hidden md:flex items-center justify-between p-4 border-t border-muted">
                    <div className="flex items-center gap-2 text-sm">
                        <select value={recordsPerPage} onChange={(e) => setRecordsPerPage(Number(e.target.value))} className="bg-background border border-muted p-1 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none">
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span className="text-subtle">Records per page</span>
                    </div>
                    <span className="text-sm text-subtle">
                        Showing {totalRecords > 0 ? indexOfFirstRecord + 1 : 0} - {Math.min(indexOfLastRecord, totalRecords)} of {totalRecords}
                    </span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted font-semibold text-sm">Previous</button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted font-semibold text-sm">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadListPage;


