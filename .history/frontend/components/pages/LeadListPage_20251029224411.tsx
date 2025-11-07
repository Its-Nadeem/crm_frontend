import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Lead, User, Stage, Task, CustomFieldDefinition, FilterCondition, FilterOperator, Permission, SavedFilter, WhatsAppTemplate, UserRole, LeadSource, ScheduledMessage, SMSTemplate } from '../../types';
import AssignUserModal from '../leads/AssignUserModal';
import { AppIcons } from '../ui/Icons';
import { LEAD_SOURCES } from '../../constants';
import ImportLeadsModal from '../leads/ImportLeadsModal';
import Modal from '../ui/Modal';
import { Link } from 'react-router-dom';
import FilterBuilder from '../ui/FilterBuilder';
import { apiService } from '../../src/services/api';
import LeadDetailModal from '../leads/LeadDetailModal';

// Save Filter Modal Component
const SaveFilterModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [filterName, setFilterName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (filterName.trim()) {
            onSave(filterName.trim());
            setFilterName('');
            onClose();
        }
    };

    const handleClose = () => {
        setFilterName('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Save Filter View">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-subtle mb-2">
                        Filter View Name
                    </label>
                    <input
                        type="text"
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        placeholder="Enter a name for this filter view"
                        className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                        autoFocus
                        required
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-muted">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg"
                    >
                        Save Filter View
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default LeadListPage;
