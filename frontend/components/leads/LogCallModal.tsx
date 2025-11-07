import React, { useState } from 'react';
import Modal from '../ui/Modal';

interface LogCallModalProps {
    onClose: () => void;
    onLog: (outcome: string, notes: string) => void;
}

const CALL_OUTCOMES = ["Connected", "No Answer", "Left Voicemail", "Wrong Number", "Call Back Later"];

const LogCallModal: React.FC<LogCallModalProps> = ({ onClose, onLog }) => {
    const [outcome, setOutcome] = useState(CALL_OUTCOMES[0]);
    const [notes, setNotes] = useState('');

    const handleLog = () => {
        if (!notes.trim()) {
            alert('Please enter some notes for the call.');
            return;
        }
        onLog(outcome, notes);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Log a Call">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-subtle">Call Outcome</label>
                    <select
                        value={outcome}
                        onChange={e => setOutcome(e.target.value)}
                        className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3"
                    >
                        {CALL_OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-subtle">Notes</label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={5}
                        className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3"
                        placeholder="e.g., Discussed pricing, customer is interested in the pro plan..."
                    />
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-muted">
                <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button type="button" onClick={handleLog} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">
                    Log Call
                </button>
            </div>
        </Modal>
    );
};

export default LogCallModal;



