import React, { useState } from 'react';
import Modal from '../ui/Modal';

interface LogCallModalProps {
    onClose: () => void;
    onLog: (outcome: string, notes: string) => void;
}

const CALL_OUTCOMES = [
    'Connected - Interested',
    'Connected - Not Interested',
    'Connected - Call Back Later',
    'No Answer',
    'Wrong Number',
    'Busy',
    'Voicemail'
];

const LogCallModal: React.FC<LogCallModalProps> = ({ onClose, onLog }) => {
    const [outcome, setOutcome] = useState(CALL_OUTCOMES[0]);
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!outcome.trim() || !notes.trim()) return;

        onLog(outcome, notes);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Log a Call">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-subtle mb-1">Call Outcome</label>
                    <select
                        value={outcome}
                        onChange={e => setOutcome(e.target.value)}
                        className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                    >
                        {CALL_OUTCOMES.map(outcome => (
                            <option key={outcome} value={outcome}>{outcome}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-subtle mb-1">Notes</label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={4}
                        className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter call notes..."
                        required
                    />
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-muted">
                    <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                        Log Call
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default LogCallModal;


