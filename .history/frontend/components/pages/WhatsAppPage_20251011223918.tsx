

import React, { useState, useEffect } from 'react';
import { WhatsAppTemplate, ChatbotConfig, ChatbotQuestion, LeadField, CustomFieldDefinition, ChatbotKeywordRule, WhatsAppCampaign, User, Stage } from '../../types';
import Modal from '../ui/Modal';
import { AppIcons } from '../ui/Icons';
import { faker } from '@faker-js/faker';
import FilterBuilder from '../ui/FilterBuilder';
import { StatCard } from '../ui/StatCard';

const TemplateFormModal: React.FC<{
    template: Partial<WhatsAppTemplate> | null;
    onClose: () => void;
    onSave: (template: WhatsAppTemplate) => void;
}> = ({ template, onClose, onSave }) => {
    const [formData, setFormData] = useState<WhatsAppTemplate>(
        (template as WhatsAppTemplate) || { id: '', name: '', body: '', organizationId: '' }
    );
    const isEditing = !!formData.id;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={isEditing ? 'Edit Template' : 'Create New Template'}>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-subtle">Template Name</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-subtle">Message Body</label>
                        <textarea rows={6} value={formData.body} onChange={e => setFormData({...formData, body: e.target.value})} required className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500"/>
                        <p className="text-xs text-subtle mt-1">
                            Use variables like <code className="bg-muted px-1 rounded-sm">{"{{name}}"}</code>, <code className="bg-muted px-1 rounded-sm">{"{{course}}"}</code>, <code className="bg-muted px-1 rounded-sm">{"{{dealValue}}"}</code>, and <code className="bg-muted px-1 rounded-sm">{"{{user_name}}"}</code>.
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center bg-background p-4 rounded-lg border border-muted h-full">
                    <label className="block text-sm font-medium text-subtle mb-4">Live Preview</label>
                     <div className="w-72 h-96 bg-slate-800 rounded-3xl p-4 flex flex-col shadow-2xl" style={{backgroundImage: 'url(https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg)', backgroundSize: 'cover'}}>
                        <div className="flex-grow rounded-lg mt-4 p-2 overflow-y-auto flex flex-col justify-end">
                            <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm p-2 rounded-lg max-w-xs self-start whitespace-pre-wrap shadow-md">
                                {formData.body || "Your WhatsApp message will appear here..."}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t border-muted">
                    <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Save Template</button>
                </div>
            </form>
        </Modal>
    );
}

