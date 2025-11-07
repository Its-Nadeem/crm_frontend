import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IntegrationSettings, IntegrationSource } from '../../types';
import { apiService } from '../../src/services/api';
import { useToast } from '../../src/components/ui/Toast';

// Add Form Modal Component
const AddFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, url: string) => void;
    isLoading?: boolean;
}> = ({ isOpen, onClose, onSubmit, isLoading = false }) => {
    const [formName, setFormName] = useState('');
    const [formUrl, setFormUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formName.trim() && formUrl.trim()) {
            onSubmit(formName.trim(), formUrl.trim());
        }
    };

    const handleClose = () => {
        setFormName('');
        setFormUrl('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-2 sm:pt-4 sm:px-4 sm:pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={handleClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-surface rounded-lg sm:rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle w-full max-w-lg sm:max-w-lg mx-2 border border-muted">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-surface px-3 sm:px-4 pt-3 sm:pt-5 pb-3 sm:pb-4">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <h3 className="text-base sm:text-lg leading-6 font-medium text-on-surface pr-4">Add New Form</h3>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-shrink-0 p-1 rounded-md text-subtle hover:text-on-surface hover:bg-muted transition-colors"
                                    aria-label="Close modal"
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="formName" className="block text-sm font-medium text-on-surface mb-2">
                                        Form Name
                                    </label>
                                    <input
                                        type="text"
                                        id="formName"
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        className="w-full px-3 py-2 border border-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-background text-on-surface"
                                        placeholder="e.g., Contact Form, Newsletter Signup"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="formUrl" className="block text-sm font-medium text-on-surface mb-2">
                                        Form URL
                                    </label>
                                    <input
                                        type="url"
                                        id="formUrl"
                                        value={formUrl}
                                        onChange={(e) => setFormUrl(e.target.value)}
                                        className="w-full px-3 py-2 border border-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-background text-on-surface"
                                        placeholder="https://example.com/contact-form"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-background px-3 sm:px-4 py-3 sm:py-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isLoading}
                                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-subtle hover:text-on-surface hover:bg-muted border border-muted rounded-lg transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || !formName.trim() || !formUrl.trim()}
                                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                            >
                                {isLoading ? 'Adding...' : 'Add Form'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Confirm Modal Component
const ConfirmModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    type?: 'danger' | 'warning' | 'info';
}> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isLoading = false,
    type = 'danger'
}) => {
    if (!isOpen) return null;

    const typeStyles = {
        danger: {
            button: 'bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white',
            icon: 'text-red-600 dark:text-red-400'
        },
        warning: {
            button: 'bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white',
            icon: 'text-amber-600 dark:text-amber-400'
        },
        info: {
            button: 'bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white',
            icon: 'text-primary-600 dark:text-primary-400'
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-2 sm:pt-4 sm:px-4 sm:pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={onClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-surface rounded-lg sm:rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle w-full max-w-lg sm:max-w-lg mx-2 border border-muted">
                    <div className="bg-surface px-3 sm:px-4 pt-3 sm:pt-5 pb-3 sm:pb-4">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h3 className="text-base sm:text-lg leading-6 font-medium text-on-surface pr-4">{title}</h3>
                            <button
                                onClick={onClose}
                                className="flex-shrink-0 p-1 rounded-md text-subtle hover:text-on-surface hover:bg-muted transition-colors"
                                aria-label="Close modal"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 ${typeStyles[type].icon}`}>
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {type === 'danger' && (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    )}
                                    {type === 'warning' && (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    )}
                                    {type === 'info' && (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    )}
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-on-surface">{message}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-background px-3 sm:px-4 py-3 sm:py-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-subtle hover:text-on-surface hover:bg-muted border border-muted rounded-lg transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed ${typeStyles[type].button}`}
                        >
                            {isLoading ? 'Processing...' : confirmText}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};

interface WebsiteIntegrationPageProps {
    settings: IntegrationSettings[];
    setSettings: React.Dispatch<React.SetStateAction<IntegrationSettings[]>>;
    customFieldDefs: any[];
    currentOrganization: any;
    onSendTestLead: (source: IntegrationSource, formName: string) => void;
}

export const WebsiteIntegrationPage: React.FC<WebsiteIntegrationPageProps> = ({
    settings,
    setSettings,
    customFieldDefs,
    currentOrganization,
    onSendTestLead
}) => {
    const navigate = useNavigate();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [trackingCode, setTrackingCode] = useState('');
    const [forms, setForms] = useState<any[]>([]);
    const [integration, setIntegration] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showAddFormModal, setShowAddFormModal] = useState(false);
    const [showDisconnectModal, setShowDisconnectModal] = useState(false);

    const currentSetting = settings.find(s => s.source === 'Website');

    // Load website integration data when component mounts or integration changes
    useEffect(() => {
        if (currentSetting?.isConnected) {
            loadWebsiteData();
        }
    }, [currentSetting]);

    const loadWebsiteData = async () => {
        if (!currentSetting) return;

        setIsLoading(true);
        setError(null);
        try {
            console.log('Loading website data for organization:', currentOrganization?.id);

            // Get integration details
            const integrations = await apiService.getWebsiteIntegrations();
            console.log('Found integrations:', integrations.length, integrations.map(i => ({ id: i._id, source: i.source })));

            const websiteIntegration = integrations.find((i: any) => i.source === 'Website');
            if (websiteIntegration) {
                console.log('Found website integration:', websiteIntegration._id);
                setIntegration(websiteIntegration);

                // Load tracking code if available
                if (websiteIntegration.additionalSettings?.trackingScript) {
                    setTrackingCode(websiteIntegration.additionalSettings.trackingScript);
                }

                // Load domains
                if (websiteIntegration.connectedWebsites) {
                    setSelectedDomains(websiteIntegration.connectedWebsites);
                }

                // Load analytics data
                try {
                    const analyticsData = await apiService.getWebsiteAnalytics(websiteIntegration._id);
                    setAnalytics(analyticsData);
                } catch (analyticsError) {
                    console.warn('Failed to load analytics:', analyticsError);
                }

                // Load forms data
                try {
                    const formsData = await apiService.getWebsiteFormPerformance(websiteIntegration._id);
                    // Use backend forms data if available, otherwise use local tracked forms
                    if (formsData && formsData.length > 0) {
                        setForms(formsData);
                    } else if (websiteIntegration.additionalSettings?.trackedForms) {
                        setForms(websiteIntegration.additionalSettings.trackedForms);
                    } else {
                        setForms([]);
                    }
                } catch (formsError) {
                    console.warn('Failed to load forms:', formsError);
                    // Fallback to local tracked forms if backend fails
                    if (websiteIntegration.additionalSettings?.trackedForms) {
                        setForms(websiteIntegration.additionalSettings.trackedForms);
                    }
                }
            } else {
                console.log('No website integration found');
            }
        } catch (error) {
            console.error('Failed to load website data:', error);
            setError(error.message || 'Failed to load website data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const showSuccess = (message: string) => {
        setSuccess(message);
        setTimeout(() => setSuccess(null), 5000);
    };

    const showError = (message: string) => {
        setError(message);
        setTimeout(() => setError(null), 5000);
    };

    const handleGenerateTrackingCode = async () => {
        setIsGenerating(true);
        try {
            console.log('Starting tracking code generation...');
            console.log('Current organization:', currentOrganization?.id);
            console.log('Current integration:', integration?._id);

            if (!currentOrganization?.id) {
                throw new Error('Organization ID is required');
            }

            // Create website integration if it doesn't exist
            let websiteIntegration;
            if (!integration) {
                console.log('Creating new website integration...');
                websiteIntegration = await apiService.createWebsiteIntegration({
                    name: 'Website Integration',
                    domains: selectedDomains,
                    apiEndpoint: `${window.location.origin}/api`
                    // organizationId is handled by the backend from the authenticated user
                });
                console.log('Created integration:', websiteIntegration?._id);
                setIntegration(websiteIntegration);
            } else {
                websiteIntegration = integration;
                console.log('Using existing integration:', websiteIntegration._id);
            }

            // Generate tracking code with organization context
            console.log('Generating tracking code for integration:', websiteIntegration._id);
            const result = await apiService.generateWebsiteTrackingCode(websiteIntegration._id, {
                domains: selectedDomains,
                apiEndpoint: `${window.location.origin}/api`
                // organizationId is handled by the backend from the authenticated user
            });

            console.log('Tracking code generation result:', result);
            console.log('Result keys:', Object.keys(result || {}));
            console.log('Has trackingScript:', !!(result && result.trackingScript));
            console.log('Tracking script length:', result?.trackingScript?.length || 0);

            if (result && result.trackingScript && result.trackingScript.trim().length > 0) {
                setTrackingCode(result.trackingScript);
                showSuccess('Tracking code generated successfully!');
            } else {
                console.error('No tracking script in result:', result);
                console.error('Result details:', {
                    hasResult: !!result,
                    hasTrackingScript: !!(result && result.trackingScript),
                    trackingScriptLength: result?.trackingScript?.length || 0,
                    trackingScriptContent: result?.trackingScript?.substring(0, 200) || 'empty'
                });
                throw new Error('No tracking script returned from server');
            }
        } catch (error) {
            console.error('Failed to generate tracking code:', error);
            showError(error.message || 'Failed to generate tracking code. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(trackingCode);
        // You could add a toast notification here
    };

    const handleSaveConnection = (source: IntegrationSource, details: Partial<IntegrationSettings>) =>
        setSettings(prev => prev.map(s => s.source === source ? { ...s, ...details } : s));

    const handleDisconnect = () => {
        setShowDisconnectModal(true);
    };

    const handleDisconnectConfirm = async () => {
        if (!integration) return;

        try {
            setIsLoading(true);

            // Call backend API to deactivate the integration
            await apiService.deactivateWebsiteIntegration(integration._id);

            // Update local state
            setSettings(prev => prev.map(s => s.source === 'Website' ? {...s, isConnected: false, connectedAccounts: [], connectedWebsites: []} : s));

            // Clear local integration data
            setIntegration(null);
            setTrackingCode('');
            setForms([]);
            setAnalytics(null);
            setSelectedDomains([]);
            setShowDisconnectModal(false);

            showSuccess('Website integration disconnected successfully!');
        } catch (error) {
            console.error('Failed to disconnect integration:', error);
            showError(error.message || 'Failed to disconnect integration. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleForm = async (formId: string) => {
        if (!integration) return;

        try {
            const form = forms.find(f => f.id === formId);
            if (!form) return;

            const newStatus = form.status === 'Active' ? 'Inactive' : 'Active';

            setIsLoading(true);
            const result = await apiService.updateWebsiteForm(integration._id, formId, {
                status: newStatus
            });

            if (result.success) {
                // Refresh forms data to get updated list
                await loadWebsiteData();
                showSuccess(`Form status updated to ${newStatus}`);
            } else {
                showError(result.message || 'Failed to update form status');
            }
        } catch (error) {
            console.error('Failed to toggle form status:', error);
            showError(error.message || 'Failed to update form status. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshData = async () => {
        await loadWebsiteData();
    };

    const handleTestConnection = async () => {
        if (!integration) return;

        try {
            setIsLoading(true);
            const result = await apiService.testWebsiteIntegration(integration._id);

            if (result.accessible) {
                showSuccess('Website integration test successful!');
                // Refresh data after successful test
                await loadWebsiteData();
            } else {
                showError('Website integration test failed. Please check your tracking code installation.');
            }
        } catch (error) {
            console.error('Failed to test connection:', error);
            showError(error.message || 'Failed to test connection. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddDomain = () => {
        const domain = window.prompt('Enter domain name (e.g., https://example.com):');
        if (domain && !selectedDomains.includes(domain)) {
            setSelectedDomains(prev => [...prev, domain]);
        }
    };

    const handleRemoveDomain = (domain: string) => {
        setSelectedDomains(prev => prev.filter(d => d !== domain));
    };

    const handleAddForm = () => {
        setShowAddFormModal(true);
    };

    const handleAddFormSubmit = async (formName: string, formUrl: string) => {
        if (!integration) return;

        try {
            setIsLoading(true);
            const result = await apiService.addWebsiteForm(integration._id, {
                name: formName,
                url: formUrl
            });

            if (result.success) {
                // Refresh forms data to get updated list
                await loadWebsiteData();
                showSuccess(`Form "${formName}" added successfully!`);
                setShowAddFormModal(false);
            } else {
                showError(result.message || 'Failed to add form');
            }
        } catch (error) {
            console.error('Failed to add form:', error);
            showError(error.message || 'Failed to add form. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/settings/integrations')}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-on-surface">Website Integration</h1>
                        <p className="text-subtle mt-1">Track website forms and capture leads automatically</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${currentSetting?.isConnected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                        {currentSetting?.isConnected ? 'Connected' : 'Not Connected'}
                    </span>
                </div>
            </div>

            {/* Success and Error Messages */}
            {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
                    <div className="text-green-600 dark:text-green-400">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">Success</p>
                        <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
                    </div>
                    <button
                        onClick={() => setSuccess(null)}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                    <div className="text-red-600 dark:text-red-400">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tracking Code Section */}
                <div className="bg-surface rounded-lg border border-muted p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-on-surface">Tracking Code</h3>
                            <p className="text-subtle text-sm">Install this code on your website to track forms</p>
                        </div>
                        <button
                            onClick={handleGenerateTrackingCode}
                            disabled={isGenerating}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l4-4m-4 4l-4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Generate Code
                                </>
                            )}
                        </button>
                    </div>

                    {trackingCode && (
                        <div className="space-y-3">
                            <div className="bg-background border border-muted rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-on-surface">Tracking Script</span>
                                    <button
                                        onClick={handleCopyCode}
                                        className="text-xs bg-primary-600 hover:bg-primary-700 text-white font-bold py-1 px-2 rounded transition-colors"
                                    >
                                        Copy Code
                                    </button>
                                </div>
                                <pre className="text-xs text-on-surface overflow-x-auto whitespace-pre-wrap">
                                    {trackingCode}
                                </pre>
                            </div>
                            <div className="text-xs text-subtle">
                                <p>• Add this code before the closing head tag</p>
                                <p>• Works with all major form builders (Contact Form 7, Gravity Forms, etc.)</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Connected Forms */}
                <div className="bg-surface rounded-lg border border-muted p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-on-surface">Connected Forms</h3>
                            <p className="text-subtle text-sm">Manage your website forms and monitor submissions</p>
                        </div>
                        <button
                            onClick={handleAddForm}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
                        >
                            Add Form
                        </button>
                    </div>

                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                                <p className="text-subtle">Loading forms...</p>
                            </div>
                        ) : forms.length > 0 ? (
                            forms.map(form => (
                                <div key={form.id} className="flex items-center justify-between p-3 border border-muted rounded-lg bg-background">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-on-surface text-sm">{form.name}</h4>
                                        <p className="text-xs text-subtle truncate">{form.url}</p>
                                        <p className="text-xs text-subtle">
                                            Submissions: {form.totalSubmissions || 0} •
                                            Last Submission: {form.lastSubmission ? new Date(form.lastSubmission).toLocaleDateString() : 'Never'}
                                        </p>
                                        {form.conversionRate && (
                                            <p className="text-xs text-subtle">
                                                Conversion Rate: {form.conversionRate.toFixed(1)}%
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            form.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-subtle'
                                        }`}>
                                            {form.status}
                                        </span>
                                        <button
                                            onClick={() => handleToggleForm(form.id)}
                                            className={`text-xs font-bold py-1 px-2 rounded transition-colors ${
                                                form.status === 'Active'
                                                    ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    : 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            }`}
                                        >
                                            {form.status === 'Active' ? 'Disable' : 'Enable'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-subtle">No forms detected yet. Install the tracking code on your website to start capturing forms.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-surface rounded-lg border border-muted p-6">
                <h3 className="text-lg font-semibold text-on-surface mb-4">Website Performance</h3>
                {isLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-subtle">Loading analytics...</p>
                    </div>
                ) : analytics ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 border border-muted rounded-lg bg-background">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                                {analytics.totalForms || forms.length}
                            </div>
                            <div className="text-sm text-subtle">Total Forms</div>
                        </div>
                        <div className="text-center p-4 border border-muted rounded-lg bg-background">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                                {forms.filter(f => f.status === 'Active').length}
                            </div>
                            <div className="text-sm text-subtle">Active Forms</div>
                        </div>
                        <div className="text-center p-4 border border-muted rounded-lg bg-background">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                                {forms.reduce((sum, form) => sum + (form.totalSubmissions || 0), 0)}
                            </div>
                            <div className="text-sm text-subtle">Total Submissions</div>
                        </div>
                        <div className="text-center p-4 border border-muted rounded-lg bg-background">
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                                {forms.length > 0 ?
                                    ((forms.reduce((sum, form) => sum + (form.totalSubmissions || 0), 0) / forms.length) * 100).toFixed(1) : '0.0'
                                }%
                            </div>
                            <div className="text-sm text-subtle">Avg Conversion Rate</div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-subtle">No analytics data available yet. Install the tracking code to start collecting data.</p>
                    </div>
                )}
            </div>

            {/* Integration Status */}
            {!currentSetting?.isConnected && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="text-amber-600 dark:text-amber-400">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-medium text-amber-800 dark:text-amber-200">Website Not Connected</h4>
                            <p className="text-sm text-amber-700 dark:text-amber-300">Install the tracking code above to start capturing leads from your website forms.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="bg-surface rounded-lg border border-muted p-6">
                <h3 className="text-lg font-semibold text-on-surface mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                        onClick={handleRefreshData}
                        disabled={isLoading}
                        className="p-3 border border-muted rounded-lg hover:bg-background disabled:bg-background disabled:cursor-not-allowed transition-colors text-left"
                    >
                        <div className="font-medium text-on-surface text-sm flex items-center gap-2">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh Data
                        </div>
                        <div className="text-xs text-subtle">Reload analytics & forms</div>
                    </button>
                    <button
                        onClick={handleTestConnection}
                        disabled={isLoading || !currentSetting?.isConnected}
                        className="p-3 border border-muted rounded-lg hover:bg-background disabled:bg-background disabled:cursor-not-allowed transition-colors text-left"
                    >
                        <div className="font-medium text-on-surface text-sm flex items-center gap-2">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Test Integration
                        </div>
                        <div className="text-xs text-subtle">Verify tracking code</div>
                    </button>
                    <button
                        onClick={() => setShowDisconnectModal(true)}
                        className="p-3 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                    >
                        <div className="font-medium text-red-800 dark:text-red-400 text-sm flex items-center gap-2">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Disconnect
                        </div>
                        <div className="text-xs text-red-600 dark:text-red-400">Remove integration</div>
                    </button>
                </div>
            </div>

            {/* Modals */}
            <AddFormModal
                isOpen={showAddFormModal}
                onClose={() => setShowAddFormModal(false)}
                onSubmit={handleAddFormSubmit}
                isLoading={isLoading}
            />

            <ConfirmModal
                isOpen={showDisconnectModal}
                onClose={() => setShowDisconnectModal(false)}
                onConfirm={handleDisconnectConfirm}
                title="Disconnect Website Integration"
                message="Are you sure you want to disconnect the website integration? This will stop new leads from coming in and remove all associated data."
                confirmText="Disconnect"
                cancelText="Cancel"
                type="danger"
                isLoading={isLoading}
            />
        </div>
    );
};

export default WebsiteIntegrationPage;

// Modal Components (must be after the main component)


