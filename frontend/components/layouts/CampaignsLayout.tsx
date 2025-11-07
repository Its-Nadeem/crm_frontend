import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AppIcons } from '../ui/Icons';

const MarketingLayout: React.FC = () => {
    const navItems = [
        { to: '/marketing/email', name: 'Email', icon: <AppIcons.Email className="h-5 w-5" /> },
        { to: '/marketing/sms', name: 'SMS', icon: <AppIcons.SMS className="h-5 w-5" /> },
        { to: '/marketing/whatsapp', name: 'WhatsApp & Chatbot', icon: <AppIcons.Whatsapp className="h-5 w-5" /> },
        { to: '/marketing/call', name: 'Calls', icon: <AppIcons.Call className="h-5 w-5" /> },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-on-surface">Marketing</h1>
                    <p className="text-subtle mt-1">Engage with your audience through Email, SMS, and WhatsApp.</p>
                </div>
            </div>
            
            <div className="flex border-b border-muted">
                {navItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center gap-2 px-6 py-3 text-sm font-semibold ${isActive ? 'border-b-2 border-primary-500 text-on-surface' : 'text-subtle border-b-2 border-transparent hover:border-muted'}`
                        }
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </div>
            
            <div className="pt-2">
                <Outlet />
            </div>
        </div>
    );
};

export default MarketingLayout;


