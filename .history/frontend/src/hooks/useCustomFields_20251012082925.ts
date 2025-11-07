
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



