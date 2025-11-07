import React, { useState, useEffect } from 'react';
import { AppIcons } from './Icons';

interface AddRuleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (rule: any) => void;
    rule?: any; // For editing existing rule
    customFieldDefs: any[];
    isLoading?: boolean;
}

const AddRuleModal: React.FC<AddRuleModalProps> = ({
    isOpen,
    onClose,
    onSave,
    rule,
    customFieldDefs,
    isLoading = false
}) => {
    const [formData, setFormData] = useState({
        field: 'source',
        operator: 'equals',
        value: '',
        points: 10
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (rule) {
            setFormData({
                field: rule.field || 'source',
                operator: rule.operator || 'equals',
                value: rule.value || '',
                points: rule.points || 10
            });
        } else {
            setFormData({
                field: 'source',
                operator: 'equals',
                value: '',
                points: 10
            });
        }
        setErrors({});
    }, [rule, isOpen]);

    const availableFields = [
        { id: 'source', name: 'Source' },
        { id: 'course', name: 'Course' },
        { id: 'city', name: 'City' },
        { id: 'company', name: 'Company' },
        { id: 'email', name: 'Email' },
        { id: 'phone', name: 'Phone' },
        ...customFieldDefs.map(cf => ({ id: `customFields.${cf.id}`, name: `(Custom) ${cf.name}` }))
    ];

    const operators = [
        { value: 'equals', label: 'equals' },
        { value: 'contains', label: 'contains' },
        { value: 'not_equals', label: 'not equals' },
        { value: 'is_set', label: 'is set' },
        { value: 'is_not_set', label: 'is not set' },
        { value: 'greater_than', label: 'greater than' },
        { value: 'less_than', label: 'less than' },
        { value: 'between', label: 'between' }
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const newErrors: Record<string, string> = {};

        if (!formData.field) {
            newErrors.field = 'Field is required';
        }

        if (!formData.operator) {
            newErrors.operator = 'Operator is required';
        }

        if (!['is_set', 'is_not_set'].includes(formData.operator) && !formData.value.trim()) {
            newErrors.value = 'Value is required for this operator';
        }

        if (formData.points === undefined || formData.points === null) {
            newErrors.points = 'Points are required';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            onSave({
                ...formData,
                id: rule?.id || `new_${Date.now()}`,
                organizationId: rule?.organizationId || ''
            });
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-muted">
                    <h3 className="text-xl font-bold text-on-surface">
                        {rule ? 'Edit Scoring Rule' : 'Add Scoring Rule'}
                    </h3>
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="text-subtle hover:text-on-surface disabled:opacity-50"
                    >
                        <AppIcons.X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Field Selection */}
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-2">
                            Field
                        </label>
                        <select
                            value={formData.field}
                            onChange={(e) => setFormData(prev => ({ ...prev, field: e.target.value }))}
                            className="w-full bg-background border border-muted rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            disabled={isLoading}
                        >
                            {availableFields.map(field => (
                                <option key={field.id} value={field.id}>
                                    {field.name}
                                </option>
                            ))}
                        </select>
                        {errors.field && <p className="text-red-500 text-sm mt-1">{errors.field}</p>}
                    </div>

                    {/* Operator Selection */}
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-2">
                            Condition
                        </label>
                        <select
                            value={formData.operator}
                            onChange={(e) => setFormData(prev => ({ ...prev, operator: e.target.value }))}
                            className="w-full bg-background border border-muted rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            disabled={isLoading}
                        >
                            {operators.map(op => (
                                <option key={op.value} value={op.value}>
                                    {op.label}
                                </option>
                            ))}
                        </select>
                        {errors.operator && <p className="text-red-500 text-sm mt-1">{errors.operator}</p>}
                    </div>

                    {/* Value Input - only show for operators that need it */}
                    {!['is_set', 'is_not_set'].includes(formData.operator) && (
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-2">
                                Value
                            </label>
                            <input
                                type="text"
                                value={formData.value}
                                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                                className="w-full bg-background border border-muted rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Enter value to match"
                                disabled={isLoading}
                            />
                            {errors.value && <p className="text-red-500 text-sm mt-1">{errors.value}</p>}
                        </div>
                    )}

                    {/* Points Input */}
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-2">
                            Points
                        </label>
                        <div className="flex items-center space-x-3">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, points: prev.points - 1 }))}
                                className="w-10 h-10 bg-muted hover:bg-subtle/20 rounded-lg flex items-center justify-center text-xl font-bold text-on-surface disabled:opacity-50"
                                disabled={isLoading}
                            >
                                −
                            </button>
                            <div className="flex-1 text-center">
                                <span className={`text-lg font-bold ${formData.points >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {formData.points >= 0 ? `+${formData.points}` : formData.points}
                                </span>
                                <span className="text-sm text-subtle ml-1">points</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, points: prev.points + 1 }))}
                                className="w-10 h-10 bg-muted hover:bg-subtle/20 rounded-lg flex items-center justify-center text-xl font-bold text-on-surface disabled:opacity-50"
                                disabled={isLoading}
                            >
                                +
                            </button>
                        </div>
                        {errors.points && <p className="text-red-500 text-sm mt-1">{errors.points}</p>}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-muted hover:bg-subtle/20 text-on-surface rounded-lg font-medium disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Saving...
                                </>
                            ) : (
                                rule ? 'Update Rule' : 'Add Rule'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddRuleModal;


