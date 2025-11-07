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
    const [scheduledAt, setScheduledAt] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        return tomorrow.toISOString().slice(0, 16);
    });

    const handleSchedule = () => {
        if (!content.trim() || !scheduledAt) {
            alert('Message and schedule time are required.');
            return;
        }

        onSchedule({
            leadId: lead.id,
            type,
            content,
            scheduledAt: new Date(scheduledAt).toISOString(),
            status: 'PENDING',
        });
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Schedule ${type} for ${lead.name}`}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-subtle">Schedule for</label>
                    <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={e => setScheduledAt(e.target.value)}
                        className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-subtle">Message</label>
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={8}
                        className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3"
                        placeholder={`Write your ${type.toLowerCase()} message here...`}
                    />
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-muted">
                <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button type="button" onClick={handleSchedule} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                    Schedule Message
                </button>
            </div>
        </Modal>
    );
};

export default ScheduleMessageModal;


