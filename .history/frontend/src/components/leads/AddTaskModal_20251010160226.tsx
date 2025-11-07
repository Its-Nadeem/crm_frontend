import React, { useState } from 'react';
import { User } from '../../types';
import { AppIcons } from '../ui/Icons';
import Modal from '../ui/Modal';

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (taskData: {
        title: string;
        leadId: string;
        assignedToId: number;
        dueDate: string;
        description?: string;
        priority?: 'low' | 'medium' | 'high';
    }) => void;
    leadId: string;
    currentUser: User;
    users: User[];
    isLoading?: boolean;
    onSaveComplete?: () => void; // Callback when save is completed
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onOptimisticUpdate,
    leadId,
    currentUser,
    users,
    isLoading = false,
    onSaveComplete
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedToId, setAssignedToId] = useState(currentUser.id);
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [dueDate, setDueDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const handleTitleChange = (value: string) => {
        setTitle(value);
        setHasUnsavedChanges(value.trim() !== '');
    };

    const handleAddToTimeline = () => {
        if (!title.trim()) return;

        // Create optimistic activity for immediate timeline update
        const taskContent = `Task created: "${title.trim()}"${description.trim() ? ` - ${description.trim()}` : ''} (Due: ${new Date(dueDate).toLocaleDateString()})`;
        const optimisticActivity: Activity = {
            id: `temp-${Date.now()}`, // Temporary ID
            type: 'TASK_CREATED',
            content: taskContent,
            timestamp: new Date().toISOString(),
            authorId: currentUser.id
        };

        // Add to timeline immediately
        onOptimisticUpdate?.(optimisticActivity);
        setHasUnsavedChanges(false);

        // Close modal without saving to backend
        setTitle('');
        setDescription('');
        setAssignedToId(currentUser.id);
        setPriority('medium');
        setDueDate(() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.toISOString().split('T')[0];
        });
        onClose();
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || isLoading) return;

        onSave({
            title: title.trim(),
            leadId,
            assignedToId,
            dueDate: new Date(dueDate).toISOString(),
            description: description.trim() || undefined,
            priority,
        });

        // Call save complete callback to stop auto-refresh
        onSaveComplete?.();

        // Reset form and close modal
        setTitle('');
        setDescription('');
        setAssignedToId(currentUser.id);
        setPriority('medium');
        setDueDate(() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.toISOString().split('T')[0];
        });
        setHasUnsavedChanges(false);
        onClose();
    };

    const handleClose = () => {
        if (hasUnsavedChanges) {
            // Ask for confirmation if there are unsaved changes
            if (window.confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
                setTitle('');
                setDescription('');
                setAssignedToId(currentUser.id);
                setPriority('medium');
                setDueDate(() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    return tomorrow.toISOString().split('T')[0];
                });
                setHasUnsavedChanges(false);
                onClose();
            }
        } else {
            setTitle('');
            setDescription('');
            setAssignedToId(currentUser.id);
            setPriority('medium');
            setDueDate(() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                return tomorrow.toISOString().split('T')[0];
            });
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Create Task">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">
                        Task Title *
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="What needs to be done?"
                        className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                        disabled={isLoading}
                        autoFocus
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add more details about this task..."
                        rows={3}
                        className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        disabled={isLoading}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-2">
                            Assign To
                        </label>
                        <select
                            value={assignedToId}
                            onChange={(e) => setAssignedToId(Number(e.target.value))}
                            className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                            disabled={isLoading}
                        >
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-2">
                            Priority
                        </label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                            className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                            disabled={isLoading}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">
                        Due Date
                    </label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                        disabled={isLoading}
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>

                <div className="flex justify-between gap-3 pt-4 border-t border-muted">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="bg-muted hover:bg-subtle/80 text-on-surface font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleAddToTimeline}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50"
                            disabled={!title.trim()}
                        >
                            <AppIcons.Tasks className="h-4 w-4" />
                            Add to Timeline
                        </button>

                        <button
                            type="button"
                            onClick={handleSave}
                            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50"
                            disabled={!title.trim() || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <AppIcons.Tasks className="h-4 w-4" />
                                    Create Task
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};


