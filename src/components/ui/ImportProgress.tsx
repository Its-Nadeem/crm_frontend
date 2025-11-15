import React from 'react';
import { ImportResult, ImportError } from '../../utils/fileParser';

interface ImportProgressProps {
    isImporting: boolean;
    progress: number;
    currentStep: string;
    result?: ImportResult;
    onClose: () => void;
    onRetry?: () => void;
}

const ImportProgress: React.FC<ImportProgressProps> = ({
    isImporting,
    progress,
    currentStep,
    result,
    onClose,
    onRetry
}) => {
    if (isImporting) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-surface rounded-lg p-6 max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <h3 className="text-lg font-semibold text-on-surface mb-2">Importing Leads</h3>
                        <p className="text-sm text-subtle mb-4">{currentStep}</p>

                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-subtle mt-2">{Math.round(progress)}% complete</p>
                    </div>
                </div>
            </div>
        );
    }

    if (result) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-surface rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
                    <div className="text-center">
                        <div className={`h-12 w-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                            result.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                            {result.success ? '✓' : '✗'}
                        </div>

                        <h3 className="text-lg font-semibold text-on-surface mb-4">
                            {result.success ? 'Import Completed' : 'Import Failed'}
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                <p className="text-2xl font-bold text-green-600">{result.newLeads}</p>
                                <p className="text-sm text-green-700 dark:text-green-300">New Leads</p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <p className="text-2xl font-bold text-blue-600">{result.updatedLeads}</p>
                                <p className="text-sm text-blue-700 dark:text-blue-300">Updated</p>
                            </div>
                            {result.failedLeads > 0 && (
                                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                    <p className="text-2xl font-bold text-red-600">{result.failedLeads}</p>
                                    <p className="text-sm text-red-700 dark:text-red-300">Failed</p>
                                </div>
                            )}
                            <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg">
                                <p className="text-2xl font-bold text-gray-600">{result.newLeads + result.updatedLeads}</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">Total Success</p>
                            </div>
                        </div>

                        {result.errors.length > 0 && (
                            <div className="mb-6">
                                <h4 className="font-semibold text-on-surface mb-2">Errors:</h4>
                                <div className="max-h-32 overflow-y-auto bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-left">
                                    {result.errors.slice(0, 10).map((error, index) => (
                                        <div key={index} className="text-sm text-red-600 dark:text-red-400 mb-1">
                                            Row {error.row}: {error.message}
                                            {error.field && ` (${error.field})`}
                                        </div>
                                    ))}
                                    {result.errors.length > 10 && (
                                        <p className="text-sm text-red-500 mt-2">
                                            ... and {result.errors.length - 10} more errors
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 justify-center">
                            {onRetry && (
                                <button
                                    onClick={onRetry}
                                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg"
                                >
                                    Import Again
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default ImportProgress;


