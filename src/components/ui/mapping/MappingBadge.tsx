import React from 'react';
import { MappingStatus, ConfidenceLevel } from '../../../types/mapping';

interface StatusBadgeProps {
    status: MappingStatus;
    className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
    const configs = {
        unmapped: {
            label: 'Unmapped',
            className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        },
        suggested: {
            label: 'Suggested',
            className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
        },
        mapped: {
            label: 'Mapped',
            className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
        },
        conflict: {
            label: 'Conflict',
            className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
        },
        invalid: {
            label: 'Invalid',
            className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
        }
    };

    const config = configs[status];

    return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.className} ${className}`}>
            {config.label}
        </span>
    );
};

interface ConfidenceBadgeProps {
    confidence: ConfidenceLevel;
    className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, className = '' }) => {
    const configs = {
        high: {
            label: 'High',
            className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
        },
        medium: {
            label: 'Medium',
            className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
        },
        low: {
            label: 'Low',
            className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        }
    };

    const config = configs[confidence];

    return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.className} ${className}`}>
            {config.label}
        </span>
    );
};

interface RequiredBadgeProps {
    required?: boolean;
    className?: string;
}

export const RequiredBadge: React.FC<RequiredBadgeProps> = ({ required, className = '' }) => {
    if (!required) return null;

    return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 ${className}`}>
            Required
        </span>
    );
};

interface TypeIconProps {
    type: string;
    className?: string;
}

export const TypeIcon: React.FC<TypeIconProps> = ({ type, className = 'w-4 h-4' }) => {
    const icons = {
        email: (
            <svg className={`${className} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        phone: (
            <svg className={`${className} text-green-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
        ),
        date: (
            <svg className={`${className} text-purple-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        number: (
            <svg className={`${className} text-orange-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
        ),
        text: (
            <svg className={`${className} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        ),
        url: (
            <svg className={`${className} text-indigo-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
        )
    };

    return icons[type as keyof typeof icons] || icons.text;
};


