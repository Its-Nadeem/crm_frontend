



import React, { useMemo, useState, useEffect } from 'react';
import { Lead, User, LeadSource, Stage, CustomDashboardWidget } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { AppIcons } from '../ui/Icons';
import { StatCard } from '../ui/StatCard';
import { LEAD_SOURCES } from '../../constants';
import Modal from '../ui/Modal';
import { faker } from '@faker-js/faker';
import SystemMonitor from '../ui/SystemMonitor';
import { apiService } from '../../src/services/api';

const FilterDropdown: React.FC<{ label: string; options: {value: string, label: string}[]; value: string; onChange: (value: string) => void;}> = ({ label, options, value, onChange}) => (
    <div className="flex-1 min-w-[150px]">
        <label className="text-xs font-medium text-subtle">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full mt-1 bg-background border border-muted rounded-lg py-2 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
            {[{value: 'all', label: 'All'}, ...options].map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const CustomizeDashboardModal: React.FC<{
    widgets: Record<string, boolean>;
    setWidgets: (widgets: Record<string, boolean>) => void;
    onClose: () => void;
}> = ({ widgets, setWidgets, onClose }) => {
    const toggleWidget = (key: string) => {
        setWidgets({ ...widgets, [key]: !widgets[key] });
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Customize Dashboard">
            <p className="text-subtle mb-4">Select the built-in widgets you want to see on your dashboard.</p>
            <div className="space-y-2">
                <label className="flex items-center p-3 bg-background rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <input type="checkbox" checked={widgets.leadsBySource} onChange={() => toggleWidget('leadsBySource')} className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500" />
                    <span className="ml-3 font-medium text-on-surface">Leads by Source Chart</span>
                </label>
                 <label className="flex items-center p-3 bg-background rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <input type="checkbox" checked={widgets.leadsByStage} onChange={() => toggleWidget('leadsByStage')} className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500" />
                    <span className="ml-3 font-medium text-on-surface">Leads by Stage Chart</span>
                </label>
            </div>
             <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-muted">
                <button type="button" onClick={onClose} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Done</button>
            </div>
        </Modal>
    );
};

const DIMENSIONS = [
  { value: 'source', label: 'Lead Source' },
  { value: 'stage', label: 'Pipeline Stage' },
  { value: 'assignedToId', label: 'Owner (User)' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'createdAt_month', label: 'Date (by Month)' },
];

const METRICS = [
  { value: 'lead_count', label: 'Number of Leads' },
  { value: 'deal_value_sum', label: 'Total Deal Value' },
  { value: 'deal_value_avg', label: 'Average Deal Value' },
];

const CHART_TYPES: { value: CustomDashboardWidget['chartType']; label: string; icon: React.ReactNode }[] = [
  { value: 'bar', label: 'Bar Chart', icon: <AppIcons.ChartBar className="h-8 w-8" /> },
  { value: 'pie', label: 'Pie Chart', icon: <AppIcons.Reports className="h-8 w-8" /> },
  { value: 'line', label: 'Line Chart', icon: <AppIcons.Grow className="h-8 w-8" /> },
  { value: 'stat', label: 'Stat Card', icon: <AppIcons.Leads className="h-8 w-8" /> },
];

const AddWidgetModal: React.FC<{
    onClose: () => void;
    onSave: (widget: CustomDashboardWidget) => void;
    existingWidget: CustomDashboardWidget | null;
}> = ({ onClose, onSave, existingWidget }) => {
    const [widget, setWidget] = useState<Partial<CustomDashboardWidget>>(existingWidget || {
        title: '',
        chartType: 'bar',
        metric: 'lead_count',
        dimension: 'source',
    });

    const handleSave = () => {
        if (!widget.title) {
            alert("Please enter a title for the widget.");
            return;
        }
        onSave({
            id: existingWidget?.id || crypto.randomUUID(),
            ...widget
        } as CustomDashboardWidget);
        onClose();
    }
    
    return (
        <Modal isOpen={true} onClose={onClose} title={existingWidget ? "Edit Widget" : "Add New Dashboard Widget"}>
            <div className="space-y-6">
                 <div>
                    <label className="block text-sm font-medium text-subtle">Widget Title</label>
                    <input type="text" value={widget.title} onChange={e => setWidget(w => ({ ...w, title: e.target.value }))} placeholder="e.g., Leads per Source" className="mt-1 block w-full bg-background border border-muted rounded-md py-2 px-3 focus:outline-none focus:ring-primary-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-subtle mb-2">Chart Style</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {CHART_TYPES.map(type => (
                            <button key={type.value} onClick={() => setWidget(w => ({ ...w, chartType: type.value }))} className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center gap-2 ${widget.chartType === type.value ? 'border-primary-500 bg-primary-500/10' : 'border-muted bg-surface hover:border-primary-400'}`}>
                                {type.icon}
                                <span className="text-sm font-semibold">{type.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-subtle">Metric to Display</label>
                        <select value={widget.metric} onChange={e => setWidget(w => ({ ...w, metric: e.target.value as any }))} className="mt-1 block w-full bg-background border border-muted rounded-md py-2 px-3 focus:outline-none focus:ring-primary-500">
                           {METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-subtle">Group By (Dimension)</label>
                         <select value={widget.dimension} onChange={e => setWidget(w => ({ ...w, dimension: e.target.value as any }))} className="mt-1 block w-full bg-background border border-muted rounded-md py-2 px-3 focus:outline-none focus:ring-primary-500">
                           {DIMENSIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-muted">
                <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button type="button" onClick={handleSave} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">{existingWidget ? "Save Changes" : "Add Widget"}</button>
            </div>
        </Modal>
    )
}

const CustomWidgetRenderer: React.FC<{
    widget: CustomDashboardWidget;
    leads: Lead[];
    users: User[];
    pipelineStages: Stage[];
    onEdit: () => void;
    onDelete: () => void;
}> = ({ widget, leads, users, pipelineStages, onEdit, onDelete }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isOpen, setIsOpen] = useState(true);

    const data = useMemo(() => {
        const getGroupName = (item: Lead) => {
            switch(widget.dimension) {
                case 'assignedToId': return users.find(u => u.id === item.assignedToId)?.name || 'Unassigned';
                case 'stage': return pipelineStages.find(s => s.id === item.stage)?.name || 'Unknown Stage';
                case 'createdAt_month': return new Date(item.createdAt).toISOString().slice(0, 7); // YYYY-MM
                default: return item[widget.dimension as keyof Lead] as string || 'N/A';
            }
        }
        
        const grouped = leads.reduce((acc, lead) => {
            const key = getGroupName(lead);
            if (!acc[key]) acc[key] = [];
            acc[key].push(lead);
            return acc;
        }, {} as Record<string, Lead[]>);
        
        let processed = Object.entries(grouped).map(([name, group]: [string, Lead[]]) => {
            let value = 0;
            switch(widget.metric) {
                case 'lead_count': value = group.length; break;
                case 'deal_value_sum': value = group.reduce((sum, l) => sum + l.dealValue, 0); break;
                case 'deal_value_avg': value = group.length > 0 ? group.reduce((sum, l) => sum + l.dealValue, 0) / group.length : 0; break;
            }
            return { name, value };
        });
        
        if (widget.dimension === 'createdAt_month') {
            processed = processed.sort((a,b) => a.name.localeCompare(b.name));
        }

        return processed;
    }, [widget, leads, users, pipelineStages]);

    const renderChart = () => {
         const COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899'];
        if (data.length === 0) return <div className="flex-grow flex items-center justify-center text-subtle">No data for this configuration.</div>;
        
        switch (widget.chartType) {
            case 'stat':
                const total = data.reduce((sum, item) => sum + item.value, 0);
                const value = widget.metric === 'deal_value_avg' ? total / data.length : total;
                const formattedValue = widget.metric.includes('deal_value') ? `$${Math.round(value).toLocaleString()}` : value.toLocaleString();
                return <div className="flex-grow flex items-center justify-center text-5xl font-bold">{formattedValue}</div>
            case 'pie':
                return <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{data.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>;
            case 'line':
                 return <ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--muted)"/><XAxis dataKey="name" stroke="var(--subtle)" tick={{fontSize: 12}} /><YAxis stroke="var(--subtle)" /><Tooltip /><Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} /></LineChart></ResponsiveContainer>;
            case 'bar':
            default:
                 return <ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--muted)"/><XAxis dataKey="name" stroke="var(--subtle)" tick={{fontSize: 10}} interval={0} angle={-35} textAnchor="end" height={50}/><YAxis stroke="var(--subtle)" /><Tooltip /><Bar dataKey="value" radius={[4, 4, 0, 0]}>{data.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer>;
        }
    }

    return (
        <div className="bg-surface rounded-xl shadow-sm border border-muted flex flex-col">
            <div className="flex justify-between items-start p-6 pb-2">
                <button onClick={() => setIsOpen(!isOpen)} className="flex-grow text-left">
                    <h3 className="font-semibold text-on-surface">{widget.title}</h3>
                </button>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsOpen(!isOpen)} className="p-1 text-subtle hover:text-on-surface">
                        <AppIcons.ChevronRight className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-90' : ''}`}/>
                    </button>
                    <div className="relative">
                        <button onClick={() => setMenuOpen(!menuOpen)} onBlur={() => setTimeout(() => setMenuOpen(false), 200)} className="p-1 text-subtle hover:text-on-surface"><AppIcons.Settings className="w-5 h-5"/></button>
                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-32 bg-surface rounded-md shadow-lg border border-muted z-10">
                                <button onClick={onEdit} className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-muted">Edit</button>
                                <button onClick={onDelete} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-muted">Delete</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
             <div className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[400px]' : 'max-h-0'}`}>
                <div className="p-6 pt-0 h-[340px] flex flex-col">{renderChart()}</div>
            </div>
        </div>
    )
}

interface DashboardProps {
    leads: Lead[];
    users: User[];
    pipelineStages: Stage[];
    customWidgets: CustomDashboardWidget[];
    onSaveWidget: (widget: CustomDashboardWidget) => void;
    onDeleteWidget: (widgetId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ leads, users, pipelineStages, customWidgets, onSaveWidget, onDeleteWidget }) => {
    const [sourceFilter, setSourceFilter] = useState('all');
    const [userFilter, setUserFilter] = useState('all');
    const [campaignFilter, setCampaignFilter] = useState('all');
    const [isCustomizeModalOpen, setCustomizeModalOpen] = useState(false);
    const [isAddWidgetModalOpen, setAddWidgetModalOpen] = useState(false);
    const [editingWidget, setEditingWidget] = useState<CustomDashboardWidget | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [chartsOpen, setChartsOpen] = useState({ source: true, stage: true });
    const [systemInfo, setSystemInfo] = useState<any>(null);
    const [showSystemMonitor, setShowSystemMonitor] = useState(false);

    const [widgets, setWidgets] = useState(() => {
        try {
            const saved = localStorage.getItem('dashboard-widgets');
            return saved ? JSON.parse(saved) : { leadsBySource: true, leadsByStage: true };
        } catch {
            return { leadsBySource: true, leadsByStage: true };
        }
    });

    useEffect(() => {
        localStorage.setItem('dashboard-widgets', JSON.stringify(widgets));
    }, [widgets]);

    // Fetch system information
    useEffect(() => {
        const fetchSystemInfo = async () => {
            try {
                const data = await apiService.getSuperAdminMonitoring();
                setSystemInfo(data.systemInfo);
            } catch (error) {
                console.error('Failed to fetch system info:', error);
            }
        };

        fetchSystemInfo();
        // Refresh every 30 seconds for real-time updates (reduced frequency to avoid excessive API calls)
        const interval = setInterval(fetchSystemInfo, 30000);
        return () => clearInterval(interval);
    }, []);

    const campaigns = useMemo(() => [...new Set(leads.map(l => l.campaign))], [leads]);

    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            const sourceMatch = sourceFilter === 'all' || lead.source === sourceFilter;
            const userMatch = userFilter === 'all' || lead.assignedToId === parseInt(userFilter, 10);
            const campaignMatch = campaignFilter === 'all' || lead.campaign === campaignFilter;
            return sourceMatch && userMatch && campaignMatch;
        });
    }, [leads, sourceFilter, userFilter, campaignFilter]);

    const totalLeads = filteredLeads.length;
    const totalValue = filteredLeads.reduce((sum, lead) => sum + lead.dealValue, 0);
    const convertedLeads = filteredLeads.filter(l => l.stage === 'closed-won').length;
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';

    const leadsBySource = useMemo(() => {
        const sourceCounts = filteredLeads.reduce((acc, lead) => {
            acc[lead.source] = (acc[lead.source] || 0) + 1;
            return acc;
        }, {} as Record<LeadSource, number>);
        return Object.entries(sourceCounts).map(([name, value]) => ({ name, value }));
    }, [filteredLeads]);
    
    const leadsByStage = useMemo(() => {
        const stageMap = new Map<string, { name: string; count: number; color: string; }>(pipelineStages.map(s => [s.id, { name: s.name, count: 0, color: s.color }]));
        
        filteredLeads.forEach(lead => {
            const stageInfo = stageMap.get(lead.stage);
            if (stageInfo) {
                stageInfo.count++;
            }
        });
        return Array.from(stageMap.values());
    }, [filteredLeads, pipelineStages]);

    const handleOpenAddWidgetModal = (widget: CustomDashboardWidget | null = null) => {
        setEditingWidget(widget);
        setAddWidgetModalOpen(true);
    };
    
    return (
        <div className="space-y-6">
            {isCustomizeModalOpen && <CustomizeDashboardModal widgets={widgets} setWidgets={setWidgets} onClose={() => setCustomizeModalOpen(false)} />}
            {isAddWidgetModalOpen && <AddWidgetModal existingWidget={editingWidget} onClose={() => { setAddWidgetModalOpen(false); setEditingWidget(null);}} onSave={onSaveWidget} />}

            <div className="flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-4">
                 <div>
                    <h1 className="text-3xl font-bold text-on-surface">Leads Dashboard</h1>
                    <p className="text-subtle mt-1">An overview of your sales pipeline and performance.</p>
                </div>
                 <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button onClick={() => setCustomizeModalOpen(true)} className="flex-1 sm:flex-none bg-surface hover:bg-muted text-on-surface font-semibold py-2 px-4 rounded-lg flex items-center justify-center border border-muted">
                        Customize
                    </button>
                    <button onClick={() => setShowSystemMonitor(!showSystemMonitor)} className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center">
                        <AppIcons.ChartBar className="w-5 h-5 mr-2" /> System Monitor
                    </button>
                    <button onClick={() => handleOpenAddWidgetModal()} className="flex-1 sm:flex-none bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center">
                        <AppIcons.Add className="w-5 h-5 mr-2" /> Add Widget
                    </button>
                 </div>
            </div>

            <div className="bg-surface p-4 rounded-xl shadow-sm border border-muted">
                <button onClick={() => setShowFilters(!showFilters)} className="md:hidden w-full flex justify-between items-center font-semibold mb-2">
                    <span>Filters</span>
                    <AppIcons.ChevronRight className={`h-5 w-5 text-subtle transition-transform ${showFilters ? 'rotate-90' : ''}`} />
                </button>
                <div className={`flex-col md:flex-row flex-wrap items-center gap-4 ${showFilters ? 'flex' : 'hidden'} md:flex`}>
                    <FilterDropdown
                        label="Source"
                        value={sourceFilter}
                        onChange={setSourceFilter}
                        options={LEAD_SOURCES.map(s => ({ value: s, label: s }))}
                    />
                    <FilterDropdown
                        label="Campaign"
                        value={campaignFilter}
                        onChange={setCampaignFilter}
                        options={campaigns.map(c => ({ value: c, label: c }))}
                    />
                    <FilterDropdown
                        label="Owner"
                        value={userFilter}
                        onChange={setUserFilter}
                        options={users.filter(u => u.role === "Sales Rep").map(u => ({ value: u.id.toString(), label: u.name }))}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Leads" value={totalLeads.toString()} icon={<AppIcons.Leads className="h-6 w-6 text-blue-500"/>} />
                <StatCard title="Pipeline Value" value={`$${(totalValue / 1000).toFixed(1)}k`} icon={<AppIcons.Reports className="h-6 w-6 text-purple-500"/>} />
                <StatCard title="Closed-Won Deals" value={convertedLeads.toString()} icon={<AppIcons.Rocket className="h-6 w-6 text-green-500"/>}/>
                <StatCard title="Conversion Rate" value={`${conversionRate}%`} icon={<AppIcons.Bolt className="h-6 w-6 text-orange-500"/>}/>
            </div>
            
            {(filteredLeads.length === 0) ? (
                 <div className="text-center py-16 bg-surface rounded-xl shadow-sm border border-muted">
                    <p className="text-lg font-medium text-subtle">No leads match the current filters.</p>
                </div>
            ) : (
                <div className={`grid grid-cols-1 ${widgets.leadsBySource && widgets.leadsByStage ? 'lg:grid-cols-5' : ''} gap-6`}>
                    {widgets.leadsBySource && (
                        <div className="lg:col-span-2 bg-surface rounded-xl shadow-sm border border-muted">
                            <button onClick={() => setChartsOpen(s => ({ ...s, source: !s.source }))} className="w-full flex justify-between items-center p-6 pb-2">
                                <h2 className="text-lg font-semibold text-on-surface">Leads by Source</h2>
                                <AppIcons.ChevronRight className={`h-5 w-5 text-subtle transition-transform ${chartsOpen.source ? 'rotate-90' : ''}`} />
                            </button>
                            <div className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${chartsOpen.source ? 'max-h-[350px]' : 'max-h-0'}`}>
                                <div className="p-6 pt-4 h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={leadsBySource}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="45%"
                                                outerRadius={80}
                                                innerRadius={0}
                                                fill="#8884d8"
                                                labelLine={false}
                                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                                                    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
                                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                                    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                                                    return <text
                                                        x={x}
                                                        y={y}
                                                        fill="white"
                                                        textAnchor="middle"
                                                        dominantBaseline="central"
                                                        fontSize={12}
                                                        fontWeight="bold"
                                                    >
                                                        {`${(percent * 100).toFixed(0)}%`}
                                                    </text>
                                                }}
                                            >
                                                {leadsBySource.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={pipelineStages[index % pipelineStages.length]?.color || '#8884d8'} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => `${value} leads`}
                                                contentStyle={{
                                                    backgroundColor: 'var(--surface)',
                                                    border: '1px solid var(--muted)',
                                                    borderRadius: '0.75rem',
                                                    fontSize: '14px'
                                                }}
                                            />
                                            <Legend
                                                wrapperStyle={{
                                                    color: 'var(--on-surface)',
                                                    fontSize: '12px',
                                                    paddingTop: '10px'
                                                }}
                                                iconType="circle"
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {widgets.leadsByStage && (
                        <div className={`${widgets.leadsBySource ? 'lg:col-span-3' : 'col-span-1'} bg-surface rounded-xl shadow-sm border border-muted`}>
                             <button onClick={() => setChartsOpen(s => ({ ...s, stage: !s.stage }))} className="w-full flex justify-between items-center p-6 pb-2">
                                <h2 className="text-lg font-semibold text-on-surface">Leads by Stage</h2>
                                <AppIcons.ChevronRight className={`h-5 w-5 text-subtle transition-transform ${chartsOpen.stage ? 'rotate-90' : ''}`} />
                            </button>
                             <div className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${chartsOpen.stage ? 'max-h-[350px]' : 'max-h-0'}`}>
                                <div className="p-6 pt-4 h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={leadsByStage} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)"/>
                                            <XAxis dataKey="name" stroke="var(--subtle)" tick={{ fontSize: 12, fill: 'var(--subtle)' }} angle={-25} textAnchor="end" height={60} />
                                            <YAxis stroke="var(--subtle)" tick={{fill: 'var(--subtle)'}}/>
                                            <Tooltip cursor={{fill: 'var(--muted)'}} contentStyle={{backgroundColor: 'var(--surface)', border: '1px solid var(--muted)', borderRadius: '0.75rem'}} />
                                            <Bar dataKey="count" name="Lead Count" radius={[4, 4, 0, 0]}>
                                                {leadsByStage.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showSystemMonitor && systemInfo && (
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-on-surface">System Monitor</h2>
                        <button
                            onClick={() => setShowSystemMonitor(false)}
                            className="text-subtle hover:text-on-surface"
                        >
                            <AppIcons.Close className="h-6 w-6" />
                        </button>
                    </div>
                    <SystemMonitor systemInfo={systemInfo} />
                </div>
            )}

            <div className="pt-8">
                <h2 className="text-2xl font-bold text-on-surface">My Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
                    {customWidgets.map(widget => (
                        <CustomWidgetRenderer
                            key={widget.id}
                            widget={widget}
                            leads={filteredLeads}
                            users={users}
                            pipelineStages={pipelineStages}
                            onEdit={() => handleOpenAddWidgetModal(widget)}
                            onDelete={() => onDeleteWidget(widget.id)}
                        />
                    ))}
                    <div
                        onClick={() => handleOpenAddWidgetModal(null)}
                        className="bg-surface p-5 rounded-xl border-2 border-dashed border-muted hover:border-primary-500 hover:bg-primary-500/5 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[400px]"
                    >
                        <AppIcons.Add className="h-12 w-12 text-subtle" />
                        <p className="mt-2 font-semibold text-subtle">Add New Widget</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;


