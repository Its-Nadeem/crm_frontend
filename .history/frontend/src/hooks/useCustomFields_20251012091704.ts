import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

export interface CustomField {
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'dropdown';
    options?: string[];
    isMappable: boolean;
    isRequired: boolean;
    organizationId: string;
    _id?: string;
}

export interface UseCustomFieldsReturn {
    fields: CustomField[];
    loading: boolean;
    error: string | null;
    createField: (fieldData: Omit<CustomField, 'id' | '_id'>) => Promise<void>;
    updateField: (fieldId: string, fieldData: Partial<CustomField>) => Promise<void>;
    deleteField: (fieldId: string) => Promise<void>;
    toggleMappable: (fieldId: string) => Promise<void>;
    refreshFields: () => Promise<void>;
    mappableFields: CustomField[];
}

export const useCustomFields = (organizationId: string): UseCustomFieldsReturn => {
    const [fields, setFields] = useState<CustomField[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFields = useCallback(async () => {
        if (!organizationId) {
            setFields([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await apiService.getCustomFields(organizationId);
            setFields(data || []);
        } catch (err) {
            console.error('Error fetching custom fields:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch custom fields');
            setFields([]);
        } finally {
            setLoading(false);
        }
    }, [organizationId]);

    useEffect(() => {
        fetchFields();
    }, [fetchFields]);

    const createField = async (fieldData: Omit<CustomField, 'id' | '_id'>) => {
        try {
            setError(null);
            const fieldWithId = {
                ...fieldData,
                id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            const newField = await apiService.createCustomField(fieldWithId);
            setFields(prev => [...prev, newField]);
        } catch (err) {
            console.error('Error creating custom field:', err);
            setError(err instanceof Error ? err.message : 'Failed to create custom field');
            throw err;
        }
    };

    const updateField = async (fieldId: string, fieldData: Partial<CustomField>) => {
        try {
            setError(null);
            const updatedField = await apiService.updateCustomField(fieldId, fieldData);
            setFields(prev => prev.map(field =>
                field._id === fieldId ? { ...field, ...updatedField } : field
            ));
        } catch (err) {
            console.error('Error updating custom field:', err);
            setError(err instanceof Error ? err.message : 'Failed to update custom field');
            throw err;
        }
    };

    const deleteField = async (fieldId: string) => {
        try {
            setError(null);
            await apiService.deleteCustomField(fieldId);
            setFields(prev => prev.filter(field => field._id !== fieldId));
        } catch (err) {
            console.error('Error deleting custom field:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete custom field');
            throw err;
        }
    };

    const toggleMappable = async (fieldId: string) => {
        try {
            const field = fields.find(f => f._id === fieldId);
            if (!field) return;

            await updateField(fieldId, { isMappable: !field.isMappable });
        } catch (err) {
            console.error('Error toggling mappable status:', err);
            throw err;
        }
    };

    const refreshFields = async () => {
        await fetchFields();
    };

    const mappableFields = fields.filter(field => field.isMappable);

    return {
        fields,
        loading,
        error,
        createField,
        updateField,
        deleteField,
        toggleMappable,
        refreshFields,
        mappableFields
    };
};


