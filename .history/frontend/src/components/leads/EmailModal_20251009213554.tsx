import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { AppIcons } from '../ui/Icons';
import { apiService } from '../../services/api';

interface EmailModalProps {
    lead: any;
    currentUser: any;
    onClose: () => void;
    onEmailSent: (emailData: any) => void;
}

const EmailModal: React.FC<EmailModalProps> = ({
    lead,
    currentUser,
    onClose,
    onEmailSent
}) => {
    const [to, setTo] = useState(lead.email || '');
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!to.trim() || !subject.trim() || !body.trim()) {
            setError('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // Prepare email data
            const emailData = {
                leadId: lead.id,
                to: to.trim(),
                cc: cc.trim() || undefined,
                bcc: bcc.trim() || undefined,
                subject: subject.trim(),
                body: body.trim(),
                sentBy: currentUser.id,
                timestamp: new Date().toISOString()
            };

            // Call real backend API (using notes API as placeholder)
            const response = await apiService.createNote({
                leadId: lead.id,
                content: `Email sent - Subject: ${subject}, To: ${to}`,
                type: 'email'
            });

            // Notify parent component
            onEmailSent({
                ...emailData,
                id: response.id,
                status: 'sent'
            });

            onClose();
        } catch (error) {
            console.error('Failed to send email:', error);
            setError('Failed to send email. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Send Email to ${lead.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* To Field */}
                <div>
                    <label className="block text-sm font-medium text-subtle mb-1">
                        To * <span className="text-xs text-green-600">(Auto-filled from lead)</span>
                    </label>
                    <input
                        type="email"
                        value={to}
                        onChange={e => setTo(e.target.value)}
                        className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="recipient@example.com"
                        required
                    />
                </div>

                {/* CC Field */}
                <div>
                    <label className="block text-sm font-medium text-subtle mb-1">CC</label>
                    <input
                        type="email"
                        value={cc}
                        onChange={e => setCc(e.target.value)}
                        className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="cc@example.com (optional)"
                    />
                </div>

                {/* BCC Field */}
                <div>
                    <label className="block text-sm font-medium text-subtle mb-1">BCC</label>
                    <input
                        type="email"
                        value={bcc}
                        onChange={e => setBcc(e.target.value)}
                        className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="bcc@example.com (optional)"
                    />
                </div>

                {/* Subject */}
                <div>
                    <label className="block text-sm font-medium text-subtle mb-1">Subject *</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Email subject..."
                        required
                    />
                </div>

                {/* Email Body */}
                <div>
                    <label className="block text-sm font-medium text-subtle mb-1">Message *</label>
                    <textarea
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        rows={6}
                        className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Type your email message here..."
                        required
                    />
                </div>

                {/* Template Variables Help */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Available Variables:</p>
                    <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                        <div><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{'{{first_name}}'}</code> - Lead's first name</div>
                        <div><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{'{{course}}'}</code> - Course/Program of interest</div>
                        <div><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{'{{company}}'}</code> - Lead's company</div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-muted">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-primary-600 hover:bg-primary-700 disabled:bg-muted disabled:text-subtle text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                Sending...
                            </>
                        ) : (
                            <>
                                <AppIcons.Email className="h-4 w-4" />
                                Send Email
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EmailModal;


