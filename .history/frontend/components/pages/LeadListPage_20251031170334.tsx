import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Lead, User, Stage, Task, CustomFieldDefinition, FilterCondition, FilterOperator, Permission, SavedFilter, WhatsAppTemplate, UserRole, LeadSource, ScheduledMessage, SMSTemplate } from '../../types';
import AssignUserModal from '../leads/AssignUserModal';
import { AppIcons } from '../ui/Icons';
import { LEAD_SOURCES } from '../../constants';
import ImportLeadsModal from '../leads/ImportLeadsModal';
import Modal from '../ui/Modal';
import { Link } from 'react-router-dom';
import FilterBuilder from '../ui/FilterBuilder';
import LeadDetailModal from '../leads/LeadDetailModal';

// Resizable table components
const ResizableTable: React.FC<{
    children: React.ReactNode;
    columnWidths: Record<string, number>;
    onColumnResize: (columnId: string, width: number) => void;
    columnOrder: string[];
    onColumnReorder: (newOrder: string[]) => void;
}> = ({ children, columnWidths, onColumnResize, columnOrder, onColumnReorder }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [resizingColumn, setResizingColumn] = useState<string | null>(null);
    const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    const handleMouseDown = (e: React.MouseEvent, columnId: string) => {
        setIsDragging(true);
        setDragStartX(e.clientX);
        setResizingColumn(columnId);
        e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !resizingColumn) return;

        const deltaX = e.clientX - dragStartX;
        const newWidth = Math.max(80, (columnWidths[resizingColumn] || 150) + deltaX);
        onColumnResize(resizingColumn, newWidth);
        setDragStartX(e.clientX);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setResizingColumn(null);
    };

    const handleDragStart = (e: React.DragEvent, columnId: string) => {
        setDraggedColumn(columnId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        setDragOverColumn(columnId);
    };

    const handleDragEnd = () => {
        setDraggedColumn(null);
        setDragOverColumn(null);
    };

    const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
        e.preventDefault();
        if (!draggedColumn || draggedColumn === targetColumnId) return;

        const draggedIndex = columnOrder.indexOf(draggedColumn);
        const targetIndex = columnOrder.indexOf(targetColumnId);

        const newOrder = [...columnOrder];
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedColumn);

        onColumnReorder(newOrder);
        setDraggedColumn(null);
        setDragOverColumn(null);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, resizingColumn, dragStartX]);

    return (
        <div className="relative">
            {children}
        </div>
    );
};

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
    const [sortBy, setSortBy] = useState<'name' | 'email' | 'phone' | 'stage' | 'createdAt' | 'updatedAt' | 'source'>('updatedAt');
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
    const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showBasicFilters, setShowBasicFilters] = useState(false);
    const [showBulkEditModal, setShowBulkEditModal] = useState(false);
    const [basicFilters, setBasicFilters] = useState({
        campaign: '',
        stage: '',
        assignedToId: 0,
        course: ''
    });
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        checkbox: 50,
        name: 200,
        source: 120,
        email: 180,
        phone: 140,
        alternatePhone: 140,
        city: 120,
        course: 150,
        company: 150,
        stage: 120,
        followUpStatus: 140,
        score: 80,
        tags: 120,
        assignedToId: 140,
        dealValue: 120,
        closeDate: 120,
        campaign: 150,
        facebookCampaign: 150,
        facebookAdset: 150,
        facebookAd: 150,
        createdAt: 120,
        updatedAt: 120,
        actions: 100
    });
    const [columnOrder, setColumnOrder] = useState<string[]>([
        'checkbox',
        'name',
        'source',
        'email',
        'phone',
        'alternatePhone',
        'city',
        'course',
        'company',
        'stage',
        'followUpStatus',
        'score',
        'tags',
        'assignedToId',
        'dealValue',
        'closeDate',
        'campaign',
        'facebookCampaign',
        'facebookAdset',
        'facebookAd',
        'createdAt',
        'updatedAt',
        'actions'
    ]);
    const [visibleColumns, setVisibleColumns] = useState({
        // Basic lead fields
        name: true,
        email: true,
        phone: true,
        alternatePhone: false,
        city: false,
        course: false,
        company: false,
        source: false,
        stage: true,
        followUpStatus: false,
        score: false,
        tags: false,
        assignedToId: true,
        dealValue: false,
        closeDate: false,
        campaign: false,
        facebookCampaign: false,
        facebookAdset: false,
        facebookAd: false,
        createdAt: false,
        updatedAt: true,
        // Custom fields will be added dynamically
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

    // Load column preferences from localStorage on mount
    useEffect(() => {
        const savedPreferences = localStorage.getItem('leadColumnPreferences');

        if (savedPreferences) {
            try {
                const parsed = JSON.parse(savedPreferences);
                if (parsed.columnOrder) {
                    setColumnOrder(parsed.columnOrder);
                }
                if (parsed.visibleColumns) {
                    setVisibleColumns(prev => ({ ...prev, ...parsed.visibleColumns }));
                }
            } catch (error) {
                console.error('Failed to parse saved column preferences:', error);
            }
        }
    }, []);

    // Save column preferences to localStorage when they change
    useEffect(() => {
        const preferences = {
            columnOrder,
            visibleColumns
        };
        localStorage.setItem('leadColumnPreferences', JSON.stringify(preferences));
    }, [columnOrder, visibleColumns]);

    // Basic filters result (for live count display)
    const basicFilteredLeads = useMemo(() => {
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

        // Apply basic filters
        if (basicFilters.campaign) {
            filtered = filtered.filter(lead => lead.campaign?.toLowerCase().includes(basicFilters.campaign.toLowerCase()));
        }
        if (basicFilters.stage) {
            filtered = filtered.filter(lead => lead.stage === basicFilters.stage);
        }
        if (basicFilters.assignedToId > 0) {
            filtered = filtered.filter(lead => lead.assignedToId === basicFilters.assignedToId);
        }
        if (basicFilters.course) {
            filtered = filtered.filter(lead => lead.course?.toLowerCase().includes(basicFilters.course.toLowerCase()));
        }

        return filtered;
    }, [leads, searchTerm, basicFilters.campaign, basicFilters.stage, basicFilters.assignedToId, basicFilters.course]);

    // Filter and sort leads
    const filteredAndSortedLeads = useMemo(() => {
        let filtered = basicFilteredLeads;

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
    }, [basicFilteredLeads, filters, sortBy, sortOrder, pipelineStages]);

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

    const handleBulkUpdate = async (updates: Partial<Lead>) => {
        try {
            // Update each selected lead with the bulk changes
            for (const leadId of Array.from(selectedLeads)) {
                const lead = leads.find(l => l.id === leadId);
                if (lead) {
                    await onUpdateLead({ ...lead, ...updates });
                }
            }
            alert(`Successfully updated ${selectedLeads.size} leads!`);
        } catch (error) {
            console.error('Failed to bulk update leads:', error);
            alert('Failed to update leads. Please try again.');
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
        setBasicFilters({ campaign: '', stage: '', assignedToId: 0, course: '' });
        setCurrentPage(1);
    };

    const handleClearBasicFilters = () => {
        setBasicFilters({ campaign: '', stage: '', assignedToId: 0, course: '' });
        setCurrentPage(1);
    };

    const handleColumnResize = (columnId: string, width: number) => {
        setColumnWidths(prev => ({
            ...prev,
            [columnId]: width
        }));
    };

    const handleColumnReorder = (newOrder: string[]) => {
        setColumnOrder(newOrder);
    };

    const handleDragStart = (e: React.DragEvent, columnId: string) => {
        setDraggedColumn(columnId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        setDragOverColumn(columnId);
    };

    const handleDragEnd = () => {
        setDraggedColumn(null);
        setDragOverColumn(null);
    };

    const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
        e.preventDefault();
        if (!draggedColumn || draggedColumn === targetColumnId) return;

        const draggedIndex = columnOrder.indexOf(draggedColumn);
        const targetIndex = columnOrder.indexOf(targetColumnId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const newOrder = [...columnOrder];
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedColumn);

        setColumnOrder(newOrder);
        setDraggedColumn(null);
        setDragOverColumn(null);
    };

    const handleExportLeads = async (exportType: 'filtered' | 'all' | 'selected' | 'currentPage') => {
        try {
            setIsExporting(true);

            let dataToExport: Lead[] = [];

            switch (exportType) {
                case 'filtered':
                    dataToExport = filteredAndSortedLeads;
                    break;
                case 'all':
                    dataToExport = leads;
                    break;
                case 'selected':
                    dataToExport = Array.from(selectedLeads).map(id => leads.find(l => l.id === id)).filter(Boolean) as Lead[];
                    break;
                case 'currentPage':
                    dataToExport = paginatedLeads;
                    break;
            }

            if (dataToExport.length === 0) {
                alert('No leads to export.');
                return;
            }

            const exportData = dataToExport.map(lead => ({
                Name: lead.name || '',
                Email: lead.email || '',
                Phone: lead.phone || '',
                'Alternate Phone': lead.alternatePhone || '',
                City: lead.city || '',
                Course: lead.course || '',
                Company: lead.company || '',
                Source: typeof lead.source === 'string' ? lead.source : '',
                Stage: getStageName(lead.stage),
                'Follow Up Status': lead.followUpStatus || '',
                Score: lead.score || 0,
                Tags: lead.tags?.join(', ') || '',
                'Assigned To': getUserName(lead.assignedToId),
                'Deal Value': lead.dealValue || 0,
                'Close Date': lead.closeDate ? new Date(lead.closeDate).toLocaleDateString() : '',
                Campaign: lead.campaign || '',
                'Facebook Campaign': lead.facebookCampaign || '',
                'Facebook Adset': lead.facebookAdset || '',
                'Facebook Ad': lead.facebookAd || '',
                'Created At': lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '',
                'Updated At': lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : '',
                // Include custom fields
                ...Object.fromEntries(
                    customFieldDefs.map(field => [
                        field.name,
                        lead.customFields?.[field.id] || ''
                    ])
                )
            }));

            const csvContent = [
                Object.keys(exportData[0]).join(','),
                ...exportData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);

            const exportTypeLabel = {
                filtered: 'filtered',
                all: 'all',
                selected: 'selected',
                currentPage: 'current_page'
            }[exportType];

            link.setAttribute('download', `leads_export_${exportTypeLabel}_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setShowExportModal(false);
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
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-subtle">
                            {filteredAndSortedLeads.length} lead{filteredAndSortedLeads.length !== 1 ? 's' : ''}
                            {searchTerm && ` matching "${searchTerm}"`}
                        </p>
                        {(basicFilters.campaign || basicFilters.stage || basicFilters.assignedToId > 0) && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-primary-600 font-medium">Basic filters active:</span>
                                <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs">
                                    {basicFilteredLeads.length} results
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    {hasPermission(Permission.MANAGE_USERS) && (
                        <>
                            <div className="max-w-xs mr-4">
                                <div className="relative">
                                    <AppIcons.Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-subtle" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, phone, company..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-12 py-3 bg-background border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                    />
                                    <button
                                        onClick={() => setShowSearchModal(true)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-subtle hover:text-primary-500"
                                        title="Advanced Search Options"
                                    >
                                        <AppIcons.Filter className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <AppIcons.Import className="h-4 w-4" />
                                Import
                            </button>
                            <button
                                onClick={() => setShowExportModal(true)}
                                disabled={filteredAndSortedLeads.length === 0}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <AppIcons.Export className="h-4 w-4" />
                                Export
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
                            <button
                                onClick={() => setShowColumnSettings(true)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <AppIcons.Settings className="h-4 w-4" />
                                Columns
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-surface rounded-lg p-4 space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowBasicFilters(!showBasicFilters)}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
                                showBasicFilters || basicFilters.campaign || basicFilters.stage || basicFilters.assignedToId > 0
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-muted hover:bg-muted/80 text-on-surface'
                            }`}
                        >
                            <AppIcons.Filter className="h-4 w-4" />
                            Basic Filters
                            {(basicFilters.campaign || basicFilters.stage || basicFilters.assignedToId > 0 || basicFilters.course) && (
                                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                    {(basicFilters.campaign ? 1 : 0) + (basicFilters.stage ? 1 : 0) + (basicFilters.assignedToId > 0 ? 1 : 0) + (basicFilters.course ? 1 : 0)}
                                </span>
                            )}
                        </button>
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
                        {(filters.length > 0 || basicFilters.campaign || basicFilters.stage || basicFilters.assignedToId > 0 || basicFilters.course) && (
                            <button
                                onClick={handleClearFilters}
                                className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                </div>

                {/* Basic Filters Panel */}
                {showBasicFilters && (
                    <div className="border-t border-muted pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-subtle mb-2">
                                    Campaign
                                </label>
                                <input
                                    type="text"
                                    value={basicFilters.campaign}
                                    onChange={(e) => setBasicFilters(prev => ({ ...prev, campaign: e.target.value }))}
                                    placeholder="Filter by campaign name"
                                    className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                {basicFilters.campaign && (
                                    <p className="text-xs text-primary-600 mt-1">
                                        Showing {basicFilteredLeads.length} leads with campaign containing "{basicFilters.campaign}"
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-subtle mb-2">
                                    Lead Stage
                                </label>
                                <select
                                    value={basicFilters.stage}
                                    onChange={(e) => setBasicFilters(prev => ({ ...prev, stage: e.target.value }))}
                                    className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">All Stages</option>
                                    {pipelineStages.map(stage => (
                                        <option key={stage.id} value={stage.id}>{stage.name}</option>
                                    ))}
                                </select>
                                {basicFilters.stage && (
                                    <p className="text-xs text-primary-600 mt-1">
                                        Showing {basicFilteredLeads.length} leads in {pipelineStages.find(s => s.id === basicFilters.stage)?.name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-subtle mb-2">
                                    Assigned To
                                </label>
                                <select
                                    value={basicFilters.assignedToId}
                                    onChange={(e) => setBasicFilters(prev => ({ ...prev, assignedToId: Number(e.target.value) }))}
                                    className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value={0}>All Users</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                                {basicFilters.assignedToId > 0 && (
                                    <p className="text-xs text-primary-600 mt-1">
                                        Showing {basicFilteredLeads.length} leads assigned to {users.find(u => u.id === basicFilters.assignedToId)?.name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-subtle mb-2">
                                    Course
                                </label>
                                <select
                                    value={basicFilters.course}
                                    onChange={(e) => setBasicFilters(prev => ({ ...prev, course: e.target.value }))}
                                    className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">All Courses</option>
                                    {/* Get unique courses from leads */}
                                    {Array.from(new Set(leads.map(lead => lead.course).filter(Boolean))).sort().map(course => (
                                        <option key={course} value={course}>{course}</option>
                                    ))}
                                </select>
                                {basicFilters.course && (
                                    <p className="text-xs text-primary-600 mt-1">
                                        Showing {basicFilteredLeads.length} leads with course "{basicFilters.course}"
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <div className="text-sm text-subtle">
                                Total results: <span className="font-medium text-primary-600">{basicFilteredLeads.length}</span> leads
                            </div>
                            <button
                                onClick={handleClearBasicFilters}
                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded"
                            >
                                Clear Basic Filters
                            </button>
                        </div>
                    </div>
                )}

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
                                onClick={() => setShowBulkEditModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                            >
                                Bulk Edit
                            </button>
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
                    <ResizableTable
                        columnWidths={columnWidths}
                        onColumnResize={handleColumnResize}
                        columnOrder={columnOrder}
                        onColumnReorder={handleColumnReorder}
                    >
                        <table className="min-w-full divide-y divide-muted">
                            <thead className="bg-muted/50">
                                <tr>
                                    {columnOrder.filter(col => visibleColumns[col] !== false).map(columnId => {
                                        if (columnId === 'checkbox') {
                                            return (
                                                <th key={columnId} className="px-6 py-3 text-left">
                                                    <input
                                                        type="checkbox"
                                                        checked={paginatedLeads.length > 0 && paginatedLeads.every(lead => selectedLeads.has(lead.id))}
                                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                                        className="rounded border-muted"
                                                    />
                                                </th>
                                            );
                                        }

                                        if (columnId === 'actions') {
                                            return (
                                                <th key={columnId} className="px-6 py-3 text-right text-xs font-medium text-subtle uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            );
                                        }

                                        const columnConfig = {
                                            name: { label: 'Name', sortable: true, sortKey: 'name' },
                                            source: { label: 'Source', sortable: true, sortKey: 'source' },
                                            email: { label: 'Email', sortable: true, sortKey: 'email' },
                                            phone: { label: 'Phone', sortable: true, sortKey: 'phone' },
                                            alternatePhone: { label: 'Alternate Phone', sortable: false },
                                            city: { label: 'City', sortable: false },
                                            course: { label: 'Course', sortable: false },
                                            company: { label: 'Company', sortable: false },
                                            stage: { label: 'Stage', sortable: true, sortKey: 'stage' },
                                            followUpStatus: { label: 'Follow Up Status', sortable: false },
                                            score: { label: 'Score', sortable: false },
                                            tags: { label: 'Tags', sortable: false },
                                            assignedToId: { label: 'Assigned To', sortable: false },
                                            dealValue: { label: 'Deal Value', sortable: false },
                                            closeDate: { label: 'Close Date', sortable: false },
                                            campaign: { label: 'Campaign', sortable: false },
                                            facebookCampaign: { label: 'Facebook Campaign', sortable: false },
                                            facebookAdset: { label: 'Facebook Adset', sortable: false },
                                            facebookAd: { label: 'Facebook Ad', sortable: false },
                                            createdAt: { label: 'Created At', sortable: false },
                                            updatedAt: { label: 'Last Updated', sortable: true, sortKey: 'updatedAt' }
                                        };

                                        const config = columnConfig[columnId as keyof typeof columnConfig];
                                        if (!config) return null;

                                        return (
                                            <th
                                                key={columnId}
                                                className={`px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider ${
                                                    config.sortable ? 'cursor-pointer hover:bg-muted/70' : ''
                                                }`}
                                                onClick={config.sortable ? () => handleSort(config.sortKey as any) : undefined}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {config.label}
                                                    {config.sortable && sortBy === config.sortKey && (
                                                        <AppIcons.ChevronRight className={`h-3 w-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                                                    )}
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="bg-surface divide-y divide-muted">
                                {paginatedLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-subtle">
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
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface">
                                                {typeof lead.source === 'string' ? lead.source : 'Unknown'}
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
                    </ResizableTable>
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

            {/* Advanced Search Modal */}
            {showSearchModal && (
                <Modal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} title="Search Leads">
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="Name"
                                className="bg-background border border-muted rounded py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setSearchTerm(e.target.value);
                                        setShowSearchModal(false);
                                    }
                                }}
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                className="bg-background border border-muted rounded py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setSearchTerm(e.target.value);
                                        setShowSearchModal(false);
                                    }
                                }}
                            />
                            <input
                                type="tel"
                                placeholder="Phone"
                                className="bg-background border border-muted rounded py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setSearchTerm(e.target.value);
                                        setShowSearchModal(false);
                                    }
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Company"
                                className="bg-background border border-muted rounded py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setSearchTerm(e.target.value);
                                        setShowSearchModal(false);
                                    }
                                }}
                            />
                            <input
                                type="text"
                                placeholder="City"
                                className="bg-background border border-muted rounded py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setSearchTerm(e.target.value);
                                        setShowSearchModal(false);
                                    }
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Course"
                                className="bg-background border border-muted rounded py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setSearchTerm(e.target.value);
                                        setShowSearchModal(false);
                                    }
                                }}
                            />
                        </div>
                        <div className="flex justify-end pt-3 border-t border-muted">
                            <button
                                onClick={() => setShowSearchModal(false)}
                                className="bg-muted hover:bg-subtle/80 text-on-surface py-1 px-3 rounded text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Export Options Modal */}
            {showExportModal && (
                <Modal isOpen={showExportModal} onClose={() => setShowExportModal(false)} title="Export Leads">
                    <div className="space-y-4">
                        <p className="text-sm text-subtle">Choose what leads you want to export:</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => handleExportLeads('filtered')}
                                disabled={isExporting}
                                className="w-full text-left p-4 border border-muted rounded-lg hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-on-surface">Filtered Leads</h4>
                                        <p className="text-sm text-subtle">Export leads matching current search and filters ({filteredAndSortedLeads.length} leads)</p>
                                    </div>
                                    <AppIcons.Export className="h-5 w-5 text-primary-500" />
                                </div>
                            </button>

                            <button
                                onClick={() => handleExportLeads('all')}
                                disabled={isExporting}
                                className="w-full text-left p-4 border border-muted rounded-lg hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-on-surface">All Leads</h4>
                                        <p className="text-sm text-subtle">Export all leads in your organization ({leads.length} leads)</p>
                                    </div>
                                    <AppIcons.Export className="h-5 w-5 text-primary-500" />
                                </div>
                            </button>

                            <button
                                onClick={() => handleExportLeads('selected')}
                                disabled={isExporting || selectedLeads.size === 0}
                                className="w-full text-left p-4 border border-muted rounded-lg hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-on-surface">Selected Leads</h4>
                                        <p className="text-sm text-subtle">Export only the leads you have selected ({selectedLeads.size} leads)</p>
                                    </div>
                                    <AppIcons.Export className="h-5 w-5 text-primary-500" />
                                </div>
                            </button>

                            <button
                                onClick={() => handleExportLeads('currentPage')}
                                disabled={isExporting}
                                className="w-full text-left p-4 border border-muted rounded-lg hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-on-surface">Current Page</h4>
                                        <p className="text-sm text-subtle">Export leads shown on current page ({paginatedLeads.length} leads)</p>
                                    </div>
                                    <AppIcons.Export className="h-5 w-5 text-primary-500" />
                                </div>
                            </button>
                        </div>

                        {isExporting && (
                            <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mr-2"></div>
                                <span className="text-sm text-subtle">Exporting leads...</span>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-muted">
                            <button
                                onClick={() => setShowExportModal(false)}
                                disabled={isExporting}
                                className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Bulk Edit Modal */}
            {showBulkEditModal && (
                <Modal isOpen={showBulkEditModal} onClose={() => setShowBulkEditModal(false)} title={`Bulk Edit ${selectedLeads.size} Leads`}>
                    <div className="space-y-6">
                        <p className="text-sm text-subtle">Update multiple leads at once. Only fill in the fields you want to change.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Stage */}
                            <div>
                                <label className="block text-sm font-medium text-subtle mb-2">
                                    Lead Stage
                                </label>
                                <select
                                    className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleBulkUpdate({ stage: e.target.value });
                                        }
                                    }}
                                >
                                    <option value="">Select Stage</option>
                                    {pipelineStages.map(stage => (
                                        <option key={stage.id} value={stage.id}>{stage.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Assigned To */}
                            <div>
                                <label className="block text-sm font-medium text-subtle mb-2">
                                    Assigned To
                                </label>
                                <select
                                    className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleBulkUpdate({ assignedToId: Number(e.target.value) });
                                        }
                                    }}
                                >
                                    <option value="">Select User</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Follow Up Status */}
                            <div>
                                <label className="block text-sm font-medium text-subtle mb-2">
                                    Follow Up Status
                                </label>
                                <select
                                    className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleBulkUpdate({ followUpStatus: e.target.value as any });
                                        }
                                    }}
                                >
                                    <option value="">Select Status</option>
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>

                            {/* Deal Value */}
                            <div>
                                <label className="block text-sm font-medium text-subtle mb-2">
                                    Deal Value
                                </label>
                                <input
                                    type="number"
                                    placeholder="Enter deal value"
                                    className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleBulkUpdate({ dealValue: Number(e.target.value) });
                                        }
                                    }}
                                />
                            </div>

                            {/* Campaign */}
                            <div>
                                <label className="block text-sm font-medium text-subtle mb-2">
                                    Campaign
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter campaign name"
                                    className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    onChange={(e) => {
                                        if (e.target.value.trim()) {
                                            handleBulkUpdate({ campaign: e.target.value.trim() });
                                        }
                                    }}
                                />
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-medium text-subtle mb-2">
                                    Tags (comma separated)
                                </label>
                                <input
                                    type="text"
                                    placeholder="tag1, tag2, tag3"
                                    className="w-full bg-background border border-muted rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    onChange={(e) => {
                                        if (e.target.value.trim()) {
                                            handleBulkUpdate({ tags: e.target.value.split(',').map(tag => tag.trim()) });
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-muted">
                            <button
                                onClick={() => setShowBulkEditModal(false)}
                                className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowBulkEditModal(false);
                                    setSelectedLeads(new Set());
                                }}
                                className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Column Settings Modal */}
            {showColumnSettings && (
                <Modal isOpen={showColumnSettings} onClose={() => setShowColumnSettings(false)} title="Customize Columns">
                    <div className="space-y-4">
                        <p className="text-sm text-subtle">Select which columns to display and drag to reorder them:</p>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {/* Basic Lead Fields */}
                            <div>
                                <h4 className="text-sm font-medium text-on-surface mb-2">Basic Lead Fields</h4>
                                <div className="space-y-2 pl-2">
                                    {[
                                        { key: 'name', label: 'Name' },
                                        { key: 'source', label: 'Source' },
                                        { key: 'email', label: 'Email' },
                                        { key: 'phone', label: 'Phone' },
                                        { key: 'alternatePhone', label: 'Alternate Phone' },
                                        { key: 'city', label: 'City' },
                                        { key: 'course', label: 'Course' },
                                        { key: 'company', label: 'Company' },
                                        { key: 'stage', label: 'Stage' },
                                        { key: 'followUpStatus', label: 'Follow Up Status' },
                                        { key: 'score', label: 'Score' },
                                        { key: 'tags', label: 'Tags' },
                                        { key: 'assignedToId', label: 'Assigned To' },
                                        { key: 'dealValue', label: 'Deal Value' },
                                        { key: 'closeDate', label: 'Close Date' },
                                        { key: 'createdAt', label: 'Created At' },
                                        { key: 'updatedAt', label: 'Last Updated' }
                                    ].map(({ key, label }) => (
                                        <div
                                            key={key}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, key)}
                                            onDragOver={(e) => handleDragOver(e, key)}
                                            onDragEnd={handleDragEnd}
                                            onDrop={(e) => handleDrop(e, key)}
                                            className={`flex items-center space-x-3 p-2 rounded cursor-move transition-colors ${
                                                draggedColumn === key ? 'opacity-50' : ''
                                            } ${dragOverColumn === key ? 'bg-primary-100' : 'hover:bg-muted/50'}`}
                                        >
                                            <AppIcons.GripVertical className="h-4 w-4 text-subtle" />
                                            <input
                                                type="checkbox"
                                                checked={visibleColumns[key] || false}
                                                onChange={(e) => setVisibleColumns(prev => ({
                                                    ...prev,
                                                    [key]: e.target.checked
                                                }))}
                                                className="rounded border-muted"
                                            />
                                            <span className="text-sm text-on-surface">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Facebook Form Fields */}
                            <div>
                                <h4 className="text-sm font-medium text-on-surface mb-2">Facebook Form Fields</h4>
                                <div className="space-y-2 pl-2">
                                    {[
                                        { key: 'campaign', label: 'Campaign' },
                                        { key: 'facebookCampaign', label: 'Facebook Campaign' },
                                        { key: 'facebookAdset', label: 'Facebook Adset' },
                                        { key: 'facebookAd', label: 'Facebook Ad' }
                                    ].map(({ key, label }) => (
                                        <div
                                            key={key}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, key)}
                                            onDragOver={(e) => handleDragOver(e, key)}
                                            onDragEnd={handleDragEnd}
                                            onDrop={(e) => handleDrop(e, key)}
                                            className={`flex items-center space-x-3 p-2 rounded cursor-move transition-colors ${
                                                draggedColumn === key ? 'opacity-50' : ''
                                            } ${dragOverColumn === key ? 'bg-primary-100' : 'hover:bg-muted/50'}`}
                                        >
                                            <AppIcons.GripVertical className="h-4 w-4 text-subtle" />
                                            <input
                                                type="checkbox"
                                                checked={visibleColumns[key] || false}
                                                onChange={(e) => setVisibleColumns(prev => ({
                                                    ...prev,
                                                    [key]: e.target.checked
                                                }))}
                                                className="rounded border-muted"
                                            />
                                            <span className="text-sm text-on-surface">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Fields */}
                            {customFieldDefs.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-on-surface mb-2">Custom Fields</h4>
                                    <div className="space-y-2 pl-2">
                                        {customFieldDefs.map((field) => (
                                            <div
                                                key={field.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, `custom_${field.id}`)}
                                                onDragOver={(e) => handleDragOver(e, `custom_${field.id}`)}
                                                onDragEnd={handleDragEnd}
                                                onDrop={(e) => handleDrop(e, `custom_${field.id}`)}
                                                className={`flex items-center space-x-3 p-2 rounded cursor-move transition-colors ${
                                                    draggedColumn === `custom_${field.id}` ? 'opacity-50' : ''
                                                } ${dragOverColumn === `custom_${field.id}` ? 'bg-primary-100' : 'hover:bg-muted/50'}`}
                                            >
                                                <AppIcons.GripVertical className="h-4 w-4 text-subtle" />
                                                <input
                                                    type="checkbox"
                                                    checked={visibleColumns[`custom_${field.id}`] || false}
                                                    onChange={(e) => setVisibleColumns(prev => ({
                                                        ...prev,
                                                        [`custom_${field.id}`]: e.target.checked
                                                    }))}
                                                    className="rounded border-muted"
                                                />
                                                <span className="text-sm text-on-surface">{field.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-muted">
                            <button
                                onClick={() => setShowColumnSettings(false)}
                                className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setShowColumnSettings(false)}
                                className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg"
                            >
                                Apply Changes
                            </button>
                        </div>
                    </div>
                </Modal>
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
