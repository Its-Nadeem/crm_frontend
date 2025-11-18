import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IntegrationSettings, IntegrationSource } from '../../types';

interface EmailMarketingIntegrationPageProps {
    settings: IntegrationSettings[];
    setSettings: React.Dispatch<React.SetStateAction<IntegrationSettings[]>>;
    customFieldDefs: any[];
    currentOrganization: any;
    onSendTestLead: (source: IntegrationSource, formName: string) => void;
}

export const EmailMarketingIntegrationPage: React.FC<EmailMarketingIntegrationPageProps> = ({
    settings,
    setSettings,
    customFieldDefs,
    currentOrganization,
    onSendTestLead
}) => {
    const navigate = useNavigate();
    const [isConnecting, setIsConnecting] = useState(false);
    const [campaigns, setCampaigns] = useState<any[]>([
        { id: '1', name: 'Welcome Series', status: 'Active', subscribers: 1245, sent: 1245, opened: 456, clicked: 89 },
        { id: '2', name: 'Product Updates', status: 'Active', subscribers: 890, sent: 890, opened: 312, clicked: 67 },
        { id: '3', name: 'Holiday Special', status: 'Draft', subscribers: 0, sent: 0, opened: 0, clicked: 0 }
    ]);

    const currentSetting = settings.find(s => s.source === 'Email Marketing');

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            // Simulate email platform connection
            await new Promise(resolve => setTimeout(resolve, 2000));
            handleSaveConnection('Email Marketing', { isConnected: true });
        } catch (error) {
            console.error('Failed to connect email marketing:', error);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleSaveConnection = (source: IntegrationSource, details: Partial<IntegrationSettings>) =>
        setSettings(prev => prev.map(s => s.source === source ? { ...s, ...details } : s));

    const handleDisconnect = (source: IntegrationSource) => {
        if (window.confirm(`Are you sure you want to disconnect ${source}? This will stop email sync.`)) {
            setSettings(prev => prev.map(s => s.source === source ? {...s, isConnected: false, connectedAccounts: [], connectedWebsites: []} : s));
        }
    };

    const handleToggleCampaign = (campaignId: string) => {
        setCampaigns(prev => prev.map(campaign =>
            campaign.id === campaignId ? { ...campaign, status: campaign.status === 'Active' ? 'Paused' : 'Active' } : campaign
        ));
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
                        <h1 className="text-3xl font-bold text-slate-800">Email Marketing Integration</h1>
                        <p className="text-slate-600 mt-1">Sync email campaigns and manage subscriber lists</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${currentSetting?.isConnected ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {currentSetting?.isConnected ? 'Connected' : 'Not Connected'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Email Lists */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Email Lists</h3>
                            <p className="text-slate-600 text-sm">Manage your subscriber lists and segments</p>
                        </div>
                        <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm">
                            Create List
                        </button>
                    </div>

                    <div className="space-y-3">
                        {[
                            { id: '1', name: 'Newsletter Subscribers', count: 1245, growth: '+12%' },
                            { id: '2', name: 'Product Updates', count: 890, growth: '+8%' },
                            { id: '3', name: 'VIP Customers', count: 234, growth: '+23%' },
                            { id: '4', name: 'Trial Users', count: 567, growth: '+5%' }
                        ].map(list => (
                            <div key={list.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                                <div className="flex-1">
                                    <h4 className="font-medium text-slate-800 text-sm">{list.name}</h4>
                                    <p className="text-xs text-slate-600">{list.count.toLocaleString()} subscribers</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-green-600 font-medium">{list.growth}</span>
                                    <button className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-1 px-2 rounded">
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Active Campaigns */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Active Campaigns</h3>
                            <p className="text-slate-600 text-sm">Monitor your email campaign performance</p>
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm">
                            New Campaign
                        </button>
                    </div>

                    <div className="space-y-3">
                        {campaigns.map(campaign => (
                            <div key={campaign.id} className="p-3 border border-slate-200 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-slate-800 text-sm">{campaign.name}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            campaign.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {campaign.status}
                                        </span>
                                        <button
                                            onClick={() => handleToggleCampaign(campaign.id)}
                                            className={`text-xs font-bold py-1 px-2 rounded ${
                                                campaign.status === 'Active'
                                                    ? 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                                                    : 'bg-green-100 hover:bg-green-200 text-green-700'
                                            }`}
                                        >
                                            {campaign.status === 'Active' ? 'Pause' : 'Activate'}
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-xs">
                                    <div className="text-center">
                                        <div className="font-medium text-slate-800">{campaign.sent.toLocaleString()}</div>
                                        <div className="text-slate-600">Sent</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-medium text-slate-800">{campaign.opened.toLocaleString()}</div>
                                        <div className="text-slate-600">Opened</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-medium text-slate-800">{campaign.clicked}</div>
                                        <div className="text-slate-600">Clicked</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-medium text-green-600">
                                            {campaign.sent > 0 ? Math.round((campaign.opened / campaign.sent) * 100) : 0}%
                                        </div>
                                        <div className="text-slate-600">Open Rate</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Email Analytics */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Email Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border border-slate-200 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 mb-1">12,450</div>
                        <div className="text-sm text-slate-600">Total Emails Sent</div>
                    </div>
                    <div className="text-center p-4 border border-slate-200 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 mb-1">24.8%</div>
                        <div className="text-sm text-slate-600">Average Open Rate</div>
                    </div>
                    <div className="text-center p-4 border border-slate-200 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 mb-1">4.2%</div>
                        <div className="text-sm text-slate-600">Click Rate</div>
                    </div>
                    <div className="text-center p-4 border border-slate-200 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600 mb-1">2.1%</div>
                        <div className="text-sm text-slate-600">Unsubscribe Rate</div>
                    </div>
                </div>
            </div>

            {/* Integration Status */}
            {!currentSetting?.isConnected ? (
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="text-center py-8">
                        <div className="mx-auto h-16 w-16 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">Connect Email Platform</h3>
                        <p className="text-slate-600 mb-6 max-w-md mx-auto">
                            Connect your email marketing platform to sync subscriber lists, campaigns, and track email performance.
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Connect Email Platform
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                            <div className="font-medium text-slate-800 text-sm">Send Test Email</div>
                            <div className="text-xs text-slate-600">Test email delivery</div>
                        </button>
                        <button className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                            <div className="font-medium text-slate-800 text-sm">View Reports</div>
                            <div className="text-xs text-slate-600">Email analytics</div>
                        </button>
                        <button
                            onClick={() => handleDisconnect('Email Marketing')}
                            className="p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-left"
                        >
                            <div className="font-medium text-red-800 text-sm">Disconnect</div>
                            <div className="text-xs text-red-600">Remove integration</div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailMarketingIntegrationPage;


