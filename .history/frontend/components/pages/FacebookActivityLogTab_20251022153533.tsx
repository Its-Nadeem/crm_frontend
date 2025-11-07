
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



