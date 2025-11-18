import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IntegrationSettings, IntegrationSource } from '../../types';
import { apiService } from '../../src/services/api';
import SMSConnectModal from '../integrations/SMSConnectModal';
import SMSCampaignModal from '../integrations/SMSCampaignModal';
import CreatePhoneListModal from '../integrations/CreatePhoneListModal';

interface SMSMarketingIntegrationPageProps {
    settings: IntegrationSettings[];
    setSettings: React.Dispatch<React.SetStateAction<IntegrationSettings[]>>;
    customFieldDefs: any[];
    currentOrganization: any;
    onSendTestLead: (source: IntegrationSource, formName: string) => void;
}

export const SMSMarketingIntegrationPage: React.FC<SMSMarketingIntegrationPageProps> = ({
    settings,
    setSettings,
    customFieldDefs,
    currentOrganization,
    onSendTestLead
}) => {
    const navigate = useNavigate();
    const [isConnecting, setIsConnecting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [phoneLists, setPhoneLists] = useState<any[]>([]);
    const [smsBalance, setSmsBalance] = useState<any>(null);
    const [smsAnalytics, setSmsAnalytics] = useState<any>(null);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [showCreateListModal, setShowCreateListModal] = useState(false);

    const currentSetting = settings.find(s => s.source === 'SMS Marketing');

    // Load SMS data from API
    useEffect(() => {
        loadSMSData();
    }, [currentOrganization]);

    const loadSMSData = async () => {
        if (!currentOrganization?.id) return;

        setIsLoading(true);
        setError(null);

        try {
            // Load phone lists, balance, and analytics in parallel
            const [phoneListsData, balanceData, analyticsData] = await Promise.all([
                apiService.getSMSPhoneLists(currentOrganization.id),
                apiService.getSMSBalance(currentOrganization.id),
                apiService.getSMSAnalytics(currentOrganization.id)
            ]);

            setPhoneLists(phoneListsData || []);
            setSmsBalance(balanceData || null);
            setSmsAnalytics(analyticsData || null);
        } catch (error) {
            console.error('Error loading SMS data:', error);
            setError('Failed to load SMS data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = () => {
        setShowConnectModal(true);
    };

    const handleIntegrationConnect = async (integration: any) => {
        handleSaveConnection('SMS Marketing', {
            isConnected: true,
            connectedAccounts: [integration]
        });

        // Reload SMS data after successful connection
        await loadSMSData();
    };

    const handleSaveConnection = (source: IntegrationSource, details: Partial<IntegrationSettings>) =>
        setSettings(prev => prev.map(s => s.source === source ? { ...s, ...details } : s));

    const handleDisconnect = (source: IntegrationSource) => {
        if (window.confirm(`Are you sure you want to disconnect ${source}? This will stop SMS campaigns.`)) {
            setSettings(prev => prev.map(s => s.source === source ? {...s, isConnected: false, connectedAccounts: [], connectedWebsites: []} : s));
        }
    };

    if (isLoading && !currentSetting?.isConnected) {
        return (
            <div className="space-y-6 h-full flex flex-col min-h-0">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-slate-600">Loading SMS integration...</p>
                    </div>
                </div>
            </div>
        );
    }

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
                        <h1 className="text-3xl font-bold text-slate-800">SMS Marketing Integration</h1>
                        <p className="text-slate-600 mt-1">Send SMS campaigns and manage subscriber lists</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${currentSetting?.isConnected ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {isConnecting ? 'Connecting...' : (currentSetting?.isConnected ? 'Connected' : 'Not Connected')}
                    </span>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-red-800 font-medium">{error}</p>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-600 hover:text-red-800"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Phone Number Lists */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Phone Lists</h3>
                            <p className="text-slate-600 text-sm">Manage your SMS subscriber lists</p>
                        </div>
                        <button
                            onClick={() => setShowCreateListModal(true)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
                        >
                            Create List
                        </button>
                    </div>

                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                                <p className="text-slate-600 text-sm">Loading phone lists...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-4">
                                <p className="text-red-600 text-sm mb-2">{error}</p>
                                <button
                                    onClick={loadSMSData}
                                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : phoneLists.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-slate-600 mb-4">No phone lists found</p>
                                <button
                                    onClick={() => setShowCreateListModal(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
                                >
                                    Create Your First List
                                </button>
                            </div>
                        ) : (
                            phoneLists.map(list => (
                                <div key={list.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-slate-800 text-sm">{list.name}</h4>
                                        <p className="text-xs text-slate-600">
                                            {list.totalContacts?.toLocaleString() || 0} subscribers • {list.country}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => alert(`Edit functionality for ${list.name} - Coming soon!`)}
                                            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-1 px-2 rounded"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* SMS Credits & Balance */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">SMS Balance</h3>
                            <p className="text-slate-600 text-sm">Monitor your SMS credits and usage</p>
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm">
                            Buy Credits
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                            <div>
                                <h4 className="font-medium text-slate-800">Available Credits</h4>
                                <p className="text-sm text-slate-600">SMS messages remaining</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-green-600">
                                    {isLoading ? '...' : (smsBalance?.credits || 0)}
                                </div>
                                <div className="text-xs text-slate-600">credits</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 border border-slate-200 rounded-lg">
                                <div className="text-lg font-bold text-blue-600 mb-1">
                                    {isLoading ? '...' : (smsBalance?.usedThisMonth || 0)}
                                </div>
                                <div className="text-xs text-slate-600">Sent (30 days)</div>
                            </div>
                            <div className="text-center p-3 border border-slate-200 rounded-lg">
                                <div className="text-lg font-bold text-green-600 mb-1">
                                    {isLoading ? '...' : (smsAnalytics?.deliveryRate || 0).toFixed(1)}%
                                </div>
                                <div className="text-xs text-slate-600">Delivery Rate</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SMS Performance */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">SMS Performance</h3>
                {isLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                        <p className="text-slate-600">Loading SMS performance data...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <p className="text-red-600 mb-2">{error}</p>
                        <button
                            onClick={loadSMSData}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 border border-slate-200 rounded-lg">
                            <div className="text-2xl font-bold text-indigo-600 mb-1">
                                {smsAnalytics?.totalSent || 0}
                            </div>
                            <div className="text-sm text-slate-600">Total SMS Sent</div>
                        </div>
                        <div className="text-center p-4 border border-slate-200 rounded-lg">
                            <div className="text-2xl font-bold text-green-600 mb-1">
                                {smsAnalytics?.deliveryRate?.toFixed(1) || '0.0'}%
                            </div>
                            <div className="text-sm text-slate-600">Delivery Rate</div>
                        </div>
                        <div className="text-center p-4 border border-slate-200 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600 mb-1">
                                {smsAnalytics?.clickRate?.toFixed(1) || '0.0'}%
                            </div>
                            <div className="text-sm text-slate-600">Click Rate</div>
                        </div>
                        <div className="text-center p-4 border border-slate-200 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600 mb-1">
                                {smsAnalytics?.optOutRate?.toFixed(1) || '0.0'}%
                            </div>
                            <div className="text-sm text-slate-600">Opt-out Rate</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Integration Status */}
            {!currentSetting?.isConnected ? (
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="text-center py-8">
                        <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">Connect SMS Platform</h3>
                        <p className="text-slate-600 mb-6 max-w-md mx-auto">
                            Connect your SMS marketing platform to send campaigns, manage subscriber lists, and track delivery.
                        </p>
                        <button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg text-sm flex items-center gap-2 mx-auto"
                        >
                            {isConnecting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    Connect SMS Platform
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <button
                            onClick={() => setShowCampaignModal(true)}
                            className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left"
                        >
                            <div className="font-medium text-slate-800 text-sm">Create Campaign</div>
                            <div className="text-xs text-slate-600">Send SMS campaign</div>
                        </button>
                        <button
                            onClick={() => alert('Test SMS functionality - Coming soon!')}
                            className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left"
                        >
                            <div className="font-medium text-slate-800 text-sm">Send Test SMS</div>
                            <div className="text-xs text-slate-600">Test message delivery</div>
                        </button>
                        <button
                            onClick={() => navigate('/reports')}
                            className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left"
                        >
                            <div className="font-medium text-slate-800 text-sm">View Reports</div>
                            <div className="text-xs text-slate-600">SMS analytics</div>
                        </button>
                        <button
                            onClick={() => handleDisconnect('SMS Marketing')}
                            className="p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-left"
                        >
                            <div className="font-medium text-red-800 text-sm">Disconnect</div>
                            <div className="text-xs text-red-600">Remove integration</div>
                        </button>
                    </div>
                </div>
            )}

            {/* SMS Connection Modal */}
            <SMSConnectModal
                isOpen={showConnectModal}
                onClose={() => setShowConnectModal(false)}
                onConnect={handleIntegrationConnect}
                organizationId={currentOrganization?.id || ''}
            />

            {/* SMS Campaign Modal */}
            <SMSCampaignModal
                isOpen={showCampaignModal}
                onClose={() => setShowCampaignModal(false)}
                organizationId={currentOrganization?.id || ''}
                phoneLists={phoneLists}
            />

            {/* Create Phone List Modal */}
            <CreatePhoneListModal
                isOpen={showCreateListModal}
                onClose={() => setShowCreateListModal(false)}
                onListCreated={loadSMSData}
                organizationId={currentOrganization?.id || ''}
            />
        </div>
    );
};

export default SMSMarketingIntegrationPage;


