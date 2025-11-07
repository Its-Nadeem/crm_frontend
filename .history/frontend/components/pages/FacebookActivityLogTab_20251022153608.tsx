
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

interface ActivityFilters {
    activityType: string;
    status: string;
    formId: string;
    formName: string;
    campaignId: string;
    campaignName: string;
    leadId: string;
    startDate: string;
    endDate: string;
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
        formId: '',
        formName: '',
        campaignId: '',
        campaignName: '',
        leadId: '',
        startDate: '',
        endDate: ''
    });

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [pageSize] = useState(20);

    // Sorting states
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Fetch activity logs
    const fetchActivityLogs = async (page = 1) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                organizationId: 'org-1',
                page: page.toString(),
                limit: pageSize.toString(),
                sortBy,
                sortOrder,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, value]) => value !== '')
                )
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
        setFilters(prev => ({ ...prev, [filterKey]: value }));
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
            formId: '',
            formName: '',
            campaignId: '',
            campaignName: '',
            leadId: '',
            startDate: '',
            endDate: ''
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

                {/* Filter Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                    {/* Activity Type Filter */}
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

                    {/* Status Filter */}
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

                    {/* Form ID Filter */}
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-2">
                            Form ID
                        </label>
                        <select
                            value={filters.formId}
                            onChange={(e) => handleFilterChange('formId', e.target.value)}
                            className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">All Forms</option>
                            {filterOptions.formIds.map(formId => (
                                <option key={formId} value={formId}>{formId}</option>
                            ))}
                        </select>
                    </div>

                    {/* Form Name Filter */}
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-2">
                            Form Name
                        </label>
                        <input
                            type="text"
                            value={filters.formName}
                            onChange={(e) => handleFilterChange('formName', e.target.value)}
                            placeholder="Search form name..."
                            className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-on-surface placeholder-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    {/* Campaign ID Filter */}
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-2">
                            Campaign ID
                        </label>
                        <select
                            value={filters.campaignId}
                            onChange={(e) => handleFilterChange('campaignId', e.target.value)}
                            className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">All Campaigns</option>
                            {filterOptions.campaignIds.map(campaignId => (
                                <option key={campaignId} value={campaignId}>{campaignId}</option>
                            ))}
                        </select>
                    </div>

                    {/* Campaign Name Filter */}
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-2">
                            Campaign Name
                        </label>
                        <input
                            type="text"
                            value={filters.campaignName}
                            onChange={(e) => handleFilterChange('campaignName', e.target.value)}
                            placeholder="Search campaign name..."
                            className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-on-surface placeholder-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    {/* Lead ID Filter */}
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-2">
                            Lead ID
                        </label>
                        <input
                            type="text"
                            value={filters.leadId}
                            onChange={(e) => handleFilterChange('leadId', e.target.value)}
                            placeholder="Enter lead ID..."
                            className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-on-surface placeholder-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    {/* Date Range Filters */}
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-2">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    {/* End Date Filter */}
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-2">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
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



