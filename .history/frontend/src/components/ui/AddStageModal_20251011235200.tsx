import React, { useState } from 'react';
import Modal from './Modal';

interface AddStageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, color: string) => void;
    isLoading?: boolean;
}

const AddStageModal: React.FC<AddStageModalProps> = ({ isOpen, onClose, onSave, isLoading = false }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#3b82f6');
    const [errors, setErrors] = useState<{ name?: string; color?: string }>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const newErrors: { name?: string; color?: string } = {};
        if (!name.trim()) {
            newErrors.name = 'Stage name is required';
        }
        if (!color) {
            newErrors.color = 'Stage color is required';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            // Pass the current values to parent BEFORE resetting state
            onSave(name.trim(), color);
            // Reset state AFTER the parent processes the submission
            setTimeout(() => {
                setName('');
                setColor('#3b82f6');
                setErrors({});
                onClose();
            }, 100);
        }
    };

    const handleClose = () => {
        // Only reset state when explicitly cancelled, not on successful submission
        setName('');
        setColor('#3b82f6');
        setErrors({});
        onClose();
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Add New Stage">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="stageName" className="block text-sm font-medium text-on-surface mb-2">
                        Stage Name *
                    </label>
                    <input
                        id="stageName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter stage name (e.g., New Lead, Qualified, Proposal Sent)"
                        className={`w-full px-3 py-2 bg-background border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            errors.name ? 'border-red-500' : 'border-muted'
                        }`}
                        disabled={isLoading}
                    />
                    {errors.name && (
                        <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="stageColor" className="block text-sm font-medium text-on-surface mb-2">
                        Stage Color *
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            id="stageColor"
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-12 h-10 p-1 border border-muted rounded-lg bg-transparent cursor-pointer disabled:opacity-50"
                            disabled={isLoading}
                        />
                        <input
                            type="text"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            placeholder="#3b82f6"
                            className={`flex-1 px-3 py-2 bg-background border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                errors.color ? 'border-red-500' : 'border-muted'
                            }`}
                            disabled={isLoading}
                        />
                    </div>
                    {errors.color && (
                        <p className="mt-1 text-sm text-red-500">{errors.color}</p>
                    )}
                    <p className="mt-1 text-xs text-subtle">
                        Choose a color that represents this stage in your pipeline
                    </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-muted">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-subtle bg-background border border-muted rounded-lg hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={isLoading}
                    >
                        {isLoading && (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {isLoading ? 'Adding Stage...' : 'Add Stage'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddStageModal;


