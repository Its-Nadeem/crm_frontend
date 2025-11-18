import React, { useState } from 'react';
import { apiService } from '../../src/services/api';

interface CreatePhoneListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onListCreated: () => void;
    organizationId: string;
}

export const CreatePhoneListModal: React.FC<CreatePhoneListModalProps> = ({
    isOpen,
    onClose,
    onListCreated,
    organizationId
}) => {
    const [listName, setListName] = useState('');
    const [listDescription, setListDescription] = useState('');
    const [country, setCountry] = useState('US');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateList = async () => {
        if (!listName.trim()) {
            setError('Please enter a list name');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const listData = {
                organizationId,
                name: listName.trim(),
                description: listDescription.trim(),
                country
            };

            const result = await apiService.createSMSPhoneList(listData);

            if (result.success) {
                // Reset form
                setListName('');
                setListDescription('');
                setCountry('US');
                onListCreated();
                onClose();
            } else {
                throw new Error(result.message || 'Failed to create phone list');
            }
        } catch (error) {
            console.error('Phone list creation error:', error);
            setError(error.message || 'Failed to create phone list');
        } finally {
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        if (!isCreating) {
            setListName('');
            setListDescription('');
            setCountry('US');
            setError(null);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Create Phone List</h2>
                        <p className="text-slate-600 mt-1">Create a new SMS subscriber list</p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isCreating}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4">
                    {/* List Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            List Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={listName}
                            onChange={(e) => setListName(e.target.value)}
                            placeholder="e.g., VIP Customers"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isCreating}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            value={listDescription}
                            onChange={(e) => setListDescription(e.target.value)}
                            placeholder="Brief description of this list"
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isCreating}
                        />
                    </div>

                    {/* Country */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Country
                        </label>
                        <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isCreating}
                        >
                            <option value="US">United States</option>
                            <option value="IN">India</option>
                            <option value="UK">United Kingdom</option>
                            <option value="CA">Canada</option>
                            <option value="AU">Australia</option>
                            <option value="DE">Germany</option>
                            <option value="FR">France</option>
                            <option value="JP">Japan</option>
                            <option value="BR">Brazil</option>
                            <option value="MX">Mexico</option>
                        </select>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-red-800 font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    {listName && (
                        <div className="bg-slate-50 rounded-lg p-4">
                            <h4 className="font-medium text-slate-800 mb-2">List Preview</h4>
                            <div className="text-sm space-y-1">
                                <p><strong>Name:</strong> {listName}</p>
                                {listDescription && <p><strong>Description:</strong> {listDescription}</p>}
                                <p><strong>Country:</strong> {country}</p>
                                <p><strong>Initial Contacts:</strong> 0</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
                    <button
                        onClick={handleClose}
                        disabled={isCreating}
                        className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreateList}
                        disabled={isCreating || !listName.trim()}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 disabled:cursor-not-allowed"
                    >
                        {isCreating ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Creating...
                            </>
                        ) : (
                            <>
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Create List
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreatePhoneListModal;


