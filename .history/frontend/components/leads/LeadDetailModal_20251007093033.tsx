import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Lead, User, Activity, Stage, Task, CustomFieldDefinition, WhatsAppTemplate, ScheduledMessage, SMSTemplate } from '../../types';
import { AppIcons } from '../ui/Icons';
import Modal from '../ui/Modal';
import ScheduleMessageModal from './ScheduleMessageModal';
import LogCallModal from './LogCallModal';
import SMSModal from './SMSModal';
import { faker } from '@faker-js/faker';
import { apiService } from '../../src/services/api';

const WhatsAppModal: React.FC<{
    lead: Lead;
    templates: WhatsAppTemplate[];
    currentUser: User;
    onClose: () => void;
    onSend: (message: string) => void;
}> = ({ lead, templates, currentUser, onClose, onSend }) => {
    const [activeTab, setActiveTab] = useState<'template' | 'custom'>('template');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
    const [customMessage, setCustomMessage] = useState('');

    const getMessagePreview = () => {
        if (activeTab === 'custom') return customMessage;
        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template) return '';
        return template.body
            .replace(/{{name}}/g, lead.name)
            .replace(/{{user_name}}/g, currentUser.name)
            .replace(/{{course}}/g, lead.course || 'the course')
            .replace(/{{dealValue}}/g, lead.dealValue.toLocaleString());
    };

    const handleSend = () => {
        const message = getMessagePreview();
        if (!message.trim()) {
            alert('Message cannot be empty.');
            return;
        }
        console.log(`Simulating sending WhatsApp to ${lead.phone}: "${message}"`);
        onSend(message);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Send WhatsApp to ${lead.name}`}>
            <div className="flex border-b border-muted mb-4">
                <button onClick={() => setActiveTab('template')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'template' ? 'border-b-2 border-primary-500 text-on-surface' : 'text-subtle'}`}>Use Template</button>
                <button onClick={() => setActiveTab('custom')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'custom' ? 'border-b-2 border-primary-500 text-on-surface' : 'text-subtle'}`}>Custom Message</button>
            </div>

            {activeTab === 'template' ? (
                <div>
                    <label className="text-sm font-medium text-subtle">Select Template</label>
                    <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="w-full mt-1 bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500">
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
            ) : (
                 <div>
                    <label className="text-sm font-medium text-subtle">Write a custom message</label>
                    <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)} rows={5} className="w-full mt-1 bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
            )}

            <div className="mt-4 p-4 bg-background rounded-lg border border-muted">
                <h4 className="text-sm font-semibold text-subtle mb-2">Message Preview:</h4>
                <p className="text-sm text-on-surface whitespace-pre-wrap">{getMessagePreview()}</p>
            </div>
             <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-muted">
                <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button type="button" onClick={handleSend} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                    <AppIcons.Whatsapp className="h-5 w-5 mr-2" /> Send Message
                </button>
            </div>
        </Modal>
    );
}

// FIX: Renamed interface to match component and added onClose prop.
interface LeadDetailModalProps {
    lead: Lead;
    users: User[];
    tasks: Task[];
    pipelineStages: Stage[];
    customFieldDefs: CustomFieldDefinition[];
    whatsAppTemplates: WhatsAppTemplate[];
    smsTemplates: SMSTemplate[];
    onUpdateLead: (lead: Lead, oldLead: Lead) => void;
    onUpdateTask: (task: Task) => void;
// FIX: Corrected onAddTask prop type to be more precise and avoid potential errors.
    onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'organizationId' | '_id'>) => void;
    onScheduleMessage: (message: Omit<ScheduledMessage, 'id' | 'organizationId'>) => void;
    currentUser: User;
    onClose: () => void;
}

const ActivityItem: React.FC<{ activity: Activity; author?: User; isFirst: boolean }> = ({ activity, author, isFirst }) => {
    const getIcon = () => {
        const iconProps = { className: "h-5 w-5" };
        switch (activity.type) {
            case 'EMAIL': return <AppIcons.Email {...iconProps} />;
            case 'WHATSAPP': return <AppIcons.Whatsapp {...iconProps} />;
            case 'SMS': return <AppIcons.SMS {...iconProps} />;
            case 'CALL': return <AppIcons.Call {...iconProps} />;
            case 'NOTE': return <AppIcons.Note {...iconProps} />;
            case 'TASK_CREATED': return <AppIcons.Tasks {...iconProps} />;
            case 'TASK_COMPLETED': return <AppIcons.Tasks {...iconProps} />;
            case 'LEAD_CREATED': return <AppIcons.Add {...iconProps} />;
            case 'MESSAGE_SCHEDULED': return <AppIcons.Activity {...iconProps} />;
            case 'FIELD_UPDATE':
            case 'STATUS_CHANGE': return <AppIcons.StatusChange {...iconProps} />;
            default: return <div className="text-gray-400">🔄</div>;
        }
    };

    const iconColors: Record<Activity['type'], string> = {
        EMAIL: 'text-blue-500 bg-blue-100 dark:bg-blue-900/50',
        WHATSAPP: 'text-green-500 bg-green-100 dark:bg-green-900/50',
        SMS: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/50',
        CALL: 'text-purple-500 bg-purple-100 dark:bg-purple-900/50',
        NOTE: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/50',
        TASK_CREATED: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-900/50',
        TASK_COMPLETED: 'text-green-600 bg-green-100 dark:bg-green-900/50',
        LEAD_CREATED: 'text-blue-500 bg-blue-100 dark:bg-blue-900/50',
        MESSAGE_SCHEDULED: 'text-orange-500 bg-orange-100 dark:bg-orange-900/50',
        FIELD_UPDATE: 'text-subtle bg-muted',
        STATUS_CHANGE: 'text-subtle bg-muted',
    };
    
    return (
        <div className="flex items-start space-x-4 relative">
             <div className={`absolute left-5 top-12 bottom-0 w-0.5 ${isFirst ? 'bg-transparent' : 'bg-muted'}`}></div>
             <div className={`z-10 flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full ${iconColors[activity.type]}`}>
                {getIcon()}
            </div>
            <div className="flex-grow pt-1.5">
                <p className="text-sm text-on-surface" dangerouslySetInnerHTML={{ __html: activity.content }} />
                <p className="text-xs text-subtle mt-1">
                    {author?.name} &middot; {new Date(activity.timestamp).toLocaleString()}
                </p>
            </div>
        </div>
    );
};

const AddTaskForm: React.FC<{ lead: Lead; onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'organizationId' | '_id'>) => void; onCancel: () => void; currentUser: User; }> = ({ lead, onAddTask, onCancel, currentUser }) => {
    const [title, setTitle] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        
        const newTask = {
            title,
            leadId: lead.id,
            assignedToId: lead.assignedToId,
            isCompleted: false,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdById: currentUser.id,
        };
        onAddTask(newTask);
        setTitle('');
        onCancel();
    };

    return (
        <form onSubmit={handleSubmit} className="p-2 space-y-2">
            <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                autoFocus
                className="w-full bg-background border border-muted p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
             <div className="flex justify-end gap-2">
                 <button type="button" onClick={onCancel} className="bg-muted hover:bg-subtle/20 text-on-surface font-semibold py-1.5 px-3 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-1.5 px-3 rounded-lg text-sm">Add Task</button>
            </div>
        </form>
    );
};

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; initiallyOpen?: boolean }> = ({ title, children, initiallyOpen = false }) => {
    const [isOpen, setIsOpen] = useState(initiallyOpen);
    return (
        <div className="border-t border-muted first-of-type:border-t-0">
            <button onClick={() => setIsOpen(!isOpen)} className="md:cursor-default md:pointer-events-none w-full flex justify-between items-center py-3 text-left">
                <h4 className="font-semibold text-on-surface">{title}</h4>
                <AppIcons.ChevronRight className={`md:hidden h-5 w-5 text-subtle transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            <div className={`pl-2 pb-4 space-y-4 md:block ${isOpen ? 'block' : 'hidden'}`}>
                {children}
            </div>
        </div>
    );
};

