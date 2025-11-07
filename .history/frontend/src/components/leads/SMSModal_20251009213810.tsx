import React, { useState } from 'react';
import { Lead, SMSTemplate, User } from '../../types';
import Modal from '../ui/Modal';
import { AppIcons } from '../ui/Icons';
import { apiService } from '../../services/api';

interface SMSModalProps {
    lead: Lead;
    templates: SMSTemplate[];
    currentUser: User;
    onClose: () => void;
    onSend: (message: string) => void;
}

const SMSModal: React.FC<SMSModalProps> = ({ lead, templates, currentUser, onClose, onSend }) => {
    const [activeTab, setActiveTab] = useState<'template' | 'custom'>('template');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
    const [customMessage, setCustomMessage] = useState('');
    const [isUnicode, setIsUnicode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const getMessagePreview = () => {
        if (activeTab === 'custom') return customMessage;
        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template) return '';
        return template.body
            .replace(/{{name}}/g, lead.name)
            .replace(/{{user_name}}/g, currentUser.name)
            .replace(/{{course}}/g, lead.course || 'the course')
            .replace(/{{dealValue}}/g, lead.dealValue.toLocaleString());
    };

    const getCharacterCount = () => {
        const message = getMessagePreview();
        return isUnicode ? message.length : message.length;
    };

    const getMaxLength = () => {
        return isUnicode ? 70 : 160;
    };

    const isOverLimit = () => {
        return getCharacterCount() > getMaxLength();
    };

    const handleSend = async () => {
        const message = getMessagePreview();
        if (!message.trim()) {
            setError('Message cannot be empty.');
            return;
        }

        if (isOverLimit()) {
            setError(`Message too long. ${isUnicode ? 'Unicode' : 'GSM'} messages are limited to ${getMaxLength()} characters.`);
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // Prepare SMS data
            const smsData = {
                leadId: lead.id,
                to: lead.phone,
                message: message.trim(),
                isUnicode,
                sentBy: currentUser.id,
                timestamp: new Date().toISOString()
            };

            // Call real backend API (using notes API as placeholder)
            await apiService.createNote({
                leadId: lead.id,
                content: `SMS sent: "${message}"`,
                type: 'sms'
            });

            // Notify parent component
            onSend(message);

            onClose();
        } catch (error) {
            console.error('Failed to send SMS:', error);
            setError('Failed to send SMS. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Send SMS to ${lead.name}`}>
            <div className="flex border-b border-muted mb-4">
                <button onClick={() => setActiveTab('template')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'template' ? 'border-b-2 border-primary-500 text-on-surface' : 'text-subtle'}`}>Use Template</button>
                <button onClick={() => setActiveTab('custom')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'custom' ? 'border-b-2 border-primary-500 text-on-surface' : 'text-subtle'}`}>Custom Message</button>
            </div>

            {activeTab === 'template' ? (
                <div>
                    <label className="text-sm font-medium text-subtle">Select Template</label>
                    <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="w-full mt-1 bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500">
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
            ) : (
                <div>
                    <label className="text-sm font-medium text-subtle">Write a custom message</label>
                    <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)} rows={5} className="w-full mt-1 bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
            )}

            <div className="mt-4 p-4 bg-background rounded-lg border border-muted">
                <h4 className="text-sm font-semibold text-subtle mb-2">Message Preview:</h4>
                <p className="text-sm text-on-surface whitespace-pre-wrap">{getMessagePreview()}</p>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-muted">
                <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button type="button" onClick={handleSend} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                    <AppIcons.SMS className="h-5 w-5 mr-2" /> Send SMS
                </button>
            </div>
        </Modal>
    );
};

export default SMSModal;


