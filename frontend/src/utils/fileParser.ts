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

// Excel parser using xlsx library
export const parseExcel = async (file: File): Promise<ParsedFileData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                // Import xlsx dynamically to avoid issues in environments where it's not available
                import('xlsx').then((XLSX) => {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Get the first worksheet
                    const sheetName = workbook.SheetNames[0];
                    if (!sheetName) {
                        throw new Error('Excel file contains no worksheets');
                    }

                    const worksheet = workbook.Sheets[sheetName];

                    // Convert to JSON with header row
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                        header: 1,
                        defval: '' // Default value for empty cells
                    });

                    if (jsonData.length === 0) {
                        throw new Error('Excel file is empty');
                    }

                    // First row is headers
                    const headers = jsonData[0] as string[];
                    const rows: Record<string, string>[] = [];

                    // Process remaining rows
                    for (let i = 1; i < jsonData.length; i++) {
                        const rowData = jsonData[i] as (string | number | null | undefined)[];
                        if (rowData.length === 0) continue; // Skip empty rows

                        const row: Record<string, string> = {};
                        headers.forEach((header, index) => {
                            const value = rowData[index];
                            // Convert to string and handle null/undefined values
                            row[header] = value != null ? String(value) : '';
                        });
                        rows.push(row);
                    }

                    resolve({
                        headers,
                        rows,
                        totalRows: rows.length
                    });
                }).catch((error) => {
                    reject(new Error(`Failed to load Excel parsing library: ${error.message}`));
                });
            } catch (error) {
                reject(new Error(`Failed to parse Excel file: ${error.message}`));
            }
        };

        reader.onerror = () => reject(new Error('Failed to read Excel file'));
        reader.readAsArrayBuffer(file);
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


