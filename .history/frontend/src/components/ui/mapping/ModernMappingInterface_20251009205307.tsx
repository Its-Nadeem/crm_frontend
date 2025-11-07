
import React, { useState, useMemo, useEffect } from 'react';
import { CsvColumn, CrmField, FieldMapping, MappingStatus, ImportTemplate } from '../../../types/mapping';
import { generateFieldSuggestions, validateMapping, generatePreviewData } from '../../../utils/mappingUtils';
import { CsvColumnCard } from './CsvColumnCard';
import { CrmFieldList } from './CrmFieldList';
import { PreviewDrawer } from './PreviewDrawer';

interface ModernMappingInterfaceProps {
    csvColumns: CsvColumn[];
    crmFields: CrmField[];
    initialMappings?: Record<string, FieldMapping>;
    onMappingsChange: (mappings: Record<string, FieldMapping>) => void;
    onValidationChange: (validation: { isValid: boolean; errors: string[]; warnings: string[] }) => void;
    previewData?: any[][];
    templates?: ImportTemplate[];
    onTemplateSave?: (name: string, description?: string) => void;
    onTemplateLoad?: (templateId: string) => void;
}

export const ModernMappingInterface: React.FC<ModernMappingInterfaceProps> = ({
    csvColumns,
    crmFields,
    initialMappings = {},
    onMappingsChange,
    onValidationChange,
    previewData = [],
    templates = [],
    onTemplateSave,
    onTemplateLoad
}) => {
    const [mappings, setMappings] = useState<Record<string, FieldMapping>>(initialMappings);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'required' | 'unmapped' | 'mapped'>('all');
    const [selectedCsvColumn, setSelectedCsvColumn] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [skipInvalid, setSkipInvalid] = useState(true);
    const [showTemplates, setShowTemplates] = useState(false);

    // Generate suggestions when columns or fields change
    useEffect(() => {
        const suggestions = generateFieldSuggestions(csvColumns, crmFields);

        const newMappings: Record<string, FieldMapping> = {};
        csvColumns.forEach(column => {
            const existingMapping = mappings[column.name];
            const suggestion = suggestions[column.name];

            newMappings[column.name] = {
                csvColumnName: column.name,
                crmFieldId: existingMapping?.crmFieldId || null,
                transforms: existingMapping?.transforms || {},
                suggestion: suggestion ? {
                    crmFieldId: suggestion.crmFieldId,
                    confidence: suggestion.confidence,
                    reason: suggestion.reason
                } : undefined,
                status: existingMapping?.crmFieldId ? 'mapped' : (suggestion ? 'suggested' : 'unmapped'),
                validationErrors: existingMapping?.validationErrors || []
            };
        });

        setMappings(newMappings);
        onMappingsChange(newMappings);
    }, [csvColumns, crmFields]);

    // Update validation when mappings change
    useEffect(() => {
        const validation = validateMapping(mappings, csvColumns, crmFields);
        onValidationChange(validation);
    }, [mappings, csvColumns, crmFields, onValidationChange]);

    const handleMappingChange = (csvColumnName: string, crmFieldId: string | null) => {
        const newMappings = { ...mappings };

        // If mapping to a field that's already used, mark as conflict
        if (crmFieldId) {
            const existingMapping = Object.values(newMappings).find(m => m.crmFieldId === crmFieldId);
            if (existingMapping && existingMapping.csvColumnName !== csvColumnName) {
                newMappings[existingMapping.csvColumnName] = {
                    ...existingMapping,
                    status: 'conflict',
                    validationErrors: ['This CRM field is already mapped to another column']
                };
            }
        }

        // Update the current mapping
        newMappings[csvColumnName] = {
            ...newMappings[csvColumnName],
            crmFieldId,
            status: crmFieldId ? 'mapped' : 'unmapped',
            validationErrors: []
        };

        setMappings(newMappings);
        onMappingsChange(newMappings);
    };

    const handleTransformChange = (csvColumnName: string, transforms: any) => {
        const newMappings = { ...mappings };
        newMappings[csvColumnName] = {
            ...newMappings[csvColumnName],
            transforms: { ...newMappings[csvColumnName].transforms, ...transforms }
        };
        setMappings(newMappings);
        onMappingsChange(newMappings);
    };

    const handleBulkAutoMap = () => {
        const newMappings = { ...mappings };