// FIX: Renamed component from LeadDetailPage to LeadDetailModal
const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, users, tasks, pipelineStages, customFieldDefs, whatsAppTemplates, smsTemplates, onUpdateLead, onUpdateTask, onAddTask, onScheduleMessage, currentUser, onClose }) => {
    const [activeTab, setActiveTab] = useState<'activity' | 'tasks' | 'scheduled'>('activity');
    const [editableLead, setEditableLead] = useState<Lead>(lead);
    const [isWhatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
    const [isSmsModalOpen, setSmsModalOpen] = useState(false);
    const [isLogCallModalOpen, setLogCallModalOpen] = useState(false);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [scheduleModal, setScheduleModal] = useState<{ open: boolean, type: 'EMAIL' | 'WHATSAPP' | 'SMS' | null }>({ open: false, type: null });
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    const originalLead = useMemo(() => lead, [lead]);
    const leadTasks = useMemo(() => tasks.filter(t => t.leadId === lead.id), [tasks, lead.id]);
    const [changeLog, setChangeLog] = useState<string[]>([]);

    useEffect(() => {
        setEditableLead(lead);
        setHasUnsavedChanges(false);
        setChangeLog([]);
    }, [lead]);

    const handleFieldChange = (field: keyof Lead, value: any) => {
        const oldValue = originalLead[field];
        const newValue = value;

        // Only track changes if values are actually different
        if (oldValue !== newValue) {
            setEditableLead(prev => ({ ...prev, [field]: value }));
            setHasUnsavedChanges(true);

            // Create change description
            let changeDescription = '';
            if (field === 'assignedToId') {
                const oldUser = users.find(u => u.id === oldValue);
                const newUser = users.find(u => u.id === newValue);
                changeDescription = `Owner changed from "${oldUser?.name || 'Unassigned'}" to "${newUser?.name || 'Unassigned'}"`;
            } else if (field === 'stage') {
                const oldStage = pipelineStages.find(s => s.id === oldValue);
                const newStage = pipelineStages.find(s => s.id === newValue);
                changeDescription = `Pipeline stage changed from "${oldStage?.name || 'Unknown'}" to "${newStage?.name || 'Unknown'}"`;
            } else if (field === 'dealValue') {
                changeDescription = `Deal value changed from "${oldValue}" to "${newValue}"`;
            } else {
                changeDescription = `${field} changed from "${oldValue}" to "${newValue}"`;
            }

            setChangeLog(prev => [...prev, changeDescription]);
        }
    };

    const handleCustomFieldChange = (id: string, value: any) => {
        const customFieldDef = customFieldDefs.find(def => def.id === id);
        const oldValue = originalLead.customFields?.[id] || '';

        if (oldValue !== value) {
            setEditableLead(prev => ({
                ...prev,
                customFields: { ...(prev.customFields || {}), [id]: value }
            }));
            setHasUnsavedChanges(true);

            const changeDescription = `Custom field "${customFieldDef?.name || id}" changed from "${oldValue}" to "${value}"`;
            setChangeLog(prev => [...prev, changeDescription]);
        }
    };
    
    const handleSendWhatsApp = (message: string) => {
         const newActivity: Activity = { id: faker.string.uuid(), type: 'WHATSAPP', content: `Sent WhatsApp: <i class="whitespace-pre-wrap">"${message}"</i>`, timestamp: new Date().toISOString(), authorId: currentUser.id };
        // FIX: Replaced potentially unsafe spread operator with .concat() for updating activities array.
        const updatedLead = { ...editableLead, activities: [newActivity].concat(editableLead.activities || []) };
        setEditableLead(updatedLead);
        onUpdateLead(updatedLead, originalLead);
        setWhatsAppModalOpen(false);
    };

    const handleSendSMS = (message: string) => {
        const newActivity: Activity = { id: faker.string.uuid(), type: 'SMS', content: `Sent SMS: <i class="whitespace-pre-wrap">"${message}"</i>`, timestamp: new Date().toISOString(), authorId: currentUser.id };
       // FIX: Replaced potentially unsafe spread operator with .concat() for updating activities array.
       const updatedLead = { ...editableLead, activities: [newActivity].concat(editableLead.activities || []) };
       setEditableLead(updatedLead);
       onUpdateLead(updatedLead, originalLead);
       setSmsModalOpen(false);
   };

   const handleLogCall = (outcome: string, notes: string) => {
       const content = `Logged call. Outcome: <strong>${outcome}</strong>. Notes: <i class="whitespace-pre-wrap">"${notes}"</i>`;
       const newActivity: Activity = { id: faker.string.uuid(), type: 'CALL', content, timestamp: new Date().toISOString(), authorId: currentUser.id };
       // FIX: Replaced potentially unsafe spread operator with .concat() for updating activities array.
       const updatedLead = { ...editableLead, activities: [newActivity].concat(editableLead.activities || []) };
       setEditableLead(updatedLead);
       onUpdateLead(updatedLead, originalLead);
       setLogCallModalOpen(false);
   };

   const handleAddNote = (noteContent: string) => {
       const content = `Note: <i class="whitespace-pre-wrap">"${noteContent}"</i>`;
       const newActivity: Activity = { id: faker.string.uuid(), type: 'NOTE', content, timestamp: new Date().toISOString(), authorId: currentUser.id };
       const updatedLead = { ...editableLead, activities: [newActivity].concat(editableLead.activities || []) };
       setEditableLead(updatedLead);
       onUpdateLead(updatedLead, originalLead);
       setIsAddingNote(false);
   };
    
    const handleSave = async () => {
        if (!hasUnsavedChanges) {
            onClose();
            return;
        }

        setIsSaving(true);
        try {
            // Prepare the data to send to backend - ensure required fields are included
            const leadDataToSend = {
                name: editableLead.name,
                email: editableLead.email,
                phone: editableLead.phone,
                alternatePhone: editableLead.alternatePhone,
                city: editableLead.city,
                course: editableLead.course,
                company: editableLead.company,
                source: editableLead.source,
                stage: editableLead.stage,
                followUpStatus: editableLead.followUpStatus,
                score: editableLead.score,
                tags: editableLead.tags,
                assignedToId: editableLead.assignedToId,
                dealValue: editableLead.dealValue,
                closeDate: editableLead.closeDate,
                activities: editableLead.activities || [],
                scheduledMessages: editableLead.scheduledMessages || [],
                campaign: editableLead.campaign,
                facebookCampaign: editableLead.facebookCampaign,
                facebookAdset: editableLead.facebookAdset,
                facebookAd: editableLead.facebookAd,
                customFields: editableLead.customFields,
                organizationId: editableLead.organizationId
            };

            // Update lead in backend
            const updatedLead = await apiService.updateLead(editableLead.id, leadDataToSend);

            // Create activity log for changes if there are changes
            if (changeLog.length > 0) {
                const activityContent = `Lead updated: ${changeLog.join(', ')}`;
                const newActivity: Activity = {
                    id: faker.string.uuid(),
                    type: 'FIELD_UPDATE',
                    content: activityContent,
                    timestamp: new Date().toISOString(),
                    authorId: currentUser.id
                };

                const updatedLeadWithActivity = {
                    ...updatedLead,
                    activities: [newActivity, ...(updatedLead.activities || [])]
                };

                // Update with activity in local state
                onUpdateLead(updatedLeadWithActivity, originalLead);
            } else {
                onUpdateLead(updatedLead, originalLead);
            }

            setHasUnsavedChanges(false);
            setChangeLog([]);
            setShowSaveSuccess(true);

            // Hide success message after 2 seconds
            setTimeout(() => {
                setShowSaveSuccess(false);
                onClose();
            }, 2000);

        } catch (error) {
            console.error('Error saving lead:', error);

            // Handle authentication errors specifically
            if (error.message && (error.message.includes('401') || error.message.includes('invalid signature'))) {
                alert('Your session has expired or is invalid. Please refresh the page and log in again.');
                // Clear all stored authentication data
                localStorage.removeItem('token');
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');

                // Force page reload to login page
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                alert(`Failed to save changes: ${error.message || 'Unknown error'}`);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        if (hasUnsavedChanges) {
            if (window.confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
                onClose();
            }
        } else {
            onClose();
        }
    };
    
    return (
        <Modal isOpen={true} onClose={handleClose} title="">
            {isWhatsAppModalOpen && <WhatsAppModal lead={editableLead} templates={whatsAppTemplates} currentUser={currentUser} onClose={() => setWhatsAppModalOpen(false)} onSend={handleSendWhatsApp} />}
            {isSmsModalOpen && <SMSModal lead={editableLead} templates={smsTemplates} currentUser={currentUser} onClose={() => setSmsModalOpen(false)} onSend={handleSendSMS} />}
            {isLogCallModalOpen && <LogCallModal onClose={() => setLogCallModalOpen(false)} onLog={handleLogCall} />}
            {scheduleModal.open && scheduleModal.type && <ScheduleMessageModal lead={editableLead} currentUser={currentUser} type={scheduleModal.type} onClose={() => setScheduleModal({ open: false, type: null })} onSchedule={onScheduleMessage} />}

            {/* Header with save status */}
            <div className="flex items-center justify-between p-4 border-b border-muted bg-surface">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-on-surface">Lead Details</h2>
                    {hasUnsavedChanges && (
                        <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                            Unsaved Changes
                        </span>
                    )}
                    {showSaveSuccess && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            ✓ Saved Successfully
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        disabled={!hasUnsavedChanges || isSaving}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 ${
                            hasUnsavedChanges && !isSaving
                                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                                : 'bg-muted text-subtle cursor-not-allowed'
                        }`}
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <AppIcons.Success className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Left Column: Details */}
                <div className="lg:col-span-1 overflow-y-auto pr-4">
                    <CollapsibleSection title="Contact" initiallyOpen={true}>
                        <div>
                            <label className="text-xs font-medium text-subtle">Name</label>
                            <input type="text" value={editableLead.name} onChange={e => handleFieldChange('name', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-subtle">Email</label>
                            <input type="email" value={editableLead.email} onChange={e => handleFieldChange('email', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-subtle">Phone</label>
                            <input type="tel" value={editableLead.phone} onChange={e => handleFieldChange('phone', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                        </div>
                        <div>
                             <label className="text-xs font-medium text-subtle">Owner</label>
                             <select value={editableLead.assignedToId} onChange={e => handleFieldChange('assignedToId', parseInt(e.target.value))} className="w-full bg-transparent py-1 text-on-surface focus:outline-none border-b border-transparent focus:border-primary-500">
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                    </CollapsibleSection>
                    <CollapsibleSection title="Deal Info">
                        <div>
                            <label className="text-xs font-medium text-subtle">Pipeline Stage</label>
                             <select value={editableLead.stage} onChange={e => handleFieldChange('stage', e.target.value)} className="w-full bg-transparent py-1 text-on-surface focus:outline-none border-b border-transparent focus:border-primary-500">
                                {pipelineStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="text-xs font-medium text-subtle">Deal Value</label>
                             <input type="number" value={editableLead.dealValue} onChange={e => handleFieldChange('dealValue', Number(e.target.value))} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-subtle">Course Interest</label>
                             <input type="text" value={editableLead.course} onChange={e => handleFieldChange('course', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-subtle">Source</label>
                            <div className="py-1 text-on-surface">{editableLead.source}</div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-subtle">Created</label>
                            <div className="py-1 text-on-surface">{new Date(editableLead.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-subtle">Last Updated</label>
                            <div className="py-1 text-on-surface">{new Date(editableLead.updatedAt).toLocaleDateString()}</div>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Additional Details">
                        <div>
                            <label className="text-xs font-medium text-subtle">Company</label>
                            <input type="text" value={editableLead.company || ''} onChange={e => handleFieldChange('company', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-subtle">City</label>
                            <input type="text" value={editableLead.city || ''} onChange={e => handleFieldChange('city', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-subtle">Alternate Phone</label>
                            <input type="tel" value={editableLead.alternatePhone || ''} onChange={e => handleFieldChange('alternatePhone', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-subtle">Campaign</label>
                            <input type="text" value={editableLead.campaign || ''} onChange={e => handleFieldChange('campaign', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-subtle">Tags</label>
                            <input type="text" value={Array.isArray(editableLead.tags) ? editableLead.tags.join(', ') : ''} onChange={e => handleFieldChange('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" placeholder="Enter tags separated by commas" />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Facebook Details">
                        <div>
                            <label className="text-xs font-medium text-subtle">Facebook Campaign</label>
                            <input type="text" value={editableLead.facebookCampaign || ''} onChange={e => handleFieldChange('facebookCampaign', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-subtle">Facebook Adset</label>
                            <input type="text" value={editableLead.facebookAdset || ''} onChange={e => handleFieldChange('facebookAdset', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-subtle">Facebook Ad</label>
                            <input type="text" value={editableLead.facebookAd || ''} onChange={e => handleFieldChange('facebookAd', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                        </div>
                    </CollapsibleSection>
                     {customFieldDefs.length > 0 && <CollapsibleSection title="Custom Fields">
                         {customFieldDefs.map(def => {
                             const value = editableLead.customFields?.[def.id];
                             return (
                                 <div key={def.id} className="mb-4">
                                     <label className="text-xs font-medium text-subtle">
                                         {def.name}
                                         {def.isRequired && <span className="text-red-500 ml-1">*</span>}
                                     </label>
                                     {def.type === 'date' ? (
                                         <input
                                             type="date"
                                             value={value as string || ''}
                                             onChange={e => handleCustomFieldChange(def.id, e.target.value)}
                                             className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500"
                                             required={def.isRequired}
                                         />
                                     ) : def.type === 'number' ? (
                                         <input
                                             type="number"
                                             value={value as number || ''}
                                             onChange={e => handleCustomFieldChange(def.id, Number(e.target.value))}
                                             className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500"
                                             required={def.isRequired}
                                         />
                                     ) : def.type === 'dropdown' ? (
                                         <select
                                             value={value as string || ''}
                                             onChange={e => handleCustomFieldChange(def.id, e.target.value)}
                                             className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500"
                                             required={def.isRequired}
                                         >
                                             <option value="">Select {def.name}</option>
                                             {def.options?.map(option => (
                                                 <option key={option} value={option}>{option}</option>
                                             ))}
                                         </select>
                                     ) : (
                                         <input
                                             type="text"
                                             value={value as string || ''}
                                             onChange={e => handleCustomFieldChange(def.id, e.target.value)}
                                             className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500"
                                             placeholder={`Enter ${def.name}`}
                                             required={def.isRequired}
                                         />
                                     )}
                                 </div>
                             );
                         })}
                     </CollapsibleSection>}
                </div>

                {/* Right Column: Activity */}
                <div className="lg:col-span-2 flex flex-col overflow-hidden bg-background rounded-lg border border-muted">
                    <div className="flex-shrink-0 p-2 flex flex-wrap items-center justify-between gap-2 border-b border-muted">
                        <div className="flex items-center">
                            <button onClick={() => setActiveTab('activity')} className={`px-3 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'activity' ? 'bg-primary-600 text-white' : 'text-subtle hover:bg-muted'}`}>Activity</button>
                             <button onClick={() => setActiveTab('tasks')} className={`relative px-3 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'tasks' ? 'bg-primary-600 text-white' : 'text-subtle hover:bg-muted'}`}>
                                Tasks
                                {leadTasks.filter(t => !t.isCompleted).length > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-white text-xs">{leadTasks.filter(t => !t.isCompleted).length}</span></span>}
                             </button>
                             <button onClick={() => setActiveTab('scheduled')} className={`relative px-3 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'scheduled' ? 'bg-primary-600 text-white' : 'text-subtle hover:bg-muted'}`}>
                                Scheduled
                                {(editableLead.scheduledMessages || []).length > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 items-center justify-center text-white text-xs">{(editableLead.scheduledMessages || []).length}</span></span>}
                             </button>
                        </div>
                    </div>

                    <div className="flex-shrink-0 p-2 flex flex-wrap items-center gap-2 border-b border-muted">
                        <button onClick={() => setLogCallModalOpen(true)} className="flex-1 text-sm flex items-center justify-center gap-2 p-2 bg-muted rounded-lg hover:bg-primary-500/10 hover:text-primary-500"><AppIcons.Call className="h-4 w-4"/>Log Call</button>
                        <button onClick={() => setWhatsAppModalOpen(true)} className="flex-1 text-sm flex items-center justify-center gap-2 p-2 bg-muted rounded-lg hover:bg-primary-500/10 hover:text-primary-500"><AppIcons.Whatsapp className="h-4 w-4"/>WhatsApp</button>
                        <button onClick={() => setSmsModalOpen(true)} className="flex-1 text-sm flex items-center justify-center gap-2 p-2 bg-muted rounded-lg hover:bg-primary-500/10 hover:text-primary-500"><AppIcons.SMS className="h-4 w-4"/>SMS</button>
                        <button onClick={() => setIsAddingTask(true)} className="flex-1 text-sm flex items-center justify-center gap-2 p-2 bg-muted rounded-lg hover:bg-primary-500/10 hover:text-primary-500"><AppIcons.Tasks className="h-4 w-4"/>Add Task</button>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 space-y-6">
                        {activeTab === 'activity' && (
                            <div>
                                {(editableLead.activities || []).map((activity, index) => (
                                    <ActivityItem key={activity.id} activity={activity} author={users.find(u => u.id === activity.authorId)} isFirst={index === (editableLead.activities || []).length -1} />
                                ))}
                            </div>
                        )}
                        {activeTab === 'tasks' && (
                            <div className="space-y-2">
                                {isAddingTask && <AddTaskForm lead={editableLead} onAddTask={onAddTask} onCancel={() => setIsAddingTask(false)} currentUser={currentUser} />}
                                {leadTasks.map(task => (
                                     <div key={task.id || task._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                                         <input type="checkbox" checked={task.isCompleted} onChange={() => onUpdateTask({...task, isCompleted: !task.isCompleted})} className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500" />
                                         <p className={`flex-grow text-sm ${task.isCompleted ? 'line-through text-subtle' : ''}`}>{task.title}</p>
                                         <p className="text-xs text-subtle">{new Date(task.dueDate).toLocaleDateString()}</p>
                                     </div>
                                ))}
                                 {leadTasks.length === 0 && !isAddingTask && <p className="text-center text-subtle py-8">No tasks for this lead.</p>}
                            </div>
                        )}
                        {activeTab === 'scheduled' && (
                            <div className="divide-y divide-muted">
                                {(editableLead.scheduledMessages || []).map(msg => (
                                    <div key={msg.id} className="py-3">
                                        <p className="text-sm font-semibold">{msg.type} scheduled for {new Date(msg.scheduledAt).toLocaleString()}</p>
                                        <p className="text-sm text-subtle bg-muted p-2 rounded-md mt-1">"{msg.content}"</p>
                                    </div>
                                ))}
                                {(editableLead.scheduledMessages || []).length === 0 && <p className="text-center text-subtle py-8">No messages scheduled.</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default LeadDetailModal;



