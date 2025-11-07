import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IntegrationSettings, IntegrationSource } from '../../types';
import { apiService } from '../../src/services/api';
import TelephonyConnectModal from '../integrations/TelephonyConnectModal';

interface TelephonyIntegrationSettings extends IntegrationSettings {
    id?: string;
    provider?: string;
    apiKey?: string;
    apiSecret?: string;
    accountSid?: string;
    authToken?: string;
    baseUrl?: string;
}

interface PhoneNumber {
    id?: string;
    number: string;
    friendlyName?: string;
    capabilities?: {
        sms: boolean;
        voice: boolean;
        mms: boolean;
    };
    isActive: boolean;
    status: 'Active' | 'Inactive';
    calls?: number;
    type?: string;
}

interface CallAnalytics {
    totalCalls: number;
    answered: number;
    avgDuration: string;
    conversionRate: number;
}

interface CloudTelephonyIntegrationPageProps {
    settings: TelephonyIntegrationSettings[];
    setSettings: React.Dispatch<React.SetStateAction<TelephonyIntegrationSettings[]>>;
    customFieldDefs: any[];
    currentOrganization: any;
    onSendTestLead: (source: IntegrationSource, formName: string) => void;
}

export const CloudTelephonyIntegrationPage: React.FC<CloudTelephonyIntegrationPageProps> = ({
    settings,
    setSettings,
    customFieldDefs,
    currentOrganization,
    onSendTestLead
}) => {
    const navigate = useNavigate();
    const [isConnecting, setIsConnecting] = useState(false);
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
    const [analytics, setAnalytics] = useState<CallAnalytics>({
        totalCalls: 0,
        answered: 0,
        avgDuration: '0m',
        conversionRate: 0
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingNumbers, setIsLoadingNumbers] = useState(false);
    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
    const [isLoadingIVR, setIsLoadingIVR] = useState(false);
    const [ivrConfig, setIvrConfig] = useState<any>(null);
    const [error, setError] = useState('');
    const [showConnectModal, setShowConnectModal] = useState(false);

    const currentSetting = settings.find(s => s.source === 'Cloud Telephony') as TelephonyIntegrationSettings;

    // Fetch phone numbers from API
    const fetchPhoneNumbers = async () => {
        if (!currentSetting?.id) return;

        setIsLoadingNumbers(true);
        setError('');

        try {
            const numbers = await apiService.getCloudTelephonyPhoneNumbers(currentSetting.id);
            setPhoneNumbers(numbers.map((num: any) => ({
                id: num.id,
                number: num.phoneNumber || num.number,
                friendlyName: num.friendlyName,
                capabilities: num.capabilities,
                isActive: num.isActive,
                status: num.isActive ? 'Active' : 'Inactive',
                calls: 0, // This would come from call logs
                type: num.friendlyName || 'Business'
            })));
        } catch (error: any) {
            setError(error.message || 'Failed to fetch phone numbers');
        } finally {
            setIsLoadingNumbers(false);
        }
    };

    // Fetch analytics data
    const fetchAnalytics = async () => {
        if (!currentSetting?.id) return;

        setIsLoadingAnalytics(true);
        setError('');

        try {
            const analyticsData = await apiService.getCloudTelephonyAnalytics(currentSetting.id);
            setAnalytics({
                totalCalls: analyticsData.totalCalls || 0,
                answered: analyticsData.answered || 0,
                avgDuration: analyticsData.avgDuration || '0m',
                conversionRate: analyticsData.conversionRate || 0
            });
        } catch (error: any) {
            setError(error.message || 'Failed to fetch analytics');
        } finally {
            setIsLoadingAnalytics(false);
        }
    };

    // Fetch IVR configuration
    const fetchIVRConfig = async () => {
        if (!currentSetting?.id) return;

        setIsLoadingIVR(true);
        setError('');

        try {
            const ivrData = await apiService.getCloudTelephonyIVR(currentSetting.id);
            setIvrConfig(ivrData);
        } catch (error: any) {
            // IVR might not be configured yet, that's okay
            console.log('IVR not configured yet');
        } finally {
            setIsLoadingIVR(false);
        }
    };

    // Load data when component mounts or when currentSetting changes
    useEffect(() => {
        if (currentSetting?.isConnected && currentSetting?.id) {
            fetchPhoneNumbers();
            fetchAnalytics();
            fetchIVRConfig();
        }
    }, [currentSetting?.isConnected, currentSetting?.id]);

    const handleConnect = () => {
        setShowConnectModal(true);
    };

    const handleModalClose = () => {
        setShowConnectModal(false);
    };

    const handleModalSave = (details: Partial<TelephonyIntegrationSettings>) => {
        handleSaveConnection('Cloud Telephony', details);
        setShowConnectModal(false);
    };

    const handleModalDisconnect = () => {
        handleDisconnect('Cloud Telephony');
        setShowConnectModal(false);
    };

    const handleSaveConnection = (source: IntegrationSource, details: Partial<TelephonyIntegrationSettings>) =>
        setSettings(prev => prev.map(s => s.source === source ? { ...s, ...details } : s));

    const handleDisconnect = async (source: IntegrationSource) => {
        if (!currentSetting?.id) {
            setSettings(prev => prev.map(s => s.source === source ? {...s, isConnected: false, connectedAccounts: [], connectedWebsites: []} : s));
            return;
        }

        if (window.confirm(`Are you sure you want to disconnect ${source}? This will stop call logging.`)) {
            try {
                await apiService.deactivateCloudTelephonyIntegration(currentSetting.id);
                setSettings(prev => prev.map(s => s.source === source ? {...s, isConnected: false, connectedAccounts: [], connectedWebsites: []} : s));
                setPhoneNumbers([]);
                setAnalytics({
                    totalCalls: 0,
                    answered: 0,
                    avgDuration: '0m',
                    conversionRate: 0
                });
            } catch (error: any) {
                setError(error.message || 'Failed to disconnect telephony');
            }
        }
    };

    const handleToggleNumber = async (numberId: string) => {
        if (!currentSetting?.id) return;

        const number = phoneNumbers.find(n => n.id === numberId);
        if (!number) return;

        try {
            await apiService.updateCloudTelephonyPhoneNumber(currentSetting.id, numberId, {
                isActive: !number.isActive
            });

            setPhoneNumbers(prev => prev.map(num =>
                num.id === numberId ? { ...num, isActive: !num.isActive, status: num.isActive ? 'Inactive' : 'Active' } : num
            ));
        } catch (error: any) {
            setError(error.message || 'Failed to update phone number');
        }
    };

    const handleAddNumber = async () => {
        if (!currentSetting?.id) {
            setError('Please connect your telephony service first');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Fetch available numbers from the provider
            const availableNumbers = await apiService.getCloudTelephonyPhoneNumbers(currentSetting.id);

            if (availableNumbers.length === 0) {
                // If no numbers available, show input form
                const number = prompt('Enter phone number (e.g., +1234567890):');
                if (!number) return;

                const friendlyName = prompt('Enter friendly name (optional):');

                const newNumber = await apiService.addCloudTelephonyPhoneNumber(currentSetting.id, {
                    number,
                    friendlyName: friendlyName || undefined
                });

                setPhoneNumbers(prev => [...prev, {
                    id: newNumber.id,
                    number: newNumber.phoneNumber || newNumber.number,
                    friendlyName: newNumber.friendlyName,
                    isActive: true,
                    status: 'Active',
                    calls: 0,
                    type: friendlyName || 'Business'
                }]);
            } else {
                // Show selection from available numbers
                const numberOptions = availableNumbers.map((num: any, index: number) =>
                    `${index + 1}. ${num.phoneNumber || num.number} ${num.friendlyName ? `(${num.friendlyName})` : ''}`
                ).join('\n');

                const selection = prompt(`Available numbers:\n${numberOptions}\n\nEnter number to add (1-${availableNumbers.length}):`);
                if (!selection) return;

                const selectedIndex = parseInt(selection) - 1;
                if (selectedIndex >= 0 && selectedIndex < availableNumbers.length) {
                    const selectedNumber = availableNumbers[selectedIndex];
                    const friendlyName = prompt('Enter friendly name (optional):', selectedNumber.friendlyName || '');

                    const newNumber = await apiService.addCloudTelephonyPhoneNumber(currentSetting.id, {
                        number: selectedNumber.phoneNumber || selectedNumber.number,
                        friendlyName: friendlyName || undefined
                    });

                    setPhoneNumbers(prev => [...prev, {
                        id: newNumber.id,
                        number: newNumber.phoneNumber || newNumber.number,
                        friendlyName: newNumber.friendlyName,
                        isActive: true,
                        status: 'Active',
                        calls: 0,
                        type: friendlyName || 'Business'
                    }]);
                }
            }
        } catch (error: any) {
            setError(error.message || 'Failed to add phone number');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestCall = async () => {
        if (!currentSetting?.id) {
            setError('Please connect your telephony service first');
            return;
        }

        const toNumber = prompt('Enter the number to call (e.g., +1234567890):');
        if (!toNumber) return;

        try {
            await apiService.makeTestCall(currentSetting.id, {
                to: toNumber,
                from: phoneNumbers.find(n => n.isActive)?.number || '',
                message: 'This is a test call from your CRM system.'
            });

            alert('Test call initiated successfully!');
        } catch (error: any) {
            setError(error.message || 'Failed to make test call');
        }
    };

    const handleConfigureIVR = async () => {
        if (!currentSetting?.id) {
            setError('Please connect your telephony service first');
            return;
        }

        const mainMenuPrompt = prompt('Enter main menu prompt:', 'Press 1 for Sales, 2 for Support, 3 for Billing');
        const businessHours = prompt('Enter business hours:', 'Mon-Fri: 9AM-6PM, Sat: 10AM-4PM');
        const afterHoursMessage = prompt('Enter after hours message:', 'Voicemail with callback option');

        if (!mainMenuPrompt || !businessHours || !afterHoursMessage) return;

        try {
            const ivrData = {
                mainMenuPrompt,
                businessHours,
                afterHoursMessage,
                isEnabled: true
            };

            await apiService.updateCloudTelephonyIVR(currentSetting.id, ivrData);
            setIvrConfig(ivrData);
            alert('IVR configuration updated successfully!');
        } catch (error: any) {
            setError(error.message || 'Failed to update IVR configuration');
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/settings/integrations')}
                        className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
                    >
                        <svg className="h-5 w-5 text-on-surface" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-on-surface">Cloud Telephony Integration</h1>
                        <p className="text-subtle mt-1">Track calls, manage IVR, and automate call routing</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${currentSetting?.isConnected ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {currentSetting?.isConnected ? 'Connected' : 'Not Connected'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Phone Numbers Section */}
                <div className="bg-background rounded-lg border border-muted p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-on-surface">Phone Numbers</h3>
                            <p className="text-subtle text-sm">Manage your tracked phone numbers</p>
                        </div>
                        <button
                            onClick={handleAddNumber}
                            disabled={!currentSetting?.isConnected}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg text-sm"
                        >
                            Add Number
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {isLoadingNumbers ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                            <span className="ml-2 text-subtle">Loading phone numbers...</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {phoneNumbers.length === 0 ? (
                                <div className="text-center py-8 text-subtle">
                                    {currentSetting?.isConnected ? 'No phone numbers found. Add your first number to get started.' : 'Connect your telephony service to manage phone numbers.'}
                                </div>
                            ) : (
                                phoneNumbers.map(number => (
                                    <div key={number.id} className="flex items-center justify-between p-3 border border-muted rounded-lg">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-on-surface text-sm">{number.number}</h4>
                                            <p className="text-xs text-subtle">
                                                Type: {number.type} • Calls: {number.calls || 0}
                                                {number.capabilities && (
                                                    <span className="ml-2">
                                                        {number.capabilities.sms && '• SMS'}
                                                        {number.capabilities.voice && '• Voice'}
                                                        {number.capabilities.mms && '• MMS'}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                number.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {number.status}
                                            </span>
                                            <button
                                                onClick={() => handleToggleNumber(number.id || '')}
                                                disabled={!currentSetting?.isConnected}
                                                className={`text-xs font-bold py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed ${
                                                    number.status === 'Active'
                                                        ? 'bg-red-100 hover:bg-red-200 text-red-700'
                                                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                                                }`}
                                            >
                                                {number.status === 'Active' ? 'Disable' : 'Enable'}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* IVR Configuration */}
                <div className="bg-background rounded-lg border border-muted p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-on-surface">IVR Configuration</h3>
                            <p className="text-subtle text-sm">Configure your interactive voice response system</p>
                        </div>
                        <button
                            onClick={handleConfigureIVR}
                            disabled={!currentSetting?.isConnected}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg text-sm"
                        >
                            Configure IVR
                        </button>
                    </div>

                    {isLoadingIVR ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-subtle">Loading IVR configuration...</span>
                        </div>
                    ) : ivrConfig ? (
                        <div className="space-y-3">
                            <div className="p-3 border border-muted rounded-lg">
                                <h4 className="font-medium text-on-surface text-sm">Main Menu</h4>
                                <p className="text-xs text-subtle">{ivrConfig.mainMenuPrompt}</p>
                            </div>
                            <div className="p-3 border border-muted rounded-lg">
                                <h4 className="font-medium text-on-surface text-sm">Business Hours</h4>
                                <p className="text-xs text-subtle">{ivrConfig.businessHours}</p>
                            </div>
                            <div className="p-3 border border-muted rounded-lg">
                                <h4 className="font-medium text-on-surface text-sm">After Hours</h4>
                                <p className="text-xs text-subtle">{ivrConfig.afterHoursMessage}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-subtle">
                            {currentSetting?.isConnected ? 'No IVR configuration found. Click "Configure IVR" to set up your interactive voice response system.' : 'Connect your telephony service to configure IVR.'}
                        </div>
                    )}
                </div>
            </div>

            {/* Call Analytics */}
            <div className="bg-background rounded-lg border border-muted p-6">
                <h3 className="text-lg font-semibold text-on-surface mb-4">Call Analytics</h3>

                {isLoadingAnalytics ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-subtle">Loading analytics...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 border border-muted rounded-lg">
                            <div className="text-2xl font-bold text-cyan-600 mb-1">{analytics.totalCalls}</div>
                            <div className="text-sm text-subtle">Total Calls</div>
                        </div>
                        <div className="text-center p-4 border border-muted rounded-lg">
                            <div className="text-2xl font-bold text-green-600 mb-1">{analytics.answered}</div>
                            <div className="text-sm text-subtle">Answered</div>
                        </div>
                        <div className="text-center p-4 border border-muted rounded-lg">
                            <div className="text-2xl font-bold text-orange-600 mb-1">{analytics.avgDuration}</div>
                            <div className="text-sm text-subtle">Avg. Duration</div>
                        </div>
                        <div className="text-center p-4 border border-muted rounded-lg">
                            <div className="text-2xl font-bold text-purple-600 mb-1">{analytics.conversionRate}%</div>
                            <div className="text-sm text-subtle">Conversion Rate</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Integration Status */}
            {!currentSetting?.isConnected ? (
                <div className="bg-background rounded-lg border border-muted p-6">
                    <div className="text-center py-8">
                        <div className="mx-auto h-16 w-16 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="h-8 w-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-on-surface mb-2">Connect Cloud Telephony</h3>
                        <p className="text-subtle mb-6 max-w-md mx-auto">
                            Connect your cloud telephony system to automatically log calls, track call metrics, and manage IVR routing.
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    Connect Telephony System
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-background rounded-lg border border-muted p-6">
                    <h3 className="text-lg font-semibold text-on-surface mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                            onClick={handleTestCall}
                            disabled={!currentSetting?.isConnected}
                            className="p-3 border border-muted rounded-lg hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
                        >
                            <div className="font-medium text-on-surface text-sm">Test Call</div>
                            <div className="text-xs text-subtle">Make test call</div>
                        </button>
                        <button
                            onClick={() => navigate('/reports')}
                            className="p-3 border border-muted rounded-lg hover:bg-muted/50 transition-colors text-left"
                        >
                            <div className="font-medium text-on-surface text-sm">Call Reports</div>
                            <div className="text-xs text-subtle">View analytics</div>
                        </button>
                        <button
                            onClick={() => handleDisconnect('Cloud Telephony')}
                            disabled={isConnecting}
                            className="p-3 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
                        >
                            <div className="font-medium text-red-800 text-sm">Disconnect</div>
                            <div className="text-xs text-red-600">Remove integration</div>
                        </button>
                    </div>
                </div>
            )}

            {/* Telephony Connect Modal */}
            {showConnectModal && (
                <TelephonyConnectModal
                    setting={currentSetting || {
                        source: 'Cloud Telephony',
                        isConnected: false,
                        fieldMappings: [],
                        organizationId: currentOrganization?.id || ''
                    }}
                    onClose={handleModalClose}
                    onSave={handleModalSave}
                    onDisconnect={handleModalDisconnect}
                    currentOrganization={currentOrganization}
                />
            )}
        </div>
    );
};

export default CloudTelephonyIntegrationPage;


