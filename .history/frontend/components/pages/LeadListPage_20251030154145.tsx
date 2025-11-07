
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

// Extracted smaller components to reduce main component size
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

    return <div className="relative">{children}</div>;
};

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

// Main component
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
}> = (props) => {
    const {
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
    } = props;

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
        'checkbox', 'name', 'source', 'email', 'phone', 'alternatePhone', 'city', 'course', 'company',
        'stage', 'followUpStatus', 'score', 'tags', 'assignedToId', 'dealValue', 'closeDate',
        'campaign', 'facebookCampaign', 'facebookAdset', 'facebookAd', 'createdAt', 'updatedAt', 'actions'
    ]);
    const [visibleColumns, setVisibleColumns] = useState({
        name: true, email: true, phone: true, alternatePhone: false, city: false,
        course: false, company: false, source: false, stage: true, followUp
