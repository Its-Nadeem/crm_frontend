




import React, { useState, useEffect, useCallback } from 'react';
import { IntegrationSettings, ConnectedFacebookPage, ConnectedFacebookAccount } from '../../types';
import Modal from '../ui/Modal';
import { AppIcons } from '../ui/Icons';

interface FacebookConnectModalProps {
    setting: IntegrationSettings;
    onClose: () => void;
    onSave: (details: Partial<IntegrationSettings> | ConnectedFacebookAccount[]) => void;
    onDisconnect: () => void;
    onSendTestLead: (formName: string) => void;
}

const LoadingOverlay: React.FC<{ text: string }> = ({ text }) => (
    <div className="absolute inset-0 bg-surface/80 flex flex-col justify-center items-center z-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <p className="mt-4 text-subtle font-semibold">{text}</p>
    </div>
);

const LoginStep: React.FC<{onConnect: () => void}> = ({ onConnect }) => {
    const handleLogin = async () => {
        try {
            // Start real OAuth flow
            const response = await fetch(`${window.location.origin}/api/fb/auth/start?tenantId=org-1`);
            const data = await response.json();

            if (data.success) {
                // Open Facebook OAuth in popup window
                const popup = window.open(
                    data.authUrl,
                    'facebook-oauth',
                    'width=600,height=700,scrollbars=yes,resizable=yes'
                );

                if (!popup) {
                    alert('Please allow popups for this website to connect with Facebook.');
                    return;
                }

                // Listen for postMessage from popup
                const messageListener = (event: MessageEvent) => {
                    if (event.source === popup && (event.data.type === 'FACEBOOK_AUTH_SUCCESS' || event.data.type === 'FACEBOOK_AUTH_ERROR')) {
                        window.removeEventListener('message', messageListener);

                        if (event.data.type === 'FACEBOOK_AUTH_SUCCESS') {
                            // Update the integration settings with the connected account
                            const newAccount = {
                                id: event.data.data.pages[0]?.pageId || 'fb-main',
                                name: 'Facebook Account',
                                accessToken: 'connected',
                                pages: event.data.data.pages.map((page: any) => ({
                                    id: page.pageId,
                                    name: page.pageName,
                                    forms: []
                                }))
                            };
                            onSave({ isConnected: true, connectedAccounts: [newAccount] });
                        } else {
                            alert(`Facebook connection failed: ${event.data.data.message}`);
                        }

                        popup.close();
                    }
                };

                window.addEventListener('message', messageListener);

                // Fallback: Poll for popup to close (in case postMessage doesn't work)
                const pollTimer = window.setInterval(() => {
                    if (popup.closed) {
                        window.clearInterval(pollTimer);
                        window.removeEventListener('message', messageListener);
                        // Refresh the current page to check for OAuth callback
                        window.location.reload();
                    }
                }, 1000);
            } else {
                console.error('Failed to start Facebook auth:', data.message);
                alert('Failed to connect to Facebook. Please try again.');
            }
        } catch (error) {
            console.error('Error starting Facebook auth:', error);
            alert('Error connecting to Facebook. Please try again.');
        }
    };

    return (
        <div className="text-center p-8 bg-background rounded-lg">
            <h3 className="text-2xl font-bold text-on-surface">Connect a Facebook Account</h3>
            <p className="text-subtle mt-2 mb-6">Facebook login will open in a popup window for better experience.</p>
            <button onClick={handleLogin} className="w-full max-w-sm mx-auto bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Connect with Facebook
            </button>
        </div>
    );
};

