import React, { useState, useEffect } from 'react';

interface ActivityLog {
    _id: string;
    organizationId: string;
    accountId: string;
    pageId: string;
    formId?: string;
    formName?: string;
    campaignId?: string;
    campaignName?: string;
    leadId?: string;
    leadData?: {
        name?: string;
        email?: string;
        phone?: string;
    };
    activityType: string;
    status: 'success' | 'failed' | 'pending' | 'skipped';
    description: string;
    details?: any;
    errorMessage?: string;
    metadata?: {
        userAgent?: string;
        ipAddress?: string;
        processingTimeMs?: number;
        retryCount?: number;
    };
    createdAt: string;
    updatedAt: string;
}

interface FilterOptions {
    activityTypes: string[];
    statuses: string[];
    formIds: string[];
    formNames: string[];
    campaignIds: string[];
    campaignNames: string[];
    leadIds: string[];
}

interface FilterCondition {
    field: string;
    condition: string;
    value: string;
}

interface ActivityFilters {
    activityType: string;
    status: string;
    conditions: FilterCondition[];
    startDate: string;
    endDate: string;
    dateRangeOption: string;
}

const FacebookActivityLogTab: React.FC = () => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        activityTypes: [],
        statuses: [],
        formIds: [],
        formNames: [],
        campaignIds: [],
        campaignNames: [],
        leadIds: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [filters, setFilters] = useState<ActivityFilters>({
        activityType: '',
        status: '',
        conditions: [],
        startDate: '',
        endDate: '',
        dateRangeOption: 'custom'
    });

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [pageSize] = useState(20);

    // Sorting states
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Date range states
    const [dateRangeOption, setDateRangeOption] = useState('custom');

    // Fetch activity logs
    const fetchActivityLogs = async (page = 1) => {
        setLoading(true);
        setError(null);

        try {
            // Build query parameters
            const params = new URLSearchParams({
                organizationId: 'org-1',
                page: page.toString(),
                limit: pageSize.toString(),
                sortBy,
                sortOrder
            });

            // Add simple filters
            if (filters.activityType) params.append('activityType', filters.activityType);
            if (filters.status) params.append('status', filters.status);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            // Add condition-based filters
            filters.conditions.forEach((condition, index) => {
                if (condition.field && condition.value) {
                    params.append(`conditions[${index}][field]`, condition.field);
                    params.append(`conditions[${index}][condition]`, condition.condition);
                    params.append(`conditions[${index}][value]`, condition.value);
                }
            });

            const response = await fetch(`${window.location.origin}/api/fb/activity-logs?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch activity logs');
            }

            const data = await response.json();

            if (data.success) {
                setLogs(data.logs);
                setTotalPages(data.pagination.totalPages);
                setTotalCount(data.pagination.totalCount);
                setCurrentPage(data.pagination.currentPage);
            } else {
                throw new Error(data.message || 'Failed to fetch activity logs');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch activity logs');
        } finally {
            setLoading(false);
        }
    };

    // Fetch filter options
    const fetchFilterOptions = async () => {
        try {
            const response = await fetch(`${window.location.origin}/api/fb/activity-logs/filters?organizationId=org-1`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setFilterOptions(data.filterOptions);
                }
            }
        } catch (error) {
            console.error('Error fetching filter options:', error);
        }
    };

    // Initial load
    useEffect(() => {
        fetchFilterOptions();
        fetchActivityLogs();
    }, []);

    // Handle filter changes
    const handleFilterChange = (filterKey: keyof ActivityFilters, value: string) => {
        if (filterKey === 'dateRangeOption') {
            const { startDate, endDate } = calculateDateRange(value);
            setFilters(prev => ({
                ...prev,
                [filterKey]: value,
                startDate,
                endDate
            }));
        } else {
            setFilters(prev => ({ ...prev, [filterKey]: value }));
        }
        setCurrentPage(1); // Reset to first page when filtering
    };

    // Apply filters
    const applyFilters = () => {
        fetchActivityLogs(1);
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            activityType: '',
            status: '',
            conditions: [],
            startDate: '',
            endDate: '',
            dateRangeOption: 'custom'
        });
        setCurrentPage(1);
        fetchActivityLogs(1);
    };

    // Handle sorting
    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
        fetchActivityLogs(1);
    };

    // Format activity type for display
    const formatActivityType = (type: string) => {
        return type.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    // Format status for display
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            success: { color: 'bg-green-100 text-green-700', icon: '✅' },
            failed: { color: 'bg-red-100 text-red-700', icon: '❌' },
            pending: { color: 'bg-amber-100 text-amber-700', icon: '⏳' },
            skipped: { color: 'bg-gray-100 text-gray-700', icon: '⏭️' }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

        return (
            <span className={`text-xs px-2 py-1 rounded-full ${config.color}`}>
                {config.icon} {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    // Date range options
    const dateRangeOptions = [
        { value: 'last_7_days', label: 'Last 7 days' },
        { value: 'last_15_days', label: 'Last 15 days' },
        { value: 'last_30_days', label: 'Last 30 days' },
        { value: 'last_1_month', label: 'Last 1 month' },
        { value: 'last_3_months', label: 'Last 3 months' },
        { value: 'last_6_months', label: 'Last 6 months' },
        { value: 'last_1_year', label: 'Last 1 year' },
        { value: 'maximum', label: 'Maximum' },
        { value: 'custom', label: 'Custom' }
    ];

    // Calculate date range based on option
    const calculateDateRange = (option: string) => {
        const now = new Date();
        let startDate = '';
        let endDate = '';

        switch (option) {
            case 'last_7_days':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                endDate = now.toISOString().split('T')[0];
                break;
            case 'last_15_days':
                startDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                endDate = now.toISOString().split('T')[0];
                break;
            case 'last_30_days':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                endDate = now.toISOString().split('T')[0];
                break;
            case 'last_1_month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('T')[0];
                endDate = now.toISOString().split('T')[0];
                break;
            case 'last_3_months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString().split('T')[0];
                endDate = now.toISOString().split('T')[0];
                break;
            case 'last_6_months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).toISOString().split('T')[0];
                endDate = now.toISOString().split('T')[0];
                break;
            case 'last_1_year':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];
                endDate = now.toISOString().split('T')[0];
                break;
            case 'maximum':
                startDate = '';
                endDate = '';
                break;
            case 'custom':
                // Keep current values
                break;
        }

        return { startDate, endDate };
    };

    return (
        <div className="space-y-6 mx-4">
            {/* Header */}
            <div>
                <h3 className="text-xl font-bold text-on-surface">Activity Log</h3>
                <p className="text-subtle mt-1">Monitor lead sync activities and webhook deliveries.</p>
            </div>

            {/* Advanced Filters */}
            <div className="bg-background rounded-lg border border-muted p-6 shadow-sm">
                <h4 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Advanced Filters
                </h4>

                {/* Filter Builder */}
                <div className="space-y-4 mb-4">
                    {/* Activity Type and Status - Keep as simple dropdowns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-2">
                                Activity Type
                            </label>
                            <select
                                value={filters.activityType}
                                onChange={(e) => handleFilterChange('activityType', e.target.value)}
                                className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">All Types</option>
                                {filterOptions.activityTypes.map(type => (
                                    <option key={type} value={type}>{formatActivityType(type)}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-2">
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">All Statuses</option>
                                {filterOptions.statuses.map(status => (
                                    <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Advanced Filter Builder */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-on-surface">
                                Advanced Filters
                            </label>
                            <button
                                onClick={() => {
                                    setFilters(prev => ({
                                        ...prev,
                                        conditions: [...prev.conditions, { field: '', condition: 'contains', value: '' }]
                                    }));
                                }}
                                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-1 px-3 rounded-lg transition-colors shadow-sm hover:shadow-md flex items-center gap-2 text-sm"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add Filter
                            </button>
                        </div>

                        {/* Filter Rows */}
                        <div className="space-y-3">
                            {filters.conditions.map((condition, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                                    {/* Field Selector */}
                                    <select
                                        value={condition.field}
                                        onChange={(e) => {
                                            const newConditions = [...filters.conditions];
                                            newConditions[index] = {
                                                ...newConditions[index],
                                                field: e.target.value,
                                                condition: e.target.value === 'createdAt' ? 'last_7_days' : 'contains',
                                                value: ''
                                            };
                                            setFilters(prev => ({ ...prev, conditions: newConditions }));
                                        }}
                                        className="px-3 py-2 border border-muted rounded-lg bg-background text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[140px]"
                                    >
                                        <option value="">Select Field</option>
                                        <option value="createdAt">Date</option>
                                        <option value="formId">Form ID</option>
                                        <option value="formName">Form Name</option>
                                        <option value="campaignId">Campaign ID</option>
                                        <option value="campaignName">Campaign Name</option>
                                        <option value="leadId">Lead ID</option>
                                    </select>

                                    {/* Condition Selector */}
                                    <select
                                        value={condition.condition}
                                        onChange={(e) => {
                                            const newConditions = [...filters.conditions];
                                            newConditions[index] = { ...newConditions[index], condition: e.target.value, value: '' };
                                            setFilters(prev => ({ ...prev, conditions: newConditions }));
                                        }}
                                        className="px-3 py-2 border border-muted rounded-lg bg-background text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[100px]"
                                    >
                                        {condition.field === 'createdAt' ? (
                                            <>
                                                <option value="equals">Equals</option>
                                                <option value="is">Is</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="contains">Contains</option>
                                                <option value="equals">Equals</option>
                                                <option value="starts_with">Starts with</option>
                                                <option value="ends_with">Ends with</option>
                                            </>
                                        )}
                                    </select>

                                    {/* Value Input */}
                                    {condition.field === 'createdAt' ? (
                                        <div className="flex-1">
                                            <select
                                                value={condition.value}
                                                onChange={(e) => {
                                                    const newConditions = [...filters.conditions];
                                                    newConditions[index] = { ...newConditions[index], value: e.target.value };
                                                    setFilters(prev => ({ ...prev, conditions: newConditions }));
                                                }}
                                                className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            >
                                                <option value="">Select date range</option>
                                                {dateRangeOptions.map(option => (
                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                            {condition.value === 'custom' && (
                                                <div className="mt-2 grid grid-cols-2 gap-2">
                                                    <input
                                                        type="date"
                                                        value={filters.startDate}
                                                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                                        className="px-3 py-2 border border-muted rounded-lg bg-background text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                    />
                                                    <input
                                                        type="date"
                                                        value={filters.endDate}
                                                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                                        className="px-3 py-2 border border-muted rounded-lg bg-background text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={condition.value}
                                            onChange={(e) => {
                                                const newConditions = [...filters.conditions];
                                                newConditions[index] = { ...newConditions[index], value: e.target.value };
                                                setFilters(prev => ({ ...prev, conditions: newConditions }));
                                            }}
                                            placeholder="Enter value..."
                                            className="flex-1 px-3 py-2 border border-muted rounded-lg bg-background text-on-surface placeholder-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    )}

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => {
                                            setFilters(prev => ({
                                                ...prev,
                                                conditions: prev.conditions.filter((_, i) => i !== index)
                                            }));
                                        }}
                                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remove Filter"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}

                            {filters.conditions.length === 0 && (
                                <div className="text-center py-4 text-subtle bg-muted/10 rounded-lg">
                                    <p>No filters added. Click "Add Filter" to create filter conditions.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Filter Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={applyFilters}
                        disabled={loading}
                        className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Apply Filters
                    </button>

                    <button
                        onClick={clearFilters}
                        className="bg-muted hover:bg-muted/80 text-on-surface font-medium py-2 px-4 rounded-lg transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Results Summary */}
            <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-6">
                        <span className="text-subtle">
                            Showing <span className="font-medium text-on-surface">{logs.length}</span> of{' '}
                            <span className="font-medium text-on-surface">{totalCount}</span> activities
                        </span>
                        <span className="text-subtle">
                            Page <span className="font-medium text-on-surface">{currentPage}</span> of{' '}
                            <span className="font-medium text-on-surface">{totalPages}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                // Handle page size change
                                const newSize = parseInt(e.target.value);
                                // Update pageSize state and refetch
                            }}
                            className="px-2 py-1 border border-muted rounded bg-background text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value={10}>10 per page</option>
                            <option value={20}>20 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Activity Table */}
            <div className="bg-background rounded-lg border border-muted shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="bg-muted/30 px-6 py-4 border-b border-muted">
                    <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-on-surface">
                        <div className="col-span-2">
                            <button
                                onClick={() => handleSort('status')}
                                className="flex items-center gap-1 hover:text-primary-600 transition-colors"
                            >
                                Status
                                {sortBy === 'status' && (
                                    <svg className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <div className="col-span-2">
                            <button
                                onClick={() => handleSort('createdAt')}
                                className="flex items-center gap-1 hover:text-primary-600 transition-colors"
                            >
                                Timestamp
                                {sortBy === 'createdAt' && (
                                    <svg className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <div className="col-span-2">
                            <button
                                onClick={() => handleSort('activityType')}
                                className="flex items-center gap-1 hover:text-primary-600 transition-colors"
                            >
                                Activity Type
                                {sortBy === 'activityType' && (
                                    <svg className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <div className="col-span-3">Details</div>
                        <div className="col-span-2">Form/Campaign</div>
                        <div className="col-span-1">Actions</div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        <span className="ml-2 text-on-surface">Loading activities...</span>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-6">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="text-red-800 text-sm">{error}</span>
                        </div>
                    </div>
                )}

                {/* Table Body */}
                <div className="divide-y divide-muted">
                    {logs.length > 0 ? (
                        logs.map(log => (
                            <div key={log._id} className="px-6 py-4 hover:bg-muted/20 transition-colors">
                                <div className="grid grid-cols-12 gap-4 items-center text-sm">
                                    <div className="col-span-2">
                                        {getStatusBadge(log.status)}
                                    </div>
                                    <div className="col-span-2 text-on-surface">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </div>
                                    <div className="col-span-2">
                                        <div className="font-medium text-on-surface">
                                            {formatActivityType(log.activityType)}
                                        </div>
                                    </div>
                                    <div className="col-span-3">
                                        <div className="text-on-surface">{log.description}</div>
                                        {log.leadData && (
                                            <div className="text-xs text-subtle mt-1">
                                                {log.leadData.name && `Name: ${log.leadData.name}`}
                                                {log.leadData.email && ` • Email: ${log.leadData.email}`}
                                            </div>
                                        )}
                                        {log.errorMessage && (
                                            <div className="text-xs text-red-600 mt-1">
                                                Error: {log.errorMessage}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-on-surface">
                                            {log.formName && `Form: ${log.formName}`}
                                            {log.campaignName && `Campaign: ${log.campaignName}`}
                                        </div>
                                        <div className="text-xs text-subtle">
                                            {log.formId && `Form ID: ${log.formId}`}
                                            {log.campaignId && ` • Campaign ID: ${log.campaignId}`}
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => {
                                                    // View details functionality
                                                    console.log('View details for log:', log._id);
                                                }}
                                                className="p-1 text-subtle hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                                title="View Details"
                                            >
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                            {log.status === 'failed' && (
                                                <button
                                                    onClick={() => {
                                                        // Retry functionality
                                                        console.log('Retry log:', log._id);
                                                    }}
                                                    className="p-1 text-subtle hover:text-green-500 hover:bg-green-50 rounded transition-colors"
                                                    title="Retry"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : !loading && (
                        <div className="px-6 py-8 text-center">
                            <div className="mx-auto h-12 w-12 bg-muted/50 rounded-lg flex items-center justify-center mb-4">
                                <svg className="h-6 w-6 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-on-surface mb-2">No activity logs found</h4>
                            <p className="text-subtle mb-6">
                                {Object.values(filters).some(value => value !== '')
                                    ? 'Try adjusting your filters to see more results.'
                                    : 'Activity logs will appear here once you start syncing leads or performing other Facebook integration activities.'
                                }
                            </p>
                            {Object.values(filters).some(value => value !== '') && (
                                <button
                                    onClick={clearFilters}
                                    className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-sm hover:shadow-md"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-muted bg-muted/30">
                        <div className="text-sm text-subtle">
                            Showing page {currentPage} of {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchActivityLogs(currentPage - 1)}
                                disabled={currentPage <= 1 || loading}
                                className="px-3 py-2 text-sm font-medium text-on-surface bg-background border border-muted rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>

                            {/* Page Numbers */}
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => fetchActivityLogs(pageNum)}
                                            disabled={loading}
                                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                                pageNum === currentPage
                                                    ? 'bg-primary-600 text-white'
                                                    : 'text-on-surface bg-background border border-muted hover:bg-muted'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => fetchActivityLogs(currentPage + 1)}
                                disabled={currentPage >= totalPages || loading}
                                className="px-3 py-2 text-sm font-medium text-on-surface bg-background border border-muted rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FacebookActivityLogTab;


