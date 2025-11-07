import React, { useState } from 'react';
import { IntegrationSettings } from '../../types';
import Modal from '../ui/Modal';
import { apiService } from '../../src/services/api';

interface TelephonyIntegrationSettings extends IntegrationSettings {
    id?: string;
    provider?: string;
    apiKey?: string;
    apiSecret?: string;
    accountSid?: string;
    authToken?: string;
    baseUrl?: string;
    applicationId?: string;
    senderId?: string;
    region?: string;
    connectionType?: string;
    webhookUrl?: string;
    callbackUrl?: string;
}

interface TelephonyConnectModalProps {
    setting: TelephonyIntegrationSettings;
    onClose: () => void;
    onSave: (details: Partial<TelephonyIntegrationSettings>) => void;
    onDisconnect: () => void;
    currentOrganization?: any;
}

const TelephonyConnectModal: React.FC<TelephonyConnectModalProps> = ({
    setting,
    onClose,
    onSave,
    onDisconnect,
    currentOrganization
}) => {
    const [formData, setFormData] = useState({
        // Real-world telephony provider fields
        apiKey: setting.apiKey || '',
        apiSecret: setting.apiSecret || '',
        accountSid: setting.accountSid || '',
        authToken: setting.authToken || '',
        baseUrl: setting.baseUrl || '',
        applicationId: setting.applicationId || '',
        senderId: setting.senderId || '',
        region: setting.region || 'us-east-1',
        connectionType: setting.connectionType || 'api_key', // api_key, oauth, jwt, basic_auth
        webhookUrl: setting.webhookUrl || '',
        callbackUrl: setting.callbackUrl || ''
    });
    const [isConnecting, setIsConnecting] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const validateForm = () => {
        // Basic validation - require at least one form of authentication
        const hasApiKey = formData.apiKey.trim() || formData.apiSecret.trim();
        const hasAccountAuth = formData.accountSid.trim() || formData.authToken.trim();
        const hasAppAuth = formData.applicationId.trim();

        if (!hasApiKey && !hasAccountAuth && !hasAppAuth) {
            setError('Please provide at least one form of authentication (API Key/Secret, Account SID/Token, or Application ID)');
            return false;
        }

        if (formData.baseUrl && !formData.baseUrl.startsWith('http')) {
            setError('Base URL must start with http:// or https://');
            return false;
        }

        return true;
    };

    const handleTestConnection = async () => {
        if (!validateForm()) return;

        setIsTesting(true);
        setError('');

        try {
            // Create or update integration for testing
            const integrationData = {
                organizationId: currentOrganization?.id,
                provider: 'custom', // Generic provider since user can connect to any provider
                apiKey: formData.apiKey,
                apiSecret: formData.apiSecret,
                accountSid: formData.accountSid,
                authToken: formData.authToken,
                baseUrl: formData.baseUrl,
                applicationId: formData.applicationId,
                senderId: formData.senderId,
                region: formData.region,
                connectionType: formData.connectionType,
                webhookUrl: formData.webhookUrl,
                callbackUrl: formData.callbackUrl
            };

            let integration;
            if (setting.id) {
                // Update existing integration
                integration = await apiService.updateCloudTelephonyIntegration(setting.id, integrationData);
            } else {
                // Create new integration
                integration = await apiService.createCloudTelephonyIntegration(integrationData);
            }

            // Test the connection
            const testResult = await apiService.testCloudTelephonyIntegration(integration.id);

            if (testResult.success) {
                alert('Connection test successful! Your telephony integration is working properly.');
            } else {
                setError(testResult.message || 'Connection test failed');
            }
        } catch (error: any) {
            setError(error.message || 'Failed to test connection');
        } finally {
            setIsTesting(false);
        }
    };

    const handleConnect = async () => {
        if (!validateForm()) return;

        setIsConnecting(true);
        setError('');

        try {
            const integrationData = {
                organizationId: currentOrganization?.id,
                provider: 'custom', // Generic provider since user can connect to any provider
                apiKey: formData.apiKey,
                apiSecret: formData.apiSecret,
                accountSid: formData.accountSid,
                authToken: formData.authToken,
                baseUrl: formData.baseUrl,
                applicationId: formData.applicationId,
                senderId: formData.senderId,
                region: formData.region,
                connectionType: formData.connectionType,
                webhookUrl: formData.webhookUrl,
                callbackUrl: formData.callbackUrl,
                status: 'active'
            };

            let integration;
            if (setting.id) {
                // Update existing integration
                integration = await apiService.updateCloudTelephonyIntegration(setting.id, integrationData);
            } else {
                // Create new integration
                integration = await apiService.createCloudTelephonyIntegration(integrationData);
            }

            // Activate the integration
            await apiService.activateCloudTelephonyIntegration(integration.id);

            // Update the settings
            onSave({
                id: integration.id,
                isConnected: true,
                provider: 'custom',
                apiKey: formData.apiKey,
                apiSecret: formData.apiSecret,
                accountSid: formData.accountSid,
                authToken: formData.authToken,
                baseUrl: formData.baseUrl,
                applicationId: formData.applicationId,
                senderId: formData.senderId,
                region: formData.region,
                connectionType: formData.connectionType,
                webhookUrl: formData.webhookUrl,
                callbackUrl: formData.callbackUrl
            });

            onClose();
        } catch (error: any) {
            setError(error.message || 'Failed to connect telephony service');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!setting.id) {
            onDisconnect();
            onClose();
            return;
        }

        try {
            await apiService.deactivateCloudTelephonyIntegration(setting.id);
            onDisconnect();
            onClose();
        } catch (error: any) {
            setError(error.message || 'Failed to disconnect telephony service');
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Connect to Cloud Telephony">
            <div className="space-y-4">
                <p className="text-subtle text-sm">
                    Integrate with your cloud telephony provider to enable click-to-call, call logging, and more.
                </p>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                <div className="p-4 bg-surface rounded-lg border border-muted space-y-4">
                    {/* Connection Type */}
                    <div>
                        <label className="block text-sm font-medium text-subtle mb-2">Connection Type</label>
                        <select
                            value={formData.connectionType}
                            onChange={(e) => handleInputChange('connectionType', e.target.value)}
                            className="block w-full bg-surface border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="api_key">API Key & Secret</option>
                            <option value="account_auth">Account SID & Auth Token</option>
                            <option value="application">Application ID</option>
                            <option value="oauth">OAuth 2.0</option>
                        </select>
                    </div>

                    {/* API Key & Secret (for API Key connection type) */}
                    {formData.connectionType === 'api_key' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-subtle mb-2">API Key</label>
                                <input
                                    type="text"
                                    value={formData.apiKey}
                                    onChange={(e) => handleInputChange('apiKey', e.target.value)}
                                    placeholder="Enter your API Key"
                                    className="block w-full bg-surface border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-subtle mb-2">API Secret</label>
                                <input
                                    type="password"
                                    value={formData.apiSecret}
                                    onChange={(e) => handleInputChange('apiSecret', e.target.value)}
                                    placeholder="Enter your API Secret"
                                    className="block w-full bg-surface border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </>
                    )}

                    {/* Account SID & Auth Token (for Account Auth connection type) */}
                    {formData.connectionType === 'account_auth' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-subtle mb-2">Account SID</label>
                                <input
                                    type="text"
                                    value={formData.accountSid}
                                    onChange={(e) => handleInputChange('accountSid', e.target.value)}
                                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                    className="block w-full bg-surface border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-subtle mb-2">Auth Token</label>
                                <input
                                    type="password"
                                    value={formData.authToken}
                                    onChange={(e) => handleInputChange('authToken', e.target.value)}
                                    placeholder="Enter your Auth Token"
                                    className="block w-full bg-surface border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </>
                    )}

                    {/* Application ID (for Application connection type) */}
                    {formData.connectionType === 'application' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-subtle mb-2">Application ID</label>
                                <input
                                    type="text"
                                    value={formData.applicationId}
                                    onChange={(e) => handleInputChange('applicationId', e.target.value)}
                                    placeholder="Enter your Application ID"
                                    className="block w-full bg-surface border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-subtle mb-2">Sender ID (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.senderId}
                                    onChange={(e) => handleInputChange('senderId', e.target.value)}
                                    placeholder="YOUR_SENDER_ID"
                                    className="block w-full bg-surface border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </>
                    )}

                    {/* Base URL */}
                    <div>
                        <label className="block text-sm font-medium text-subtle mb-2">Base URL</label>
                        <input
                            type="url"
                            value={formData.baseUrl}
                            onChange={(e) => handleInputChange('baseUrl', e.target.value)}
                            placeholder="https://api.your-provider.com"
                            className="block w-full bg-surface border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                        <p className="text-xs text-subtle mt-1">Leave empty for default provider URL</p>
                    </div>

                    {/* Region */}
                    <div>
                        <label className="block text-sm font-medium text-subtle mb-2">Region</label>
                        <select
                            value={formData.region}
                            onChange={(e) => handleInputChange('region', e.target.value)}
                            className="block w-full bg-surface border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="us-east-1">US East (N. Virginia)</option>
                            <option value="us-west-2">US West (Oregon)</option>
                            <option value="eu-west-1">EU West (Ireland)</option>
                            <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                            <option value="ap-south-1">Asia Pacific (Mumbai)</option>
                        </select>
                    </div>

                    {/* Webhook Configuration */}
                    <div className="border-t border-muted pt-4">
                        <h4 className="text-sm font-medium text-subtle mb-3">Webhook Configuration</h4>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-subtle mb-2">Webhook URL</label>
                                <input
                                    type="url"
                                    value={formData.webhookUrl}
                                    onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                                    placeholder="https://your-crm.com/webhooks/telephony"
                                    className="block w-full bg-surface border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                />
                                <p className="text-xs text-subtle mt-1">URL to receive call and SMS events</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-subtle mb-2">Callback URL (Optional)</label>
                                <input
                                    type="url"
                                    value={formData.callbackUrl}
                                    onChange={(e) => handleInputChange('callbackUrl', e.target.value)}
                                    placeholder="https://your-crm.com/callback"
                                    className="block w-full bg-surface border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                />
                                <p className="text-xs text-subtle mt-1">For delivery confirmations and status updates</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Test Connection Button */}
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={isTesting || isConnecting}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2"
                    >
                        {isTesting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Testing...
                            </>
                        ) : (
                            <>
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Test Connection
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-muted">
                {setting.isConnected ? (
                    <button
                        type="button"
                        onClick={handleDisconnect}
                        disabled={isConnecting}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg text-sm"
                    >
                        Disconnect
                    </button>
                ) : <div />}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConnect}
                        disabled={isConnecting || isTesting}
                        className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
                    >
                        {isConnecting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Connecting...
                            </>
                        ) : (
                            <>
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {setting.isConnected ? 'Save Changes' : 'Connect'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default TelephonyConnectModal;


