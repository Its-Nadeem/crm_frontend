import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IntegrationSettings,
    IntegrationSource,
    ConnectedFacebookAccount,
    ConnectedFacebookPage
} from '../../types';

// Local interfaces for Facebook integration specific types
interface FacebookForm {
    formId: string;
    formName: string;
    pageId: string;
    leadsCount: number;
    createdTime: string;
    fields?: { name: string; label: string }[];
    fieldMapping?: Record<string, string>;
    createdAt?: string;
    updatedAt?: string;
}

interface FacebookField {
    name: string;
    values: string[];
}

interface FieldMappingEntry {
    facebookField: string;
    crmField: string;
    customValue?: string;
}

interface FacebookMapping {
    id: string;
    name: string;
    accountId: string;
    pageId: string;
    formId: string;
    accountName: string;
    pageName: string;
    formName: string;
    destination: string;
    fieldMappings: FieldMappingEntry[];
    lastLead: string;
    status: 'active' | 'inactive';
    createdAt?: string;
    updatedAt?: string;
}

interface SyncFormData {
    accountId: string;
    formId: string;
    pageId: string;
    since: string;
    until: string;
}

interface SyncResult {
    leadId: string;
    status: 'saved' | 'skipped' | 'error';
    crmId?: string;
    reason?: string;
    error?: string;
}
// import { AccountsTab } from '../../../../frontend/src/components/pages/AccountsTab';
// import { ActivityLogTab } from '../../../src/components/pages/ActivityLogTab';
import FacebookConnectModal from '../integrations/FacebookConnectModal';
import FacebookFieldMapping from '../../src/components/integrations/FacebookFieldMapping';
import { useCustomFields } from '../../src/hooks/useCustomFields';

interface FacebookIntegrationPageProps {
    settings: IntegrationSettings[];
    setSettings: React.Dispatch<React.SetStateAction<IntegrationSettings[]>>;
    customFieldDefs: any[];
    currentOrganization: any;
    onSendTestLead: (source: IntegrationSource, formName: string) => void;
}

