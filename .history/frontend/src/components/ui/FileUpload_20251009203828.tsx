import React, { useCallback, useState } from 'react';
import { AppIcons } from './Icons';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    acceptedTypes?: string;
    maxSize?: number; // in MB
    loading?: boolean;
    error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
    onFileSelect,
    acceptedTypes = '.csv,.xlsx,.xls',
    maxSize = 10,
    loading = false,
    error
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            handleFile(file);
        }
    }, []);

    const handleFile = (file: File) => {
        // Validate file type
        const allowedTypes = acceptedTypes.split(',').map(type => type.trim());
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!allowedTypes.includes(fileExtension)) {
            alert(`Invalid file type. Please upload: ${acceptedTypes}`);
            return;
        }

        // Validate file size
        if (file.size > maxSize * 1024 * 1024) {
            alert(`File size too large. Maximum size: ${maxSize}MB`);
            return;
        }

        setSelectedFile(file);
        onFileSelect(file);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="w-full">
            <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-muted hover:border-primary-400'
                } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept={acceptedTypes}
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={loading}
                />

                <div className="space-y-4">
                    {loading ? (
                        <>
                            <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-sm text-subtle">Processing file...</p>
                        </>
                    ) : (
                        <>
                            <AppIcons.Upload className="h-12 w-12 mx-auto text-subtle" />
                            <div>
                                <p className="text-lg font-semibold text-on-surface">
                                    {selectedFile ? 'File Selected' : 'Upload your file'}
                                </p>
                                <p className="text-sm text-subtle mt-1">
                                    {selectedFile
                                        ? `${selectedFile.name} (${formatFileSize(selectedFile.size)})`
                                        : `Supported formats: CSV, XLS, XLSX. Maximum size: ${maxSize}MB`
                                    }
                                </p>
                                {!selectedFile && (
                                    <p className="text-sm text-subtle mt-2">
                                        Drag and drop your file here, or click to browse
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {selectedFile && !loading && (
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={() => {
                            setSelectedFile(null);
                            onFileSelect(null as any);
                        }}
                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                        Remove file
                    </button>
                </div>
            )}
        </div>
    );
};

export default FileUpload;


