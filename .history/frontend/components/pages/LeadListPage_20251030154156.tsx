
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
