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
    onAddWebhook: (webhookData: Partial<WebhookConfig>) => void;
    onDeleteWebhook: (id: string) => void;
    onToggleWebhook: (id: string, isEnabled: boolean) => void;
    onTestWebhook: (id: string) => Promise<WebhookTestResult>;
    onViewLogs: (webhookId: string) => void;
    deleteModal?: {
        isOpen: boolean;
        webhook: WebhookConfig | null;
    };
    isDeleting?: boolean;
    deleteConfirmed?: boolean;
    onDeleteClick?: (webhook: WebhookConfig) => void;
    onDeleteConfirm?: () => void;
    onDeleteCancel?: () => void;
    onDeleteCheckboxChange?: (checked: boolean) => void;
}> = ({
    webhooks,
    onAddWebhook,
    onDeleteWebhook,
    onToggleWebhook,
    onTestWebhook,
    onViewLogs,
    deleteModal,
    isDeleting = false,
    deleteConfirmed = false,
    onDeleteClick,
    onDeleteConfirm,
    onDeleteCancel,
    onDeleteCheckboxChange
}) => {
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isTestModalOpen, setTestModalOpen] = useState(false);
    const [testingWebhook, setTestingWebhook] = useState<WebhookConfig | null>(null);
    const [testResult, setTestResult] = useState<WebhookTestResult | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [newWebhook, setNewWebhook] = useState({
        name: '',
        url: '',
        events: ['lead.created', 'lead.updated'] as ('lead.created' | 'lead.updated' | 'lead.deleted' | 'lead.stage_changed' | 'lead.assigned' | 'lead.received')[],
        isEnabled: true
    });

    const availableEvents = [
        { value: 'lead.created', label: 'Lead Created' },
        { value: 'lead.updated', label: 'Lead Updated' },
        { value: 'lead.deleted', label: 'Lead Deleted' },
        { value: 'lead.stage_changed', label: 'Stage Changed' },
        { value: 'lead.assigned', label: 'Lead Assigned' },
        { value: 'lead.received', label: 'Lead Received' }
    ];

    const handleAdd = () => {
        if (newWebhook.name.trim() && newWebhook.url.trim()) {
            onAddWebhook(newWebhook);
            setNewWebhook({
                name: '',
                url: '',
                events: ['lead.created', 'lead.updated'] as ('lead.created' | 'lead.updated' | 'lead.deleted' | 'lead.stage_changed' | 'lead.assigned' | 'lead.received')[],
                isEnabled: true
            });
            setAddModalOpen(false);
        }
    };

    const handleTest = async (webhook: WebhookConfig) => {
        setTestingWebhook(webhook);
        setIsTesting(true);
        setTestModalOpen(true);

        try {
            const result = await onTestWebhook(webhook.id);
            setTestResult(result);
        } catch (error) {
            setTestResult({
                success: false,
                error: error instanceof Error ? error.message : 'Test failed'
            });
        } finally {
            setIsTesting(false);
        }
    };

    const formatLastDelivery = (webhook: WebhookConfig) => {
        if (!webhook.lastTriggered) return 'Never';

        const date = new Date(webhook.lastTriggered!);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;

        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    return (
        <>
            {isAddModalOpen && (
                <Modal isOpen={true} onClose={() => setAddModalOpen(false)} title="Create New Webhook">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-subtle">Webhook Name</label>
                            <input
                                type="text"
                                value={newWebhook.name}
                                onChange={e => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Zapier Integration"
                                className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-subtle">Webhook URL</label>
                            <input
                                type="url"
                                value={newWebhook.url}
                                onChange={e => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                                placeholder="https://your-app.com/webhook"
                                className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500"
                            />
                            <p className="text-xs text-subtle mt-1">Must be a valid HTTPS URL</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-subtle mb-2">Events to Subscribe</label>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {availableEvents.map(event => (
                                    <label key={event.value} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={newWebhook.events.includes(event.value as any)}
                                            onChange={e => {
                                                if (e.target.checked) {
                                                    setNewWebhook(prev => ({
                                                        ...prev,
                                                        events: [...prev.events, event.value as any]
                                                    }));
                                                } else {
                                                    setNewWebhook(prev => ({
                                                        ...prev,
                                                        events: prev.events.filter(ev => ev !== event.value)
                                                    }));
                                                }
                                            }}
                                            className="mr-2"
                                        />
                                        <span className="text-sm">{event.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="webhookEnabled"
                                checked={newWebhook.isEnabled}
                                onChange={e => setNewWebhook(prev => ({ ...prev, isEnabled: e.target.checked }))}
                                className="mr-2"
                            />
                            <label htmlFor="webhookEnabled" className="text-sm font-medium text-subtle">
                                Enable webhook immediately
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-muted">
                        <button type="button" onClick={() => setAddModalOpen(false)} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button type="button" onClick={handleAdd} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Create</button>
                    </div>
                </Modal>
            )}

            {isTestModalOpen && testingWebhook && (
                <Modal isOpen={true} onClose={() => { setTestModalOpen(false); setTestResult(null); }} title={`Test Webhook: ${testingWebhook.name}`}>
                    <div className="space-y-4">
                        {isTesting ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                <span className="ml-3">Testing webhook...</span>
                            </div>
                        ) : testResult ? (
                            <>
                                <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                    <div className="flex items-center">
                                        {testResult.success ? (
                                            <AppIcons.CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                        ) : (
                                            <AppIcons.XCircle className="h-5 w-5 text-red-600 mr-2" />
                                        )}
                                        <span className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                            {testResult.success ? 'Test Successful' : 'Test Failed'}
                                        </span>
                                    </div>
                                    {testResult.status && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            HTTP Status: {testResult.status}
                                        </p>
                                    )}
                                    {testResult.responseTime && (
                                        <p className="text-sm text-gray-600">
                                            Response Time: {testResult.responseTime}ms
                                        </p>
                                    )}
                                </div>
                                {testResult.response && (
                                    <div>
                                        <label className="block text-sm font-medium text-subtle mb-2">Response</label>
                                        <textarea
                                            readOnly
                                            value={testResult.response.length > 300 ? testResult.response.substring(0, 300) + '...' : testResult.response}
                                            className="w-full bg-surface border border-muted rounded-md py-2 px-3 text-sm font-mono"
                                            rows={6}
                                        />
                                    </div>
                                )}
                                {testResult.error && (
                                    <div>
                                        <label className="block text-sm font-medium text-subtle mb-2">Error</label>
                                        <textarea
                                            readOnly
                                            value={testResult.error}
                                            className="w-full bg-surface border border-muted rounded-md py-2 px-3 text-sm font-mono text-red-600"
                                            rows={3}
                                        />
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>
                    <div className="flex justify-end mt-6 pt-4 border-t border-muted">
                        <button type="button" onClick={() => { setTestModalOpen(false); setTestResult(null); }} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Close</button>
                    </div>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal?.isOpen && deleteModal?.webhook && (
                <Modal isOpen={true} onClose={onDeleteCancel} title="Delete webhook">
                    <div className="space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <AppIcons.XCircle className="h-5 w-5 text-red-600 mr-2" />
                                <span className="font-medium text-red-800">This action cannot be undone.</span>
                            </div>
                        </div>

                        <p className="text-sm text-subtle">
                            This will permanently remove the webhook and stop all future deliveries.
                        </p>

                        <div className="bg-background p-4 rounded-lg border border-muted space-y-3">
                            <div>
                                <span className="font-medium text-on-surface">Name: </span>
                                <span className="text-subtle">{deleteModal.webhook.name}</span>
                            </div>
                            <div>
                                <span className="font-medium text-on-surface">URL: </span>
                                <span className="text-subtle font-mono text-xs break-all">{deleteModal.webhook.url}</span>
                            </div>
                            <div>
                                <span className="font-medium text-on-surface">Events: </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {deleteModal.webhook.events?.map((event: string) => (
                                        <span key={event} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                            {availableEvents.find(e => e.value === event)?.label || event}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <span className="font-medium text-on-surface">Last delivery: </span>
                                <span className="text-subtle">{formatLastDelivery(deleteModal.webhook)}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-start">
                                <input
                                    type="checkbox"
                                    checked={deleteConfirmed}
                                    onChange={e => onDeleteCheckboxChange?.(e.target.checked)}
                                    className="mt-1 mr-3"
                                />
                                <span className="text-sm text-subtle">
                                    I understand this will permanently delete the webhook and its delivery history.
                                </span>
                            </label>

                            <div className="flex justify-end gap-3 pt-4 border-t border-muted">
                                <button
                                    type="button"
                                    onClick={onDeleteCancel}
                                    className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg"
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={onDeleteConfirm}
                                    disabled={!deleteConfirmed || isDeleting}
                                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-2 px-4 rounded-lg disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isDeleting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                                    Delete webhook
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            <div className="space-y-3">
                <div className="flex justify-end">
                    <button onClick={() => setAddModalOpen(true)} className="bg-blue-500/20 text-blue-400 font-semibold py-2 px-3 rounded-md hover:bg-blue-500/30 text-sm">+ Create Webhook</button>
                </div>

                {Array.isArray(webhooks) && webhooks.map(webhook => (
                    <div key={webhook.id} className="bg-background p-4 rounded-lg border border-muted">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-on-surface">{webhook.name}</h4>
                                    <span className={`px-2 py-1 text-xs rounded-full ${webhook.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {webhook.isEnabled ? 'Active' : 'Disabled'}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={webhook.url}
                                        className="flex-1 min-w-0 bg-surface border border-muted rounded-md py-1 px-2 text-subtle font-mono text-xs"
                                    />
                                    <button
                                        onClick={() => navigator.clipboard.writeText(webhook.url)}
                                        className="text-xs bg-muted hover:bg-subtle/80 text-on-surface font-bold py-1 px-2 rounded-md whitespace-nowrap"
                                        title="Copy URL"
                                    >
                                        Copy URL
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-1 mb-2">
                                    {webhook.events?.map(event => (
                                        <span key={event} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                            {availableEvents.find(e => e.value === event)?.label || event}
                                        </span>
                                    ))}
                                </div>

                                <div className="text-xs text-subtle">
                                    Last delivery: {formatLastDelivery(webhook)} •
                                    Total deliveries: {webhook.triggerCount || 0}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={webhook.isEnabled}
                                        onChange={e => onToggleWebhook(webhook.id, e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                </label>

                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleTest(webhook)}
                                        className="text-xs bg-green-100 hover:bg-green-200 text-green-800 font-bold py-1 px-2 rounded-md"
                                        title="Test Webhook"
                                    >
                                        Test
                                    </button>
                                    <button
                                        onClick={() => onViewLogs(webhook.id)}
                                        className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold py-1 px-2 rounded-md"
                                        title="View Logs"
                                    >
                                        Logs
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (webhook.secret) {
                                                navigator.clipboard.writeText(webhook.secret!);
                                                // You might want to show a toast notification here
                                            }
                                        }}
                                        className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold py-1 px-2 rounded-md"
                                        title="Copy Secret"
                                        disabled={!webhook.secret}
                                    >
                                        Copy Secret
                                    </button>
                                    <button
                                        onClick={() => onDeleteClick?.(webhook)}
                                        className="text-xs bg-red-100 hover:bg-red-200 text-red-800 font-bold py-1 px-2 rounded-md"
                                        title="Delete Webhook"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {(!Array.isArray(webhooks) || webhooks.length === 0) && (
                    <p className="text-sm text-subtle text-center py-8">No webhooks created yet. Create your first webhook to start receiving lead events.</p>
                )}
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
    onAddWebhook: (webhookData: Partial<WebhookConfig>) => void;
    onDeleteWebhook: (id: string) => void;
    onUpdateWebhook: (webhook: WebhookConfig) => void;
    onRefreshApiKey?: () => void;
}

const IntegrationsPage: React.FC<IntegrationsPageProps> = ({ logs, settings, setSettings, customFieldDefs, onSendTestLead, syncFacebookLeads, currentOrganization, webhooks, onAddWebhook, onDeleteWebhook, onUpdateWebhook, onRefreshApiKey }) => {
    const [selectedSource, setSelectedSource] = useState<IntegrationSource | 'API' | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<'settings' | 'logs'>('settings');
    const [modalState, setModalState] = useState<{ source: IntegrationSource | null, type: 'connect' | 'map' }>({ source: null, type: 'connect' });
    const [apiKeyVisible, setApiKeyVisible] = useState(false);
    const [apiKeyData, setApiKeyData] = useState<OrganizationApiKeyData | null>(null);
    const [isLoadingApiKey, setIsLoadingApiKey] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        webhook: WebhookConfig | null;
    }>({ isOpen: false, webhook: null });
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteConfirmed, setDeleteConfirmed] = useState(false);
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

    useEffect(() => {
        if (selectedSource === 'API') {
            fetchOrganizationApiKey();
        }
    }, [selectedSource]);

    const fetchOrganizationApiKey = async () => {
        try {
            setIsLoadingApiKey(true);
            const response = await fetch('http://localhost:5000/api/settings/api-key', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data.success) {
                setApiKeyData(data.data);
            }
        } catch (error) {
            console.error('Error fetching API key:', error);
        } finally {
            setIsLoadingApiKey(false);
        }
    };

    const generateApiKey = async () => {
        try {
            setIsLoadingApiKey(true);
            const response = await fetch('/api/settings/api-key/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setApiKeyData(data.data);
                onRefreshApiKey?.();
            }
        } catch (error) {
            console.error('Error generating API key:', error);
        } finally {
            setIsLoadingApiKey(false);
        }
    };

    const regenerateApiKey = async () => {
        if (!window.confirm('Are you sure you want to regenerate the API key? The old key will be invalidated immediately.')) {
            return;
        }

        try {
            setIsLoadingApiKey(true);
            const response = await fetch('/api/settings/api-key/regenerate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setApiKeyData(data.data);
                onRefreshApiKey?.();
            }
        } catch (error) {
            console.error('Error regenerating API key:', error);
        } finally {
            setIsLoadingApiKey(false);
        }
    };

    const revokeApiKey = async () => {
        if (!window.confirm('Are you sure you want to revoke the API key? This will disable API access immediately.')) {
            return;
        }

        try {
            setIsLoadingApiKey(true);
            const response = await fetch('/api/settings/api-key/revoke', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setApiKeyData(data.data);
                onRefreshApiKey?.();
            }
        } catch (error) {
            console.error('Error revoking API key:', error);
        } finally {
            setIsLoadingApiKey(false);
        }
    };

    const testWebhook = async (webhookId: string): Promise<WebhookTestResult> => {
        const response = await fetch(`http://localhost:5000/api/webhooks/${webhookId}/test`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (data.success) {
            return data.testResult;
        }
        throw new Error(data.message || 'Test failed');
    };

    const viewWebhookLogs = (webhookId: string) => {
        // For now, just show an alert. In a real implementation, this would open a modal with logs
        alert(`View logs for webhook ${webhookId}. This would open a modal with delivery logs.`);
    };

    const handleDeleteClick = (webhook: WebhookConfig) => {
        setDeleteModal({ isOpen: true, webhook });
        setDeleteConfirmed(false);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.webhook || !deleteConfirmed) return;

        setIsDeleting(true);
        try {
            console.log('Deleting webhook:', deleteModal.webhook.id);
            await onDeleteWebhook(deleteModal.webhook.id);
            setDeleteModal({ isOpen: false, webhook: null });
            // Show success toast (you can implement toast notification here)
            alert(`Webhook "${deleteModal.webhook.name}" deleted successfully`);
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Couldn\'t delete webhook. Try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, webhook: null });
        setDeleteConfirmed(false);
    };

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

                        {isLoadingApiKey ? (
                            <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                                <span className="ml-2 text-sm text-subtle">Loading...</span>
                            </div>
                        ) : apiKeyData ? (
                            <>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type={apiKeyVisible ? "text" : "password"}
                                            readOnly
                                            value={apiKeyData.apiKey || 'No API key generated'}
                                            className="w-full bg-surface border border-muted rounded-md py-2 px-3 text-subtle font-mono"
                                            placeholder="No API key generated"
                                        />
                                        <button
                                            onClick={() => setApiKeyVisible(!apiKeyVisible)}
                                            className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-3 rounded-lg text-sm"
                                            title={apiKeyVisible ? "Hide API Key" : "Show API Key"}
                                        >
                                            {apiKeyVisible ? <AppIcons.EyeOff className="w-4 h-4" /> : <AppIcons.Eye className="w-4 h-4" />}
                                        </button>
                                        {apiKeyData.apiKey && (
                                            <button
                                                onClick={() => navigator.clipboard.writeText(apiKeyData.apiKey!)}
                                                className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-3 rounded-lg text-sm"
                                                title="Copy API Key"
                                            >
                                                Copy
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="text-sm">
                                            <span className={`font-medium ${apiKeyData.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                                Status: {apiKeyData.status === 'active' ? 'Active' : 'Revoked'}
                                            </span>
                                            {apiKeyData.lastUsed && (
                                                <span className="text-subtle ml-4">
                                                    Last used: {new Date(apiKeyData.lastUsed).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4 pt-4 border-t border-muted">
                                    {!apiKeyData.hasApiKey ? (
                                        <button
                                            onClick={generateApiKey}
                                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
                                        >
                                            Generate API Key
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={regenerateApiKey}
                                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
                                            >
                                                Regenerate
                                            </button>
                                            <button
                                                onClick={revokeApiKey}
                                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
                                            >
                                                Revoke
                                            </button>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-4 text-subtle">
                                Failed to load API key data
                            </div>
                        )}
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
                            onTestWebhook={testWebhook}
                            onViewLogs={viewWebhookLogs}
                            deleteModal={deleteModal}
                            isDeleting={isDeleting}
                            deleteConfirmed={deleteConfirmed}
                            onDeleteClick={handleDeleteClick}
                            onDeleteConfirm={handleDeleteConfirm}
                            onDeleteCancel={handleDeleteCancel}
                            onDeleteCheckboxChange={setDeleteConfirmed}
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


