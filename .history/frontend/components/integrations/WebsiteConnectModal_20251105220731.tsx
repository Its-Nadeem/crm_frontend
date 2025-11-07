import React, { useState } from 'react';
import { IntegrationSettings, ConnectedWebsite } from '../../types';
import Modal from '../ui/Modal';

const SCRIPT_SNIPPET = `<script src="https://cdn.Clienn CRM.io/tracker.js" data-id="CRM-12345" async defer></script>`;

interface WebsiteConnectModalProps {
    setting: IntegrationSettings;
    onClose: () => void;
    onSave: (details: Partial<IntegrationSettings>) => void;
    onDisconnect: () => void;
}

const WebsiteConnectModal: React.FC<WebsiteConnectModalProps> = ({ setting, onClose, onSave, onDisconnect }) => {
    const [websites, setWebsites] = useState<ConnectedWebsite[]>(setting.connectedWebsites || []);
    const [newUrl, setNewUrl] = useState('');

    const addWebsite = () => {
        if (newUrl && !websites.some(w => w.url === newUrl)) {
            setWebsites([...websites, { id: faker.string.uuid(), url: newUrl }]);
            setNewUrl('');
        }
    };
    
    const removeWebsite = (id: string) => {
        setWebsites(websites.filter(w => w.id !== id));
    };

    const handleSave = () => {
        onSave({ connectedWebsites: websites });
    };

    const handleFullDisconnect = () => {
        if (window.confirm("Are you sure? This will disconnect all websites.")) {
            onDisconnect();
            onClose();
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Connect Your Website">
            <div className="space-y-6">
                 <div>
                    <h3 className="font-semibold text-on-surface">Step 1: Install the Tracking Snippet</h3>
                    <p className="text-subtle text-sm mt-1 mb-2">Copy and paste this snippet into the {"<head>"} section of your website HTML. This allows Clienn CRM to capture leads from your website forms.</p>
                    <pre className="bg-background p-4 rounded-lg text-xs text-on-surface overflow-auto">
                        <code>{SCRIPT_SNIPPET}</code>
                    </pre>
                </div>

                <div>
                    <h3 className="font-semibold text-on-surface">Step 2: Add Your Website URL(s)</h3>
                    <p className="text-subtle text-sm mt-1 mb-2">Enter the full URL of the website(s) where you've installed the script. This helps us verify the installation.</p>
                    <div className="flex gap-2">
                        <input 
                            type="url"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            placeholder="https://www.example.com"
                            className="flex-grow bg-background border border-muted p-2 rounded-lg text-sm"
                        />
                        <button onClick={addWebsite} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg text-sm">Add</button>
                    </div>
                    <div className="mt-2 space-y-1">
                        {websites.map(site => (
                            <div key={site.id} className="flex justify-between items-center p-2 bg-background rounded-md">
                                <span className="text-sm text-on-surface">{site.url}</span>
                                <button onClick={() => removeWebsite(site.id)} className="text-red-400 hover:text-red-300">Remove</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-muted">
                <button type="button" onClick={handleFullDisconnect} className="bg-red-600/10 hover:bg-red-600/20 text-red-400 font-bold py-2 px-4 rounded-lg text-sm">
                    Disconnect All
                </button>
                <div className="flex gap-3">
                    <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button type="button" onClick={handleSave} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Save</button>
                </div>
            </div>
        </Modal>
    );
};

export default WebsiteConnectModal;



