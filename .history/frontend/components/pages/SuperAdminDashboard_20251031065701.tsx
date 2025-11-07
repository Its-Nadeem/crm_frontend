import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Organization, User, Lead, SubscriptionPlan, SupportTicket, AuditLog, GlobalAnnouncement, Addon, SystemHealthMetric, ApiUsageLog, ErrorLog, GlobalAutomationRule, GlobalIntegrationStatus, LocalizationSettings, IntegrationSource, HomepageContent, Task, BlogPost, PaymentGatewaySetting, Inquiry, LeadSource, FollowUpStatus, InquiryStatus, GlobalEmailTemplate, GlobalAutomationTrigger, GlobalAutomationAction, PaymentGatewayProvider, PricingCategory, Coupon, OfferStrip } from '../../types';
import { AppIcons } from '../ui/Icons';
import Modal from '../ui/Modal';
import { faker } from '@faker-js/faker';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line } from 'recharts';
import { StatCard } from '../ui/StatCard';
import HomepageCMSTab from './HomepageCMSTab';
import BlogEditorPage from './BlogEditorPage';
import PricingEditorTab from './superadmin/PricingEditorTab';
import CouponsAndOffersTab from './superadmin/CouponsAndOffersTab';
import { apiService } from '../../src/services/api';

const FormField: React.FC<{ label: string; children: React.ReactNode, description?: string }> = ({ label, children, description }) => (
    <div>
        <label className="block text-sm font-medium text-subtle mb-1">{label}</label>
        {children}
        {description && <p className="text-xs text-subtle mt-1">{description}</p>}
    </div>
);

const SettingCard: React.FC<{title: string, description?: string, children: React.ReactNode, actions?: React.ReactNode}> = ({ title, description, children, actions}) => {
    return (
        <div className="bg-surface p-6 rounded-xl shadow-lg border border-muted/50">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-on-surface">{title}</h3>
                    {description && <p className="text-subtle mt-1 text-sm">{description}</p>}
                </div>
                {actions}
            </div>
            <div className="space-y-4">{children}</div>
        </div>
    );
};

const ToggleSwitch: React.FC<{checked: boolean, onChange: (checked: boolean) => void}> = ({ checked, onChange }) => (
     <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(!checked); }}>
         <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
         <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
     </label>
 );

