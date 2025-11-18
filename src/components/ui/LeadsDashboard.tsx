import React, { useState } from 'react';

interface ActivityLogEntry {
    id: string;
    status: 'success' | 'failed';
    timestamp: string;
    mappingName: string;
    formName: string;
    leadDetails: string;
    email: string;
    error?: string;
}

interface FilterCondition {
    field: string;
    operator: string;
    value: string;
}

export const LeadsDashboard: React.FC = () => {
    const [activePeriod, setActivePeriod] = useState<'today' | 'last7' | 'last30' | 'all'>('last30');
    const [fromDate, setFromDate] = useState('19-09-2025');
    const [toDate, setToDate] = useState('18-10-2025');
    const [filters, setFilters] = useState<FilterCondition[]>([
        { field: 'Lead Details', operator: 'Contains', value: '' }
    ]);

    // Mock data matching the image
    const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([
        {
            id: '1',
            status: 'success',
            timestamp: '10/18/2025, 10:56:28 PM',
            mappingName: 'Winter Sale Leads',
            formName: 'Winter Sale 2024 Form',
            leadDetails: 'John Doe',
            email: 'john.doe@example.com'
        },
        {
            id: '2',
            status: 'failed',
            timestamp: '10/18/2025, 9:56:28 PM',
            mappingName: 'Winter Sale Leads',
            formName: 'Winter Sale 2024 Form',
            leadDetails: 'Jane Smith',
            email: 'jane.smith@example.com',
            error: 'CRM API Error: Invalid email address.'
        },
        {
            id: '3',
            status: 'success',
            timestamp: '10/18/2025, 8:56:28 PM',
            mappingName: 'Newsletter Subscribers',
            formName: 'Newsletter Signup Form',
            leadDetails: 'Peter Jones',
            email: 'peter.jones@example.com'
        }
    ]);

    const timePeriods = [
        { key: 'today', label: 'Today' },
        { key: 'last7', label: 'Last 7 Days' },
        { key: 'last30', label: 'Last 30 Days' },
        { key: 'all', label: 'All Time' }
    ];

    const stats = {
        total: activityLogs.length,
        successful: activityLogs.filter(log => log.status === 'success').length,
        failed: activityLogs.filter(log => log.status === 'failed').length
    };

    const handleAddCondition = () => {
        setFilters([...filters, { field: 'Lead Details', operator: 'Contains', value: '' }]);
    };

    const handleRemoveCondition = (index: number) => {
        if (filters.length > 1) {
            setFilters(filters.filter((_, i) => i !== index));
        }
    };

    const handleFilterChange = (index: number, field: keyof FilterCondition, value: string) => {
        const updatedFilters = filters.map((filter, i) =>
            i === index ? { ...filter, [field]: value } : filter
        );
        setFilters(updatedFilters);
    };

    const handleRetry = (logId: string) => {
        console.log('Retrying log entry:', logId);
        // Here you would implement retry logic
    };

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-on-surface">Leads Dashboard</h2>
                <p className="text-subtle">Analyze lead synchronization activity within a specific timeframe.</p>
            </div>

            {/* Time Period Filters & Date Range */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    {timePeriods.map(period => (
                        <button
                            key={period.key}
                            onClick={() => setActivePeriod(period.key as any)}
                            className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 ${
                                activePeriod === period.key
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'bg-muted text-on-surface hover:bg-background'
                            }`}
                        >
                            {period.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-24 sm:w-auto"
                        />
                        <span className="text-gray-500 text-xs sm:text-sm">to</span>
                        <input
                            type="text"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-24 sm:w-auto"
                        />
                    </div>
                    <button className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-surface p-4 sm:p-6 rounded-xl border border-muted shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-subtle truncate">Total Leads</p>
                            <p className="text-2xl sm:text-3xl font-bold text-on-surface">{stats.total}</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                            <div className="w-2 h-4 sm:w-3 sm:h-6 bg-blue-600 dark:bg-blue-400 rounded-sm"></div>
                        </div>
                    </div>
                </div>

                <div className="bg-surface p-4 sm:p-6 rounded-xl border border-muted shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-subtle truncate">Successful</p>
                            <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{stats.successful}</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                            <div className="w-2 h-4 sm:w-3 sm:h-6 bg-green-600 dark:bg-green-400 rounded-sm"></div>
                        </div>
                    </div>
                </div>

                <div className="bg-surface p-4 sm:p-6 rounded-xl border border-muted shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-subtle truncate">Failed</p>
                            <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">{stats.failed}</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                            <div className="w-2 h-4 sm:w-3 sm:h-6 bg-red-600 dark:bg-red-400 rounded-sm"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="bg-surface rounded-xl border border-muted p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-on-surface mb-4">Advanced Filters</h3>

                <div className="space-y-3 sm:space-y-4">
                    {filters.map((filter, index) => (
                        <div key={index} className="flex items-center gap-2 sm:gap-3">
                            <select
                                value={filter.field}
                                onChange={(e) => handleFilterChange(index, 'field', e.target.value)}
                                className="px-2 sm:px-3 py-1 sm:py-2 border border-muted rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-background text-on-surface"
                            >
                                <option value="Lead Details">Lead Details</option>
                                <option value="Email">Email</option>
                                <option value="Mapping">Mapping</option>
                                <option value="Status">Status</option>
                            </select>

                            <select
                                value={filter.operator}
                                onChange={(e) => handleFilterChange(index, 'operator', e.target.value)}
                                className="px-2 sm:px-3 py-1 sm:py-2 border border-muted rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-background text-on-surface"
                            >
                                <option value="Contains">Contains</option>
                                <option value="Equals">Equals</option>
                                <option value="Starts with">Starts with</option>
                                <option value="Ends with">Ends with</option>
                            </select>

                            <input
                                type="text"
                                value={filter.value}
                                onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
                                placeholder="Enter value..."
                                className="flex-1 px-2 sm:px-3 py-1 sm:py-2 border border-muted rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-background text-on-surface"
                            />

                            <button
                                onClick={() => handleRemoveCondition(index)}
                                disabled={filters.length === 1}
                                className="p-1.5 sm:p-2 text-subtle hover:text-red-500 dark:text-subtle dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={handleAddCondition}
                        className="flex items-center gap-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                    >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Condition
                    </button>
                </div>
            </div>

            {/* Activity Log Table */}
            <div className="bg-surface rounded-xl border border-muted shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-background">
                            <tr>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-on-surface uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-on-surface uppercase tracking-wider">
                                    Timestamp
                                </th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-on-surface uppercase tracking-wider">
                                    Mapping & Form
                                </th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-on-surface uppercase tracking-wider">
                                    Lead Details
                                </th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-on-surface uppercase tracking-wider">
                                    Error / Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-muted">
                            {activityLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-background transition-colors duration-200">
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2 sm:mr-3 ${
                                                log.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                                            }`}></div>
                                            <span className={`text-xs sm:text-sm font-medium capitalize ${
                                                log.status === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                                            }`}>
                                                {log.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-on-surface">
                                        {log.timestamp}
                                    </td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                        <div className="text-xs sm:text-sm font-medium text-on-surface">{log.mappingName}</div>
                                        <div className="text-xs sm:text-sm text-subtle">{log.formName}</div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                        <div className="text-xs sm:text-sm font-medium text-on-surface">{log.leadDetails}</div>
                                        <div className="text-xs sm:text-sm text-subtle">({log.email})</div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-subtle">
                                        {log.error ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-red-600 dark:text-red-400">{log.error}</span>
                                                <button
                                                    onClick={() => handleRetry(log.id)}
                                                    className="px-2 sm:px-3 py-1 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white text-xs rounded transition-colors duration-200"
                                                >
                                                    Retry
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-subtle">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {activityLogs.length === 0 && (
                    <div className="text-center py-8 sm:py-12">
                        <svg className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-on-surface">No activity logs</h3>
                        <p className="mt-1 text-sm text-subtle">No lead synchronization activity found for the selected time period.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


