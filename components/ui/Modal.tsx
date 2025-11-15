
import React, { useEffect } from 'react';
import { AppIcons } from './Icons';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-surface rounded-xl shadow-2xl w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl max-h-[90vh] flex flex-col ring-1 ring-inset ring-muted/50"
                onClick={e => e.stopPropagation()}
            >
                {title && (
                    <div className="flex justify-between items-center p-4 border-b border-muted flex-shrink-0">
                        <h2 className="text-xl font-bold text-on-surface">{title}</h2>
                        <button onClick={onClose} className="text-subtle hover:text-on-surface p-1 rounded-full hover:bg-muted">
                            <AppIcons.Close className="h-5 w-5" />
                        </button>
                    </div>
                )}
                <div className="p-6 overflow-y-auto flex-grow">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;


