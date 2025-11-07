
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



