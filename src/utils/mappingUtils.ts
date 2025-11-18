import { CsvColumn, CrmField, FieldMapping, DataType, ConfidenceLevel, MappingStatus } from '../types/mapping';

// Type inference utilities
export const inferDataType = (values: string[]): DataType => {
    if (values.length === 0) return 'text';

    const sample = values.find(v => v && v.trim());

    // Email detection
    if (sample && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sample)) {
        return values.every(v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) ? 'email' : 'text';
    }

    // Phone detection
    if (sample && /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/.test(sample)) {
        return values.every(v => !v || /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/.test(v)) ? 'phone' : 'text';
    }

    // Date detection (various formats)
    if (sample && (
        /^\d{4}-\d{2}-\d{2}$/.test(sample) ||
        /^\d{2}\/\d{2}\/\d{4}$/.test(sample) ||
        /^\d{2}-\d{2}-\d{4}$/.test(sample)
    )) {
        return values.every(v => !v || /^\d{4}-\d{2}-\d{2}$/.test(v) || /^\d{2}\/\d{2}\/\d{4}$/.test(v) || /^\d{2}-\d{2}-\d{4}$/.test(v)) ? 'date' : 'text';
    }

    // Number detection
    if (sample && !isNaN(Number(sample))) {
        return values.every(v => !v || !isNaN(Number(v))) ? 'number' : 'text';
    }

    // URL detection
    if (sample && /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(sample)) {
        return values.every(v => !v || /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(v)) ? 'url' : 'text';
    }

    return 'text';
};

// Smart suggestion engine
export const generateFieldSuggestions = (
    csvColumns: CsvColumn[],
    crmFields: CrmField[]
): Record<string, { crmFieldId: string; confidence: ConfidenceLevel; reason: string }> => {
    const suggestions: Record<string, { crmFieldId: string; confidence: ConfidenceLevel; reason: string }> = {};

    for (const column of csvColumns) {
        const columnName = column.name.toLowerCase();
        let bestMatch: { field: CrmField; confidence: ConfidenceLevel; reason: string } | null = null;

        for (const crmField of crmFields) {
            let confidence: ConfidenceLevel = 'low';
            let reason = '';

            // Exact match
            if (columnName === crmField.label.toLowerCase()) {
                confidence = 'high';
                reason = 'Exact name match';
            }
            // Partial match
            else if (crmField.label.toLowerCase().includes(columnName) || columnName.includes(crmField.label.toLowerCase())) {
                confidence = 'high';
                reason = 'Partial name match';
            }
            // Type-based match
            else if (crmField.accepts.includes(column.inferredType)) {
                confidence = 'medium';
                reason = `Type match: ${column.inferredType}`;
            }
            // Synonym match
            else {
                const synonyms: Record<string, string[]> = {
                    'email': ['email', 'e-mail', 'email_address', 'emailaddress'],
                    'name': ['name', 'full_name', 'fullname', 'customer_name'],
                    'phone': ['phone', 'phone_number', 'mobile', 'telephone', 'contact_number'],
                    'company': ['company', 'organization', 'org', 'company_name'],
                    'city': ['city', 'location', 'address_city', 'city_name'],
                    'job': ['job', 'job_title', 'position', 'role', 'profession'],
                    'campaign': ['campaign', 'campaign_name', 'marketing_campaign'],
                    'source': ['source', 'lead_source', 'origin', 'platform'],
                    'status': ['status', 'lead_status', 'state', 'condition']
                };

                for (const [crmKey, synonymList] of Object.entries(synonyms)) {
                    if (synonymList.some(syn => columnName.includes(syn)) &&
                        crmField.label.toLowerCase().includes(crmKey)) {
                        confidence = 'medium';
                        reason = `Synonym match: ${synonymList.find(syn => columnName.includes(syn))}`;
                        break;
                    }
                }
            }

            // Check if this is better than current best match
            if (confidence !== 'low' && (!bestMatch || getConfidenceScore(confidence) > getConfidenceScore(bestMatch.confidence))) {
                bestMatch = { field: crmField, confidence, reason };
            }
        }

        if (bestMatch) {
            suggestions[column.name] = {
                crmFieldId: bestMatch.field.id,
                confidence: bestMatch.confidence,
                reason: bestMatch.reason
            };
        }
    }

    return suggestions;
};

