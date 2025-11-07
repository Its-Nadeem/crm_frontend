import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { AppIcons } from '../ui/Icons';
import { apiService } from '../../services/api';

interface LogCallModalProps {
    leadId: string;
    leadPhone?: string;
    currentUser: any;
    onClose: () => void;
    onCallLogged: (callData: any) => void;
}

const CALL_TYPES = [
    { value: 'inbound', label: 'Inbound Call', icon: '📞' },
    { value: 'outbound', label: 'Outbound Call', icon: '📞' }
];

const CALL_OUTCOMES = [
    { value: 'connected_interested', label: 'Connected - Interested', category: 'positive' },
    { value: 'connected_not_interested', label: 'Connected - Not Interested', category: 'negative' },
    { value: 'connected_callback', label: 'Connected - Call Back Later', category: 'neutral' },
    { value: 'no_answer', label: 'No Answer', category: 'neutral' },
    { value: 'wrong_number', label: 'Wrong Number', category: 'negative' },
    { value: 'busy', label: 'Busy', category: 'neutral' },
    { value: 'voicemail', label: 'Voicemail', category: 'neutral' }
];

const LogCallModal: React.FC<LogCallModalProps> = ({
    leadId,
    leadPhone,
    currentUser,
    onClose,
    onCallLogged
}) => {
    const [callType, setCallType] = useState<'inbound' | 'outbound'>('outbound');
    const [outcome, setOutcome] = useState('connected_interested');
    const [duration, setDuration] = useState<number>(0);
    const [notes, setNotes] = useState('');
    const [nextFollowUp, setNextFollowUp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!outcome || !notes.trim()) {
            setError('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // Prepare call data
            const callData = {
                leadId,
                callType,
                outcome,
                duration: duration > 0 ? duration : undefined,
                notes: notes.trim(),
                nextFollowUp: nextFollowUp || undefined,
                loggedBy: currentUser.id,
                timestamp: new Date().toISOString()
            };

            // Call real backend API
            const response = await apiService.logCall(callData);

            // Notify parent component
            onCallLogged({
                ...callData,
                id: response.id,
                status: 'completed'
            });

            onClose();
        } catch (error) {
            console.error('Failed to log call:', error);
            setError('Failed to log call. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDuration = (seconds: number) => {
        if (seconds === 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 0;
        setDuration(Math.max(0, value));
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Log a Call">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Call Type */}
                <div>
                    <label className="block text-sm font-medium text-subtle mb-3">Call Type</label>
                    <div className="grid grid-cols-2 gap-3">
                        {CALL_TYPES.map(type => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setCallType(type.value as 'inbound' | 'outbound')}
                                className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                                    callType === type.value
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                        : 'border-muted hover:border-primary-300 hover:bg-muted/50'
                                }`}
                            >
                                <span className="text-lg">{type.icon}</span>
                                <span className="text-sm font-medium">{type.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Call Outcome */}
                <div>
                    <label className="block text-sm font-medium text-subtle mb-3">Call Outcome *</label>
                    <select
                        value={outcome}
                        onChange={e => setOutcome(e.target.value)}
                        className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                    >
                        {CALL_OUTCOMES.map(outcomeOption => (
                            <option key={outcomeOption.value} value={outcomeOption.value}>
                                {outcomeOption.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Duration */}
                <div>
                    <label className="block text-sm font-medium text-subtle mb-1">
                        Duration (seconds)
                    </label>
                    <input
                        type="number"
                        value={duration}
                        onChange={handleDurationChange}
                        min="0"
                        placeholder="e.g., 120"
                        className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {duration > 0 && (
                        <p className="text-xs text-subtle mt-1">
                            Formatted: {formatDuration(duration)}
                        </p>
                    )}
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-subtle mb-1">
                        Call Notes *
                    </label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={4}
                        className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter detailed call notes..."
                        required
                    />
                </div>

                {/* Next Follow-up */}
                <div>
                    <label className="block text-sm font-medium text-subtle mb-1">
                        Next Follow-up (Optional)
                    </label>
                    <input
                        type="datetime-local"
                        value={nextFollowUp}
                        onChange={e => setNextFollowUp(e.target.value)}
                        className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
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
                                Logging...
                            </>
                        ) : (
                            <>
                                <AppIcons.Call className="h-4 w-4" />
                                Log Call
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default LogCallModal;