const CampaignFormModal: React.FC<{
    campaign: Partial<WhatsAppCampaign> | null;
    templates: WhatsAppTemplate[];
    users: User[];
    pipelineStages: Stage[];
    customFieldDefs: CustomFieldDefinition[];
    onClose: () => void;
    onSave: (campaign: WhatsAppCampaign) => void;
}> = ({ campaign, templates, users, pipelineStages, customFieldDefs, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<WhatsAppCampaign>>(campaign || { name: '', templateId: templates[0]?.id, status: 'DRAFT', conditions: [] });
    const [scheduleOption, setScheduleOption] = useState<'draft' | 'now' | 'later'>(
        campaign?.status === 'SCHEDULED' ? 'later' : (campaign?.status === 'SENT' ? 'now' : 'draft')
    );
    const [scheduleDate, setScheduleDate] = useState(
        (campaign?.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : '') || new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16)
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalData = { ...formData };
        if (scheduleOption === 'now') {
            finalData.status = 'SENT';
            finalData.sentAt = new Date().toISOString();
            finalData.scheduledAt = null;
        } else if (scheduleOption === 'later') {
            finalData.status = 'SCHEDULED';
            finalData.scheduledAt = new Date(scheduleDate).toISOString();
            finalData.sentAt = null;
        } else {
            finalData.status = 'DRAFT';
            finalData.sentAt = null;
            finalData.scheduledAt = null;
        }
        onSave(finalData as WhatsAppCampaign);
        onClose();
    };
    
    return (
        <Modal isOpen={true} onClose={onClose} title={campaign?.id ? 'Edit Campaign' : 'Create New Campaign'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-subtle">Campaign Name</label>
                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} type="text" className="mt-1 block w-full bg-background border border-muted rounded-md py-2 px-3" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-subtle">WhatsApp Template</label>
                    <select value={formData.templateId} onChange={e => setFormData({ ...formData, templateId: e.target.value })} className="mt-1 block w-full bg-background border border-muted rounded-md py-2 px-3" required>
                        <option value="" disabled>Select a template</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div className="pt-4">
                    <h3 className="text-lg font-semibold text-on-surface">Target Audience</h3>
                    <p className="text-sm text-subtle mb-4">Define which leads will receive this campaign. Leave empty to send to all leads.</p>
                    <FilterBuilder
                        conditions={formData.conditions || []}
                        onConditionsChange={newConditions => setFormData({ ...formData, conditions: newConditions })}
                        users={users}
                        pipelineStages={pipelineStages}
                        customFieldDefs={customFieldDefs}
                    />
                </div>
                <div className="pt-4 border-t border-muted mt-4">
                    <h3 className="text-lg font-semibold text-on-surface mb-2">Scheduling Options</h3>
                    <div className="space-y-2">
                        <label className="flex items-center p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                            <input type="radio" value="draft" checked={scheduleOption === 'draft'} onChange={e => setScheduleOption(e.target.value as any)} className="h-4 w-4 text-primary-600 focus:ring-primary-500"/>
                            <span className="ml-3 text-sm font-medium">Save as Draft</span>
                        </label>
                        <label className="flex items-center p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                            <input type="radio" value="now" checked={scheduleOption === 'now'} onChange={e => setScheduleOption(e.target.value as any)} className="h-4 w-4 text-primary-600 focus:ring-primary-500"/>
                            <span className="ml-3 text-sm font-medium">Send Immediately</span>
                        </label>
                        <label className="flex items-center p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                            <input type="radio" value="later" checked={scheduleOption === 'later'} onChange={e => setScheduleOption(e.target.value as any)} className="h-4 w-4 text-primary-600 focus:ring-primary-500"/>
                             <span className="ml-3 text-sm font-medium">Schedule for Later</span>
                        </label>
                        {scheduleOption === 'later' && (
                            <div className="pl-9">
                                <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="bg-background border border-muted p-2 rounded-md text-sm"/>
                            </div>
                        )}
                    </div>
                </div>
                 <div className="flex justify-end gap-3 pt-4 border-t border-muted">
                    <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Save Campaign</button>
                </div>
            </form>
        </Modal>
    );
};


const SettingCard: React.FC<{title: string, description?: string, children: React.ReactNode}> = ({ title, description, children}) => {
    return (
        <div className="bg-surface p-6 rounded-xl shadow-lg border border-muted/50">
            <h3 className="text-xl font-bold text-on-surface">{title}</h3>
            {description && <p className="text-subtle mt-1 mb-6">{description}</p>}
            <div className="space-y-4">{children}</div>
        </div>
    );
};

const generateWidgetCode = (config: ChatbotConfig): string => {
    return `<script src="https://cdn.Clienn CRM.io/chatbot.js" data-org-id="${config.organizationId}" async defer></script>`;
}

interface WhatsAppPageProps {
    customFieldDefs: CustomFieldDefinition[];
    users: User[];
    pipelineStages: Stage[];
}

