import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IntegrationSettings, IntegrationSource } from '../../types';
import { apiService } from '../../src/services/api';

interface GoogleAdsConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

// Account Management Modal Component
const AccountManagementModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    accounts: any[];
    onConnectAccount: () => void;
    onDisconnectAccount: (accountId: string) => void;
    onToggleAccount: (accountId: string) => void;
}> = ({ isOpen, onClose, accounts, onConnectAccount, onDisconnectAccount, onToggleAccount }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Google Ads Accounts</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Add New Account Button */}
                    <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div>
                            <h4 className="font-medium text-blue-800">Connect New Account</h4>
                            <p className="text-sm text-blue-600">Add another Google Ads account to your integration</p>
                        </div>
                        <button
                            onClick={onConnectAccount}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm flex items-center gap-2"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Connect Account
                        </button>
                    </div>

                    {/* Connected Accounts */}
                    <div className="space-y-3">
                        <h4 className="font-medium text-slate-800">Connected Accounts ({accounts.length})</h4>
                        {accounts.length > 0 ? (
                            accounts.map(account => (
                                <div key={account.id} className="border border-slate-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={account.isActive !== false}
                                                onChange={() => onToggleAccount(account.id)}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <div>
                                                <h5 className="font-medium text-slate-800">{account.name || `Account ${account.id}`}</h5>
                                                <p className="text-sm text-slate-600">ID: {account.id}</p>
                                                {account.managerName && (
                                                    <p className="text-xs text-slate-500">Manager: {account.managerName}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                account.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {account.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                            <button
                                                onClick={() => onDisconnectAccount(account.id)}
                                                className="text-red-600 hover:text-red-800 p-1"
                                                title="Disconnect Account"
                                            >
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <svg className="h-12 w-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <p>No Google Ads accounts connected yet</p>
                                <p className="text-sm">Click "Connect Account" to get started</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// Google Ads Setup Modal Component
const GoogleAdsSetupModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (config: GoogleAdsConfig) => void;
    onConnectAccount: (config: GoogleAdsConfig) => void;
    initialConfig?: GoogleAdsConfig;
}> = ({ isOpen, onClose, onSave, onConnectAccount, initialConfig }) => {
    const [config, setConfig] = useState<GoogleAdsConfig>({
        clientId: '',
        clientSecret: '',
        redirectUri: `${window.location.origin}/api/oauth/google-ads/callback`,
        ...initialConfig
    });
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
    const [activeTab, setActiveTab] = useState<'setup' | 'connect'>('setup');

    const handleSave = () => {
        onSave(config);
        setActiveTab('connect');
    };

    const handleConnectWithConfig = () => {
        onConnectAccount(config);
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        setTestResult(null);

        try {
            // Test the configuration using the real backend API
            const testData = {
                name: 'Google Ads Integration',
                clientId: config.clientId,
                clientSecret: config.clientSecret,
                redirectUri: config.redirectUri
            };

            // Create a test integration to validate the configuration
            const testIntegration = await apiService.createGoogleAdsIntegration(testData);

            if (testIntegration && testIntegration._id) {
                setTestResult({success: true, message: 'Configuration is valid! Integration created successfully.'});
            } else {
                setTestResult({success: false, message: 'Configuration test failed - invalid response from server'});
            }
        } catch (error) {
            console.error('Configuration test error:', error);
            setTestResult({
                success: false,
                message: error.message || 'Failed to test configuration. Please check your credentials.'
            });
        } finally {
            setIsTesting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-800">Google Ads Integration Setup</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex mb-6 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('setup')}
                        className={`pb-2 px-4 font-medium text-sm border-b-2 ${
                            activeTab === 'setup'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        1. API Setup
                    </button>
                    <button
                        onClick={() => setActiveTab('connect')}
                        disabled={!config.clientId || !config.clientSecret}
                        className={`pb-2 px-4 font-medium text-sm border-b-2 ${
                            activeTab === 'connect'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        } ${(!config.clientId || !config.clientSecret) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        2. Connect Account
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'setup' && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-800 mb-2">Setup Instructions</h4>
                            <div className="text-sm text-blue-700 space-y-1">
                                <p>1. Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></p>
                                <p>2. Create a new project or select existing one</p>
                                <p>3. Enable Google Ads API</p>
                                <p>4. Create OAuth 2.0 credentials</p>
                                <p>5. Add your domain to authorized origins</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Client ID *
                            </label>
                            <input
                                type="text"
                                value={config.clientId}
                                onChange={(e) => setConfig({...config, clientId: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter your Google Ads Client ID"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Client Secret *
                            </label>
                            <input
                                type="password"
                                value={config.clientSecret}
                                onChange={(e) => setConfig({...config, clientSecret: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter your Google Ads Client Secret"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Redirect URI
                            </label>
                            <input
                                type="text"
                                value={config.redirectUri}
                                onChange={(e) => setConfig({...config, redirectUri: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                                readOnly
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                This is automatically set to your current domain + /auth/google/callback
                            </p>
                        </div>

                        {testResult && (
                            <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                                    {testResult.message}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'connect' && (
                    <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-medium text-green-800 mb-2">Ready to Connect!</h4>
                            <p className="text-sm text-green-700">
                                Your API configuration is saved. Now you can connect your Google Ads accounts.
                            </p>
                        </div>

                        <div className="text-center py-4">
                            <button
                                onClick={handleConnectWithConfig}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-sm flex items-center gap-2 mx-auto"
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                                Connect Google Ads Account
                            </button>
                            <p className="text-xs text-slate-500 mt-2">
                                This will redirect you to Google OAuth to authorize access
                            </p>
                        </div>
                    </div>
                )}

                {/* Tab Navigation Buttons */}
                <div className="flex gap-3 mt-6">
                    {activeTab === 'setup' && (
                        <>
                            <button
                                onClick={handleTestConnection}
                                disabled={isTesting || !config.clientId || !config.clientSecret}
                                className="flex-1 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg text-sm"
                            >
                                {isTesting ? 'Testing...' : 'Test Configuration'}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!config.clientId || !config.clientSecret}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg text-sm"
                            >
                                Save & Continue
                            </button>
                        </>
                    )}
                    {activeTab === 'connect' && (
                        <button
                            onClick={() => setActiveTab('setup')}
                            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg text-sm"
                        >
                            Back to Setup
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

interface GoogleAdsIntegrationPageProps {
    settings: IntegrationSettings[];
    setSettings: React.Dispatch<React.SetStateAction<IntegrationSettings[]>>;
    customFieldDefs: any[];
    currentOrganization: any;
    onSendTestLead: (source: IntegrationSource, formName: string) => void;
}

export const GoogleAdsIntegrationPage: React.FC<GoogleAdsIntegrationPageProps> = ({
    settings,
    setSettings,
    customFieldDefs,
    currentOrganization,
    onSendTestLead
}) => {
    const navigate = useNavigate();
    const [isConnecting, setIsConnecting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
    const [integration, setIntegration] = useState<any>(null);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [conversionData, setConversionData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [googleAdsConfig, setGoogleAdsConfig] = useState<GoogleAdsConfig>(() => {
        // Load saved configuration from localStorage or use environment variables
        const savedConfig = localStorage.getItem('googleAdsConfig');
        if (savedConfig) {
            try {
                return JSON.parse(savedConfig);
            } catch (error) {
                console.error('Failed to parse saved Google Ads config:', error);
            }
        }
        return {
            clientId: import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID || '',
            clientSecret: import.meta.env.VITE_GOOGLE_ADS_CLIENT_SECRET || '',
            redirectUri: import.meta.env.VITE_GOOGLE_ADS_REDIRECT_URI || `${window.location.origin}/api/oauth/google-ads/callback`
        };
    });
    const [accountCampaigns, setAccountCampaigns] = useState<{[accountId: string]: any[]}>({});
    const [accountConversions, setAccountConversions] = useState<{[accountId: string]: any}>({});

    const currentSetting = settings.find(s => s.source === 'Google Ads');

    // Load Google Ads data when component mounts or integration changes
    useEffect(() => {
        if (currentSetting?.isConnected) {
            loadGoogleAdsData();
        }
    }, [currentSetting]);

    const loadGoogleAdsData = async () => {
        if (!currentSetting) return;

        setIsLoading(true);
        setError(null);
        try {
            // Get integration details from real backend API
            const integrations = await apiService.getGoogleAdsIntegrations();
            const googleAdsIntegration = integrations.find((i: any) => i.source === 'Google Ads');

            if (googleAdsIntegration) {
                setIntegration(googleAdsIntegration);

                // Load accounts and campaigns if connected
                if (googleAdsIntegration.isConnected && googleAdsIntegration.connectedAccounts.length > 0) {
                    const connectedAccounts = googleAdsIntegration.connectedAccounts;
                    setAccounts(connectedAccounts);

                    // Load campaigns and conversion data for all active accounts
                    const allCampaigns: any[] = [];
                    const allConversions: any = {
                        totalConversions: 0,
                        conversionRate: 0,
                        costPerConversion: 0,
                        totalCost: 0
                    };

                    for (const account of connectedAccounts) {
                        if (account.isActive !== false) {
                            try {
                                // Load campaigns for this account
                                const campaignsData = await apiService.getGoogleAdsCampaigns(googleAdsIntegration._id, account.id);
                                if (campaignsData) {
                                    // Add account ID to each campaign for tracking
                                    const campaignsWithAccount = campaignsData.map((campaign: any) => ({
                                        ...campaign,
                                        accountId: account.id,
                                        accountName: account.name || `Account ${account.id}`
                                    }));
                                    allCampaigns.push(...campaignsWithAccount);
                                }

                                // Load conversion data for this account
                                const conversions = await apiService.getGoogleAdsConversionData(googleAdsIntegration._id, account.id);
                                if (conversions) {
                                    allConversions.totalConversions += conversions.totalConversions || 0;
                                    allConversions.totalCost += conversions.totalCost || 0;
                                }
                            } catch (accountError) {
                                console.warn(`Failed to load data for account ${account.id}:`, accountError);
                            }
                        }
                    }

                    setCampaigns(allCampaigns);

                    // Calculate aggregated conversion metrics
                    if (allConversions.totalConversions > 0 && allConversions.totalCost > 0) {
                        allConversions.conversionRate = (allConversions.totalConversions / allCampaigns.length) * 100;
                        allConversions.costPerConversion = allConversions.totalCost / allConversions.totalConversions;
                    }

                    setConversionData(allConversions);
                }
            }
        } catch (error) {
            console.error('Failed to load Google Ads data:', error);
            setError(error.message || 'Failed to load Google Ads data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const showSuccess = (message: string) => {
        setSuccess(message);
        setTimeout(() => setSuccess(null), 5000);
    };

    const showError = (message: string) => {
        setError(message);
        setTimeout(() => setError(null), 5000);
    };

    const handleOpenSetupModal = () => {
        setShowSetupModal(true);
    };

    const handleCloseSetupModal = () => {
        setShowSetupModal(false);
    };

    const handleOpenAccountModal = () => {
        setShowAccountModal(true);
    };

    const handleCloseAccountModal = () => {
        setShowAccountModal(false);
    };

    const handleConnectNewAccount = async () => {
        // Close the account modal and open the setup modal for new account
        setShowAccountModal(false);
        setShowSetupModal(true);
    };

    const handleDisconnectAccount = async (accountId: string) => {
        if (window.confirm('Are you sure you want to disconnect this Google Ads account?')) {
            try {
                // API call to disconnect the account - using generic update method
                await apiService.updateGoogleAdsIntegration(integration._id, {
                    disconnectAccountId: accountId
                });

                // Update local state
                setAccounts(prev => prev.filter(acc => acc.id !== accountId));

                // Refresh data
                await loadGoogleAdsData();
                showSuccess('Account disconnected successfully!');
            } catch (error) {
                console.error('Failed to disconnect account:', error);
                showError(error.message || 'Failed to disconnect account. Please try again.');
            }
        }
    };

    const handleToggleAccount = async (accountId: string) => {
        try {
            const account = accounts.find(acc => acc.id === accountId);
            const newStatus = !account.isActive;

            // API call to toggle account status - using generic update method
            await apiService.updateGoogleAdsIntegration(integration._id, {
                toggleAccountId: accountId,
                isActive: newStatus
            });

            // Update local state
            setAccounts(prev => prev.map(acc =>
                acc.id === accountId ? {...acc, isActive: newStatus} : acc
            ));

            showSuccess(`Account ${newStatus ? 'activated' : 'deactivated'} successfully!`);
        } catch (error) {
            console.error('Failed to toggle account:', error);
            showError(error.message || 'Failed to update account status. Please try again.');
        }
    };

    const handleSaveConfiguration = async (config: GoogleAdsConfig) => {
        setGoogleAdsConfig(config);
        // Save to localStorage for persistence
        localStorage.setItem('googleAdsConfig', JSON.stringify(config));
        showSuccess('Google Ads configuration saved successfully!');
    };

    const handleConnectWithSetup = async (config: GoogleAdsConfig) => {
        if (!config.clientId || !config.clientSecret) {
            showError('Please configure your Google Ads API credentials first');
            return;
        }

        setIsConnecting(true);
        try {
            // Check if Google Ads integration already exists
            const integrations = await apiService.getGoogleAdsIntegrations();
            let googleAdsIntegration = integrations.find((i: any) => i.source === 'Google Ads');

            if (googleAdsIntegration) {
                // Use existing integration
                showSuccess('Google Ads integration already exists. Redirecting to OAuth...');
            } else {
                // Create new Google Ads integration with user-provided config
                const integrationData = {
                    name: 'Google Ads Integration',
                    clientId: config.clientId,
                    clientSecret: config.clientSecret,
                    redirectUri: config.redirectUri
                };

                googleAdsIntegration = await apiService.createGoogleAdsIntegration(integrationData);
            }

            // Use the backend to generate the OAuth URL for security
            try {
                const oauthResponse = await apiService.requestWithRetry<any>(`/oauth/google-ads/${googleAdsIntegration._id}/initiate`);
                if (oauthResponse.success && oauthResponse.authUrl) {
                    window.location.href = oauthResponse.authUrl;
                } else {
                    throw new Error('Failed to generate OAuth URL');
                }
            } catch (oauthError) {
                console.error('OAuth initiation failed:', oauthError);
                // Fallback to direct OAuth URL generation if backend fails
                const fallbackAuthUrl = `https://accounts.google.com/oauth/authorize?` +
                    `client_id=${config.clientId}&` +
                    `redirect_uri=${encodeURIComponent(`${window.location.origin}/api/oauth/google-ads/callback`)}&` +
                    `scope=https://www.googleapis.com/auth/adwords&` +
                    `response_type=code&` +
                    `access_type=offline&` +
                    `prompt=consent&` +
                    `state=${googleAdsIntegration._id}`;

                window.location.href = fallbackAuthUrl;
            }
        } catch (error) {
            console.error('Failed to connect Google Ads:', error);
            if (error.message?.includes('already exists')) {
                showError('Google Ads integration already exists for this organization. Please disconnect first if you want to reconnect.');
            } else {
                showError(error.message || 'Failed to connect Google Ads. Please try again.');
            }
        } finally {
            setIsConnecting(false);
        }
    };

    const handleSetupModalConnect = async () => {
        if (!googleAdsConfig.clientId || !googleAdsConfig.clientSecret) {
            showError('Please configure your Google Ads API credentials first');
            return;
        }

        setIsConnecting(true);
        try {
            // Check if Google Ads integration already exists
            const integrations = await apiService.getGoogleAdsIntegrations();
            let googleAdsIntegration = integrations.find((i: any) => i.source === 'Google Ads');

            if (googleAdsIntegration) {
                // Use existing integration
                showSuccess('Google Ads integration already exists. Redirecting to OAuth...');
            } else {
                // Create new Google Ads integration with user-provided config
                const integrationData = {
                    name: 'Google Ads Integration',
                    clientId: googleAdsConfig.clientId,
                    clientSecret: googleAdsConfig.clientSecret,
                    redirectUri: googleAdsConfig.redirectUri
                };

                googleAdsIntegration = await apiService.createGoogleAdsIntegration(integrationData);
            }

            // Use the backend to generate the OAuth URL for security
            try {
                const oauthResponse = await apiService.requestWithRetry<any>(`/oauth/google-ads/${googleAdsIntegration._id}/initiate`);
                if (oauthResponse.success && oauthResponse.authUrl) {
                    window.location.href = oauthResponse.authUrl;
                } else {
                    throw new Error('Failed to generate OAuth URL');
                }
            } catch (oauthError) {
                console.error('OAuth initiation failed:', oauthError);
                // Fallback to direct OAuth URL generation if backend fails
                const fallbackAuthUrl = `https://accounts.google.com/oauth/authorize?` +
                    `client_id=${googleAdsConfig.clientId}&` +
                    `redirect_uri=${encodeURIComponent(`${window.location.origin}/api/oauth/google-ads/callback`)}&` +
                    `scope=https://www.googleapis.com/auth/adwords&` +
                    `response_type=code&` +
                    `access_type=offline&` +
                    `prompt=consent&` +
                    `state=${googleAdsIntegration._id}`;

                window.location.href = fallbackAuthUrl;
            }
        } catch (error) {
            console.error('Failed to connect Google Ads:', error);
            if (error.message?.includes('already exists')) {
                showError('Google Ads integration already exists for this organization. Please disconnect first if you want to reconnect.');
            } else {
                showError(error.message || 'Failed to connect Google Ads. Please try again.');
            }
        } finally {
            setIsConnecting(false);
        }
    };

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            // Check if Google Ads integration already exists
            const integrations = await apiService.getGoogleAdsIntegrations();
            let googleAdsIntegration = integrations.find((i: any) => i.source === 'Google Ads');

            if (googleAdsIntegration) {
                // Use existing integration
                showSuccess('Google Ads integration already exists. Redirecting to OAuth...');
            } else {
                // Create new Google Ads integration
                const integrationData = {
                    name: 'Google Ads Integration',
                    clientId: import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID || 'your-client-id',
                    clientSecret: import.meta.env.VITE_GOOGLE_ADS_CLIENT_SECRET || 'your-client-secret',
                    redirectUri: import.meta.env.VITE_GOOGLE_ADS_REDIRECT_URI || `${window.location.origin}/auth/google/callback`
                };

                googleAdsIntegration = await apiService.createGoogleAdsIntegration(integrationData);
            }

            // Use the backend to generate the OAuth URL for security
            try {
                const oauthResponse = await apiService.requestWithRetry<any>(`/oauth/google-ads/${googleAdsIntegration._id}/initiate`);
                if (oauthResponse.success && oauthResponse.authUrl) {
                    window.location.href = oauthResponse.authUrl;
                } else {
                    throw new Error('Failed to generate OAuth URL');
                }
            } catch (oauthError) {
                console.error('OAuth initiation failed:', oauthError);
                // Fallback to direct OAuth URL generation if backend fails
                const fallbackAuthUrl = `https://accounts.google.com/oauth/authorize?` +
                    `client_id=${import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID}&` +
                    `redirect_uri=${encodeURIComponent(`${window.location.origin}/api/oauth/google-ads/callback`)}&` +
                    `scope=https://www.googleapis.com/auth/adwords&` +
                    `response_type=code&` +
                    `access_type=offline&` +
                    `prompt=consent&` +
                    `state=${googleAdsIntegration._id}`;

                window.location.href = fallbackAuthUrl;
            }
        } catch (error) {
            console.error('Failed to connect Google Ads:', error);
            if (error.message?.includes('already exists')) {
                showError('Google Ads integration already exists for this organization. Please disconnect first if you want to reconnect.');
            } else {
                showError(error.message || 'Failed to connect Google Ads. Please try again.');
            }
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = (source: IntegrationSource) => {
        if (window.confirm(`Are you sure you want to disconnect ${source}? This will stop new leads from coming in.`)) {
            setSettings(prev => prev.map(s => s.source === source ? {...s, isConnected: false, connectedAccounts: [], connectedWebsites: []} : s));
        }
    };

    const handleSaveConnection = (source: IntegrationSource, details: Partial<IntegrationSettings>) =>
        setSettings(prev => prev.map(s => s.source === source ? { ...s, ...details } : s));

    const handleCampaignToggle = (campaignId: string) => {
        setSelectedCampaigns(prev =>
            prev.includes(campaignId)
                ? prev.filter(id => id !== campaignId)
                : [...prev, campaignId]
        );
    };

    const handleSaveCampaigns = async () => {
        if (!integration) return;

        try {
            // Update the integration with selected campaigns using real backend API
            await apiService.updateGoogleAdsIntegration(integration._id, {
                selectedCampaigns: selectedCampaigns,
                updatedAt: new Date()
            });

            // Refresh data to show updated state
            await loadGoogleAdsData();

            showSuccess(`Campaigns saved successfully! ${selectedCampaigns.length} campaigns selected.`);
        } catch (error) {
            console.error('Failed to save campaigns:', error);
            showError(error.message || 'Failed to save campaigns. Please try again.');
        }
    };

    const handleRefreshData = async () => {
        await loadGoogleAdsData();
    };

    const handleTestConnection = async () => {
        if (!integration) return;

        try {
            setIsLoading(true);

            // Test connection using real backend API
            const result = await apiService.testGoogleAdsIntegration(integration._id);

            if (result && result.connected) {
                showSuccess('Google Ads connection test successful! All accounts are working properly.');

                // Refresh data after successful test to get latest campaign and conversion data
                await loadGoogleAdsData();
            } else {
                showError('Google Ads connection test failed. Please check your credentials and account permissions.');
            }
        } catch (error) {
            console.error('Failed to test connection:', error);
            showError(error.message || 'Failed to test connection. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

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
                        <h1 className="text-3xl font-bold text-slate-800">Google Ads Integration</h1>
                        <p className="text-slate-600 mt-1">Connect your Google Ads campaigns to capture leads and track conversions</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${currentSetting?.isConnected ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {currentSetting?.isConnected ? 'Connected' : 'Not Connected'}
                    </span>
                </div>
            </div>

            {/* Success and Error Messages */}
            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <div className="text-green-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-green-800">Success</p>
                        <p className="text-sm text-green-700">{success}</p>
                    </div>
                    <button
                        onClick={() => setSuccess(null)}
                        className="text-green-600 hover:text-green-800"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <div className="text-red-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">Error</p>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-600 hover:text-red-800"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Connection Status */}
            {!currentSetting?.isConnected ? (
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="text-center py-8">
                        <div className="mx-auto h-16 w-16 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="h-8 w-8 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">Connect Google Ads</h3>
                        <p className="text-slate-600 mb-6 max-w-md mx-auto">
                            Connect your Google Ads account to automatically capture leads from your campaigns and track conversion data.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={handleOpenSetupModal}
                                className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg text-sm flex items-center gap-2"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Setup API
                            </button>
                            <button
                                onClick={handleSetupModalConnect}
                                disabled={isConnecting || !googleAdsConfig.clientId || !googleAdsConfig.clientSecret}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg text-sm flex items-center gap-2"
                            >
                            {isConnecting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                    Connect Google Ads Account
                                </>
                            )}
                        </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Campaign Selection */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">Campaign Selection</h3>
                                <p className="text-slate-600 text-sm">Select which campaigns you want to track for lead generation</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveCampaigns}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
                                >
                                    Save Selection
                                </button>
                                <button
                                    onClick={handleRefreshData}
                                    disabled={isLoading}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Refreshing...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Refresh
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {isLoading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="text-slate-600">Loading campaigns...</p>
                                </div>
                            ) : campaigns.length > 0 ? (
                                campaigns.map(campaign => (
                                    <div key={`${campaign.accountId}-${campaign.id}`} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedCampaigns.includes(campaign.id)}
                                                onChange={() => handleCampaignToggle(campaign.id)}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium text-slate-800">{campaign.name}</h4>
                                                    {campaign.accountName && (
                                                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                                            {campaign.accountName}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-600">
                                                    Status: {campaign.status} •
                                                    Impressions: {campaign.impressions?.toLocaleString() || 0} •
                                                    Clicks: {campaign.clicks?.toLocaleString() || 0} •
                                                    Conversions: {campaign.conversions || 0}
                                                </p>
                                                {campaign.budget && (
                                                    <p className="text-xs text-slate-500">
                                                        Budget: ₹{campaign.budget.toFixed(2)}
                                                        {campaign.cost && ` • Cost: ₹${campaign.cost.toFixed(2)}`}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            campaign.status === 'ENABLED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {campaign.status}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-slate-600">No campaigns found. Connect your Google Ads account to load campaigns.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Conversion Tracking */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Conversion Tracking</h3>
                        {isLoading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-slate-600">Loading conversion data...</p>
                            </div>
                        ) : conversionData ? (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 border border-slate-200 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600 mb-1">
                                        {Math.round(conversionData.totalConversions || 0)}
                                    </div>
                                    <div className="text-sm text-slate-600">Total Conversions</div>
                                </div>
                                <div className="text-center p-4 border border-slate-200 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600 mb-1">
                                        {conversionData.conversionRate ? conversionData.conversionRate.toFixed(1) : '0.0'}%
                                    </div>
                                    <div className="text-sm text-slate-600">Conversion Rate</div>
                                </div>
                                <div className="text-center p-4 border border-slate-200 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600 mb-1">
                                        ₹{conversionData.costPerConversion ? conversionData.costPerConversion.toFixed(2) : '0.00'}
                                    </div>
                                    <div className="text-sm text-slate-600">Cost per Conversion</div>
                                </div>
                                <div className="text-center p-4 border border-slate-200 rounded-lg">
                                    <div className="text-2xl font-bold text-orange-600 mb-1">
                                        ₹{conversionData.totalCost ? conversionData.totalCost.toFixed(2) : '0.00'}
                                    </div>
                                    <div className="text-sm text-slate-600">Total Cost</div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-slate-600">No conversion data available. Connect your Google Ads account and select campaigns to track conversions.</p>
                            </div>
                        )}
                    </div>

                    {/* Account Management */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">Account Management</h3>
                                <p className="text-slate-600 text-sm">Manage your connected Google Ads accounts</p>
                            </div>
                            <button
                                onClick={handleOpenAccountModal}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Manage Accounts ({accounts.length})
                            </button>
                        </div>

                        {accounts.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {accounts.slice(0, 3).map(account => (
                                    <div key={account.id} className="p-3 border border-slate-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h5 className="font-medium text-slate-800 text-sm">{account.name || `Account ${account.id}`}</h5>
                                                <p className="text-xs text-slate-600">ID: {account.id}</p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                account.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {account.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {accounts.length > 3 && (
                                    <div className="p-3 border border-slate-200 rounded-lg flex items-center justify-center">
                                        <p className="text-sm text-slate-600">+{accounts.length - 3} more accounts</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <button
                                onClick={handleRefreshData}
                                disabled={isLoading}
                                className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:bg-slate-50 disabled:cursor-not-allowed transition-colors text-left"
                            >
                                <div className="font-medium text-slate-800 text-sm flex items-center gap-2">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Sync Campaigns
                                </div>
                                <div className="text-xs text-slate-600">Refresh campaign data</div>
                            </button>
                            <button
                                onClick={handleTestConnection}
                                disabled={isLoading || !currentSetting?.isConnected}
                                className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:bg-slate-50 disabled:cursor-not-allowed transition-colors text-left"
                            >
                                <div className="font-medium text-slate-800 text-sm flex items-center gap-2">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Test Connection
                                </div>
                                <div className="text-xs text-slate-600">Verify API connection</div>
                            </button>
                            <button className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                <div className="font-medium text-slate-800 text-sm flex items-center gap-2">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    View Reports
                                </div>
                                <div className="text-xs text-slate-600">Analytics dashboard</div>
                            </button>
                            <button
                                onClick={() => handleDisconnect('Google Ads')}
                                className="p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-left"
                            >
                                <div className="font-medium text-red-800 text-sm flex items-center gap-2">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Disconnect
                                </div>
                                <div className="text-xs text-red-600">Remove integration</div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Google Ads Setup Modal */}
            <GoogleAdsSetupModal
                isOpen={showSetupModal}
                onClose={handleCloseSetupModal}
                onSave={handleSaveConfiguration}
                onConnectAccount={handleConnectWithSetup}
                initialConfig={googleAdsConfig}
            />

            {/* Account Management Modal */}
            <AccountManagementModal
                isOpen={showAccountModal}
                onClose={handleCloseAccountModal}
                accounts={accounts}
                onConnectAccount={handleConnectNewAccount}
                onDisconnectAccount={handleDisconnectAccount}
                onToggleAccount={handleToggleAccount}
            />
        </div>
    );
};

export default GoogleAdsIntegrationPage;


