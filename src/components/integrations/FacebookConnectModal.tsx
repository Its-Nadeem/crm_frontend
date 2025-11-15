import React, { useState, useEffect } from 'react';
import { IntegrationSettings, IntegrationSource } from '../../types';

interface FacebookConnectModalProps {
    setting: IntegrationSettings;
    onClose: () => void;
    onSave: (source: IntegrationSource, details: Partial<IntegrationSettings>) => void;
    onDisconnect: () => void;
    onSendTestLead: (formName: string) => void;
}

interface FacebookAccount {
    id: string;
    name: string;
    tokenStatus: 'valid' | 'expired';
    pages: FacebookPage[];
}

interface FacebookPage {
    id: string;
    name: string;
    subscribed: boolean;
}

const FacebookConnectModal: React.FC<FacebookConnectModalProps> = ({
    setting,
    onClose,
    onSave,
    onDisconnect,
    onSendTestLead
}) => {
    const [step, setStep] = useState<'connect' | 'manage' | 'loading'>('connect');
    const [accounts, setAccounts] = useState<FacebookAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Connect to Facebook
    const handleConnect = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/fb/auth/start', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to start Facebook authentication');
            }

            const data = await response.json();

            if (data.success && data.authUrl) {
                // Redirect to Facebook OAuth
                window.location.href = data.authUrl;
            } else {
                throw new Error(data.message || 'Failed to get authentication URL');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Connection failed');
            setLoading(false);
        }
    };

    // Fetch connected accounts and pages
    const fetchAccountsAndPages = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/fb/pages', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch accounts');
            }

            const data = await response.json();

            if (data.success) {
                const formattedAccounts: FacebookAccount[] = [{
                    id: '1',
                    name: 'Connected Facebook Account',
                    tokenStatus: 'valid',
                    pages: data.pages.map((page: any) => ({
                        id: page.pageId,
                        name: page.pageName,
                        subscribed: page.subscribed
                    }))
                }];
                setAccounts(formattedAccounts);
                setStep('manage');
            } else {
                throw new Error(data.message || 'Failed to fetch accounts');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
        } finally {
            setLoading(false);
        }
    };

    // Subscribe/Unsubscribe page to webhook
    const handleSubscriptionToggle = async (pageId: string, subscribed: boolean) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/fb/pages/${pageId}/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    tenantId: 'current-tenant-id' // This should come from context
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update subscription');
            }

            const data = await response.json();

            if (data.success) {
                // Update local state
                setAccounts(prevAccounts =>
                    prevAccounts.map(account => ({
                        ...account,
                        pages: account.pages.map(page =>
                            page.id === pageId ? { ...page, subscribed } : page
                        )
                    }))
                );
            } else {
                throw new Error(data.message || 'Failed to update subscription');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Subscription update failed');
        } finally {
            setLoading(false);
        }
    };

    // Handle disconnect
    const handleDisconnect = () => {
        if (window.confirm('Are you sure you want to disconnect your Facebook account? This will stop new leads from coming in.')) {
            onDisconnect();
            onClose();
        }
    };

    // Check if already connected on mount
    useEffect(() => {
        if (setting.isConnected) {
            fetchAccountsAndPages();
        }
    }, [setting.isConnected]);

    if (step === 'loading') {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                <div className="bg-background rounded-xl shadow-2xl w-full max-w-md p-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <h3 className="text-lg font-semibold text-on-surface mb-2">Connecting to Facebook...</h3>
                        <p className="text-subtle">Please wait while we connect your account</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col ring-1 ring-inset ring-muted/50">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-muted flex-shrink-0">
                    <h2 className="text-xl font-bold text-on-surface">
                        {step === 'connect' ? 'Connect Facebook Account' : 'Manage Facebook Integration'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-subtle hover:text-on-surface p-1 rounded-full hover:bg-muted transition-colors"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-grow">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center">
                                <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="text-red-800 text-sm">{error}</span>
                            </div>
                        </div>
                    )}

                    {step === 'connect' ? (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                    <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-on-surface mb-2">Connect Your Facebook Account</h3>
                                <p className="text-subtle mb-6">
                                    Connect your Facebook Business account to automatically capture leads from your Facebook Lead Forms.
                                </p>
                            </div>

                            <div className="bg-blue-50 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-900 mb-2">What you'll need:</h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• A Facebook Business account with admin access</li>
                                    <li>• At least one Facebook Page with Lead Forms</li>
                                    <li>• Permission to manage pages and access leads</li>
                                </ul>
                            </div>

                            <div className="bg-amber-50 rounded-lg p-4">
                                <h4 className="font-semibold text-amber-900 mb-2">Permissions we'll request:</h4>
                                <ul className="text-sm text-amber-800 space-y-1">
                                    <li>• Access to your Facebook Pages</li>
                                    <li>• Permission to read lead data from forms</li>
                                    <li>• Ability to subscribe to webhook notifications</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-on-surface mb-4">Connected Account</h3>

                                {accounts.map(account => (
                                    <div key={account.id} className="bg-background rounded-lg border border-muted p-6 shadow-sm mb-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                                    </svg>
                                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${account.tokenStatus === 'valid' ? 'bg-green-500' : 'bg-red-500'} border-2 border-background rounded-full`}></div>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-on-surface">{account.name}</h4>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${account.tokenStatus === 'valid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {account.tokenStatus === 'valid' ? 'Token Valid' : 'Token Expired'}
                                                    </span>
                                                </div>
                                            </div>

                                            {account.tokenStatus === 'expired' && (
                                                <button
                                                    onClick={handleConnect}
                                                    disabled={loading}
                                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                                                >
                                                    {loading ? 'Reconnecting...' : 'Reconnect'}
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <h5 className="font-medium text-on-surface">Facebook Pages</h5>

                                            {account.pages.map(page => (
                                                <div key={page.id} className="flex items-center justify-between py-3 border-t border-muted/50">
                                                    <div>
                                                        <div className="font-medium text-on-surface">{page.name}</div>
                                                        <div className="text-sm text-subtle">Facebook Page</div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-xs px-2 py-1 rounded-full ${page.subscribed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                            {page.subscribed ? 'Subscribed' : 'Not Subscribed'}
                                                        </span>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={page.subscribed}
                                                                onChange={(e) => handleSubscriptionToggle(page.id, e.target.checked)}
                                                                disabled={loading}
                                                                className="sr-only peer"
                                                            />
                                                            <div className={`w-10 h-5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 ${page.subscribed ? 'bg-primary-600' : 'bg-muted'}`}></div>
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="flex justify-between gap-3 p-6 border-t border-muted bg-muted/30">
                    <button
                        onClick={handleDisconnect}
                        className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 font-medium rounded-lg transition-colors"
                    >
                        Disconnect Account
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-subtle hover:text-on-surface font-medium rounded-lg hover:bg-muted transition-colors"
                        >
                            {step === 'connect' ? 'Cancel' : 'Close'}
                        </button>

                        {step === 'connect' && (
                            <button
                                onClick={handleConnect}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                        </svg>
                                        Connect Facebook
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacebookConnectModal;


