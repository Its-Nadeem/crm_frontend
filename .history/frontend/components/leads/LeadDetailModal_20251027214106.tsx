import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Lead, User, Activity, Stage, Task, CustomFieldDefinition, WhatsAppTemplate, ScheduledMessage, SMSTemplate } from '../../types';
import { AppIcons } from '../ui/Icons';
import Modal from '../ui/Modal';
import ScheduleMessageModal from './ScheduleMessageModal';
import LogCallModal from './LogCallModal';
import SMSModal from './SMSModal';
import { AddNoteModal } from '../../src/components/leads/AddNoteModal';
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
            console.error('Message Required: Please enter a message before sending.');
            return;
        }
        console.log(`Sending WhatsApp to ${lead.phone}: "${message}"`);
        console.log(`WhatsApp Sent: Message sent to ${lead.name} at ${lead.phone}`);
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
                        <option value="" className="bg-background text-on-surface">Select a template</option>
                        {templates.map(t => <option key={t.id} value={t.id} className="bg-background text-on-surface">{t.name}</option>)}
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


const AddTaskForm: React.FC<{ lead: Lead; onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'organizationId' | '_id'>) => void; onCancel: () => void; currentUser: User; onTaskCreated?: () => void; }> = ({ lead, onAddTask, onCancel, currentUser, onTaskCreated }) => {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('AddTaskForm: handleSubmit called with title:', title);

        if (!title.trim()) {
            console.error('Task Title Required: Please enter a title for the task.');
            return;
        }

        if (!dueDate || !dueTime) {
            console.error('Date and Time Required: Please select a due date and time.');
            return;
        }

        try {
            // Combine date and time
            const dueDateTime = new Date(`${dueDate}T${dueTime}`);

            if (dueDateTime <= new Date()) {
                console.error('Invalid Date/Time: Please select a future date and time.');
                return;
            }

            const newTask = {
                title: title.trim(),
                leadId: lead.id,
                assignedToId: lead.assignedToId,
                isCompleted: false,
                dueDate: dueDateTime.toISOString(),
                createdById: currentUser.id,
                organizationId: lead.organizationId,
                reminderEnabled: reminderEnabled
            };

            console.log('AddTaskForm: Creating task:', newTask);

            // Create task in backend
            const createdTask = await apiService.createTask(newTask);
            console.log('AddTaskForm: Task created successfully:', createdTask);

            // Set up reminder if enabled
            if (reminderEnabled) {
                scheduleReminder(createdTask, dueDateTime);
            }

            // Call the parent callback to update local state
            onAddTask(createdTask);

            // Call the callback to refresh data
            if (onTaskCreated) {
                console.log('AddTaskForm: Calling onTaskCreated callback');
                onTaskCreated();
            }

            setTitle('');
            onCancel();

            // Show success message
            console.log('Task Created: Task has been created successfully!');
        } catch (error) {
            console.error('AddTaskForm: Error creating task:', error);
            console.error('Task Creation Failed:', error.message || 'Please try again.');
        }
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

        // Countdown timer (display only, no auto-close)
        let countdown = 10;
        const countdownElement = reminderDiv.querySelector('#countdown');
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdownElement) {
                countdownElement.textContent = countdown.toString();
            }
            // Keep counting down indefinitely for display purposes
        }, 1000);
    };

    return (
        <form onSubmit={(e) => {
            console.log('AddTaskForm: Form submitted');
            handleSubmit(e);
        }} className="p-4 space-y-4 bg-surface border border-muted rounded-lg">
            <div>
                <label className="block text-sm font-medium text-subtle mb-2">Task Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                    }}
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
                <button type="button" onClick={() => {
                    console.log('AddTaskForm: Cancel button clicked');
                    onCancel();
                }} className="bg-muted hover:bg-subtle/20 text-on-surface font-semibold py-2 px-4 rounded-lg text-sm transition-colors">Cancel</button>
                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors">Add Task</button>
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
    const [activeTab, setActiveTab] = useState<'tasks' | 'scheduled'>('tasks');
    const [editableLead, setEditableLead] = useState<Lead>(lead);
    const [isWhatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
    const [isSmsModalOpen, setSmsModalOpen] = useState(false);
    const [isLogCallModalOpen, setLogCallModalOpen] = useState(false);
    const [isAddingTask, setIsAddingTask] = useState(false);

    // Debug logging for state changes
    useEffect(() => {
        console.log('LeadDetailModal: isAddingTask changed to:', isAddingTask);
    }, [isAddingTask]);
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [scheduleModal, setScheduleModal] = useState<{ open: boolean, type: 'EMAIL' | 'WHATSAPP' | 'SMS' | null }>({ open: false, type: null });
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [notes, setNotes] = useState<any[]>([]);
    const [calls, setCalls] = useState<any[]>([]);
    const [leadTasks, setLeadTasks] = useState<any[]>([]);

    const originalLead = useMemo(() => lead, [lead]);
    const [changeLog, setChangeLog] = useState<string[]>([]);

    // Load notes, calls, and tasks for the lead
    const loadNotesAndCalls = useCallback(async () => {
        try {
            const [notesData, callsData, tasksData] = await Promise.all([
                apiService.getNotes(lead.id),
                apiService.getCalls(lead.id),
                apiService.getTasks(lead.organizationId)
            ]);
            setNotes(notesData || []);
            setCalls(callsData || []);
            setLeadTasks(tasksData.filter((t: any) => t.leadId === lead.id) || []);
        } catch (error) {
            console.error('Error loading notes, calls, and tasks:', error);
        }
    }, [lead.id, lead.organizationId]);

    useEffect(() => {
        loadNotesAndCalls();
    }, [loadNotesAndCalls]);

    // Utility function to clear all auth data
    const clearAuthData = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sessionId');
        localStorage.removeItem('activeSessions');
    };

    // Utility function to validate current token
    const validateToken = () => {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (token && token.split('.').length === 3) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return true;
            } catch (e) {
                console.warn('Token validation failed, clearing corrupted token');
                clearAuthData();
                return false;
            }
        }
        return false;
    };

    useEffect(() => {
        setEditableLead(lead);
        setHasUnsavedChanges(false);
        setChangeLog([]);
    }, [lead]);

    const handleFieldChange = (field: keyof Lead, value: any) => {
        const oldValue = originalLead[field];
        const newValue = value;

        // Always update the editable lead
        setEditableLead(prev => ({ ...prev, [field]: value }));

        // Only track changes if values are actually different
        if (oldValue !== newValue) {
            setHasUnsavedChanges(true);

            // Create change description
            let changeDescription = '';
            if (field === 'assignedToId') {
                const oldUser = users.find(u => u.id === oldValue);
                const newUser = users.find(u => u.id === newValue);
                changeDescription = `Assigned to ${newUser?.name || 'Unassigned'}`;
            } else if (field === 'stage') {
                const oldStage = pipelineStages.find(s => s.id === oldValue);
                const newStage = pipelineStages.find(s => s.id === newValue);
                changeDescription = `Stage changed to ${newStage?.name || 'Unknown'}`;
            } else if (field === 'dealValue') {
                changeDescription = `Deal value updated to ${newValue}`;
            } else {
                changeDescription = `${field} updated`;
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
    
    const handleSendWhatsApp = async (message: string) => {
        try {
            // Create WhatsApp activity in backend
            console.log('Creating WhatsApp note:', { content: `Sent WhatsApp: "${message}"`, leadId: lead.id });
            const result = await apiService.createNote({
                content: `Sent WhatsApp: "${message}"`,
                leadId: lead.id
            });
            console.log('WhatsApp note created successfully:', result);

            // Also create a local activity for immediate display
            const newActivity: Activity = {
                id: `temp-whatsapp-${Date.now()}`,
                type: 'WHATSAPP',
                content: `Sent WhatsApp: <i class="whitespace-pre-wrap">"${message}"</i>`,
                timestamp: new Date().toISOString(),
                authorId: currentUser.id
            };

            // Add to editable lead activities immediately
            setEditableLead(prev => ({
                ...prev,
                activities: [newActivity, ...(prev.activities || [])]
            }));

            // Reload notes and calls to show the new activity
            await loadNotesAndCalls();

            setWhatsAppModalOpen(false);
        } catch (error) {
            console.error('Error sending WhatsApp:', error);
            console.error('WhatsApp Error:', error.message || 'Please try again.');
        }
    };

    const handleSendSMS = async (message: string) => {
        try {
            // Create SMS activity in backend
            console.log('Creating SMS note:', { content: `Sent SMS: "${message}"`, leadId: lead.id });
            const result = await apiService.createNote({
                content: `Sent SMS: "${message}"`,
                leadId: lead.id
            });
            console.log('SMS note created successfully:', result);

            // Also create a local activity for immediate display
            const newActivity: Activity = {
                id: `temp-sms-${Date.now()}`,
                type: 'SMS',
                content: `Sent SMS: <i class="whitespace-pre-wrap">"${message}"</i>`,
                timestamp: new Date().toISOString(),
                authorId: currentUser.id
            };

            // Add to editable lead activities immediately
            setEditableLead(prev => ({
                ...prev,
                activities: [newActivity, ...(prev.activities || [])]
            }));

            // Reload notes and calls to show the new activity
            await loadNotesAndCalls();

            setSmsModalOpen(false);
        } catch (error) {
            console.error('Error sending SMS:', error);
            console.error('SMS Error:', error.message || 'Please try again.');
        }
    };

   const handleLogCall = async (outcome: string, notes: string) => {
       try {
           // Create call log in backend
           console.log('Creating call log:', { leadId: lead.id, outcome, notes, callType: 'outbound' });
           const result = await apiService.createCall({
               leadId: lead.id,
               outcome,
               notes,
               callType: 'outbound'
           });
           console.log('Call logged successfully:', result);

           // Reload notes and calls to show the new activity
           await loadNotesAndCalls();

           setLogCallModalOpen(false);
       } catch (error) {
           console.error('Error logging call:', error);
           console.error('Call Logging Failed:', error.message || 'Please try again.');
       }
   };

   const handleAddNote = async (noteContent: string) => {
       try {
           // Create note in backend
           console.log('Creating note:', { content: `Note: "${noteContent}"`, leadId: lead.id });
           const result = await apiService.createNote({
               content: `Note: "${noteContent}"`,
               leadId: lead.id
           });
           console.log('Note created successfully:', result);

           // Also create a local activity for immediate display
           const newActivity: Activity = {
               id: `temp-note-${Date.now()}`,
               type: 'NOTE',
               content: `Note: <i class="whitespace-pre-wrap">"${noteContent}"</i>`,
               timestamp: new Date().toISOString(),
               authorId: currentUser.id
           };

           // Add to editable lead activities immediately
           setEditableLead(prev => ({
               ...prev,
               activities: [newActivity, ...(prev.activities || [])]
           }));

           // Reload notes and calls to show the new activity
           await loadNotesAndCalls();

           setIsAddingNote(false);
       } catch (error) {
           console.error('Error adding note:', error);
           console.error('Note Creation Failed:', error.message || 'Please try again.');
       }
   };
    
    const handleSave = async () => {
        if (!hasUnsavedChanges) {
            onClose();
            return;
        }

        // Validate token before attempting save
        if (!validateToken()) {
            alert('Your session has expired. Please refresh the page and log in again.');
            clearAuthData();
            setTimeout(() => window.location.reload(), 1000);
            return;
        }

        setIsSaving(true);
        console.log('Starting save process for lead:', editableLead.id);

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

            console.log('Sending data to backend:', leadDataToSend);

            // Update lead in backend
            const updatedLead = await apiService.updateLead(editableLead.id, leadDataToSend);
            console.log('Backend response received successfully:', updatedLead._id);

            // Create activity log for changes if there are changes
            let finalLeadToUpdate = updatedLead;
            if (changeLog.length > 0) {
                const activityContent = `Lead updated: ${changeLog.join(', ')}`;
                const newActivity: Activity = {
                    id: faker.string.uuid(),
                    type: 'FIELD_UPDATE',
                    content: activityContent,
                    timestamp: new Date().toISOString(),
                    authorId: currentUser.id
                };

                finalLeadToUpdate = {
                    ...updatedLead,
                    activities: [newActivity, ...(updatedLead.activities || [])]
                };
            }

            // Update parent component state (this should not trigger another API call)
            // Pass the updated lead with _id to indicate it's already from API
            onUpdateLead(finalLeadToUpdate, originalLead);

            setHasUnsavedChanges(false);
            setChangeLog([]);
            setShowSaveSuccess(true);
            console.log('Save process completed successfully');

            // Hide success message after 2 seconds
            setTimeout(() => {
                setShowSaveSuccess(false);
                onClose();
            }, 2000);

        } catch (error) {
            console.error('Error saving lead:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                status: error.status,
                response: error.response
            });

            // Handle authentication errors specifically
            if (error.message && (error.message.includes('401') || error.message.includes('invalid') || error.message.includes('unauthorized'))) {
                alert('Your session has expired or is invalid. Please refresh the page and log in again.');
                // Clear all stored authentication data
                clearAuthData();

                // Force page reload to login page
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else if (error.message && error.message.includes('Cannot connect to server')) {
                alert('Cannot connect to server. Please ensure the backend server is running and try again.');
            } else {
                alert(`Failed to save changes: ${error.message || 'Unknown error'}. Check console for details.`);
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
            {isAddingNote && <AddNoteModal isOpen={isAddingNote} onClose={() => setIsAddingNote(false)} onSave={(noteData) => handleAddNote(noteData.content)} leadId={editableLead.id} currentUser={currentUser} />}
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
                        onClick={() => {
                            if (window.confirm('This will clear all authentication data and require you to log in again. Continue?')) {
                                clearAuthData();
                                alert('Authentication data cleared. Please refresh the page to log in again.');
                                setTimeout(() => window.location.reload(), 1000);
                            }
                        }}
                        className="px-3 py-2 rounded-lg font-semibold text-sm bg-red-600 hover:bg-red-700 text-white"
                        title="Clear authentication data if you're having login issues"
                    >
                        🔑 Clear Auth
                    </button>
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
                             <select value={editableLead.assignedToId} onChange={e => handleFieldChange('assignedToId', parseInt(e.target.value))} className="w-full bg-background border border-muted py-1 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 rounded">
                               <option value={0} className="bg-background text-on-surface">System</option>
                               {users.map(u => <option key={u.id} value={u.id} className="bg-background text-on-surface">{u.name}</option>)}
                             </select>
                        </div>
                    </CollapsibleSection>
                    <CollapsibleSection title="Deal Info">
                        <div>
                            <label className="text-xs font-medium text-subtle">Pipeline Stage</label>
                             <select value={editableLead.stage} onChange={e => handleFieldChange('stage', e.target.value)} className="w-full bg-background border border-muted py-1 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 rounded">
                               {pipelineStages.map(s => <option key={s.id} value={s.id} className="bg-background text-on-surface">{s.name}</option>)}
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
                                             className="w-full bg-background border border-muted py-1 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                                             required={def.isRequired}
                                         >
                                             <option value="" className="bg-background text-on-surface">Select {def.name}</option>
                                             {def.options?.map(option => (
                                                 <option key={option} value={option} className="bg-background text-on-surface">{option}</option>
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
                        <button onClick={() => {
                            console.log('Add Task button clicked, setting isAddingTask to true and switching to tasks tab');
                            setIsAddingTask(true);
                            setActiveTab('tasks'); // Switch to tasks tab when Add Task is clicked
                        }} className="flex-1 text-sm flex items-center justify-center gap-2 p-2 bg-muted rounded-lg hover:bg-primary-500/10 hover:text-primary-500"><AppIcons.Tasks className="h-4 w-4"/>Add Task</button>
                        <button onClick={() => setIsAddingNote(true)} className="flex-1 text-sm flex items-center justify-center gap-2 p-2 bg-muted rounded-lg hover:bg-primary-500/10 hover:text-primary-500"><AppIcons.Note className="h-4 w-4"/>Add Note</button>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 space-y-6">
                        {activeTab === 'tasks' && (
                            <div className="space-y-2">
                                {isAddingTask && (
                                    <>
                                        {console.log('AddTaskForm: Rendering form, isAddingTask is true')}
                                        <AddTaskForm lead={editableLead} onAddTask={onAddTask} onCancel={() => {
                                            console.log('AddTaskForm: Cancel button clicked');
                                            setIsAddingTask(false);
                                        }} currentUser={currentUser} onTaskCreated={loadNotesAndCalls} />
                                    </>
                                )}
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



