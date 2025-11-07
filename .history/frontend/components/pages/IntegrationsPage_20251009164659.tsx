import React, { useMemo, useState, useEffect } from 'react';
import { IntegrationLog, IntegrationSettings, IntegrationSource, CustomFieldDefinition, FieldMapping, Organization, WebhookConfig, ConnectedFacebookAccount, OrganizationApiKeyData, WebhookTestResult } from '../../types';
import { AppIcons } from '../ui/Icons';
import { StatCard } from '../ui/StatCard';
import FieldMappingModal from '../ui/FieldMappingModal';
import FacebookConnectModal from '../integrations/FacebookConnectModal';
import GoogleConnectModal from '../integrations/GoogleConnectModal';
import WebsiteConnectModal from '../integrations/WebsiteConnectModal';
import TelephonyConnectModal from '../integrations/TelephonyConnectModal';
import EmailConnectModal from '../integrations/EmailConnectModal';
import SMSConnectModal from '../integrations/SMSConnectModal';
import { useLocation, useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';

const WebhookManager: React.FC<{
    webhooks: WebhookConfig[];
    onAddWebhook: (name: string) => void;
    onDeleteWebhook: (id: string) => void;
    onToggleWebhook: (id: string, isEnabled: boolean) => void;
}> = ({ webhooks, onAddWebhook, onDeleteWebhook, onToggleWebhook }) => {
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [newWebhookName, setNewWebhookName] = useState('');

    const handleAdd = () => {
        if (newWebhookName.trim()) {
            onAddWebhook(newWebhookName.trim());
            setNewWebhookName('');
            setAddModalOpen(false);
        }
    };

    return (
        <>
            {isAddModalOpen && (
                <Modal isOpen={true} onClose={() => setAddModalOpen(false)} title="Create New Webhook">
                    <div>
                        <label className="block text-sm font-medium text-subtle">Webhook Name</label>
                        <input
                            type="text"
                            value={newWebhookName}
                            onChange={e => setNewWebhookName(e.target.value)}
                            placeholder="e.g., Zapier Integration"
                            className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500"
                        />
                        <p className="text-xs text-subtle mt-1">A unique URL will be generated for this webhook.</p>
                    </div>
                     <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-muted">
                        <button type="button" onClick={() => setAddModalOpen(false)} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button type="button" onClick={handleAdd} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Create</button>
                    </div>
                </Modal>
            )}
            <div className="space-y-3">
                 <div className="flex justify-end">
                     <button onClick={() => setAddModalOpen(true)} className="bg-blue-500/20 text-blue-400 font-semibold py-2 px-3 rounded-md hover:bg-blue-500/30 text-sm">+ Create Webhook</button>
                </div>
                {Array.isArray(webhooks) && webhooks.map(webhook => (
                    <div key={webhook.id} className="bg-background p-3 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-grow">
                            <p className="font-semibold text-on-surface">{webhook.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <input type="text" readOnly value={webhook.url} className="w-full bg-surface border border-muted rounded-md py-1 px-2 text-subtle font-mono text-xs"/>
                                <button onClick={() => navigator.clipboard.writeText(webhook.url)} className="text-xs bg-muted hover:bg-subtle/80 text-on-surface font-bold py-1 px-2 rounded-md">Copy</button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                             <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={webhook.isEnabled} onChange={e => onToggleWebhook(webhook.id, e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                            <button onClick={() => onDeleteWebhook(webhook.id)} className="text-red-400 hover:text-red-300"><AppIcons.Delete className="w-5 h-5"/></button>
                        </div>
                    </div>
                ))}
                 {(!Array.isArray(webhooks) || webhooks.length === 0) && <p className="text-sm text-subtle text-center py-4">No custom webhooks created yet.</p>}
            </div>
        </>
    );
}

interface IntegrationsPageProps {
    logs: IntegrationLog[];
    settings: IntegrationSettings[];
    setSettings: React.Dispatch<React.SetStateAction<IntegrationSettings[]>>;
    customFieldDefs: CustomFieldDefinition[];
    syncFacebookLeads: () => void;
    onSendTestLead: (source: IntegrationSource, formName: string) => void;
    currentOrganization: Organization;
    webhooks: WebhookConfig[];
    onAddWebhook: (name: string) => void;
    onDeleteWebhook: (id: string) => void;
    onUpdateWebhook: (webhook: WebhookConfig) => void;
}

const IntegrationsPage: React.FC<IntegrationsPageProps> = ({ logs, settings, setSettings, customFieldDefs, onSendTestLead, syncFacebookLeads, currentOrganization, webhooks, onAddWebhook, onDeleteWebhook, onUpdateWebhook }) => {
    const [selectedSource, setSelectedSource] = useState<IntegrationSource | 'API' | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<'settings' | 'logs'>('settings');
    const [modalState, setModalState] = useState<{ source: IntegrationSource | null, type: 'connect' | 'map' }>({ source: null, type: 'connect' });
    const location = useLocation();
    const navigate = useNavigate();
    
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const status = params.get('status');
        const token = params.get('token');
        const message = params.get('message');

        if (status === 'fb_success' && token) {
            setSettings(prev => prev.map(s => s.source === 'Facebook' ? { ...s, isConnected: true } : s));
            setModalState({ source: 'Facebook', type: 'connect' });
            navigate(location.pathname, { replace: true });
        } else if (status === 'fb_error') {
            alert(`Facebook connection failed: ${message || 'Unknown error'}`);
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate, setSettings]);
    
    useEffect(() => {
        setActiveDetailTab('settings');
    }, [selectedSource]);

    const handleOpenModal = (source: IntegrationSource, type: 'connect' | 'map') => setModalState({ source, type });
    const handleCloseModal = () => setModalState({ source: null, type: 'connect' });
    const handleSaveConnection = (source: IntegrationSource, details: Partial<IntegrationSettings>) => setSettings(prev => prev.map(s => s.source === source ? { ...s, ...details } : s));
    const handleDisconnect = (source: IntegrationSource) => {
         if (window.confirm(`Are you sure you want to disconnect ${source}? This will stop new leads from coming in.`)) {
            setSettings(prev => prev.map(s => s.source === source ? {...s, isConnected: false, connectedAccounts: [], connectedWebsites: []} : s));
        }
    }
    const handleSaveMapping = (source: IntegrationSource, newMappings: FieldMapping[]) => {
         setSettings(prev => prev.map(s => s.source === source ? {...s, fieldMappings: newMappings} : s));
         handleCloseModal();
    }
    
    const integrationCategories = useMemo<Record<string, IntegrationSettings[]>>(() => ({
        'Lead Capture': settings.filter(s => ['Facebook', 'Google Ads', 'Website'].includes(s.source)),
        'Communication': settings.filter(s => ['Cloud Telephony', 'Email Marketing', 'SMS Marketing'].includes(s.source)),
    }), [settings]);

    const sourceIcons: Record<IntegrationSource, React.ReactElement> = {
        'Facebook': <div className="text-blue-500 bg-blue-500/10 p-2 rounded-lg"><AppIcons.Facebook className="h-6 w-6" /></div>,
        'Google Ads': <div className="text-orange-500 bg-orange-500/10 p-2 rounded-lg"><AppIcons.Google className="h-6 w-6" /></div>,
        'Website': <div className="text-purple-500 bg-purple-500/10 p-2 rounded-lg"><AppIcons.Globe className="h-6 w-6" /></div>,
        'Cloud Telephony': <div className="text-cyan-500 bg-cyan-500/10 p-2 rounded-lg"><AppIcons.Call className="h-6 w-6" /></div>,
        'Email Marketing': <div className="text-red-500 bg-red-500/10 p-2 rounded-lg"><AppIcons.Email className="h-6 w-6" /></div>,
        'SMS Marketing': <div className="text-indigo-500 bg-indigo-500/10 p-2 rounded-lg"><AppIcons.SMS className="h-6 w-6" /></div>,
    };
    
    const currentSetting = settings.find(s => s.source === selectedSource);

    const logsForSelectedSource = useMemo(() => {
        if (!selectedSource || selectedSource === 'API') return [];
        return logs.filter(log => log.source === selectedSource).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [logs, selectedSource]);

    const statsForSelectedSource = useMemo(() => {
        const total = logsForSelectedSource.length;
        const successful = logsForSelectedSource.filter(l => l.status === 'SUCCESS').length;
        const failed = total - successful;
        return { total, successful, failed };
    }, [logsForSelectedSource]);

    const totalForms = useMemo(() => {
        if (currentSetting && currentSetting.source === 'Facebook' && currentSetting.connectedAccounts) {
            const fbAccounts = currentSetting.connectedAccounts as ConnectedFacebookAccount[];
            return fbAccounts.reduce((acc, account) => acc + (account.pages || []).reduce((pAcc, page) => pAcc + (page.forms || []).length, 0), 0);
        }
        return 0;
    }, [currentSetting]);

    const renderSettingsContent = () => {
        if (selectedSource === 'API') {
            return (
                <div className="space-y-6">
                    <div className="bg-background p-6 rounded-lg border border-muted">
                        <h4 className="font-semibold text-lg">Organization API Key</h4>
                        <p className="text-subtle text-sm mt-1 mb-4">Use this key to integrate with other platforms via API.</p>
                        <div className="flex items-center gap-2">
                            <input type="text" readOnly value={currentOrganization.apiKey} className="w-full bg-surface border border-muted rounded-md py-2 px-3 text-subtle font-mono"/>
                            <button onClick={() => navigator.clipboard.writeText(currentOrganization.apiKey)} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-3 rounded-lg text-sm">Copy</button>
                        </div>
                    </div>
                     <div className="bg-background p-6 rounded-lg border border-muted">
                        <h4 className="font-semibold text-lg">Webhooks</h4>
                        <p className="text-subtle text-sm mt-1 mb-4">Send lead data to external URLs when leads are created or updated.</p>
                        <WebhookManager 
                            webhooks={webhooks} 
                            onAddWebhook={onAddWebhook}
                            onDeleteWebhook={onDeleteWebhook}
                            onToggleWebhook={(id, isEnabled) => {
                                const wh = webhooks.find(w => w.id === id);
                                if (wh) onUpdateWebhook({ ...wh, isEnabled });
                            }}
                        />
                    </div>
                </div>
            );
        }

        if (!currentSetting) return null;

        return (
            <div className="space-y-6">
                <div className="bg-background p-6 rounded-lg border border-muted">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold text-lg">Connection Status</h4>
                            <p className={`text-sm font-medium ${currentSetting.isConnected ? 'text-green-500' : 'text-subtle'}`}>
                                {currentSetting.isConnected ? 'Connected' : 'Not Connected'}
                            </p>
                        </div>
                        <button onClick={() => handleOpenModal(currentSetting.source, 'connect')} className={`py-2 px-4 rounded-lg font-semibold transition-colors text-sm ${currentSetting.isConnected ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}>
                            {currentSetting.isConnected ? 'Manage' : 'Connect'}
                        </button>
                    </div>
                    {currentSetting.isConnected && (
                        <div className="mt-4 pt-4 border-t border-muted text-sm text-subtle space-y-2">
                           {currentSetting.source === 'Facebook' && <p><strong>{totalForms}</strong> form(s) connected.</p>}
                           {(currentSetting.source === 'Google Ads' || currentSetting.source === 'Website') && <p><strong>{currentSetting.connectedAccounts?.length || currentSetting.connectedWebsites?.length || 0}</strong> account(s) connected.</p>}
                        </div>
                    )}
                </div>

                {currentSetting.isConnected && ['Facebook', 'Google Ads', 'Website', 'Email Marketing'].includes(currentSetting.source) && (
                    <div className="bg-background p-6 rounded-lg border border-muted">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-semibold text-lg">Field Mapping</h4>
                                <p className="text-sm text-subtle">{currentSetting.fieldMappings.length} fields mapped.</p>
                            </div>
                            <button onClick={() => handleOpenModal(currentSetting.source, 'map')} className="py-2 px-4 rounded-lg font-semibold transition-colors text-sm bg-purple-500/20 text-purple-400 hover:bg-purple-500/30">
                                Manage Mapping
                            </button>
                        </div>
                    </div>
                )}
                
                {currentSetting.isConnected && currentSetting.source === 'Facebook' && (
                    <div className="bg-background p-6 rounded-lg border border-muted">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-semibold text-lg">Manual Sync</h4>
                                <p className="text-sm text-subtle">Fetch recent leads that may have been missed.</p>
                            </div>
                            <button onClick={syncFacebookLeads} className="py-2 px-4 rounded-lg font-semibold transition-colors text-sm bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 flex items-center gap-2">
                                <AppIcons.Activity className="h-4 w-4" /> Sync Now
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };
    
    return (
        <div className="space-y-6 h-full flex flex-col">
            {modalState.type === 'connect' && modalState.source === 'Facebook' && currentSetting && ( <FacebookConnectModal setting={currentSetting} onClose={handleCloseModal} onSave={(details) => handleSaveConnection('Facebook', details)} onDisconnect={() => handleDisconnect('Facebook')} onSendTestLead={(formName) => onSendTestLead('Facebook', formName)} /> )}
            {modalState.type === 'connect' && modalState.source === 'Google Ads' && currentSetting && ( <GoogleConnectModal setting={currentSetting} onClose={handleCloseModal} onSave={(details) => handleSaveConnection('Google Ads', details)} onDisconnect={() => handleDisconnect('Google Ads')} /> )}
            {modalState.type === 'connect' && modalState.source === 'Website' && currentSetting && ( <WebsiteConnectModal setting={currentSetting} onClose={handleCloseModal} onSave={(details) => handleSaveConnection('Website', details)} onDisconnect={() => handleDisconnect('Website')} /> )}
            {modalState.type === 'connect' && modalState.source === 'Cloud Telephony' && currentSetting && ( <TelephonyConnectModal setting={currentSetting} onClose={handleCloseModal} onSave={(details) => handleSaveConnection('Cloud Telephony', details)} onDisconnect={() => handleDisconnect('Cloud Telephony')} /> )}
            {modalState.type === 'connect' && modalState.source === 'Email Marketing' && currentSetting && ( <EmailConnectModal setting={currentSetting} onClose={handleCloseModal} onSave={(details) => handleSaveConnection('Email Marketing', details)} onDisconnect={() => handleDisconnect('Email Marketing')} /> )}
            {modalState.type === 'connect' && modalState.source === 'SMS Marketing' && currentSetting && ( <SMSConnectModal setting={currentSetting} onClose={handleCloseModal} onSave={(details) => handleSaveConnection('SMS Marketing', details)} onDisconnect={() => handleDisconnect('SMS Marketing')} /> )}
            {modalState.type === 'map' && modalState.source && currentSetting && ( <FieldMappingModal  sourceName={modalState.source} currentMappings={currentSetting.fieldMappings} customFieldDefs={customFieldDefs} onClose={handleCloseModal} onSave={(mappings) => handleSaveMapping(modalState.source as IntegrationSource, mappings)} /> )}

            <div>
                <h2 className="text-3xl font-bold text-on-surface">Integration Hub</h2>
                <p className="text-subtle mt-1">Connect your marketing channels and other tools to supercharge your CRM.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,_1fr)_minmax(0,_2fr)] gap-8 flex-grow overflow-hidden">
                <div className="bg-surface rounded-xl shadow-sm border border-muted p-4 flex flex-col overflow-y-auto">
                    <div className="space-y-6">
                        {Object.entries(integrationCategories).map(([category, sources]) => (
                            <div key={category}>
                                <h3 className="px-3 text-xs font-semibold text-subtle uppercase tracking-wider mb-2">{category}</h3>
                                <div className="space-y-1">
                                    {Array.isArray(sources) && sources.map(setting => (
                                        <button key={setting.source} onClick={() => setSelectedSource(setting.source)} className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors ${selectedSource === setting.source ? 'bg-primary-500/10 text-on-surface' : 'text-subtle hover:bg-muted hover:text-on-surface'}`}>
                                            {sourceIcons[setting.source]}
                                            <span className="font-semibold text-on-surface flex-grow">{setting.source}</span>
                                            <div className={`flex items-center gap-1.5 text-xs font-medium ${setting.isConnected ? 'text-green-500' : 'text-amber-500'}`}>
                                                <span className={`h-2 w-2 rounded-full ${setting.isConnected ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                                                {setting.isConnected ? 'Connected' : 'Action Needed'}
                                            </div>
                                            <AppIcons.ChevronRight className={`h-4 w-4 transition-transform ${selectedSource === setting.source ? 'translate-x-1' : ''}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div>
                            <h3 className="px-3 text-xs font-semibold text-subtle uppercase tracking-wider mb-2">Developer</h3>
                            <div className="space-y-1">
                                <button onClick={() => setSelectedSource('API')} className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors ${selectedSource === 'API' ? 'bg-primary-500/10 text-on-surface' : 'text-subtle hover:bg-muted hover:text-on-surface'}`}>
                                    <div className="text-gray-500 bg-gray-500/10 p-2 rounded-lg"><AppIcons.Code className="h-6 w-6" /></div>
                                    <span className="font-semibold text-on-surface flex-grow">API & Webhooks</span>
                                    <AppIcons.ChevronRight className={`h-4 w-4 transition-transform ${selectedSource === 'API' ? 'translate-x-1' : ''}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-surface rounded-xl shadow-sm border border-muted flex flex-col">
                    {!selectedSource ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
                            <AppIcons.Integrations className="h-16 w-16 text-muted" />
                            <h3 className="mt-4 text-xl font-bold">Select an Integration</h3>
                            <p className="mt-1 text-subtle max-w-sm">Choose an integration from the list on the left to configure its settings and view activity logs.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-muted flex items-center gap-4">
                                {selectedSource === 'API' ? <div className="text-gray-500 bg-gray-500/10 p-3 rounded-lg"><AppIcons.Code className="h-8 w-8" /></div> : (() => {
                                    const originalElement = sourceIcons[selectedSource as IntegrationSource];
                                    const originalProps = originalElement.props as { children: React.ReactElement, className: string };
                                    const originalIconElement = originalProps.children;

                                    if (!React.isValidElement(originalIconElement)) {
                                        return originalElement; // Fallback for safety
                                    }

                                    // Reconstruct the icon component with a new className.
                                    const IconComponent = originalIconElement.type as React.ComponentType<{ className?: string }>;
                                    
                                    // Re-create the icon with new props (size)
                                    const newIcon = <IconComponent className="h-8 w-8" />;
                                    
                                    // Get the wrapper's className and replace padding class
                                    const newWrapperClassName = (originalProps.className || '').replace('p-2', 'p-3');

                                    // Reconstruct the wrapper div with the new className and the new icon
                                    return <div className={newWrapperClassName}>{newIcon}</div>;
                                })()}
                                <div>
                                    <h2 className="text-2xl font-bold text-on-surface">{selectedSource === 'API' ? 'API & Webhooks' : selectedSource}</h2>
                                    <p className="text-subtle text-sm">Manage your connection and view activity.</p>
                                </div>
                            </div>
                            <div className="px-6 border-b border-muted flex">
                                <button onClick={() => setActiveDetailTab('settings')} className={`px-1 py-3 text-sm font-semibold -mb-px ${activeDetailTab === 'settings' ? 'border-b-2 border-primary-500 text-on-surface' : 'text-subtle border-b-2 border-transparent'}`}>Settings</button>
                                {selectedSource !== 'API' && <button onClick={() => setActiveDetailTab('logs')} className={`ml-6 px-1 py-3 text-sm font-semibold -mb-px ${activeDetailTab === 'logs' ? 'border-b-2 border-primary-500 text-on-surface' : 'text-subtle border-b-2 border-transparent'}`}>Activity Logs</button>}
                            </div>
                            <div className="flex-grow overflow-y-auto p-6">
                                {activeDetailTab === 'settings' && renderSettingsContent()}
                                {activeDetailTab === 'logs' && selectedSource !== 'API' && (
                                     <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <StatCard title="Total" value={statsForSelectedSource.total.toString()} icon={<AppIcons.Leads className="h-6 w-6 text-blue-400"/>} />
                                            <StatCard title="Successful" value={statsForSelectedSource.successful.toString()} icon={<AppIcons.Success className="h-6 w-6 text-green-400"/>} />
                                            <StatCard title="Failed" value={statsForSelectedSource.failed.toString()} icon={<AppIcons.Failure className="h-6 w-6 text-red-400"/>} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-2">Detailed Log</h3>
                                            <div className="bg-background rounded-lg border border-muted max-h-96 overflow-y-auto">
                                                <table className="min-w-full divide-y divide-muted">
                                                    <tbody className="divide-y divide-muted">
                                                        {logsForSelectedSource.map(log => (
                                                            <tr key={log.id}>
                                                                <td className="p-3">
                                                                    <div className="text-sm font-medium text-on-surface">{log.payload?.name || 'N/A'}</div>
                                                                    <div className="text-xs text-subtle">{new Date(log.timestamp).toLocaleString()}</div>
                                                                </td>
                                                                <td className="p-3 text-sm text-subtle">{log.reason?.message || 'Lead processed successfully.'}</td>
                                                                <td className="p-3 text-right">
                                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.status === 'SUCCESS' ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}`}>
                                                                        {log.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                 {logsForSelectedSource.length === 0 && <p className="text-center text-subtle p-8">No logs found for this integration.</p>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IntegrationsPage;


