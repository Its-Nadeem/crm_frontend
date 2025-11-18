import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AppIcons } from '../ui/Icons';
import { ToastProvider } from '../../src/components/ui/Toast';

const SettingsLayout: React.FC = () => {
    const navItems = [
        { to: '/settings', name: 'General', icon: <AppIcons.Settings /> },
        { to: '/settings/users', name: 'Users & Permissions', icon: <AppIcons.Team /> },
        { to: '/settings/teams', name: 'Teams', icon: <AppIcons.Leads /> },
        { to: '/settings/integrations', name: 'Integrations', icon: <AppIcons.Integrations /> },
        { to: '/settings/automation', name: 'Automation', icon: <AppIcons.Automation /> },
    ];

    return (
        <ToastProvider>
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 h-full">
                <aside className="lg:w-64 xl:w-72 flex-shrink-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-on-surface mb-4 sm:mb-6 hidden sm:block">Settings</h1>
                    <nav className="flex space-x-1 sm:space-x-2 lg:space-x-0 lg:space-y-1 lg:flex-col overflow-x-auto -mx-2 sm:-mx-4 px-2 sm:px-4 pb-2 lg:pb-0 lg:mx-0 lg:px-0 lg:overflow-x-visible">
                        {navItems.map(item => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === '/settings'}
                                className={({ isActive }) =>
                                    `flex-shrink-0 flex items-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors duration-200 text-sm sm:text-base ${
                                    isActive ? 'bg-primary-600 text-white' : 'text-subtle hover:bg-muted hover:text-on-surface'
                                    }`
                                }
                            >
                                {React.cloneElement(item.icon, { className: 'h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0' })}
                                <span className="truncate">{item.name}</span>
                            </NavLink>
                        ))}
                    </nav>
                </aside>
                <div className="flex-1 overflow-y-auto min-h-0">
                    <Outlet />
                </div>
            </div>
        </ToastProvider>
    );
};

export default SettingsLayout;