const OverviewTab: React.FC<{
    organizations: Organization[];
    users: User[];
    leads: Lead[];
    plans: SubscriptionPlan[];
    tasks: Task[];
}> = ({ organizations, users, leads, plans, tasks }) => {
    const totalOrgs = organizations.length;
    const totalUsers = users.length;
    const totalLeads = leads.length;

    const mrr = useMemo(() => {
        return organizations.reduce((total, org) => {
            const plan = plans.find(p => p.id === org.subscriptionPlanId);
            return total + (plan ? plan.price : 0);
        }, 0);
    }, [organizations, plans]);

    const orgsByPlan = useMemo(() => {
        const counts = organizations.reduce((acc, org) => {
            const plan = plans.find(p => p.id === org.subscriptionPlanId);
            const planName = plan ? plan.name : 'Unknown';
            acc[planName] = (acc[planName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [organizations, plans]);
    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold">Platform Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Organizations" value={totalOrgs.toString()} icon={<AppIcons.Team className="h-6 w-6 text-blue-400"/>} />
                <StatCard title="Total Users" value={totalUsers.toString()} icon={<AppIcons.Leads className="h-6 w-6 text-purple-400"/>} />
                <StatCard title="Total Leads" value={totalLeads.toString()} icon={<AppIcons.Reports className="h-6 w-6 text-green-400"/>} />
                <StatCard title="Estimated MRR" value={`$${mrr.toLocaleString()}`} icon={<AppIcons.Billing className="h-6 w-6 text-orange-400"/>} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-surface p-6 rounded-xl shadow-lg border border-muted/50">
                    <h3 className="font-semibold text-lg mb-4">Organizations by Plan</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={orgsByPlan} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {orgsByPlan.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                {/* Another chart can go here */}
            </div>
        </div>
    );
};

const OrganizationFormModal: React.FC<{
    org: Partial<Organization> | null;
    plans: SubscriptionPlan[];
    onClose: () => void;
    onSave: (org: any) => void;
}> = ({ org, plans, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Organization>>(org || { name: '', code: '', subscriptionPlanId: plans[0].id, manuallyAssignedFeatures: [] });
    
    const ALL_PLAN_FEATURES: SubscriptionPlan['features'][0][] = ['DASHBOARD', 'REPORTS', 'TRACKING', 'LEADS', 'TASKS', 'EMAIL', 'WHATSAPP', 'SMS', 'CALLS', 'AUTOMATION', 'INTEGRATIONS', 'USERS', 'TEAMS', 'SETTINGS', 'API_ACCESS'];

    const selectedPlanFeatures = useMemo(() => {
        const plan = plans.find(p => p.id === formData.subscriptionPlanId);
        return plan ? new Set(plan.features) : new Set();
    }, [formData.subscriptionPlanId, plans]);

    const handleFeatureToggle = (feature: SubscriptionPlan['features'][0]) => {
        setFormData(prev => {
            if (!prev) return prev;
            const currentFeatures = prev.manuallyAssignedFeatures || [];
            const newFeatures = currentFeatures.includes(feature)
                ? currentFeatures.filter(f => f !== feature)
                : [...currentFeatures, feature];
            return { ...prev, manuallyAssignedFeatures: newFeatures };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={org?.id ? 'Edit Organization' : 'Add Organization'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Organization Name"><input type="text" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} className="w-full bg-background border border-muted p-2 rounded" required /></FormField>
                <FormField label="Login Code"><input type="text" value={formData.code} onChange={e => setFormData(p => ({...p, code: e.target.value}))} className="w-full bg-background border border-muted p-2 rounded" required /></FormField>
                <FormField label="Subscription Plan">
                    <select value={formData.subscriptionPlanId} onChange={e => setFormData(p => ({...p, subscriptionPlanId: e.target.value}))} className="w-full bg-background border border-muted p-2 rounded">
                        {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </FormField>
                
                <div className="pt-4 mt-4 border-t border-muted">
                    <h3 className="text-lg font-semibold text-on-surface">Manual Feature Assignment</h3>
                    <p className="text-sm text-subtle mb-4">Override plan settings by manually enabling or disabling specific features for this organization.</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-60 overflow-y-auto p-2 bg-background rounded-md">
                        {ALL_PLAN_FEATURES.map(feature => {
                            const isIncludedInPlan = selectedPlanFeatures.has(feature);
                            const isManuallyAssigned = formData.manuallyAssignedFeatures?.includes(feature);

                            return (
                                <label key={feature} className="flex items-start p-3 bg-surface rounded-lg border border-muted hover:bg-muted/50 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={isManuallyAssigned}
                                        onChange={() => handleFeatureToggle(feature)}
                                        className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 mt-1"
                                    />
                                    <div className="ml-3">
                                        <span className="font-medium text-sm text-on-surface">{feature}</span>
                                        <p className={`text-xs ${isIncludedInPlan ? 'text-green-500' : 'text-subtle'}`}>
                                            {isIncludedInPlan ? 'Included in plan' : 'Not in plan'}
                                        </p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-muted">
                    <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Save</button>
                </div>
            </form>
        </Modal>
    );
};

const OrganizationsTab: React.FC<{
    organizations: Organization[];
    users: User[];
    leads: Lead[];
    plans: SubscriptionPlan[];
    onUpdate: (org: Organization) => void;
    onDelete: (orgId: string) => void;
    onAdd: (org: any) => void;
}> = ({ organizations, users, leads, plans, onUpdate, onDelete, onAdd }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Partial<Organization> | null>(null);

    const handleOpenModal = (org: Partial<Organization> | null = null) => {
        setEditingOrg(org);
        setIsModalOpen(true);
    };

    const handleRenew = (orgId: string) => {
        const org = organizations.find(o => o.id === orgId);
        if (org) {
            const newExpiry = new Date();
            newExpiry.setFullYear(newExpiry.getFullYear() + 1);
            onUpdate({ ...org, subscriptionExpiresAt: newExpiry.toISOString() });
        }
    };

    return (
        <div className="space-y-6">
             {isModalOpen && <OrganizationFormModal org={editingOrg} plans={plans} onClose={() => setIsModalOpen(false)} onSave={editingOrg?.id ? onUpdate : onAdd} />}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Organizations</h2>
                <button onClick={() => handleOpenModal()} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><AppIcons.Add className="w-5 h-5"/> Add Organization</button>
            </div>
             <div className="bg-surface rounded-lg shadow-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-muted">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Plan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Users</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Subscription</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                        {organizations.map(org => {
                            const plan = plans.find(p => p.id === org.subscriptionPlanId);
                            const userCount = users.filter(u => u.organizationId === org.id).length;
                            const isExpired = new Date(org.subscriptionExpiresAt) < new Date();
                            return (
                                <tr key={org.id} className={isExpired ? 'bg-red-500/5' : ''}>
                                    <td className="px-6 py-4 font-semibold">{org.name}</td>
                                    <td className="px-6 py-4">{plan?.name}</td>
                                    <td className="px-6 py-4">{userCount}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isExpired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{isExpired ? 'Expired' : 'Active'}</span>
                                        <p className="text-xs text-subtle mt-1">
                                            {isExpired ? 'Ended on' : 'Ends on'} {new Date(org.subscriptionExpiresAt).toLocaleDateString()}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 flex items-center gap-2">
                                        <button onClick={() => handleOpenModal(org)} className="p-1 text-subtle hover:text-on-surface"><AppIcons.Edit className="h-4 w-4"/></button>
                                        <button onClick={() => onDelete(org.id)} className="p-1 text-subtle hover:text-red-400"><AppIcons.Delete className="h-4 w-4"/></button>
                                         <button onClick={() => handleRenew(org.id)} disabled={!isExpired} className="text-sm bg-blue-500/20 text-blue-400 font-semibold py-1 px-2 rounded-md hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed">Renew</button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const LeadInquiriesTab: React.FC<{
    inquiries: Inquiry[];
    setInquiries: React.Dispatch<React.SetStateAction<Inquiry[]>>;
}> = ({ inquiries, setInquiries }) => {
    const [statusFilter, setStatusFilter] = useState<InquiryStatus | 'ALL'>('ALL');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'Contact Form' | 'Chatbot'>('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInquiries, setSelectedInquiries] = useState<Set<string>>(new Set());

    const handleStatusChange = (id: string, newStatus: InquiryStatus) => {
        setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: newStatus } : inq));
    };

    const filteredInquiries = useMemo(() => {
        return inquiries
            .filter(i => statusFilter === 'ALL' || i.status === statusFilter)
            .filter(i => typeFilter === 'ALL' || i.type === typeFilter)
            .filter(i => {
                if (!startDate && !endDate) return true;
                const createdAt = new Date(i.createdAt);
                if (startDate && createdAt < new Date(startDate)) return false;
                if (endDate && createdAt > new Date(new Date(endDate).setHours(23, 59, 59, 999))) return false;
                return true;
            })
            .filter(i => {
                if (!searchQuery.trim()) return true;
                const lowerCaseQuery = searchQuery.toLowerCase();
                return (
                    i.name.toLowerCase().includes(lowerCaseQuery) ||
                    i.email.toLowerCase().includes(lowerCaseQuery) ||
                    (i.phone && i.phone.includes(lowerCaseQuery)) ||
                    (i.company && i.company.toLowerCase().includes(lowerCaseQuery)) ||
                    i.message.toLowerCase().includes(lowerCaseQuery)
                );
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [inquiries, statusFilter, typeFilter, startDate, endDate, searchQuery]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedInquiries(new Set(filteredInquiries.map(i => i.id)));
        } else {
            setSelectedInquiries(new Set());
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedInquiries(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleExport = () => {
        const toExport = filteredInquiries.filter(i => selectedInquiries.has(i.id));
        if (toExport.length === 0) {
            alert('Please select inquiries to export.');
            return;
        }
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID,Type,Name,Email,Phone,Company,Message,CreatedAt,Status\n";
        toExport.forEach(i => {
            const row = [i.id, i.type, i.name, i.email, i.phone || '', i.company || '', `"${i.message.replace(/"/g, '""')}"`, i.createdAt, i.status].join(',');
            csvContent += row + "\r\n";
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "inquiries.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const statusOptions = Object.values(InquiryStatus);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Lead Inquiries</h2>
                <button onClick={handleExport} disabled={selectedInquiries.size === 0} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50">
                    <AppIcons.Export className="w-5 h-5"/> Export Selected ({selectedInquiries.size})
                </button>
            </div>
            
            <div className="bg-surface p-4 rounded-lg border border-muted space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormField label="Status">
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-full bg-background border border-muted p-2 rounded">
                            <option value="ALL">All Statuses</option>
                            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </FormField>
                    <FormField label="Type">
                         <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="w-full bg-background border border-muted p-2 rounded">
                            <option value="ALL">All Types</option>
                            <option value="Contact Form">Contact Form</option>
                            <option value="Chatbot">Chatbot</option>
                        </select>
                    </FormField>
                     <FormField label="Start Date"><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                     <FormField label="End Date"><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                </div>
                <div>
                     <FormField label="Search">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search by name, email, phone, message..."
                            className="w-full bg-background border border-muted p-2 rounded"
                        />
                    </FormField>
                </div>
            </div>

            <div className="bg-surface rounded-lg shadow-lg overflow-x-auto">
                 <table className="min-w-full divide-y divide-muted">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-6 py-3"><input type="checkbox" onChange={handleSelectAll} checked={selectedInquiries.size > 0 && selectedInquiries.size === filteredInquiries.length} /></th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Message</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                        {filteredInquiries.map(inquiry => (
                            <tr key={inquiry.id}>
                                <td className="px-6 py-4"><input type="checkbox" checked={selectedInquiries.has(inquiry.id)} onChange={() => handleSelectOne(inquiry.id)} /></td>
                                <td className="px-6 py-4 text-sm text-subtle whitespace-nowrap">{new Date(inquiry.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-sm text-subtle">{inquiry.type}</td>
                                <td className="px-6 py-4 font-semibold">{inquiry.name}</td>
                                <td className="px-6 py-4 text-sm text-subtle">{inquiry.email}</td>
                                <td className="px-6 py-4 text-sm text-subtle">{inquiry.phone || 'N/A'}</td>
                                <td className="px-6 py-4 text-sm text-subtle max-w-xs truncate" title={inquiry.message}>{inquiry.message}</td>
                                <td className="px-6 py-4">
                                    <select value={inquiry.status} onChange={e => handleStatusChange(inquiry.id, e.target.value as InquiryStatus)} className="bg-background border border-muted p-1 rounded-md text-sm">
                                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const PlansTab: React.FC<{
    plans: SubscriptionPlan[];
    onSave: (plan: SubscriptionPlan) => void;
    onDelete: (planId: string) => void;
}> = ({ plans, onSave, onDelete }) => {
    const [localPlans, setLocalPlans] = useState(plans);

    const handleFieldChange = (planId: string, field: keyof SubscriptionPlan, value: any) => {
        setLocalPlans(prev => prev.map(p => p.id === planId ? { ...p, [field]: value } : p));
    };

    const handleFeatureToggle = (planId: string, feature: SubscriptionPlan['features'][0]) => {
         setLocalPlans(prev => prev.map(p => {
            if (p.id === planId) {
                const newFeatures = p.features.includes(feature) ? p.features.filter(f => f !== feature) : [...p.features, feature];
                return { ...p, features: newFeatures };
            }
            return p;
        }));
    }

    const handleSaveAll = () => {
        localPlans.forEach(plan => onSave(plan));
        alert("Plans saved!");
    }

    const ALL_PLAN_FEATURES: SubscriptionPlan['features'][0][] = ['DASHBOARD', 'REPORTS', 'TRACKING', 'LEADS', 'TASKS', 'EMAIL', 'WHATSAPP', 'SMS', 'CALLS', 'AUTOMATION', 'INTEGRATIONS', 'USERS', 'TEAMS', 'SETTINGS', 'API_ACCESS'];

    return (
        <div className="space-y-6 bg-surface p-6 rounded-xl shadow-lg border border-muted/50">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Subscription Plans</h2>
                <button onClick={handleSaveAll} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Save All Changes</button>
            </div>
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                {localPlans.map(plan => (
                    <div key={plan.id} className="bg-background p-6 rounded-xl border border-muted/50 space-y-4">
                        <input type="text" value={plan.name} onChange={e => handleFieldChange(plan.id, 'name', e.target.value)} className="w-full bg-surface border border-muted p-2 rounded-lg text-lg font-bold" />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Monthly Price ($)"><input type="number" value={plan.price} onChange={e => handleFieldChange(plan.id, 'price', Number(e.target.value))} className="w-full bg-surface border border-muted p-2 rounded"/></FormField>
                            <FormField label="User Limit"><input type="number" value={plan.userLimit} onChange={e => handleFieldChange(plan.id, 'userLimit', Number(e.target.value))} className="w-full bg-surface border border-muted p-2 rounded"/></FormField>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-subtle mb-2">Features</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-48 overflow-y-auto pr-2">
                                {ALL_PLAN_FEATURES.map(feature => (
                                    <label key={feature} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="checkbox" checked={plan.features.includes(feature)} onChange={() => handleFeatureToggle(plan.id, feature)} className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"/>
                                        {feature}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AddonFormModal: React.FC<{ addon: Partial<Addon> | null, onClose: () => void, onSave: (addon: Addon) => void }> = ({ addon, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Addon>>(addon || { name: '', description: '', monthlyPrice: 0, featureTag: '' });
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Addon);
        onClose();
    };
    return (
        <Modal isOpen={true} onClose={onClose} title={addon?.id ? 'Edit Addon' : 'New Addon'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Name"><input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full bg-background border border-muted p-2 rounded" required /></FormField>
                <FormField label="Description"><textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full bg-background border border-muted p-2 rounded" required /></FormField>
                <FormField label="Monthly Price ($)"><input type="number" value={formData.monthlyPrice} onChange={e => setFormData(p => ({ ...p, monthlyPrice: Number(e.target.value) }))} className="w-full bg-background border border-muted p-2 rounded" required /></FormField>
                <FormField label="Feature Tag"><input type="text" value={formData.featureTag} onChange={e => setFormData(p => ({ ...p, featureTag: e.target.value.toUpperCase() }))} className="w-full bg-background border border-muted p-2 rounded" required /></FormField>
                <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button><button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Save</button></div>
            </form>
        </Modal>
    );
};

const AddonsTab: React.FC<{ addons: Addon[], onSave: (addon: Addon) => void; onDelete: (addonId: string) => void; }> = ({ addons, onSave, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
    const addonIcons: Record<string, React.ReactElement> = {
        'AI_FEATURES': <AppIcons.Sparkles className="h-8 w-8 text-purple-400" />,
        'WHATSAPP': <AppIcons.Whatsapp className="h-8 w-8 text-green-400" />,
        'ADVANCED_ANALYTICS': <AppIcons.Analytics className="h-8 w-8 text-blue-400" />,
        'WHITE_LABEL': <AppIcons.Globe className="h-8 w-8 text-orange-400" />,
    };
    return (
        <div className="space-y-6 bg-surface p-6 rounded-xl shadow-lg border border-muted/50">
            {isModalOpen && <AddonFormModal addon={editingAddon} onClose={() => setIsModalOpen(false)} onSave={onSave} />}
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Available Add-ons</h2><button onClick={() => { setEditingAddon(null); setIsModalOpen(true); }} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg text-sm">New Addon</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {addons.map(addon => (
                    <div key={addon.id} className="bg-background p-6 rounded-xl border border-muted/50 text-center flex flex-col items-center">
                        <div className="p-4 bg-muted rounded-full">{addonIcons[addon.featureTag] || <AppIcons.Bolt className="h-8 w-8"/>}</div>
                        <h3 className="font-bold text-lg mt-4">{addon.name}</h3>
                        <p className="text-subtle text-sm mt-1 flex-grow">{addon.description}</p>
                        <p className="text-3xl font-bold mt-4">${addon.monthlyPrice}<span className="text-base font-normal text-subtle">/mo</span></p>
                        <div className="flex gap-2 mt-4"><button onClick={() => { setEditingAddon(addon); setIsModalOpen(true); }} className="text-sm font-semibold text-primary-500">Edit</button><button onClick={() => onDelete(addon.id)} className="text-sm font-semibold text-red-500">Delete</button></div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const PaymentGatewayTab: React.FC<{
    settings: PaymentGatewaySetting[];
    onSave: (settings: PaymentGatewaySetting[]) => void;
}> = ({ settings, onSave }) => {
    // Default payment gateway settings if none exist
    const defaultSettings: PaymentGatewaySetting[] = [
        { provider: 'stripe', name: 'Stripe', config: { apiKey: '', apiSecret: '' }, isEnabled: false },
        { provider: 'razorpay', name: 'Razorpay', config: { apiKey: '', apiSecret: '' }, isEnabled: false },
        { provider: 'paypal', name: 'PayPal', config: { clientId: '', clientSecret: '' }, isEnabled: false },
        { provider: 'payu', name: 'PayU', config: { merchantKey: '', merchantSalt: '' }, isEnabled: false },
        { provider: 'paytm', name: 'Paytm', config: { merchantId: '', merchantKey: '' }, isEnabled: false },
        { provider: 'square', name: 'Square', config: { applicationId: '', accessToken: '' }, isEnabled: false },
        { provider: 'braintree', name: 'Braintree', config: { merchantId: '', publicKey: '', privateKey: '' }, isEnabled: false },
        { provider: 'adyen', name: 'Adyen', config: { apiKey: '', merchantAccount: '' }, isEnabled: false },
        { provider: 'authorize.net', name: 'Authorize.net', config: { apiLoginId: '', transactionKey: '' }, isEnabled: false }
    ];

    const [localSettings, setLocalSettings] = useState(settings.length > 0 ? settings : defaultSettings);
    const [editingProvider, setEditingProvider] = useState<PaymentGatewayProvider | null>(null);
    const currentProviderSettings = localSettings.find(s => s.provider === editingProvider);

    // Sync localSettings with props when settings change
    useEffect(() => {
        if (settings.length > 0) {
            setLocalSettings(settings);
        }
    }, [settings]);

    const handleSave = () => {
        onSave(localSettings);
        alert("Payment gateway settings saved!");
    };

    const handleToggleGateway = async (provider: PaymentGatewayProvider, checked: boolean) => {
        // Update local state immediately for UI responsiveness
        setLocalSettings(p => p.map(s => s.provider === provider ? {...s, isEnabled: checked} : s));

        try {
            // Save the specific gateway setting to backend
            const gatewayToUpdate = localSettings.find(s => s.provider === provider);
            if (gatewayToUpdate) {
                const updatedGateway = { ...gatewayToUpdate, isEnabled: checked };
                await apiService.updateSuperAdminPaymentGatewaySettingByProvider(provider, updatedGateway);
                // Update local state with the response from backend
                setLocalSettings(p => p.map(s => s.provider === provider ? updatedGateway : s));
            }
        } catch (error) {
            console.error('Failed to update payment gateway status:', error);
            // Revert the local state change on error
            setLocalSettings(p => p.map(s => s.provider === provider ? {...s, isEnabled: !checked} : s));
            alert('Failed to update payment gateway status. Please try again.');
        }
    };

    const handleModalSave = (providerSettings: PaymentGatewaySetting) => {
        setLocalSettings(prev => prev.map(p => p.provider === providerSettings.provider ? providerSettings : p));
        setEditingProvider(null);
    };

    const [testPaymentResult, setTestPaymentResult] = useState<{
        show: boolean;
        success: boolean;
        message: string;
        transactionId?: string;
        provider?: PaymentGatewayProvider;
    } | null>(null);

    const handleTestPayment = async (provider: PaymentGatewayProvider) => {
        try {
            const response: any = await apiService.testSuperAdminPaymentGateway(provider);

            if (response.success) {
                setTestPaymentResult({
                    show: true,
                    success: true,
                    message: 'Test payment completed successfully!',
                    transactionId: response.transactionId,
                    provider
                });
            } else {
                setTestPaymentResult({
                    show: true,
                    success: false,
                    message: response.error || 'Test payment failed. Please check your configuration.',
                    provider
                });
            }
        } catch (error) {
            console.error('Test payment error:', error);
            setTestPaymentResult({
                show: true,
                success: false,
                message: 'Test payment failed. Please check your configuration.',
                provider
            });
        }
    };

    const closeTestResult = () => {
        setTestPaymentResult(null);
    };

    // Get configuration fields for each provider
    const getProviderConfigFields = (provider: PaymentGatewayProvider) => {
        const fieldLabels: Record<PaymentGatewayProvider, Record<string, string>> = {
            stripe: { apiKey: 'Publishable Key', apiSecret: 'Secret Key' },
            razorpay: { apiKey: 'Key ID', apiSecret: 'Key Secret' },
            paypal: { clientId: 'Client ID', clientSecret: 'Client Secret' },
            payu: { merchantKey: 'Merchant Key', merchantSalt: 'Merchant Salt' },
            paytm: { merchantId: 'Merchant ID', merchantKey: 'Merchant Key' },
            square: { applicationId: 'Application ID', accessToken: 'Access Token' },
            braintree: { merchantId: 'Merchant ID', publicKey: 'Public Key', privateKey: 'Private Key' },
            adyen: { apiKey: 'API Key', merchantAccount: 'Merchant Account' },
            'authorize.net': { apiLoginId: 'API Login ID', transactionKey: 'Transaction Key' }
        };
        return fieldLabels[provider] || {};
    };

    const logos: Record<PaymentGatewayProvider, string> = {
        stripe: 'https://cdn.worldvectorlogo.com/logos/stripe-4.svg',
        razorpay: 'https://cdn.worldvectorlogo.com/logos/razorpay.svg',
        paypal: 'https://cdn.worldvectorlogo.com/logos/paypal-3.svg',
        payu: 'https://cdn.worldvectorlogo.com/logos/payu.svg',
        paytm: 'https://cdn.worldvectorlogo.com/logos/paytm.svg',
        square: 'https://cdn.worldvectorlogo.com/logos/square-3.svg',
        braintree: 'https://cdn.worldvectorlogo.com/logos/braintree.svg',
        adyen: 'https://cdn.worldvectorlogo.com/logos/adyen.svg',
        'authorize.net': 'https://cdn.worldvectorlogo.com/logos/authorize-net.svg'
    }

    return (
        <div className="space-y-8">
            {editingProvider && currentProviderSettings && (
                  <Modal isOpen={true} onClose={() => setEditingProvider(null)} title={`Configure ${currentProviderSettings.name}`}>
                     <div className="space-y-4">
                         {Object.entries(getProviderConfigFields(editingProvider)).map(([fieldKey, fieldLabel]) => (
                             <FormField key={fieldKey} label={fieldLabel}>
                                 <input
                                     type="password"
                                     value={currentProviderSettings.config[fieldKey] || ''}
                                     onChange={e => setLocalSettings(p => p.map(s => s.provider === editingProvider ? {...s, config: {...s.config, [fieldKey]: e.target.value}} : s))}
                                     className="w-full bg-background border border-muted p-2 rounded font-mono"
                                     placeholder={`Enter ${fieldLabel}`}
                                 />
                             </FormField>
                         ))}
                     </div>
                      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-muted">
                         <button type="button" onClick={() => setEditingProvider(null)} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                         <button type="button" onClick={() => handleModalSave(currentProviderSettings)} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Save</button>
                     </div>
                 </Modal>
             )}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Payment Gateways</h2>
                <button onClick={handleSave} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Save Changes</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {localSettings.map(setting => (
                    <div key={setting.provider} className={`bg-surface p-6 rounded-xl shadow-lg border ${setting.isEnabled ? 'border-primary-500/50' : 'border-muted/50'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <img src={logos[setting.provider]} alt={setting.name} className="h-8"/>
                            <ToggleSwitch checked={setting.isEnabled} onChange={checked => handleToggleGateway(setting.provider, checked)} />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{setting.name}</h3>
                        <p className="text-sm text-subtle mb-4">Secure payment processing with advanced fraud protection and PCI compliance.</p>
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-subtle">Status:</span>
                                <span className={`font-medium ${setting.isEnabled ? 'text-green-500' : 'text-red-500'}`}>
                                    {setting.isEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-subtle">Provider:</span>
                                <span className="font-medium capitalize">{setting.provider}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setEditingProvider(setting.provider)} className="flex-1 bg-muted hover:bg-subtle/20 text-on-surface font-semibold py-2 px-4 rounded-lg text-sm">Configure</button>
                            <button
                                onClick={() => handleTestPayment(setting.provider)}
                                disabled={!setting.isEnabled}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg text-sm disabled:cursor-not-allowed"
                            >
                                Test Payment
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SiteManagementTab: React.FC<{
    organizations: Organization[];
}> = ({ organizations }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Site Management</h2>
            <div className="bg-surface rounded-xl shadow-lg border border-muted/50 p-8 text-center">
                <AppIcons.GlobeAlt className="h-16 w-16 text-muted mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-on-surface mb-2">Custom Domains</h3>
                <p className="text-subtle">Custom domain functionality has been disabled.</p>
            </div>
        </div>
    );
};

const SupportTab: React.FC<{
    tickets: SupportTicket[];
    organizations: Organization[];
    users: User[];
    onUpdateStatus: (ticketId: string, status: SupportTicket['status']) => void;
}> = ({ tickets, organizations, users, onUpdateStatus }) => {
    const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('OPEN');
    const [viewingTicket, setViewingTicket] = useState<SupportTicket | null>(null);

    const filteredTickets = useMemo(() => {
        if (filter === 'ALL') return tickets;
        return tickets.filter(t => t.status === filter);
    }, [tickets, filter]);

    const statusClasses = {
        OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    }
    
    return (
        <div className="space-y-6">
            {viewingTicket && (
                <Modal isOpen={true} onClose={() => setViewingTicket(null)} title={`Ticket #${viewingTicket.id.slice(0, 8)}`}>
                    <h3 className="text-lg font-bold">{viewingTicket.subject}</h3>
                    <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {(viewingTicket.replies || []).map((reply, index) => {
                            const author = users.find(u => u.id === reply.authorId);
                            const isSuperAdmin = author?.role === 'Super Admin';
                            return (
                                <div key={index} className={`flex items-start gap-3 ${isSuperAdmin ? 'flex-row-reverse' : ''}`}>
                                    <img src={author?.avatar} className="w-8 h-8 rounded-full"/>
                                    <div className={`p-3 rounded-lg max-w-lg ${isSuperAdmin ? 'bg-primary-500 text-white' : 'bg-muted'}`}>
                                        <p className="text-sm">{reply.message}</p>
                                        <p className={`text-xs mt-1 ${isSuperAdmin ? 'text-primary-200' : 'text-subtle'}`}>{new Date(reply.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </Modal>
            )}
            <h2 className="text-2xl font-bold">Support Tickets</h2>
             <div className="flex gap-2 p-1 bg-surface rounded-lg border border-muted w-min">
                {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ALL'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-sm font-semibold rounded-md ${filter === f ? 'bg-primary-600 text-white' : 'text-subtle'}`}>{f}</button>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTickets.map(ticket => {
                    const org = organizations.find(o => o.id === ticket.organizationId);
                    const user = users.find(u => u.id === ticket.userId);
                    return (
                        <div key={ticket.id} onClick={() => setViewingTicket(ticket)} className="bg-surface rounded-xl shadow-lg border border-muted/50 p-5 space-y-3 cursor-pointer hover:border-primary-500/50 transition-colors">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-on-surface flex-grow pr-4">{ticket.subject}</h3>
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusClasses[ticket.status]}`}>{ticket.status}</span>
                            </div>
                            <p className="text-sm text-subtle">From: {user?.name || 'N/A'} at {org?.name || 'N/A'}</p>
                            <p className="text-xs text-subtle pt-2 border-t border-muted">Last update: {new Date(ticket.lastReplyAt).toLocaleString()}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

const SecurityTab: React.FC<{ logs: AuditLog[]; users: User[] }> = ({ logs, users }) => {
    const [actionFilter, setActionFilter] = useState('all');
    const [adminFilter, setAdminFilter] = useState('all');
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>(logs);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchAuditLogs = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '50',
                ...(actionFilter !== 'all' && { action: actionFilter }),
                ...(adminFilter !== 'all' && { actorId: adminFilter }),
                ...(startDate && { startDate }),
                ...(endDate && { endDate })
            });

            const response = await fetch(`${window.location.origin}/api/super-admin/audit-logs?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAuditLogs(data.logs);
                setTotalPages(data.pagination.pages);
                setCurrentPage(data.pagination.page);
            } else {
                console.error('Failed to fetch audit logs:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditLogs(1);
    }, [actionFilter, adminFilter, startDate, endDate]);

    const actionTypes = useMemo(() => Array.from(new Set(logs.map(l => l.action))), [logs]);
    const admins = useMemo(() => users, [users]); // Show all users since any user can have audit logs

    // Predefined action type categories for better UX
    const actionTypeCategories = [
        { value: 'all', label: 'All Actions' },
        { value: 'ORGANIZATION_CREATED', label: 'Organization Created' },
        { value: 'ORGANIZATION_UPDATED', label: 'Organization Updated' },
        { value: 'ORGANIZATION_DELETED', label: 'Organization Deleted' },
        { value: 'PLAN_CREATED', label: 'Plan Created' },
        { value: 'PLAN_UPDATED', label: 'Plan Updated' },
        { value: 'PLAN_DELETED', label: 'Plan Deleted' },
        { value: 'ADDON_CREATED', label: 'Addon Created' },
        { value: 'ADDON_UPDATED', label: 'Addon Updated' },
        { value: 'ADDON_DELETED', label: 'Addon Deleted' },
        { value: 'PAYMENT_GATEWAY_CREATED', label: 'Payment Gateway Created' },
        { value: 'PAYMENT_GATEWAY_UPDATED', label: 'Payment Gateway Updated' },
        { value: 'PAYMENT_GATEWAY_DELETED', label: 'Payment Gateway Deleted' },
        { value: 'BLOG_POST_CREATED', label: 'Blog Post Created' },
        { value: 'BLOG_POST_UPDATED', label: 'Blog Post Updated' },
        { value: 'BLOG_POST_DELETED', label: 'Blog Post Deleted' },
        { value: 'COUPON_CREATED', label: 'Coupon Created' },
        { value: 'COUPON_UPDATED', label: 'Coupon Updated' },
        { value: 'COUPON_DELETED', label: 'Coupon Deleted' },
        { value: 'TICKET_STATUS_UPDATED', label: 'Ticket Status Updated' },
        { value: 'INQUIRY_STATUS_UPDATED', label: 'Inquiry Status Updated' },
        { value: 'USER_LOGIN', label: 'User Login' }
    ];
    const actionIcons: Record<string, React.ReactElement> = {
        'ORGANIZATION_CREATED': <AppIcons.Add className="h-4 w-4 text-green-500"/>,
        'ORGANIZATION_UPDATED': <AppIcons.Edit className="h-4 w-4 text-blue-500"/>,
        'ORGANIZATION_DELETED': <AppIcons.Delete className="h-4 w-4 text-red-500"/>,
        'PLAN_CREATED': <AppIcons.Add className="h-4 w-4 text-green-500"/>,
        'PLAN_UPDATED': <AppIcons.Edit className="h-4 w-4 text-blue-500"/>,
        'PLAN_DELETED': <AppIcons.Delete className="h-4 w-4 text-red-500"/>,
        'USER_LOGIN': <AppIcons.Key className="h-4 w-4 text-yellow-500"/>,
        'PAYMENT_GATEWAY_UPDATED': <AppIcons.Key className="h-4 w-4 text-purple-500"/>,
        'TICKET_STATUS_UPDATED': <AppIcons.Support className="h-4 w-4 text-orange-500"/>,
        'BLOG_POST_CREATED': <AppIcons.Blog className="h-4 w-4 text-green-500"/>,
        'BLOG_POST_UPDATED': <AppIcons.Edit className="h-4 w-4 text-blue-500"/>,
        'BLOG_POST_DELETED': <AppIcons.Delete className="h-4 w-4 text-red-500"/>,
        'ADDON_CREATED': <AppIcons.Add className="h-4 w-4 text-green-500"/>,
        'ADDON_UPDATED': <AppIcons.Edit className="h-4 w-4 text-blue-500"/>,
        'ADDON_DELETED': <AppIcons.Delete className="h-4 w-4 text-red-500"/>,
        'COUPON_CREATED': <AppIcons.Add className="h-4 w-4 text-green-500"/>,
        'COUPON_UPDATED': <AppIcons.Edit className="h-4 w-4 text-blue-500"/>,
        'COUPON_DELETED': <AppIcons.Delete className="h-4 w-4 text-red-500"/>,
        'INQUIRY_STATUS_UPDATED': <AppIcons.Leads className="h-4 w-4 text-orange-500"/>
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Security & Audit Logs</h2>
                <button
                    onClick={() => fetchAuditLogs(1)}
                    disabled={loading}
                    className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
                >
                    <AppIcons.Activity className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-surface rounded-lg border border-muted">
                <FormField label="Filter by Action Type">
                    <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="w-full bg-background border border-muted p-2 rounded">
                        <option value="all">All Actions</option>
                        {actionTypes.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
                    </select>
                </FormField>
                <FormField label="Filter by User">
                    <select value={adminFilter} onChange={e => setAdminFilter(e.target.value)} className="w-full bg-background border border-muted p-2 rounded">
                        <option value="all">All Users</option>
                        {admins.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </FormField>
                <FormField label="Start Date">
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full bg-background border border-muted p-2 rounded"
                    />
                </FormField>
                <FormField label="End Date">
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full bg-background border border-muted p-2 rounded"
                    />
                </FormField>
            </div>

            <div className="bg-surface rounded-lg shadow-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-muted">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Details</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Administrator</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">IP Address</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center">
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                        <span className="ml-2">Loading audit logs...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : auditLogs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-subtle">
                                    No audit logs found matching the current filters.
                                </td>
                            </tr>
                        ) : (
                            auditLogs.map(log => {
                                const actor = typeof log.actorId === 'object' ? log.actorId : users.find(u => u.id === log.actorId);
                                return (
                                    <tr key={log.id} className="hover:bg-muted/20">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {actionIcons[log.action] || <div className="w-4 h-4"/>}
                                                <p className="font-mono text-xs font-semibold bg-muted/50 w-fit px-2 py-1 rounded-md">
                                                    {log.action.replace(/_/g, ' ')}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm max-w-xs truncate" title={log.details}>
                                            {log.details}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-subtle">
                                            {typeof actor === 'object' ? actor.name : 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-subtle font-mono">
                                            {log.ipAddress || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-subtle whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                        onClick={() => fetchAuditLogs(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                        className="px-3 py-1 bg-muted hover:bg-subtle/20 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-subtle">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => fetchAuditLogs(currentPage + 1)}
                        disabled={currentPage === totalPages || loading}
                        className="px-3 py-1 bg-muted hover:bg-subtle/20 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

const MonitoringTab: React.FC<{
    healthData: SystemHealthMetric[]; apiLogs: ApiUsageLog[]; errorLogs: ErrorLog[];
}> = ({ healthData, apiLogs, errorLogs }) => {
    const [logTab, setLogTab] = useState<'api' | 'error'>('api');
    const [monitoringData, setMonitoringData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(10); // in seconds
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMonitoringData = async (isInitial = false) => {
        if (isInitial) {
            setLoading(true);
            setError(null);
        }
        try {
            const data = await apiService.getSuperAdminMonitoring();
            setMonitoringData(data);
            setError(null);
            setAutoRefresh(true); // Re-enable auto-refresh on success
        } catch (error) {
            // Silent error handling - don't log to console
            setError('Failed to fetch monitoring data. Using sample data.');
            setAutoRefresh(false); // Stop auto-refresh on error
        } finally {
            if (isInitial) {
                setLoading(false);
            }
            // For subsequent refreshes, don't change loading state to avoid page flicker
        }
    };

    useEffect(() => {
        fetchMonitoringData(true); // initial fetch
        let intervalId: NodeJS.Timeout | null = null;
        if (autoRefresh) {
            intervalId = setInterval(() => fetchMonitoringData(false), refreshInterval * 1000);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [refreshInterval, autoRefresh]);

    if (loading) {
        return (
            <div className="space-y-8">
                <h2 className="text-2xl font-bold">System Monitoring</h2>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
                </div>
            </div>
        );
    }

    const serviceStatus = (monitoringData?.serviceStatus as Record<string, string>) || { API: 'Operational', Database: 'Operational', 'Facebook Sync': 'Degraded' };
    const realHealthData = monitoringData?.healthData || [
        { cpuLoad: 45, memoryUsage: 60, responseTime: 120 },
        { cpuLoad: 50, memoryUsage: 65, responseTime: 110 },
        { cpuLoad: 48, memoryUsage: 62, responseTime: 115 },
        { cpuLoad: 52, memoryUsage: 68, responseTime: 125 },
        { cpuLoad: 47, memoryUsage: 63, responseTime: 118 },
    ];
    const realApiLogs = monitoringData?.apiLogs || apiLogs;
    const realErrorLogs = monitoringData?.errorLogs || errorLogs;
    
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">System Monitoring</h2>
                <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                        <ToggleSwitch checked={autoRefresh} onChange={(checked) => setAutoRefresh(checked)} />
                        <span className="text-sm font-medium">Auto Refresh</span>
                    </div>
                    <label className="text-sm font-medium">Refresh every:</label>
                    <select
                        value={refreshInterval}
                        onChange={(e) => setRefreshInterval(Number(e.target.value))}
                        className="bg-background border border-muted p-2 rounded text-sm"
                        disabled={!autoRefresh}
                    >
                        <option value={10}>10 seconds</option>
                        <option value={15}>15 seconds</option>
                        <option value={30}>30 seconds</option>
                        <option value={60}>1 minute</option>
                    </select>
                    <button
                        onClick={() => fetchMonitoringData(true)}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
                    >
                        Refresh Now
                    </button>
                </div>
            </div>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-surface p-4 rounded-xl shadow-lg border border-muted/50">
                        <h3 className="text-sm font-semibold text-subtle text-center">CPU Load</h3>
                        <ResponsiveContainer width="100%" height={100}>
                            <AreaChart data={realHealthData} margin={{top:10, right:0, left:0, bottom:0}}>
                                <Tooltip formatter={(value: number) => [`${value}%`, 'CPU Load']} />
                                <Area type="monotone" dataKey="cpuLoad" stroke="#8884d8" fill="#8884d8" />
                            </AreaChart>
                        </ResponsiveContainer>
                        <p className="text-center text-lg font-bold text-on-surface mt-2">CPU Load ({realHealthData[realHealthData.length - 1]?.cpuLoad || 0}%)</p>
                    </div>
                    <div className="bg-surface p-4 rounded-xl shadow-lg border border-muted/50">
                        <h3 className="text-sm font-semibold text-subtle text-center">Memory Usage</h3>
                        <ResponsiveContainer width="100%" height={100}>
                            <AreaChart data={realHealthData} margin={{top:10, right:0, left:0, bottom:0}}>
                                <Tooltip formatter={(value: number) => [`${value}%`, 'Memory Usage']} />
                                <Area type="monotone" dataKey="memoryUsage" stroke="#82ca9d" fill="#82ca9d" />
                            </AreaChart>
                        </ResponsiveContainer>
                        <p className="text-center text-lg font-bold text-on-surface mt-2">Memory ({realHealthData[realHealthData.length - 1]?.memoryUsage || 0}%)</p>
                    </div>
                    <div className="bg-surface p-4 rounded-xl shadow-lg border border-muted/50">
                        <h3 className="text-sm font-semibold text-subtle text-center">Response Time</h3>
                        <ResponsiveContainer width="100%" height={100}>
                            <AreaChart data={realHealthData} margin={{top:10, right:0, left:0, bottom:0}}>
                                <Tooltip formatter={(value: number) => [`${value}ms`, 'Response Time']} />
                                <Area type="monotone" dataKey="responseTime" stroke="#ffc658" fill="#ffc658" />
                            </AreaChart>
                        </ResponsiveContainer>
                        <p className="text-center text-lg font-bold text-on-surface mt-2">Response ({realHealthData[realHealthData.length - 1]?.responseTime || 0}ms)</p>
                    </div>
                </div>
                 <div className="bg-surface p-6 rounded-xl shadow-lg border border-muted/50">
                    <h3 className="font-semibold mb-3">Service Status</h3>
                    <div className="space-y-2">
                        {Object.entries(serviceStatus).map(([name, status]) => (
                            <div key={name} className="flex justify-between items-center text-sm">
                                <span>{name}</span>
                                <span className={`font-semibold ${status === 'Operational' ? 'text-green-500' : 'text-orange-500'}`}>{status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="bg-surface p-6 rounded-xl shadow-lg border border-muted/50">
                <div className="border-b border-muted flex"><button onClick={() => setLogTab('api')} className={`px-4 py-2 text-sm font-semibold ${logTab === 'api' ? 'border-b-2 border-primary-500' : 'text-subtle'}`}>API Logs</button><button onClick={() => setLogTab('error')} className={`px-4 py-2 text-sm font-semibold ${logTab === 'error' ? 'border-b-2 border-primary-500' : 'text-subtle'}`}>Error Logs</button></div>
                <div className="max-h-80 overflow-y-auto mt-4 font-mono text-xs">
                    {(logTab === 'api' ? realApiLogs : realErrorLogs).slice(0, 50).map(log => (
                        <p key={log.id} className="border-b border-muted/50 py-1">{`[${new Date(log.timestamp).toLocaleTimeString()}] `} {'statusCode' in log ? `(${log.statusCode}) ${log.endpoint}` : `[${log.severity.toUpperCase()}] ${log.message}`}</p>
                    ))}
                </div>
            </div>
        </div>
    );
};

const GlobalAutomationFormModal: React.FC<{
    rule: Partial<GlobalAutomationRule> | null;
    emailTemplates: GlobalEmailTemplate[];
    superAdmins: User[];
    onClose: () => void;
    onSave: (rule: GlobalAutomationRule) => void;
}> = ({ rule, emailTemplates, superAdmins, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<GlobalAutomationRule>>(rule || { 
        name: '', description: '', isEnabled: true,
        trigger: { type: 'TRIAL_STARTED' },
        action: { type: 'SEND_EMAIL_TO_ADMIN', templateId: emailTemplates[0]?.id }
    });

    const handleTriggerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const type = e.target.value as GlobalAutomationTrigger['type'];
        if (type === 'TRIAL_EXPIRING') setFormData(p => ({ ...p, trigger: { type, daysBefore: 3 }}));
        else setFormData(p => ({ ...p, trigger: { type }}));
    };

    const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const type = e.target.value as GlobalAutomationAction['type'];
        if (type === 'SEND_EMAIL_TO_ADMIN') setFormData(p => ({ ...p, action: { type, templateId: emailTemplates[0]?.id }}));
        if (type === 'SEND_EMAIL_TO_SUPER_ADMIN') setFormData(p => ({ ...p, action: { type, recipientId: superAdmins[0]?.id }}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as GlobalAutomationRule);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={rule?.id ? 'Edit Global Rule' : 'New Global Rule'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Rule Name"><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                <FormField label="Description"><input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                <FormField label="Trigger">
                    <select value={formData.trigger?.type} onChange={handleTriggerChange} className="w-full bg-background border border-muted p-2 rounded">
                        <option value="ORGANIZATION_CREATED">Organization is Created</option>
                        <option value="TRIAL_STARTED">Trial is Started</option>
                        <option value="TRIAL_EXPIRING">Trial is Expiring</option>
                        <option value="SUBSCRIPTION_PAYMENT_FAILED">Subscription Payment Fails</option>
                        <option value="SUBSCRIPTION_CANCELED">Subscription is Canceled</option>
                    </select>
                </FormField>
                <FormField label="Action">
                    <select value={formData.action?.type} onChange={handleActionChange} className="w-full bg-background border border-muted p-2 rounded">
                        <option value="SEND_EMAIL_TO_ADMIN">Send Email to Org Admin</option>
                        <option value="SEND_EMAIL_TO_SUPER_ADMIN">Send Email to Super Admin</option>
                    </select>
                </FormField>
                <div className="flex justify-end gap-3 pt-4 border-t border-muted">
                    <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Save</button>
                </div>
            </form>
        </Modal>
    )
}

const GlobalAutomationTab: React.FC<{
    rules: GlobalAutomationRule[];
    emailTemplates: GlobalEmailTemplate[];
    superAdmins: User[];
    onSave: (rule: GlobalAutomationRule) => void;
    onDelete: (ruleId: string) => void;
}> = ({ rules, emailTemplates, superAdmins, onSave, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<GlobalAutomationRule | null>(null);

    return (
        <div className="space-y-6">
            {isModalOpen && <GlobalAutomationFormModal rule={editingRule} emailTemplates={emailTemplates} superAdmins={superAdmins} onClose={() => setIsModalOpen(false)} onSave={onSave} />}
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Global Automation</h2>
                <button onClick={() => { setEditingRule(null); setIsModalOpen(true); }} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><AppIcons.Add className="w-5 h-5"/> New Rule</button>
            </div>
            <div className="space-y-4">
                {rules.map(rule => (
                    <div key={rule.id} className="bg-surface p-4 rounded-lg border border-muted flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold">{rule.name}</h4>
                            <p className="text-sm text-subtle">{rule.description}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <ToggleSwitch checked={rule.isEnabled} onChange={checked => onSave({...rule, isEnabled: checked})} />
                            <button onClick={() => { setEditingRule(rule); setIsModalOpen(true); }}><AppIcons.Edit className="h-4 w-4"/></button>
                            <button onClick={() => onDelete(rule.id)}><AppIcons.Delete className="h-4 w-4"/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AnalyticsTab: React.FC<{
    organizations: Organization[];
    plans: SubscriptionPlan[];
    fetchAnalyticsData: () => Promise<any>;
}> = ({ organizations, plans, fetchAnalyticsData }) => {
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAnalytics = async () => {
            try {
                setLoading(true);
                const data = await fetchAnalyticsData();
                setAnalyticsData(data);
            } catch (error) {
                console.error('Failed to load analytics data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadAnalytics();
    }, [fetchAnalyticsData]);

    if (loading) {
        return (
            <div className="space-y-8">
                <h2 className="text-2xl font-bold">Platform Analytics</h2>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
                </div>
            </div>
        );
    }

    const mrrData = analyticsData?.mrrData || [
        { name: 'Jan', mrr: 0 },
        { name: 'Feb', mrr: 0 },
        { name: 'Mar', mrr: 0 },
        { name: 'Apr', mrr: 0 },
        { name: 'May', mrr: 0 },
        { name: 'Jun', mrr: 0 },
    ];
    
    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold">Platform Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-surface p-6 rounded-xl shadow-lg border border-muted/50">
                    <h3 className="font-semibold text-lg mb-4">MRR Growth</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={mrrData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(val) => `${(val/1000)}k`} />
                            <Tooltip formatter={(val: number) => `${val.toLocaleString()}`}/>
                            <Legend />
                            <Line type="monotone" dataKey="mrr" stroke="#8884d8" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                 <div className="bg-surface p-6 rounded-xl shadow-lg border border-muted/50">
                    <h3 className="font-semibold text-lg mb-4">Platform Statistics</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-subtle">Total Organizations</span>
                            <span className="font-semibold">{analyticsData?.totalOrganizations || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-subtle">Active Organizations</span>
                            <span className="font-semibold text-green-500">{analyticsData?.activeOrganizations || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-subtle">Current MRR</span>
                            <span className="font-semibold">${mrrData[mrrData.length - 1]?.mrr?.toLocaleString() || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


interface SuperAdminDashboardProps {
    organizations: Organization[];
    users: User[];
    leads: Lead[];
    tasks: Task[];
    subscriptionPlans: SubscriptionPlan[];
    supportTickets: SupportTicket[];
    auditLogs: AuditLog[];
    globalAnnouncement: GlobalAnnouncement;
    addons: Addon[];
    systemHealthData: SystemHealthMetric[];
    apiUsageLogs: ApiUsageLog[];
    errorLogs: ErrorLog[];
    globalAutomationRules: GlobalAutomationRule[];
    globalEmailTemplates: GlobalEmailTemplate[];
    homepageContent: HomepageContent;
    blogPosts: BlogPost[];
    paymentGatewaySettings: PaymentGatewaySetting[];
    inquiries: Inquiry[];
    pricingComparisonData: PricingCategory[];
    setInquiries: React.Dispatch<React.SetStateAction<Inquiry[]>>;
    setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
    onLogout: () => void;
    onAddOrganization: (org: Omit<Organization, 'id' | 'apiKey' | 'isEnabled' | 'subscriptionPlanId' | 'subscriptionExpiresAt'>) => void;
    onUpdateOrganization: (org: Organization) => void;
    onDeleteOrganization: (orgId: string) => void;
    onSaveSubscriptionPlan: (plan: SubscriptionPlan) => void;
    onDeleteSubscriptionPlan: (planId: string) => void;
    onUpdateTicketStatus: (ticketId: string, status: SupportTicket['status']) => void;
    onSaveAnnouncement: (announcement: GlobalAnnouncement) => void;
    onSaveUser: (user: User) => void;
    globalIntegrationStatus: GlobalIntegrationStatus[];
    onUpdateGlobalIntegrationStatus: (status: GlobalIntegrationStatus[]) => void;
    localizationSettings: LocalizationSettings;
    onUpdateLocalizationSettings: (settings: LocalizationSettings) => void;
    onUpdateHomepageContent: (content: HomepageContent) => void;
    onSaveBlogPost: (post: BlogPost) => void;
    onDeleteBlogPost: (id: string) => void;
    onUpdatePaymentGatewaySettings: (settings: PaymentGatewaySetting[]) => void;
    onSaveGlobalRule: (rule: GlobalAutomationRule) => void;
    onDeleteGlobalRule: (ruleId: string) => void;
    onUpdatePricingComparisonData: (data: PricingCategory[]) => void;
    onSaveAddon: (addon: Addon) => void;
    onDeleteAddon: (addonId: string) => void;
    coupons: Coupon[];
    onSaveCoupon: (coupon: Coupon) => void;
    onDeleteCoupon: (couponId: string) => void;
    offerStrip: OfferStrip;
    onUpdateOfferStrip: (strip: OfferStrip) => void;
    fetchAnalyticsData: () => Promise<any>;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = (props) => {
    const { 
        organizations, users, leads, tasks, subscriptionPlans, supportTickets, auditLogs, globalAnnouncement, 
        addons, systemHealthData, apiUsageLogs, errorLogs, globalAutomationRules, globalEmailTemplates,
        onSaveGlobalRule, onDeleteGlobalRule, homepageContent,
        blogPosts, onSaveBlogPost, onDeleteBlogPost, inquiries, setInquiries, setLeads,
        onLogout, onAddOrganization, onUpdateOrganization, onDeleteOrganization,
        onSaveSubscriptionPlan, onDeleteSubscriptionPlan, onUpdateTicketStatus, onSaveAnnouncement,
        onSaveUser, globalIntegrationStatus, onUpdateGlobalIntegrationStatus, localizationSettings, onUpdateLocalizationSettings,
        onUpdateHomepageContent, paymentGatewaySettings, onUpdatePaymentGatewaySettings,
        pricingComparisonData, onUpdatePricingComparisonData
    } = props;
    
    const [activeTab, setActiveTab] = useState('overview');
    const [activePricingSubTab, setActivePricingSubTab] = useState('subscriptions');
    const [editingPost, setEditingPost] = useState<Partial<BlogPost> | 'new' | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [testPaymentResult, setTestPaymentResult] = useState<{
        show: boolean;
        success: boolean;
        message: string;
        transactionId?: string;
        provider?: PaymentGatewayProvider;
    } | null>(null);


    const handleSavePost = (post: BlogPost) => {
        props.onSaveBlogPost(post);
        setEditingPost(null); 
    };

    if (editingPost) {
        const postData = editingPost === 'new' ? null : editingPost as BlogPost;
        return <BlogEditorPage 
                    post={postData} 
                    users={users} 
                    onSave={handleSavePost} 
                    onClose={() => setEditingPost(null)}
                />;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab organizations={organizations} users={users} leads={leads} plans={subscriptionPlans} tasks={tasks} />;
            case 'organizations': return <OrganizationsTab organizations={organizations} users={users} leads={leads} plans={subscriptionPlans} onUpdate={onUpdateOrganization} onDelete={onDeleteOrganization} onAdd={onAddOrganization} />;
            case 'lead_inquiries': return <LeadInquiriesTab inquiries={inquiries} setInquiries={setInquiries} />;
            case 'plans': 
                 return (
                    <div className="space-y-8">
                        <div className="flex border-b border-muted">
                            <button onClick={() => setActivePricingSubTab('subscriptions')} className={`px-4 py-2 text-sm font-semibold ${activePricingSubTab === 'subscriptions' ? 'border-b-2 border-primary-500 text-on-surface' : 'text-subtle hover:border-muted'}`}>Subscription Plans</button>
                            <button onClick={() => setActivePricingSubTab('features')} className={`px-4 py-2 text-sm font-semibold ${activePricingSubTab === 'features' ? 'border-b-2 border-primary-500 text-on-surface' : 'text-subtle hover:border-muted'}`}>Feature Comparison</button>
                            <button onClick={() => setActivePricingSubTab('coupons')} className={`px-4 py-2 text-sm font-semibold ${activePricingSubTab === 'coupons' ? 'border-b-2 border-primary-500 text-on-surface' : 'text-subtle hover:border-muted'}`}>Coupons & Offers</button>
                        </div>

                        {activePricingSubTab === 'subscriptions' && (
                            <div className="space-y-8">
                                <PlansTab plans={subscriptionPlans} onSave={onSaveSubscriptionPlan} onDelete={onDeleteSubscriptionPlan} />
                                <AddonsTab addons={addons} onSave={props.onSaveAddon} onDelete={props.onDeleteAddon} />
                            </div>
                        )}
                        {activePricingSubTab === 'features' && <PricingEditorTab data={pricingComparisonData} onSave={onUpdatePricingComparisonData} />}
                        {activePricingSubTab === 'coupons' && <CouponsAndOffersTab coupons={props.coupons} onSaveCoupon={props.onSaveCoupon} onDeleteCoupon={props.onDeleteCoupon} offerStrip={props.offerStrip} onUpdateOfferStrip={props.onUpdateOfferStrip} />}
                    </div>
                );
            case 'payment_gateway': return <PaymentGatewayTab settings={paymentGatewaySettings} onSave={onUpdatePaymentGatewaySettings} />;
            case 'blog': return (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Blog Management</h2>
                        <button onClick={() => setEditingPost('new')} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><AppIcons.Add className="w-5 h-5"/> New Post</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {blogPosts.map(post => {
                             const author = users.find(u => u.id === post.authorId);
                             return (
                                 <div key={post.id} className="bg-surface rounded-xl shadow-lg border border-muted/50 overflow-hidden flex flex-col">
                                     <img src={post.featuredImage.src} alt={post.featuredImage.alt} className="h-48 w-full object-cover"/>
                                     <div className="p-4 flex flex-col flex-grow">
                                        <h3 className="font-bold text-lg">{post.title}</h3>
                                        <div className="flex items-center gap-2 text-xs text-subtle mt-2">
                                            <img src={author?.avatar} className="h-6 w-6 rounded-full"/>
                                            <span>{author?.name}</span>
                                            <span>&bull;</span>
                                            <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-subtle mt-4 pt-2 border-t border-muted flex-grow items-end">
                                            <span><AppIcons.Eye className="h-4 w-4 inline mr-1"/> {post.views}</span>
                                            <span><AppIcons.ChatBubble className="h-4 w-4 inline mr-1"/> {post.comments}</span>
                                        </div>
                                         <div className="flex items-center gap-2 pt-4 mt-auto">
                                             <button onClick={() => setEditingPost(post)} className="flex-1 text-center bg-muted hover:bg-subtle/20 text-on-surface text-sm font-semibold py-2 px-3 rounded-lg">Edit</button>
                                            <button onClick={() => onDeleteBlogPost(post.id)} className="p-2 text-subtle hover:text-red-500 hover:bg-red-500/10 rounded-lg"><AppIcons.Delete className="h-5 w-5"/></button>
                                        </div>
                                     </div>
                                 </div>
                             )
                        })}
                    </div>
                </div>
            );
            case 'cms': return <HomepageCMSTab content={homepageContent} onSave={onUpdateHomepageContent} />;
            case 'site_management': return <SiteManagementTab organizations={organizations} />;
            case 'monitoring': return <MonitoringTab healthData={[]} apiLogs={[]} errorLogs={[]} />;
            case 'automation': return <GlobalAutomationTab rules={globalAutomationRules} emailTemplates={globalEmailTemplates} superAdmins={users.filter(u => u.role === 'Super Admin')} onSave={onSaveGlobalRule} onDelete={onDeleteGlobalRule} />;
            case 'analytics': return <AnalyticsTab organizations={organizations} plans={subscriptionPlans} fetchAnalyticsData={props.fetchAnalyticsData} />;
            case 'support': return <SupportTab tickets={supportTickets} organizations={organizations} users={users} onUpdateStatus={onUpdateTicketStatus} />;
            case 'security': return <SecurityTab logs={auditLogs} users={users} />;
            case 'settings': return (
                <div className="space-y-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Global Settings</h2>
                        <button className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Save All Settings</button>
                    </div>
                    <SettingCard title="Platform Announcement" description="Display a banner to all users.">
                         <textarea defaultValue={globalAnnouncement.message} rows={2} className="w-full bg-background border border-muted p-2 rounded" />
                         <div className="flex justify-between items-center">
                            <select defaultValue={globalAnnouncement.type} className="bg-background border border-muted p-2 rounded text-sm"><option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option></select>
                            <div className="flex items-center gap-2"><ToggleSwitch checked={globalAnnouncement.isActive} onChange={() => {}}/><span>Active</span></div>
                        </div>
                    </SettingCard>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <SettingCard title="Localization"><p>Localization settings here...</p></SettingCard>
                        <SettingCard title="Global Integrations"><p>Integration settings here...</p></SettingCard>
                    </div>
                </div>
            );
            default: return null;
        }
    };

    const tabs = [
        { id: 'overview', name: 'Overview', icon: <AppIcons.Dashboard /> },
        { id: 'organizations', name: 'Organizations', icon: <AppIcons.Team /> },
        { id: 'lead_inquiries', name: 'Lead Inquiries', icon: <AppIcons.Leads /> },
        { id: 'plans', name: 'Pricing & Plans', icon: <AppIcons.Billing /> },
        { id: 'payment_gateway', name: 'Payment Gateway', icon: <AppIcons.Key /> },
        { id: 'blog', name: 'Blog Management', icon: <AppIcons.Blog /> },
        { id: 'cms', name: 'Homepage CMS', icon: <AppIcons.Globe /> },
        { id: 'site_management', name: 'Site Management', icon: <AppIcons.GlobeAlt /> },
        { id: 'monitoring', name: 'System Monitoring', icon: <AppIcons.Activity /> },
        { id: 'automation', name: 'Global Automation', icon: <AppIcons.Automation /> },
        { id: 'analytics', name: 'Analytics', icon: <AppIcons.Analytics /> },
        { id: 'support', name: 'Support', icon: <AppIcons.Support /> },
        { id: 'security', name: 'Security & Audits', icon: <AppIcons.Security /> },
        { id: 'settings', name: 'Global Settings', icon: <AppIcons.Settings /> },
    ];

    const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
         <nav className="w-64 bg-surface flex flex-col h-screen border-r border-muted flex-shrink-0">
            <Link to="/super-admin" className="h-16 flex items-center px-4 border-b border-muted group">
                <AppIcons.Logo className="h-8 w-auto text-primary-500 transition-transform group-hover:scale-110" />
                <h1 className="ml-3 text-lg font-bold group-hover:text-primary-500 transition-colors">Super Admin</h1>
            </Link>
            <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => { setActiveTab(tab.id); onLinkClick?.(); }} className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-colors duration-200 ${activeTab === tab.id ? 'bg-primary-600 text-white' : 'text-subtle hover:bg-muted hover:text-on-surface'}`}>
                        {React.cloneElement(tab.icon, { className: 'h-5 w-5 mr-3' })}
                        <span>{tab.name}</span>
                    </button>
                ))}
            </div>
            <div className="p-4 border-t border-muted">
                <button onClick={onLogout} className="w-full flex items-center text-sm font-semibold text-subtle hover:text-red-500 transition-colors p-2 rounded-lg">
                    <AppIcons.Logout className="h-5 w-5 mr-2" />
                    Logout
                </button>
            </div>
        </nav>
    );

    return (
        <div className="min-h-screen bg-background text-on-surface flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <SidebarContent />
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="absolute top-0 left-0 h-full" onClick={e => e.stopPropagation()}>
                        <SidebarContent onLinkClick={() => setIsMobileMenuOpen(false)} />
                    </div>
                </div>
            )}

            {/* Test Payment Result Modal */}
            {testPaymentResult && (
                <Modal isOpen={true} onClose={() => setTestPaymentResult(null)} title="Test Payment Result">
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            {testPaymentResult.success ? (
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <AppIcons.CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <AppIcons.XCircle className="h-6 w-6 text-red-600" />
                                </div>
                            )}
                            <div>
                                <h3 className={`text-lg font-semibold ${testPaymentResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                    {testPaymentResult.success ? 'Test Successful' : 'Test Failed'}
                                </h3>
                                <p className="text-sm text-subtle capitalize">{testPaymentResult.provider} Payment Gateway</p>
                            </div>
                        </div>

                        <div className="bg-surface p-4 rounded-lg border border-muted mb-6">
                            <p className="text-sm text-on-surface">{testPaymentResult.message}</p>
                            {testPaymentResult.success && testPaymentResult.transactionId && (
                                <div className="mt-3 p-2 bg-muted rounded text-xs font-mono">
                                    Transaction ID: {testPaymentResult.transactionId}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setTestPaymentResult(null)}
                                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            <div className="flex-1 flex flex-col">
                <header className="md:hidden h-16 bg-surface border-b border-muted flex items-center justify-between px-4">
                    <AppIcons.Logo className="h-8 w-8 text-primary-500" />
                    <button onClick={() => setIsMobileMenuOpen(true)}><AppIcons.Menu className="h-6 w-6" /></button>
                </header>
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;


