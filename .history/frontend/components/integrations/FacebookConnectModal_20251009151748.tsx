




import React, { useState, useEffect, useCallback } from 'react';
import { IntegrationSettings, ConnectedFacebookPage, ConnectedFacebookAccount } from '../../types';
import Modal from '../ui/Modal';
import { AppIcons } from '../ui/Icons';

interface FacebookConnectModalProps {
    setting: IntegrationSettings;
    onClose: () => void;
    onSave: (details: Partial<IntegrationSettings>) => void;
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
            const response = await fetch('/api/fb/auth/start?tenantId=org-1');
            const data = await response.json();

            if (data.success) {
                // Redirect to Facebook OAuth
                window.location.href = data.authUrl;
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
            <p className="text-subtle mt-2 mb-6">You will be redirected to securely log in and grant permissions.</p>
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
            const response = await fetch('/api/fb/pages?tenantId=org-1');
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
    
    const handleAddAccount = () => {
        const newAccount: ConnectedFacebookAccount = {
            id: 'fb-acc-2',
            name: 'Alternate Business Account',
            accessToken: 'mock-token',
            pages: [],
        };
        if (!connectedAccounts.some(acc => acc.id === newAccount.id)) {
            setConnectedAccounts(prev => [...prev, newAccount]);
        } else {
            alert("This account is already connected.");
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-on-surface">Manage Facebook Connections</h3>
            <p className="text-subtle text-sm">Select the forms you want to sync. Leads from selected forms will be automatically added to your CRM.</p>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto p-1">
                {connectedAccounts.map(account => (
                    <div key={account.id} className="bg-background p-4 rounded-lg border border-muted">
                        <h4 className="font-semibold text-on-surface">{account.name}</h4>
                        <div className="pl-4 mt-2 space-y-3">
                            {(MOCK_AVAILABLE_PAGES_AND_FORMS[account.id as keyof typeof MOCK_AVAILABLE_PAGES_AND_FORMS] || []).map(pageData => (
                                <div key={pageData.id}>
                                    <p className="font-medium text-sm text-subtle">{pageData.name}</p>
                                    <div className="pl-4 mt-1 space-y-2">
                                        {pageData.forms.map(form => {
                                            const isConnected = account.pages.some(p => p.id === pageData.id && p.forms.some(f => f.id === form.id));
                                            return (
                                                <div key={form.id} className="flex items-center justify-between">
                                                    <label htmlFor={`form-${form.id}`} className="flex items-center text-sm text-on-surface cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            id={`form-${form.id}`}
                                                            checked={isConnected}
                                                            onChange={() => handleFormToggle(account.id, pageData.id, form)}
                                                            className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                                                        />
                                                        <span className="ml-3">{form.name}</span>
                                                    </label>
                                                    {isConnected && <button onClick={() => onSendTestLead(form.name)} className="text-xs bg-muted hover:bg-subtle/80 font-semibold py-1 px-2 rounded-md">Send Test Lead</button>}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
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
    
    const handleSimulatedConnect = () => {
        // Simulate a successful connection and add the first mock account
        const firstAccount = {
            id: 'fb-acc-1',
            name: 'Ed-Tech Main Account',
            accessToken: 'mock-token',
            pages: [],
        };
        onSave({ isConnected: true, connectedAccounts: [firstAccount] });
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
                <LoginStep onConnect={handleSimulatedConnect} />
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


