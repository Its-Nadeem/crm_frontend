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
        <div className="flex flex-col md:flex-row gap-8 h-full">
            <aside className="md:w-64 flex-shrink-0">
                <h1 className="text-2xl font-bold text-on-surface mb-6 hidden md:block">Settings</h1>
                <nav className="flex space-x-2 md:space-x-0 md:space-y-1 md:flex-col overflow-x-auto -mx-4 px-4 pb-2 md:pb-0 md:mx-0 md:px-0 md:overflow-x-visible">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/settings'}
                            className={({ isActive }) =>
                                `flex-shrink-0 flex items-center px-4 py-2.5 rounded-lg transition-colors duration-200 ${
                                isActive ? 'bg-primary-600 text-white' : 'text-subtle hover:bg-muted hover:text-on-surface'
                                }`
                            }
                        >
                            {React.cloneElement(item.icon, { className: 'h-5 w-5 mr-3' })}
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>
            <div className="flex-1 overflow-y-auto">
                <Outlet />
            </div>
        </div>
    );
};

export default SettingsLayout;


