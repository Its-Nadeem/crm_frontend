import React, { useState } from 'react';
import { AppIcons } from '../ui/Icons';
import { SMSCampaign, SMSTemplate, User, Stage, CustomFieldDefinition } from '../../types';
import Modal from '../ui/Modal';
import { StatCard } from '../ui/StatCard';
import FilterBuilder from '../ui/FilterBuilder';

const TemplateFormModal: React.FC<{
    template: Partial<SMSTemplate> | null;
    onClose: () => void;
    onSave: (template: SMSTemplate) => void;
}> = ({ template, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<SMSTemplate>>(template || { name: '', body: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as SMSTemplate);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={template?.id ? 'Edit SMS Template' : 'Create New Template'}>
            <form onSubmit={handleSubmit}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-subtle">Template Name</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-subtle">Message Body</label>
                            <textarea rows={6} value={formData.body} onChange={e => setFormData({...formData, body: e.target.value})} required className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500"/>
                            <p className="text-xs text-subtle mt-1">
                                Use variables like <code className="bg-muted px-1 rounded-sm">{"{{name}}"}</code>, <code className="bg-muted px-1 rounded-sm">{"{{course}}"}</code>, and <code className="bg-muted px-1 rounded-sm">{"{{user_name}}"}</code>.
                            </p>
                        </div>
                    </div>
                     <div className="flex flex-col items-center justify-center bg-background p-4 rounded-lg border border-muted h-full">
                        <label className="block text-sm font-medium text-subtle mb-4">Live Preview</label>
                        <div className="w-72 h-96 bg-slate-800 rounded-3xl p-4 flex flex-col shadow-2xl">
                            <div className="bg-white/10 h-6 w-32 rounded-full mx-auto"></div>
                            <div className="flex-grow bg-slate-900 rounded-lg mt-4 p-2 overflow-y-auto">
                                <div className="bg-blue-500 text-white text-sm p-2 rounded-lg max-w-xs self-start whitespace-pre-wrap">
                                    {formData.body || "Your SMS message will appear here..."}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                 <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-muted">
                    <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Save Template</button>
                </div>
            </form>
        </Modal>
    );
};

const CampaignFormModal: React.FC<{
    campaign: Partial<SMSCampaign> | null;
    templates: SMSTemplate[];
    users: User[];
    pipelineStages: Stage[];
    customFieldDefs: CustomFieldDefinition[];
    onClose: () => void;
    onSave: (campaign: SMSCampaign) => void;
}> = ({ campaign, templates, users, pipelineStages, customFieldDefs, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<SMSCampaign>>(campaign || { name: '', templateId: templates[0]?.id, status: 'DRAFT', conditions: [] });
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
        onSave(finalData as SMSCampaign);
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
                    <label className="block text-sm font-medium text-subtle">SMS Template</label>
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

interface SMSPageProps {
    templates: SMSTemplate[];
    campaigns: SMSCampaign[];
    onSaveTemplate: (template: SMSTemplate) => void;
    onDeleteTemplate: (templateId: string) => void;
    onSaveCampaign: (campaign: SMSCampaign) => void;
    onDeleteCampaign: (campaignId: string) => void;
    users: User[];
    pipelineStages: Stage[];
    customFieldDefs: CustomFieldDefinition[];
}

const SMSPage: React.FC<SMSPageProps> = ({ templates, campaigns, onSaveTemplate, onDeleteTemplate, onSaveCampaign, onDeleteCampaign, users, pipelineStages, customFieldDefs }) => {
    const [activeTab, setActiveTab] = useState('campaigns');
    const [modal, setModal] = useState<{ type: 'template' | 'campaign' | null; data: any }>({ type: null, data: null });

    const openModal = (type: 'template' | 'campaign', data: any = null) => setModal({ type, data });
    const closeModal = () => setModal({ type: null, data: null });

    const getStatusBadge = (c: SMSCampaign) => {
        switch (c.status) {
            case 'SENT':
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">SENT</span>;
            case 'DRAFT':
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">DRAFT</span>;
            case 'SCHEDULED':
                 return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">SCHEDULED</span>;
        }
    }

    return (
        <div className="space-y-6">
            {modal.type === 'template' && <TemplateFormModal template={modal.data} onClose={closeModal} onSave={onSaveTemplate} />}
            {modal.type === 'campaign' && <CampaignFormModal campaign={modal.data} templates={templates} onClose={closeModal} onSave={onSaveCampaign} users={users} pipelineStages={pipelineStages} customFieldDefs={customFieldDefs} />}

            <div className="flex justify-between items-center">
                <div className="flex border border-muted bg-surface rounded-lg p-1">
                    <button onClick={() => setActiveTab('campaigns')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'campaigns' ? 'bg-primary-600 text-white' : 'text-subtle hover:bg-muted'}`}>Campaigns</button>
                    <button onClick={() => setActiveTab('templates')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'templates' ? 'bg-primary-600 text-white' : 'text-subtle hover:bg-muted'}`}>Templates</button>
                    <button onClick={() => setActiveTab('analytics')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'analytics' ? 'bg-primary-600 text-white' : 'text-subtle hover:bg-muted'}`}>Analytics</button>
                </div>
                 <button onClick={() => openModal(activeTab === 'templates' ? 'template' : 'campaign')} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                    <AppIcons.Add className="w-5 h-5 mr-2" /> {activeTab === 'templates' ? 'New Template' : 'New Campaign'}
                </button>
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
                                {c.status === 'DRAFT' && <button className="flex-1 text-center bg-green-500/20 hover:bg-green-500/30 text-green-500 text-sm font-semibold py-2 px-3 rounded-lg">Send</button>}
                                {c.status === 'SCHEDULED' && <button onClick={() => onSaveCampaign({...c, status: 'DRAFT', scheduledAt: null})} className="flex-1 text-center bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 text-sm font-semibold py-2 px-3 rounded-lg">Unschedule</button>}
                                {/* FIX: AppIcons.Delete was not found, added to Icons.tsx. */}
                                <button onClick={() => onDeleteCampaign(c.id)} className="p-2 text-subtle hover:text-red-500 hover:bg-red-500/10 rounded-lg"><AppIcons.Delete className="h-5 w-5"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {activeTab === 'templates' && (
                <div className="bg-surface rounded-xl shadow-lg p-6">
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {templates.map(template => (
                            <div key={template.id} className="bg-background p-4 rounded-lg border border-muted">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-on-surface">{template.name}</h4>
                                    <div className="flex items-center gap-2">
                                        {/* FIX: AppIcons.Edit was not found, added to Icons.tsx. */}
                                        <button onClick={() => openModal('template', template)} className="p-1.5 text-subtle hover:text-primary-500 hover:bg-primary-500/10 rounded-full"><AppIcons.Edit className="h-4 w-4"/></button>
                                        {/* FIX: AppIcons.Delete was not found, added to Icons.tsx. */}
                                        <button onClick={() => onDeleteTemplate(template.id)} className="p-1.5 text-subtle hover:text-red-500 hover:bg-red-500/10 rounded-full"><AppIcons.Delete className="h-4 w-4"/></button>
                                    </div>
                                </div>
                                <p className="text-sm text-subtle mt-2 whitespace-pre-wrap p-2 bg-muted/50 rounded">{template.body}</p>
                            </div>
                        ))}
                        {templates.length === 0 && <p className="text-center text-subtle py-8">No SMS templates created yet.</p>}
                    </div>
                </div>
            )}
            
            {activeTab === 'analytics' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* FIX: Replaced non-existent AppIcons.Campaigns with AppIcons.Marketing */}
                    <StatCard title="Total Campaigns" value={campaigns.length.toString()} icon={<AppIcons.Marketing className="h-6 w-6 text-indigo-400"/>} />
                    {/* FIX: AppIcons.SMS was not found, added to Icons.tsx. */}
                    <StatCard title="Total SMS Sent" value={campaigns.filter(c => c.status === 'SENT').reduce((sum, c) => sum + c.recipientCount, 0).toLocaleString()} icon={<AppIcons.SMS className="h-6 w-6 text-blue-400"/>} />
                    {/* FIX: AppIcons.Success was not found, added to Icons.tsx. */}
                    <StatCard title="Avg. Delivery Rate" value={`${(campaigns.reduce((sum, c) => sum + c.deliveryRate, 0) / (campaigns.length || 1)).toFixed(1)}%`} icon={<AppIcons.Success className="h-6 w-6 text-green-400"/>} />
                </div>
            )}
        </div>
    );
};

export default SMSPage;


