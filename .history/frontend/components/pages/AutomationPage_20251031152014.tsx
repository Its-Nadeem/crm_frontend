import React, { useState } from 'react';
import { AutomationRule, User, Team, FilterCondition, FilterOperator, CustomFieldDefinition, AutomationTrigger, Stage, AutomationAction } from '../../types';
import { AppIcons } from '../ui/Icons';
import Modal from '../ui/Modal';

const AutomationRuleModal: React.FC<{
    rule: Partial<AutomationRule> | null;
    users: User[];
    teams: Team[];
    customFieldDefs: CustomFieldDefinition[];
    pipelineStages: Stage[];
    phoneLists?: any[];
    onClose: () => void;
    onSave: (rule: AutomationRule) => void;
}> = ({ rule, users, teams, customFieldDefs, pipelineStages, phoneLists = [], onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<AutomationRule>>(
        rule || {
            name: '', description: '', isEnabled: true,
            trigger: { type: 'NEW_LEAD' },
            conditions: [],
            action: { type: 'ADD_TAG', tag: '' }
        }
    );

    const isEditing = !!formData.id;

    const standardFields = [
        { id: 'source', name: 'Source', type: 'text' },
        { id: 'dealValue', name: 'Deal Value', type: 'number' },
        { id: 'score', name: 'Score', type: 'number' },
        { id: 'campaign', name: 'Campaign', type: 'text' },
        { id: 'tags', name: 'Tags', type: 'text' },
        { id: 'stage', name: 'Stage', type: 'text'},
    ];
    const allFilterableFields = [...standardFields, ...customFieldDefs];

    const handleTriggerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const type = e.target.value as AutomationTrigger['type'];
        if (type === 'NEW_LEAD') setFormData(prev => ({...prev, trigger: {type: 'NEW_LEAD'}}));
        if (type === 'LEAD_UNTOUCHED') setFormData(prev => ({...prev, trigger: {type: 'LEAD_UNTOUCHED', hours: 24}}));
        if (type === 'STAGE_CHANGED') setFormData(prev => ({...prev, trigger: {type: 'STAGE_CHANGED', toStage: pipelineStages[0].id}}));
        if (type === 'TASK_COMPLETED') setFormData(prev => ({...prev, trigger: {type: 'TASK_COMPLETED'}}));
        if (type === 'LEAD_SCORE_REACHES') setFormData(prev => ({...prev, trigger: {type: 'LEAD_SCORE_REACHES', score: 80}}));
    }
    
    const handleTriggerValueChange = (value: string | number) => {
        if(formData.trigger?.type === 'LEAD_UNTOUCHED') {
            setFormData(prev => ({...prev, trigger: {type: 'LEAD_UNTOUCHED', hours: Number(value)}}));
        }
        if(formData.trigger?.type === 'STAGE_CHANGED') {
            setFormData(prev => ({...prev, trigger: {type: 'STAGE_CHANGED', toStage: String(value)}}));
        }
        if(formData.trigger?.type === 'LEAD_SCORE_REACHES') {
            setFormData(prev => ({...prev, trigger: {type: 'LEAD_SCORE_REACHES', score: Number(value)}}));
        }
    }

    const addCondition = () => {
        setFormData(prev => ({ ...prev, conditions: [...(prev.conditions || []), { id: Date.now(), field: 'source', operator: 'equals', value: '', logic: 'AND' }] }));
    };
    
    const updateCondition = (index: number, newCondition: FilterCondition) => {
        const newConditions = [...(formData.conditions || [])];
        newConditions[index] = newCondition;
        setFormData(prev => ({ ...prev, conditions: newConditions }));
    };

    const removeCondition = (index: number) => {
        setFormData(prev => ({ ...prev, conditions: (prev.conditions || []).filter((_, i) => i !== index) }));
    };

    const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const type = e.target.value as AutomationAction['type'];
        if (type === 'ADD_TAG') setFormData(prev => ({...prev, action: {type: 'ADD_TAG', tag: ''}}));
        if (type === 'ASSIGN_TO_USER') setFormData(prev => ({...prev, action: {type: 'ASSIGN_TO_USER', userId: users[0].id}}));
        if (type === 'ASSIGN_TO_TEAM') setFormData(prev => ({...prev, action: {type: 'ASSIGN_TO_TEAM', teamId: teams[0].id}}));
        if (type === 'ASSIGN_ROUND_ROBIN') setFormData(prev => ({...prev, action: {type: 'ASSIGN_ROUND_ROBIN', teamId: teams[0].id}}));
        if (type === 'SEND_WEBHOOK') setFormData(prev => ({...prev, action: {type: 'SEND_WEBHOOK', url: ''}}));
        if (type === 'CREATE_TASK') setFormData(prev => ({...prev, action: {type: 'CREATE_TASK', title: '', dueDays: 3}}));
        if (type === 'ADD_TO_PHONE_LIST') setFormData(prev => ({...prev, action: {type: 'ADD_TO_PHONE_LIST', phoneListId: ''}}));
    }
    
    const handleActionValueChange = (key: string, value: string | number) => {
        setFormData(prev => {
            if (!prev.action) return prev;
            const newAction = { ...prev.action, [key]: value };
            return { ...prev, action: newAction };
        });
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as AutomationRule);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={isEditing ? "Edit Automation Rule" : "Add New Rule"}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-subtle">Rule Name</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-subtle">Description</label>
                    <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500"/>
                </div>

                <div className="p-4 border border-blue-500/30 bg-blue-500/5 rounded-lg space-y-4">
                    <h3 className="font-semibold text-on-surface flex items-center gap-2"><span className="bg-blue-900/50 text-blue-300 font-semibold px-2 py-1 rounded-md text-xs">WHEN</span> This happens... (Trigger)</h3>
                    <div className="flex items-center gap-2">
                        <select value={formData.trigger?.type} onChange={handleTriggerChange} className="bg-background border border-muted p-2 rounded-lg text-sm">
                            <option value="NEW_LEAD">A New Lead is Created</option>
                            <option value="LEAD_UNTOUCHED">Lead is Untouched For...</option>
                            <option value="STAGE_CHANGED">Lead Stage Changes to...</option>
                            <option value="TASK_COMPLETED">A Task is Completed</option>
                            <option value="LEAD_SCORE_REACHES">Lead Score Reaches...</option>
                        </select>
                        {formData.trigger?.type === 'LEAD_UNTOUCHED' && (
                            <div className="flex items-center gap-2">
                                <input type="number" value={formData.trigger.hours} onChange={e => handleTriggerValueChange(e.target.value)} className="bg-background border border-muted p-2 rounded-lg text-sm w-20" />
                                <span>hours</span>
                            </div>
                        )}
                         {formData.trigger?.type === 'LEAD_SCORE_REACHES' && (
                            <div className="flex items-center gap-2">
                                <input type="number" value={formData.trigger.score} onChange={e => handleTriggerValueChange(e.target.value)} className="bg-background border border-muted p-2 rounded-lg text-sm w-20" />
                                <span>points</span>
                            </div>
                        )}
                        {formData.trigger?.type === 'STAGE_CHANGED' && (
                            <select value={formData.trigger.toStage} onChange={e => handleTriggerValueChange(e.target.value)} className="bg-background border border-muted p-2 rounded-lg text-sm">
                                {pipelineStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        )}
                    </div>
                    
                    <h4 className="font-semibold text-on-surface text-sm pt-2 flex items-center gap-2"><span className="bg-gray-500/50 text-gray-300 font-semibold px-2 py-1 rounded-md text-xs">AND</span> If these conditions match... (Optional)</h4>
                    {formData.conditions?.map((cond, index) => (
                        <div key={cond.id} className="flex items-center gap-2">
                            <select value={cond.field} onChange={e => updateCondition(index, {...cond, field: e.target.value})} className="bg-background border border-muted p-2 rounded-lg text-sm">
                                {allFilterableFields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                            <select value={cond.operator} onChange={e => updateCondition(index, {...cond, operator: e.target.value as FilterOperator})} className="bg-background border border-muted p-2 rounded-lg text-sm">
                                <option value="contains">Contains</option><option value="equals">Is</option><option value="not_equals">Is Not</option><option value="gt">&gt;</option><option value="lt">&lt;</option>
                            </select>
                            <input type="text" value={cond.value} onChange={e => updateCondition(index, {...cond, value: e.target.value})} placeholder="Value" className="bg-background border border-muted p-2 rounded-lg text-sm" />
                            <button type="button" onClick={() => removeCondition(index)}><AppIcons.Delete className="h-4 w-4 text-red-400"/></button>
                        </div>
                    ))}
                    <button type="button" onClick={addCondition} className="text-sm text-primary-500 font-semibold hover:text-primary-600">+ Add Condition</button>
                </div>
                
                <div className="p-4 border border-purple-500/30 bg-purple-500/5 rounded-lg space-y-4">
                    <h3 className="font-semibold text-on-surface flex items-center gap-2"><span className="bg-purple-900/50 text-purple-300 font-semibold px-2 py-1 rounded-md text-xs">THEN</span> Do this... (Action)</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                        <select value={formData.action?.type} onChange={handleActionChange} className="bg-background border border-muted p-2 rounded-lg text-sm">
                            <option value="ASSIGN_TO_USER">Assign to User</option>
                            <option value="ASSIGN_TO_TEAM">Assign to Team</option>
                            <option value="ASSIGN_ROUND_ROBIN">Assign via Round Robin (in Team)</option>
                            <option value="ADD_TAG">Add Tag</option>
                            <option value="SEND_WEBHOOK">Send Webhook</option>
                            <option value="CREATE_TASK">Create a Task</option>
                            <option value="ADD_TO_PHONE_LIST">Add to Phone List</option>
                        </select>
                        {formData.action?.type === 'ASSIGN_TO_USER' && (
                             <select value={(formData.action as any).userId} onChange={e => handleActionValueChange('userId', Number(e.target.value))} className="bg-background border border-muted p-2 rounded-lg text-sm">
                                {users.filter(u => u.role !== 'Admin').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        )}
                        {(formData.action?.type === 'ASSIGN_TO_TEAM' || formData.action?.type === 'ASSIGN_ROUND_ROBIN') && (
                             <select value={(formData.action as any).teamId} onChange={e => handleActionValueChange('teamId', e.target.value)} className="bg-background border border-muted p-2 rounded-lg text-sm">
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        )}
                        {formData.action?.type === 'ADD_TAG' && (
                            <input type="text" value={(formData.action as any).tag} onChange={e => handleActionValueChange('tag', e.target.value)} placeholder="tag name" className="bg-background border border-muted p-2 rounded-lg text-sm"/>
                        )}
                        {formData.action?.type === 'SEND_WEBHOOK' && (
                            <input type="url" value={(formData.action as any).url} onChange={e => handleActionValueChange('url', e.target.value)} placeholder="https://example.com/webhook" className="w-full bg-background border border-muted p-2 rounded-lg text-sm"/>
                        )}
                        {formData.action?.type === 'CREATE_TASK' && (
                            <>
                                <input type="text" value={(formData.action as any).title} onChange={e => handleActionValueChange('title', e.target.value)} placeholder="Task Title" className="bg-background border border-muted p-2 rounded-lg text-sm flex-grow"/>
                                <span className="text-sm text-subtle">due in</span>
                                <input type="number" value={(formData.action as any).dueDays} onChange={e => handleActionValueChange('dueDays', Number(e.target.value))} className="bg-background border border-muted p-2 rounded-lg text-sm w-20"/>
                                <span className="text-sm text-subtle">days</span>
                            </>
                        )}
                        {formData.action?.type === 'ADD_TO_PHONE_LIST' && (
                            <select value={(formData.action as any).phoneListId} onChange={e => handleActionValueChange('phoneListId', e.target.value)} className="bg-background border border-muted p-2 rounded-lg text-sm">
                                <option value="">Select a phone list</option>
                                {phoneLists.map(list => (
                                    <option key={list.id} value={list.id}>
                                        {list.name} ({list.totalContacts || 0} contacts)
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Save Rule</button>
                </div>
            </form>
        </Modal>
    );
};


const RuleCard: React.FC<{
    rule: AutomationRule;
    users: User[];
    teams: Team[];
    phoneLists: any[];
    onToggle: (rule: AutomationRule) => void;
    onEdit: (rule: AutomationRule) => void;
    onDelete: (ruleId: string) => void;
}> = ({ rule, users, teams, phoneLists, onToggle, onEdit, onDelete }) => {

    const getActionDescription = (rule: AutomationRule) => {
        const { action } = rule;
        switch (action.type) {
            case 'ASSIGN_TO_USER':
                const user = users.find(u => u.id === action.userId);
                return `Assign to ${user ? user.name : 'Unknown User'}`;
            case 'ASSIGN_TO_TEAM':
                 const team = teams.find(t => t.id === action.teamId);
                 return `Assign to Team: ${team ? team.name : 'Unknown'}`;
            case 'ASSIGN_ROUND_ROBIN':
                const rrTeam = teams.find(t => t.id === action.teamId);
                return `Round-Robin in Team: ${rrTeam ? rrTeam.name : 'Unknown'}`;
            case 'ADD_TAG':
                return `Add tag: "${action.tag}"`;
            case 'SEND_WEBHOOK':
                return `Send webhook to URL`;
            case 'CREATE_TASK':
                return `Create task: "${action.title}"`;
            case 'ADD_TO_PHONE_LIST':
                const phoneList = phoneLists.find(p => p.id === action.phoneListId);
                return `Add to Phone List: ${phoneList ? phoneList.name : 'Unknown List'}`;
            default:
                return 'Perform an action';
        }
    }
    
    const getTriggerDescription = (rule: AutomationRule) => {
        const { trigger } = rule;
        let base = '';
        switch (trigger.type) {
            case 'NEW_LEAD': base = 'A new lead is created'; break;
            case 'LEAD_UNTOUCHED': base = `A lead is untouched for ${trigger.hours} hours`; break;
            case 'STAGE_CHANGED': base = `A lead's stage is changed`; break;
            case 'TASK_COMPLETED': base = 'A task is completed'; break;
            case 'LEAD_SCORE_REACHES': base = `Lead score reaches ${trigger.score}`; break;
        }
        if (rule.conditions.length > 0) {
            return `${base} that matches conditions...`;
        }
        return base;
    }

    return (
        <div className="bg-surface rounded-lg shadow-lg p-6 flex flex-col justify-between">
            <div className="flex items-start">
                 <div className="bg-muted p-3 rounded-lg mr-4">
                    <AppIcons.Automation className="h-6 w-6 text-primary-400" />
                 </div>
                <div>
                    <h3 className="font-bold text-lg text-on-surface">{rule.name}</h3>
                    <p className="text-sm text-subtle mt-1">{rule.description}</p>
                </div>
            </div>
             <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                    <span className="bg-blue-900/50 text-blue-300 font-semibold px-2 py-1 rounded-md">WHEN</span>
                    <span className="text-subtle pt-1">{getTriggerDescription(rule)}</span>
                </div>
                <div className="flex items-start gap-2">
                    <span className="bg-purple-900/50 text-purple-300 font-semibold px-2 py-1 rounded-md">THEN</span>
                    <span className="text-subtle pt-1">{getActionDescription(rule)}</span>
                </div>
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-muted">
                 <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={rule.isEnabled} onChange={() => onToggle({ ...rule, isEnabled: !rule.isEnabled })} className="sr-only peer" />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
                <div className="flex-grow"></div>
                <button onClick={() => onEdit(rule)} className="p-1 text-subtle hover:text-on-surface"><AppIcons.Edit className="h-4 w-4"/></button>
                <button onClick={() => window.confirm(`Are you sure you want to delete the rule "${rule.name}"?`) && onDelete(rule.id)} className="p-1 text-subtle hover:text-red-400"><AppIcons.Delete className="h-4 w-4"/></button>
            </div>
        </div>
    );
}

interface AutomationPageProps {
    rules: AutomationRule[];
    users: User[];
    teams: Team[];
    customFieldDefs: CustomFieldDefinition[];
    pipelineStages: Stage[];
    phoneLists?: any[]; // Add phone lists for automation
    onSaveRule: (rule: AutomationRule) => void;
    onDeleteRule: (ruleId: string) => void;
}

const AutomationPage: React.FC<AutomationPageProps> = ({ rules, users, teams, customFieldDefs, pipelineStages, phoneLists = [], onSaveRule, onDeleteRule }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

    const handleOpenModal = (rule: AutomationRule | null = null) => {
        setEditingRule(rule);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingRule(null);
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-8">
            {isModalOpen && <AutomationRuleModal rule={editingRule} users={users} teams={teams} customFieldDefs={customFieldDefs} pipelineStages={pipelineStages} phoneLists={phoneLists} onClose={handleCloseModal} onSave={onSaveRule} />}
            <div className="flex flex-wrap gap-4 justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-on-surface">Automation</h2>
                    <p className="text-subtle mt-1">Automate your sales and marketing workflows to save time.</p>
                </div>
                 <button onClick={() => handleOpenModal()} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                    <AppIcons.Add className="w-5 h-5 mr-2" /> New Rule
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rules.map(rule => (
                    <RuleCard key={rule.id} rule={rule} users={users} teams={teams} phoneLists={phoneLists} onToggle={onSaveRule} onEdit={handleOpenModal} onDelete={onDeleteRule} />
                ))}
            </div>

        </div>
    );
};

export default AutomationPage;


