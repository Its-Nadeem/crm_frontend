import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Lead, User, Activity, Stage, Task, CustomFieldDefinition, WhatsAppTemplate, ScheduledMessage, SMSTemplate } from '../../types';
import { AppIcons } from '../ui/Icons';
import ScheduleMessageModal from '../leads/ScheduleMessageModal';
import LogCallModal from '../leads/LogCallModal';
import SMSModal from '../leads/SMSModal';
import EmailModal from '../leads/EmailModal';
import { faker } from '@faker-js/faker';
import Modal from '../ui/Modal';
import { ActivityTimeline } from '../leads/ActivityTimeline';
import { AddNoteModal } from '../leads/AddNoteModal';
import { AddTaskModal } from '../leads/AddTaskModal';
import { apiService } from '../../services/api';
import { useLeadActivities, useCreateLeadNote, useCreateLeadTask, leadQueryKeys, useLead } from '../../hooks/useLeadActivities';
import { useQuery } from '@tanstack/react-query';

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
            leadId: lead._id,
            assignedToId: lead.assignedToId,
            isCompleted: false,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdById: currentUser.id,
        };
        onAddTask(newTask as any);
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

const AddNoteForm: React.FC<{ lead: Lead; onAddNote: (note: { content: string; leadId: string }) => void; onCancel: () => void; currentUser: User; }> = ({ lead, onAddNote, onCancel, currentUser }) => {
    const [content, setContent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        onAddNote({
            content: content.trim(),
            leadId: lead.id,
        });
        setContent('');
        onCancel();
    };

    return (
        <form onSubmit={handleSubmit} className="p-2 space-y-2">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add a note about this lead..."
                autoFocus
                rows={3}
                className="w-full bg-background border border-muted p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
             <div className="flex justify-end gap-2">
                 <button type="button" onClick={onCancel} className="bg-muted hover:bg-subtle/20 text-on-surface font-semibold py-1.5 px-3 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-1.5 px-3 rounded-lg text-sm">Add Note</button>
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
    onUpdateLead: (lead: Lead, oldLead?: Lead) => void;
    onUpdateTask: (task: Task) => void;
    onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'organizationId' | '_id'>) => void;
    onAddNote: (note: { content: string; leadId: string }) => void;
    onScheduleMessage: (message: Omit<ScheduledMessage, 'id' | 'organizationId'>) => void;
    onRefreshLeadById?: (leadId: string) => Promise<Lead | undefined>;
    currentUser: User;
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


const LeadDetailPage: React.FC<LeadDetailPageProps> = ({ leads, users, tasks, pipelineStages, customFieldDefs, whatsAppTemplates, smsTemplates, onUpdateLead, onUpdateTask, onAddTask, onAddNote, onScheduleMessage, currentUser, onRefreshLeadById }) => {
    const { leadId } = useParams<{ leadId: string }>();

    // Use dedicated query for the current lead with optimized settings
    const {
        data: lead,
        isLoading: isLoadingLead,
        isFetching: isFetchingLead,
        isRefetching: isRefetchingLead,
    } = useQuery({
        queryKey: ['leads', leadId],
        queryFn: () => apiService.getLeadById(leadId || ''),
        enabled: !!leadId && !!currentUser, // Only run when leadId and currentUser are available
        refetchOnWindowFocus: false, // Disable refetch on window focus to prevent unnecessary requests
        refetchOnMount: true, // Enable refetch on mount to ensure fresh data when navigating to lead
        refetchOnReconnect: true, // Enable refetch on reconnect for better UX
        staleTime: 2 * 60 * 1000, // 2 minutes - balance between fresh data and performance
        gcTime: 10 * 60 * 1000, // 10 minutes - keep data in cache longer to prevent unnecessary refetches
        retry: 2, // Retry failed requests up to 2 times
        placeholderData: (prev) => prev, // Keep previous data while fetching new data
    });

    // Add an isMutating ref to suppress loader during mutations
    const isMutatingRef = useRef(false);

    // StrictMode double render guard (dev only)
    const renderCountRef = useRef(0);
    const isStrictModeDoubleRender = useRef(false);

    useEffect(() => {
        renderCountRef.current += 1;
        // In development with StrictMode, React double-invokes effects and queries
        // This helps us detect and handle the double render appropriately
        if (process.env.NODE_ENV === 'development' && renderCountRef.current === 2) {
            isStrictModeDoubleRender.current = true;
        }
    });

    const [activeTab, setActiveTab] = useState<'activity' | 'tasks' | 'scheduled'>('activity');
    const [editableLead, setEditableLead] = useState<Lead | null>(lead || null);
    const [isWhatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
    const [isSmsModalOpen, setSmsModalOpen] = useState(false);
    const [isLogCallModalOpen, setLogCallModalOpen] = useState(false);
    const [isEmailModalOpen, setEmailModalOpen] = useState(false);
    const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [scheduleModal, setScheduleModal] = useState<{ open: boolean, type: 'EMAIL' | 'WHATSAPP' | 'SMS' | null }>({ open: false, type: null });
    const [disableTimelineAutoRefresh, setDisableTimelineAutoRefresh] = useState(false);

    const originalLead = useMemo(() => lead, [lead]);
    const leadTasks = useMemo(() => tasks.filter(t => t.leadId === lead?.id), [tasks, lead?.id]);

    // React Query hooks for lead activities - only run when leadId is available
    const { data: activities = [], refetch: refetchActivities } = useLeadActivities(leadId || '', currentUser);
    const createNoteMutation = useCreateLeadNote(leadId || '', currentUser);
    const createTaskMutation = useCreateLeadTask(leadId || '', currentUser);

    // Debug logging for leadId and activities
    useEffect(() => {
        console.log('LeadDetailPage Debug:', {
            leadId,
            leadFound: !!lead,
            leadsCount: leads.length,
            availableLeadIds: leads.slice(0, 3).map(l => l.id),
            activitiesCount: activities.length,
            hasCurrentUser: !!currentUser
        });
    }, [leadId, lead, leads.length, activities.length, currentUser]);


    useEffect(() => {
        if (lead) setEditableLead(lead);
    }, [lead]);
    
    const handleFieldChange = (field: keyof Lead, value: any) => {
        setEditableLead(prev => prev ? ({ ...prev, [field]: value }) : null);
    };

    const handleCustomFieldChange = (id: string, value: any) => {
        setEditableLead(prev => prev ? ({
            ...prev,
            customFields: { ...(prev.customFields || {}), [id]: value }
        }) : null);
    };

    const handleSendWhatsApp = async (message: string) => {
        if (!editableLead || !originalLead) return;

        try {
            // Prepare WhatsApp data
            const whatsappData = {
                leadId: editableLead.id,
                phoneNumber: editableLead.phone,
                message: message.trim(),
                sentBy: currentUser.id,
                timestamp: new Date().toISOString()
            };

            // Call real backend API to log WhatsApp initiation
            await apiService.createNote({
                leadId: editableLead.id,
                content: `WhatsApp initiated: "${message}"`,
                type: 'whatsapp'
            });

            // Open WhatsApp in new tab
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${editableLead.phone.replace(/\D/g, '')}?text=${encodedMessage}`;
            window.open(whatsappUrl, '_blank');

            // Create activity record
            const newActivity: Activity = {
                id: crypto.randomUUID(),
                type: 'WHATSAPP',
                content: `WhatsApp message initiated: <i class="whitespace-pre-wrap">"${message}"</i>`,
                timestamp: new Date().toISOString(),
                authorId: currentUser.id
            };

            const updatedLead = { ...editableLead, activities: [newActivity, ...(editableLead.activities || [])] };
            setEditableLead(updatedLead);
            onUpdateLead(updatedLead, originalLead);
            setWhatsAppModalOpen(false);
        } catch (error) {
            console.error('Failed to initiate WhatsApp:', error);
            alert('Failed to initiate WhatsApp. Please try again.');
        }
    };

    const handleSendSMS = (message: string) => {
        if (!editableLead || !originalLead) return;
        const newActivity: Activity = { id: faker.string.uuid(), type: 'SMS', content: `Sent SMS: <i class="whitespace-pre-wrap">"${message}"</i>`, timestamp: new Date().toISOString(), authorId: currentUser.id };
// FIX: Rewrote object creation to help TypeScript compiler and avoid iterator error.
       const updatedLead = { ...editableLead, activities: [newActivity, ...(editableLead.activities || [])] };
       setEditableLead(updatedLead);
       onUpdateLead(updatedLead, originalLead);
       setSmsModalOpen(false);
   };

   const handleLogCall = (outcome: string, notes: string) => {
        if (!editableLead || !originalLead) return;
       const content = `Logged call. Outcome: <strong>${outcome}</strong>. Notes: <i class="whitespace-pre-wrap">"${notes}"</i>`;
       const newActivity: Activity = { id: faker.string.uuid(), type: 'CALL', content, timestamp: new Date().toISOString(), authorId: currentUser.id };
// FIX: Rewrote object creation to help TypeScript compiler and avoid iterator error.
       const updatedLead = { ...editableLead, activities: [newActivity, ...(editableLead.activities || [])] };
       setEditableLead(updatedLead);
       onUpdateLead(updatedLead, originalLead);
       setLogCallModalOpen(false);
   };

   const handleEmailSent = (emailData: any) => {
       if (!editableLead || !originalLead) return;
       const content = `Email sent to ${emailData.to}. Subject: <strong>${emailData.subject}</strong>`;
       const newActivity: Activity = {
           id: crypto.randomUUID(),
           type: 'EMAIL',
           content,
           timestamp: new Date().toISOString(),
           authorId: currentUser.id
       };
       const updatedLead = { ...editableLead, activities: [newActivity, ...(editableLead.activities || [])] };
       setEditableLead(updatedLead);
       onUpdateLead(updatedLead, originalLead);
       setEmailModalOpen(false);
   };
    
    const handleSave = () => {
        if (editableLead && originalLead) {
            onUpdateLead(editableLead, originalLead);
        }
    };

    const handleAddTask = async (taskData: {
        title: string;
        leadId: string;
        assignedToId: number;
        dueDate: string;
        description?: string;
        priority?: 'low' | 'medium' | 'high';
    }) => {
        try {
            await createTaskMutation.mutateAsync(taskData);
            setIsAddTaskModalOpen(false);
        } catch (error) {
            console.error('Failed to create task:', error);
            // Error handling is done in the mutation
        }
    };

    const handleAddNote = async (noteData: { content: string; leadId: string }) => {
        try {
            await createNoteMutation.mutateAsync(noteData);
            setIsAddNoteModalOpen(false);
        } catch (error) {
            console.error('Failed to create note:', error);
            // Error handling is done in the mutation
        }
    };

    const handleNoteSaveComplete = () => {
        // Disable auto-refresh after note is saved to prevent auto-reload
        console.log('Note saved successfully, disabling auto-refresh');
        setDisableTimelineAutoRefresh(true);

        // Show visual feedback that manual refresh is required
        setTimeout(() => {
            console.log('Auto-refresh will be re-enabled');
            setDisableTimelineAutoRefresh(false);
        }, 10000); // Re-enable after 10 seconds
    };

    const handleTaskSaveComplete = () => {
        // Stop any auto-refresh after task is saved
        console.log('Task saved successfully, auto-refresh stopped');
        // Show a brief success message
        setTimeout(() => {
            console.log('Auto-refresh control returned to normal');
        }, 1000);
    };

    useEffect(() => {
        return () => {
            handleSave();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editableLead, originalLead]);

    // Computed UI flags
    const showPageSkeleton = !lead && isLoadingLead && !isMutatingRef.current;       // only first time, no data yet, not mutating
    const showInlineSync   = !!lead && (isFetchingLead || isRefetchingLead);
    const showSyncingRibbon = !!lead && (isFetchingLead || isRefetchingLead) && !isLoadingLead;

    if (showPageSkeleton) {
        return (
            <div className="text-center p-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-4"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                </div>
                <p className="text-subtle mt-4">Loading lead...</p>
            </div>
        );
    }

    // Never hard-redirect; do a targeted refetch instead.
    if (!lead && !isLoadingLead) {
        return (
            <div className="text-center p-8">
                <h2 className="text-xl font-semibold">Lead not found</h2>
                <p className="text-subtle mt-2">The requested lead could not be found.</p>
                <Link to="/leads" className="text-primary-500 mt-4 inline-block">Go back to leads list</Link>
            </div>
        );
    }

    if (!lead) return null; // Should not happen due to above logic
    
    return (
        <div className="space-y-6">
            {isWhatsAppModalOpen && <WhatsAppModal lead={editableLead} templates={whatsAppTemplates} currentUser={currentUser} onClose={() => setWhatsAppModalOpen(false)} onSend={handleSendWhatsApp} />}
            {isSmsModalOpen && <SMSModal lead={editableLead} templates={smsTemplates} currentUser={currentUser} onClose={() => setSmsModalOpen(false)} onSend={handleSendSMS} />}
            {isLogCallModalOpen && <LogCallModal leadId={editableLead.id} leadPhone={editableLead.phone} currentUser={currentUser} onClose={() => setLogCallModalOpen(false)} onCallLogged={(callData) => { const newActivity: Activity = { id: crypto.randomUUID(), type: 'CALL', content: `Call logged. Type: ${callData.callType}, Outcome: ${callData.outcome}, Duration: ${callData.duration || 0}s, Notes: ${callData.notes}`, timestamp: new Date().toISOString(), authorId: currentUser.id }; const updatedLead = { ...editableLead, activities: [newActivity, ...(editableLead.activities || [])] }; setEditableLead(updatedLead); onUpdateLead(updatedLead, originalLead); }} />}
            {isEmailModalOpen && <EmailModal lead={editableLead} currentUser={currentUser} onClose={() => setEmailModalOpen(false)} onEmailSent={handleEmailSent} />}
            {scheduleModal.open && scheduleModal.type && <ScheduleMessageModal lead={editableLead} currentUser={currentUser} type={scheduleModal.type} onClose={() => setScheduleModal({ open: false, type: null })} onSchedule={onScheduleMessage} />}

            {/* New Modal Components */}
            {isAddNoteModalOpen && editableLead && (
                <AddNoteModal
                    isOpen={isAddNoteModalOpen}
                    onClose={() => setIsAddNoteModalOpen(false)}
                    onSave={handleAddNote}
                    leadId={editableLead.id}
                    currentUser={currentUser}
                    isLoading={createNoteMutation.isPending}
                    onSaveComplete={handleNoteSaveComplete}
                />
            )}

            {isAddTaskModalOpen && editableLead && (
                <AddTaskModal
                    isOpen={isAddTaskModalOpen}
                    onClose={() => setIsAddTaskModalOpen(false)}
                    onSave={handleAddTask}
                    leadId={editableLead.id}
                    currentUser={currentUser}
                    users={users}
                    isLoading={createTaskMutation.isPending}
                    onSaveComplete={handleTaskSaveComplete}
                />
            )}
            
             {/* Micro-UI Syncing Ribbon */}
             {showSyncingRibbon && (
                 <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg px-4 py-2 flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300">
                     <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                     <span>Syncing latest data...</span>
                 </div>
             )}

             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <h1 className="text-3xl font-bold text-on-surface">{editableLead.name}</h1>
                 <Link to="/leads" className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg w-full sm:w-auto text-center">
                     Back to Leads List
                 </Link>
             </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Left Column: Details */}
                <div className="lg:col-span-1 bg-surface p-6 rounded-xl shadow-sm border border-muted">
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

                    <div className="flex-shrink-0 p-4 border-b border-muted">
                        <div className="flex flex-wrap gap-2 justify-center">
                            {/* Log Call Button */}
                            <div className="relative group">
                                <button
                                    onClick={() => setLogCallModalOpen(true)}
                                    disabled={!editableLead.phone}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        editableLead.phone
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                            : 'bg-muted text-subtle cursor-not-allowed opacity-50'
                                    }`}
                                    title={!editableLead.phone ? 'Phone number required to log calls' : 'Log a call'}
                                >
                                    <AppIcons.Call className="h-4 w-4" />
                                    Log Call
                                </button>
                                {!editableLead.phone && (
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        Phone number required
                                    </div>
                                )}
                            </div>

                            {/* WhatsApp Button */}
                            <div className="relative group">
                                <button
                                    onClick={() => setWhatsAppModalOpen(true)}
                                    disabled={!editableLead.phone}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        editableLead.phone
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : 'bg-muted text-subtle cursor-not-allowed opacity-50'
                                    }`}
                                    title={!editableLead.phone ? 'Phone number required for WhatsApp' : 'Send WhatsApp message'}
                                >
                                    <AppIcons.Whatsapp className="h-4 w-4" />
                                    WhatsApp
                                </button>
                                {!editableLead.phone && (
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        Phone number required
                                    </div>
                                )}
                            </div>

                            {/* SMS Button */}
                            <div className="relative group">
                                <button
                                    onClick={() => setSmsModalOpen(true)}
                                    disabled={!editableLead.phone}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        editableLead.phone
                                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                            : 'bg-muted text-subtle cursor-not-allowed opacity-50'
                                    }`}
                                    title={!editableLead.phone ? 'Phone number required for SMS' : 'Send SMS message'}
                                >
                                    <AppIcons.SMS className="h-4 w-4" />
                                    SMS
                                </button>
                                {!editableLead.phone && (
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        Phone number required
                                    </div>
                                )}
                            </div>

                            {/* Email Button */}
                            <div className="relative group">
                                <button
                                    onClick={() => setEmailModalOpen(true)}
                                    disabled={!editableLead.email}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        editableLead.email
                                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                            : 'bg-muted text-subtle cursor-not-allowed opacity-50'
                                    }`}
                                    title={!editableLead.email ? 'Email address required' : 'Send email'}
                                >
                                    <AppIcons.Email className="h-4 w-4" />
                                    Email
                                </button>
                                {!editableLead.email && (
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        Email address required
                                    </div>
                                )}
                            </div>

                            {/* Add Task Button */}
                            <button
                                onClick={() => setIsAddTaskModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
                                title="Add a new task"
                            >
                                <AppIcons.Tasks className="h-4 w-4" />
                                Add Task
                            </button>

                            {/* Add Note Button */}
                            <button
                                onClick={() => setIsAddNoteModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                                title="Add a note"
                            >
                                <AppIcons.Note className="h-4 w-4" />
                                Add Note
                            </button>
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 space-y-6">
                        {activeTab === 'activity' && (
                            <ActivityTimeline
                                activities={activities}
                                users={users}
                                currentUser={currentUser}
                                leadId={leadId}
                                onRefresh={refetchActivities}
                                realTime={false} // Disable real-time polling to prevent excessive requests
                                disableAutoRefresh={disableTimelineAutoRefresh}
                            />
                        )}
                        {activeTab === 'tasks' && (
                            <div className="space-y-2">
                                {leadTasks.map(task => (
                                      <div key={task._id || task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                                          <input type="checkbox" checked={task.isCompleted} onChange={() => onUpdateTask({...task, isCompleted: !task.isCompleted})} className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500" />
                                          <p className={`flex-grow text-sm ${task.isCompleted ? 'line-through text-subtle' : ''}`}>{task.title}</p>
                                          <p className="text-xs text-subtle">{new Date(task.dueDate).toLocaleDateString()}</p>
                                      </div>
                                 ))}
                                 {leadTasks.length === 0 && <p className="text-center text-subtle py-8">No tasks for this lead.</p>}
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




