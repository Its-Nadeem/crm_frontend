// Enhanced mapping types for the modern field mapping interface

export type DataType = 'email' | 'phone' | 'date' | 'number' | 'text' | 'url';

export type MappingStatus = 'unmapped' | 'suggested' | 'mapped' | 'conflict' | 'invalid';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface CsvColumn {
    name: string;
    sampleValues: string[];
    inferredType: DataType;
    rowCount?: number;
}

export interface CrmField {
    id: string;
    label: string;
    required: boolean;
    accepts: DataType[];
    unique?: boolean;
    category: string;
    description?: string;
}

export interface FieldMapping {
    csvColumnName: string;
    crmFieldId: string | null;
    transforms?: FieldTransforms;
    suggestion?: {
        crmFieldId: string;
        confidence: ConfidenceLevel;
        reason: string;
    };
    status: MappingStatus;
    validationErrors?: string[];
}

export interface FieldTransforms {
    trim?: boolean;
    toCase?: 'upper' | 'lower' | 'title';
    splitFullName?: {
        intoFirstLast: boolean;
        firstNameField?: string;
        lastNameField?: string;
    };
    join?: {
        with: string;
        columns: string[];
    };
    dateFormat?: string;
    customFormat?: string;
}

export interface ImportTemplate {
    id: string;
    name: string;
    description?: string;
    mapping: Record<string, FieldMapping>;
    createdAt: string;
    updatedAt: string;
    useCount: number;
}

export interface MappingPreviewRow {
    [key: string]: {
        value: any;
        isValid: boolean;
        errors?: string[];
        transformedValue?: any;
    };
}

export interface MappingValidation {
    isValid: boolean;
    errors: Array<{
        type: 'missing_required' | 'type_mismatch' | 'duplicate_mapping' | 'invalid_format';
        message: string;
        csvColumn?: string;
        crmField?: string;
    }>;
    warnings: Array<{
        type: 'weak_confidence' | 'data_quality' | 'missing_optional';
        message: string;
        suggestion?: string;
    }>;
}

export interface MappingState {
    mappings: Record<string, FieldMapping>;
    templates: ImportTemplate[];
    preview: {
        rows: MappingPreviewRow[];
        errors: Array<{ row: number; field: string; message: string }>;
    };
    validation: MappingValidation;
    selectedTemplate?: string;
}


