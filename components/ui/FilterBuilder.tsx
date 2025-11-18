
import React, { useMemo } from 'react';
import { FilterCondition, User, Stage, CustomFieldDefinition, FilterOperator } from '../../types';
import { LEAD_SOURCES } from '../../constants';
import { AppIcons } from './Icons';

interface FilterBuilderProps {
    conditions: FilterCondition[];
    onConditionsChange: (conditions: FilterCondition[]) => void;
    users: User[];
    pipelineStages: Stage[];
    customFieldDefs: CustomFieldDefinition[];
    headerContent?: React.ReactNode;
}

const FilterBuilder: React.FC<FilterBuilderProps> = ({
    conditions,
    onConditionsChange,
    users,
    pipelineStages,
    customFieldDefs,
    headerContent
}) => {
    
    const filterableFields = useMemo(() => [
        { id: 'name', name: 'Name', type: 'text' },
        { id: 'email', name: 'Email', type: 'text' },
        { id: 'phone', name: 'Phone', type: 'text' },
        { id: 'city', name: 'City', type: 'text' },
        { id: 'course', name: 'Course', type: 'text' },
        { id: 'company', name: 'Company', type: 'text' },
        { id: 'campaign', name: 'Campaign', type: 'text' },
        { id: 'tags', name: 'Tags', type: 'text' },
        { id: 'source', name: 'Source', type: 'select', options: LEAD_SOURCES },
        { id: 'stage', name: 'Stage', type: 'select', options: pipelineStages.map(s => s.id), displayOptions: pipelineStages.map(s => s.name) },
        { id: 'assignedToId', name: 'Owner', type: 'select', options: [0, ...users.map(u => u.id)], displayOptions: ['System', ...users.map(u => u.name)] },
        { id: 'score', name: 'Score', type: 'number' },
        { id: 'dealValue', name: 'Deal Value', type: 'number' },
        ...customFieldDefs.map(cf => ({ ...cf, name: `(Custom) ${cf.name}` })),
    ], [users, pipelineStages, customFieldDefs]);

    const addCondition = () => onConditionsChange([...conditions, { field: 'name', operator: 'contains', value: '', logic: 'AND' }]);
    const removeCondition = (index: number) => onConditionsChange(conditions.filter((_, i) => i !== index));
    const updateCondition = (index: number, newCond: FilterCondition) => onConditionsChange(conditions.map((c, i) => i === index ? newCond : c));

    const renderValueInput = (cond: FilterCondition, index: number) => {
        const fieldDef = filterableFields.find(f => f.id === cond.field);
        if (fieldDef?.type === 'select') {
            return (
                <select value={cond.value} onChange={e => updateCondition(index, { ...cond, value: e.target.value })} className="bg-surface border border-muted rounded-md p-2 w-full text-sm">
                    {(fieldDef.options || []).map((opt, i) => <option key={opt.toString()} value={opt.toString()}>{(fieldDef.displayOptions || fieldDef.options || [])[i]}</option>)}
                </select>
            )
        }
        return <input type={fieldDef?.type || 'text'} value={cond.value} onChange={e => updateCondition(index, { ...cond, value: e.target.value })} placeholder="Value" className="bg-surface border border-muted rounded-md p-2 w-full text-sm" />
    }

    return (
        <div className="bg-surface p-4 rounded-xl shadow-sm border border-muted space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h3 className="font-semibold text-lg">Filters</h3>
                {headerContent}
            </div>
             <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {conditions.map((cond, index) => (
                    <div key={index} className="space-y-2">
                         {index > 0 && (
                            <div className="pl-2">
                                <select value={cond.logic} onChange={e => updateCondition(index, { ...cond, logic: e.target.value as 'AND' | 'OR' })}
                                    className="bg-muted text-on-surface text-xs font-bold p-1 rounded-md">
                                    <option value="AND">AND</option>
                                    <option value="OR">OR</option>
                                </select>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-10 gap-2 items-center">
                            <select value={cond.field} onChange={e => updateCondition(index, { ...cond, field: e.target.value })} className="md:col-span-3 bg-background border border-muted rounded-md p-2 text-sm">
                                {filterableFields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                            <select value={cond.operator} onChange={e => updateCondition(index, { ...cond, operator: e.target.value as FilterOperator })} className="md:col-span-3 bg-background border border-muted rounded-md p-2 text-sm">
                                <option value="contains">Contains</option><option value="equals">Equals</option><option value="not_equals">Does not equal</option>
                                <option value="gt">Greater than</option><option value="lt">Less than</option>
                            </select>
                            <div className="md:col-span-3">{renderValueInput(cond, index)}</div>
                            <button onClick={() => removeCondition(index)} className="text-red-400 hover:text-red-500"><AppIcons.Delete className="w-5 h-5"/></button>
                        </div>
                    </div>
                ))}
            </div>
             <div className="flex justify-between items-center pt-3 border-t border-muted mt-3">
                <button type="button" onClick={addCondition} className="text-sm text-primary-500 font-semibold hover:text-primary-600">+ Add condition</button>
                {conditions.length > 0 && <button type="button" onClick={() => onConditionsChange([])} className="text-sm text-subtle font-semibold hover:text-on-surface">Clear all</button>}
            </div>
        </div>
    );
};

export default FilterBuilder;


