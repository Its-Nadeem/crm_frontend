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
            {/* Enhanced Header - Fully Responsive */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-4 sm:p-6 text-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Custom Fields Manager</h1>
                        <p className="text-primary-100 text-xs sm:text-sm">
                            Create and manage custom fields that will be available across all integrations and imports
                        </p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-white text-primary-600 rounded-lg hover:bg-primary-50 font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-sm sm:text-base">Add New Field</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards - Fully Responsive */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-surface rounded-lg p-3 sm:p-4 border border-muted">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl sm:text-2xl font-bold text-on-surface truncate">{fields.length}</p>
                            <p className="text-xs sm:text-sm text-subtle truncate">Total Fields</p>
                        </div>
                    </div>
                </div>

                <div className="bg-surface rounded-lg p-3 sm:p-4 border border-muted">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl sm:text-2xl font-bold text-on-surface truncate">{mappableFields.length}</p>
                            <p className="text-xs sm:text-sm text-subtle truncate">Mappable Fields</p>
                        </div>
                    </div>
                </div>

                <div className="bg-surface rounded-lg p-3 sm:p-4 border border-muted">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl sm:text-2xl font-bold text-on-surface truncate">{categories.length}</p>
                            <p className="text-xs sm:text-sm text-subtle truncate">Categories</p>
                        </div>
                    </div>
                </div>

                <div className="bg-surface rounded-lg p-3 sm:p-4 border border-muted">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl sm:text-2xl font-bold text-on-surface truncate">
                                {fields.filter(f => f.usage && Object.values(f.usage).some(Boolean)).length}
                            </p>
                            <p className="text-xs sm:text-sm text-subtle truncate">Active Integrations</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters - Fully Responsive */}
            <div className="bg-surface rounded-lg p-3 sm:p-4 border border-muted">
                <div className="flex flex-col gap-3 sm:gap-4">
                    {/* Search and Filter Row */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search fields..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 sm:py-3 bg-background border border-muted rounded-lg focus:border-primary-500 focus:outline-none text-sm"
                            />
                        </div>

                        {/* Category Filter */}
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-3 py-2 sm:py-3 bg-background border border-muted rounded-lg focus:border-primary-500 focus:outline-none text-sm min-w-0"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(category => (
                                <option key={category} value={category}>
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tabs - Responsive */}
                    <div className="flex bg-muted rounded-lg p-1 overflow-x-auto">
                        {[
                            { key: 'all', label: 'All Fields', count: fields.length },
                            { key: 'mappable', label: 'Mappable', count: mappableFields.length },
                            { key: 'categories', label: 'By Category', count: categories.length }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                                    activeTab === tab.key
                                        ? 'bg-white text-primary-600 shadow-sm'
                                        : 'text-subtle hover:text-on-surface'
                                }`}
                            >
                                <span className="hidden xs:inline">{tab.label}</span>
                                <span className="xs:hidden">{tab.label.split(' ')[0]}</span> ({tab.count})
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Enhanced Add/Edit Modal - Fully Responsive */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="bg-surface rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                        <div className="p-4 sm:p-6">
                            <div className="flex items-center gap-3 mb-4 sm:mb-6">
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                    editingField ? 'bg-blue-100' : 'bg-green-100'
                                }`}>
                                    {editingField ? (
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-lg sm:text-xl font-bold text-on-surface truncate">
                                        {editingField ? 'Edit' : 'Create New'} Custom Field
                                    </h3>
                                    <p className="text-xs sm:text-sm text-subtle">
                                        {editingField ? 'Update field properties and settings' : 'Add a new custom field to your organization'}
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Basic Information - Responsive */}
                                <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
                                    <h4 className="font-semibold text-on-surface mb-3 sm:mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm sm:text-base">Basic Information</span>
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-on-surface mb-1 sm:mb-2">
                                                Field Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-background border border-muted rounded-lg p-2 sm:p-3 text-sm focus:border-primary-500 focus:outline-none"
                                                placeholder="e.g., Lead Score, Company Size"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-on-surface mb-1 sm:mb-2">
                                                Category
                                            </label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full bg-background border border-muted rounded-lg p-2 sm:p-3 text-sm focus:border-primary-500 focus:outline-none"
                                            >
                                                <option value="general">General</option>
                                                <option value="personal">Personal Info</option>
                                                <option value="business">Business Info</option>
                                                <option value="integration">Integration</option>
                                                <option value="system">System</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-3 sm:mt-4">
                                        <label className="block text-xs sm:text-sm font-medium text-on-surface mb-1 sm:mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={2}
                                            className="w-full bg-background border border-muted rounded-lg p-2 sm:p-3 text-sm focus:border-primary-500 focus:outline-none resize-none"
                                            placeholder="Describe what this field is used for..."
                                        />
                                    </div>
                                </div>

                                {/* Field Configuration - Responsive */}
                                <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
                                    <h4 className="font-semibold text-on-surface mb-3 sm:mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="text-sm sm:text-base">Field Configuration</span>
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-on-surface mb-1 sm:mb-2">
                                                Field Type *
                                            </label>
                                            <select
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value as CustomField['type'] })}
                                                className="w-full bg-background border border-muted rounded-lg p-2 sm:p-3 text-sm focus:border-primary-500 focus:outline-none"
                                            >
                                                <option value="text">Text</option>
                                                <option value="number">Number</option>
                                                <option value="date">Date</option>
                                                <option value="dropdown">Dropdown</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-3 sm:pt-6">
                                            <label className="flex items-center gap-2 sm:gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isRequired}
                                                    onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                                                    className="rounded border-muted text-primary-600 focus:ring-primary-500"
                                                />
                                                <span className="text-xs sm:text-sm text-on-surface">Required field</span>
                                            </label>
                                        </div>
                                    </div>

                                    {formData.type === 'dropdown' && (
                                        <div className="mt-3 sm:mt-4">
                                            <label className="block text-xs sm:text-sm font-medium text-on-surface mb-1 sm:mb-2">
                                                Dropdown Options (comma-separated)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.options}
                                                onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                                                placeholder="Option 1, Option 2, Option 3"
                                                className="w-full bg-background border border-muted rounded-lg p-2 sm:p-3 text-sm focus:border-primary-500 focus:outline-none"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Integration Settings - Responsive */}
                                <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
                                    <h4 className="font-semibold text-on-surface mb-3 sm:mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                        </svg>
                                        <span className="text-sm sm:text-base">Integration Settings</span>
                                    </h4>

                                    <div className="space-y-3">
                                        <label className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={formData.isMappable}
                                                onChange={(e) => setFormData({ ...formData, isMappable: e.target.checked })}
                                                className="rounded border-muted text-primary-600 focus:ring-primary-500 mt-0.5"
                                            />
                                            <div className="min-w-0">
                                                <span className="text-sm font-medium text-on-surface">Available for mapping</span>
                                                <p className="text-xs text-subtle">Allow this field to be mapped in CSV imports and integrations</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Form Buttons - Responsive */}
                                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-muted">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 sm:px-6 py-2 sm:py-2 bg-muted text-on-surface rounded-lg hover:bg-muted/80 font-medium transition-colors text-sm sm:text-base"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 sm:px-6 py-2 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors text-sm sm:text-base"
                                    >
                                        {editingField ? 'Update Field' : 'Create Field'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Fields List - Responsive */}
            <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-semibold text-on-surface">
                        Fields ({filteredFields.length})
                    </h3>
                    {filteredFields.length > 0 && (
                        <button
                            onClick={refreshFields}
                            className="px-3 py-1.5 text-xs sm:text-sm text-primary-600 hover:text-primary-700 flex items-center gap-2 self-end sm:self-auto"
                        >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Refresh</span>
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
                    <div className="grid gap-3 sm:gap-4">
                        {filteredFields.map((field) => (
                            <div
                                key={field.id}
                                className={`bg-surface rounded-xl p-4 sm:p-6 border transition-all duration-200 ${
                                    updatingFields.has(field._id!)
                                        ? 'border-primary-300 shadow-lg'
                                        : 'border-muted hover:border-primary-200 hover:shadow-md'
                                }`}
                            >
                                <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                                            <h4 className="text-base sm:text-lg font-semibold text-on-surface truncate">{field.name}</h4>

                                            {/* Field Type Badge */}
                                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
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
                                                <span className="px-2 sm:px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium flex-shrink-0">
                                                    {field.category}
                                                </span>
                                            )}

                                            {/* Required Badge */}
                                            {field.isRequired && (
                                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex-shrink-0">
                                                    Required
                                                </span>
                                            )}

                                            {/* Mappable Badge */}
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                                                field.isMappable
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {field.isMappable ? 'Mappable' : 'Not Mappable'}
                                            </span>
                                        </div>

                                        {/* Description - Responsive */}
                                        {field.description && (
                                            <p className="text-xs sm:text-sm text-subtle mb-2 sm:mb-3 line-clamp-2">{field.description}</p>
                                        )}

                                        {/* Options for dropdown fields - Responsive */}
                                        {field.options && field.options.length > 0 && (
                                            <div className="mb-2 sm:mb-3">
                                                <p className="text-xs text-subtle mb-1">Options:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {field.options.slice(0, 3).map((option, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-2 py-1 bg-muted text-on-surface rounded-md text-xs truncate max-w-20"
                                                            title={option}
                                                        >
                                                            {option}
                                                        </span>
                                                    ))}
                                                    {field.options.length > 3 && (
                                                        <span className="px-2 py-1 bg-muted text-subtle rounded-md text-xs">
                                                            +{field.options.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Integration Usage - Responsive */}
                                        {field.usage && Object.values(field.usage).some(Boolean) && (
                                            <div className="mb-2 sm:mb-3">
                                                <p className="text-xs text-subtle mb-1 sm:mb-2">Active Integrations:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {Object.entries(field.usage)
                                                        .filter(([_, enabled]) => enabled)
                                                        .slice(0, 4)
                                                        .map(([integration, _]) => (
                                                            <span
                                                                key={integration}
                                                                className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium truncate max-w-16"
                                                                title={integration.replace('in', '').toUpperCase()}
                                                            >
                                                                {integration.replace('in', '').toUpperCase()}
                                                            </span>
                                                        ))}
                                                    {Object.values(field.usage).filter(Boolean).length > 4 && (
                                                        <span className="px-2 py-1 bg-muted text-subtle rounded-full text-xs">
                                                            +{Object.values(field.usage).filter(Boolean).length - 4}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Usage Summary - Responsive */}
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

            {/* Enhanced Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-xl shadow-2xl max-w-lg w-full">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-on-surface">Delete Custom Field</h3>
                                    <p className="text-sm text-subtle">This action cannot be undone</p>
                                </div>
                            </div>

                            {(() => {
                                const fieldToDelete = fields.find(f => f._id === showDeleteConfirm);
                                return (
                                    <div className="mb-6">
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                            <p className="text-red-800 font-medium">{fieldToDelete?.name}</p>
                                            <p className="text-red-600 text-sm mt-1">
                                                Type: {fieldToDelete?.type} • Category: {fieldToDelete?.category || 'general'}
                                            </p>
                                        </div>

                                        <div className="space-y-3 text-sm text-on-surface">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                                <span>This field will be removed from all existing leads</span>
                                            </div>

                                            {fieldToDelete?.usage && Object.values(fieldToDelete.usage).some(Boolean) && (
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                                    </svg>
                                                    <span>This field is used in {Object.values(fieldToDelete.usage).filter(Boolean).length} integrations</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>This action cannot be undone</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="flex justify-end gap-3 pt-4 border-t border-muted">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="px-6 py-2 bg-muted text-on-surface rounded-lg hover:bg-muted/80 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(showDeleteConfirm)}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
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


