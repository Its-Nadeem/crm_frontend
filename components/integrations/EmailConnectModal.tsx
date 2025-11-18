import React, { useState } from 'react';
import { IntegrationSettings } from '../../types';
import Modal from '../ui/Modal';

interface EmailConnectModalProps {
    setting: IntegrationSettings;
    onClose: () => void;
    onSave: (details: Partial<IntegrationSettings>) => void;
    onDisconnect: () => void;
}

const EmailConnectModal: React.FC<EmailConnectModalProps> = ({ setting, onClose, onSave, onDisconnect }) => {
    const [connectionType, setConnectionType] = useState<'api' | 'smtp'>('api');

    const handleConnect = () => {
        alert("Simulating connection...");
        onSave({ isConnected: true });
        onClose();
    }

    const handleDisconnect = () => {
        onDisconnect();
        onClose();
    }

    return (
        <Modal isOpen={true} onClose={onClose} title="Connect to Email Marketing Platform">
            <div className="space-y-6">
                <p className="text-subtle text-sm">
                    Integrate with platforms like Mailchimp or sync with any provider via SMTP.
                </p>
                
                <div className="space-y-4">
                    {/* API Key Connection */}
                    <div className={`p-4 bg-background rounded-lg border ${connectionType === 'api' ? 'border-primary-500 ring-1 ring-primary-500' : 'border-muted'}`}>
                         <label className="flex items-center cursor-pointer">
                            <input type="radio" name="email-connector" checked={connectionType === 'api'} onChange={() => setConnectionType('api')} className="h-4 w-4 text-primary-600 focus:ring-primary-500" />
                            <span className="ml-3 font-semibold text-on-surface">Connect with API Key (e.g., Mailchimp)</span>
                        </label>
                        {connectionType === 'api' && (
                            <div className="mt-4 pl-7">
                                <label className="block text-sm font-medium text-subtle">API Key</label>
                                <input type="password" placeholder="Enter your API Key" className="mt-1 block w-full bg-surface border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500"/>
                            </div>
                        )}
                    </div>
                    {/* SMTP Connection */}
                    <div className={`p-4 bg-background rounded-lg border ${connectionType === 'smtp' ? 'border-primary-500 ring-1 ring-primary-500' : 'border-muted'}`}>
                         <label className="flex items-center cursor-pointer">
                            <input type="radio" name="email-connector" checked={connectionType === 'smtp'} onChange={() => setConnectionType('smtp')} className="h-4 w-4 text-primary-600 focus:ring-primary-500" />
                             <span className="ml-3 font-semibold text-on-surface">Connect with SMTP</span>
                        </label>
                        {connectionType === 'smtp' && (
                             <div className="mt-4 pl-7 space-y-2">
                                 <input type="text" placeholder="SMTP Server (e.g., smtp.gmail.com)" className="mt-1 block w-full bg-surface border border-muted rounded-md shadow-sm py-2 px-3"/>
                                 <input type="text" placeholder="SMTP Port (e.g., 587)" className="mt-1 block w-full bg-surface border border-muted rounded-md shadow-sm py-2 px-3"/>
                                 <input type="text" placeholder="SMTP Username / Email" className="mt-1 block w-full bg-surface border border-muted rounded-md shadow-sm py-2 px-3"/>
                                 <input type="password" placeholder="SMTP Password / App Password" className="mt-1 block w-full bg-surface border border-muted rounded-md shadow-sm py-2 px-3"/>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-muted">
                {setting.isConnected ? (
                     <button type="button" onClick={handleDisconnect} className="bg-red-600/10 hover:bg-red-600/20 text-red-400 font-bold py-2 px-4 rounded-lg text-sm">
                        Disconnect
                    </button>
                ) : <div />}
                <div className="flex gap-3">
                    <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button type="button" onClick={handleConnect} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">
                        {setting.isConnected ? 'Save Changes' : 'Connect'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default EmailConnectModal;


