import React, { useState } from 'react';
import { User } from '../../types';
import Modal from '../ui/Modal';

interface AssignUserModalProps {
    users: User[];
    onClose: () => void;
    onAssign: (userId: number) => void;
}

const AssignUserModal: React.FC<AssignUserModalProps> = ({ users, onClose, onAssign }) => {
    const [selectedUserId, setSelectedUserId] = useState<number | undefined>(users[0]?.id);

    const handleAssign = () => {
        if (selectedUserId) {
            onAssign(selectedUserId);
        } else {
            alert('Please select a user to assign the leads to.');
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Assign Leads to a User">
            <div className="space-y-4">
                <p className="text-subtle text-sm">
                    Select a user from the dropdown below. All selected leads will be reassigned to this user, and this action will be recorded in each lead's timeline.
                </p>
                <div>
                    <label htmlFor="user-select" className="block text-sm font-medium text-subtle mb-1">
                        Assign to
                    </label>
                    <select
                        id="user-select"
                        value={selectedUserId}
                        onChange={e => setSelectedUserId(Number(e.target.value))}
                        className="w-full mt-1 bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="" disabled>Select a user</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.name} ({user.role})
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-muted">
                <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">
                    Cancel
                </button>
                <button type="button" onClick={handleAssign} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">
                    Assign Leads
                </button>
            </div>
        </Modal>
    );
};

export default AssignUserModal;



