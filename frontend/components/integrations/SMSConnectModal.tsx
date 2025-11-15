import React, { useState } from 'react';
import { apiService } from '../../src/services/api';

interface SMSConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnect: (integration: any) => void;
    organizationId: string;
}

interface SMSProvider {
    id: string;
    name: string;
    logo: string;
    description: string;
    fields: {
        name: string;
        label: string;
        type: string;
        placeholder: string;
        required: boolean;
    }[];
}

const SMS_PROVIDERS: SMSProvider[] = [
    {
        id: 'twilio',
        name: 'Twilio',
        logo: '🔷',
        description: 'Connect your Twilio account for SMS marketing',
        fields: [
            {
                name: 'accountSid',
                label: 'Account SID',
                type: 'text',
                placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                required: true
            },
            {
                name: 'authToken',
                label: 'Auth Token',
                type: 'password',
                placeholder: 'Enter your auth token',
                required: true
            },
            {
                name: 'fromNumber',
                label: 'From Number',
                type: 'text',
                placeholder: '+1234567890',
                required: true
            }
        ]
    },
    {
        id: 'msg91',
        name: 'MSG91',
        logo: '📱',
        description: 'Connect your MSG91 account for SMS marketing',
        fields: [
            {
                name: 'apiKey',
                label: 'API Key',
                type: 'password',
                placeholder: 'Enter your MSG91 API key',
                required: true
            },
            {
                name: 'senderId',
                label: 'Sender ID',
                type: 'text',
                placeholder: 'YOURBRAND',
                required: true
            }
        ]
    },
    {
        id: 'textlocal',
        name: 'TextLocal',
        logo: '💬',
        description: 'Connect your TextLocal account for SMS marketing',
        fields: [
            {
                name: 'apiKey',
                label: 'API Key',
                type: 'password',
                placeholder: 'Enter your TextLocal API key',
                required: true
            },
            {
                name: 'senderId',
                label: 'Sender ID',
                type: 'text',
                placeholder: 'YOURBRAND',
                required: true
            }
        ]
    }
];

export const SMSConnectModal: React.FC<SMSConnectModalProps> = ({
    isOpen,
    onClose,
    onConnect,
    organizationId
}) => {
    const [selectedProvider, setSelectedProvider] = useState<SMSProvider>(SMS_PROVIDERS[0]);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (fieldName: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const handleConnect = async () => {
        setIsConnecting(true);
        setError(null);

        try {
            // Validate required fields
            const missingFields = selectedProvider.fields
                .filter(field => field.required && !formData[field.name])
                .map(field => field.label);

            if (missingFields.length > 0) {
                throw new Error(`Please fill in: ${missingFields.join(', ')}`);
            }

            // Create integration data
            const integrationData = {
                organizationId,
                provider: selectedProvider.id,
                name: `${selectedProvider.name} SMS`,
                credentials: formData,
                settings: {
                    dailyLimit: 1000,
                    rateLimit: 10
                }
            };

            // Create integration (backend will handle connection testing)
            const result = await apiService.createSMSIntegration(integrationData);

            if (result.success) {
                onConnect(result.data);
                onClose();
                // Reset form
                setFormData({});
                setSelectedProvider(SMS_PROVIDERS[0]);
            } else {
                throw new Error(result.message || 'Failed to create SMS integration');
            }
        } catch (error) {
            console.error('SMS connection error:', error);
            setError(error.message || 'Failed to connect SMS provider');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleClose = () => {
        if (!isConnecting) {
            setFormData({});
            setSelectedProvider(SMS_PROVIDERS[0]);
            setError(null);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Connect SMS Provider</h2>
                        <p className="text-slate-600 mt-1">Choose your SMS provider and enter your credentials</p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isConnecting}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Provider Selection */}
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Choose SMS Provider</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {SMS_PROVIDERS.map(provider => (
                            <button
                                key={provider.id}
                                onClick={() => setSelectedProvider(provider)}
                                className={`p-4 border-2 rounded-lg text-left transition-all ${
                                    selectedProvider.id === provider.id
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">{provider.logo}</span>
                                    <span className="font-semibold text-slate-800">{provider.name}</span>
                                </div>
                                <p className="text-sm text-slate-600">{provider.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Configuration Form */}
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        Configure {selectedProvider.name}
                    </h3>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-2">
                                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-red-800 font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {selectedProvider.fields.map(field => (
                            <div key={field.name}>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <input
                                    type={field.type}
                                    value={formData[field.name] || ''}
                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                    placeholder={field.placeholder}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    disabled={isConnecting}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Provider-specific information */}
                    <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-medium text-slate-800 mb-2">Where to find your credentials:</h4>
                        <div className="text-sm text-slate-600 space-y-1">
                            {selectedProvider.id === 'twilio' && (
                                <>
                                    <p>• Account SID and Auth Token are in your Twilio Console → Account Info</p>
                                    <p>• From Number should be a Twilio phone number you own</p>
                                </>
                            )}
                            {selectedProvider.id === 'msg91' && (
                                <>
                                    <p>• API Key is available in your MSG91 Dashboard → API Keys</p>
                                    <p>• Sender ID is your registered sender ID with MSG91</p>
                                </>
                            )}
                            {selectedProvider.id === 'textlocal' && (
                                <>
                                    <p>• API Key is available in your TextLocal Dashboard → Settings → API Keys</p>
                                    <p>• Sender ID is your registered sender name with TextLocal</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
                    <button
                        onClick={handleClose}
                        disabled={isConnecting}
                        className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConnect}
                        disabled={isConnecting}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 disabled:cursor-not-allowed"
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
                                Connect Provider
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SMSConnectModal;