const getConfidenceScore = (confidence: ConfidenceLevel): number => {
    switch (confidence) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 0;
    }
};

// Validation utilities
export const validateMapping = (
    mappings: Record<string, FieldMapping>,
    csvColumns: CsvColumn[],
    crmFields: CrmField[]
): { isValid: boolean; errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    const requiredCrmFields = crmFields.filter(f => f.required);
    const mappedCrmFieldIds = new Set(Object.values(mappings)
        .filter(m => m.crmFieldId)
        .map(m => m.crmFieldId));

    for (const requiredField of requiredCrmFields) {
        if (!mappedCrmFieldIds.has(requiredField.id)) {
            errors.push(`Required field "${requiredField.label}" is not mapped`);
        }
    }

    // Check type compatibility
    for (const [csvName, mapping] of Object.entries(mappings)) {
        if (!mapping.crmFieldId) continue;

        const crmField = crmFields.find(f => f.id === mapping.crmFieldId);
        const csvColumn = csvColumns.find(c => c.name === csvName);

        if (crmField && csvColumn) {
            if (!crmField.accepts.includes(csvColumn.inferredType)) {
                warnings.push(`Field "${csvName}" type (${csvColumn.inferredType}) may not be compatible with "${crmField.label}"`);
            }
        }
    }

    // Check for duplicate mappings
    const crmFieldUsage = new Map<string, string[]>();
    for (const [csvName, mapping] of Object.entries(mappings)) {
        if (mapping.crmFieldId) {
            if (!crmFieldUsage.has(mapping.crmFieldId)) {
                crmFieldUsage.set(mapping.crmFieldId, []);
            }
            crmFieldUsage.get(mapping.crmFieldId)!.push(csvName);
        }
    }

    for (const [crmFieldId, csvColumns] of crmFieldUsage.entries()) {
        if (csvColumns.length > 1) {
            errors.push(`CRM field "${crmFields.find(f => f.id === crmFieldId)?.label}" is mapped to multiple CSV columns: ${csvColumns.join(', ')}`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};

// Transform utilities
export const applyTransforms = (value: string, transforms?: any): string => {
    if (!value || !transforms) return value;

    let result = value;

    // Trim
    if (transforms.trim) {
        result = result.trim();
    }

    // Case transformation
    if (transforms.toCase) {
        switch (transforms.toCase) {
            case 'upper': result = result.toUpperCase(); break;
            case 'lower': result = result.toLowerCase(); break;
            case 'title': result = result.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()); break;
        }
    }

    return result;
};

// Preview data transformation
export const generatePreviewData = (
    csvData: Record<string, string>[],
    mappings: Record<string, FieldMapping>,
    crmFields: CrmField[]
): Array<Record<string, { value: any; isValid: boolean; errors?: string[] }>> => {
    const previewRows = csvData.slice(0, 20).map((row, index) => {
        const previewRow: Record<string, { value: any; isValid: boolean; errors?: string[] }> = {};

        for (const [csvName, mapping] of Object.entries(mappings)) {
            if (!mapping.crmFieldId) continue;

            const originalValue = row[csvName];
            const transformedValue = applyTransforms(originalValue, mapping.transforms);

            // Basic validation
            const crmField = crmFields.find(f => f.id === mapping.crmFieldId);
            const errors: string[] = [];

            if (crmField?.required && (!transformedValue || transformedValue.trim() === '')) {
                errors.push('Required field is empty');
            }

            if (crmField?.unique && crmField.id === 'email' && transformedValue) {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(transformedValue)) {
                    errors.push('Invalid email format');
                }
            }

            previewRow[crmField.label] = {
                value: transformedValue,
                isValid: errors.length === 0,
                errors: errors.length > 0 ? errors : undefined
            };
        }

        return previewRow;
    });

    return previewRows;
};