export const FacebookIntegrationPage: React.FC<FacebookIntegrationPageProps> = ({
    settings,
    setSettings,
    customFieldDefs,
    currentOrganization,
    onSendTestLead
}) => {
    const navigate = useNavigate();
    const { mappableFields, loading: customFieldsLoading } = useCustomFields(currentOrganization?.id || 'org-1');
    const [activeTab, setActiveTab] = useState<'account' | 'mapping' | 'activity-log'>('account');
    const [modalState, setModalState] = useState<{ isOpen: boolean; type: 'connect' | 'map' }>({ isOpen: false, type: 'connect' });
    const [showCreateMappingModal, setShowCreateMappingModal] = useState(false);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [editingMapping, setEditingMapping] = useState(null);
    const [isPagesExpanded, setIsPagesExpanded] = useState(true);

    // Create mapping modal state
    const [mappingForm, setMappingForm] = useState({
        name: '',
        accountId: '',
        pageId: '',
        formId: '',
        destination: ''
    });

    // Account management state
    const [accounts, setAccounts] = useState<any[]>([]);
    const [mappings, setMappings] = useState<FacebookMapping[]>([]);
    const [forms, setForms] = useState<FacebookForm[]>([]);
    const [facebookFields, setFacebookFields] = useState<FacebookField[]>([]);
    const [fieldMappings, setFieldMappings] = useState<FieldMappingEntry[]>([]);
    const [isMappingValid, setIsMappingValid] = useState(false);
    const [unmappedMandatoryFields, setUnmappedMandatoryFields] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Validation state for mandatory field mapping
    const handleValidationChange = (isValid: boolean, unmappedFields: string[]) => {
        setIsMappingValid(isValid);
        setUnmappedMandatoryFields(unmappedFields);
    };

    // Sync modal state
    const [syncForm, setSyncForm] = useState({
        accountId: '',
        formId: '',
        pageId: '',
        since: '',
        until: ''
    });
    const [syncResults, setSyncResults] = useState(null);
    const [syncLoading, setSyncLoading] = useState(false);

    // CRM fields for mapping - will be populated with standard and custom fields
    const [crmFields, setCrmFields] = useState<any[]>([]);

    // Fetch accounts and pages from API
    const fetchAccountsAndPages = async () => {
        console.log('Fetching Facebook accounts and pages...');
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${window.location.origin}/api/fb/pages?tenantId=org-1`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch accounts');
            }

            const data = await response.json();
            console.log('Raw response from /api/fb/pages:', data);

            if (data.success) {
                console.log('Successfully fetched Facebook pages:', data.pages);
                // Use real data from the backend
                const formattedAccounts = [{
                    id: 'fb-main',
                    name: data.accountName || 'Facebook Account',
                    accessToken: 'connected',
                    pages: data.pages.map((page: any) => ({
                        id: page.pageId,
                        name: page.pageName,
                        subscribed: page.subscribed || false,
                        forms: [] // Initialize empty forms array
                    }))
                }];
                console.log('Formatted accounts for frontend:', formattedAccounts);
                setAccounts(formattedAccounts);
                console.log('Accounts state set successfully');
            } else {
                console.error('Failed to fetch Facebook pages:', data.message);
                throw new Error(data.message || 'Failed to fetch accounts');
            }
        } catch (err) {
            console.error('Error fetching accounts:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
        } finally {
            setLoading(false);
        }
    };

    // Fetch mappings from API
    const fetchMappings = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${window.location.origin}/api/fb/mappings?tenantId=org-1`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch mappings');
            }

            const data = await response.json();

            if (data.success) {
                setMappings(data.mappings);
            } else {
                throw new Error(data.message || 'Failed to fetch mappings');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch mappings');
        } finally {
            setLoading(false);
        }
    };

    // Fetch forms for a specific page
    const fetchForms = async (pageId: string) => {
        if (!pageId) {
            setForms([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Fetching forms for pageId:', pageId);
            const response = await fetch(`${window.location.origin}/api/fb/forms?pageId=${pageId}&tenantId=org-1`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch forms');
            }

            const data = await response.json();
            console.log('Forms response:', data);

            if (data.success) {
                setForms(data.forms);
            } else {
                throw new Error(data.message || 'Failed to fetch forms');
            }
        } catch (err) {
            console.error('Error fetching forms:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch forms');
        } finally {
            setLoading(false);
        }
    };

    // Update CRM fields when mappable custom fields change
    useEffect(() => {
        const standardFields = [
            { key: 'name', label: 'Full Name', type: 'text', required: true },
            { key: 'email', label: 'Email Address', type: 'email', required: true },
            { key: 'phone', label: 'Phone Number', type: 'phone' },
            { key: 'company', label: 'Company Name', type: 'text' },
            { key: 'stage', label: 'Sales Pipeline Stage', type: 'select' },
            { key: 'source', label: 'Lead Source', type: 'text' },
            { key: 'notes', label: 'Notes', type: 'textarea' },
            // Facebook metadata fields
            { key: 'campaignName', label: 'Campaign Name', type: 'text' },
            { key: 'adSetName', label: 'Ad Set Name', type: 'text' },
            { key: 'adName', label: 'Ad Name', type: 'text' },
            { key: 'formName', label: 'Form Name', type: 'text' },
            { key: 'pageName', label: 'Page Name', type: 'text' },
            { key: 'platform', label: 'Platform', type: 'text' },
            { key: 'leadCreatedTime', label: 'Lead Created Time', type: 'datetime' }
        ];

        // Convert mappable custom fields to CRM field format
        const customCrmFields = mappableFields.map(field => ({
            key: field._id || field.id,
            label: field.name,
            type: field.type,
            required: field.isRequired || false,
            options: field.options || [],
            isCustom: true
        }));

        // Combine standard and custom fields
        setCrmFields([...standardFields, ...customCrmFields]);
        console.log('Updated CRM fields with custom fields:', [...standardFields, ...customCrmFields]);
    }, [mappableFields]);

    // Fetch CRM fields from API (keeping for backward compatibility)
    const fetchCrmFields = async () => {
        try {
            const response = await fetch(`${window.location.origin}/api/fb/custom-fields?tenantId=org-1`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log('Fetched additional CRM fields from API:', data.fields);
                }
            }
        } catch (error) {
            console.error('Error fetching CRM fields:', error);
        }
    };

    // Fetch Facebook form fields for field mapping
    const fetchFacebookFields = async (formId: string) => {
        if (!formId) {
            setFacebookFields([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Find the form and use its fields
            const form = forms.find(f => f.formId === formId);
            if (form && form.fields && form.fields.length > 0) {
                // Use real form fields from Facebook API
                const fields = form.fields.map(f => ({
                    name: f.name,
                    values: [`Sample ${f.label || f.name} value`]
                }));
                setFacebookFields(fields);
                console.log('Using real Facebook form fields:', fields);
            } else {
                // If no fields available, show empty state
                setFacebookFields([]);
                console.log('No form fields available for formId:', formId);
            }
        } catch (err) {
            console.error('Error fetching form fields:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch form fields');
            setFacebookFields([]);
        } finally {
            setLoading(false);
        }
    };


    const currentSetting = settings.find(s => s.source === 'Facebook');

    // Check if Facebook integration exists in backend
    const checkAndLoadFacebookData = async () => {
        try {
            const response = await fetch(`${window.location.origin}/api/fb/pages?tenantId=org-1`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.pages && data.pages.length > 0) {
                    // Facebook integration exists in backend, load the data
                    console.log('Facebook integration found in backend, loading data...');

                    // Update frontend settings to mark Facebook as connected
                    setSettings(prev => prev.map(s =>
                        s.source === 'Facebook'
                            ? { ...s, isConnected: true, connectedAccounts: [{
                                id: 'fb-main',
                                name: data.accountName || 'Facebook Account',
                                accessToken: 'connected',
                                pages: data.pages.map((page: any) => ({
                                    id: page.pageId,
                                    name: page.pageName,
                                    forms: []
                                }))
                            }]}
                            : s
                    ));

                    fetchAccountsAndPages();
                    fetchMappings();
                }
            }
        } catch (error) {
            console.error('Error checking Facebook integration:', error);
        }
    };

    // Load data on component mount - only run once
    useEffect(() => {
        console.log('Facebook Integration Page mounted, current setting:', currentSetting);

        // Load data if either frontend setting is connected OR if we find backend data
        if (currentSetting?.isConnected) {
            console.log('Frontend setting shows connected, fetching data...');
            fetchAccountsAndPages();
            fetchMappings();
            fetchCrmFields(); // Fetch CRM fields for mapping
        } else {
            // Check backend for existing integration even if frontend doesn't know about it
            console.log('Checking backend for existing integration...');
            checkAndLoadFacebookData();
        }
    }, []); // Only run on mount

    const handleCloseModal = () => setModalState({ isOpen: false, type: 'connect' });
    const handleSaveConnection = async (source: IntegrationSource, details: Partial<IntegrationSettings> | ConnectedFacebookAccount[]) => {
        if (Array.isArray(details)) {
            // Handle ConnectedFacebookAccount[] from modal
            setSettings(prev => prev.map(s => s.source === source ? { ...s, isConnected: true, connectedAccounts: details } : s));
        } else {
            // Handle Partial<IntegrationSettings> from other sources
            setSettings(prev => prev.map(s => s.source === source ? { ...s, ...details } : s));
        }

        // After successful OAuth connection, refresh the accounts and pages data
        if (source === 'Facebook' && details && typeof details === 'object' && 'isConnected' in details && details.isConnected) {
            console.log('Facebook OAuth completed successfully, refreshing data...');
            await fetchAccountsAndPages();
        }
    };
    const handleDisconnect = (source: IntegrationSource) => {
        if (window.confirm(`Are you sure you want to disconnect ${source}? This will stop new leads from coming in.`)) {
            setSettings(prev => prev.map(s => s.source === source ? {...s, isConnected: false, connectedAccounts: [], connectedWebsites: []} : s));
            setAccounts([]); // Clear accounts state to update frontend immediately
        }
    };

    const handleDisconnectAccount = (accountId: string) => {
        if (window.confirm('Are you sure you want to disconnect this account? This will stop new leads from coming in.')) {
            setAccounts(prev => prev.filter(acc => acc.id !== accountId));
            setSettings(prev => prev.map(s => s.source === 'Facebook' ? {...s, connectedAccounts: s.connectedAccounts?.filter(acc => acc.id !== accountId)} : s));
        }
    };

    // Account management handlers
    const handleSubscriptionToggle = async (accountId: string, pageId: string, subscribed: boolean) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${window.location.origin}/api/fb/pages/${pageId}/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    tenantId: 'org-1' // Fixed tenant ID
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update subscription');
            }

            const data = await response.json();

            if (data.success) {
                // Update local state
                setAccounts(prevAccounts =>
                    prevAccounts.map(account =>
                        account.id === accountId
                            ? {
                                ...account,
                                pages: account.pages.map(page =>
                                    page.id === pageId ? { ...page, subscribed } : page
                                )
                            }
                            : account
                    )
                );
            } else {
                throw new Error(data.message || 'Failed to update subscription');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Subscription update failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAccount = () => {
        setModalState({ isOpen: true, type: 'connect' });
    };

    const handleReconnect = async (accountId: string) => {
        setLoading(true);
        setError(null);

        try {
            // Redirect to Facebook OAuth for reconnection
            const response = await fetch(`${window.location.origin}/api/fb/auth/start?tenantId=org-1`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to start Facebook authentication');
            }

            const data = await response.json();

            if (data.success && data.authUrl) {
                // Redirect to Facebook OAuth
                window.location.href = data.authUrl;
            } else {
                throw new Error(data.message || 'Failed to get authentication URL');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Reconnection failed');
            setLoading(false);
        }
    };

    // Mapping management handlers
    const handleCreateMapping = async (mappingData: any) => {
        setLoading(true);
        setError(null);

        try {
            const formId = `form_${Date.now()}`; // Generate a unique form ID
            const pageId = mappingData.pageId;

            // Save field mappings to backend
            const response = await fetch(`${window.location.origin}/api/fb/forms/${formId}/map`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    pageId,
                    tenantId: 'org-1', // Fixed tenant ID
                    fieldMapping: fieldMappings
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save mapping');
            }

            const data = await response.json();

            if (data.success) {
                if (editingMapping) {
                    // Update existing mapping
                    setMappings(prevMappings =>
                        prevMappings.map(mapping =>
                            mapping.id === editingMapping.id
                                ? {
                                    ...mapping,
                                    name: mappingData.name,
                                    accountId: mappingData.accountId,
                                    pageId: mappingData.pageId,
                                    formId: mappingData.formId,
                                    accountName: accounts.find(acc => acc.id === mappingData.accountId)?.name || '',
                                    pageName: accounts.find(acc => acc.id === mappingData.accountId)?.pages.find(p => p.id === mappingData.pageId)?.name || '',
                                    formName: forms.find(f => f.formId === mappingData.formId)?.formName || '',
                                    destination: mappingData.destination
                                }
                                : mapping
                        )
                    );
                    alert('Mapping updated successfully!');
                } else {
                    // Create new mapping
                    const newMapping: FacebookMapping = {
                        id: `mapping-${Date.now()}`,
                        name: mappingData.name,
                        accountId: mappingData.accountId,
                        pageId: mappingData.pageId,
                        formId: mappingData.formId,
                        accountName: accounts.find(acc => acc.id === mappingData.accountId)?.name || '',
                        pageName: accounts.find(acc => acc.id === mappingData.accountId)?.pages.find(p => p.id === mappingData.pageId)?.name || '',
                        formName: forms.find(f => f.formId === mappingData.formId)?.formName || '',
                        destination: mappingData.destination,
                        fieldMappings: fieldMappings,
                        lastLead: 'Never',
                        status: 'active'
                    };

                    setMappings(prevMappings => [...prevMappings, newMapping]);
                    alert('Mapping created successfully!');
                }

                // Refresh mappings from API
                await fetchMappings();
            } else {
                throw new Error(data.message || 'Failed to save mapping');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save mapping');
        } finally {
            setLoading(false);
        }

        setShowCreateMappingModal(false);
        setEditingMapping(null);
        setMappingForm({ name: '', accountId: '', pageId: '', formId: '', destination: '' });
    };

    const handleSaveMapping = () => {
        if (!mappingForm.name || !mappingForm.accountId || !mappingForm.pageId || !mappingForm.formId || !mappingForm.destination) {
            alert('Please fill in all required fields');
            return;
        }

        if (!isMappingValid) {
            alert(`Please map all mandatory fields first:\n${unmappedMandatoryFields.join(', ')}`);
            return;
        }

        handleCreateMapping(mappingForm);
    };

    // Reset form when modal opens
    const handleOpenCreateMappingModal = () => {
        setEditingMapping(null);
        setMappingForm({ name: '', accountId: '', pageId: '', formId: '', destination: '' });
        setShowCreateMappingModal(true);
    };

    const handleEditMapping = (mappingId: string) => {
        const mappingToEdit = mappings.find(mapping => mapping.id === mappingId);
        if (mappingToEdit) {
            setEditingMapping(mappingToEdit);
            setMappingForm({
                name: mappingToEdit.name,
                accountId: mappingToEdit.accountId,
                pageId: mappingToEdit.pageId,
                formId: mappingToEdit.formId || '',
                destination: mappingToEdit.destination
            });
            // Fetch forms for the selected page
            if (mappingToEdit.pageId) {
                fetchForms(mappingToEdit.pageId);
            }
            setShowCreateMappingModal(true);
        }
    };

    const handleDeleteMapping = async (mappingId: string) => {
        if (!window.confirm('Are you sure you want to delete this mapping?')) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const mapping = mappings.find(m => m.id === mappingId);
            if (!mapping) return;

            const response = await fetch(`${window.location.origin}/api/fb/forms/${mapping.formId}/map`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    tenantId: 'org-1' // Fixed tenant ID
                })
            });

            if (!response.ok) {
                throw new Error('Failed to delete mapping');
            }

            const data = await response.json();

            if (data.success) {
                setMappings(prevMappings => prevMappings.filter(mapping => mapping.id !== mappingId));
                alert('Mapping deleted successfully!');
                // Refresh mappings from API
                await fetchMappings();
            } else {
                throw new Error(data.message || 'Failed to delete mapping');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete mapping');
        } finally {
            setLoading(false);
        }
    };

    // Sync functionality handlers
    const handleOpenSyncModal = () => {
        setSyncForm({ accountId: '', formId: '', pageId: '', since: '', until: '' });
        setSyncResults(null);
        setShowSyncModal(true);
    };

    const handleSyncLeads = async () => {
        if (!syncForm.formId || !syncForm.pageId) {
            alert('Please select a form and page');
            return;
        }

        setSyncLoading(true);
        setSyncResults(null);

        try {
            const response = await fetch(`${window.location.origin}/api/fb/sync/backfill`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    formId: syncForm.formId,
                    pageId: syncForm.pageId,
                    tenantId: 'org-1', // Fixed tenant ID
                    since: syncForm.since || undefined,
                    until: syncForm.until || undefined
                })
            });

            if (!response.ok) {
                throw new Error('Failed to sync leads');
            }

            const data = await response.json();

            if (data.success) {
                setSyncResults(data.results);
                alert(`Successfully synced ${data.results.length} leads`);
            } else {
                throw new Error(data.message || 'Failed to sync leads');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sync failed');
        } finally {
            setSyncLoading(false);
        }
    };

    return (
        <div className="space-y-8 h-full flex flex-col min-h-0 bg-surface px-6 py-4">
            {/* Header */}
            <div className="flex items-center justify-between bg-surface border-b border-muted">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/settings/integrations')}
                        className="p-2 hover:bg-muted text-subtle hover:text-on-surface rounded-lg transition-colors"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-on-surface">Facebook Integration</h1>
                        <p className="text-subtle mt-1">Connect your Facebook Lead Forms to automatically capture leads</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${currentSetting?.isConnected ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {currentSetting?.isConnected ? 'Connected' : 'Not Connected'}
                    </span>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-muted bg-surface">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('account')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'account'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-subtle hover:text-on-surface hover:border-muted'
                        }`}
                    >
                        Account Management
                    </button>
                    <button
                        onClick={() => setActiveTab('mapping')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'mapping'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-subtle hover:text-on-surface hover:border-muted'
                        }`}
                    >
                        Field Mapping
                    </button>
                    <button
                        onClick={() => setActiveTab('activity-log')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'activity-log'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-subtle hover:text-on-surface hover:border-muted'
                        }`}
                    >
                        Activity Log
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto px-2">
                {activeTab === 'account' && (
                    <div className="space-y-6 mx-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-on-surface">Connected Accounts</h3>
                                <p className="text-subtle mt-1">Manage your connected Facebook accounts and pages.</p>
                            </div>
                            <button
                                onClick={handleAddAccount}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
                            >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                                Add Account
                            </button>
                        </div>

                        {loading && (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="ml-2 text-on-surface">Loading...</span>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center">
                                    <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-red-800 text-sm">{error}</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* Connected Facebook Accounts */}
                            {accounts.length > 0 ? (
                                accounts.map(account => (
                                    <div key={account.id} className="bg-background rounded-lg border border-muted p-6 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                                    </svg>
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                                                </div>
                                                <h4 className="font-semibold text-on-surface">{account.name}</h4>
                                            </div>
                                            <button
                                                onClick={() => handleDisconnectAccount(account.id)}
                                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg text-sm transition-colors"
                                            >
                                                Disconnect
                                            </button>
                                        </div>

                                        <div className="space-y-4 ml-11">
                                            {/* Collapsible Pages Header */}
                                            <div className="flex items-center justify-between mb-2">
                                                <h5 className="font-medium text-on-surface">Connected Pages ({account.pages?.length || 0})</h5>
                                                <button
                                                    onClick={() => setIsPagesExpanded(!isPagesExpanded)}
                                                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                                                >
                                                    {isPagesExpanded ? 'Collapse' : 'Expand'}
                                                    <svg
                                                        className={`h-4 w-4 transition-transform ${isPagesExpanded ? 'rotate-180' : ''}`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            </div>

                                            {/* Collapsible Pages List */}
                                            {isPagesExpanded && (
                                                <>
                                                    {account.pages && account.pages.length > 0 ? (
                                                        account.pages.map((page: any) => (
                                                            <div key={page.id} className="flex items-center justify-between py-3 border-t border-muted/50">
                                                                <div>
                                                                    <div className="font-medium text-on-surface">{page.name}</div>
                                                                    <div className="text-sm text-subtle">Page ID: {page.id}</div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`text-xs px-2 py-1 rounded-full ${page.subscribed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                                        {page.subscribed ? 'Subscribed' : 'Not Subscribed'}
                                                                    </span>
                                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                                    <input
                                                                            type="checkbox"
                                                                            checked={page.subscribed || false}
                                                                            onChange={(e) => handleSubscriptionToggle(account.id, page.id, e.target.checked)}
                                                                            disabled={loading}
                                                                            className="sr-only peer"
                                                                        />
                                                                        <div className={`w-10 h-5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 ${page.subscribed ? 'bg-primary-600' : 'bg-muted'}`}></div>
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-4 text-subtle">
                                                            <p>No Facebook pages found for this account.</p>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-subtle bg-muted/20 rounded-lg">
                                    <svg className="h-12 w-12 mx-auto mb-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <p>No Facebook accounts connected.</p>
                                    <p className="text-sm mt-1">Use the "Add Account" button above to connect an account.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'mapping' && (
                    <div className="space-y-6 mx-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-on-surface">Field Mappings</h3>
                                <p className="text-subtle mt-1">Map your Facebook Lead Form fields to your CRM.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleOpenSyncModal}
                                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Sync Leads
                                </button>
                                <button className="bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm hover:shadow-md flex items-center gap-2">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    Send Test Lead
                                </button>
                                <button
                                    onClick={handleOpenCreateMappingModal}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Create New Mapping
                                </button>
                            </div>
                        </div>

                        <div className="bg-background rounded-lg border border-muted shadow-sm overflow-hidden mx-4">
                            {/* Table Header */}
                            <div className="bg-muted/30 px-6 py-4 border-b border-muted">
                                <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-on-surface">
                                    <div className="col-span-1"></div>
                                    <div className="col-span-3">MAPPING NAME</div>
                                    <div className="col-span-4">SOURCE FORM</div>
                                    <div className="col-span-2">DESTINATION</div>
                                    <div className="col-span-2">LAST LEAD</div>
                                </div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-muted">
                                {/* Real Mappings Data */}
                                {mappings.length > 0 ? (
                                    mappings.map(mapping => (
                                        <div key={mapping.id} className="px-6 py-4 hover:bg-muted/20 transition-colors">
                                            <div className="grid grid-cols-12 gap-4 items-center text-sm">
                                                <div className="col-span-1 flex justify-center">
                                                    <div className={`w-3 h-3 rounded-full ${mapping.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                </div>
                                                <div className="col-span-3">
                                                    <div className="font-medium text-on-surface">{mapping.name}</div>
                                                </div>
                                                <div className="col-span-4">
                                                    <div className="text-on-surface">{mapping.pageName} Form</div>
                                                    <div className="text-xs text-subtle mt-1">{mapping.accountName}, {mapping.pageName}</div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="font-medium text-on-surface">{mapping.destination}</div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="text-on-surface">{mapping.lastLead === 'Never' ? 'Never' : mapping.lastLead.split(',')[0]}</div>
                                                            <div className="text-xs text-subtle">{mapping.lastLead === 'Never' ? '' : mapping.lastLead.split(',')[1]}</div>
                                                        </div>
                                                        <div className="flex items-center gap-1 ml-2">
                                                            <button
                                                                onClick={() => handleEditMapping(mapping.id)}
                                                                className="p-1 text-subtle hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                                                title="Edit Mapping"
                                                            >
                                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteMapping(mapping.id)}
                                                                className="p-1 text-subtle hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                title="Delete Mapping"
                                                            >
                                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    /* Show message when no mappings exist */
                                    <div className="px-6 py-8 text-center">
                                        <div className="mx-auto h-12 w-12 bg-muted/50 rounded-lg flex items-center justify-center mb-4">
                                            <svg className="h-6 w-6 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                        </div>
                                        <h4 className="text-lg font-semibold text-on-surface mb-2">No mappings yet</h4>
                                        <p className="text-subtle mb-6">Create your first field mapping to start syncing Facebook leads to your CRM.</p>
                                        <button
                                            onClick={() => setShowCreateMappingModal(true)}
                                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm hover:shadow-md"
                                        >
                                            Create Your First Mapping
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                )}

                {activeTab === 'activity-log' && (
                    <div className="space-y-6 mx-4">
                        <div>
                            <h3 className="text-xl font-bold text-on-surface">Activity Log</h3>
                            <p className="text-subtle mt-1">Monitor lead sync activities and webhook deliveries.</p>
                        </div>

                        {/* Advanced Filters */}
                        <div className="bg-background rounded-lg border border-muted p-4 shadow-sm">
                            <h4 className="font-semibold text-on-surface mb-4">Advanced Filters</h4>

                            {/* Filter Row */}
                            <div className="flex items-center gap-3 mb-4">
                                <select className="px-3 py-2 border border-muted rounded-lg bg-background text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[140px]">
                                    <option>Lead Details</option>
                                    <option>Status</option>
                                    <option>Mapping Name</option>
                                    <option>Email</option>
                                    <option>Phone</option>
                                </select>

                                <select className="px-3 py-2 border border-muted rounded-lg bg-background text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[100px]">
                                    <option>Contains</option>
                                    <option>Equals</option>
                                    <option>Starts with</option>
                                    <option>Ends with</option>
                                </select>

                                <input
                                    type="text"
                                    placeholder="Enter value..."
                                    className="flex-1 px-3 py-2 border border-muted rounded-lg bg-background text-on-surface placeholder-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />

                                <button className="p-2 text-subtle hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>

                            <button className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-sm hover:shadow-md flex items-center gap-2 text-sm">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add Condition
                            </button>
                        </div>

                        {/* Activity Table */}
                        <div className="bg-background rounded-lg border border-muted shadow-sm overflow-hidden">
                            {/* Table Header */}
                            <div className="bg-muted/30 px-6 py-4 border-b border-muted">
                                <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-on-surface">
                                    <div className="col-span-2">STATUS</div>
                                    <div className="col-span-2">TIMESTAMP</div>
                                    <div className="col-span-3">MAPPING & FORM</div>
                                    <div className="col-span-3">LEAD DETAILS</div>
                                    <div className="col-span-2">ERROR / ACTION</div>
                                </div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-muted">
                                {/* Success Row */}
                                <div className="px-6 py-4 hover:bg-muted/20 transition-colors">
                                    <div className="grid grid-cols-12 gap-4 items-center text-sm">
                                        <div className="col-span-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                <span className="text-green-600 font-medium">Success</span>
                                            </div>
                                        </div>
                                        <div className="col-span-2 text-on-surface">10/19/2025, 6:36:41 PM</div>
                                        <div className="col-span-3">
                                            <div className="font-medium text-on-surface">Winter Sale Leads</div>
                                            <div className="text-xs text-subtle">Winter Sale 2024 Form</div>
                                        </div>
                                        <div className="col-span-3">
                                            <div className="text-on-surface">John Doe (john.doe@example.com)</div>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-subtle">-</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Failed Row */}
                                <div className="px-6 py-4 hover:bg-muted/20 transition-colors">
                                    <div className="grid grid-cols-12 gap-4 items-center text-sm">
                                        <div className="col-span-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                <span className="text-red-600 font-medium">Failed</span>
                                            </div>
                                        </div>
                                        <div className="col-span-2 text-on-surface">10/19/2025, 5:36:41 PM</div>
                                        <div className="col-span-3">
                                            <div className="font-medium text-on-surface">Winter Sale Leads</div>
                                            <div className="text-xs text-subtle">Winter Sale 2024 Form</div>
                                        </div>
                                        <div className="col-span-3">
                                            <div className="text-on-surface">Jane Smith (jane.smith@example.com)</div>
                                        </div>
                                        <div className="col-span-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-red-600 text-xs">CRM API Error: Invalid email address.</span>
                                                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-2 rounded text-xs transition-colors">
                                                    Retry
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Success Row */}
                                <div className="px-6 py-4 hover:bg-muted/20 transition-colors">
                                    <div className="grid grid-cols-12 gap-4 items-center text-sm">
                                        <div className="col-span-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                <span className="text-green-600 font-medium">Success</span>
                                            </div>
                                        </div>
                                        <div className="col-span-2 text-on-surface">10/19/2025, 4:36:41 PM</div>
                                        <div className="col-span-3">
                                            <div className="font-medium text-on-surface">Newsletter Subscribers</div>
                                            <div className="text-xs text-subtle">Newsletter Signup Form</div>
                                        </div>
                                        <div className="col-span-3">
                                            <div className="text-on-surface">Peter Jones (peter.jones@example.com)</div>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-subtle">-</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Load More */}
                            <div className="text-center py-6 border-t border-muted">
                                <button className="bg-muted hover:bg-muted/80 text-on-surface font-medium py-2 px-6 rounded-lg transition-colors">
                                    Load More Activities
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Connection Modal */}
            {modalState.isOpen && modalState.type === 'connect' && currentSetting && (
                <FacebookConnectModal
                    setting={currentSetting}
                    onClose={handleCloseModal}
                    onSave={(details) => handleSaveConnection('Facebook', details)}
                    onDisconnect={() => handleDisconnect('Facebook')}
                    onSendTestLead={(formName) => onSendTestLead('Facebook', formName)}
                />
            )}

            {/* Create Mapping Modal */}
            {showCreateMappingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <div className="bg-background rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col ring-1 ring-inset ring-muted/50">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-8 border-b border-muted flex-shrink-0">
                            <h2 className="text-xl font-bold text-on-surface">{editingMapping ? 'Edit Mapping' : 'Create New Mapping'}</h2>
                            <button
                                onClick={() => {
                                    setShowCreateMappingModal(false);
                                    setEditingMapping(null);
                                    setMappingForm({ name: '', accountId: '', pageId: '', formId: '', destination: '' });
                                }}
                                className="text-subtle hover:text-on-surface p-1 rounded-full hover:bg-muted transition-colors"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 overflow-y-auto flex-grow">
                            <div className="space-y-6">
                                {/* Mapping Name */}
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-2">
                                        Mapping Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter mapping name"
                                        value={mappingForm.name}
                                        onChange={(e) => setMappingForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-on-surface placeholder-subtle focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>

                                {/* Facebook Configuration */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-2">
                                            Facebook Account
                                        </label>
                                        <select
                                            value={mappingForm.accountId}
                                            onChange={(e) => setMappingForm(prev => ({ ...prev, accountId: e.target.value, pageId: '' }))}
                                            className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            <option value="">Select Account</option>
                                            {accounts.map(account => (
                                                <option key={account.id} value={account.id}>{account.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-2">
                                            Facebook Page
                                        </label>
                                        <select
                                            value={mappingForm.pageId}
                                            onChange={(e) => {
                                                const pageId = e.target.value;
                                                setMappingForm(prev => ({ ...prev, pageId, formId: '' }));
                                                if (pageId) {
                                                    fetchForms(pageId);
                                                } else {
                                                    setForms([]);
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            <option value="">Select Page</option>
                                            {accounts.find(account => account.id === mappingForm.accountId)?.pages
                                                .filter(page => page.subscribed)
                                                .map(page => (
                                                    <option key={page.id} value={page.id}>{page.name}</option>
                                                )) || []}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-2">
                                            Facebook Form
                                        </label>
                                        <select
                                            value={mappingForm.formId || ''}
                                            onChange={(e) => {
                                                const formId = e.target.value;
                                                setMappingForm(prev => ({ ...prev, formId }));
                                                if (formId) {
                                                    fetchFacebookFields(formId);
                                                } else {
                                                    setFacebookFields([]);
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            <option value="">Select Form</option>
                                            {forms.map(form => (
                                                <option key={form.formId} value={form.formId}>{form.formName}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* CRM Destination */}
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-2">
                                        CRM Destination
                                    </label>
                                    <select
                                        value={mappingForm.destination}
                                        onChange={(e) => setMappingForm(prev => ({ ...prev, destination: e.target.value }))}
                                        className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value="">Select Destination</option>
                                        <option value="Sales Pipeline">Sales Pipeline</option>
                                        <option value="Marketing List">Marketing List</option>
                                        <option value="Demo Pipeline">Demo Pipeline</option>
                                        <option value="Support Queue">Support Queue</option>
                                    </select>
                                </div>

                                {/* Field Mapping Interface */}
                                {mappingForm.formId && facebookFields.length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-on-surface mb-4">Field Mapping</h4>
                                        <FacebookFieldMapping
                                            facebookFields={facebookFields}
                                            crmFields={crmFields}
                                            initialMappings={fieldMappings}
                                            onMappingsChange={setFieldMappings}
                                            onValidationChange={handleValidationChange}
                                            salesPipelineStages={['New Lead', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']}
                                        />
                                    </div>
                                )}

                                {mappingForm.formId && facebookFields.length === 0 && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                        <div className="flex items-center">
                                            <svg className="h-5 w-5 text-amber-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-amber-800 text-sm">
                                                No form fields found for the selected form. The form might not have any questions configured.
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Deduplication Strategy */}
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-2">
                                        Deduplication Strategy
                                    </label>
                                    <select className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                                        <option>None</option>
                                        <option>Email Match</option>
                                        <option>Phone Match</option>
                                        <option>Email + Phone Match</option>
                                        <option>Skip Duplicate</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 p-8 border-t border-muted bg-muted/30">
                            <button
                                onClick={() => setShowCreateMappingModal(false)}
                                className="px-4 py-2 text-subtle hover:text-on-surface font-medium rounded-lg hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveMapping}
                                disabled={!isMappingValid}
                                className={`font-bold py-2 px-4 rounded-lg transition-colors shadow-sm hover:shadow-md ${
                                    isMappingValid
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {editingMapping ? 'Update Mapping' : 'Save Mapping'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sync Leads Modal */}
            {showSyncModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col ring-1 ring-inset ring-muted/50">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b border-muted flex-shrink-0">
                            <h2 className="text-xl font-bold text-on-surface">Sync Facebook Leads</h2>
                            <button
                                onClick={() => setShowSyncModal(false)}
                                className="text-subtle hover:text-on-surface p-1 rounded-full hover:bg-muted transition-colors"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-grow">
                            <div className="space-y-6">
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <h4 className="font-semibold text-blue-900 mb-2">Sync Historical Leads</h4>
                                    <p className="text-sm text-blue-800">
                                        Import leads from your Facebook Lead Forms that were created before setting up the webhook integration.
                                    </p>
                                </div>

                                {/* Sync Configuration */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-2">
                                            Facebook Account
                                        </label>
                                        <select
                                            value={syncForm.accountId || ''}
                                            onChange={(e) => setSyncForm(prev => ({ ...prev, accountId: e.target.value, pageId: '', formId: '' }))}
                                            className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            <option value="">Select Account</option>
                                            {accounts.map(account => (
                                                <option key={account.id} value={account.id}>{account.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-2">
                                            Facebook Page
                                        </label>
                                        <select
                                            value={syncForm.pageId}
                                            onChange={(e) => {
                                                const pageId = e.target.value;
                                                setSyncForm(prev => ({ ...prev, pageId, formId: '' }));
                                                if (pageId) {
                                                    fetchForms(pageId);
                                                } else {
                                                    setForms([]);
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            <option value="">Select Page</option>
                                            {accounts.find(account => account.id === syncForm.accountId)?.pages
                                                .filter(page => page.subscribed)
                                                .map(page => (
                                                    <option key={page.id} value={page.id}>{page.name}</option>
                                                )) || []}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-2">
                                        Facebook Form
                                    </label>
                                    <select
                                        value={syncForm.formId}
                                        onChange={(e) => setSyncForm(prev => ({ ...prev, formId: e.target.value }))}
                                        className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value="">Select Form</option>
                                        {forms.map(form => (
                                            <option key={form.formId} value={form.formId}>{form.formName}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date Range */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-2">
                                            From Date (optional)
                                        </label>
                                        <input
                                            type="date"
                                            value={syncForm.since}
                                            onChange={(e) => setSyncForm(prev => ({ ...prev, since: e.target.value }))}
                                            className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-2">
                                            To Date (optional)
                                        </label>
                                        <input
                                            type="date"
                                            value={syncForm.until}
                                            onChange={(e) => setSyncForm(prev => ({ ...prev, until: e.target.value }))}
                                            className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>

                                {/* Sync Results */}
                                {syncResults && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-green-900 mb-3">Sync Results</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-green-800">Total processed:</span>
                                                <span className="font-medium text-green-900">{syncResults.length}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-green-800">Successfully synced:</span>
                                                <span className="font-medium text-green-900">{syncResults.filter((r: any) => r.status === 'saved').length}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-green-800">Skipped (duplicates):</span>
                                                <span className="font-medium text-green-900">{syncResults.filter((r: any) => r.status === 'skipped').length}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-green-800">Errors:</span>
                                                <span className="font-medium text-red-600">{syncResults.filter((r: any) => r.status === 'error').length}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-center">
                                            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-red-800 text-sm">{error}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 p-6 border-t border-muted bg-muted/30">
                            <button
                                onClick={() => setShowSyncModal(false)}
                                className="px-4 py-2 text-subtle hover:text-on-surface font-medium rounded-lg hover:bg-muted transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleSyncLeads}
                                disabled={syncLoading || !syncForm.formId || !syncForm.pageId}
                                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
                            >
                                {syncLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Syncing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Start Sync
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacebookIntegrationPage;


