import React, { useState } from 'react';
import { Lead, ScheduledMessage, User } from '../../types';
import Modal from '../ui/Modal';
import { AppIcons } from '../ui/Icons';

interface ScheduleMessageModalProps {
    lead: Lead;
    currentUser: User;
    type: 'EMAIL' | 'WHATSAPP' | 'SMS';
    onClose: () => void;
    onSchedule: (message: Omit<ScheduledMessage, 'id' | 'organizationId'>) => void;
}

const ScheduleMessageModal: React.FC<ScheduleMessageModalProps> = ({ lead, currentUser, type, onClose, onSchedule }) => {
    const [content, setContent] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !scheduledAt) return;

        const message: Omit<ScheduledMessage, 'id' | 'organizationId'> = {
            leadId: lead.id,
            type,
            content,
            scheduledAt,
            createdById: currentUser.id,
        };
        onSchedule(message);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Schedule ${type} for ${lead.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-subtle mb-1">Message Content</label>
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={4}
                        className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter your message..."
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-subtle mb-1">Schedule Date & Time</label>
                    <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={e => setScheduledAt(e.target.value)}
                        className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                    />
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-muted">
                    <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                        <AppIcons.Activity className="h-5 w-5 mr-2" /> Schedule Message
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ScheduleMessageModal;


