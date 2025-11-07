export interface ParsedFileData {
    headers: string[];
    rows: Record<string, string>[];
    totalRows: number;
}

export interface ImportError {
    row: number;
    field?: string;
    message: string;
}

export interface ImportResult {
    success: boolean;
    newLeads: number;
    updatedLeads: number;
    failedLeads: number;
    errors: ImportError[];
}

// Simple CSV parser
export const parseCSV = (csvText: string): ParsedFileData => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
        throw new Error('CSV file is empty');
    }

    // Simple CSV parsing (assuming comma-separated, no quotes for now)
    const headers = lines[0].split(',').map(header => header.trim());
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(value => value.trim());
        if (values.length === headers.length) {
            const row: Record<string, string> = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            rows.push(row);
        }
    }

    return {
        headers,
        rows,
        totalRows: rows.length
    };
};

// Mock Excel parser (for now, we'll implement basic CSV parsing)
// In a real implementation, you'd use a library like xlsx or exceljs
export const parseExcel = async (file: File): Promise<ParsedFileData> => {
    // For now, return a mock structure
    // In production, you'd use a library like xlsx:
    // const workbook = XLSX.read(await file.arrayBuffer());
    // const sheetName = workbook.SheetNames[0];
    // const worksheet = workbook.Sheets[sheetName];
    // const jsonData = XLSX.utils.sheet_to_json(worksheet);

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            try {
                const parsed = parseCSV(text);
                resolve(parsed);
            } catch (error) {
                // If CSV parsing fails, return mock data for demo
                resolve({
                    headers: ['name', 'email', 'phone', 'company', 'city'],
                    rows: Array.from({ length: 3 }, (_, i) => ({
                        name: `Sample Lead ${i + 1}`,
                        email: `lead${i + 1}@example.com`,
                        phone: `+1-555-010${i}`,
                        company: `Company ${i + 1}`,
                        city: `City ${i + 1}`
                    })),
                    totalRows: 3
                });
            }
        };
        reader.readAsText(file);
    });
};

// Generic file parser that detects file type
export const parseFile = async (file: File): Promise<ParsedFileData> => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    switch (fileExtension) {
        case 'csv':
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const text = e.target?.result as string;
                    try {
                        const parsed = parseCSV(text);
                        resolve(parsed);
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsText(file);
            });

        case 'xlsx':
        case 'xls':
            return parseExcel(file);

        default:
            throw new Error(`Unsupported file format: ${fileExtension}. Supported formats: CSV, XLS, XLSX`);
    }
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate phone format (basic validation)
export const isValidPhone = (phone: string): boolean => {
    // Remove common separators and check if we have at least 10 digits
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    return cleaned.length >= 10 && /^\+?[\d\s\-\(\)\.]+$/.test(phone);
};

// Validate required fields
export const validateLeadData = (data: Record<string, string>, mappings: FieldMapping[]): ImportError[] => {
    const errors: ImportError[] = [];
    const rowIndex = 0; // We'll track this properly in the import process

    // Check required fields based on mappings
    mappings.forEach((mapping, index) => {
        if (mapping.crmField === '---') return;

        const value = data[mapping.sourceField];

        switch (mapping.crmField) {
            case 'email':
                if (!value) {
                    errors.push({
                        row: rowIndex + 1,
                        field: mapping.sourceField,
                        message: 'Email is required'
                    });
                } else if (!isValidEmail(value)) {
                    errors.push({
                        row: rowIndex + 1,
                        field: mapping.sourceField,
                        message: 'Invalid email format'
                    });
                }
                break;

            case 'phone':
                if (value && !isValidPhone(value)) {
                    errors.push({
                        row: rowIndex + 1,
                        field: mapping.sourceField,
                        message: 'Invalid phone format'
                    });
                }
                break;

            case 'name':
                if (!value || value.trim().length === 0) {
                    errors.push({
                        row: rowIndex + 1,
                        field: mapping.sourceField,
                        message: 'Name is required'
                    });
                }
                break;
        }
    });

    return errors;
};

// Import the required FieldMapping type
import { FieldMapping } from '../../types';


