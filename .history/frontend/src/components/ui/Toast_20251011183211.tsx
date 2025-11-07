import React, { useState, useEffect, createContext, useContext } from 'react';
import { AppIcons } from './Icons';

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (toast: Omit<Toast, 'id'>) => {
        const id = crypto.randomUUID();
        const newToast: Toast = {
            id,
            duration: 5000, // Default 5 seconds
            ...toast,
        };

        setToasts(prev => [...prev, newToast]);

        // Auto remove after duration
        if (newToast.duration && newToast.duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, newToast.duration);
        }
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
};

const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation after mount
        setTimeout(() => setIsVisible(true), 10);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
    };

    const getIcon = () => {
        const iconProps = { className: "h-5 w-5" };

        switch (toast.type) {
            case 'success':
                return <AppIcons.Success {...iconProps} />;
            case 'error':
                return <AppIcons.Close {...iconProps} />;
            case 'warning':
                return <AppIcons.Warning {...iconProps} />;
            case 'info':
                return <AppIcons.Info {...iconProps} />;
            default:
                return <AppIcons.Info {...iconProps} />;
        }
    };

    const getStyles = () => {
        const baseStyles = "flex items-start gap-3 p-4 rounded-lg shadow-lg border transition-all duration-300";

        if (isVisible) {
            switch (toast.type) {
                case 'success':
                    return `${baseStyles} bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300`;
                case 'error':
                    return `${baseStyles} bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300`;
                case 'warning':
                    return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-300`;
                case 'info':
                    return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300`;
                default:
                    return `${baseStyles} bg-surface border-muted text-on-surface`;
            }
        } else {
            return `${baseStyles} opacity-0 transform translate-x-full`;
        }
    };

    return (
        <div className={getStyles()}>
            <div className="flex-shrink-0 mt-0.5">
                {getIcon()}
            </div>

            <div className="flex-grow min-w-0">
                <div className="font-semibold text-sm">
                    {toast.title}
                </div>
                {toast.message && (
                    <div className="text-sm mt-1 opacity-90">
                        {toast.message}
                    </div>
                )}
            </div>

            <button
                onClick={handleClose}
                className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                aria-label="Close notification"
            >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

// Convenience functions for common toast types
export const toast = {
    success: (title: string, message?: string) => {
        const context = useContext(ToastContext);
        if (context) {
            context.addToast({ type: 'success', title, message });
        }
    },
    error: (title: string, message?: string) => {
        const context = useContext(ToastContext);
        if (context) {
            context.addToast({ type: 'error', title, message });
        }
    },
    warning: (title: string, message?: string) => {
        const context = useContext(ToastContext);
        if (context) {
            context.addToast({ type: 'warning', title, message });
        }
    },
    info: (title: string, message?: string) => {
        const context = useContext(ToastContext);
        if (context) {
            context.addToast({ type: 'info', title, message });
        }
    },
};


