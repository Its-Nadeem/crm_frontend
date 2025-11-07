
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



