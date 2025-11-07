import React, { useState } from 'react';
import { MappingPreviewRow } from '../../../types/mapping';

interface PreviewDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    previewData: MappingPreviewRow[];
    errors: Array<{ row: number; field: string; message: string }>;
    skipInvalid: boolean;
    onSkipInvalidChange: (skip: boolean) => void;
}

export const PreviewDrawer: React.FC<PreviewDrawerProps> = ({
    isOpen,
    onClose,
    previewData,
    errors,
    skipInvalid,
    onSkipInvalidChange
}) => {
    if (!isOpen) return null;

    const allFields = previewData.length > 0 ? Object.keys(previewData[0]) : [];

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-surface border-l border-muted shadow-xl z-50 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-muted flex items-center justify-between">
                <h3 className="font-semibold text-on-surface">Preview & Validation</h3>
                <button
                    onClick={onClose}
                    className="text-subtle hover:text-on-surface p-1"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Settings */}
            <div className="p-4 border-b border-muted">
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={skipInvalid}
                        onChange={(e) => onSkipInvalidChange(e.target.checked)}
                        className="rounded"
                    />
                    Skip invalid rows during import
                </label>
                <p className="text-xs text-subtle mt-1">
                    {errors.length} validation errors found
                </p>
            </div>

            {/* Preview table */}
            <div className="flex-1 overflow-auto p-4">
                <div className="space-y-2">
                    {previewData.map((row, rowIndex) => (
                        <div key={rowIndex} className="border border-muted rounded-lg p-3">
                            <div className="text-xs text-subtle mb-2">
                                Row {rowIndex + 1}
                            </div>

                            <div className="space-y-1">
                                {allFields.map(fieldName => {
                                    const cellData = row[fieldName];
                                    const hasError = errors.some(e => e.row === rowIndex + 1 && e.field === fieldName);

                                    return (
                                        <div key={fieldName} className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-on-surface min-w-0 flex-1">
                                                {fieldName}:
                                            </span>
                                            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                                                <span className={`truncate ${hasError ? 'text-red-600 dark:text-red-400' : 'text-subtle'}`}>
                                                    {cellData?.value || '(empty)'}
                                                </span>
                                                {hasError && (
                                                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Row errors */}
                            {errors.filter(e => e.row === rowIndex + 1).length > 0 && (
                                <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                                    {errors.filter(e => e.row === rowIndex + 1).map((error, errorIndex) => (
                                        <div key={errorIndex} className="text-xs text-red-600 dark:text-red-400">
                                            • {error.message}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {previewData.length === 0 && (
                    <div className="text-center py-8 text-subtle">
                        <p>No preview data available.</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-muted">
                <div className="text-xs text-subtle">
                    Showing {previewData.length} of {previewData.length} preview rows
                </div>
            </div>
        </div>
    );
};


