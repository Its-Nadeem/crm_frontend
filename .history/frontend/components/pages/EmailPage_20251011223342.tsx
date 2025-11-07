

import React, { useState, useEffect } from 'react';
import { AppIcons } from '../ui/Icons';
import { EmailCampaign, EmailTemplate, User, Stage, CustomFieldDefinition, FilterCondition } from '../../types';
import Modal from '../ui/Modal';
import { StatCard } from '../ui/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import FilterBuilder from '../ui/FilterBuilder';
import { apiService } from '../../src/services/api';

const RichTextEditor: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => (
    <div className="bg-background border border-muted rounded-md h-full flex flex-col">
        <div className="p-2 border-b border-muted flex gap-2 flex-shrink-0">
            <button type="button" className="p-1 rounded hover:bg-muted text-sm font-bold w-7 h-7">B</button>
            <button type="button" className="p-1 rounded hover:bg-muted text-sm italic w-7 h-7">I</button>
            <button type="button" className="p-1 rounded hover:bg-muted text-sm underline w-7 h-7">U</button>
        </div>
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-2 bg-transparent focus:outline-none flex-grow resize-none"
            placeholder="<html>...</html>"
        />
    </div>
);

const TemplateFormModal: React.FC<{
    template: Partial<EmailTemplate> | null;
    onClose: () => void;
    onSave: (template: EmailTemplate) => void;
}> = ({ template, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<EmailTemplate>>(template || { name: '', subject: '', body: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as EmailTemplate);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={template?.id ? 'Edit Email Template' : 'Create New Template'}>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4 flex flex-col">
                        <div>
                            <label className="block text-sm font-medium text-subtle">Template Name</label>
                            <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} type="text" className="mt-1 block w-full bg-background border border-muted rounded-md py-2 px-3" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-subtle">Email Subject</label>
                            <input value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} type="text" className="mt-1 block w-full bg-background border border-muted rounded-md py-2 px-3" required />
                        </div>
                        <div className="flex-grow flex flex-col">
                            <label className="block text-sm font-medium text-subtle mb-1">Body (HTML)</label>
                            <RichTextEditor value={formData.body || ''} onChange={val => setFormData({ ...formData, body: val })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-subtle mb-1">Live Preview</label>
                        <div className="w-full h-full bg-background p-4 rounded-lg border border-muted overflow-y-auto">
                            <div className="font-semibold text-on-surface p-2 bg-muted rounded-t-md">{formData.subject || "Your Subject Here"}</div>
                            <div className="p-2 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: formData.body || "<p>Your email content will appear here...</p>" }} />
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
// ... (rest of the components will be updated similarly)
const CampaignFormModal: React.FC<{
    campaign: Partial<EmailCampaign> | null;
    templates: EmailTemplate[];
    users: User[];
    pipelineStages: Stage[];
    customFieldDefs: CustomFieldDefinition[];
    onClose: () => void;
    onSave: (campaign: EmailCampaign) => void;
}> = ({ campaign, templates, users, pipelineStages, customFieldDefs, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<EmailCampaign>>(campaign || { name: '', templateId: templates[0]?.id, status: 'DRAFT', conditions: [] });
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
        onSave(finalData as EmailCampaign);
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
                    <label className="block text-sm font-medium text-subtle">Email Template</label>
                    <select value={formData.templateId} onChange={e => setFormData({ ...formData, templateId: e.target.value })} className="mt-1 block w-full bg-background border border-muted rounded-md py-2 px-3" required>
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


interface EmailPageProps {
    templates: EmailTemplate[];
    campaigns: EmailCampaign[];
    onSaveTemplate: (template: EmailTemplate) => void;
    onDeleteTemplate: (templateId: string) => void;
    onSaveCampaign: (campaign: EmailCampaign) => void;
    onDeleteCampaign: (campaignId: string) => void;
    users: User[];
    pipelineStages: Stage[];
    customFieldDefs: CustomFieldDefinition[];
}

const EmailPage: React.FC<EmailPageProps> = ({ templates, campaigns, onSaveTemplate, onDeleteTemplate, onSaveCampaign, onDeleteCampaign, users, pipelineStages, customFieldDefs }) => {
    const [activeTab, setActiveTab] = useState('campaigns');
    const [modal, setModal] = useState<'template' | 'campaign' | null>(null);
    const [editingItem, setEditingItem] = useState<Partial<EmailTemplate | EmailCampaign> | null>(null);

    const openModal = (type: 'template' | 'campaign', item: Partial<EmailTemplate | EmailCampaign> | null = null) => {
        setEditingItem(item);
        setModal(type);
    };
    const closeModal = () => {
        setEditingItem(null);
        setModal(null);
    }
    
    const getStatusBadge = (c: EmailCampaign) => {
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
            {modal === 'template' && <TemplateFormModal template={editingItem as Partial<EmailTemplate>} onClose={closeModal} onSave={onSaveTemplate} />}
            {modal === 'campaign' && <CampaignFormModal campaign={editingItem as Partial<EmailCampaign>} templates={templates} onClose={closeModal} onSave={onSaveCampaign} users={users} pipelineStages={pipelineStages} customFieldDefs={customFieldDefs} />}

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
                                <div className="text-center"><p className="text-2xl font-bold">{c.openRate}%</p><p className="text-xs text-subtle">Open Rate</p></div>
                            </div>
                            <div className="flex items-center gap-2 pt-4 border-t border-muted">
                                <button onClick={() => openModal('campaign', c)} className="flex-1 text-center bg-muted hover:bg-subtle/20 text-on-surface text-sm font-semibold py-2 px-3 rounded-lg">Edit</button>
                                {c.status === 'DRAFT' && <button className="flex-1 text-center bg-green-500/20 hover:bg-green-500/30 text-green-500 text-sm font-semibold py-2 px-3 rounded-lg">Send</button>}
                                {c.status === 'SCHEDULED' && <button onClick={() => onSaveCampaign({...c, status: 'DRAFT', scheduledAt: null})} className="flex-1 text-center bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 text-sm font-semibold py-2 px-3 rounded-lg">Unschedule</button>}
                                <button onClick={() => onDeleteCampaign(c.id)} className="p-2 text-subtle hover:text-red-500 hover:bg-red-500/10 rounded-lg"><AppIcons.Delete className="h-5 w-5"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {activeTab === 'templates' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {templates.map(t => (
                        <div key={t.id} className="bg-surface p-4 rounded-xl shadow-lg border border-muted/50">
                             <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-on-surface">{t.name}</h3>
                                <div className="space-x-2">
                                    <button onClick={() => openModal('template', t)} className="p-1.5 text-subtle hover:text-primary-500 hover:bg-primary-500/10 rounded-full"><AppIcons.Edit className="h-4 w-4"/></button>
                                    <button onClick={() => onDeleteTemplate(t.id)} className="p-1.5 text-subtle hover:text-red-500 hover:bg-red-500/10 rounded-full"><AppIcons.Delete className="h-4 w-4"/></button>
                                </div>
                            </div>
                            <div className="mt-2 bg-background p-3 border border-muted rounded-md h-32 overflow-hidden relative group">
                                <div className="font-semibold text-sm">{t.subject}</div>
                                <div className="prose prose-sm dark:prose-invert max-w-none opacity-60" dangerouslySetInnerHTML={{ __html: t.body }} />
                                <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-background to-transparent" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Total Campaigns" value={campaigns.length.toString()} icon={<AppIcons.Marketing className="h-6 w-6 text-indigo-400"/>} />
                        <StatCard title="Total Emails Sent" value={campaigns.filter(c => c.status === 'SENT').reduce((sum, c) => sum + c.recipientCount, 0).toLocaleString()} icon={<AppIcons.Email className="h-6 w-6 text-blue-400"/>} />
                        <StatCard title="Avg. Open Rate" value={`${(campaigns.reduce((sum, c) => sum + c.openRate, 0) / (campaigns.length || 1)).toFixed(1)}%`} icon={<AppIcons.Success className="h-6 w-6 text-green-400"/>} />
                    </div>
                     <div className="bg-surface p-6 rounded-xl shadow-lg border border-muted/50">
                        <h3 className="text-lg font-semibold mb-4 text-on-surface">Campaign Performance</h3>
                        <ResponsiveContainer width="100%" height={300}>
                             <BarChart data={campaigns.filter(c => c.status === 'SENT')}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
                                <XAxis dataKey="name" stroke="var(--subtle)" tick={{fontSize: 12}} />
                                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: 'Recipients', angle: -90, position: 'insideLeft' }} />
                                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" label={{ value: 'Open Rate (%)', angle: -90, position: 'insideRight' }}/>
                                <Tooltip contentStyle={{backgroundColor: 'var(--surface)', border: '1px solid var(--muted)'}} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="recipientCount" fill="#8884d8" name="Recipients" radius={[4, 4, 0, 0]} />
                                <Bar yAxisId="right" dataKey="openRate" fill="#82ca9d" name="Open Rate (%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailPage;



