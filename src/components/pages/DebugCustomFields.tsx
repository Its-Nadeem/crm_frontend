import React, { useState } from 'react';
import { useCustomFields } from '../../hooks/useCustomFields';

export const DebugCustomFields: React.FC = () => {
    const { fields, loading, error, createField, updateField, deleteField } = useCustomFields('test');
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'date' | 'dropdown'>('text');

    const handleCreateField = async () => {
        if (!newFieldName.trim()) return;

        try {
            await createField({
                name: newFieldName,
                type: newFieldType,
                isMappable: true,
                isRequired: false,
                organizationId: 'test'
            });
            setNewFieldName('');
            console.log('Field created successfully');
        } catch (error) {
            console.error('Error creating field:', error);
        }
    };

    const handleDeleteField = async (fieldId: string) => {
        try {
            await deleteField(fieldId);
            console.log('Field deleted successfully');
        } catch (error) {
            console.error('Error deleting field:', error);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Custom Fields Debug</h1>

            <div style={{ marginBottom: '20px' }}>
                <h2>Create New Field</h2>
                <input
                    type="text"
                    placeholder="Field name"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    style={{ marginRight: '10px', padding: '5px' }}
                />
                <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as any)}
                    style={{ marginRight: '10px', padding: '5px' }}
                >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="dropdown">Dropdown</option>
                </select>
                <button onClick={handleCreateField} style={{ padding: '5px 10px' }}>
                    Create Field
                </button>
            </div>

            <div>
                <h2>Existing Fields ({fields.length})</h2>
                {fields.length === 0 ? (
                    <p>No fields found</p>
                ) : (
                    <ul>
                        {fields.map((field) => (
                            <li key={field.id} style={{ marginBottom: '10px' }}>
                                <strong>{field.name}</strong> ({field.type})
                                - Mappable: {field.isMappable ? 'Yes' : 'No'}
                                - Required: {field.isRequired ? 'Yes' : 'No'}
                                <button
                                    onClick={() => handleDeleteField(field._id!)}
                                    style={{ marginLeft: '10px', padding: '3px 8px', backgroundColor: '#ff4444', color: 'white', border: 'none' }}
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
                <h3>Debug Info</h3>
                <p>Fields count: {fields.length}</p>
                <p>Loading: {loading ? 'Yes' : 'No'}</p>
                <p>Error: {error || 'None'}</p>
            </div>
        </div>
    );
};


