import React, { useMemo, useState, useEffect } from 'react';
import { IntegrationLog, IntegrationSettings, IntegrationSource, CustomFieldDefinition, FieldMapping, Organization, WebhookConfig, ConnectedFacebookAccount, OrganizationApiKeyData, WebhookTestResult, FacebookAccount, Mapping, LogEntry, LogStatus } from '../../types';
import { AppIcons } from '../ui/Icons';
import FieldMappingModal from '../ui/FieldMappingModal';
import FacebookConnectModal from '../integrations/FacebookConnectModal';
import GoogleConnectModal from '../integrations/GoogleConnectModal';
import WebsiteConnectModal from '../integrations/WebsiteConnectModal';
import TelephonyConnectModal from '../integrations/TelephonyConnectModal';
import EmailConnectModal from '../integrations/EmailConnectModal';
import SMSConnectModal from '../integrations/SMSConnectModal';
import { useLocation, useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import WebhookLogsModal from '../ui/WebhookLogsModal';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { CreateMappingModal } from '../../src/components/ui/CreateMappingModal';
import { LeadsDashboard } from '../../src/components/ui/LeadsDashboard';

const WebhookManager: React.FC<{
    webhooks: WebhookConfig[];
    onAddWebhook: (webhookData: Partial<WebhookConfig>) => void;
    onDeleteWebhook: (id: string) => void;
    onToggleWebhook: (id: string, isEnabled: boolean) => void;
    onTestWebhook: (id: string) => Promise<WebhookTestResult>;
    onViewLogs: (webhookId: string, webhookName: string) => void;
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
                                        onClick={() => {
                                            const id = webhook._id;
                                            console.log('Webhook data:', { id, name: webhook.name, webhook });
                                            onViewLogs(id, webhook.name);
                                        }}
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

const StatCard: React.FC<{ title: string; value: string | number; description: string }> = ({ title, value, description }) => (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <div className="mt-1">
            <p className="text-3xl font-semibold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
    </div>
);

interface AccountsTabProps {
    accounts: FacebookAccount[];
    onAccountsChange: (accounts: FacebookAccount[]) => void;
    onAddAccount: () => void;
    mappings: Mapping[];
    logs: LogEntry[];
}

// Default empty arrays for when no data is available
const defaultAccounts: FacebookAccount[] = [];
const defaultMappings: Mapping[] = [];
const defaultLogs: LogEntry[] = [];

export const AccountsTab: React.FC<AccountsTabProps> = ({ accounts, onAccountsChange, onAddAccount, mappings, logs }) => {

    // Interactive state management
    const [displayAccounts, setDisplayAccounts] = useState<FacebookAccount[]>(accounts || defaultAccounts);
    const [isAddingAccount, setIsAddingAccount] = useState(false);
    const [reconnectingAccount, setReconnectingAccount] = useState<string | null>(null);
    const [toggleFeedback, setToggleFeedback] = useState<{pageId: string, type: 'success' | 'error'} | null>(null);
    const [addAccountFeedback, setAddAccountFeedback] = useState<string | null>(null);

    // Mapping tab state
    const [isCreatingMapping, setIsCreatingMapping] = useState(false);
    const [editingMapping, setEditingMapping] = useState<string | null>(null);
    const [deletingMapping, setDeletingMapping] = useState<string | null>(null);


    // Calculate stats dynamically
    const totalAccounts = displayAccounts.length;
    const totalMappings = (mappings || defaultMappings).length;
    const totalLeads = (logs || defaultLogs).length;
    const successfulLeads = (logs || defaultLogs).filter(l => l.status === LogStatus.SUCCESS).length;
    const successRate = totalLeads > 0 ? ((successfulLeads / totalLeads) * 100).toFixed(1) : '100';

    // Calculate total subscribed pages across all accounts
    const totalSubscribedPages = displayAccounts.reduce((acc, account) =>
        acc + account.pages.filter(page => page.subscribed).length, 0
    );

    const handleAddAccount = async () => {
        setIsAddingAccount(true);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Add new mock account
        const newAccount: FacebookAccount = {
            id: Date.now().toString(),
            name: `New Account ${totalAccounts + 1}`,
            tokenStatus: 'valid',
            pages: [
                {
                    fbPageId: `new_page_${Date.now()}`,
                    name: 'New Business Page',
                    subscribed: false,
                    forms: []
                }
            ]
        };

        const updatedAccounts = [...displayAccounts, newAccount];
        setDisplayAccounts(updatedAccounts);
        onAccountsChange(updatedAccounts);

        // Show success feedback
        setAddAccountFeedback(`Successfully added ${newAccount.name}!`);
        setTimeout(() => setAddAccountFeedback(null), 3000);

        setIsAddingAccount(false);
    };

    const handleReconnect = async (accountId: string) => {
        setReconnectingAccount(accountId);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const updatedAccounts = displayAccounts.map(acc =>
            acc.id === accountId ? { ...acc, tokenStatus: 'valid' as const } : acc
        );
        setDisplayAccounts(updatedAccounts);
        onAccountsChange(updatedAccounts);
        setReconnectingAccount(null);
    };

    const handleSubscriptionToggle = async (accountId: string, pageId: string, subscribed: boolean) => {
        // Show visual feedback
        setToggleFeedback({pageId, type: 'success'});

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const updatedAccounts = displayAccounts.map(acc => {
            if (acc.id === accountId) {
                return {
                    ...acc,
                    pages: acc.pages.map(page =>
                        page.fbPageId === pageId ? { ...page, subscribed } : page
                    ),
                };
            }
            return acc;
        });
        setDisplayAccounts(updatedAccounts);
        onAccountsChange(updatedAccounts);

        // Clear feedback after animation
        setTimeout(() => setToggleFeedback(null), 1000);
    };


    return (
        <div className="space-y-6">
            {/* Success Feedback */}
            {addAccountFeedback && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AppIcons.CheckCircle className="h-5 w-5" />
                    <span className="font-medium">{addAccountFeedback}</span>
                </div>
            )}

            {/* Dashboard Stats */}
            <div>
                <h4 className="font-semibold text-lg mb-4">Dashboard</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-background p-4 rounded-lg border border-muted">
                        <p className="text-sm font-medium text-subtle">Total Accounts</p>
                        <p className="text-2xl font-bold text-on-surface">{totalAccounts}</p>
                        <p className="text-xs text-subtle">Connected Facebook accounts</p>
                    </div>
                    <div className="bg-background p-4 rounded-lg border border-muted">
                        <p className="text-sm font-medium text-subtle">Total Mappings</p>
                        <p className="text-2xl font-bold text-on-surface">{totalMappings}</p>
                        <p className="text-xs text-subtle">Active form mappings</p>
                    </div>
                    <div className="bg-background p-4 rounded-lg border border-muted">
                        <p className="text-sm font-medium text-subtle">Leads Synced (24h)</p>
                        <p className="text-2xl font-bold text-on-surface">{totalLeads}</p>
                        <p className="text-xs text-subtle">From all active mappings</p>
                    </div>
                    <div className="bg-background p-4 rounded-lg border border-muted">
                        <p className="text-sm font-medium text-subtle">Success Rate</p>
                        <p className="text-2xl font-bold text-green-600">{successRate}%</p>
                        <p className="text-xs text-subtle">Successful sync operations</p>
                    </div>
                </div>
            </div>

            {/* Connected Accounts */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h4 className="font-semibold text-lg">Connected Accounts</h4>
                        <p className="text-sm text-subtle">Manage your connected Facebook accounts and pages.</p>
                    </div>
                    <button
                        onClick={handleAddAccount}
                        disabled={isAddingAccount}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2"
                    >
                        {isAddingAccount ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Adding...
                            </>
                        ) : (
                            <>
                                <AppIcons.Add className="h-4 w-4" />
                                Add Account
                            </>
                        )}
                    </button>
                </div>

                <div className="space-y-4">
                    {displayAccounts.map(account => (
                        <div key={account.id} className="bg-background p-4 rounded-lg border border-muted">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="text-blue-600 bg-blue-600/10 p-2 rounded-lg">
                                        <AppIcons.Facebook className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h5 className="font-semibold text-on-surface">{account.name}</h5>
                                        <div className="flex items-center gap-2">
                                            <span className={`h-2 w-2 rounded-full ${account.tokenStatus === 'valid' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            {account.tokenStatus === 'expired' && (
                                                <>
                                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Token Expired</span>
                                                    <button
                                                        onClick={() => handleReconnect(account.id)}
                                                        disabled={reconnectingAccount === account.id}
                                                        className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-1 px-3 rounded-md flex items-center gap-1"
                                                    >
                                                        {reconnectingAccount === account.id ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                                Connecting...
                                                            </>
                                                        ) : (
                                                            'Reconnect'
                                                        )}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Facebook Pages */}
                            <div className="space-y-3">
                                {account.pages.map(page => (
                                    <div key={page.fbPageId} className="flex justify-between items-center py-2 border-t border-muted/50">
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium text-sm text-on-surface">{page.name}</span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                page.subscribed
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {page.subscribed ? 'Subscribed' : 'Not Subscribed'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-subtle">Enable Webhooks</span>
                                            <div className="relative">
                                                <ToggleSwitch
                                                    checked={page.subscribed}
                                                    onChange={(checked) => {
                                                        handleSubscriptionToggle(account.id, page.fbPageId, checked);
                                                    }}
                                                />
                                                {toggleFeedback?.pageId === page.fbPageId && (
                                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded animate-pulse">
                                                        Updated!
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
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
    const [modalState, setModalState] = useState<{ source: IntegrationSource | null, type: 'connect' | 'map' }>({ source: null, type: 'connect' });
    const [apiKeyVisible, setApiKeyVisible] = useState(false);
    const [apiKeyData, setApiKeyData] = useState<OrganizationApiKeyData | null>(null);
    const [isLoadingApiKey, setIsLoadingApiKey] = useState(false);
    const [showFullApiKey, setShowFullApiKey] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        webhook: WebhookConfig | null;
    }>({ isOpen: false, webhook: null });
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteConfirmed, setDeleteConfirmed] = useState(false);
    const [deleteResult, setDeleteResult] = useState<{
        type: 'success' | 'error' | null;
        message: string;
    }>({ type: null, message: '' });
    const [logsModal, setLogsModal] = useState<{
        isOpen: boolean;
        webhookId: string;
        webhookName: string;
    }>({ isOpen: false, webhookId: '', webhookName: '' });

    // Mapping modal state
    const [isCreateMappingModalOpen, setIsCreateMappingModalOpen] = useState(false);
    const [editingMapping, setEditingMapping] = useState<any>(null);
    const [isCreatingMapping, setIsCreatingMapping] = useState(false);
    const [deletingMapping, setDeletingMapping] = useState<string | null>(null);

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
    

    const fetchOrganizationApiKey = async (unmasked = false) => {
        try {
            setIsLoadingApiKey(true);
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            console.log('API Key fetch - Token parts:', token ? token.split('.').length : 'No token');

            if (!token) {
                console.error('No token found in localStorage');
                return;
            }

            // Validate token format (should be JWT with 3 parts)
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                console.error('Invalid token format. Expected JWT with 3 parts, got:', tokenParts.length);
                return;
            }

            const url = unmasked
                ? 'https://crm.clienn.com/api/settings/api-key?unmasked=true'
                : 'https://crm.clienn.com/api/settings/api-key';

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Key fetch failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });
                return;
            }

            const data = await response.json();
            console.log('API Key fetch response:', data);

            if (data.success) {
                setApiKeyData(data.data);
                // If unmasked was requested, temporarily show the full key
                if (unmasked && data.data.fullApiKey) {
                    setShowFullApiKey(true);
                    // Auto-hide full key after 5 seconds for security
                    setTimeout(() => {
                        setShowFullApiKey(false);
                    }, 5000);
                }
            } else {
                console.error('API Key fetch returned error:', data.message);
            }
        } catch (error) {
            console.error('Error fetching API key:', error);
        } finally {
            setIsLoadingApiKey(false);
        }
    };

    const handleToggleApiKeyVisibility = async () => {
        if (!apiKeyVisible) {
            setApiKeyVisible(true);
        } else {
            // If eye icon is clicked while already visible, fetch unmasked version
            await fetchOrganizationApiKey(true);
        }
    };

    const generateApiKey = async () => {
        try {
            setIsLoadingApiKey(true);
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');

            if (!token) {
                console.error('No authentication token found');
                alert('Authentication token not found. Please log in again.');
                return;
            }

            // Validate token format (should be JWT with 3 parts)
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                console.error('Invalid token format. Expected JWT with 3 parts, got:', tokenParts.length);
                alert('Invalid authentication token format. Please log in again.');
                return;
            }

            console.log('Generating API key with valid JWT token');

            const response = await fetch('https://crm.clienn.com/api/settings/api-key/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Generate API key failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });
                alert(`Failed to generate API key: ${response.statusText}`);
                return;
            }

            const data = await response.json();
            console.log('Generate API key response:', data);

            if (data.success) {
                setApiKeyData(data.data);
                onRefreshApiKey?.();
                alert('API key generated successfully!');
            } else {
                alert(`Failed to generate API key: ${data.message}`);
            }
        } catch (error) {
            console.error('Error generating API key:', error);
            alert('Error generating API key. Please try again.');
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
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');

            if (!token) {
                console.error('No authentication token found');
                alert('Authentication token not found. Please log in again.');
                return;
            }

            // Validate token format (should be JWT with 3 parts)
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                console.error('Invalid token format. Expected JWT with 3 parts, got:', tokenParts.length);
                alert('Invalid authentication token format. Please log in again.');
                return;
            }

            console.log('Regenerating API key with valid JWT token');

            const response = await fetch('https://crm.clienn.com/api/settings/api-key/regenerate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Regenerate API key failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });
                alert(`Failed to regenerate API key: ${response.statusText}`);
                return;
            }

            const data = await response.json();
            console.log('Regenerate API key response:', data);

            if (data.success) {
                setApiKeyData(data.data);
                onRefreshApiKey?.();
                alert('API key regenerated successfully!');
            } else {
                alert(`Failed to regenerate API key: ${data.message}`);
            }
        } catch (error) {
            console.error('Error regenerating API key:', error);
            alert('Error regenerating API key. Please try again.');
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
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');

            if (!token) {
                console.error('No authentication token found');
                alert('Authentication token not found. Please log in again.');
                return;
            }

            // Validate token format (should be JWT with 3 parts)
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                console.error('Invalid token format. Expected JWT with 3 parts, got:', tokenParts.length);
                alert('Invalid authentication token format. Please log in again.');
                return;
            }

            console.log('Revoking API key with valid JWT token');

            const response = await fetch('https://crm.clienn.com/api/settings/api-key/revoke', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Revoke API key failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });
                alert(`Failed to revoke API key: ${response.statusText}`);
                return;
            }

            const data = await response.json();
            console.log('Revoke API key response:', data);

            if (data.success) {
                setApiKeyData(data.data);
                onRefreshApiKey?.();
                alert('API key revoked successfully!');
            } else {
                alert(`Failed to revoke API key: ${data.message}`);
            }
        } catch (error) {
            console.error('Error revoking API key:', error);
            alert('Error revoking API key. Please try again.');
        } finally {
            setIsLoadingApiKey(false);
        }
    };

    const testWebhook = async (webhookId: string): Promise<WebhookTestResult> => {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');

        if (!token) {
            throw new Error('No authentication token found');
        }

        // Validate token format (should be JWT with 3 parts)
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            throw new Error('Invalid authentication token format');
        }

        const response = await fetch(`https://crm.clienn.com/api/webhooks/${webhookId}/test`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (data.success) {
            return data.testResult;
        }
        throw new Error(data.message || 'Test failed');
    };

    const viewWebhookLogs = (webhookId: string, webhookName: string) => {
        console.log('Opening logs modal for webhook:', { webhookId, webhookName });
        if (!webhookId) {
            console.error('Webhook ID is undefined!');
            return;
        }
        setLogsModal({ isOpen: true, webhookId, webhookName });
    };

    const handleDeleteClick = (webhook: WebhookConfig) => {
        setDeleteModal({ isOpen: true, webhook });
        setDeleteConfirmed(false);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.webhook || !deleteConfirmed) return;

        setIsDeleting(true);
        setDeleteResult({ type: null, message: '' });

        try {
            // Use _id if available, otherwise fall back to id
            const webhookId = deleteModal.webhook._id || deleteModal.webhook.id;
            console.log('Deleting webhook:', webhookId);
            await onDeleteWebhook(webhookId);
            setDeleteModal({ isOpen: false, webhook: null });
            setDeleteResult({
                type: 'success',
                message: `Webhook "${deleteModal.webhook.name}" deleted successfully`
            });

            // Auto-clear success message after 3 seconds
            setTimeout(() => {
                setDeleteResult({ type: null, message: '' });
            }, 3000);
        } catch (error) {
            console.error('Delete failed:', error);
            setDeleteResult({
                type: 'error',
                message: 'Couldn\'t delete webhook. Please try again.'
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, webhook: null });
        setDeleteConfirmed(false);
        setDeleteResult({ type: null, message: '' });
    };

    const handleOpenModal = (source: IntegrationSource, type: 'connect' | 'map') => setModalState({ source, type });
    const handleCloseModal = () => setModalState({ source: null, type: 'connect' });
    const handleSaveConnection = async (source: IntegrationSource, details: Partial<IntegrationSettings>) => {
        // Update local state first
        setSettings(prev => prev.map(s => s.source === source ? { ...s, ...details } : s));

        // If this is a new integration setting, save it to the backend
        const existingSetting = settings.find(s => s.source === source);
        if (!existingSetting) {
            try {
                const newSetting = {
                    source,
                    organizationId: currentOrganization?.id || '',
                    isConnected: details.isConnected || false,
                    fieldMappings: details.fieldMappings || [],
                    connectedAccounts: details.connectedAccounts || [],
                    connectedWebsites: details.connectedWebsites || []
                };

                // Save to backend (you might want to add an API endpoint for this)
                console.log('Saving new integration setting:', newSetting);
            } catch (error) {
                console.error('Failed to save integration setting:', error);
            }
        }
    };
    const handleDisconnect = (source: IntegrationSource) => {
         if (window.confirm(`Are you sure you want to disconnect ${source}? This will stop new leads from coming in.`)) {
            setSettings(prev => prev.map(s => s.source === source ? {...s, isConnected: false, connectedAccounts: [], connectedWebsites: []} : s));
        }
    }
    const handleSaveMapping = (source: IntegrationSource, newMappings: FieldMapping[]) => {
           setSettings(prev => prev.map(s => s.source === source ? {...s, fieldMappings: newMappings} : s));
           handleCloseModal();
     }

    // Mapping modal handlers
    const handleCreateMapping = () => {
        setIsCreateMappingModalOpen(true);
    };

    const handleEditMapping = (mappingName: string) => {
        setEditingMapping({ name: mappingName });
        setIsCreateMappingModalOpen(true);
    };

    const handleDeleteMapping = (mappingName: string) => {
        if (window.confirm(`Are you sure you want to delete the mapping "${mappingName}"?`)) {
            // Here you would typically call an API to delete the mapping
            console.log(`Deleting mapping: ${mappingName}`);
        }
    };

    const handleBackfillLeads = (mappingName: string) => {
        // Placeholder for backfill functionality
        console.log(`Backfilling leads for mapping: ${mappingName}`);
    };

    const handleSendTestLead = () => {
        onSendTestLead('Facebook', 'Test Form');
    };

    const handleCreateMappingSave = (mappingData: any) => {
        console.log('Creating new mapping:', mappingData);
        setIsCreateMappingModalOpen(false);
        setEditingMapping(null);
    };

    const handleUpdateMappingSave = (mappingData: any) => {
        console.log('Updating mapping:', mappingData);
        setIsCreateMappingModalOpen(false);
        setEditingMapping(null);
    };

    
    // Ensure all integration types have default entries
    const allIntegrations: IntegrationSource[] = ['Facebook', 'Google Ads', 'Website', 'Cloud Telephony', 'Email Marketing', 'SMS Marketing'];

    const integrationCategories = useMemo<Record<string, IntegrationSettings[]>>(() => {
        // Create default settings for any missing integrations
        const existingSources = settings.map(s => s.source);
        const missingIntegrations = allIntegrations.filter(source => !existingSources.includes(source));

        const defaultSettings = missingIntegrations.map(source => ({
            source,
            isConnected: false,
            fieldMappings: [],
            organizationId: currentOrganization?.id || '',
            connectedAccounts: [],
            connectedWebsites: []
        }));

        const allSettings = [...settings, ...defaultSettings];

        return {
            'Lead Capture': allSettings.filter(s => ['Facebook', 'Google Ads', 'Website'].includes(s.source)),
            'Communication': allSettings.filter(s => ['Cloud Telephony', 'Email Marketing', 'SMS Marketing'].includes(s.source)),
        };
    }, [settings, currentOrganization?.id]);

    const sourceIcons: Record<IntegrationSource, React.ReactElement> = {
        'Facebook': <div className="text-blue-500 bg-blue-500/10 p-2 rounded-lg"><AppIcons.Facebook className="h-6 w-6" /></div>,
        'Google Ads': <div className="text-orange-500 bg-orange-500/10 p-2 rounded-lg"><AppIcons.Google className="h-6 w-6" /></div>,
        'Website': <div className="text-purple-500 bg-purple-500/10 p-2 rounded-lg"><AppIcons.Globe className="h-6 w-6" /></div>,
        'Cloud Telephony': <div className="text-cyan-500 bg-cyan-500/10 p-2 rounded-lg"><AppIcons.Call className="h-6 w-6" /></div>,
        'Email Marketing': <div className="text-red-500 bg-red-500/10 p-2 rounded-lg"><AppIcons.Email className="h-6 w-6" /></div>,
        'SMS Marketing': <div className="text-indigo-500 bg-indigo-500/10 p-2 rounded-lg"><AppIcons.SMS className="h-6 w-6" /></div>,
    };
    

    
    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Success/Error Notification */}
            {deleteResult.type && (
                <div className={`p-4 rounded-lg border ${
                    deleteResult.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                    <div className="flex items-center">
                        {deleteResult.type === 'success' ? (
                            <AppIcons.CheckCircle className="h-5 w-5 mr-2" />
                        ) : (
                            <AppIcons.XCircle className="h-5 w-5 mr-2" />
                        )}
                        <span className="font-medium">{deleteResult.message}</span>
                    </div>
                </div>
            )}


            <div>
                <h2 className="text-3xl font-bold text-on-surface">Integration Hub</h2>
                <p className="text-subtle mt-1">Connect your marketing channels and other tools to supercharge your CRM.</p>
            </div>

            <div className="flex-grow overflow-y-auto">
                <div className="bg-surface rounded-xl shadow-sm border border-muted p-4 flex flex-col min-h-full">
                    <div className="space-y-6 pb-6">
                        {Object.entries(integrationCategories).map(([category, sources]) => (
                            <div key={category}>
                                <h3 className="px-3 text-xs font-semibold text-subtle uppercase tracking-wider mb-2">{category}</h3>
                                <div className="space-y-1">
                                    {Array.isArray(sources) && sources.map(setting => (
                                        <button key={setting.source} onClick={() => {
                                            const routes: Record<IntegrationSource, string> = {
                                                'Facebook': '/settings/integrations/facebook',
                                                'Google Ads': '/settings/integrations/google-ads',
                                                'Website': '/settings/integrations/website',
                                                'Cloud Telephony': '/settings/integrations/cloud-telephony',
                                                'Email Marketing': '/settings/integrations/email-marketing',
                                                'SMS Marketing': '/settings/integrations/sms-marketing',
                                            };
                                            navigate(routes[setting.source]);
                                        }} className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors text-subtle hover:bg-muted hover:text-on-surface`}>
                                            {sourceIcons[setting.source]}
                                            <span className="font-semibold text-on-surface flex-grow">{setting.source}</span>
                                            <div className={`flex items-center gap-1.5 text-xs font-medium ${setting.isConnected ? 'text-green-500' : 'text-amber-500'}`}>
                                                <span className={`h-2 w-2 rounded-full ${setting.isConnected ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                                                {setting.isConnected ? 'Connected' : 'Action Needed'}
                                            </div>
                                            <AppIcons.ChevronRight className="h-4 w-4" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div>
                            <h3 className="px-3 text-xs font-semibold text-subtle uppercase tracking-wider mb-2">Developer</h3>
                            <div className="space-y-1">
                                <button onClick={() => navigate('/settings/integrations/api-webhooks')} className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors text-subtle hover:bg-muted hover:text-on-surface`}>
                                    <div className="text-gray-500 bg-gray-500/10 p-2 rounded-lg"><AppIcons.Code className="h-6 w-6" /></div>
                                    <span className="font-semibold text-on-surface flex-grow">API & Webhooks</span>
                                    <AppIcons.ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Webhook Logs Modal */}
            <WebhookLogsModal
                isOpen={logsModal.isOpen}
                onClose={() => setLogsModal({ isOpen: false, webhookId: '', webhookName: '' })}
                webhookId={logsModal.webhookId}
                webhookName={logsModal.webhookName}
            />

            {/* Create/Edit Mapping Modal */}
            <CreateMappingModal
                isOpen={isCreateMappingModalOpen}
                onClose={() => {
                    setIsCreateMappingModalOpen(false);
                    setEditingMapping(null);
                }}
                onSave={editingMapping ? handleUpdateMappingSave : handleCreateMappingSave}
                editingMapping={editingMapping}
            />
        </div>
    );
};

export default IntegrationsPage;


