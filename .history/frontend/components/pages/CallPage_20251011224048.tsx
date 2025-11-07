
import React, { useState, useEffect } from 'react';
import { AppIcons } from '../ui/Icons';
import { CallCampaign, CallScript, User, Stage, CustomFieldDefinition } from '../../types';
import Modal from '../ui/Modal';
import { StatCard } from '../ui/StatCard';
import FilterBuilder from '../ui/FilterBuilder';

const ScriptFormModal: React.FC<{
    script: Partial<CallScript> | null;
    onClose: () => void;
    onSave: (script: CallScript) => void;
}> = ({ script, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<CallScript>>(script || { name: '', body: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as CallScript);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={script?.id ? 'Edit Call Script' : 'Create New Script'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-subtle">Script Name</label>
                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} type="text" className="mt-1 block w-full bg-background border border-muted rounded-md py-2 px-3" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-subtle">Script Body</label>
                    <textarea value={formData.body} onChange={e => setFormData({ ...formData, body: e.target.value })} rows={8} className="mt-1 block w-full bg-background border border-muted rounded-md py-2 px-3" required />
                     <p className="text-xs text-subtle mt-1">
                        Use variables like <code className="bg-muted px-1 rounded-sm">{"{{name}}"}</code>, <code className="bg-muted px-1 rounded-sm">{"{{course}}"}</code>, and <code className="bg-muted px-1 rounded-sm">{"{{user_name}}"}</code>.
                    </p>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-muted">
                    <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Save Script</button>
                </div>
            </form>
        </Modal>
    );
};

const CampaignFormModal: React.FC<{
    campaign: Partial<CallCampaign> | null;
    scripts: CallScript[];
    users: User[];
    pipelineStages: Stage[];
    customFieldDefs: CustomFieldDefinition[];
    onClose: () => void;
    onSave: (campaign: CallCampaign) => void;
}> = ({ campaign, scripts, users, pipelineStages, customFieldDefs, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<CallCampaign>>(campaign || { name: '', scriptId: scripts[0]?.id, status: 'DRAFT', conditions: [] });
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
        onSave(finalData as CallCampaign);
        onClose();
    };
    
    return (
        <Modal isOpen={true} onClose={onClose} title={campaign?.id ? 'Edit Call Campaign' : 'Create New Call Campaign'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-subtle">Campaign Name</label>
                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} type="text" className="mt-1 block w-full bg-background border border-muted rounded-md py-2 px-3" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-subtle">Call Script</label>
                    <select value={formData.scriptId} onChange={e => setFormData({ ...formData, scriptId: e.target.value })} className="mt-1 block w-full bg-background border border-muted rounded-md py-2 px-3" required>
                        <option value="" disabled>Select a script</option>
                        {scripts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="pt-4">
                    <h3 className="text-lg font-semibold text-on-surface">Target Audience</h3>
                    <p className="text-sm text-subtle mb-4">Define which leads will receive a call in this campaign.</p>
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
                            <span className="ml-3 text-sm font-medium">Start Immediately</span>
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


interface CallPageProps {
    users: User[];
    pipelineStages: Stage[];
    customFieldDefs: CustomFieldDefinition[];
}

const CallPage: React.FC<CallPageProps> = ({ users, pipelineStages, customFieldDefs }) => {
    const [activeTab, setActiveTab] = useState('campaigns');
    const [modal, setModal] = useState<{ type: 'script' | 'campaign' | null; data: any }>({ type: null, data: null });

    // State for real backend data
    const [scripts, setScripts] = useState<CallScript[]>([]);
    const [campaigns, setCampaigns] = useState<CallCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch data from backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch call scripts and campaigns from backend
                const [scriptsData, campaignsData] = await Promise.all([
                    fetch('/api/marketing/scripts/call').then(res => res.json()).then(res => res.data || []),
                    fetch('/api/marketing/campaigns/call').then(res => res.json()).then(res => res.data || [])
                ]);

                setScripts(scriptsData || []);
                setCampaigns(campaignsData || []);
            } catch (err) {
                console.error('Failed to fetch call data:', err);
                setError(`Failed to load data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // CRUD operations for scripts
    const handleSaveScript = async (script: CallScript) => {
        try {
            let response;
            if (script.id) {
                // Update existing script
                response = await fetch(`/api/marketing/scripts/call/${script.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(script)
                });
            } else {
                // Create new script
                response = await fetch('/api/marketing/scripts/call', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(script)
                });
            }

            if (!response.ok) throw new Error('Failed to save script');

            const savedScript = await response.json();
            if (script.id) {
                setScripts(prev => prev.map(s => s.id === script.id ? savedScript : s));
            } else {
                setScripts(prev => [...prev, savedScript]);
            }
        } catch (err) {
            console.error('Failed to save script:', err);
            setError(`Failed to save script: ${err.message}`);
        }
    };

    const handleDeleteScript = async (scriptId: string) => {
        if (!confirm('Are you sure you want to delete this script?')) return;

        try {
            const response = await fetch(`/api/marketing/scripts/call/${scriptId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete script');

            setScripts(prev => prev.filter(s => s.id !== scriptId));
        } catch (err) {
            console.error('Failed to delete script:', err);
            setError(`Failed to delete script: ${err.message}`);
        }
    };

    // CRUD operations for campaigns
    const handleSaveCampaign = async (campaign: CallCampaign) => {
        try {
            let response;
            if (campaign.id) {
                // Update existing campaign
                response = await fetch(`/api/marketing/campaigns/call/${campaign.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(campaign)
                });
            } else {
                // Create new campaign
                response = await fetch('/api/marketing/campaigns/call', {
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
            const response = await fetch(`/api/marketing/campaigns/call/${campaignId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete campaign');

            setCampaigns(prev => prev.filter(c => c.id !== campaignId));
        } catch (err) {
            console.error('Failed to delete campaign:', err);
            setError(`Failed to delete campaign: ${err.message}`);
        }
    };

    // Handle campaign starting
    const handleStartCampaign = async (campaign: CallCampaign) => {
        try {
            // Update campaign status to SENT and start immediately
            const updatedCampaign = { ...campaign, status: 'SENT' as const, sentAt: new Date().toISOString() };
            await handleSaveCampaign(updatedCampaign);

            // TODO: Trigger actual call campaign via backend
            alert('Campaign started successfully!');
        } catch (err) {
            console.error('Failed to start campaign:', err);
            setError(`Failed to start campaign: ${err.message}`);
        }
    };

    // Handle campaign scheduling
    const handleScheduleCampaign = async (campaign: CallCampaign, scheduledDate: string) => {
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
    const handleUnscheduleCampaign = async (campaign: CallCampaign) => {
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
                    <span className="ml-3 text-lg">Loading call data...</span>
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

    const openModal = (type: 'script' | 'campaign', data: any = null) => setModal({ type, data });
    const closeModal = () => setModal({ type: null, data: null });

    const getStatusBadge = (c: CallCampaign) => {
        switch (c.status) {
            case 'SENT': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">COMPLETED</span>;
            case 'DRAFT': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">DRAFT</span>;
            case 'SCHEDULED': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">SCHEDULED</span>;
        }
    }

    return (
        <div className="space-y-6">
            {modal.type === 'script' && <ScriptFormModal script={modal.data} onClose={closeModal} onSave={onSaveScript} />}
            {modal.type === 'campaign' && <CampaignFormModal campaign={modal.data} scripts={scripts} onClose={closeModal} onSave={onSaveCampaign} users={users} pipelineStages={pipelineStages} customFieldDefs={customFieldDefs} />}

            <div className="flex justify-between items-center">
                <div className="flex border border-muted bg-surface rounded-lg p-1">
                    <button onClick={() => setActiveTab('campaigns')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'campaigns' ? 'bg-primary-600 text-white' : 'text-subtle hover:bg-muted'}`}>Campaigns</button>
                    <button onClick={() => setActiveTab('scripts')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'scripts' ? 'bg-primary-600 text-white' : 'text-subtle hover:bg-muted'}`}>Scripts</button>
                    <button onClick={() => setActiveTab('analytics')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'analytics' ? 'bg-primary-600 text-white' : 'text-subtle hover:bg-muted'}`}>Analytics</button>
                </div>
                 <button onClick={() => openModal(activeTab === 'scripts' ? 'script' : 'campaign')} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                    <AppIcons.Add className="w-5 h-5 mr-2" /> {activeTab === 'scripts' ? 'New Script' : 'New Campaign'}
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
                                <div className="text-center"><p className="text-2xl font-bold">{c.connectionRate}%</p><p className="text-xs text-subtle">Connection Rate</p></div>
                            </div>
                            <div className="flex items-center gap-2 pt-4 border-t border-muted">
                                <button onClick={() => openModal('campaign', c)} className="flex-1 text-center bg-muted hover:bg-subtle/20 text-on-surface text-sm font-semibold py-2 px-3 rounded-lg">Edit</button>
                                {c.status === 'DRAFT' && <button className="flex-1 text-center bg-green-500/20 hover:bg-green-500/30 text-green-500 text-sm font-semibold py-2 px-3 rounded-lg">Start</button>}
                                {c.status === 'SCHEDULED' && <button onClick={() => onSaveCampaign({...c, status: 'DRAFT', scheduledAt: null})} className="flex-1 text-center bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 text-sm font-semibold py-2 px-3 rounded-lg">Unschedule</button>}
                                <button onClick={() => onDeleteCampaign(c.id)} className="p-2 text-subtle hover:text-red-500 hover:bg-red-500/10 rounded-lg"><AppIcons.Delete className="h-5 w-5"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {activeTab === 'scripts' && (
                 <div className="bg-surface rounded-xl shadow-lg p-6">
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {scripts.map(script => (
                            <div key={script.id} className="bg-background p-4 rounded-lg border border-muted">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-on-surface">{script.name}</h4>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openModal('script', script)} className="p-1.5 text-subtle hover:text-primary-500 hover:bg-primary-500/10 rounded-full"><AppIcons.Edit className="h-4 w-4"/></button>
                                        <button onClick={() => onDeleteScript(script.id)} className="p-1.5 text-subtle hover:text-red-500 hover:bg-red-500/10 rounded-full"><AppIcons.Delete className="h-4 w-4"/></button>
                                    </div>
                                </div>
                                <p className="text-sm text-subtle mt-2 whitespace-pre-wrap p-2 bg-muted/50 rounded">{script.body}</p>
                            </div>
                        ))}
                        {scripts.length === 0 && <p className="text-center text-subtle py-8">No call scripts created yet.</p>}
                    </div>
                </div>
            )}
            
            {activeTab === 'analytics' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Total Campaigns" value={campaigns.length.toString()} icon={<AppIcons.Marketing className="h-6 w-6 text-indigo-400"/>} />
                    <StatCard title="Total Calls Placed" value={campaigns.filter(c => c.status === 'SENT').reduce((sum, c) => sum + c.recipientCount, 0).toLocaleString()} icon={<AppIcons.Call className="h-6 w-6 text-purple-400"/>} />
                    <StatCard title="Avg. Connection Rate" value={`${(campaigns.reduce((sum, c) => sum + c.connectionRate, 0) / (campaigns.length || 1)).toFixed(1)}%`} icon={<AppIcons.Success className="h-6 w-6 text-green-400"/>} />
                </div>
            )}
        </div>
    );
};

export default CallPage;



