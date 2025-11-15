import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Lead, User, Activity, Stage, Task, CustomFieldDefinition, WhatsAppTemplate, ScheduledMessage, SMSTemplate } from '../../types';
import { AppIcons } from '../ui/Icons';
import ScheduleMessageModal from '../leads/ScheduleMessageModal';
import LogCallModal from '../leads/LogCallModal';
import SMSModal from '../leads/SMSModal';
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


const AddTaskForm: React.FC<{ lead: Lead; onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'organizationId' | '_id'>) => void; onCancel: () => void; currentUser: User; }> = ({ lead, onAddTask, onCancel, currentUser }) => {
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('');
    const [reminderEnabled, setReminderEnabled] = useState(true);
    const dateInputRef = useRef<HTMLInputElement>(null);
    const timeInputRef = useRef<HTMLInputElement>(null);

    // Set default date to tomorrow at 9 AM
    useEffect(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);

        const dateStr = tomorrow.toISOString().split('T')[0];
        const timeStr = tomorrow.toTimeString().slice(0, 5);

        setDueDate(dateStr);
        setDueTime(timeStr);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        if (!dueDate || !dueTime) {
            alert('Please select a due date and time.');
            return;
        }

        // Combine date and time
        const dueDateTime = new Date(`${dueDate}T${dueTime}`);

        if (dueDateTime <= new Date()) {
            alert('Please select a future date and time.');
            return;
        }

        const newTask = {
            title,
            leadId: lead.id,
            assignedToId: lead.assignedToId,
            isCompleted: false,
            dueDate: dueDateTime.toISOString(),
            createdById: currentUser.id,
            organizationId: currentUser.organizationId,
            reminderEnabled: reminderEnabled
        };

        // Set up reminder if enabled
        if (reminderEnabled) {
            scheduleReminder(newTask, dueDateTime);
        }

        onAddTask(newTask);
        setTitle('');
        onCancel();
    };

    const scheduleReminder = (task: any, reminderTime: Date) => {
        const now = new Date();
        const timeUntilReminder = reminderTime.getTime() - now.getTime();

        if (timeUntilReminder > 0) {
            setTimeout(() => {
                showReminder(task);
            }, timeUntilReminder);
        }
    };

    const showReminder = (task: any) => {
        // Try to use browser notification first
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Task Reminder: ${task.title}`, {
                body: `Task for lead "${lead.name}" is due now`,
                icon: '/favicon.ico',
                tag: `task-${task.id}`
            });
        } else {
            // Fallback: Show custom popup
            showCustomReminder(task);
        }
    };

    const showCustomReminder = (task: any) => {
        // Create a custom reminder popup with app theme
        const reminderDiv = document.createElement('div');
        reminderDiv.id = 'task-reminder-popup';
        reminderDiv.innerHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-surface rounded-xl p-6 max-w-lg mx-4 shadow-2xl border border-muted">
                    <div class="flex items-center mb-6">
                        <div class="bg-primary-500 text-white rounded-full p-3 mr-4">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-on-surface">⏰ Task Reminder</h3>
                            <p class="text-sm text-subtle">Don't miss your important task!</p>
                        </div>
                    </div>

                    <div class="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 mb-6 border-l-4 border-primary-500">
                        <h4 class="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-2">
                            "${task.title}"
                        </h4>
                        <p class="text-primary-700 dark:text-primary-300 mb-3">
                            Hey there! You have an important task to complete for your lead <strong>"${lead.name}"</strong>.
                        </p>
                        <p class="text-primary-600 dark:text-primary-400 text-sm">
                            Completing this task will boost your performance and help convert more leads. Stay on top of your game! 🚀
                        </p>
                    </div>

                    <div class="flex gap-3 justify-end">
                        <button onclick="document.getElementById('task-reminder-popup').remove()"
                                class="bg-muted hover:bg-subtle/80 text-on-surface font-semibold py-2 px-6 rounded-lg transition-colors">
                            Remind me later
                        </button>
                        <button onclick="window.location.href='/leads/${lead.id}'"
                                class="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                            </svg>
                            Go to Task
                        </button>
                    </div>

                    <div class="mt-4 text-center">
                        <p class="text-xs text-subtle">
                            This reminder will auto-close in <span id="countdown">10</span> seconds
                        </p>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(reminderDiv);

        // Countdown timer
        let countdown = 10;
        const countdownElement = reminderDiv.querySelector('#countdown');
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdownElement) {
                countdownElement.textContent = countdown.toString();
            }
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                const popup = document.getElementById('task-reminder-popup');
                if (popup) popup.remove();
            }
        }, 1000);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            clearInterval(countdownInterval);
            const popup = document.getElementById('task-reminder-popup');
            if (popup) popup.remove();
        }, 10000);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4 bg-surface border border-muted rounded-lg">
            <div>
                <label className="block text-sm font-medium text-subtle mb-2">Task Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    autoFocus
                    className="w-full bg-background border border-muted p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-subtle mb-2">Due Date</label>
                    <div className="relative">
                        <input
                            ref={dateInputRef}
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full bg-background border border-muted p-3 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden [&::-webkit-datetime-edit-fields-wrapper]:bg-background [&::-webkit-datetime-edit-text]:text-on-surface [&::-webkit-datetime-edit-month-field]:text-on-surface [&::-webkit-datetime-edit-day-field]:text-on-surface [&::-webkit-datetime-edit-year-field]:text-on-surface"
                            min={new Date().toISOString().split('T')[0]}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => {
                                dateInputRef.current?.showPicker?.();
                            }}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 hover:text-primary-500 transition-colors"
                        >
                            <AppIcons.Calendar className="h-5 w-5 text-subtle hover:text-primary-500" />
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-subtle mb-2">Due Time</label>
                    <div className="relative">
                        <input
                            ref={timeInputRef}
                            type="time"
                            value={dueTime}
                            onChange={(e) => setDueTime(e.target.value)}
                            className="w-full bg-background border border-muted p-3 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden [&::-webkit-datetime-edit-fields-wrapper]:bg-background [&::-webkit-datetime-edit-text]:text-on-surface [&::-webkit-datetime-edit-hour-field]:text-on-surface [&::-webkit-datetime-edit-minute-field]:text-on-surface [&::-webkit-datetime-edit-ampm-field]:text-on-surface"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => {
                                timeInputRef.current?.showPicker?.();
                            }}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 hover:text-primary-500 transition-colors"
                        >
                            <AppIcons.Activity className="h-5 w-5 text-subtle hover:text-primary-500" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="reminder-enabled"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-muted rounded"
                />
                <label htmlFor="reminder-enabled" className="text-sm text-subtle">
                    Enable reminder notification
                </label>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-muted">
                <button type="button" onClick={onCancel} className="bg-muted hover:bg-subtle/20 text-on-surface font-semibold py-2 px-4 rounded-lg text-sm transition-colors">Cancel</button>
                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors">Add Task</button>
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
    onAddNote: (note: { content: string; leadId: string }) => void;
    onScheduleMessage: (message: Omit<ScheduledMessage, 'id' | 'organizationId'>) => void;
    onRefreshLeadById?: (leadId: string) => Promise<Lead | undefined>; // Add specific lead refresh function
    currentUser: User;
    isStandalone?: boolean; // New prop to indicate standalone mode
    isDedicatedPage?: boolean; // New prop for dedicated page layout
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


const LeadDetailPage: React.FC<LeadDetailPageProps> = ({ leads, users, tasks, pipelineStages, customFieldDefs, whatsAppTemplates, smsTemplates, onUpdateLead, onUpdateTask, onAddTask, onAddNote, onScheduleMessage, onRefreshLeadById, currentUser, isStandalone = false, isDedicatedPage = false }) => {
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

    const [activeTab, setActiveTab] = useState<'tasks' | 'scheduled'>('tasks');
    const [editableLead, setEditableLead] = useState<Lead | null>(lead || null);
    const [isWhatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
    const [isSmsModalOpen, setSmsModalOpen] = useState(false);
    const [isLogCallModalOpen, setLogCallModalOpen] = useState(false);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [scheduleModal, setScheduleModal] = useState<{ open: boolean, type: 'EMAIL' | 'WHATSAPP' | 'SMS' | null }>({ open: false, type: null });
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [unsavedFields, setUnsavedFields] = useState<Set<string>>(new Set());

    const originalLead = useMemo(() => lead, [lead]);
    const leadTasks = useMemo(() => tasks.filter(t => t.leadId === lead?.id), [tasks, lead?.id]);

    useEffect(() => {
        if (lead) {
            setEditableLead(lead);
        }
    }, [lead]);

    // Reset unsaved changes when lead is refreshed
    useEffect(() => {
        if (lead) {
            setHasUnsavedChanges(false);
            setUnsavedFields(new Set());
        }
    }, [lead]);

    // Simple refresh function with proper throttling
    const refreshLeadData = useCallback(async () => {
        if (onRefreshLeadById && editableLead?.id && !isRefreshing) {
            const now = Date.now();
            // Throttle requests to once per 5 seconds maximum
            if (now - lastRefreshTime < 5000) {
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
                    setHasUnsavedChanges(false);
                    setUnsavedFields(new Set());
                } else {
                    console.warn('No refreshed lead data received');
                }
            } catch (error) {
                console.error('Failed to refresh lead data:', error);
            } finally {
                setTimeout(() => {
                    setIsRefreshing(false);
                }, 1000);
            }
        }
    }, [onRefreshLeadById, editableLead?.id, isRefreshing, lastRefreshTime]);

    // Manual save approach - only update local state, not backend
    const handleFieldChangeLocal = useCallback((field: keyof Lead, value: any) => {
        if (!editableLead) return;

        // Update local state immediately
        const updatedLead = { ...editableLead, [field]: value };
        setEditableLead(updatedLead);

        // Track unsaved changes
        setHasUnsavedChanges(true);
        setUnsavedFields(prev => new Set(prev).add(field));
    }, [editableLead]);
    
    const handleFieldChange = async (field: keyof Lead, value: any) => {
        if (!editableLead) return;

        // Optimistic update - immediately update UI
        const updatedLead = { ...editableLead, [field]: value };
        setEditableLead(updatedLead);

        const oldValue = editableLead?.[field];
        const newValue = value;

        // Only create activity if value actually changed
        if (oldValue !== newValue) {
            // For dropdown fields (assignedToId, stage), create activity immediately
            if (field === 'assignedToId' || field === 'stage') {
                const fieldNames: Record<string, string> = {
                    assignedToId: 'Assigned To',
                    stage: 'Stage'
                };

                let activityContent = '';
                if (field === 'assignedToId') {
                    const oldUser = users.find(u => u.id === oldValue);
                    const newUser = users.find(u => u.id === newValue);
                    activityContent = `Assigned to ${newUser?.name || 'Unassigned'}`;
                } else if (field === 'stage') {
                    const oldStage = pipelineStages.find(s => s.id === oldValue);
                    const newStage = pipelineStages.find(s => s.id === newValue);
                    activityContent = `Stage changed to ${newStage?.name || 'Unknown'}`;
                }

                const newActivity: Activity = {
                    id: crypto.randomUUID(),
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

                // Save to backend immediately for dropdown changes
                if (leadWithActivity.id) {
                    setSaveStatus('saving');
                    try {
                        const { _id, createdAt, updatedAt, ...cleanLeadData } = leadWithActivity as any;
                        const leadDataWithId = { ...cleanLeadData, id: leadWithActivity.id };
                        await onUpdateLead(leadDataWithId as Lead, editableLead!);
                        setSaveStatus('saved');

                        setTimeout(() => {
                            refreshLeadData();
                        }, 2000);

                        setTimeout(() => setSaveStatus('idle'), 2000);
                    } catch (error) {
                        console.error('Failed to save lead:', error);
                        setSaveStatus('error');
                        setEditableLead(editableLead);
                        setTimeout(() => setSaveStatus('idle'), 3000);
                    }
                }
            } else {
                // For input fields (text, number like dealValue), track changes but don't save until manual save
                setHasUnsavedChanges(true);
                setUnsavedFields(prev => new Set(prev).add(field));
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
                id: crypto.randomUUID(),
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
                    refreshLeadData();

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

        setWhatsAppModalOpen(false);

        // Save to backend
        if (editableLead.id) {
            setSaveStatus('saving');
            try {
                // Create note via API - now saves directly to lead activities
                await onAddNote({ content: `Sent WhatsApp: "${message}"`, leadId: editableLead.id });
                setSaveStatus('saved');

                // Refresh data from backend to show the new activity immediately
                await refreshLeadData();

                // Trigger timeline refresh
                if (window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('timelineRefresh', { detail: { leadId: editableLead.id } }));
                }

                // Reset save status after 2 seconds
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error('Failed to save WhatsApp activity:', error);
                setSaveStatus('error');

                // Reset error status after 3 seconds
                setTimeout(() => setSaveStatus('idle'), 3000);
            }
        }
    };

    const handleSendSMS = async (message: string) => {
        if (!editableLead || !originalLead) return;

        setSmsModalOpen(false);

        // Save to backend
        if (editableLead.id) {
            setSaveStatus('saving');
            try {
                // Create note via API - now saves directly to lead activities
                await onAddNote({ content: `Sent SMS: "${message}"`, leadId: editableLead.id });
                setSaveStatus('saved');

                // Refresh data from backend to show the new activity immediately
                await refreshLeadData();

                // Trigger timeline refresh
                if (window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('timelineRefresh', { detail: { leadId: editableLead.id } }));
                }

                // Reset save status after 2 seconds
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error('Failed to save SMS activity:', error);
                setSaveStatus('error');

                // Reset error status after 3 seconds
                setTimeout(() => setSaveStatus('idle'), 3000);
            }
        }
    };

    const handleLogCall = async (outcome: string, notes: string) => {
        if (!editableLead || !originalLead) return;

        setLogCallModalOpen(false);

        // Save to backend
        if (editableLead.id) {
            setSaveStatus('saving');
            try {
                // Create note via API - now saves directly to lead activities
                await onAddNote({ content: `Logged call. Outcome: ${outcome}. Notes: "${notes}"`, leadId: editableLead.id });
                setSaveStatus('saved');

                // Refresh data from backend to show the new activity immediately
                await refreshLeadData();

                // Trigger timeline refresh
                if (window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('timelineRefresh', { detail: { leadId: editableLead.id } }));
                }

                // Reset save status after 2 seconds
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error('Failed to save call log:', error);
                setSaveStatus('error');

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

        const noteText = noteContent.trim();

        setIsNoteModalOpen(false);
        setNoteContent('');

        // Save to backend first (no optimistic update to prevent duplicates)
        if (editableLead.id) {
            setSaveStatus('saving');
            try {
                // Create note via API - now saves directly to lead activities
                await onAddNote({ content: noteText, leadId: editableLead.id });
                setSaveStatus('saved');

                // Refresh data from backend to show the new note immediately
                await refreshLeadData();

                // Trigger timeline refresh
                if (window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('timelineRefresh', { detail: { leadId: editableLead.id } }));
                }

                // Reset save status after 2 seconds
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error('Failed to save note:', error);
                setSaveStatus('error');

                // Reset error status after 3 seconds
                setTimeout(() => setSaveStatus('idle'), 3000);
            }
        }
    };
    
    // Manual save function
     const handleManualSave = async () => {
         if (!editableLead || !originalLead) return;

         setSaveStatus('saving');
         try {
             // Remove system fields before sending to backend
             const { _id, createdAt, updatedAt, ...cleanLeadData } = editableLead as any;
             // Ensure the lead ID is preserved for the backend to find the lead
             const leadDataWithId = { ...cleanLeadData, id: editableLead.id };

             await onUpdateLead(leadDataWithId as Lead, originalLead);
             setSaveStatus('saved');

             // Clear unsaved changes indicators
             setHasUnsavedChanges(false);
             setUnsavedFields(new Set());

             // Trigger timeline refresh for field updates
             if (window.dispatchEvent) {
                 window.dispatchEvent(new CustomEvent('timelineRefresh', { detail: { leadId: editableLead.id } }));
             }

             // Reset save status after 2 seconds
             setTimeout(() => setSaveStatus('idle'), 2000);
         } catch (error) {
             console.error('Failed to save lead:', error);
             setSaveStatus('error');

             // Reset error status after 3 seconds
             setTimeout(() => setSaveStatus('idle'), 3000);
         }
     };

    // Manual save approach - no auto-save on unmount
    useEffect(() => {
        // No auto-save functionality needed for manual save approach
        return () => {
            // Component cleanup - no auto-save
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    // Dedicated page layout (without sidebar)
    if (isDedicatedPage) {
        return (
            <div className="min-h-screen bg-background">
                {/* Sticky Header */}
                <div className="sticky top-0 z-50 bg-surface border-b border-muted shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center gap-4">
                                <Link to="/leads" className="flex items-center gap-2 text-subtle hover:text-on-surface">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back to Leads
                                </Link>
                                <div className="h-6 w-px bg-muted"></div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-semibold text-on-surface">{editableLead.name}</h1>
                                    <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                                        {pipelineStages.find(s => s.id === editableLead.stage)?.name || 'Unknown Stage'}
                                    </span>
                                    <span className="text-sm text-subtle">
                                        {users.find(u => u.id === editableLead.assignedToId)?.name || 'Unassigned'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {hasUnsavedChanges && (
                                    <div className="flex items-center gap-2 text-orange-500 mr-4">
                                        <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse"></div>
                                        <span className="text-sm">Unsaved changes</span>
                                    </div>
                                )}
                                <button
                                    onClick={handleManualSave}
                                    disabled={saveStatus === 'saving'}
                                    className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2"
                                >
                                    {saveStatus === 'saving' ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Save Changes {unsavedFields.size > 0 && `(${unsavedFields.size})`}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Panel - Contact & Deal Info */}
                        <div className="lg:col-span-1">
                            <div className="bg-surface rounded-xl shadow-sm border border-muted p-6">
                                <h2 className="text-lg font-semibold text-on-surface mb-4">Contact & Deal Information</h2>
                                <div className="space-y-6">
                                    {/* Contact Information */}
                                    <div>
                                        <h3 className="text-sm font-medium text-subtle mb-3">Contact Details</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-medium text-subtle">Name</label>
                                                <input type="text" value={editableLead.name} onChange={e => handleFieldChangeLocal('name', e.target.value)} className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-subtle">Email</label>
                                                <input type="email" value={editableLead.email} onChange={e => handleFieldChangeLocal('email', e.target.value)} className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-subtle">Phone</label>
                                                <input type="tel" value={editableLead.phone} onChange={e => handleFieldChangeLocal('phone', e.target.value)} className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-subtle">Alternate Phone</label>
                                                <input type="tel" value={editableLead.alternatePhone} onChange={e => handleFieldChangeLocal('alternatePhone', e.target.value)} className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-subtle">Company</label>
                                                <input type="text" value={editableLead.company} onChange={e => handleFieldChangeLocal('company', e.target.value)} className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-subtle">City</label>
                                                <input type="text" value={editableLead.city} onChange={e => handleFieldChangeLocal('city', e.target.value)} className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-subtle">Source</label>
                                                <select value={editableLead.source} onChange={e => handleFieldChangeLocal('source', e.target.value)} className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500">
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
                                                <select value={editableLead.assignedToId} onChange={e => handleFieldChangeLocal('assignedToId', parseInt(e.target.value))} className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500">
                                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Deal Information */}
                                    <div>
                                        <h3 className="text-sm font-medium text-subtle mb-3">Deal Details</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-medium text-subtle">Pipeline Stage</label>
                                                <select value={editableLead.stage} onChange={e => handleFieldChangeLocal('stage', e.target.value)} className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500">
                                                    {pipelineStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-subtle">Deal Value</label>
                                                <input type="number" value={editableLead.dealValue} onChange={e => handleFieldChangeLocal('dealValue', Number(e.target.value))} className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-subtle">Course Interest</label>
                                                <input type="text" value={editableLead.course} onChange={e => handleFieldChangeLocal('course', e.target.value)} className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-subtle">Lead Score</label>
                                                <input type="number" value={editableLead.score} onChange={e => handleFieldChangeLocal('score', Number(e.target.value))} className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Marketing Information */}
                                    <div>
                                        <h3 className="text-sm font-medium text-subtle mb-3">Marketing Details</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-medium text-subtle">Campaign</label>
                                                <input type="text" value={editableLead.campaign} onChange={e => handleFieldChangeLocal('campaign', e.target.value)} className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-subtle">Tags</label>
                                                <input type="text" value={Array.isArray(editableLead.tags) ? editableLead.tags.join(', ') : ''} onChange={e => handleFieldChangeLocal('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Comma-separated tags" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Facebook Details */}
                                    <div>
                                        <h3 className="text-sm font-medium text-subtle mb-3">Facebook Information</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-medium text-subtle">Facebook Campaign</label>
                                                <input type="text" value={editableLead.facebookCampaign || ''} onChange={e => handleFieldChangeLocal('facebookCampaign', e.target.value)} className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-subtle">Facebook Adset</label>
                                                <input type="text" value={editableLead.facebookAdset || ''} onChange={e => handleFieldChangeLocal('facebookAdset', e.target.value)} className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-subtle">Facebook Ad</label>
                                                <input type="text" value={editableLead.facebookAd || ''} onChange={e => handleFieldChangeLocal('facebookAd', e.target.value)} className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Custom Fields */}
                                    {customFieldDefs.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-medium text-subtle mb-3">Custom Fields</h3>
                                            <div className="space-y-3">
                                                {customFieldDefs.map(def => (
                                                    <div key={def.id}>
                                                        <label className="text-xs font-medium text-subtle">{def.name}</label>
                                                        <input type={def.type === 'date' ? 'date' : 'text'} value={editableLead.customFields?.[def.id] as string || ''} onChange={e => {
                                                            const updatedCustomFields = { ...(editableLead.customFields || {}), [def.id]: e.target.value };
                                                            const updatedLead = { ...editableLead, customFields: updatedCustomFields };
                                                            setEditableLead(updatedLead);
                                                            setHasUnsavedChanges(true);
                                                            setUnsavedFields(prev => new Set(prev).add(`customField_${def.id}`));
                                                        }} className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Panel - Activity & Actions */}
                        <div className="lg:col-span-2">
                            <div className="bg-surface rounded-xl shadow-sm border border-muted overflow-hidden">
                                {/* Action Buttons */}
                                <div className="p-4 border-b border-muted">
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => setLogCallModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-subtle/50 text-on-surface rounded-lg">
                                            <AppIcons.Call className="h-4 w-4"/>
                                            <span className="text-sm">Log Call</span>
                                        </button>
                                        <button onClick={() => setWhatsAppModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-subtle/50 text-on-surface rounded-lg">
                                            <AppIcons.Whatsapp className="h-4 w-4"/>
                                            <span className="text-sm">WhatsApp</span>
                                        </button>
                                        <button onClick={() => setSmsModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-subtle/50 text-on-surface rounded-lg">
                                            <AppIcons.SMS className="h-4 w-4"/>
                                            <span className="text-sm">SMS</span>
                                        </button>
                                        <button onClick={() => setIsAddingTask(true)} className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-subtle/50 text-on-surface rounded-lg">
                                            <AppIcons.Tasks className="h-4 w-4"/>
                                            <span className="text-sm">Add Task</span>
                                        </button>
                                        <button onClick={() => handleAddNote()} className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-subtle/50 text-on-surface rounded-lg">
                                            <AppIcons.Note className="h-4 w-4"/>
                                            <span className="text-sm">Add Note</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="border-b border-muted">
                                    <div className="flex">
                                        <button onClick={() => setActiveTab('tasks')} className={`relative px-4 py-3 text-sm font-medium ${activeTab === 'tasks' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-subtle hover:text-on-surface'}`}>
                                            Tasks
                                            {leadTasks.filter(t => !t.isCompleted).length > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-white text-xs">{leadTasks.filter(t => !t.isCompleted).length}</span></span>}
                                        </button>
                                        <button onClick={() => setActiveTab('scheduled')} className={`relative px-4 py-3 text-sm font-medium ${activeTab === 'scheduled' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-subtle hover:text-on-surface'}`}>
                                            Scheduled
                                            {(editableLead.scheduledMessages || []).length > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 items-center justify-center text-white text-xs">{(editableLead.scheduledMessages || []).length}</span></span>}
                                        </button>
                                    </div>
                                </div>

                                {/* Tab Content */}
                                <div className="p-4 max-h-96 overflow-y-auto">
                                    {activeTab === 'tasks' && (
                                        <div className="space-y-2">
                                            {isAddingTask && <AddTaskForm lead={editableLead} onAddTask={onAddTask} onCancel={() => setIsAddingTask(false)} currentUser={currentUser}/>}
                                            {leadTasks.map(task => (
                                                <div key={task.id || task._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                                                    <input
                                                        type="checkbox"
                                                        checked={task.isCompleted}
                                                        onChange={() => onUpdateTask({...task, isCompleted: !task.isCompleted})}
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
                                        <div className="space-y-3">
                                            {(editableLead.scheduledMessages || []).map(msg => (
                                                <div key={msg.id} className="p-3 bg-muted rounded-lg">
                                                    <p className="text-sm font-semibold">{msg.type} scheduled for {new Date(msg.scheduledAt).toLocaleString()}</p>
                                                    <p className="text-sm text-subtle mt-1">"{msg.content}"</p>
                                                </div>
                                            ))}
                                            {(editableLead.scheduledMessages || []).length === 0 && <p className="text-center text-subtle py-8">No messages scheduled.</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modals */}
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
            </div>
        );
    }

    // Original layout (with sidebar)
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
                    {hasUnsavedChanges && (
                        <div className="flex items-center gap-2 text-orange-500">
                            <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse"></div>
                            <span className="text-sm">Unsaved changes</span>
                        </div>
                    )}
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
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {hasUnsavedChanges && (
                        <button
                            onClick={handleManualSave}
                            disabled={saveStatus === 'saving'}
                            className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
                        >
                            {saveStatus === 'saving' ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Save Changes {unsavedFields.size > 0 && `(${unsavedFields.size})`}
                                </>
                            )}
                        </button>
                    )}
                    {!isStandalone && (
                        <Link to="/leads" className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg text-center">
                            Back to Leads List
                        </Link>
                    )}
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Left Column: Details */}
                <div className="lg:col-span-1 bg-surface p-6 rounded-xl shadow-sm border border-muted">
                    <CollapsibleSection title="Contact Information" initiallyOpen={true}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-subtle">Name</label>
                                <input type="text" value={editableLead.name} onChange={e => handleFieldChangeLocal('name', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-subtle">Email</label>
                                <input type="email" value={editableLead.email} onChange={e => handleFieldChangeLocal('email', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-subtle">Phone</label>
                                <input type="tel" value={editableLead.phone} onChange={e => handleFieldChangeLocal('phone', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-subtle">Alternate Phone</label>
                                <input type="tel" value={editableLead.alternatePhone} onChange={e => handleFieldChangeLocal('alternatePhone', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-subtle">Company</label>
                                <input type="text" value={editableLead.company} onChange={e => handleFieldChangeLocal('company', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-subtle">City</label>
                                <input type="text" value={editableLead.city} onChange={e => handleFieldChangeLocal('city', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-subtle">Source</label>
                                <select value={editableLead.source} onChange={e => handleFieldChangeLocal('source', e.target.value)} className="w-full bg-transparent py-1 text-on-surface focus:outline-none border-b border-transparent focus:border-primary-500">
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
                                <select value={editableLead.assignedToId} onChange={e => handleFieldChangeLocal('assignedToId', parseInt(e.target.value))} className="w-full bg-transparent py-1 text-on-surface focus:outline-none border-b border-transparent focus:border-primary-500">
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </CollapsibleSection>
                    <CollapsibleSection title="Deal Information">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-subtle">Pipeline Stage</label>
                                <select value={editableLead.stage} onChange={e => handleFieldChangeLocal('stage', e.target.value)} className="w-full bg-transparent py-1 text-on-surface focus:outline-none border-b border-transparent focus:border-primary-500">
                                    {pipelineStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-subtle">Deal Value</label>
                                <input type="number" value={editableLead.dealValue} onChange={e => handleFieldChangeLocal('dealValue', Number(e.target.value))} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-subtle">Course Interest</label>
                                <input type="text" value={editableLead.course} onChange={e => handleFieldChangeLocal('course', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-subtle">Lead Score</label>
                                <input type="number" value={editableLead.score} onChange={e => handleFieldChangeLocal('score', Number(e.target.value))} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                            </div>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Marketing Information">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-subtle">Campaign</label>
                                <input type="text" value={editableLead.campaign} onChange={e => handleFieldChangeLocal('campaign', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-subtle">Tags</label>
                                <input type="text" value={Array.isArray(editableLead.tags) ? editableLead.tags.join(', ') : ''} onChange={e => handleFieldChangeLocal('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" placeholder="Comma-separated tags" />
                            </div>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Facebook Details">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-subtle">Facebook Campaign</label>
                                <input type="text" value={editableLead.facebookCampaign || ''} onChange={e => handleFieldChangeLocal('facebookCampaign', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-subtle">Facebook Adset</label>
                                <input type="text" value={editableLead.facebookAdset || ''} onChange={e => handleFieldChangeLocal('facebookAdset', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-medium text-subtle">Facebook Ad</label>
                                <input type="text" value={editableLead.facebookAd || ''} onChange={e => handleFieldChangeLocal('facebookAd', e.target.value)} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                            </div>
                        </div>
                    </CollapsibleSection>
                     {customFieldDefs.length > 0 && <CollapsibleSection title="Custom Fields">
                         {customFieldDefs.map(def => (
                             <div key={def.id}>
                                 <label className="text-xs font-medium text-subtle">{def.name}</label>
                                 <input type={def.type === 'date' ? 'date' : 'text'} value={editableLead.customFields?.[def.id] as string || ''} onChange={e => {
                                     // Update local state for custom fields
                                     const updatedCustomFields = { ...(editableLead.customFields || {}), [def.id]: e.target.value };
                                     const updatedLead = { ...editableLead, customFields: updatedCustomFields };
                                     setEditableLead(updatedLead);

                                     // Track unsaved changes
                                     setHasUnsavedChanges(true);
                                     setUnsavedFields(prev => new Set(prev).add(`customField_${def.id}`));
                                 }} className="w-full bg-transparent border-b border-muted py-1 text-on-surface focus:outline-none focus:border-primary-500" />
                             </div>
                        ))}
                    </CollapsibleSection>}
                </div>


                {/* Right Column: Activity */}
                <div className="lg:col-span-2 flex flex-col overflow-hidden bg-surface rounded-xl shadow-sm border border-muted">
                    <div className="flex-shrink-0 p-2 flex flex-wrap items-center justify-between gap-2 border-b border-muted">
                        <div className="flex items-center">
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