const ManageStep: React.FC<{
    setting: IntegrationSettings;
    onSave: (accounts: ConnectedFacebookAccount[]) => void;
    onDisconnect: () => void;
    onSendTestLead: (formName: string) => void;
}> = ({ setting, onSave, onDisconnect, onSendTestLead }) => {
    const [connectedAccounts, setConnectedAccounts] = useState<ConnectedFacebookAccount[]>(setting.connectedAccounts as ConnectedFacebookAccount[] || []);
    const [availablePages, setAvailablePages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch Facebook pages when component mounts
    useEffect(() => {
        fetchFacebookPages();
    }, []);

    const fetchFacebookPages = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${window.location.origin}/api/fb/pages?tenantId=org-1`);
            const data = await response.json();

            if (data.success) {
                setAvailablePages(data.pages || []);
            } else {
                console.error('Failed to fetch Facebook pages:', data.message);
            }
        } catch (error) {
            console.error('Error fetching Facebook pages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFormToggle = (accountId: string, pageId: string, form: { id: string, name: string }) => {
        setConnectedAccounts(prevAccounts => prevAccounts.map(acc => {
            if (acc.id === accountId) {
                const newPages = acc.pages.map(page => {
                    if (page.id === pageId) {
                        const hasForm = page.forms.some(f => f.id === form.id);
                        return { ...page, forms: hasForm ? page.forms.filter(f => f.id !== form.id) : [...page.forms, form] };
                    }
                    return page;
                });
                return { ...acc, pages: newPages };
            }
            return acc;
        }));
    };

    const handleAddAccount = async () => {
        try {
            // Start OAuth flow for additional account
            const response = await fetch(`${window.location.origin}/api/fb/auth/start?tenantId=org-1`);
            const data = await response.json();

            if (data.success) {
                // Open Facebook OAuth in popup window for additional account
                const popup = window.open(
                    data.authUrl,
                    'facebook-oauth-add-account',
                    'width=600,height=700,scrollbars=yes,resizable=yes'
                );

                if (!popup) {
                    alert('Please allow popups for this website to connect with Facebook.');
                    return;
                }

                // Listen for postMessage from popup
                const messageListener = (event: MessageEvent) => {
                    if (event.source === popup && (event.data.type === 'FACEBOOK_AUTH_SUCCESS' || event.data.type === 'FACEBOOK_AUTH_ERROR')) {
                        window.removeEventListener('message', messageListener);

                        if (event.data.type === 'FACEBOOK_AUTH_SUCCESS') {
                            // Refresh to check for OAuth callback and update connected accounts
                            window.location.reload();
                        } else {
                            alert(`Facebook connection failed: ${event.data.data.message}`);
                        }

                        popup.close();
                    }
                };

                window.addEventListener('message', messageListener);

                // Fallback: Poll for popup to close
                const pollTimer = window.setInterval(() => {
                    if (popup.closed) {
                        window.clearInterval(pollTimer);
                        window.removeEventListener('message', messageListener);
                        // Refresh to check for OAuth callback and update connected accounts
                        window.location.reload();
                    }
                }, 1000);
            } else {
                alert('Failed to connect additional Facebook account. Please try again.');
            }
        } catch (error) {
            console.error('Error adding account:', error);
            alert('Error connecting additional Facebook account.');
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-on-surface">Manage Facebook Connections</h3>
            <p className="text-subtle text-sm">Select the forms you want to sync. Leads from selected forms will be automatically added to your CRM.</p>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto p-1">
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                        <p className="mt-2 text-subtle">Loading Facebook pages...</p>
                    </div>
                ) : availablePages.length > 0 ? (
                    connectedAccounts.map(account => (
                        <div key={account.id} className="bg-background p-4 rounded-lg border border-muted">
                            <h4 className="font-semibold text-on-surface">{account.name}</h4>
                            <div className="pl-4 mt-2 space-y-3">
                                {availablePages.map(pageData => (
                                    <div key={pageData.pageId}>
                                        <p className="font-medium text-sm text-subtle">{pageData.pageName}</p>
                                        <div className="pl-4 mt-1 space-y-2">
                                            {/* Forms will be loaded here when we implement form fetching */}
                                            <p className="text-xs text-subtle">Forms will be loaded from Facebook API</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-subtle">
                        <p>No Facebook pages found. Please connect your Facebook account first.</p>
                    </div>
                )}
            </div>
             <div className="flex justify-between items-center mt-6 pt-4 border-t border-muted">
                <button type="button" onClick={onDisconnect} className="bg-red-600/10 hover:bg-red-600/20 text-red-400 font-bold py-2 px-4 rounded-lg text-sm">
                    Disconnect All
                </button>
                 <div className="flex items-center gap-3">
                    <button type="button" onClick={handleAddAccount} className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-bold py-2 px-4 rounded-lg text-sm">
                        Add Account
                    </button>
                    <button type="button" onClick={() => onSave(connectedAccounts)} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Save Connections</button>
                 </div>
            </div>
        </div>
    );
};


const FacebookConnectModal: React.FC<FacebookConnectModalProps> = ({ setting, onClose, onSave, onDisconnect, onSendTestLead }) => {

    // Check for OAuth callback parameters
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
            console.error('Facebook OAuth error:', error);
            alert('Facebook authentication failed. Please try again.');
            return;
        }

        if (code && state) {
            // Handle successful OAuth callback
            handleOAuthCallback(code, state);
        }
    }, []);

    const handleOAuthCallback = async (code: string, state: string) => {
        try {
            const response = await fetch(`${window.location.origin}/api/fb/auth/callback?code=${code}&state=${state}`);

            // Since the backend now returns HTML, we don't need to parse JSON
            // The popup will handle the success/error via postMessage
            if (response.ok) {
                console.log('OAuth callback initiated successfully');
            } else {
                console.error('OAuth callback failed');
                alert('Failed to complete Facebook connection. Please try again.');
            }
        } catch (error) {
            console.error('Error in OAuth callback:', error);
            alert('Error completing Facebook connection.');
        }
    };

    const handleSaveConnections = (accounts: ConnectedFacebookAccount[]) => {
        onSave({ connectedAccounts: accounts });
        onClose();
    };

    const handleFullDisconnect = () => {
        onDisconnect();
        onClose();
    };
    
    return (
        <Modal isOpen={true} onClose={onClose} title="Connect to Facebook Lead Ads">
            {!setting.isConnected ? (
                <LoginStep onConnect={() => {}} />
            ) : (
                <ManageStep
                    setting={setting}
                    onSave={handleSaveConnections}
                    onDisconnect={handleFullDisconnect}
                    onSendTestLead={onSendTestLead}
                />
            )}
        </Modal>
    );
};

export default FacebookConnectModal;


