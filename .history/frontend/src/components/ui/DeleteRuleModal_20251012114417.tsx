import React from 'react';
import { AppIcons } from './Icons';

interface DeleteRuleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    ruleDescription: string;
    isLoading?: boolean;
}

const DeleteRuleModal: React.FC<DeleteRuleModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    ruleDescription,
    isLoading = false
}) => {
    if (!isOpen) return null;

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    const handleConfirm = () => {
        console.log('DeleteRuleModal: Confirm button clicked');
        if (!isLoading) {
            onConfirm();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-muted">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <AppIcons.Delete className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-on-surface">Delete Scoring Rule</h3>
                            <p className="text-sm text-subtle">This action cannot be undone</p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <p className="text-on-surface mb-6">
                        Are you sure you want to delete this scoring rule?
                    </p>

                    <div className="bg-muted/50 rounded-lg p-4 mb-6">
                        <p className="text-sm text-on-surface font-medium">Rule:</p>
                        <p className="text-sm text-subtle mt-1">{ruleDescription}</p>
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={handleClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-muted hover:bg-subtle/20 text-on-surface rounded-lg font-medium disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <AppIcons.Delete className="w-4 h-4 mr-2" />
                                    Delete Rule
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteRuleModal;


