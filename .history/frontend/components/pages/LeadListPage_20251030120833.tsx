import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Lead, User, Stage, Task, CustomFieldDefinition, FilterCondition, FilterOperator, Permission, SavedFilter, WhatsAppTemplate, UserRole, LeadSource, ScheduledMessage, SMSTemplate } from '../../types';
import AssignUserModal from '../leads/AssignUserModal';
import { AppIcons } from '../ui/Icons';
import { LEAD_SOURCES } from '../../constants';
import ImportLeadsModal from '../leads/ImportLeadsModal';
import Modal from '../ui/Modal';
import { Link } from 'react-router-dom';
import FilterBuilder from '../ui/FilterBuilder';
import { apiService } from '../../src/services/api';
import LeadDetailModal from '../leads/LeadDetailModal';

// Save Filter Modal Component
const SaveFilterModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [filterName, setFilterName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (filterName.trim()) {
            onSave(filterName.trim());
            setFilterName('');
            onClose();
        }
    };

    const handleClose = () => {
        setFilterName('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Save Filter View">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-subtle mb-2">
                        Filter View Name
                    </label>
                    <input
                        type="text"
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        placeholder="Enter a name for this filter view"
                        className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                        autoFocus
                        required
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-muted">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg"
                    >
                        Save Filter View
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const LeadListPage: React.FC<{
    leads: Lead[];
    users: User[];
    pipelineStages: Stage[];
    customFieldDefs: CustomFieldDefinition[];
    tasks: Task[];
    whatsAppTemplates: WhatsAppTemplate[];
    smsTemplates: SMSTemplate[];
    addLead: (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'activities' | 'score' | 'closeDate'>) => Promise<void>;
    deleteLead: (leadId: string) => Promise<void>;
    currentUser: User;
    hasPermission: (p: Permission) => boolean;
    savedFilters: SavedFilter[];
    onSaveFilter: (filter: Omit<SavedFilter, 'id' | 'organizationId'>) => Promise<void>;
    onDeleteFilter: (id: string) => Promise<void>;
    onBulkAssign: (leadIds: string[], assignedToId: number) => Promise<void>;
    onBulkDelete: (leadIds: string[]) => Promise<void>;
    onUpdateLead: (lead: Lead) => Promise<boolean>;
    onUpdateTask: (task: Task) => Promise<void>;
    onAddTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'organizationId' | 'isCompleted' | 'assignedToId' | 'createdById'>, assignment?: { type: 'user' | 'team' | 'all'; id?: string | number }) => Promise<void>;
    onScheduleMessage: (msgData: Omit<ScheduledMessage, 'id'|'organizationId'>) => Promise<void>;
    onImportLeads?: (imported: any[]) => Promise<void>;
}> = ({
    leads,
    users,
    pipelineStages,
    customFieldDefs,
    tasks,
    whatsAppTemplates,
    smsTemplates,
    addLead,
    deleteLead,
    currentUser,
    hasPermission,
    savedFilters,
    onSaveFilter,
    onDeleteFilter,
    onBulkAssign,
    onBulkDelete,
    onUpdateLead,
    onUpdateTask,
    onAddTask,
    onScheduleMessage,
    onImportLeads
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
    const [sortBy, setSortBy] = useState<'name' | 'email' | 'phone' | 'stage' | 'createdAt' | 'updatedAt'>('updatedAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showSaveFilterModal, setShowSaveFilterModal] = useState(false);
    const [showLeadDetailModal, setShowLeadDetailModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [filters, setFilters] = useState<FilterCondition[]>([]);
    const [activeFilter, setActiveFilter] = useState<SavedFilter | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [showColumnSettings, setShowColumnSettings] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState({
        name: true,
        email: true,
        phone: true,
        stage: true,
        assignedToId: true,
        updatedAt: true
    });

    // Load leads on component mount
    useEffect(() => {
        const loadLeads = async () => {
            setIsLoading(true);
            try {
                // Leads are passed as props, so no need to fetch here
                // The parent component (App.tsx) handles the data fetching
            } catch (error) {
                console.error('Failed to load leads:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadLeads();
    }, []);

    // Filter and sort leads
    const filteredAndSortedLeads = useMemo(() => {
        let filtered = leads;

        // Apply search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(lead =>
                lead.name?.toLowerCase().includes(searchLower) ||
                lead.email?.toLowerCase().includes(searchLower) ||
                lead.phone?.toLowerCase().includes(searchLower) ||
                lead.company?.toLowerCase().includes(searchLower)
            );
        }

        // Apply custom filters
        if (filters.length > 0) {
            filtered = filtered.filter(lead => {
                return filters.every(filter => {
                    const value = lead[filter.field as keyof Lead];
                    const filterValue = filter.value;

                    switch (filter.operator) {
                        case 'contains':
                            return String(value || '').toLowerCase().includes(String(filterValue || '').toLowerCase());
                        case 'equals':
                            return value === filterValue;
                        case 'not_equals':
                            return value !== filterValue;
                        case 'gt':
                            return Number(value) > Number(filterValue);
                        case 'lt':
                            return Number(value) < Number(filterValue);
                        case 'gte':
                            return Number(value) >= Number(filterValue);
                        case 'lte':
                            return Number(value) <= Number(filterValue);
                        case 'is_between':
                            const [min, max] = Array.isArray(filterValue) ? filterValue : [filterValue, filterValue];
                            return Number(value) >= Number(min) && Number(value) <= Number(max);
                        default:
                            return true;
                    }
                });
            });
        }

        // Sort leads
        filtered.sort((a, b) => {
            let aValue: any = a[sortBy];
            let bValue: any = b[sortBy];

            // Handle special cases
            if (sortBy === 'stage') {
                const aStage = pipelineStages.find(s => s.id === aValue);
                const bStage = pipelineStages.find(s => s.id === bValue);
                aValue = aStage?.name || '';
                bValue = bStage?.name || '';
            }

            // Handle null/undefined values
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return sortOrder === 'asc' ? -1 : 1;
            if (bValue == null) return sortOrder === 'asc' ? 1 : -1;

            // Convert to strings for comparison if needed
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [leads, searchTerm, filters, sortBy, sortOrder, pipelineStages]);

    // Paginate leads
    const paginatedLeads = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredAndSortedLeads.slice(startIndex, startIndex + pageSize);
    }, [filteredAndSortedLeads, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredAndSortedLeads.length / pageSize);

    // Handle lead selection
    const handleSelectLead = (leadId: string, selected: boolean) => {
        const newSelected = new Set(selectedLeads);
        if (selected) {
            newSelected.add(leadId);
        } else {
            newSelected.delete(leadId);
        }
        setSelectedLeads(newSelected);
    };

    const handleSelectAll = (selected: boolean) => {
        if (selected) {
            setSelectedLeads(new Set(paginatedLeads.map(lead => lead.id)));
        } else {
            setSelectedLeads(new Set());
        }
    };

    // Handle bulk operations
    const handleBulkAssign = async (assignedToId: number) => {
        try {
            await onBulkAssign(Array.from(selectedLeads), assignedToId);
            setSelectedLeads(new Set());
            setShowAssignModal(false);
        } catch (error) {
            console.error('Failed to bulk assign leads:', error);
        }
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`Are you sure you want to delete ${selectedLeads.size} leads?`)) {
            try {
                await onBulkDelete(Array.from(selectedLeads));
                setSelectedLeads(new Set());
            } catch (error) {
                console.error('Failed to bulk delete leads:', error);
            }
        }
    };

    // Handle sorting
    const handleSort = (field: typeof sortBy) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    // Handle filter operations
    const handleApplyFilters = (newFilters: FilterCondition[]) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    const handleSaveFilter = async (name: string) => {
        try {
            await onSaveFilter({
                name,
                conditions: filters
            } as any);
        } catch (error) {
            console.error('Failed to save filter:', error);
        }
    };

    const handleLoadFilter = (filter: SavedFilter) => {
        setFilters(filter.conditions);
        setActiveFilter(filter);
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters([]);
        setActiveFilter(null);
        setCurrentPage(1);
    };

    const handleExportLeads = async () => {
        try {
            setIsExporting(true);
            const dataToExport = filteredAndSortedLeads.map(lead => ({
                Name: lead.name || '',
                Email: lead.email || '',
                Phone: lead.phone || '',
                Company: lead.company || '',
                City: lead.city || '',
                Course: lead.course || '',
                Stage: getStageName(lead.stage),
                Owner: getUserName(lead.assignedToId),
                Source: lead.source || '',
                Score: lead.score || 0,
                'Deal Value': lead.dealValue || 0,
                Tags: lead.tags?.join(', ') || '',
                Campaign: lead.campaign || '',
                'Created At': lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '',
                'Updated At': lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : ''
            }));

            const csvContent = [
                Object.keys(dataToExport[0]).join(','),
                ...dataToExport.map(row => Object.values(row).map(val => `"${val}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Failed to export leads:', error);
            alert('Failed to export leads. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    // Get user name by ID
    const getUserName = (userId: number) => {
        const user = users.find(u => u.id === userId);
        return user?.name || 'Unassigned';
    };

    // Get stage name by ID
    const getStageName = (stageId: string) => {
        const stage = pipelineStages.find(s => s.id === stageId);
        return stage?.name || 'Unknown Stage';
    };

    // Get stage color by ID
    const getStageColor = (stageId: string) => {
        const stage = pipelineStages.find(s => s.id === stageId);
        return stage?.color || '#6b7280';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                <span className="ml-2 text-subtle">Loading leads...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-on-surface">Leads</h1>
                    <p className="text-subtle mt-1">
                        {filteredAndSortedLeads.length} lead{filteredAndSortedLeads.length !== 1 ? 's' : ''}
                        {searchTerm && ` matching "${searchTerm}"`}
                    </p>
                </div>
                <div className="flex gap-2">
                    {hasPermission(Permission.MANAGE_USERS) && (
                        <>
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <AppIcons.Import className="h-4 w-4" />
                                Import
                            </button>
                            <button
                                onClick={handleExportLeads}
                                disabled={isExporting || filteredAndSortedLeads.length === 0}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <AppIcons.Export className="h-4 w-4" />
                                {isExporting ? 'Exporting...' : 'Export'}
                            </button>
                            <button
                                onClick={() => {
                                    const leadData = {
                                        name: '',
                                        email: '',
                                        phone: '',
                                        alternatePhone: '',
                                        city: '',
                                        course: '',
                                        company: '',
                                        stage: pipelineStages[0]?.id || '',
                                        source: LeadSource.WEBSITE,
                                        assignedToId: currentUser.id,
                                        followUpStatus: 'Pending' as any,
                                        dealValue: 0,
                                        closeDate: '',
                                        tags: [],
                                        campaign: '',
                                        facebookCampaign: '',
                                        facebookAdset: '',
                                        facebookAd: ''
                                    };
                                    addLead(leadData);
                                }}
                                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <AppIcons.Add className="h-4 w-4" />
                                Add Lead
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-surface rounded-lg p-4 space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <AppIcons.Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-subtle" />
                            <input
                                type="text"
                                placeholder="Search by name, email, phone, company..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-background border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
                                showAdvancedFilters
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-muted hover:bg-muted/80 text-on-surface'
                            }`}
                        >
                            <AppIcons.Filter className="h-4 w-4" />
                            Advanced Filters
                            {filters.length > 0 && (
                                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                    {filters.length}
                                </span>
                            )}
                        </button>
                        {savedFilters.length > 0 && (
                            <div className="relative">
                                <select
                                    value={activeFilter?.id || ''}
                                    onChange={(e) => {
                                        const filter = savedFilters.find(f => f.id === e.target.value);
                                        if (filter) {
                                            handleLoadFilter(filter);
                                        } else {
                                            handleClearFilters();
                                        }
                                    }}
                                    className="px-3 py-2 bg-background border border-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">Saved Filters</option>
                                    {savedFilters.map(filter => (
                                        <option key={filter.id} value={filter.id}>{filter.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {filters.length > 0 && (
                            <button
                                onClick={handleClearFilters}
                                className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium"
                            >
                                Clear All
                            </button>
                        )}
                        <button
                            onClick={() => {/* TODO: Implement column settings */}}
                            className="px-4 py-2 bg-muted hover:bg-muted/80 text-on-surface rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                        >
                            <AppIcons.Settings className="h-4 w-4" />
                            Columns
                        </button>
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                {showAdvancedFilters && (
                    <div className="border-t border-muted pt-4">
                        <FilterBuilder
                            conditions={filters}
                            onConditionsChange={handleApplyFilters}
                            users={users}
                            pipelineStages={pipelineStages}
                            customFieldDefs={customFieldDefs}
                            headerContent={
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowSaveFilterModal(true)}
                                        className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded"
                                    >
                                        Save Filter
                                    </button>
                                </div>
                            }
                        />
                    </div>
                )}
            </div>

            {/* Bulk Actions */}
            {selectedLeads.size > 0 && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-primary-700 font-medium">
                            {selectedLeads.size} lead{selectedLeads.size !== 1 ? 's' : ''} selected
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowAssignModal(true)}
                                className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm"
                            >
                                Assign
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leads Table */}
            <div className="bg-surface rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-muted">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={paginatedLeads.length > 0 && paginatedLeads.every(lead => selectedLeads.has(lead.id))}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        className="rounded border-muted"
                                    />
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider cursor-pointer hover:bg-muted/70"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-1">
                                        Name
                                        {sortBy === 'name' && (
                                            <AppIcons.ChevronRight className={`h-3 w-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider cursor-pointer hover:bg-muted/70"
                                    onClick={() => handleSort('email')}
                                >
                                    <div className="flex items-center gap-1">
                                        Email
                                        {sortBy === 'email' && (
                                            <AppIcons.ChevronRight className={`h-3 w-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider cursor-pointer hover:bg-muted/70"
                                    onClick={() => handleSort('phone')}
                                >
                                    <div className="flex items-center gap-1">
                                        Phone
                                        {sortBy === 'phone' && (
                                            <AppIcons.ChevronRight className={`h-3 w-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider cursor-pointer hover:bg-muted/70"
                                    onClick={() => handleSort('stage')}
                                >
                                    <div className="flex items-center gap-1">
                                        Stage
                                        {sortBy === 'stage' && (
                                            <AppIcons.ChevronRight className={`h-3 w-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">
                                    Assigned To
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider cursor-pointer hover:bg-muted/70"
                                    onClick={() => handleSort('updatedAt')}
                                >
                                    <div className="flex items-center gap-1">
                                        Last Updated
                                        {sortBy === 'updatedAt' && (
                                            <AppIcons.ChevronRight className={`h-3 w-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-subtle uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-muted">
                            {paginatedLeads.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-subtle">
                                        {leads.length === 0 ? (
                                            <div>
                                                <AppIcons.Leads className="mx-auto h-12 w-12 text-muted mb-4" />
                                                <h3 className="text-lg font-medium text-on-surface mb-2">No leads yet</h3>
                                                <p className="text-subtle mb-4">Get started by adding your first lead or importing from a CSV file.</p>
                                                <button
                                                    onClick={() => {
                                                        const leadData = {
                                                            name: '',
                                                            email: '',
                                                            phone: '',
                                                            alternatePhone: '',
                                                            city: '',
                                                            course: '',
                                                            company: '',
                                                            stage: pipelineStages[0]?.id || '',
                                                            source: LeadSource.WEBSITE,
                                                            assignedToId: currentUser.id,
                                                            followUpStatus: 'Pending' as any,
                                                            dealValue: 0,
                                                            closeDate: '',
                                                            tags: [],
                                                            campaign: '',
                                                            facebookCampaign: '',
                                                            facebookAdset: '',
                                                            facebookAd: ''
                                                        };
                                                        addLead(leadData);
                                                    }}
                                                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
                                                >
                                                    <AppIcons.Add className="h-4 w-4" />
                                                    Add Your First Lead
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <AppIcons.Filter className="mx-auto h-12 w-12 text-muted mb-4" />
                                                <h3 className="text-lg font-medium text-on-surface mb-2">No leads found</h3>
                                                <p className="text-subtle">Try adjusting your search or filters.</p>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                paginatedLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => {
                                        setSelectedLead(lead);
                                        setShowLeadDetailModal(true);
                                    }}>
                                        <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedLeads.has(lead.id)}
                                                onChange={(e) => handleSelectLead(lead.id, e.target.checked)}
                                                className="rounded border-muted"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                                                        <span className="text-white font-medium text-sm">
                                                            {lead.name?.charAt(0)?.toUpperCase() || '?'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-on-surface">
                                                        {lead.name || 'Unnamed Lead'}
                                                    </div>
                                                    <div className="text-sm text-subtle">
                                                        {typeof lead.source === 'string' ? lead.source : 'Unknown'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface">
                                            {lead.email || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface">
                                            {lead.phone || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                                style={{
                                                    backgroundColor: `${getStageColor(lead.stage)}20`,
                                                    color: getStageColor(lead.stage)
                                                }}
                                            >
                                                {getStageName(lead.stage)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface">
                                            {getUserName(lead.assignedToId)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-subtle">
                                            {lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/leads/${lead.id}`}
                                                    className="text-primary-600 hover:text-primary-900 p-1"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <AppIcons.Edit className="h-4 w-4" />
                                                </Link>
                                                {hasPermission(Permission.DELETE_LEADS) && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm('Are you sure you want to delete this lead?')) {
                                                                deleteLead(lead.id);
                                                            }
                                                        }}
                                                        className="text-red-600 hover:text-red-900 p-1"
                                                    >
                                                        <AppIcons.Delete className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-subtle">Rows per page:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="bg-background border border-muted rounded px-2 py-1 text-sm"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-subtle">
                            {Math.min((currentPage - 1) * pageSize + 1, filteredAndSortedLeads.length)}-
                            {Math.min(currentPage * pageSize, filteredAndSortedLeads.length)} of {filteredAndSortedLeads.length}
                        </span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-muted rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-muted rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showAssignModal && (
                <AssignUserModal
                    {...({} as any)}
                    onClose={() => setShowAssignModal(false)}
                    users={users}
                    onAssign={handleBulkAssign}
                />
            )}

            {showImportModal && onImportLeads && (
                <ImportLeadsModal
                    {...({} as any)}
                    onClose={() => setShowImportModal(false)}
                    onImport={onImportLeads}
                    customFieldDefs={customFieldDefs}
                    pipelineStages={pipelineStages}
                    users={users}
                />
            )}

            {showSaveFilterModal && (
                <SaveFilterModal
                    isOpen={showSaveFilterModal}
                    onClose={() => setShowSaveFilterModal(false)}
                    onSave={handleSaveFilter}
                />
            )}

            {showLeadDetailModal && selectedLead && (
                <LeadDetailModal
                    {...({} as any)}
                    onClose={() => {
                        setShowLeadDetailModal(false);
                        setSelectedLead(null);
                    }}
                    lead={selectedLead}
                    users={users}
                    pipelineStages={pipelineStages}
                    customFieldDefs={customFieldDefs}
                    tasks={tasks}
                    whatsAppTemplates={whatsAppTemplates}
                    smsTemplates={smsTemplates}
                    currentUser={currentUser}
                    onUpdateLead={onUpdateLead}
                    onUpdateTask={onUpdateTask}
                    onAddTask={onAddTask}
                    onScheduleMessage={onScheduleMessage}
                />
            )}
        </div>
    );
};

export default LeadListPage;
