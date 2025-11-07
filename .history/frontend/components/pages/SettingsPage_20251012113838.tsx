



import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppIcons } from '../ui/Icons';
import AddStageModal from '../../src/components/ui/AddStageModal';
import DeleteStageModal from '../../src/components/ui/DeleteStageModal';
import AddRuleModal from '../../src/components/ui/AddRuleModal';
import DeleteRuleModal from '../../src/components/ui/DeleteRuleModal';
import { CustomFieldManager } from '../../src/components/ui/CustomFieldManager';
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

const PipelineSettings: React.FC<{ stages: Stage[]; onAdd: (name: string, color: string) => void; onUpdate: (id: string, field: 'name' | 'color', value: string) => void; onDelete: (id: string) => void }> = ({ stages, onAdd, onUpdate, onDelete }) => {
    const [localStages, setLocalStages] = useState(stages);
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [stageToDelete, setStageToDelete] = useState<Stage | null>(null);

    useEffect(() => {
        console.log('DEBUG: PipelineSettings: Stages updated, re-syncing local state:', {
            stagesCount: stages.length,
            localStagesCount: localStages.length,
            stages: stages.map(s => ({id: s.id, name: s.name})),
            localStages: localStages.map(s => ({id: s.id, name: s.name}))
        });
        setLocalStages(stages);
        // Force re-render when stages change
        setRefreshTrigger(prev => prev + 1);
    }, [stages]);

    const handleAddStage = async (name: string, color: string) => {
        console.log('DEBUG: handleAddStage called with:', { name, color });
        setIsLoading('add');
        try {
            await onAdd(name, color);
            console.log('DEBUG: Stage creation successful, closing modal');
            // Close modal after successful stage creation
            setIsAddModalOpen(false);
        } catch (error) {
            console.error('Failed to add stage:', error);
        } finally {
            setIsLoading(null);
        }
    };

    const handleOpenAddModal = () => {
        console.log('DEBUG: Opening add stage modal');
        setIsAddModalOpen(true);
    };

    const handleCloseAddModal = () => {
        console.log('DEBUG: Closing add stage modal');
        setIsAddModalOpen(false);
    };

    const handleUpdate = async (id: string, field: 'name' | 'color', value: string) => {
        console.log('DEBUG: handleUpdate called:', { id, field, value });
        setIsLoading(`update-${id}`);
        try {
            await onUpdate(id, field, value);
            console.log('DEBUG: Stage update successful');
        } catch (error) {
            console.error('Failed to update stage:', error);
        } finally {
            setIsLoading(null);
        }
    };

    const handleDeleteStage = async () => {
        if (!stageToDelete) return;

        console.log('DEBUG: handleDeleteStage called for stage:', stageToDelete.id, stageToDelete.name);
        setIsLoading(`delete-${stageToDelete.id}`);
        try {
            await onDelete(stageToDelete.id);
            console.log('DEBUG: Stage deletion successful, updating local state');
            // Update local state immediately to remove the deleted stage
            setLocalStages(prev => prev.filter(stage => stage.id !== stageToDelete.id));
            setIsDeleteModalOpen(false);
            setStageToDelete(null);
        } catch (error) {
            console.error('Failed to delete stage:', error);
        } finally {
            setIsLoading(null);
        }
    };

    const handleOpenDeleteModal = (stage: Stage) => {
        console.log('DEBUG: Opening delete modal for stage:', stage.id, stage.name);
        setStageToDelete(stage);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        console.log('DEBUG: Closing delete stage modal');
        setIsDeleteModalOpen(false);
        setStageToDelete(null);
    };

    return (
        <div className="space-y-3">
            {localStages.map(stage => (
                <div key={`${stage.id}-${refreshTrigger}`} className="flex items-center gap-2 p-2 bg-background rounded-lg">
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
                        onBlur={e => handleUpdate(stage.id, 'name', e.target.value)}
                        disabled={isLoading === `update-${stage.id}`}
                        className="flex-grow bg-transparent focus:bg-muted p-1 rounded-md disabled:opacity-50"
                        placeholder="Enter stage name..."
                    />
                    <button
                        onClick={() => handleOpenDeleteModal(stage)}
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
                onClick={handleOpenAddModal}
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
                        +
                        Add Stage
                    </>
                )}
            </button>

            {/* Add Stage Modal */}
            <AddStageModal
                isOpen={isAddModalOpen}
                onClose={handleCloseAddModal}
                onSave={handleAddStage}
                isLoading={isLoading === 'add'}
            />

            {/* Delete Stage Modal */}
            {stageToDelete && (
                <DeleteStageModal
                    isOpen={isDeleteModalOpen}
                    onClose={handleCloseDeleteModal}
                    onConfirm={handleDeleteStage}
                    stageName={stageToDelete.name}
                    stageColor={stageToDelete.color}
                    isLoading={isLoading === `delete-${stageToDelete.id}`}
                    leadCount={0} // You can add logic to count leads in this stage if needed
                />
            )}
        </div>
    );
};

const CustomFieldsSettings: React.FC<{
    organizationId: string;
    onFieldsChange?: (fields: any[]) => void;
}> = ({ organizationId, onFieldsChange }) => (
    <CustomFieldManager
        organizationId={organizationId}
        onFieldsChange={onFieldsChange}
    />
);

const LeadScoringSettings: React.FC<{
    rules: LeadScoreRule[];
    customFieldDefs: CustomFieldDefinition[];
    onSave: (rule: LeadScoreRule) => void;
    onDelete: (id: string) => void;
    onRefreshRules?: () => void;
}> = ({ rules, customFieldDefs, onSave, onDelete, onRefreshRules }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<LeadScoreRule | null>(null);
    const [ruleToDelete, setRuleToDelete] = useState<LeadScoreRule | null>(null);
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const fields = useMemo(() => [
        {id: 'source', name: 'Source'},
        {id: 'course', name: 'Course'},
        {id: 'city', name: 'City'},
        {id: 'company', name: 'Company'},
        {id: 'email', name: 'Email'},
        {id: 'phone', name: 'Phone'},
        ...customFieldDefs.map(cf => ({id: `customFields.${cf.id}`, name: `(Custom) ${cf.name}`}))
    ], [customFieldDefs]);

    const getFieldName = (fieldId: string) => {
        const field = fields.find(f => f.id === fieldId);
        return field ? field.name : fieldId;
    };

    const getRuleDescription = (rule: LeadScoreRule) => {
        const fieldName = getFieldName(rule.field);
        const operatorText = rule.operator.replace('_', ' ');
        const valueText = !['is_set', 'is_not_set'].includes(rule.operator) ? ` "${rule.value}"` : '';
        const pointsText = rule.points >= 0 ? `+${rule.points}` : rule.points;

        return `IF ${fieldName} ${operatorText}${valueText} THEN ${pointsText} points`;
    };

    const handleAddRule = () => {
        setEditingRule(null);
        setIsAddModalOpen(true);
    };

    const handleEditRule = (rule: LeadScoreRule) => {
        setEditingRule(rule);
        setIsAddModalOpen(true);
    };

    const handleSaveRule = async (ruleData: any) => {
        setIsLoading('save');
        try {
            await onSave(ruleData);
            setIsAddModalOpen(false);
            setEditingRule(null);
            // Refresh the rules list in real-time
            if (onRefreshRules) {
                onRefreshRules();
            }
        } catch (error) {
            console.error('Failed to save rule:', error);
        } finally {
            setIsLoading(null);
        }
    };

    const handleDeleteRule = (rule: LeadScoreRule) => {
        setRuleToDelete(rule);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteRule = async () => {
        if (!ruleToDelete || !ruleToDelete.id) {
            console.error('No rule selected for deletion or rule ID is missing');
            return;
        }

        setIsLoading('delete');
        try {
            await onDelete(ruleToDelete.id);
            setIsDeleteModalOpen(false);
            setRuleToDelete(null);
            // Refresh the rules list in real-time
            if (onRefreshRules) {
                onRefreshRules();
            }
        } catch (error) {
            console.error('Failed to delete rule:', error);
        } finally {
            setIsLoading(null);
        }
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setEditingRule(null);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setRuleToDelete(null);
    };

    return (
        <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-on-surface">Lead Scoring Rules</h3>
                    <p className="text-sm text-subtle">Configure rules to automatically score your leads based on their properties</p>
                </div>
                <button
                    onClick={handleAddRule}
                    disabled={isLoading !== null}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white rounded-lg font-medium transition-colors"
                >
                    <AppIcons.Add className="w-4 h-4" />
                    Add Rule
                </button>
            </div>

            {/* Rules List */}
            {rules.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed border-muted">
                    <AppIcons.Sparkles className="w-12 h-12 text-muted mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-on-surface mb-2">No scoring rules yet</h4>
                    <p className="text-subtle mb-4">Create your first rule to start automatically scoring leads based on their properties.</p>
                    <button
                        onClick={handleAddRule}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <AppIcons.Add className="w-4 h-4" />
                        Create First Rule
                    </button>
                </div>
            ) : (
                <div className="grid gap-3">
                    {rules.map((rule, index) => (
                        <div
                            key={rule.id}
                            className="group bg-background border border-muted rounded-lg p-4 hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                {/* Rule Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 text-sm text-subtle mb-1">
                                        <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium">
                                            Rule #{index + 1}
                                        </span>
                                    </div>
                                    <p className="text-on-surface font-medium leading-relaxed">
                                        {getRuleDescription(rule)}
                                    </p>
                                </div>

                                {/* Points Badge */}
                                <div className="flex items-center gap-3">
                                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                                        rule.points >= 0
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                    }`}>
                                        {rule.points >= 0 ? `+${rule.points}` : rule.points} pts
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEditRule(rule)}
                                            disabled={isLoading !== null}
                                            className="p-2 text-subtle hover:text-on-surface hover:bg-muted rounded-lg transition-colors"
                                            title="Edit rule"
                                        >
                                            <AppIcons.Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRule(rule)}
                                            disabled={isLoading !== null}
                                            className="p-2 text-subtle hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete rule"
                                        >
                                            <AppIcons.Delete className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary Stats */}
            {rules.length > 0 && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h4 className="font-medium text-on-surface mb-1">Scoring Summary</h4>
                            <p className="text-sm text-subtle">
                                {rules.length} rule{rules.length !== 1 ? 's' : ''} configured
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="text-center">
                                <div className="font-bold text-green-600">
                                    +{rules.filter(r => r.points > 0).reduce((sum, r) => sum + r.points, 0)}
                                </div>
                                <div className="text-subtle">Max Positive</div>
                            </div>
                            <div className="text-center">
                                <div className="font-bold text-red-600">
                                    {rules.filter(r => r.points < 0).reduce((sum, r) => sum + r.points, 0)}
                                </div>
                                <div className="text-subtle">Max Negative</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <AddRuleModal
                isOpen={isAddModalOpen}
                onClose={handleCloseAddModal}
                onSave={handleSaveRule}
                rule={editingRule}
                customFieldDefs={customFieldDefs}
                isLoading={isLoading === 'save'}
            />

            {ruleToDelete && (
                <DeleteRuleModal
                    isOpen={isDeleteModalOpen}
                    onClose={handleCloseDeleteModal}
                    onConfirm={confirmDeleteRule}
                    ruleDescription={getRuleDescription(ruleToDelete)}
                    isLoading={isLoading === 'delete'}
                />
            )}
        </div>
    );
};


interface SettingsPageProps {
    pipelineStages: Stage[];
    onAddStage: (name: string, color: string) => void;
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
    onRefreshLeadScoreRules?: () => void;
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
                       <CustomFieldsSettings organizationId={currentOrganization.id} onFieldsChange={(fields) => console.log('Fields updated:', fields)} />
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


