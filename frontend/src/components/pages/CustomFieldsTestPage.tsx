import React from 'react';
import { CustomFieldManager } from '../ui/CustomFieldManager';

export const CustomFieldsTestPage: React.FC = () => {
    const handleFieldsChange = (fields: any[]) => {
        console.log('Fields updated:', fields);
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-on-surface mb-2">Custom Fields Test</h1>
                    <p className="text-subtle">
                        Test the custom fields functionality. Add, edit, and delete custom fields to verify everything is working.
                    </p>
                </div>

                <div className="bg-surface rounded-lg border border-muted p-6">
                    <CustomFieldManager
                        organizationId="test"
                        onFieldsChange={handleFieldsChange}
                    />
                </div>

                <div className="mt-8 p-4 bg-muted rounded-lg">
                    <h3 className="font-medium text-on-surface mb-2">Instructions:</h3>
                    <ol className="text-sm text-subtle space-y-1 list-decimal list-inside">
                        <li>Click "Add Field" to open the modal</li>
                        <li>Fill in the field name and type</li>
                        <li>Set required and mappable options</li>
                        <li>Click "Create Field" to save</li>
                        <li>Click "Edit" on any field to modify it</li>
                        <li>Click "Delete" to remove a field (with confirmation)</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};


