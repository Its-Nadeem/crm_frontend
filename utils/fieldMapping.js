// Utility functions for mapping external data to CRM fields

/**
 * Process field mappings from integration settings
 * @param {Object} externalData - Data from external source (Facebook, Google, etc.)
 * @param {Array} fieldMappings - Field mapping configuration
 * @returns {Object} Mapped data object
 */
export const processFieldMappings = (externalData, fieldMappings) => {
    const mappedData = {
        name: '',
        email: '',
        phone: '',
        customFields: {}
    };

    // Process each field mapping
    fieldMappings.forEach(mapping => {
        const { sourceField, crmField } = mapping;

        // Extract value from external data using dot notation (e.g., 'name', 'address.city')
        const externalValue = getNestedValue(externalData, sourceField);

        if (externalValue) {
            // Map to standard CRM fields
            if (crmField === 'name') {
                mappedData.name = externalValue;
            } else if (crmField === 'email') {
                mappedData.email = externalValue;
            } else if (crmField === 'phone') {
                mappedData.phone = externalValue;
            } else if (crmField.startsWith('customFields.')) {
                // Handle custom fields (e.g., 'customFields.interest_level')
                const customFieldKey = crmField.replace('customFields.', '');
                mappedData.customFields[customFieldKey] = externalValue;
            } else {
                // Handle other standard fields
                mappedData[crmField] = externalValue;
            }
        }
    });

    return mappedData;
};

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Object to extract value from
 * @param {string} path - Dot notation path (e.g., 'address.city')
 * @returns {any} Extracted value or undefined
 */
const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
};

/**
 * Validate field mapping configuration
 * @param {Array} fieldMappings - Field mapping configuration
 * @returns {Object} Validation result with isValid and errors
 */
export const validateFieldMappings = (fieldMappings) => {
    const errors = [];

    if (!Array.isArray(fieldMappings)) {
        errors.push('Field mappings must be an array');
        return { isValid: false, errors };
    }

    fieldMappings.forEach((mapping, index) => {
        if (!mapping.sourceField) {
            errors.push(`Mapping ${index + 1}: sourceField is required`);
        }
        if (!mapping.crmField) {
            errors.push(`Mapping ${index + 1}: crmField is required`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
};


