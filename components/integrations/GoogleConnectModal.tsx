import React, { useState } from 'react';
import { IntegrationSettings, ConnectedGoogleAccount } from '../../types';
import Modal from '../ui/Modal';

// Mock Data
const MOCK_ACCOUNTS = [
    { id: 'g-acc-1', name: 'Ed-Tech Lead Gen (123-456-7890)' },
    { id: 'g-acc-2', name: 'Real Estate Campaigns (987-654-3210)' },
];

interface GoogleConnectModalProps {
    setting: IntegrationSettings;
    onClose: () => void;
    onSave: (details: Partial<IntegrationSettings>) => void;
    onDisconnect: () => void;
}

const GoogleConnectModal: React.FC<GoogleConnectModalProps> = ({ setting, onClose, onSave, onDisconnect }) => {
    const [selectedAccount, setSelectedAccount] = useState<ConnectedGoogleAccount | null>(
        setting.connectedAccounts?.[0] || null
    );

    const handleSave = () => {
        const connectedAccounts = selectedAccount ? [selectedAccount] : [];
        onSave({ connectedAccounts });
    };
    
    const handleFullDisconnect = () => {
        if (window.confirm("Are you sure? This will disconnect your Google Ads account.")) {
            onDisconnect();
            onClose();
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Connect Google Ads">
            <div className="space-y-4">
                <p className="text-subtle text-sm">Select the Google Ads account you want to sync with Clienn CRM. This will allow you to track lead sources from your campaigns.</p>
                
                <div className="space-y-2">
                    {MOCK_ACCOUNTS.map(account => (
                        <label key={account.id} className="flex items-center p-3 bg-background rounded-lg border border-muted has-[:checked]:border-primary-500 has-[:checked]:ring-1 has-[:checked]:ring-primary-500 cursor-pointer">
                             <input
                                type="radio"
                                name="google-account"
                                checked={selectedAccount?.id === account.id}
                                onChange={() => setSelectedAccount(account)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-3 font-semibold text-on-surface">{account.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-muted">
                <button type="button" onClick={handleFullDisconnect} className="bg-red-600/10 hover:bg-red-600/20 text-red-400 font-bold py-2 px-4 rounded-lg text-sm">
                    Disconnect
                </button>
                <div className="flex gap-3">
                    <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button type="button" onClick={handleSave} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">
                        {setting.isConnected ? 'Save Changes' : 'Connect Account'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default GoogleConnectModal;



