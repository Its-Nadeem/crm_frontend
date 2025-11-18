import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { FacebookAccount, FacebookPage } from '../../../types';

interface Mapping {
    id: string;
    name: string;
    sourceForm: string;
    lastLead: string;
    status: 'active' | 'inactive';
    createdAt: string;
}

interface CreateMappingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (mappingData: any) => void;
    editingMapping?: Mapping | null;
    availableAccounts?: FacebookAccount[];
}

interface CustomField {
    id: string;
    crmField: string;
    value: string;
}

export const CreateMappingModal: React.FC<CreateMappingModalProps> = ({
    isOpen,
    onClose,
    onSave,
    editingMapping,
    availableAccounts = []
}) => {
    const [formData, setFormData] = useState({
        name: '',
        facebookAccount: '',
        facebookPage: '',
        facebookForm: '',
        deduplicationStrategy: 'None'
    });

    const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});

    const [customFields, setCustomFields] = useState<CustomField[]>([
        { id: '1', crmField: '', value: '' }
    ]);

    const [facebookFormFields, setFacebookFormFields] = useState<string[]>([]);
    const [showFieldMapping, setShowFieldMapping] = useState(false);
    const [loadingFormFields, setLoadingFormFields] = useState(false);

    // Dynamic options based on selections - derived from props and form data
    const availablePages = availableAccounts.find(acc => acc.name === formData.facebookAccount)?.pages || [];
    const availableForms = availablePages.find(page => page.name === formData.facebookPage)?.forms || [];

    // Debug logging for troubleshooting
    console.log('🔍 Debug Info:');
    console.log('Selected Account:', formData.facebookAccount);
    console.log('Selected Page:', formData.facebookPage);
    console.log('Available Pages:', availablePages.map(p => p.name));
    console.log('Available Forms:', availableForms.map(f => f.name));
    console.log('Form Data:', formData);

    // Facebook options - use props if available, otherwise fallback to defaults
    const facebookAccounts = availableAccounts.length > 0
        ? availableAccounts.map(account => account.name)
        : [
            'John Doe Marketing',
            'Tech Solutions Inc',
            'Digital Agency Pro'
        ];

    const crmDestinations = [
        'Select Destination',
        'Sales Team',
        'Marketing Team',
        'Support Team',
        'General Leads'
    ];

    const fieldOptions = [
        'Dont Sync',
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Company',
        'Custom Field 1',
        'Custom Field 2'
    ];

    const deduplicationOptions = [
        'None',
        'Email',
        'Phone',
        'Email + Phone'
    ];

    // Handle account selection change - update available pages
    const handleAccountChange = (accountName: string) => {
        setFormData({ ...formData, facebookAccount: accountName, facebookPage: '', facebookForm: '' });

        // Hide field mapping when account changes
        setShowFieldMapping(false);
        setFacebookFormFields([]);
    };

    // Handle page selection change - update available forms
    const handlePageChange = (pageName: string) => {
        setFormData({ ...formData, facebookPage: pageName, facebookForm: '' });

        // Hide field mapping when page changes
        setShowFieldMapping(false);
        setFacebookFormFields([]);
    };

    useEffect(() => {
        if (editingMapping) {
            setFormData({
                name: editingMapping.name,
                facebookAccount: editingMapping.sourceForm,
                facebookPage: 'My Awesome Product', // Default based on image
                facebookForm: editingMapping.sourceForm,
                deduplicationStrategy: 'None'
            });
        } else {
            setFormData({
                name: '',
                facebookAccount: '',
                facebookPage: '',
                facebookForm: '',
                deduplicationStrategy: 'None'
            });
        }

        // Reset form data will automatically reset computed values
    }, [editingMapping, isOpen]);

    // Debug effect to monitor state changes
    useEffect(() => {
        console.log('showFieldMapping state changed:', showFieldMapping);
        console.log('facebookForm value:', formData.facebookForm);
        console.log('facebookFormFields:', facebookFormFields);
    }, [showFieldMapping, formData.facebookForm, facebookFormFields]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        handleClose();
    };

    const handleClose = () => {
        setFormData({
            name: '',
            facebookAccount: '',
            facebookPage: '',
            facebookForm: '',
            deduplicationStrategy: 'None'
        });
        setFieldMappings({});
        setFacebookFormFields([]);
        setShowFieldMapping(false);
        setLoadingFormFields(false);
        setCustomFields([{ id: '1', crmField: '', value: '' }]);
        onClose();
    };

    const addCustomField = () => {
        setCustomFields([
            ...customFields,
            { id: Date.now().toString(), crmField: '', value: '' }
        ]);
    };

    const removeCustomField = (id: string) => {
        if (customFields.length > 1) {
            setCustomFields(customFields.filter(field => field.id !== id));
        }
    };

    const updateCustomField = (id: string, field: keyof CustomField, value: string) => {
        setCustomFields(customFields.map(cf =>
            cf.id === id ? { ...cf, [field]: value } : cf
        ));
    };


    // Handle form selection change - Get real form fields
    const handleFormSelection = (formValue: string) => {
        console.log('Form selection changed to:', formValue);
        console.log('Available forms:', availableForms);
        setFormData({ ...formData, facebookForm: formValue });

        // Find the selected form and get its fields
        if (formValue && formValue !== '' && formValue !== 'Select Form') {
            console.log('✅ Form selected, showing field mapping section');

            // Find form by name in available forms
            const selectedForm = availableForms.find(form => form.name === formValue);
            if (selectedForm && selectedForm.fields.length > 0) {
                console.log('✅ Found form with fields:', selectedForm.fields);
                setFacebookFormFields(selectedForm.fields);
                setShowFieldMapping(true);
                setLoadingFormFields(false);

                // Initialize field mappings
                const initialMappings: Record<string, string> = {};
                selectedForm.fields.forEach(field => {
                    initialMappings[field] = 'Dont Sync';
                });
                setFieldMappings(initialMappings);

                console.log('✅ Field mapping initialized with', selectedForm.fields.length, 'fields');
            } else {
                console.log('❌ Form not found or has no fields, using fallback method');

                // Fallback: Use mock fields for testing - common Facebook lead form fields
                const fallbackFields = [
                    'first_name',
                    'last_name',
                    'email',
                    'phone_number',
                    'company'
                ];

                setFacebookFormFields(fallbackFields);
                setShowFieldMapping(true);
                setLoadingFormFields(false);

                // Initialize field mappings
                const initialMappings: Record<string, string> = {};
                fallbackFields.forEach(field => {
                    initialMappings[field] = 'Dont Sync';
                });
                setFieldMappings(initialMappings);

                console.log('✅ Field mapping initialized with fallback fields:', fallbackFields.length, 'fields');
            }
        } else {
            console.log('❌ No form selected or "Select Form" chosen, hiding mapping');
            setFacebookFormFields([]);
            setShowFieldMapping(false);
            setLoadingFormFields(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="">
            <div className="w-full max-w-sm sm:max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl bg-surface rounded-xl shadow-2xl mx-4 border border-muted">
                {/* Enhanced Responsive Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 sm:px-6 py-3 sm:py-4 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                            <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h2 className="text-base sm:text-xl font-bold text-white truncate">
                                {editingMapping ? 'Edit Mapping' : 'Create New Mapping'}
                            </h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 sm:p-2 rounded-lg transition-all duration-200 flex-shrink-0 ml-2"
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 md:space-y-8 max-h-[70vh] overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 md:space-y-8">
                        {/* Mapping Name - Enhanced & Responsive */}
                        <div className="space-y-2 sm:space-y-3">
                            <label className="block text-xs sm:text-sm font-semibold text-on-surface mb-2 sm:mb-3">
                                📝 Mapping Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-muted rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-background focus:bg-surface text-on-surface placeholder-subtle text-sm sm:text-base"
                                placeholder="e.g., Winter Sale Leads, Newsletter Signup..."
                                required
                            />
                        </div>

                        {/* Enhanced Responsive Facebook Configuration */}
                        <div className="space-y-3 sm:space-y-4">
                            <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold text-on-surface">Facebook Configuration</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                <div className="space-y-1 sm:space-y-2">
                                    <label className="block text-xs sm:text-sm font-semibold text-on-surface">
                                        📱 Facebook Account
                                    </label>
                                    <select
                                        value={formData.facebookAccount}
                                        onChange={(e) => handleAccountChange(e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-muted rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-background focus:bg-surface text-on-surface text-sm sm:text-base"
                                        required
                                    >
                                        <option value="">Select Account</option>
                                        <option value="" disabled className="text-subtle">Choose an account first</option>
                                        {facebookAccounts.map(account => (
                                            <option key={account} value={account} className="bg-surface text-on-surface">{account}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1 sm:space-y-2">
                                    <label className="block text-xs sm:text-sm font-semibold text-on-surface">
                                        📄 Facebook Page
                                    </label>
                                    <select
                                        value={formData.facebookPage}
                                        onChange={(e) => handlePageChange(e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-muted rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-background focus:bg-surface text-on-surface text-sm sm:text-base"
                                        required
                                        disabled={!formData.facebookAccount}
                                    >
                                        <option value="">Select Page</option>
                                        <option value="" disabled className="text-subtle">Choose a page after selecting account</option>
                                        {availablePages.map(page => (
                                            <option key={page.fbPageId} value={page.name} className="bg-surface text-on-surface">{page.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1 sm:space-y-2 sm:col-span-2 lg:col-span-1">
                                    <label className="block text-xs sm:text-sm font-semibold text-on-surface">
                                        📋 Facebook Form
                                    </label>
                                    <select
                                        value={formData.facebookForm}
                                        onChange={(e) => {
                                            console.log('🔄 Form dropdown changed to:', e.target.value);
                                            handleFormSelection(e.target.value);
                                        }}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-muted rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-background focus:bg-surface text-on-surface text-sm sm:text-base"
                                        required
                                        disabled={!formData.facebookPage}
                                    >
                                        <option value="">Select Form</option>
                                        <option value="" disabled className="text-subtle">Choose a form after selecting page</option>
                                        {availableForms.map(form => (
                                            <option key={form.id} value={form.name} className="bg-surface text-on-surface">{form.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>


                        {/* Field Mapping Section - Show when form is selected or showFieldMapping is true */}
                        {((formData.facebookForm && formData.facebookForm !== '' && formData.facebookForm !== 'Select Form') || showFieldMapping) && (
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                                    <div className="bg-green-100 dark:bg-green-900/30 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-base sm:text-lg font-semibold text-on-surface">Field Mapping</h3>
                                </div>
                                <p className="text-xs sm:text-sm text-subtle bg-background p-2 sm:p-3 rounded-lg border border-muted">
                                    Map fields from your Facebook form to your CRM fields. Select Account → Page → Form above to load the field mapping options.
                                </p>

                                <div className="bg-background p-3 sm:p-4 rounded-xl border border-muted">
                                    <div className="space-y-3">
                                        {/* Header */}
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-on-surface">Field Mapping</h4>
                                            <span className="text-xs text-subtle">Map your Facebook form fields to CRM fields</span>
                                        </div>

                                        {/* Field Mapping Rows */}
                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {loadingFormFields ? (
                                                <div className="flex items-center justify-center p-8">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                                                    <span className="ml-2 text-sm text-subtle">Loading form fields...</span>
                                                </div>
                                            ) : facebookFormFields.length > 0 ? (
                                                facebookFormFields.map(field => (
                                                    <div key={field} className="flex items-center justify-between p-3 bg-surface rounded-lg border border-muted">
                                                        {/* Facebook Field Name (Left) */}
                                                        <div className="flex-1 mr-4">
                                                            <span className="text-sm font-medium text-on-surface">
                                                                {field === 'full_name' ? 'First Name' :
                                                                 field === 'first_name' ? 'First Name' :
                                                                 field === 'last_name' ? 'Last Name' :
                                                                 field === 'email' ? 'Email Address' :
                                                                 field === 'phone_number' ? 'Phone Number' :
                                                                 field === 'company' ? 'Company' :
                                                                 field === 'job_title' ? 'Job Title' :
                                                                 field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                            </span>
                                                        </div>

                                                        {/* CRM Field Mapping Dropdown (Right) */}
                                                        <div className="w-48">
                                                            <select
                                                                value={fieldMappings[field] || 'Dont Sync'}
                                                                onChange={(e) => setFieldMappings({ ...fieldMappings, [field]: e.target.value })}
                                                                className="w-full px-3 py-2 border border-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-background text-on-surface text-sm"
                                                            >
                                                                <option value="Dont Sync">Don't Sync</option>
                                                                <option value="First Name">First Name</option>
                                                                <option value="Last Name">Last Name</option>
                                                                <option value="Email">Email</option>
                                                                <option value="Phone">Phone</option>
                                                                <option value="Company">Company</option>
                                                                <option value="Lead Source">Lead Source</option>
                                                                <option value="Custom Field 1">Custom Field 1</option>
                                                                <option value="Custom Field 2">Custom Field 2</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex items-center justify-center p-8 text-sm text-subtle">
                                                    No form fields available. Please select a Facebook form first.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Debug info section - Shows current state for troubleshooting */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-800 font-semibold">🔧 Debug Info:</p>
                            <p className="text-xs text-blue-700">Selected Form: "{formData.facebookForm}"</p>
                            <p className="text-xs text-blue-700">showFieldMapping: {showFieldMapping ? '✅ true' : '❌ false'}</p>
                            <p className="text-xs text-blue-700">Facebook Fields Count: {facebookFormFields.length}</p>
                            <p className="text-xs text-blue-700">Field Mappings Count: {Object.keys(fieldMappings).length}</p>
                            <p className="text-xs text-blue-700 font-bold">
                                {formData.facebookForm && formData.facebookForm !== '' && formData.facebookForm !== 'Select Form'
                                    ? '✅ MAPPING SECTION SHOULD BE VISIBLE ABOVE'
                                    : '❌ Select a form to show mapping section'}
                            </p>
                        </div>

                        {/* Enhanced Responsive Custom Value Mapping */}
                        <div className="space-y-3 sm:space-y-4">
                            <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                                <div className="bg-purple-100 dark:bg-purple-900/30 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                                    </svg>
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold text-on-surface">Custom Value Mapping</h3>
                            </div>
                            <p className="text-xs sm:text-sm text-subtle bg-background p-2 sm:p-3 rounded-lg border border-muted">
                                Set static values for specific CRM fields for every new lead.
                            </p>

                            <div className="space-y-2 sm:space-y-3 bg-background p-3 sm:p-4 rounded-xl border border-muted">
                                {customFields.map((customField, index) => (
                                    <div key={customField.id} className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 p-3 bg-surface rounded-lg border border-muted">
                                        <select
                                            value={customField.crmField}
                                            onChange={(e) => updateCustomField(customField.id, 'crmField', e.target.value)}
                                            className="flex-1 px-3 py-2 border-2 border-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-surface text-on-surface text-sm sm:text-base order-1 sm:order-1"
                                        >
                                            <option value="">Select CRM Field</option>
                                            <option value="Lead Source" className="bg-surface text-on-surface">Lead Source</option>
                                            <option value="Campaign" className="bg-surface text-on-surface">Campaign</option>
                                            <option value="Lead Status" className="bg-surface text-on-surface">Lead Status</option>
                                            <option value="Assignee" className="bg-surface text-on-surface">Assignee</option>
                                        </select>

                                        <input
                                            type="text"
                                            value={customField.value}
                                            onChange={(e) => updateCustomField(customField.id, 'value', e.target.value)}
                                            className="flex-1 px-3 py-2 border-2 border-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-surface text-on-surface text-sm sm:text-base order-2 sm:order-2"
                                            placeholder="Enter value..."
                                        />

                                        <button
                                            type="button"
                                            onClick={() => removeCustomField(customField.id)}
                                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 order-3 self-center sm:self-auto"
                                            disabled={customFields.length === 1}
                                        >
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={addCustomField}
                                className="flex items-center justify-center space-x-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-xs sm:text-sm font-semibold bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 w-full sm:w-auto"
                            >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Add Custom Field</span>
                            </button>
                        </div>

                        {/* Enhanced Responsive Deduplication Strategy */}
                        <div className="space-y-2 sm:space-y-3">
                            <label className="block text-xs sm:text-sm font-semibold text-on-surface">
                                🛡️ Deduplication Strategy
                            </label>
                            <select
                                value={formData.deduplicationStrategy}
                                onChange={(e) => setFormData({ ...formData, deduplicationStrategy: e.target.value })}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-muted rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-background focus:bg-surface text-on-surface text-sm sm:text-base"
                            >
                                {deduplicationOptions.map(option => (
                                    <option key={option} value={option} className="bg-surface text-on-surface">{option}</option>
                                ))}
                            </select>
                        </div>

                        {/* Enhanced Responsive Buttons */}
                        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-8 border-t-2 border-muted bg-background p-3 sm:p-4 rounded-b-xl">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 sm:px-6 py-2 sm:py-3 border-2 border-muted text-on-surface rounded-lg sm:rounded-xl hover:bg-background hover:border-primary-500 font-semibold transition-all duration-200 text-sm sm:text-base order-2 sm:order-1"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg sm:rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm sm:text-base order-1 sm:order-2"
                            >
                                {editingMapping ? 'Update Mapping' : 'Save Mapping'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Modal>
    );
};


