import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Lead, User, Activity, Stage, Task, CustomFieldDefinition, WhatsAppTemplate, ScheduledMessage, SMSTemplate } from '../../types';
import { AppIcons } from '../ui/Icons';
import ScheduleMessageModal from '../leads/ScheduleMessageModal';
import LogCallModal from '../leads/LogCallModal';
import SMSModal from '../leads/SMSModal';
import { faker } from '@faker-js/faker';
import Modal from '../ui/Modal';

// Local re-implementation of WhatsAppModal from LeadDetailModal to avoid circular dependencies
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


interface LeadDetailPageProps {
    leads: Lead[];
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
    onRefreshLeadById?: (leadId: string) => Promise<Lead | undefined>; // Add specific lead refresh function
    currentUser: User;
    isStandalone?: boolean; // New prop to indicate standalone mode
}

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


const LeadDetailPage: React.FC<LeadDetailPageProps> = ({ leads, users, tasks, pipelineStages, customFieldDefs, whatsAppTemplates, smsTemplates, onUpdateLead, onUpdateTask, onAddTask, onScheduleMessage, onRefreshLeadById, currentUser, isStandalone = false }) => {
    const { leadId } = useParams<{ leadId: string }>();
    const lead = leads.find(l => l.id === leadId || l._id === leadId);
    const [isLoadingLead, setIsLoadingLead] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);

    // Enhanced debug logging
    console.log('LeadDetailPage Debug:', {
        leadId,
        leadFound: !!lead,
        leadsCount: leads.length,
        availableLeadIds: leads.map(l => ({ id: l.id, _id: l._id })),
        firstFewLeads: leads.slice(0, 3).map(l => ({ id: l.id, _id: l._id, name: l.name }))
    });

    // If lead not found in current leads array, try to refresh it from backend silently
    useEffect(() => {
        if (!lead && leadId && onRefreshLeadById && !isLoadingLead) {
            console.log('Lead not found in array, attempting silent refresh from backend:', leadId);
            setIsLoadingLead(true);

            onRefreshLeadById(leadId)
                .then(refreshedLead => {
                    if (refreshedLead) {
                        console.log('Successfully refreshed lead from backend:', refreshedLead);
                        // Lead will be added to the array by refreshLeadById function
                    } else {
                        console.log('Lead not found in backend either');
                    }
                    setIsLoadingLead(false);
                })
                .catch(error => {
                    console.error('Failed to refresh lead:', error);
                    setIsLoadingLead(false);
                });
        }
    }, [lead, leadId, onRefreshLeadById]);

    const [activeTab, setActiveTab] = useState<'activity' | 'tasks' | 'scheduled'>('activity');
    const [editableLead, setEditableLead] = useState<Lead | null>(lead || null);
    const [isWhatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
    const [isSmsModalOpen, setSmsModalOpen] = useState(false);
    const [isLogCallModalOpen, setLogCallModalOpen] = useState(false);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [scheduleModal, setScheduleModal] = useState<{ open: boolean, type: 'EMAIL' | 'WHATSAPP' | 'SMS' | null }>({ open: false, type: null });
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Debounce mechanism for field changes
    const fieldChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const originalLead = useMemo(() => lead, [lead]);
    const leadTasks = useMemo(() => tasks.filter(t => t.leadId === lead?.id), [tasks, lead?.id]);

    useEffect(() => {
        if (lead) {
            setEditableLead(lead);
        }
    }, [lead]);

    // Debounced refresh function to prevent excessive API calls
    const refreshLeadData = useCallback(async () => {
        if (onRefreshLeadById && editableLead?.id && !isRefreshing) {
            const now = Date.now();
            // Throttle requests to once per 3 seconds maximum
            if (now - lastRefreshTime < 3000) {
                console.log('Refresh throttled, too soon since last refresh');
                return;
            }

            try {
                console.log('Refreshing lead data for:', editableLead.id);
                setLastRefreshTime(now);
                setIsRefreshing(true);

                const refreshedLead = await onRefreshLeadById(editableLead.id);
                if (refreshedLead) {
                    console.log('Lead data refreshed successfully');
                    setEditableLead(refreshedLead);
                } else {
                    console.warn('No refreshed lead data received');
                }
            } catch (error) {
                console.error('Failed to refresh lead data:', error);
            } finally {
                // Ensure loading state is cleared after a delay
                setTimeout(() => {
                    setIsRefreshing(false);
                }, 500);
            }
        }
    }, [onRefreshLeadById, editableLead?.id, isRefreshing, lastRefreshTime]);

    // Create a debounced version that waits for user to stop typing/changing fields
    const debouncedRefreshLeadData = useMemo(
        () => {
            let timeoutId: NodeJS.Timeout;
            return () => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    refreshLeadData();
                }, 1500); // Wait 1.5 seconds after last change
            };
        },
        [refreshLeadData]
    );

    // Debounced field change handler to prevent excessive API calls while typing
    const debouncedHandleFieldChange = useCallback((field: keyof Lead, value: any) => {
        const timeoutId = setTimeout(() => {
            handleFieldChange(field, value);
        }, 1000); // Wait 1 second after last keystroke before saving

        // Return cleanup function to clear timeout if component unmounts
        return () => clearTimeout(timeoutId);
    }, []); // Will be updated after handleFieldChange is defined
    
    const handleFieldChange = async (field: keyof Lead, value: any) => {
        if (!editableLead) return;

        // Optimistic update - immediately update UI
        const updatedLead = { ...editableLead, [field]: value };
        setEditableLead(updatedLead);

        // Create activity for field change
        const fieldNames: Record<string, string> = {
            name: 'Name',
            email: 'Email',
            phone: 'Phone',
            alternatePhone: 'Alternate Phone',
            city: 'City',
            course: 'Course',
            company: 'Company',
            source: 'Source',
            stage: 'Stage',
            followUpStatus: 'Follow Up Status',
            score: 'Score',
            scoreBreakdown: 'Score Breakdown',
            tags: 'Tags',
            assignedToId: 'Assigned To',
            dealValue: 'Deal Value',
            closeDate: 'Close Date',
            activities: 'Activities',
            scheduledMessages: 'Scheduled Messages',
            campaign: 'Campaign',
            facebookCampaign: 'Facebook Campaign',
            facebookAdset: 'Facebook Adset',
            facebookAd: 'Facebook Ad',
            customFields: 'Custom Fields',
            organizationId: 'Organization',
            id: 'ID',
            createdAt: 'Created At',
            updatedAt: 'Updated At',
            _id: '_id'
        };

        const oldValue = editableLead?.[field];
        const newValue = value;

        // Only create activity if value actually changed
        if (oldValue !== newValue) {
            const activityContent = `Updated ${fieldNames[field]} from "${oldValue}" to "${newValue}"`;
            const newActivity: Activity = {
                id: faker.string.uuid(),
                type: 'FIELD_UPDATE',
                content: activityContent,
                timestamp: new Date().toISOString(),
                authorId: currentUser.id
            };

            const leadWithActivity = {
                ...updatedLead,
                activities: [newActivity, ...(updatedLead.activities || [])]
            };
            setEditableLead(leadWithActivity);

            // Save to backend - only if lead has valid ID
            if (leadWithActivity.id) {
                setSaveStatus('saving');
                try {
                    // Remove system fields before sending to backend, but preserve the ID for lookup
                    const { _id, createdAt, updatedAt, ...cleanLeadData } = leadWithActivity as any;
                    // Ensure the lead ID is preserved for the backend to find the lead
                    const leadDataWithId = { ...cleanLeadData, id: leadWithActivity.id };
                    await onUpdateLead(leadDataWithId as Lead, editableLead!);
                    setSaveStatus('saved');

                    // Refresh data from backend to ensure consistency (with delay)
                    setTimeout(() => {
                        debouncedRefreshLeadData();
                    }, 2000);

                    // Reset save status after 2 seconds
                    setTimeout(() => setSaveStatus('idle'), 2000);
                } catch (error) {
                    console.error('Failed to save lead:', error);
                    setSaveStatus('error');

                    // Rollback optimistic update on error
                    setEditableLead(editableLead);

                    // Reset error status after 3 seconds
                    setTimeout(() => setSaveStatus('idle'), 3000);
                }
            }
        }
    };

    const handleCustomFieldChange = async (id: string, value: any) => {
        if (!editableLead) return;

        // Optimistic update - immediately update UI
        const updatedCustomFields = { ...(editableLead.customFields || {}), [id]: value };
        const updatedLead = { ...editableLead, customFields: updatedCustomFields };
        setEditableLead(updatedLead);

        // Find the custom field definition to get the field name
        const fieldDef = customFieldDefs.find(def => def.id === id);
        const fieldName = fieldDef?.name || `Custom Field ${id}`;

        const oldValue = editableLead?.customFields?.[id];
        const newValue = value;

        // Only create activity if value actually changed
        if (oldValue !== newValue) {
            const activityContent = `Updated ${fieldName} from "${oldValue}" to "${newValue}"`;
            const newActivity: Activity = {
                id: faker.string.uuid(),
                type: 'FIELD_UPDATE',
                content: activityContent,
                timestamp: new Date().toISOString(),
                authorId: currentUser.id
            };

            const leadWithActivity = {
                ...updatedLead,
                activities: [newActivity, ...(updatedLead.activities || [])]
            };
            setEditableLead(leadWithActivity);

            // Save to backend - only if lead has valid ID
            if (leadWithActivity.id) {
                setSaveStatus('saving');
                try {
                    // Remove system fields before sending to backend to prevent unwanted activities
                    const { _id, createdAt, updatedAt, ...cleanLeadData } = leadWithActivity;
                    // Ensure the lead ID is preserved for the backend to find the lead
                    const leadDataWithId = { ...cleanLeadData, id: leadWithActivity.id };
                    await onUpdateLead(leadDataWithId as Lead, editableLead!);
                    setSaveStatus('saved');

                    // Refresh data from backend to ensure consistency (debounced)
                    debouncedRefreshLeadData();

                    // Reset save status after 2 seconds
                    setTimeout(() => setSaveStatus('idle'), 2000);
                } catch (error) {
                    console.error('Failed to save lead:', error);
                    setSaveStatus('error');

                    // Rollback optimistic update on error
                    setEditableLead(editableLead);

                    // Reset error status after 3 seconds
                    setTimeout(() => setSaveStatus('idle'), 3000);
                }
            }
        }
    };

    const handleSendWhatsApp = async (message: string) => {
        if (!editableLead || !originalLead) return;

        // Optimistic update - immediately update UI
        const newActivity: Activity = { id: faker.string.uuid(), type: 'WHATSAPP', content: `Sent WhatsApp: <i class="whitespace-pre-wrap">"${message}"</i>`, timestamp: new Date().toISOString(), authorId: currentUser.id };
        const updatedLead = { ...editableLead, activities: [newActivity, ...(editableLead.activities || [])] };
        setEditableLead(updatedLead);
        setWhatsAppModalOpen(false);

        // Save to backend
        if (updatedLead.id) {
            setSaveStatus('saving');
            try {
                // Remove system fields before sending to backend
                const { _id, createdAt, updatedAt, ...cleanLeadData } = updatedLead as any;
                // Ensure the lead ID is preserved for the backend to find the lead
                const leadDataWithId = { ...cleanLeadData, id: updatedLead.id };
                await onUpdateLead(leadDataWithId as Lead, editableLead!);
                setSaveStatus('saved');

                // Refresh data from backend to ensure consistency (debounced)
                debouncedRefreshLeadData();

                // Reset save status after 2 seconds
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error('Failed to save WhatsApp activity:', error);
                setSaveStatus('error');

                // Rollback optimistic update on error
                setEditableLead(editableLead);

                // Reset error status after 3 seconds
                setTimeout(() => setSaveStatus('idle'), 3000);
            }
        }
    };

    const handleSendSMS = async (message: string) => {
        if (!editableLead || !originalLead) return;

        // Optimistic update - immediately update UI
        const newActivity: Activity = { id: faker.string.uuid(), type: 'SMS', content: `Sent SMS: <i class="whitespace-pre-wrap">"${message}"</i>`, timestamp: new Date().toISOString(), authorId: currentUser.id };
        const updatedLead = { ...editableLead, activities: [newActivity, ...(editableLead.activities || [])] };
        setEditableLead(updatedLead);
        setSmsModalOpen(false);

        // Save to backend
        if (updatedLead.id) {
            setSaveStatus('saving');
            try {
                // Remove system fields before sending to backend
                const { _id, createdAt, updatedAt, ...cleanLeadData } = updatedLead as any;
                // Ensure the lead ID is preserved for the backend to find the lead
                const leadDataWithId = { ...cleanLeadData, id: updatedLead.id };
                await onUpdateLead(leadDataWithId as Lead, editableLead!);
                setSaveStatus('saved');

                // Refresh data from backend to ensure consistency (debounced)
                debouncedRefreshLeadData();

                // Reset save status after 2 seconds
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error('Failed to save SMS activity:', error);
                setSaveStatus('error');

                // Rollback optimistic update on error
                setEditableLead(editableLead);

                // Reset error status after 3 seconds
                setTimeout(() => setSaveStatus('idle'), 3000);
            }
        }
    };

    const handleLogCall = async (outcome: string, notes: string) => {
        if (!editableLead || !originalLead) return;

        // Optimistic update - immediately update UI
        const content = `Logged call. Outcome: <strong>${outcome}</strong>. Notes: <i class="whitespace-pre-wrap">"${notes}"</i>`;
        const newActivity: Activity = { id: faker.string.uuid(), type: 'CALL', content, timestamp: new Date().toISOString(), authorId: currentUser.id };
        const updatedLead = { ...editableLead, activities: [newActivity, ...(editableLead.activities || [])] };
        setEditableLead(updatedLead);
        setLogCallModalOpen(false);

        // Save to backend
        if (updatedLead.id) {
            setSaveStatus('saving');
            try {
                // Remove system fields before sending to backend
                const { _id, createdAt, updatedAt, ...cleanLeadData } = updatedLead as any;
                // Ensure the lead ID is preserved for the backend to find the lead
                const leadDataWithId = { ...cleanLeadData, id: updatedLead.id };
                await onUpdateLead(leadDataWithId as Lead, editableLead!);
                setSaveStatus('saved');

                // Refresh data from backend to ensure consistency (with delay)
                setTimeout(() => {
                    debouncedRefreshLeadData();
                }, 2000);

                // Reset save status after 2 seconds
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error('Failed to save call log:', error);
                setSaveStatus('error');

                // Rollback optimistic update on error
                setEditableLead(editableLead);

                // Reset error status after 3 seconds
                setTimeout(() => setSaveStatus('idle'), 3000);
            }
        }
    };

    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [noteContent, setNoteContent] = useState('');

    const handleAddNote = () => {
        setIsNoteModalOpen(true);
        setNoteContent('');
    };

    const handleNoteSubmit = async () => {
        if (!editableLead || !noteContent.trim()) return;

        // Optimistic update - immediately update UI
        const newActivity: Activity = {
            id: faker.string.uuid(),
            type: 'NOTE',
            content: `Note added: <i class="whitespace-pre-wrap">"${noteContent}"</i>`,
            timestamp: new Date().toISOString(),
            authorId: currentUser.id
        };
        const updatedLead = { ...editableLead, activities: [newActivity, ...(editableLead.activities || [])] };
        setEditableLead(updatedLead);
        setIsNoteModalOpen(false);

        // Save to backend
        if (updatedLead.id) {
            setSaveStatus('saving');
            try {
                // Remove system fields before sending to backend
                const { _id, createdAt, updatedAt, ...cleanLeadData } = updatedLead as any;
                // Ensure the lead ID is preserved for the backend to find the lead
                const leadDataWithId = { ...cleanLeadData, id: updatedLead.id };
                await onUpdateLead(leadDataWithId as Lead, editableLead!);
                setSaveStatus('saved');

                // Silently refresh data in background without showing loading state
                setTimeout(() => {
                    debouncedRefreshLeadData();
                }, 2000); // Wait 2 seconds after note submission

                // Reset save status after 2 seconds
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error('Failed to save note:', error);
                setSaveStatus('error');

                // Rollback optimistic update on error
                setEditableLead(editableLead);

                // Reset error status after 3 seconds
                setTimeout(() => setSaveStatus('idle'), 3000);
            }
        }
    };
    
    const handleSave = () => {
        // Don't call onUpdateLead here - let the modal handle saving
        console.log('LeadDetailPage save triggered - no API call');
    };

    useEffect(() => {
        // Save on unmount / navigation away
        return () => {
            handleSave();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editableLead, originalLead]);

    if (!editableLead || !originalLead) {
        // If we're still loading the lead from backend, show loading state
        if (isLoadingLead || isRefreshing) {
            return (
                <div className="text-center p-8">
                    <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold">{isRefreshing ? 'Refreshing lead...' : 'Loading lead...'}</h2>
                    <p className="text-subtle mt-2">Lead ID: {leadId}</p>
                </div>
            );
        }

        console.error('Lead not found:', {
            leadId,
            availableLeads: leads.map(l => ({ id: l.id, _id: l._id })),
            leadExists: leads.some(l => l.id === leadId || l._id === leadId),
            isLoadingLead
        });
        return (
            <div className="text-center p-8">
                <h2 className="text-xl font-semibold">Lead not found</h2>
                <p className="text-subtle mt-2">Lead ID: {leadId}</p>
                <p className="text-subtle">Available leads: {leads.length}</p>
                <Link to="/leads" className="text-primary-500 mt-4 inline-block">Go back to leads list</Link>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            {isWhatsAppModalOpen && <WhatsAppModal lead={editableLead} templates={whatsAppTemplates} currentUser={currentUser} onClose={() => setWhatsAppModalOpen(false)} onSend={handleSendWhatsApp} />}
            {isSmsModalOpen && <SMSModal lead={editableLead} templates={smsTemplates} currentUser={currentUser} onClose={() => setSmsModalOpen(false)} onSend={handleSendSMS} />}
            {isLogCallModalOpen && <LogCallModal onClose={() => setLogCallModalOpen(false)} onLog={handleLogCall} />}
            {scheduleModal.open && scheduleModal.type && <ScheduleMessageModal lead={editableLead} currentUser={currentUser} type={scheduleModal.type} onClose={() => setScheduleModal({ open: false, type: null })} onSchedule={onScheduleMessage} />}

            {/* Note Modal */}
            {isNoteModalOpen && (
                <Modal isOpen={isNoteModalOpen} onClose={() => setIsNoteModalOpen(false)} title="Add Note">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-subtle mb-2">Note Content</label>
                            <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                rows={4}
                                className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Enter your note..."
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-muted">
                            <button type="button" onClick={() => setIsNoteModalOpen(false)} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">
                                Cancel
                            </button>
                            <button type="button" onClick={handleNoteSubmit} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">
                                Add Note
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
            
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-on-surface">{editableLead.name}</h1>
                    {saveStatus === 'saving' && (
                        <div className="flex items-center gap-2 text-primary-500">
                            <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                            <span className="text-sm">Saving...</span>
                        </div>
                    )}
                    {saveStatus === 'saved' && (
                        <div className="flex items-center gap-2 text-green-500">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm">Saved</span>
                        </div>
                    )}
                    {saveStatus === 'error' && (
                        <div className="flex items-center gap-2 text-red-500">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-sm">Save failed</span>
                        </div>
                    )}
                </div>
                {!isStandalone && (
                    <Link to="/leads" className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg w-full sm:w-auto text-center">
                        Back to Leads List
                    </Link>
                )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Left Column: Details */}
                <div className="lg:col-span-1 bg-surface p-6 rounded-xl shadow-sm border border-muted">
                    <CollapsibleSection title="Contact Information" initiallyOpen={true}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <label className="text-xs font-medium text-subtle">Alternate Phone</label>
                                <input type="tel" value={editableLead.alternatePhone} onChange={e => handleFieldChange('alternatePhone', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-subtle">Company</label>
                                <input type="text" value={editableLead.company} onChange={e => handleFieldChange('company', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-subtle">City</label>
                                <input type="text" value={editableLead.city} onChange={e => handleFieldChange('city', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-subtle">Source</label>
                                <select value={editableLead.source} onChange={e => handleFieldChange('source', e.target.value)} className="w-full bg-transparent py-1 text-on-surface focus:outline-none border-b border-transparent focus:border-primary-500">
                                    <option value="Website">Website</option>
                                    <option value="Facebook">Facebook</option>
                                    <option value="Google Ads">Google Ads</option>
                                    <option value="Referral">Referral</option>
                                    <option value="Cold Call">Cold Call</option>
                                    <option value="Chatbot">Chatbot</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-subtle">Owner</label>
                                <select value={editableLead.assignedToId} onChange={e => handleFieldChange('assignedToId', parseInt(e.target.value))} className="w-full bg-transparent py-1 text-on-surface focus:outline-none border-b border-transparent focus:border-primary-500">
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </CollapsibleSection>
                    <CollapsibleSection title="Deal Information">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <label className="text-xs font-medium text-subtle">Lead Score</label>
                                <input type="number" value={editableLead.score} onChange={e => handleFieldChange('score', Number(e.target.value))} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                            </div>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Marketing Information">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-subtle">Campaign</label>
                                <input type="text" value={editableLead.campaign} onChange={e => handleFieldChange('campaign', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-subtle">Tags</label>
                                <input type="text" value={Array.isArray(editableLead.tags) ? editableLead.tags.join(', ') : ''} onChange={e => handleFieldChange('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" placeholder="Comma-separated tags" />
                            </div>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Facebook Details">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-subtle">Facebook Campaign</label>
                                <input type="text" value={editableLead.facebookCampaign || ''} onChange={e => handleFieldChange('facebookCampaign', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-subtle">Facebook Adset</label>
                                <input type="text" value={editableLead.facebookAdset || ''} onChange={e => handleFieldChange('facebookAdset', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-medium text-subtle">Facebook Ad</label>
                                <input type="text" value={editableLead.facebookAd || ''} onChange={e => handleFieldChange('facebookAd', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                            </div>
                        </div>
                    </CollapsibleSection>
                     {customFieldDefs.length > 0 && <CollapsibleSection title="Custom Fields">
                         {customFieldDefs.map(def => (
                             <div key={def.id}>
                                 <label className="text-xs font-medium text-subtle">{def.name}</label>
                                 <input type={def.type === 'date' ? 'date' : 'text'} value={editableLead.customFields?.[def.id] as string || ''} onChange={e => handleCustomFieldChange(def.id, e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                             </div>
                        ))}
                    </CollapsibleSection>}
                </div>


                {/* Right Column: Activity */}
                <div className="lg:col-span-2 flex flex-col overflow-hidden bg-surface rounded-xl shadow-sm border border-muted">
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

                    <div className="flex-shrink-0 p-2 grid grid-cols-2 sm:grid-cols-5 items-center gap-2 border-b border-muted">
                        <button onClick={() => setLogCallModalOpen(true)} className="flex-1 text-sm flex items-center justify-center gap-2 p-2 bg-muted rounded-lg hover:bg-primary-500/10 hover:text-primary-500"><AppIcons.Call className="h-4 w-4"/>Log Call</button>
                        <button onClick={() => setWhatsAppModalOpen(true)} className="flex-1 text-sm flex items-center justify-center gap-2 p-2 bg-muted rounded-lg hover:bg-primary-500/10 hover:text-primary-500"><AppIcons.Whatsapp className="h-4 w-4"/>WhatsApp</button>
                        <button onClick={() => setSmsModalOpen(true)} className="flex-1 text-sm flex items-center justify-center gap-2 p-2 bg-muted rounded-lg hover:bg-primary-500/10 hover:text-primary-500"><AppIcons.SMS className="h-4 w-4"/>SMS</button>
                        <button onClick={() => setIsAddingTask(true)} className="flex-1 text-sm flex items-center justify-center gap-2 p-2 bg-muted rounded-lg hover:bg-primary-500/10 hover:text-primary-500"><AppIcons.Tasks className="h-4 w-4"/>Add Task</button>
                        <button onClick={() => handleAddNote()} className="flex-1 text-sm flex items-center justify-center gap-2 p-2 bg-muted rounded-lg hover:bg-primary-500/10 hover:text-primary-500"><AppIcons.Note className="h-4 w-4"/>Add Note</button>
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
                                {isAddingTask && <AddTaskForm lead={editableLead} onAddTask={onAddTask} onCancel={() => setIsAddingTask(false)} currentUser={currentUser}/>}
                                {leadTasks.map(task => (
                                     <div key={task.id || task._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                                         <input
                                             type="checkbox"
                                             checked={task.isCompleted}
                                             onChange={() => {
                                                 console.log('Task checkbox clicked:', task);
                                                 onUpdateTask({...task, isCompleted: !task.isCompleted});
                                             }}
                                             className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                                         />
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
        </div>
    );
};

export default LeadDetailPage;


