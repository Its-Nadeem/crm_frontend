import React, { useState, useEffect } from 'react';
import { apiService } from '../../src/services/api';

interface SMSCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    organizationId: string;
    phoneLists: any[];
}

interface SMSCampaign {
    name: string;
    message: string;
    phoneListId: string;
    scheduledDate?: string;
    senderId?: string;
}

export const SMSCampaignModal: React.FC<SMSCampaignModalProps> = ({
    isOpen,
    onClose,
    organizationId,
    phoneLists
}) => {
    const [campaign, setCampaign] = useState<SMSCampaign>({
        name: '',
        message: '',
        phoneListId: '',
        scheduledDate: '',
        senderId: ''
    });
    const [isSending, setIsSending] = useState(false);
    const [isScheduled, setIsScheduled] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleInputChange = (field: keyof SMSCampaign, value: string) => {
        setCampaign(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSendCampaign = async () => {
        if (!campaign.name || !campaign.message || !campaign.phoneListId) {
            setError('Please fill in all required fields');
            return;
        }

        setIsSending(true);
        setError(null);
        setSuccess(null);

        try {
            const campaignData = {
                organizationId,
                name: campaign.name,
                message: campaign.message,
                listId: campaign.phoneListId,
                senderId: campaign.senderId || undefined,
                scheduledDate: isScheduled && campaign.scheduledDate ? campaign.scheduledDate : undefined
            };

            const result = await apiService.sendBulkSMS(campaignData);

            if (result.success) {
                setSuccess(`SMS campaign "${campaign.name}" ${isScheduled ? 'scheduled' : 'sent'} successfully!`);
                // Reset form after successful send
                setTimeout(() => {
                    setCampaign({
                        name: '',
                        message: '',
                        phoneListId: '',
                        scheduledDate: '',
                        senderId: ''
                    });
                    setIsScheduled(false);
                    onClose();
                }, 2000);
            } else {
                throw new Error(result.message || 'Failed to send SMS campaign');
            }
        } catch (error) {
            console.error('SMS campaign error:', error);
            setError(error.message || 'Failed to send SMS campaign');
        } finally {
            setIsSending(false);
        }
    };

    const handleClose = () => {
        if (!isSending) {
            setCampaign({
                name: '',
                message: '',
                phoneListId: '',
                scheduledDate: '',
                senderId: ''
            });
            setIsScheduled(false);
            setError(null);
            setSuccess(null);
            onClose();
        }
    };

    const selectedPhoneList = phoneLists.find(list => list.id === campaign.phoneListId);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Create SMS Campaign</h2>
                        <p className="text-slate-600 mt-1">Send SMS messages to your subscribers</p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSending}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Campaign Form */}
                <div className="p-6 space-y-6">
                    {/* Campaign Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Campaign Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={campaign.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="e.g., Welcome Message Campaign"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isSending}
                        />
                    </div>

                    {/* Phone List Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Phone List <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={campaign.phoneListId}
                            onChange={(e) => handleInputChange('phoneListId', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isSending}
                        >
                            <option value="">Select a phone list</option>
                            {phoneLists.map(list => (
                                <option key={list.id} value={list.id}>
                                    {list.name} ({list.totalContacts || 0} contacts)
                                </option>
                            ))}
                        </select>
                        {selectedPhoneList && (
                            <p className="text-sm text-slate-600 mt-1">
                                {selectedPhoneList.totalContacts || 0} subscribers will receive this message
                            </p>
                        )}
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Message <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={campaign.message}
                            onChange={(e) => handleInputChange('message', e.target.value)}
                            placeholder="Enter your SMS message (160 characters max for single SMS)"
                            rows={4}
                            maxLength={160}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isSending}
                        />
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-sm text-slate-600">
                                Use {`{{name}}`} for personalization
                            </p>
                            <p className={`text-sm ${campaign.message.length > 160 ? 'text-red-600' : 'text-slate-600'}`}>
                                {campaign.message.length}/160
                            </p>
                        </div>
                    </div>

                    {/* Sender ID */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Sender ID (Optional)
                        </label>
                        <input
                            type="text"
                            value={campaign.senderId}
                            onChange={(e) => handleInputChange('senderId', e.target.value)}
                            placeholder="e.g., YOURBRAND"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isSending}
                        />
                        <p className="text-sm text-slate-600 mt-1">
                            Leave empty to use default sender ID
                        </p>
                    </div>

                    {/* Schedule Option */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="scheduleCampaign"
                                checked={isScheduled}
                                onChange={(e) => setIsScheduled(e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                disabled={isSending}
                            />
                            <label htmlFor="scheduleCampaign" className="text-sm font-medium text-slate-700">
                                Schedule for later
                            </label>
                        </div>

                        {isScheduled && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Schedule Date & Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={campaign.scheduledDate}
                                    onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    disabled={isSending}
                                />
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-red-800 font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <p className="text-green-800 font-medium">{success}</p>
                            </div>
                        </div>
                    )}

                    {/* Campaign Preview */}
                    {campaign.name && campaign.message && campaign.phoneListId && (
                        <div className="bg-slate-50 rounded-lg p-4">
                            <h4 className="font-medium text-slate-800 mb-2">Campaign Preview</h4>
                            <div className="space-y-2 text-sm">
                                <p><strong>Name:</strong> {campaign.name}</p>
                                <p><strong>Recipients:</strong> {selectedPhoneList?.name} ({selectedPhoneList?.totalContacts || 0} contacts)</p>
                                <p><strong>Message:</strong></p>
                                <div className="bg-white p-3 rounded border text-slate-700 font-mono">
                                    {campaign.message}
                                </div>
                                {isScheduled && campaign.scheduledDate && (
                                    <p><strong>Scheduled:</strong> {new Date(campaign.scheduledDate).toLocaleString()}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
                    <button
                        onClick={handleClose}
                        disabled={isSending}
                        className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSendCampaign}
                        disabled={isSending || !campaign.name || !campaign.message || !campaign.phoneListId}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 disabled:cursor-not-allowed"
                    >
                        {isSending ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                {isScheduled ? 'Scheduling...' : 'Sending...'}
                            </>
                        ) : (
                            <>
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                {isScheduled ? 'Schedule Campaign' : 'Send Campaign'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SMSCampaignModal;