const WhatsAppPage: React.FC<WhatsAppPageProps> = ({
    customFieldDefs, users, pipelineStages
}) => {
    const [activeTab, setActiveTab] = useState('campaigns');
    const [modal, setModal] = useState<{ type: 'template' | 'campaign' | null; data: any }>({ type: null, data: null });

    // State for real backend data
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
    const [chatbotConfig, setChatbotConfig] = useState<ChatbotConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch data from backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch WhatsApp templates, campaigns, and chatbot config from backend
                const [templatesData, campaignsData, chatbotData] = await Promise.all([
                    fetch('/api/marketing/templates/whatsapp').then(res => res.json()).then(res => res.data || []),
                    fetch('/api/marketing/campaigns/whatsapp').then(res => res.json()).then(res => res.data || []),
                    fetch('/api/settings/chatbot').then(res => res.json()).then(res => res.data || null).catch(() => null)
                ]);

                setTemplates(templatesData || []);
                setCampaigns(campaignsData || []);
                setChatbotConfig(chatbotData);
            } catch (err) {
                console.error('Failed to fetch WhatsApp data:', err);
                setError(`Failed to load data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // CRUD operations for templates
    const handleSaveTemplate = async (template: WhatsAppTemplate) => {
        try {
            let response;
            if (template.id) {
                // Update existing template
                response = await fetch(`/api/marketing/templates/whatsapp/${template.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(template)
                });
            } else {
                // Create new template
                response = await fetch('/api/marketing/templates/whatsapp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(template)
                });
            }

            if (!response.ok) throw new Error('Failed to save template');

            const savedTemplate = await response.json();
            if (template.id) {
                setTemplates(prev => prev.map(t => t.id === template.id ? savedTemplate : t));
            } else {
                setTemplates(prev => [...prev, savedTemplate]);
            }
        } catch (err) {
            console.error('Failed to save template:', err);
            setError(`Failed to save template: ${err.message}`);
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            const response = await fetch(`/api/marketing/templates/whatsapp/${templateId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete template');

            setTemplates(prev => prev.filter(t => t.id !== templateId));
        } catch (err) {
            console.error('Failed to delete template:', err);
            setError(`Failed to delete template: ${err.message}`);
        }
    };

    // CRUD operations for campaigns
    const handleSaveCampaign = async (campaign: WhatsAppCampaign) => {
        try {
            let response;
            if (campaign.id) {
                // Update existing campaign
                response = await fetch(`/api/marketing/campaigns/whatsapp/${campaign.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(campaign)
                });
            } else {
                // Create new campaign
                response = await fetch('/api/marketing/campaigns/whatsapp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(campaign)
                });
            }

            if (!response.ok) throw new Error('Failed to save campaign');

            const savedCampaign = await response.json();
            if (campaign.id) {
                setCampaigns(prev => prev.map(c => c.id === campaign.id ? savedCampaign : c));
            } else {
                setCampaigns(prev => [...prev, savedCampaign]);
            }
        } catch (err) {
            console.error('Failed to save campaign:', err);
            setError(`Failed to save campaign: ${err.message}`);
        }
    };

    const handleDeleteCampaign = async (campaignId: string) => {
        if (!confirm('Are you sure you want to delete this campaign?')) return;

        try {
            const response = await fetch(`/api/marketing/campaigns/whatsapp/${campaignId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete campaign');

            setCampaigns(prev => prev.filter(c => c.id !== campaignId));
        } catch (err) {
            console.error('Failed to delete campaign:', err);
            setError(`Failed to delete campaign: ${err.message}`);
        }
    };

    // Handle chatbot config
    const handleSaveChatbotConfig = async (config: ChatbotConfig) => {
        try {
            const response = await fetch('/api/settings/chatbot', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (!response.ok) throw new Error('Failed to save chatbot config');

            const savedConfig = await response.json();
            setChatbotConfig(savedConfig);
        } catch (err) {
            console.error('Failed to save chatbot config:', err);
            setError(`Failed to save chatbot config: ${err.message}`);
        }
    };

    // Handle campaign sending
    const handleSendCampaign = async (campaign: WhatsAppCampaign) => {
        try {
            // Update campaign status to SENT and send immediately
            const updatedCampaign = { ...campaign, status: 'SENT' as const, sentAt: new Date().toISOString() };
            await handleSaveCampaign(updatedCampaign);

            // TODO: Trigger actual WhatsApp sending via backend
            alert('Campaign sent successfully!');
        } catch (err) {
            console.error('Failed to send campaign:', err);
            setError(`Failed to send campaign: ${err.message}`);
        }
    };

    // Handle campaign scheduling
    const handleScheduleCampaign = async (campaign: WhatsAppCampaign, scheduledDate: string) => {
        try {
            const updatedCampaign = {
                ...campaign,
                status: 'SCHEDULED' as const,
                scheduledAt: new Date(scheduledDate).toISOString()
            };
            await handleSaveCampaign(updatedCampaign);
            alert('Campaign scheduled successfully!');
        } catch (err) {
            console.error('Failed to schedule campaign:', err);
            setError(`Failed to schedule campaign: ${err.message}`);
        }
    };

    // Handle campaign unscheduling
    const handleUnscheduleCampaign = async (campaign: WhatsAppCampaign) => {
        try {
            const updatedCampaign = {
                ...campaign,
                status: 'DRAFT' as const,
                scheduledAt: null
            };
            await handleSaveCampaign(updatedCampaign);
            alert('Campaign unscheduled successfully!');
        } catch (err) {
            console.error('Failed to unschedule campaign:', err);
            setError(`Failed to unschedule campaign: ${err.message}`);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                    <span className="ml-3 text-lg">Loading WhatsApp data...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="text-red-500 text-lg mb-2">{error}</div>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const openModal = (type: 'template' | 'campaign', data: any = null) => {
        setModal({ type, data });
    };

    const closeModal = () => {
        setModal({ type: null, data: null });
    };

    // Default chatbot config if none exists
    const defaultChatbotConfig: ChatbotConfig = {
        isEnabled: false,
        welcomeMessage: "Hi there! Welcome to our website. I'm here to help you get started. What is your name?",
        thankYouMessage: "Thanks for the information! Someone from our team will get in touch with you shortly.",
        questions: [
            { id: faker.string.uuid(), question: "Great, {{name}}! What's your email?", crmField: 'email', type: 'email' },
            { id: faker.string.uuid(), question: "Thanks! And your phone number?", crmField: 'phone', type: 'phone' },
        ],
        keywordRules: [],
        aiSystemPrompt: "You are a friendly and efficient assistant. Your goal is to collect visitor information to create a lead. Be concise and friendly.",
        widgetColor: '#25D366',
        widgetPosition: 'bottom-right',
        widgetStyle: 'icon',
        organizationId: ''
    };

    const currentChatbotConfig = chatbotConfig || defaultChatbotConfig;

    const handleBotConfigChange = async (field: keyof ChatbotConfig, value: any) => {
        const updatedConfig = { ...currentChatbotConfig, [field]: value };
        await handleSaveChatbotConfig(updatedConfig);
    }

    const handleQuestionChange = async (id: string, field: keyof ChatbotQuestion, value: any) => {
        if (!currentChatbotConfig) return;
        const newQuestions = currentChatbotConfig.questions.map(q => q.id === id ? {...q, [field]: value} : q);
        const updatedConfig = {...currentChatbotConfig, questions: newQuestions};
        await handleSaveChatbotConfig(updatedConfig);
    }

    const addQuestion = async () => {
        if (!currentChatbotConfig) return;
        const newQuestion: ChatbotQuestion = { id: faker.string.uuid(), question: '', crmField: 'name', type: 'text' };
        const updatedConfig = {...currentChatbotConfig, questions: [...currentChatbotConfig.questions, newQuestion]};
        await handleSaveChatbotConfig(updatedConfig);
    }

    const deleteQuestion = async (id: string) => {
        if (!currentChatbotConfig) return;
        const updatedConfig = {...currentChatbotConfig, questions: currentChatbotConfig.questions.filter(q => q.id !== id)};
        await handleSaveChatbotConfig(updatedConfig);
    }

    const handleKeywordRuleChange = async (id: string, field: keyof ChatbotKeywordRule, value: any) => {
        if (!currentChatbotConfig) return;
        const newRules = currentChatbotConfig.keywordRules.map(r => r.id === id ? {...r, [field]: value} : r);
        const updatedConfig = {...currentChatbotConfig, keywordRules: newRules};
        await handleSaveChatbotConfig(updatedConfig);
    }

    const addKeywordRule = async () => {
        if (!currentChatbotConfig) return;
        const newRule: ChatbotKeywordRule = { id: faker.string.uuid(), keyword: '', response: '' };
        const updatedConfig = {...currentChatbotConfig, keywordRules: [...currentChatbotConfig.keywordRules, newRule]};
        await handleSaveChatbotConfig(updatedConfig);
    }

    const deleteKeywordRule = async (id: string) => {
        if (!currentChatbotConfig) return;
        const updatedConfig = {...currentChatbotConfig, keywordRules: currentChatbotConfig.keywordRules.filter(r => r.id !== id)};
        await handleSaveChatbotConfig(updatedConfig);
    }

    const crmLeadFields: { value: LeadField | `customFields.${string}`, label: string }[] = [
        { value: 'name', label: 'Name' }, { value: 'email', label: 'Email' }, { value: 'phone', label: 'Phone' },
        { value: 'company', label: 'Company' }, { value: 'city', label: 'City' }, { value: 'course', label: 'Course' },
        ...customFieldDefs.map(cf => ({ value: `customFields.${cf.id}` as `customFields.${string}`, label: `(Custom) ${cf.name}` }))
    ];

    const getStatusBadge = (c: WhatsAppCampaign) => {
        switch (c.status) {
            case 'SENT': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">SENT</span>;
            case 'DRAFT': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">DRAFT</span>;
            case 'SCHEDULED': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">SCHEDULED</span>;
        }
    }

    const newButtonText = () => {
        switch(activeTab) {
            case 'campaigns': return 'New Campaign';
            case 'templates': return 'New Template';
            default: return null;
        }
    }

    return (
        <div className="space-y-6">
            {modal.type === 'template' && <TemplateFormModal template={modal.data} onClose={closeModal} onSave={handleSaveTemplate} />}
            {modal.type === 'campaign' && <CampaignFormModal campaign={modal.data} templates={templates} users={users} pipelineStages={pipelineStages} customFieldDefs={customFieldDefs} onClose={closeModal} onSave={handleSaveCampaign} />}
            
             <div className="flex justify-between items-center">
                <div className="flex border border-muted bg-surface rounded-lg p-1">
                    <button onClick={() => setActiveTab('campaigns')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'campaigns' ? 'bg-primary-600 text-white' : 'text-subtle hover:bg-muted'}`}>Campaigns</button>
                    <button onClick={() => setActiveTab('templates')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'templates' ? 'bg-primary-600 text-white' : 'text-subtle hover:bg-muted'}`}>Templates</button>
                    <button onClick={() => setActiveTab('chatbot')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'chatbot' ? 'bg-primary-600 text-white' : 'text-subtle hover:bg-muted'}`}>Website Chatbot</button>
                    <button onClick={() => setActiveTab('integration')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'integration' ? 'bg-primary-600 text-white' : 'text-subtle hover:bg-muted'}`}>Settings</button>
                </div>
                 {newButtonText() && <button onClick={() => openModal(activeTab as 'template' | 'campaign')} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                    <AppIcons.Add className="w-5 h-5 mr-2" /> {newButtonText()}
                </button>}
            </div>

            {activeTab === 'campaigns' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaigns.map(c => (
                        <div key={c.id} className="bg-surface rounded-xl shadow-lg border border-muted/50 p-5 flex flex-col">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-on-surface flex-grow pr-4">{c.name}</h3>
                                {getStatusBadge(c)}
                            </div>
                            {c.status === 'SCHEDULED' && c.scheduledAt && (
                                <p className="text-xs text-blue-500 dark:text-blue-400 font-medium mt-1">
                                    Scheduled for: {new Date(c.scheduledAt).toLocaleString()}
                                </p>
                            )}
                            <div className="grid grid-cols-2 gap-4 my-4 flex-grow">
                                <div className="text-center"><p className="text-2xl font-bold">{c.recipientCount.toLocaleString()}</p><p className="text-xs text-subtle">Recipients</p></div>
                                <div className="text-center"><p className="text-2xl font-bold">{c.deliveryRate}%</p><p className="text-xs text-subtle">Delivery Rate</p></div>
                            </div>
                            <div className="flex items-center gap-2 pt-4 border-t border-muted">
                                <button onClick={() => openModal('campaign', c)} className="flex-1 text-center bg-muted hover:bg-subtle/20 text-on-surface text-sm font-semibold py-2 px-3 rounded-lg">Edit</button>
                                {c.status === 'DRAFT' && <button onClick={() => handleSendCampaign(c)} className="flex-1 text-center bg-green-500/20 hover:bg-green-500/30 text-green-500 text-sm font-semibold py-2 px-3 rounded-lg">Send</button>}
                                {c.status === 'SCHEDULED' && <button onClick={() => handleUnscheduleCampaign(c)} className="flex-1 text-center bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 text-sm font-semibold py-2 px-3 rounded-lg">Unschedule</button>}
                                <button onClick={() => handleDeleteCampaign(c.id)} className="p-2 text-subtle hover:text-red-500 hover:bg-red-500/10 rounded-lg"><AppIcons.Delete className="h-5 w-5"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'integration' && (
                <SettingCard title="API Configuration" description="Enter your credentials from your WhatsApp Business API provider (e.g., Meta, Twilio).">
                    <input type="password" placeholder="API Key / Access Token" className="mt-1 block w-full bg-background border border-muted rounded-md py-2 px-3"/>
                    <input type="password" placeholder="API Secret / Account SID" className="mt-1 block w-full bg-background border border-muted rounded-md py-2 px-3"/>
                    <input type="text" readOnly value="https://api.Clienn CRM.io/webhooks/whatsapp" className="mt-1 block w-full bg-background border border-muted rounded-md py-2 px-3 text-subtle cursor-not-allowed"/>
                </SettingCard>
            )}
            
            {activeTab === 'templates' && (
                 <SettingCard title="Message Templates" description="Create reusable templates for quick and consistent communication.">
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {templates.map(template => (
                             <div key={template.id} className="bg-background p-4 rounded-lg border border-muted">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-on-surface">{template.name}</h4>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openModal('template', template)} className="p-1.5 text-subtle hover:text-primary-500 hover:bg-primary-500/10 rounded-full"><AppIcons.Edit className="h-4 w-4"/></button>
                                        <button onClick={() => window.confirm("Delete this template?") && onDeleteTemplate(template.id)} className="p-1.5 text-subtle hover:text-red-500 hover:bg-red-500/10 rounded-full"><AppIcons.Delete className="h-4 w-4"/></button>
                                    </div>
                                </div>
                                <p className="text-sm text-subtle mt-2 whitespace-pre-wrap bg-muted/50 p-2 rounded">{template.body}</p>
                            </div>
                        ))}
                    </div>
                </SettingCard>
            )}

            {activeTab === 'chatbot' && (
                <div className="space-y-8">
                    <SettingCard title="Chatbot Status & Installation">
                        <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                            <h4 className="font-semibold text-on-surface">Enable Website Chatbot</h4>
                             <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={currentChatbotConfig.isEnabled} onChange={(e) => handleBotConfigChange('isEnabled', e.target.checked)} className="sr-only peer" />
                              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                        </div>
                         <div>
                            <p className="text-sm text-subtle">Copy this code into your website's HTML before the closing `&lt;/body&gt;` tag.</p>
                             <pre className="bg-background p-4 rounded-lg text-xs text-on-surface overflow-auto mt-2 font-mono">{generateWidgetCode(currentChatbotConfig)}</pre>
                        </div>
                    </SettingCard>
                    
                    <SettingCard title="Widget Customization">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label className="block text-sm font-medium text-subtle">Widget Color</label>
                                        <input type="color" value={currentChatbotConfig.widgetColor} onChange={e => handleBotConfigChange('widgetColor', e.target.value)} className="mt-1 w-full h-10 p-1 bg-background border border-muted rounded-md cursor-pointer"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-subtle">Widget Style</label>
                                        <select value={currentChatbotConfig.widgetStyle} onChange={e => handleBotConfigChange('widgetStyle', e.target.value)} className="mt-1 block w-full bg-background border border-muted rounded-md py-2 px-3 h-10">
                                            <option value="icon">Icon only</option>
                                            <option value="button">Button with text</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-subtle">Widget Position</label>
                                    <select value={currentChatbotConfig.widgetPosition} onChange={e => handleBotConfigChange('widgetPosition', e.target.value)} className="mt-1 block w-full bg-background border border-muted rounded-md py-2 px-3">
                                        <option value="bottom-right">Bottom Right</option>
                                        <option value="bottom-left">Bottom Left</option>
                                    </select>
                                </div>
                            </div>
                             <div className="relative h-80 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center p-4">
                                <p className="text-sm text-subtle font-semibold">Live Preview</p>
                                <div className={`absolute bottom-5 ${currentChatbotConfig.widgetPosition === 'bottom-left' ? 'left-5' : 'right-5'}`}>
                                    <button
                                        className={`transition-all duration-300 ease-in-out text-white shadow-lg flex items-center gap-2`}
                                        style={{ backgroundColor: currentChatbotConfig.widgetColor, borderRadius: currentChatbotConfig.widgetStyle === 'icon' ? '50%' : '30px', padding: currentChatbotConfig.widgetStyle === 'icon' ? '1rem' : '1rem 1.5rem', }}
                                    >
                                        <AppIcons.ChatBubble className="w-6 h-6" />
                                        {currentChatbotConfig.widgetStyle === 'button' && <span className="font-semibold">Chat with us</span>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </SettingCard>

                     <SettingCard title="Conversation Flow" description="Define how the chatbot interacts with visitors.">
                        <textarea value={currentChatbotConfig.welcomeMessage} onChange={(e) => handleBotConfigChange('welcomeMessage', e.target.value)} rows={3} className="w-full bg-background border border-muted rounded-md py-2 px-3" placeholder="Welcome message..."/>
                        <div className="space-y-2">
                            {currentChatbotConfig.questions.map((q, i) => (
                                <div key={q.id} className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-2 p-2 bg-background rounded-md">
                                    <span className="text-subtle font-bold">{i + 1}.</span>
                                    <input type="text" value={q.question} onChange={e => handleQuestionChange(q.id, 'question', e.target.value)} placeholder="Question..." className="bg-surface border border-muted p-1 rounded-md" />
                                    <span className="text-subtle text-sm">maps to:</span>
                                    <select value={q.crmField} onChange={e => handleQuestionChange(q.id, 'crmField', e.target.value)} className="bg-surface border border-muted p-1 rounded-md text-sm">
                                        {crmLeadFields.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                    </select>
                                    <button onClick={() => deleteQuestion(q.id)} className="text-red-400 hover:text-red-300"><AppIcons.Delete className="h-4 w-4"/></button>
                                </div>
                            ))}
                            <button onClick={addQuestion} className="text-sm text-primary-500 font-semibold">+ Add Question</button>
                        </div>
                        <textarea value={currentChatbotConfig.thankYouMessage} onChange={(e) => handleBotConfigChange('thankYouMessage', e.target.value)} rows={3} className="w-full bg-background border border-muted rounded-md py-2 px-3" placeholder="Thank you message..."/>
                    </SettingCard>
                </div>
            )}
        </div>
    );
};

export default WhatsAppPage;


