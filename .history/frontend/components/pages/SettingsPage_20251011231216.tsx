



import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppIcons } from '../ui/Icons';
import { Stage, CustomFieldDefinition, User, Permission, LeadScoreRule, Organization, SubscriptionPlan, BillingHistory, Addon } from '../../types';
import { faker } from '@faker-js/faker';

const SettingCard: React.FC<{ title: string; description?: string; children: React.ReactNode; permission?: Permission; hasPermission?: (p: Permission) => boolean, initiallyOpen?: boolean; }> = ({ title, description, children, permission, hasPermission, initiallyOpen = false }) => {
    const [isOpen, setIsOpen] = useState(initiallyOpen);
    
    if (permission && hasPermission && !hasPermission(permission)) {
        return null;
    }

    return (
        <div className="bg-surface rounded-xl shadow-lg border border-muted/50">
            <button onClick={() => setIsOpen(!isOpen)} className="md:pointer-events-none w-full flex justify-between items-start text-left p-6">
                 <div>
                    <h3 className="text-xl font-bold text-on-surface">{title}</h3>
                    {description && <p className="text-subtle mt-1 max-w-2xl">{description}</p>}
                </div>
                 <AppIcons.ChevronRight className={`md:hidden h-6 w-6 text-subtle transition-transform flex-shrink-0 mt-1 ${isOpen ? 'rotate-90' : ''}`} />
            </button>
             <div className={`md:block ${isOpen ? 'block' : 'hidden'}`}>
                <div className="px-6 pb-6 pt-0 space-y-4">
                    {children}
                </div>
             </div>
        </div>
    );
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });


const ProfileSettings: React.FC<{ currentUser: User; onUpdateProfile: (data: Partial<User>) => void; }> = ({ currentUser, onUpdateProfile }) => {
    const [name, setName] = useState(currentUser.name);
    const [phone, setPhone] = useState(currentUser.phone || '');
    const [avatar, setAvatar] = useState(currentUser.avatar);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            // Here you would make an API call to update the profile
            // For now, we'll simulate the API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            onUpdateProfile({ name, avatar, phone });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const base64 = await fileToBase64(file);
            setAvatar(base64);
        }
    };
    
    return (
        <SettingCard title="My Profile" description="Manage your personal information and preferences." initiallyOpen={true}>
             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center space-x-6">
                     <img src={avatar} alt="Avatar" className="h-24 w-24 rounded-full object-cover ring-4 ring-muted" />
                     <div className="flex-grow">
                         <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                         <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-muted hover:bg-subtle/20 text-on-surface font-semibold py-2 px-4 rounded-lg">
                            Upload New Picture
                        </button>
                        <p className="text-xs text-subtle mt-2">Recommended: 200x200px</p>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-muted">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-subtle">Full Name</label>
                        <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full bg-background border border-muted rounded-md py-2 px-3 focus:outline-none focus:ring-primary-500"/>
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-subtle">Phone Number</label>
                        <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full bg-background border border-muted rounded-md py-2 px-3 focus:outline-none focus:ring-primary-500"/>
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-subtle">Email Address</label>
                         <input id="email" type="email" value={currentUser.email} readOnly disabled className="mt-1 block w-full bg-muted/50 border border-muted rounded-md text-subtle cursor-not-allowed py-2 px-3"/>
                    </div>
                </div>
                 <div className="flex justify-end pt-5"><button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Save Changes</button></div>
            </form>
        </SettingCard>
    );
};

