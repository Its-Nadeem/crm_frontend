import React, { useState, useEffect } from 'react';
import { useCustomFields } from '../../hooks/useCustomFields';
import { useToast } from './Toast';

interface CustomField {
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'dropdown';
    options?: string[];
    isMappable: boolean;
    isRequired: boolean;
    organizationId: string;
    _id?: string;
}

interface CustomFieldManagerProps {
    organizationId: string;
    onFieldsChange: (fields: CustomField[]) => void;
}

export const CustomFieldManager: React.FC<CustomFieldManagerProps> = ({
    organizationId,
    onFieldsChange
}) => {
    const { fields, loading, error, createField, updateField, deleteField } = useCustomFields(organizationId);
    const [showModal, setShowModal] = useState(false);
    const [editingField, setEditingField] = useState<CustomField | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'text' as CustomField['type'],
        options: '',
        isMappable: true, // Default to true for new fields
        isRequired: false
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const { addToast } = useToast();

    useEffect(() => {
        onFieldsChange(fields);
    }, [fields, onFieldsChange]);

    const showToast = (message: string, type: 'success' | 'error') => {
        addToast({
            type,
            title: message,
            duration: 3000
        });
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'text',
            options: '',
            isMappable: true,
            isRequired: false
        });
        setEditingField(null);
        setShowModal(false);
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (field: CustomField) => {
        setEditingField(field);
        setFormData({
            name: field.name,
            type: field.type,
            options: field.options?.join(', ') || '',
            isMappable: field.isMappable,
            isRequired: field.isRequired
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const fieldData = {
                ...formData,
                organizationId,
                options: formData.type === 'dropdown' && formData.options ?
                    formData.options.split(',').map(opt => opt.trim()).filter(opt => opt) : undefined
            };

            if (editingField) {
                await updateField(editingField._id!, fieldData);
                showToast('Custom field updated successfully', 'success');
            } else {
                await createField(fieldData);
                showToast('Custom field created successfully', 'success');
            }

            resetForm();
        } catch (error) {
            console.error('Error saving custom field:', error);
            showToast('Failed to save custom field', 'error');
        }
    };

    const handleDelete = async (fieldId: string) => {
        try {
            await deleteField(fieldId);
            showToast('Custom field deleted successfully', 'success');
            setShowDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting custom field:', error);
            showToast('Failed to delete custom field', 'error');
        }
    };

    const mappableFields = fields.filter(field => field.isMappable);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-on-surface">Custom Fields</h2>
                    <p className="text-sm text-subtle">
                        Manage custom fields for your organization. Fields will be available in lead imports and integrations.
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                >
                    Add Field
                </button>
            </div>

            {/* Mappable Fields Summary */}
            <div className="bg-surface rounded-lg p-4 border border-muted">
                <h3 className="font-medium text-on-surface mb-2">Mapping Status</h3>
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-subtle">
                        Total Fields: <span className="font-medium text-on-surface">{fields.length}</span>
                    </span>
                    <span className="text-green-600">
                        Mappable: <span className="font-medium">{mappableFields.length}</span>
                    </span>
                    <span className="text-subtle">
                        Available for Import: <span className="font-medium text-on-surface">{mappableFields.length}</span>
                    </span>
                </div>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="bg-surface rounded-lg p-6 border border-muted">
                    <h3 className="text-lg font-medium text-on-surface mb-4">
                        {editingField ? 'Edit' : 'Add'} Custom Field
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-on-surface mb-1">
                                    Field Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-background border border-muted rounded-lg p-2 text-sm focus:border-primary-500 focus:outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-on-surface mb-1">
                                    Field Type
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as CustomField['type'] })}
                                    className="w-full bg-background border border-muted rounded-lg p-2 text-sm focus:border-primary-500 focus:outline-none"
                                >
                                    <option value="text">Text</option>
                                    <option value="number">Number</option>
                                    <option value="date">Date</option>
                                    <option value="dropdown">Dropdown</option>
                                </select>
                            </div>
                        </div>

                        {formData.type === 'dropdown' && (
                            <div>
                                <label className="block text-sm font-medium text-on-surface mb-1">
                                    Options (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={formData.options}
                                    onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                                    placeholder="Option 1, Option 2, Option 3"
                                    className="w-full bg-background border border-muted rounded-lg p-2 text-sm focus:border-primary-500 focus:outline-none"
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isMappable}
                                    onChange={(e) => setFormData({ ...formData, isMappable: e.target.checked })}
                                    className="rounded border-muted text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-on-surface">Available for mapping in imports</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isRequired}
                                    onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                                    className="rounded border-muted text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-on-surface">Required field</span>
                            </label>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 bg-muted text-on-surface rounded-lg hover:bg-muted/80 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                            >
                                {editingField ? 'Update' : 'Create'} Field
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Fields List */}
            <div className="space-y-3">
                <h3 className="font-medium text-on-surface">All Fields</h3>
                {fields.length === 0 ? (
                    <div className="text-center py-8 text-subtle">
                        No custom fields created yet. Add your first field to get started.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {fields.map((field) => (
                            <div
                                key={field.id}
                                className="bg-surface rounded-lg p-4 border border-muted hover:border-primary-300 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-medium text-on-surface">{field.name}</h4>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                field.type === 'dropdown'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : field.type === 'number'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : field.type === 'date'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {field.type}
                                            </span>
                                            {field.isRequired && (
                                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                                    Required
                                                </span>
                                            )}
                                        </div>
                                        {field.options && field.options.length > 0 && (
                                            <p className="text-sm text-subtle mt-1">
                                                Options: {field.options.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleMappable(field)}
                                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                                field.isMappable
                                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                            }`}
                                        >
                                            {field.isMappable ? 'Mappable' : 'Not Mappable'}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(field)}
                                            className="px-3 py-1 bg-primary-100 text-primary-800 rounded hover:bg-primary-200 text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(field._id!)}
                                            className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


