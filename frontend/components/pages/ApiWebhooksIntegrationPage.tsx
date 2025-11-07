import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IntegrationSettings, WebhookConfig, OrganizationApiKeyData } from '../../types';

interface ApiWebhooksIntegrationPageProps {
    settings: IntegrationSettings[];
    setSettings: React.Dispatch<React.SetStateAction<IntegrationSettings[]>>;
    webhooks: WebhookConfig[];
    onAddWebhook: (webhookData: Partial<WebhookConfig>) => void;
    onDeleteWebhook: (id: string) => void;
    onUpdateWebhook: (webhook: WebhookConfig) => void;
    onTestWebhook: (id: string) => Promise<any>;
    currentOrganization: any;
}

export const ApiWebhooksIntegrationPage: React.FC<ApiWebhooksIntegrationPageProps> = ({
    settings,
    setSettings,
    webhooks,
    onAddWebhook,
    onDeleteWebhook,
    onUpdateWebhook,
    onTestWebhook,
    currentOrganization
}) => {
    const navigate = useNavigate();
    const [isGeneratingKey, setIsGeneratingKey] = useState(false);
    const [isRegeneratingKey, setIsRegeneratingKey] = useState(false);
    const [isRevokingKey, setIsRevokingKey] = useState(false);
    const [apiKeyData, setApiKeyData] = useState<OrganizationApiKeyData | null>(null);
    const [showFullApiKey, setShowFullApiKey] = useState(false);
    const [isLoadingApiKey, setIsLoadingApiKey] = useState(false);
    const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);
    const [newWebhook, setNewWebhook] = useState<{
        name: string;
        url: string;
        events: string[];
        isEnabled: boolean;
    }>({
        name: '',
        url: '',
        events: ['lead.created', 'lead.updated'],
        isEnabled: true
    });

    // Load API key data on component mount
    useEffect(() => {
        fetchApiKeyData();
    }, []);

    const fetchApiKeyData = async (unmasked = false) => {
        try {
            setIsLoadingApiKey(true);
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');

            if (!token) {
                console.error('No token found in localStorage');
                return;
            }

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
                if (unmasked && data.data.fullApiKey) {
                    setShowFullApiKey(true);
                    setTimeout(() => setShowFullApiKey(false), 5000);
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

    const handleGenerateApiKey = async () => {
        try {
            setIsGeneratingKey(true);
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');

            if (!token) {
                console.error('No authentication token found');
                alert('Authentication token not found. Please log in again.');
                return;
            }

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
                alert('API key generated successfully!');
            } else {
                alert(`Failed to generate API key: ${data.message}`);
            }
        } catch (error) {
            console.error('Error generating API key:', error);
            alert('Error generating API key. Please try again.');
        } finally {
            setIsGeneratingKey(false);
        }
    };

    const handleRegenerateApiKey = async () => {
        if (!window.confirm('Are you sure you want to regenerate the API key? The old key will be invalidated immediately.')) {
            return;
        }

        try {
            setIsRegeneratingKey(true);
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');

            if (!token) {
                console.error('No authentication token found');
                alert('Authentication token not found. Please log in again.');
                return;
            }

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
                alert('API key regenerated successfully!');
            } else {
                alert(`Failed to regenerate API key: ${data.message}`);
            }
        } catch (error) {
            console.error('Error regenerating API key:', error);
            alert('Error regenerating API key. Please try again.');
        } finally {
            setIsRegeneratingKey(false);
        }
    };

    const handleRevokeApiKey = async () => {
        if (!window.confirm('Are you sure you want to revoke the API key? This will disable API access immediately.')) {
            return;
        }

        try {
            setIsRevokingKey(true);
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');

            if (!token) {
                console.error('No authentication token found');
                alert('Authentication token not found. Please log in again.');
                return;
            }

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
                alert('API key revoked successfully!');
            } else {
                alert(`Failed to revoke API key: ${data.message}`);
            }
        } catch (error) {
            console.error('Error revoking API key:', error);
            alert('Error revoking API key. Please try again.');
        } finally {
            setIsRevokingKey(false);
        }
    };

    const handleCopyApiKey = () => {
        if (apiKeyData?.apiKey) {
            navigator.clipboard.writeText(showFullApiKey ? apiKeyData.apiKey : (apiKeyData.apiKey.substring(0, 8) + '...' + apiKeyData.apiKey.substring(apiKeyData.apiKey.length - 4)));
            alert('API key copied to clipboard!');
        }
    };

    const handleShowFullApiKey = () => {
        fetchApiKeyData(true);
    };

    const handleCreateWebhook = () => {
        if (newWebhook.name.trim() && newWebhook.url.trim()) {
            onAddWebhook(newWebhook);
            setNewWebhook({
                name: '',
                url: '',
                events: ['lead.created', 'lead.updated'],
                isEnabled: true
            });
            setIsCreatingWebhook(false);
        }
    };

    const handleTestWebhook = async (webhookId: string) => {
        try {
            const result = await onTestWebhook(webhookId);
            console.log('Webhook test result:', result);
            // You could show a success/error message here
        } catch (error) {
            console.error('Webhook test failed:', error);
        }
    };

    const availableEvents = [
        { value: 'lead.created', label: 'Lead Created' },
        { value: 'lead.updated', label: 'Lead Updated' },
        { value: 'lead.deleted', label: 'Lead Deleted' },
        { value: 'lead.stage_changed', label: 'Stage Changed' },
        { value: 'lead.assigned', label: 'Lead Assigned' }
    ];

    return (
        <div className="space-y-6 h-full flex flex-col min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/settings/integrations')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">API & Webhooks</h1>
                        <p className="text-slate-600 mt-1">Manage your API keys and webhook configurations</p>
                    </div>
                </div>
                <button
                    onClick={() => window.open('/api-docs', '_blank')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    View API Documentation
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* API Key Management */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">API Key Management</h3>
                            <p className="text-slate-600 text-sm">Generate and manage your organization API keys</p>
                        </div>
                        <button
                            onClick={handleGenerateApiKey}
                            disabled={isGeneratingKey}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2"
                        >
                            {isGeneratingKey ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                    Generate Key
                                </>
                            )}
                        </button>
                    </div>

                    {apiKeyData && (
                        <div className="space-y-3">
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-700">Your API Key</span>
                                    <div className="flex gap-2">
                                        {!showFullApiKey && (
                                            <button
                                                onClick={handleShowFullApiKey}
                                                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                                            >
                                                Show Full Key
                                            </button>
                                        )}
                                        <button
                                            onClick={handleCopyApiKey}
                                            className="text-xs bg-slate-600 hover:bg-slate-700 text-white font-bold py-1 px-2 rounded"
                                        >
                                            Copy Key
                                        </button>
                                    </div>
                                </div>
                                <code className="text-xs text-slate-600 break-all">
                                    {showFullApiKey ? apiKeyData.apiKey : (apiKeyData.apiKey.substring(0, 8) + '...' + apiKeyData.apiKey.substring(apiKeyData.apiKey.length - 4))}
                                </code>
                                {showFullApiKey && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ Full key visible for 5 seconds</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleRegenerateApiKey}
                                    disabled={isRegeneratingKey}
                                    className="text-xs bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed text-white font-bold py-1 px-3 rounded flex items-center gap-1"
                                >
                                    {isRegeneratingKey ? (
                                        <>
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                            Regenerating...
                                        </>
                                    ) : (
                                        'Regenerate Key'
                                    )}
                                </button>
                                <button
                                    onClick={handleRevokeApiKey}
                                    disabled={isRevokingKey}
                                    className="text-xs bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-bold py-1 px-3 rounded flex items-center gap-1"
                                >
                                    {isRevokingKey ? (
                                        <>
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                            Revoking...
                                        </>
                                    ) : (
                                        'Revoke Key'
                                    )}
                                </button>
                            </div>
                            <div className="text-xs text-slate-600">
                                <p>• Keep this key secure and don't share it publicly</p>
                                <p>• Use this key to authenticate API requests</p>
                                <p>• Regenerate to invalidate the old key</p>
                                <p>• Revoke to disable API access completely</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Create Webhook */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Webhook Management</h3>
                            <p className="text-slate-600 text-sm">Create and manage webhooks for real-time notifications</p>
                        </div>
                        <button
                            onClick={() => setIsCreatingWebhook(true)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
                        >
                            Create Webhook
                        </button>
                    </div>

                    {isCreatingWebhook && (
                        <div className="space-y-4 p-4 border border-slate-200 rounded-lg">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Webhook Name</label>
                                <input
                                    type="text"
                                    value={newWebhook.name}
                                    onChange={e => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., Zapier Integration"
                                    className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Webhook URL</label>
                                <input
                                    type="url"
                                    value={newWebhook.url}
                                    onChange={e => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                                    placeholder="https://your-app.com/webhook"
                                    className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Events</label>
                                <div className="space-y-2">
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
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCreateWebhook}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm"
                                >
                                    Create
                                </button>
                                <button
                                    onClick={() => setIsCreatingWebhook(false)}
                                    className="bg-slate-300 hover:bg-slate-400 text-slate-700 font-bold py-2 px-3 rounded text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Existing Webhooks */}
                    <div className="space-y-3 mt-4">
                        {webhooks.slice(0, 2).map(webhook => (
                            <div key={webhook.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                                <div className="flex-1">
                                    <h4 className="font-medium text-slate-800 text-sm">{webhook.name}</h4>
                                    <p className="text-xs text-slate-600 truncate">{webhook.url}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleTestWebhook(webhook.id)}
                                        className="text-xs bg-green-100 hover:bg-green-200 text-green-700 font-bold py-1 px-2 rounded"
                                    >
                                        Test
                                    </button>
                                    <button
                                        onClick={() => onDeleteWebhook(webhook.id)}
                                        className="text-xs bg-red-100 hover:bg-red-200 text-red-700 font-bold py-1 px-2 rounded"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => window.open('/api-docs', '_blank')}
                        className="p-4 bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-lg hover:from-primary-100 hover:to-primary-200 hover:border-primary-300 transition-all duration-200 text-left group shadow-sm hover:shadow-md"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-200 rounded-lg group-hover:bg-primary-300 transition-colors">
                                <svg className="h-6 w-6 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-800 group-hover:text-primary-800 transition-colors">API Documentation</h4>
                                <p className="text-sm text-slate-600 group-hover:text-primary-700 transition-colors">Complete API reference and guides</p>
                            </div>
                        </div>
                    </button>
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-200 rounded-lg">
                                <svg className="h-6 w-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-800">Webhook Testing</h4>
                                <p className="text-sm text-slate-600">Test your webhook endpoints</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiWebhooksIntegrationPage;


