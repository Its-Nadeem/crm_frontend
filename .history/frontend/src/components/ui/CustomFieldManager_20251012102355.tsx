import React, { useState, useEffect } from 'react';
import { useCustomFields, CustomField } from '../../hooks/useCustomFields';
import { useToast } from './Toast';

interface CustomFieldManagerProps {
    organizationId: string;
    onFieldsChange: (fields: CustomField[]) => void;
}

export const CustomFieldManager: React.FC<CustomFieldManagerProps> = ({
    organizationId,
    onFieldsChange
}) => {
    const {
        fields,
        loading,
        error,
        createField,
        updateField,
        deleteField,
        updateFieldUsage,
        refreshFields
    } = useCustomFields(organizationId);

    const [showModal, setShowModal] = useState(false);
    const [editingField, setEditingField] = useState<CustomField | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'text' as CustomField['type'],
        options: '',
        isMappable: true,
        isRequired: false,
        category: 'general' as CustomField['category'],
        description: ''
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'mappable' | 'categories'>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingFields, setUpdatingFields] = useState<Set<string>>(new Set());
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
            isRequired: false,
            category: 'general',
            description: ''
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
            isRequired: field.isRequired,
            category: field.category || 'general',
            description: field.description || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const fieldData = {
                id: editingField ? editingField.id : `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
            setUpdatingFields(prev => new Set(prev).add(fieldId));
            await deleteField(fieldId);
            showToast('Custom field deleted successfully', 'success');
            setShowDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting custom field:', error);
            showToast('Failed to delete custom field', 'error');
        } finally {
            setUpdatingFields(prev => {
                const newSet = new Set(prev);
                newSet.delete(fieldId);
                return newSet;
            });
        }
    };

    const handleToggleMappable = async (fieldId: string, isMappable: boolean) => {
        try {
            setUpdatingFields(prev => new Set(prev).add(fieldId));
            await updateField(fieldId, { isMappable });
            showToast(`Field ${isMappable ? 'enabled' : 'disabled'} for mapping`, 'success');
        } catch (error) {
            console.error('Error updating field mappable status:', error);
            showToast('Failed to update field', 'error');
        } finally {
            setUpdatingFields(prev => {
                const newSet = new Set(prev);
                newSet.delete(fieldId);
                return newSet;
            });
        }
    };

    const handleToggleIntegration = async (fieldId: string, integrationType: string, enabled: boolean) => {
        try {
            setUpdatingFields(prev => new Set(prev).add(fieldId));
            await updateFieldUsage(fieldId, integrationType, enabled);
            showToast(`Field ${enabled ? 'enabled' : 'disabled'} for ${integrationType}`, 'success');
        } catch (error) {
            console.error('Error updating field integration:', error);
            showToast('Failed to update field integration', 'error');
        } finally {
            setUpdatingFields(prev => {
                const newSet = new Set(prev);
                newSet.delete(fieldId);
                return newSet;
            });
        }
    };

    const handleToggleRequired = async (fieldId: string, isRequired: boolean) => {
        try {
            setUpdatingFields(prev => new Set(prev).add(fieldId));
            await updateField(fieldId, { isRequired });
            showToast(`Field ${isRequired ? 'marked as required' : 'marked as optional'}`, 'success');
        } catch (error) {
            console.error('Error updating field required status:', error);
            showToast('Failed to update field', 'error');
        } finally {
            setUpdatingFields(prev => {
                const newSet = new Set(prev);
                newSet.delete(fieldId);
                return newSet;
            });
        }
    };

    // Filter and search fields
    const filteredFields = fields.filter(field => {
        const matchesSearch = searchTerm === '' ||
            field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (field.description && field.description.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = filterCategory === 'all' || field.category === filterCategory;

        const matchesTab = activeTab === 'all' ||
            (activeTab === 'mappable' && field.isMappable) ||
            (activeTab === 'categories' && field.category !== 'general');

        return matchesSearch && matchesCategory && matchesTab;
    });

    const mappableFields = fields.filter(field => field.isMappable);

    // Get unique categories for filter dropdown
    const categories = Array.from(new Set(fields.map(field => field.category || 'general')));

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-on-surface">Loading custom fields...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">Custom Fields Manager</h1>
                        <p className="text-primary-100 text-sm">
                            Create and manage custom fields that will be available across all integrations and imports
                        </p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="px-6 py-3 bg-white text-primary-600 rounded-lg hover:bg-primary-50 font-semibold shadow-lg transition-all duration-200 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add New Field
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-surface rounded-lg p-4 border border-muted">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-on-surface">{fields.length}</p>
                            <p className="text-sm text-subtle">Total Fields</p>
                        </div>
                    </div>
                </div>

                <div className="bg-surface rounded-lg p-4 border border-muted">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-on-surface">{mappableFields.length}</p>
                            <p className="text-sm text-subtle">Mappable Fields</p>
                        </div>
                    </div>
                </div>

                <div className="bg-surface rounded-lg p-4 border border-muted">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-on-surface">{categories.length}</p>
                            <p className="text-sm text-subtle">Categories</p>
                        </div>
                    </div>
                </div>

                <div className="bg-surface rounded-lg p-4 border border-muted">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-on-surface">
                                {fields.filter(f => f.usage && Object.values(f.usage).some(Boolean)).length}
                            </p>
                            <p className="text-sm text-subtle">Active Integrations</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-surface rounded-lg p-4 border border-muted">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-3 flex-1">
                        {/* Search */}
                        <div className="relative flex-1 max-w-sm">
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search fields..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-background border border-muted rounded-lg focus:border-primary-500 focus:outline-none text-sm"
                            />
                        </div>

                        {/* Category Filter */}
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-3 py-2 bg-background border border-muted rounded-lg focus:border-primary-500 focus:outline-none text-sm"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(category => (
                                <option key={category} value={category}>
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-muted rounded-lg p-1">
                        {[
                            { key: 'all', label: 'All Fields', count: fields.length },
                            { key: 'mappable', label: 'Mappable', count: mappableFields.length },
                            { key: 'categories', label: 'By Category', count: categories.length }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    activeTab === tab.key
                                        ? 'bg-white text-primary-600 shadow-sm'
                                        : 'text-subtle hover:text-on-surface'
                                }`}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Enhanced Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    editingField ? 'bg-blue-100' : 'bg-green-100'
                                }`}>
                                    {editingField ? (
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-on-surface">
                                        {editingField ? 'Edit' : 'Create New'} Custom Field
                                    </h3>
                                    <p className="text-sm text-subtle">
                                        {editingField ? 'Update field properties and settings' : 'Add a new custom field to your organization'}
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Basic Information */}
                                <div className="bg-muted/30 rounded-lg p-4">
                                    <h4 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Basic Information
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-on-surface mb-2">
                                                Field Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-background border border-muted rounded-lg p-3 text-sm focus:border-primary-500 focus:outline-none"
                                                placeholder="e.g., Lead Score, Company Size"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-on-surface mb-2">
                                                Category
                                            </label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full bg-background border border-muted rounded-lg p-3 text-sm focus:border-primary-500 focus:outline-none"
                                            >
                                                <option value="general">General</option>
                                                <option value="personal">Personal Info</option>
                                                <option value="business">Business Info</option>
                                                <option value="integration">Integration</option>
                                                <option value="system">System</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-on-surface mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={3}
                                            className="w-full bg-background border border-muted rounded-lg p-3 text-sm focus:border-primary-500 focus:outline-none resize-none"
                                            placeholder="Describe what this field is used for..."
                                        />
                                    </div>
                                </div>

                                {/* Field Configuration */}
                                <div className="bg-muted/30 rounded-lg p-4">
                                    <h4 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Field Configuration
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-on-surface mb-2">
                                                Field Type *
                                            </label>
                                            <select
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value as CustomField['type'] })}
                                                className="w-full bg-background border border-muted rounded-lg p-3 text-sm focus:border-primary-500 focus:outline-none"
                                            >
                                                <option value="text">Text</option>
                                                <option value="number">Number</option>
                                                <option value="date">Date</option>
                                                <option value="dropdown">Dropdown</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-3 pt-8">
                                            <label className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isRequired}
                                                    onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                                                    className="rounded border-muted text-primary-600 focus:ring-primary-500"
                                                />
                                                <span className="text-sm text-on-surface">Required field</span>
                                            </label>
                                        </div>
                                    </div>

                                    {formData.type === 'dropdown' && (
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-on-surface mb-2">
                                                Dropdown Options (comma-separated)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.options}
                                                onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                                                placeholder="Option 1, Option 2, Option 3"
                                                className="w-full bg-background border border-muted rounded-lg p-3 text-sm focus:border-primary-500 focus:outline-none"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Integration Settings */}
                                <div className="bg-muted/30 rounded-lg p-4">
                                    <h4 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                        </svg>
                                        Integration Settings
                                    </h4>

                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={formData.isMappable}
                                                onChange={(e) => setFormData({ ...formData, isMappable: e.target.checked })}
                                                className="rounded border-muted text-primary-600 focus:ring-primary-500"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-on-surface">Available for mapping</span>
                                                <p className="text-xs text-subtle">Allow this field to be mapped in CSV imports and integrations</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t border-muted">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-6 py-2 bg-muted text-on-surface rounded-lg hover:bg-muted/80 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
                                    >
                                        {editingField ? 'Update Field' : 'Create Field'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Fields List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-on-surface">
                        Fields ({filteredFields.length})
                    </h3>
                    {filteredFields.length > 0 && (
                        <button
                            onClick={refreshFields}
                            className="px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                    )}
                </div>

                {filteredFields.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h4 className="text-lg font-medium text-on-surface mb-2">
                            {fields.length === 0 ? 'No custom fields yet' : 'No fields match your filters'}
                        </h4>
                        <p className="text-subtle mb-4">
                            {fields.length === 0
                                ? 'Create your first custom field to get started with advanced lead management.'
                                : 'Try adjusting your search terms or filters to see more results.'
                            }
                        </p>
                        {fields.length === 0 && (
                            <button
                                onClick={openAddModal}
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                            >
                                Create Your First Field
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredFields.map((field) => (
                            <div
                                key={field.id}
                                className={`bg-surface rounded-xl p-6 border transition-all duration-200 ${
                                    updatingFields.has(field._id!)
                                        ? 'border-primary-300 shadow-lg'
                                        : 'border-muted hover:border-primary-200 hover:shadow-md'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h4 className="text-lg font-semibold text-on-surface">{field.name}</h4>

                                            {/* Field Type Badge */}
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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

                                            {/* Category Badge */}
                                            {field.category && field.category !== 'general' && (
                                                <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
                                                    {field.category}
                                                </span>
                                            )}

                                            {/* Required Badge */}
                                            {field.isRequired && (
                                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                                    Required
                                                </span>
                                            )}

                                            {/* Mappable Badge */}
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                field.isMappable
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {field.isMappable ? 'Mappable' : 'Not Mappable'}
                                            </span>
                                        </div>

                                        {/* Description */}
                                        {field.description && (
                                            <p className="text-sm text-subtle mb-3">{field.description}</p>
                                        )}

                                        {/* Options for dropdown fields */}
                                        {field.options && field.options.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-xs text-subtle mb-1">Options:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {field.options.map((option, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-2 py-1 bg-muted text-on-surface rounded-md text-xs"
                                                        >
                                                            {option}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Integration Usage */}
                                        {field.usage && Object.values(field.usage).some(Boolean) && (
                                            <div className="mb-3">
                                                <p className="text-xs text-subtle mb-2">Active Integrations:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {Object.entries(field.usage)
                                                        .filter(([_, enabled]) => enabled)
                                                        .map(([integration, _]) => (
                                                            <span
                                                                key={integration}
                                                                className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium"
                                                            >
                                                                {integration.replace('in', '').toUpperCase()}
                                                            </span>
                                                        ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Usage Summary */}
                                        {field.usage && Object.values(field.usage).some(Boolean) && (
                                            <div className="text-xs text-subtle">
                                                Used in {Object.values(field.usage).filter(Boolean).length} integration{Object.values(field.usage).filter(Boolean).length !== 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 ml-4">
                                        {/* Live Toggle Switches */}
                                        <div className="flex flex-col gap-2 mr-3">
                                            {/* Mappable Toggle */}
                                            <label className="flex items-center gap-2 text-xs">
                                                <input
                                                    type="checkbox"
                                                    checked={field.isMappable}
                                                    onChange={(e) => handleToggleMappable(field._id!, e.target.checked)}
                                                    disabled={updatingFields.has(field._id!)}
                                                    className="rounded border-muted text-primary-600 focus:ring-primary-500"
                                                />
                                                <span className="text-subtle">Mappable</span>
                                            </label>

                                            {/* Required Toggle */}
                                            <label className="flex items-center gap-2 text-xs">
                                                <input
                                                    type="checkbox"
                                                    checked={field.isRequired}
                                                    onChange={(e) => handleToggleRequired(field._id!, e.target.checked)}
                                                    disabled={updatingFields.has(field._id!)}
                                                    className="rounded border-muted text-primary-600 focus:ring-primary-500"
                                                />
                                                <span className="text-subtle">Required</span>
                                            </label>
                                        </div>

                                        {/* Integration Toggles */}
                                        <div className="flex flex-wrap gap-1 mr-3">
                                            {['Imports', 'Facebook', 'Google', 'Website', 'API'].map(integration => {
                                                const key = `in${integration.toLowerCase()}`;
                                                const enabled = field.usage?.[key] || false;
                                                return (
                                                    <button
                                                        key={integration}
                                                        onClick={() => handleToggleIntegration(field._id!, integration.toLowerCase(), !enabled)}
                                                        disabled={updatingFields.has(field._id!)}
                                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                                            enabled
                                                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {integration}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Edit and Delete Buttons */}
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => openEditModal(field)}
                                                disabled={updatingFields.has(field._id!)}
                                                className="px-3 py-1.5 bg-primary-100 text-primary-800 rounded-lg hover:bg-primary-200 text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteConfirm(field._id!)}
                                                disabled={updatingFields.has(field._id!)}
                                                className="px-3 py-1.5 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Loading indicator for this field */}
                                {updatingFields.has(field._id!) && (
                                    <div className="absolute inset-0 bg-surface/80 rounded-xl flex items-center justify-center">
                                        <div className="flex items-center gap-2 text-primary-600">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                                            <span className="text-sm">Updating...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-on-surface">Delete Custom Field</h3>
                                    <p className="text-sm text-subtle">This action cannot be undone</p>
                                </div>
                            </div>

                            <p className="text-on-surface mb-6">
                                Are you sure you want to delete this custom field? This will remove it from all leads and cannot be recovered.
                            </p>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="px-4 py-2 bg-muted text-on-surface rounded-lg hover:bg-muted/80 text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(showDeleteConfirm)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                                >
                                    Delete Field
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


