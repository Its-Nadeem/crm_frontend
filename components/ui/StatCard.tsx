
import React from 'react';

export const StatCard: React.FC<{ title: string; value: string; subtext?: string; icon: React.ReactNode }> = ({ title, value, subtext, icon }) => (
    <div className="bg-surface p-5 rounded-xl shadow-sm border border-muted">
        <div className="flex items-center">
            <div className="p-3 rounded-lg bg-muted">
                {icon}
            </div>
            <div className="ml-4">
                <p className="text-sm font-medium text-subtle">{title}</p>
                <p className="text-2xl font-bold text-on-surface">{value}</p>
            </div>
        </div>
        {subtext && <p className="text-xs text-subtle mt-2">{subtext}</p>}
    </div>
);



