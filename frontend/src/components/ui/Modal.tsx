import React, { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-2 sm:pt-4 sm:px-4 sm:pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={onClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-surface rounded-lg sm:rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle w-full max-w-lg sm:max-w-lg mx-2 border border-muted">
                    <div className="bg-surface px-3 sm:px-4 pt-3 sm:pt-5 pb-3 sm:pb-4">
                        {title && (
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <h3 className="text-base sm:text-lg leading-6 font-medium text-on-surface pr-4">{title}</h3>
                                <button
                                    onClick={onClose}
                                    className="flex-shrink-0 p-1 rounded-md text-subtle hover:text-on-surface hover:bg-muted transition-colors"
                                    aria-label="Close modal"
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}
                        <div className="max-h-[80vh] sm:max-h-[70vh] overflow-y-auto">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;


