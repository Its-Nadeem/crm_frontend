import React from 'react';
import Modal from './Modal';
import { AppIcons } from './Icons';

interface DeleteTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    teamName: string;
    isLoading?: boolean;
    memberCount?: number;
    leadCount?: number;
}

const DeleteTeamModal: React.FC<DeleteTeamModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    teamName,
    isLoading = false,
    memberCount = 0,
    leadCount = 0
}) => {
    const handleConfirm = () => {
        onConfirm();
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !isLoading) {
            handleClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Delete Team">
            <div className="space-y-6">
                {/* Warning Icon and Message */}
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <AppIcons.XCircle className="w-5 h-5 text-red-600" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-medium text-on-surface mb-2">
                            Are you sure you want to delete this team?
                        </h3>
                        <p className="text-subtle">
                            This action cannot be undone. All team members will need to be reassigned to other teams.
                        </p>
                    </div>
                </div>

                {/* Team Preview */}
                <div className="bg-background rounded-lg p-4 border border-muted">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-primary-500 flex-shrink-0"></div>
                        <span className="font-medium text-on-surface">{teamName}</span>
                        <div className="flex gap-2">
                            {memberCount > 0 && (
                                <span className="text-sm text-subtle bg-muted px-2 py-1 rounded-full">
                                    {memberCount} member{memberCount !== 1 ? 's' : ''}
                                </span>
                            )}
                            {leadCount > 0 && (
                                <span className="text-sm text-subtle bg-muted px-2 py-1 rounded-full">
                                    {leadCount} lead{leadCount !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Impact Warning */}
                {(memberCount > 0 || leadCount > 0) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AppIcons.XCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-medium text-amber-800 mb-1">
                                    Impact Warning
                                </h4>
                                <p className="text-sm text-amber-700">
                                    This team has {memberCount > 0 && `${memberCount} member${memberCount !== 1 ? 's' : ''}`}
                                    {memberCount > 0 && leadCount > 0 && ' and '}
                                    {leadCount > 0 && `${leadCount} lead${leadCount !== 1 ? 's' : ''}`}
                                    {memberCount > 0 || leadCount > 0 ? '. ' : ''}
                                    Deleting it will require you to reassign these members and leads to other teams.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-muted">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-subtle bg-background border border-muted rounded-lg hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={isLoading}
                    >
                        {isLoading && (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {isLoading ? 'Deleting...' : 'Delete Team'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteTeamModal;