const AccountBillingSettings: React.FC<{
    organization: Organization,
    plans: SubscriptionPlan[],
    history: BillingHistory[],
    onUpgrade: (planId: string, billingCycle: string) => void,
    onRefreshData: () => void
}> = ({ organization, plans, history, onUpgrade, onRefreshData }) => {
    const currentPlan = plans.find(p => p.id === organization.subscriptionPlanId);
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handlePlanChange = async (planId: string, billingCycle: string = 'monthly') => {
        setIsLoading(planId);
        setMessage(null);

        try {
            await onUpgrade(planId, billingCycle);
            setMessage({ type: 'success', text: 'Subscription updated successfully!' });
            onRefreshData(); // Refresh the data to show updated subscription
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update subscription. Please try again.' });
        } finally {
            setIsLoading(null);
        }
    };

    return (
         <div className="space-y-8">
              <SettingCard title="My Subscription" description="Manage your current plan and features.">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {plans.filter(p => p.price > 0).map(plan => (
                         <div key={plan.id} className={`p-6 rounded-lg border-2 ${currentPlan?.id === plan.id ? 'border-primary-500 bg-primary-500/5' : 'border-muted'}`}>
                             <h4 className="font-bold text-lg text-on-surface">{plan.name}</h4>
                             <p className="text-3xl font-bold mt-2">${plan.price}<span className="text-sm font-normal text-subtle">/mo</span></p>
                             <p className="text-xs text-subtle">{plan.userLimit} Users</p>
                             <ul className="text-xs space-y-1 mt-4">
                                 {plan.features.slice(0, 4).map(f => <li key={f} className="flex items-center gap-2"><AppIcons.CheckCircle className="h-4 w-4 text-green-500"/> {f.replace(/_/g, ' ')}</li>)}
                             </ul>
                              <button
                                 onClick={() => handlePlanChange(plan.id, 'monthly')}
                                 disabled={currentPlan?.id === plan.id || isLoading === plan.id}
                                 className="w-full mt-6 py-2 rounded-lg font-semibold text-sm disabled:bg-primary-600 disabled:text-white disabled:cursor-not-allowed bg-muted hover:bg-primary-500/20 text-on-surface hover:text-primary-500 transition-colors"
                              >
                                 {isLoading === plan.id ? (
                                     <div className="flex items-center justify-center gap-2">
                                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                         Processing...
                                     </div>
                                 ) : currentPlan?.id === plan.id ? (
                                     'Current Plan'
                                 ) : (
                                     currentPlan && plan.price > currentPlan.price ? 'Upgrade' : 'Downgrade'
                                 )}
                             </button>
                         </div>
                     ))}
                 </div>
                 {message && (
                     <div className={`mt-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                         {message.text}
                     </div>
                 )}
             </SettingCard>
             <SettingCard title="Billing History" description="Review your past payments and download invoices.">
                 <table className="min-w-full divide-y divide-muted">
                    <thead className="bg-muted/50"><tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Plan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Invoice</th>
                    </tr></thead>
                    <tbody className="divide-y divide-muted">
                        {history.map(item => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 text-sm">{new Date(item.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-sm">{item.planName}</td>
                                <td className="px-6 py-4 text-sm">${item.amount.toFixed(2)}</td>
                                <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-800 text-green-200">{item.status}</span></td>
                                <td className="px-6 py-4"><a href={item.invoiceUrl} className="text-primary-500 hover:underline text-sm font-semibold">Download</a></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </SettingCard>
        </div>
    );
};

const PipelineSettings: React.FC<{ stages: Stage[]; onAdd: () => void; onUpdate: (id: string, field: 'name' | 'color', value: string) => void; onDelete: (id: string) => void }> = ({ stages, onAdd, onUpdate, onDelete }) => {
    const [localStages, setLocalStages] = useState(stages);
    const [isLoading, setIsLoading] = useState<string | null>(null);

    useEffect(() => {
        setLocalStages(stages);
    }, [stages]);

    const handleAdd = async () => {
        setIsLoading('add');
        try {
            await onAdd();
        } catch (error) {
            console.error('Failed to add stage:', error);
        } finally {
            setIsLoading(null);
        }
    };

    const handleUpdate = async (id: string, field: 'name' | 'color', value: string) => {
        setIsLoading(`update-${id}`);
        try {
            await onUpdate(id, field, value);
        } catch (error) {
            console.error('Failed to update stage:', error);
        } finally {
            setIsLoading(null);
        }
    };

    const handleDelete = async (id: string) => {
        setIsLoading(`delete-${id}`);
        try {
            await onDelete(id);
        } catch (error) {
            console.error('Failed to delete stage:', error);
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="space-y-3">
            {localStages.map(stage => (
                <div key={stage.id} className="flex items-center gap-2 p-2 bg-background rounded-lg">
                    <input
                        type="color"
                        value={stage.color}
                        onChange={e => handleUpdate(stage.id, 'color', e.target.value)}
                        disabled={isLoading === `update-${stage.id}`}
                        className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent disabled:opacity-50"
                        style={{backgroundColor: stage.color}}
                    />
                    <input
                        type="text"
                        value={stage.name}
                        onChange={e => handleUpdate(stage.id, 'name', e.target.value)}
                        disabled={isLoading === `update-${stage.id}`}
                        className="flex-grow bg-transparent focus:bg-muted p-1 rounded-md disabled:opacity-50"
                    />
                    <button
                        onClick={() => handleDelete(stage.id)}
                        disabled={isLoading === `delete-${stage.id}`}
                        className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading === `delete-${stage.id}` ? (
                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <AppIcons.Delete className="w-4 h-4"/>
                        )}
                    </button>
                </div>
            ))}
            <button
                onClick={handleAdd}
                disabled={isLoading === 'add'}
                className="text-sm text-primary-500 font-semibold hover:text-primary-600 mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {isLoading === 'add' ? (
                    <>
                        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                        Adding...
                    </>
                ) : (
                    <>
                        <AppIcons.Plus className="w-4 h-4" />
                        Add Stage
                    </>
                )}
            </button>
        </div>
    );
};

const CustomFieldsSettings: React.FC<{ fields: CustomFieldDefinition[]; onAdd: (type: CustomFieldDefinition['type']) => void; onUpdate: (id: string, data: Partial<CustomFieldDefinition>) => void; onDelete: (id: string) => void }> = ({ fields, onAdd, onUpdate, onDelete }) => (
    <div className="space-y-3">
        {fields.map(field => (
            <div key={field.id} className="bg-background p-4 rounded-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <input type="text" value={field.name} onChange={e => onUpdate(field.id, { name: e.target.value })} className="font-medium text-on-surface bg-transparent focus:bg-muted p-1 rounded-md"/>
                        <span className="text-sm uppercase text-subtle bg-muted px-2 py-1 rounded">{field.type}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center text-sm cursor-pointer"><input type="checkbox" checked={field.isMappable} onChange={e => onUpdate(field.id, { isMappable: e.target.checked })} className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-muted bg-surface mr-2" /> Mappable</label>
                        <label className="flex items-center text-sm cursor-pointer"><input type="checkbox" checked={field.isRequired} onChange={e => onUpdate(field.id, { isRequired: e.target.checked })} className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-muted bg-surface mr-2" /> Mandatory</label>
                        <button onClick={() => onDelete(field.id)} className="text-red-400 hover:text-red-300"><AppIcons.Delete className="w-4 h-4"/></button>
                    </div>
                </div>
            </div>
        ))}
        <select onChange={(e) => { onAdd(e.target.value as CustomFieldDefinition['type']); e.target.value = ''; }} className="text-sm text-primary-500 font-semibold mt-2 bg-transparent p-1 cursor-pointer">
            <option value="" disabled selected>+ Add Field</option><option value="text">Text</option><option value="number">Number</option><option value="date">Date</option><option value="dropdown">Dropdown</option>
        </select>
    </div>
);

const LeadScoringSettings: React.FC<{ rules: LeadScoreRule[]; customFieldDefs: CustomFieldDefinition[]; onSave: (rule: LeadScoreRule) => void; onDelete: (id: string) => void; }> = ({ rules, customFieldDefs, onSave, onDelete }) => {
    const fields = useMemo(() => [{id: 'source', name: 'Source'}, {id: 'course', name: 'Course'}, {id: 'city', name: 'City'}, {id: 'company', name: 'Company'}, {id: 'email', name: 'Email'}, {id: 'phone', name: 'Phone'}, ...customFieldDefs.map(cf => ({id: `customFields.${cf.id}`, name: `(Custom) ${cf.name}`}))], [customFieldDefs]);
    
    const handleAdd = () => onSave({
        id: `new_${faker.string.uuid()}`,
        field: 'source',
        operator: 'equals',
        value: '',
        points: 10,
        organizationId: rules.length > 0 ? rules[0].organizationId : ''
    });

    const [localRules, setLocalRules] = useState(rules);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        setLocalRules(rules);
    }, [rules]);

    const handleSort = () => {
        if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
            dragItem.current = null;
            dragOverItem.current = null;
            return;
        }
        let _rules = [...localRules];
        const draggedItemContent = _rules.splice(dragItem.current, 1)[0];
        _rules.splice(dragOverItem.current, 0, draggedItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setLocalRules(_rules);
    };

    return (
        <div className="space-y-3">
            {localRules.map((rule, index) => (
                <div 
                    key={rule.id}
                    className="flex items-center gap-3 p-3 bg-background rounded-lg border border-muted group transition-shadow hover:shadow-md"
                    draggable
                    onDragStart={() => (dragItem.current = index)}
                    onDragEnter={() => (dragOverItem.current = index)}
                    onDragEnd={handleSort}
                    onDragOver={(e) => e.preventDefault()}
                >
                    <div className="cursor-grab text-subtle hover:text-on-surface" title="Drag to reorder">
                        <AppIcons.GripVertical className="w-5 h-5"/>
                    </div>
                    <span className="font-semibold text-subtle">IF</span>
                    <select value={rule.field} onChange={e => onSave({ ...rule, field: e.target.value as any })} className="bg-surface border border-muted py-1 px-2 rounded-md text-sm font-semibold text-on-surface focus:ring-1 focus:ring-primary-500 cursor-pointer">
                        {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <select value={rule.operator} onChange={e => onSave({ ...rule, operator: e.target.value as any })} className="bg-surface border border-muted py-1 px-2 rounded-md text-sm font-semibold text-on-surface focus:ring-1 focus:ring-primary-500 cursor-pointer">
                        <option value="equals">equals</option>
                        <option value="contains">contains</option>
                        <option value="not_equals">not equals</option>
                        <option value="is_set">is set</option>
                        <option value="is_not_set">is not set</option>
                    </select>
                    {!['is_set', 'is_not_set'].includes(rule.operator) &&
                        <input type="text" value={rule.value} onChange={e => onSave({ ...rule, value: e.target.value })} className="bg-surface border border-muted py-1 px-2 rounded-md text-sm font-semibold text-on-surface focus:ring-1 focus:ring-primary-500 w-32"/>
                    }
                    <span className="font-semibold text-subtle">THEN</span>
                    <div className="flex items-center bg-surface border border-muted rounded-md overflow-hidden">
                        <button type="button" onClick={() => onSave({ ...rule, points: rule.points - 1 })} className="px-2 py-1 hover:bg-muted font-bold text-lg leading-none flex items-center justify-center h-full">-</button>
                        <span className={`px-3 font-bold text-sm w-20 text-center ${rule.points >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {rule.points >= 0 ? `+${rule.points}` : rule.points} points
                        </span>
                        <button type="button" onClick={() => onSave({ ...rule, points: rule.points + 1 })} className="px-2 py-1 hover:bg-muted font-bold text-lg leading-none flex items-center justify-center h-full">+</button>
                    </div>

                    <button onClick={() => onDelete(rule.id)} className="text-subtle hover:text-red-400 ml-auto p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><AppIcons.Delete className="w-4 h-4"/></button>
                </div>
            ))}
            <button onClick={handleAdd} className="text-sm text-primary-500 font-semibold hover:text-primary-600 mt-2">+ Add Rule</button>
        </div>
    );
};


interface SettingsPageProps {
    pipelineStages: Stage[];
    onAddStage: () => void;
    onUpdateStage: (id: string, field: 'name' | 'color', value: string) => void;
    onDeleteStage: (id: string) => void;
    customFieldDefs: CustomFieldDefinition[];
    onAddCustomField: (type: CustomFieldDefinition['type']) => void;
    onUpdateCustomField: (id: string, data: Partial<CustomFieldDefinition>) => void;
    onDeleteCustomField: (id: string) => void;
    leadScoreRules: LeadScoreRule[];
    onSaveLeadScoreRule: (rule: LeadScoreRule) => void;
    onDeleteLeadScoreRule: (id: string) => void;
    theme: string;
    toggleTheme: () => void;
    currentUser: User;
    hasPermission: (permission: Permission) => boolean;
    currentOrganization: Organization | null;
    subscriptionPlans: SubscriptionPlan[];
    onUpdateProfile: (data: Partial<User>) => void;
    billingHistory: BillingHistory[];
    // FIX: Add missing props to match the component call in App.tsx.
    addons: Addon[];
    onUpdateOrganization: (updatedFields: Partial<Organization>) => void;
    onUpgradeSubscription: (planId: string, billingCycle: string) => void;
    onRefreshData: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = (props) => {
    const { currentUser, hasPermission, currentOrganization, subscriptionPlans, billingHistory, onUpdateProfile, onUpgradeSubscription, onRefreshData } = props;
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { id: 'profile', name: 'My Profile', permission: true },
        { id: 'account', name: 'Account & Billing', permission: hasPermission(Permission.MANAGE_SETTINGS) },
        { id: 'pipeline', name: 'Pipeline', permission: hasPermission(Permission.MANAGE_SETTINGS) },
        { id: 'fields', name: 'Custom Fields', permission: hasPermission(Permission.MANAGE_SETTINGS) },
        { id: 'scoring', name: 'Lead Scoring', permission: hasPermission(Permission.MANAGE_SETTINGS) },
        { id: 'appearance', name: 'Appearance', permission: true },
    ].filter(tab => tab.permission);

    if (!currentOrganization) return null;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-on-surface mb-2">General Settings</h2>
            <div className="border-b border-muted">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`${activeTab === tab.id ? 'border-primary-500 text-primary-500' : 'border-transparent text-subtle hover:text-on-surface hover:border-muted'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>
             <div className="pt-6">
                {activeTab === 'profile' && <ProfileSettings currentUser={currentUser} onUpdateProfile={onUpdateProfile} />}
                
                {activeTab === 'account' && <AccountBillingSettings organization={currentOrganization} plans={subscriptionPlans} history={billingHistory} onUpgrade={onUpgradeSubscription} onRefreshData={onRefreshData} />}

                {activeTab === 'appearance' && (
                    <SettingCard title="Appearance" description="Customize the look and feel of your CRM.">
                        <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                            <h4 className="font-semibold text-on-surface">Interface Theme</h4>
                            <button onClick={props.toggleTheme} className="relative inline-flex items-center h-8 rounded-full p-1 bg-muted">
                                <span className={`${props.theme === 'light' ? 'bg-primary-500 text-white' : 'text-subtle'} px-3 py-1 text-sm rounded-full transition-colors`}>Light</span>
                                <span className={`${props.theme === 'dark' ? 'bg-primary-600 text-white' : 'text-subtle'} px-3 py-1 text-sm rounded-full transition-colors`}>Dark</span>
                            </button>
                        </div>
                    </SettingCard>
                )}
                 {activeTab === 'pipeline' && (
                    <SettingCard title="Pipeline Stages" description="Customize the stages in your sales pipeline." permission={Permission.MANAGE_SETTINGS} hasPermission={hasPermission}>
                       <PipelineSettings stages={props.pipelineStages} onAdd={props.onAddStage} onUpdate={props.onUpdateStage} onDelete={props.onDeleteStage} />
                    </SettingCard>
                 )}
                 {activeTab === 'fields' && (
                     <SettingCard title="Custom Fields" description="Create and manage custom fields for your leads." permission={Permission.MANAGE_SETTINGS} hasPermission={hasPermission}>
                       <CustomFieldsSettings fields={props.customFieldDefs} onAdd={props.onAddCustomField} onUpdate={props.onUpdateCustomField} onDelete={props.onDeleteCustomField} />
                    </SettingCard>
                 )}
                 {activeTab === 'scoring' && (
                     <SettingCard title="Lead Scoring" description="Automate lead prioritization by setting up scoring rules." permission={Permission.MANAGE_SETTINGS} hasPermission={hasPermission}>
                       <LeadScoringSettings rules={props.leadScoreRules} onSave={props.onSaveLeadScoreRule} onDelete={props.onDeleteLeadScoreRule} customFieldDefs={props.customFieldDefs} />
                    </SettingCard>
                 )}
            </div>
        </div>
    );
};

export default SettingsPage;


