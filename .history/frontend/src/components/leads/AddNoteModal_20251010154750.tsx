import React, { useState } from 'react';
import { User, Activity } from '../../types';
import { AppIcons } from '../ui/Icons';
import Modal from '../ui/Modal';

interface AddNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (noteData: { content: string; leadId: string }) => void;
    onOptimisticUpdate?: (activity: Activity) => void;
    leadId: string;
    currentUser: User;
    isLoading?: boolean;
    onSaveComplete?: () => void; // Callback when save is completed
}

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onOptimisticUpdate,
    leadId,
    currentUser,
    isLoading = false,
    onSaveComplete
}) => {
    const [content, setContent] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const handleContentChange = (value: string) => {
        setContent(value);
        setHasUnsavedChanges(value.trim() !== '');
    };

    const handleAddToTimeline = () => {
        if (!content.trim()) return;

        // Create optimistic activity for immediate timeline update
        const optimisticActivity: Activity = {
            id: `temp-${Date.now()}`, // Temporary ID
            type: 'NOTE',
            content: content.trim(),
            timestamp: new Date().toISOString(),
            authorId: currentUser.id
        };

        // Add to timeline immediately
        onOptimisticUpdate?.(optimisticActivity);
        setHasUnsavedChanges(false);

        // Close modal without saving to backend
        setContent('');
        setIsPinned(false);
        onClose();
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isLoading) return;

        onSave({
            content: content.trim(),
            leadId,
        });

        // Call save complete callback to stop auto-refresh
        onSaveComplete?.();

        // Reset form and close modal
        setContent('');
        setIsPinned(false);
        setHasUnsavedChanges(false);
        onClose();
    };

    const handleClose = () => {
        if (hasUnsavedChanges) {
            // Ask for confirmation if there are unsaved changes
            if (window.confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
                setContent('');
                setIsPinned(false);
                setHasUnsavedChanges(false);
                onClose();
            }
        } else {
            setContent('');
            setIsPinned(false);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Add Note">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">
                        Note Content
                    </label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Add a note about this lead..."
                        rows={4}
                        className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        disabled={isLoading}
                        autoFocus
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="pin-note"
                        checked={isPinned}
                        onChange={(e) => setIsPinned(e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-muted rounded"
                        disabled={isLoading}
                    />
                    <label htmlFor="pin-note" className="text-sm text-on-surface">
                        Pin this note (show at top of timeline)
                    </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-muted">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="bg-muted hover:bg-subtle/80 text-on-surface font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50"
                        disabled={!content.trim() || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <AppIcons.Note className="h-4 w-4" />
                                Save Note
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};


