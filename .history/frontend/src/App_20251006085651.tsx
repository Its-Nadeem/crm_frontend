

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate, Outlet } from 'react-router-dom';
import { User, Lead, Task, UserRole, IntegrationLog, Activity, Stage, AutomationRule, CustomFieldDefinition, FollowUpStatus, Permission, Team, IntegrationSettings, IntegrationSource, WhatsAppTemplate, SavedFilter, ChatbotConfig, UserSessionLog, LeadSource, Organization, WebhookConfig, ScheduledMessage, EmailTemplate, EmailCampaign, ConnectedFacebookAccount, SMSTemplate, SMSCampaign, LeadScoreRule, SubscriptionPlan, SupportTicket, AuditLog, GlobalAnnouncement, Addon, SystemHealthMetric, ApiUsageLog, ErrorLog, GlobalAutomationRule, GlobalIntegrationStatus, LocalizationSettings, HomepageContent, BillingHistory, CustomDomain, WhatsAppCampaign, CallScript, CallCampaign, CustomDashboardWidget, BlogPost, PaymentGatewaySetting, Inquiry, GlobalEmailTemplate, Coupon, OfferStrip, PricingCategory } from './types';
import { USERS, LEADS, TASKS, INTEGRATION_LOGS, AUTOMATION_RULES, CUSTOM_FIELD_DEFS, TEAMS, WHATSAPP_TEMPLATES, CHATBOT_CONFIG, USER_SESSION_LOGS, ORGANIZATIONS, STAGES, INTEGRATION_SETTINGS, WEBHOOKS as initialWebhooks, EMAIL_CAMPAIGNS, EMAIL_TEMPLATES, SMS_TEMPLATES, SMS_CAMPAIGNS, LEAD_SCORE_RULES, SUBSCRIPTION_PLANS, SUPPORT_TICKETS, AUDIT_LOGS, GLOBAL_ANNOUNCEMENT, ADDONS, SYSTEM_HEALTH_DATA, API_USAGE_LOGS, ERROR_LOGS, GLOBAL_AUTOMATION_RULES, GLOBAL_INTEGRATION_STATUS, LOCALIZATION_SETTINGS, HOMEPAGE_CONTENT, BILLING_HISTORY, CUSTOM_DOMAINS, WHATSAPP_CAMPAIGNS, CALL_SCRIPTS, CALL_CAMPAIGNS, BLOG_POSTS, PAYMENT_GATEWAY_SETTINGS, INQUIRIES, GLOBAL_EMAIL_TEMPLATES, COUPONS, OFFER_STRIP, PRICING_COMPARISON_DATA } from './data';
import Dashboard from './components/pages/Dashboard';
import LeadListPage from './components/pages/LeadListPage';
import UserManagementPage from './components/pages/UserManagementPage';
import IntegrationsPage from './components/pages/IntegrationsPage';
import TasksPage from './components/pages/TasksPage';
import SettingsPage from './components/pages/SettingsPage';
import AutomationPage from './components/pages/AutomationPage';
import TeamsPage from './components/pages/TeamsPage';
import WhatsAppPage from './components/pages/WhatsAppPage';
import LoginPage from './components/pages/LoginPage';
import TrackingDashboard from './components/pages/TrackingDashboard';
import SuperAdminDashboard from './components/pages/SuperAdminDashboard';
import EmailPage from './components/pages/EmailPage';
import SMSPage from './components/pages/SMSPage';
import ReportsPage from './components/pages/ReportsPage';
import CallPage from './components/pages/CallPage';
import { AppIcons } from './components/ui/Icons';
import { faker } from '@faker-js/faker';
import HomePage from './components/pages/HomePage';
import LeadDetailPage from './components/pages/LeadDetailPage';
import SettingsLayout from './components/layouts/SettingsLayout';
import MarketingLayout from './components/layouts/CampaignsLayout';
import CustomDomainsPage from './components/pages/CustomDomainsPage';
import PublicLayout from './components/layouts/PublicLayout';
import BlogListPage from './components/pages/BlogListPage';
import BlogPostPage from './components/pages/BlogPostPage';
import PricingPage from './components/pages/PricingPage';


const Sidebar: React.FC<{
    currentUser: User; 
    currentOrganization: Organization | null;
    hasPermission: (p: Permission) => boolean;
    hasFeature: (f: SubscriptionPlan['features'][0]) => boolean;
    onLogout: () => void;
    onLinkClick?: () => void;
}> = ({ currentUser, currentOrganization, hasPermission, hasFeature, onLogout, onLinkClick }) => {
    const location = useLocation();
    
    const isMarketingActive = location.pathname.startsWith('/marketing');
    const [isMarketingOpen, setMarketingOpen] = useState(isMarketingActive);

    useEffect(() => {
        if (isMarketingActive) {
            setMarketingOpen(true);
        }
    }, [isMarketingActive]);

    // FIX: Correctly type the `icon` property to allow className to be passed via cloneElement.
    const navItems: { path: string; icon?: React.ReactElement<{ className?: string }>; name: string; permission?: Permission; feature?: SubscriptionPlan['features'][0]; subItems?: { path: string; name: string; feature?: SubscriptionPlan['features'][0] }[]; isOrgFeature?: boolean }[] = [
        { path: '/dashboard', icon: <AppIcons.Dashboard />, name: 'Leads Dashboard', feature: 'DASHBOARD' },
        { path: '/reports', icon: <AppIcons.Reports />, name: 'Reports', feature: 'REPORTS' },
        { path: '/tracking', icon: <AppIcons.Activity />, name: 'Tracking Dashboard', permission: Permission.VIEW_TRACKING_DASHBOARD, feature: 'TRACKING' },
        { path: '/leads', icon: <AppIcons.Leads />, name: 'Leads', feature: 'LEADS' },
        { path: '/tasks', icon: <AppIcons.Tasks />, name: 'Tasks', feature: 'TASKS' },
        {
            path: '/marketing',
            icon: <AppIcons.Marketing />,
            name: 'Marketing',
            subItems: [
                { path: '/marketing/email', name: 'Email Campaigns', feature: 'EMAIL' },
                { path: '/marketing/sms', name: 'SMS Campaigns', feature: 'SMS' },
                { path: '/marketing/whatsapp', name: 'WhatsApp', feature: 'WHATSAPP' },
                { path: '/marketing/call', name: 'Call Campaigns', feature: 'CALLS' },
            ]
        },
        // FIX: Replaced AppIcons.Note with AppIcons.Blog as it is more semantically correct for the blog link.
        { path: '/blog', icon: <AppIcons.Blog />, name: 'Blog', isOrgFeature: true },
    ];

    const visibleNavItems = navItems.filter(item => {
        if (item.isOrgFeature) {
            return !!currentOrganization?.hasBlogAccess;
        }
        return true;
    });

    const settingsNavItems = [
         { path: '/settings', name: 'General Settings', icon: <AppIcons.Settings />, feature: 'SETTINGS'},
         { path: '/settings/users', name: 'Users & Permissions', icon: <AppIcons.Team />, permission: Permission.MANAGE_USERS, feature: 'USERS' },
         { path: '/settings/teams', name: 'Teams', icon: <AppIcons.Team />, permission: Permission.MANAGE_TEAMS, feature: 'TEAMS' },
         { path: '/settings/integrations', name: 'Integrations', icon: <AppIcons.Integrations />, permission: Permission.MANAGE_INTEGRATIONS, feature: 'INTEGRATIONS'},
         { path: '/settings/automation', name: 'Automation', icon: <AppIcons.Automation />, permission: Permission.MANAGE_AUTOMATION, feature: 'AUTOMATION' },
    ]

    const NavItem: React.FC<{ item: typeof navItems[0], isSubItem?: boolean }> = ({ item, isSubItem = false }) => {
        const isActive = location.pathname.startsWith(item.path) && (item.path !== '/' || location.pathname === '/');
        const hasSubItems = item.subItems && item.subItems.length > 0;
        
        const handleClick = (e: React.MouseEvent) => {
            if(hasSubItems) {
                e.preventDefault();
                setMarketingOpen(!isMarketingOpen);
            } else {
                if (onLinkClick) onLinkClick();
            }
        };

        if (item.permission && !hasPermission(item.permission)) return null;
        if (item.feature && !hasFeature(item.feature)) return null;

        return (
            <>
                <Link
                    to={item.path}
                    onClick={handleClick}
                    className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${isSubItem ? 'pl-10 text-sm' : 'text-base'} ${
                        isActive ? 'bg-primary-600 text-white' : 'text-subtle hover:bg-muted hover:text-on-surface'
                    }`}
                >
                    {item.icon && React.cloneElement(item.icon, { className: 'h-6 w-6 mr-3' })}
                    <span className="flex-1">{item.name}</span>
                    {hasSubItems && (
                        <svg className={`w-5 h-5 transition-transform ${isMarketingOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    )}
                </Link>
                 {hasSubItems && isMarketingOpen && (
                    <div className="pl-6 space-y-1 mt-1">
                        {item.subItems?.map(subItem => {
                           if (subItem.feature && !hasFeature(subItem.feature)) return null;
                           return <NavItem key={subItem.path} item={subItem} isSubItem={true} />
                        })}
                    </div>
                )}
            </>
        );
    };

    if (!currentUser || !currentOrganization) return null;

    return (
        <div className="bg-surface text-on-surface w-64 flex flex-col h-full border-r border-muted flex-shrink-0">
            <Link to="/dashboard" className="h-16 flex items-center px-4 border-b border-muted group">
                <img src={currentOrganization.logoUrl} alt="Logo" className="h-8 w-auto transition-transform group-hover:scale-110" />
                <h1 className="ml-3 text-lg font-bold group-hover:text-primary-500 transition-colors">{currentOrganization.name}</h1>
            </Link>
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {visibleNavItems.map(item => <NavItem key={item.path} item={item} />)}
            </nav>
            <div className="p-4 border-t border-muted">
                 <Link to="/settings" onClick={onLinkClick} className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 text-base ${location.pathname.startsWith('/settings') ? 'bg-primary-600 text-white' : 'text-subtle hover:bg-muted hover:text-on-surface'}`}>
                     <AppIcons.Settings className="h-6 w-6 mr-3" /> Settings
                </Link>
                <div className="flex items-center mt-4">
                    <img src={currentUser.avatar} alt={currentUser.name} className="h-10 w-10 rounded-full" />
                    <div className="ml-3">
                        <p className="text-sm font-semibold">{currentUser.name}</p>
                        <p className="text-xs text-subtle">{currentUser.role}</p>
                    </div>
                    <button onClick={onLogout} className="ml-auto p-2 text-subtle hover:text-red-500 transition-colors">
                        <AppIcons.Logout className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const MobileHeader: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => (
    <div className="md:hidden h-16 bg-surface border-b border-muted flex items-center justify-between px-4">
        <AppIcons.Logo className="h-8 w-8 text-primary-500" />
        <button onClick={onMenuClick}><AppIcons.Menu className="h-6 w-6" /></button>
    </div>
);

const App: React.FC = () => {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(true);
    const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);

    // All data is managed at the top level here
    const [users, setUsers] = useState<User[]>(USERS);
    const [leads, setLeads] = useState<Lead[]>(LEADS);
    const [tasks, setTasks] = useState<Task[]>(TASKS);
    const [teams, setTeams] = useState<Team[]>(TEAMS);
    const [stages, setStages] = useState<Stage[]>(STAGES);
    const [integrationLogs, setIntegrationLogs] = useState<IntegrationLog[]>(INTEGRATION_LOGS);
    const [automationRules, setAutomationRules] = useState<AutomationRule[]>(AUTOMATION_RULES);
    const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDefinition[]>(CUSTOM_FIELD_DEFS);
    const [whatsAppTemplates, setWhatsAppTemplates] = useState<WhatsAppTemplate[]>(WHATSAPP_TEMPLATES);
    const [smsTemplates, setSmsTemplates] = useState<SMSTemplate[]>(SMS_TEMPLATES);
    const [chatbotConfig, setChatbotConfig] = useState<ChatbotConfig[]>(CHATBOT_CONFIG);
    const [userSessionLogs, setUserSessionLogs] = useState<UserSessionLog[]>(USER_SESSION_LOGS);
    const [organizations, setOrganizations] = useState<Organization[]>(ORGANIZATIONS);
    const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings[]>(INTEGRATION_SETTINGS);
    const [webhooks, setWebhooks] = useState(initialWebhooks);
    const [emailTemplates, setEmailTemplates] = useState(EMAIL_TEMPLATES);
    const [emailCampaigns, setEmailCampaigns] = useState(EMAIL_CAMPAIGNS);
    const [smsCampaigns, setSmsCampaigns] = useState(SMS_CAMPAIGNS);
    const [whatsAppCampaigns, setWhatsAppCampaigns] = useState(WHATSAPP_CAMPAIGNS);
    const [callScripts, setCallScripts] = useState(CALL_SCRIPTS);
    const [callCampaigns, setCallCampaigns] = useState(CALL_CAMPAIGNS);
    const [leadScoreRules, setLeadScoreRules] = useState(LEAD_SCORE_RULES);
    const [subscriptionPlans, setSubscriptionPlans] = useState(SUBSCRIPTION_PLANS);
    const [supportTickets, setSupportTickets] = useState(SUPPORT_TICKETS);
    const [auditLogs, setAuditLogs] = useState(AUDIT_LOGS);
    const [globalAnnouncement, setGlobalAnnouncement] = useState(GLOBAL_ANNOUNCEMENT);
    const [addons, setAddons] = useState(ADDONS);
    const [systemHealthData, setSystemHealthData] = useState(SYSTEM_HEALTH_DATA);
    const [apiUsageLogs, setApiUsageLogs] = useState(API_USAGE_LOGS);
    const [errorLogs, setErrorLogs] = useState(ERROR_LOGS);
    const [globalAutomationRules, setGlobalAutomationRules] = useState(GLOBAL_AUTOMATION_RULES);
    const [globalEmailTemplates, setGlobalEmailTemplates] = useState(GLOBAL_EMAIL_TEMPLATES);
    const [globalIntegrationStatus, setGlobalIntegrationStatus] = useState(GLOBAL_INTEGRATION_STATUS);
    const [localizationSettings, setLocalizationSettings] = useState(LOCALIZATION_SETTINGS);
    const [paymentGatewaySettings, setPaymentGatewaySettings] = useState<PaymentGatewaySetting[]>(PAYMENT_GATEWAY_SETTINGS);
    const [homepageContent, setHomepageContent] = useState(HOMEPAGE_CONTENT);
    const [billingHistory, setBillingHistory] = useState(BILLING_HISTORY);
    const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
    const [customDomains, setCustomDomains] = useState<CustomDomain[]>(CUSTOM_DOMAINS);
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>(BLOG_POSTS);
    const [inquiries, setInquiries] = useState<Inquiry[]>(INQUIRIES);
    const [coupons, setCoupons] = useState<Coupon[]>(COUPONS);
    const [offerStrip, setOfferStrip] = useState<OfferStrip>(OFFER_STRIP);
    const [pricingComparisonData, setPricingComparisonData] = useState<PricingCategory[]>(PRICING_COMPARISON_DATA);
    const [customDashboardWidgets, setCustomDashboardWidgets] = useState<CustomDashboardWidget[]>(() => {
        const saved = localStorage.getItem('customDashboardWidgets');
        return saved ? JSON.parse(saved) : [];
    });
    
    const navigate = useNavigate();

    useEffect(() => {
        const savedUserJson = localStorage.getItem('currentUser');
        const savedSessionId = localStorage.getItem('sessionId');

        if (savedUserJson && savedSessionId) {
            const savedUser = JSON.parse(savedUserJson) as User;
            const activeSessions: Record<number, string> = JSON.parse(localStorage.getItem('activeSessions') || '{}');

            if (activeSessions[savedUser.id] && activeSessions[savedUser.id] === savedSessionId) {
                setCurrentUser(savedUser);
            } else {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('sessionId');
                if (activeSessions[savedUser.id]) {
                    alert("You have been logged out because you signed in on another device.");
                }
            }
        }
        setIsAuthenticating(false);
    }, []);

    useEffect(() => {
        localStorage.setItem('customDashboardWidgets', JSON.stringify(customDashboardWidgets));
    }, [customDashboardWidgets]);

    useEffect(() => {
        document.documentElement.className = theme;
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        if(currentUser) {
            const org = organizations.find(o => o.id === currentUser.organizationId);
            setCurrentOrganization(org || null);
        } else {
            setCurrentOrganization(null);
        }
    }, [currentUser, organizations]);

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    // FIX: Made handleLogin async to match the prop type required by LoginPage.
    const handleLogin = useCallback(async (email: string, pass: string): Promise<string | undefined> => {
        const user = USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
        if (user) {
            const sessionId = faker.string.uuid();
            const activeSessions: Record<number, string> = JSON.parse(localStorage.getItem('activeSessions') || '{}');

            activeSessions[user.id] = sessionId;
            localStorage.setItem('activeSessions', JSON.stringify(activeSessions));

            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('sessionId', sessionId);
            
            setCurrentUser(user);

            if (user.role === UserRole.SUPER_ADMIN) {
                navigate('/super-admin');
            } else {
                navigate('/dashboard');
            }
            return undefined;
        }
        return "Invalid email or password.";
    }, [navigate]);

    const handleLogout = useCallback(() => {
        const activeSessions: Record<number, string> = JSON.parse(localStorage.getItem('activeSessions') || '{}');
        if (currentUser) {
            delete activeSessions[currentUser.id];
            localStorage.setItem('activeSessions', JSON.stringify(activeSessions));
        }
        
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sessionId');
        navigate('/login');
    }, [navigate, currentUser]);

    const hasPermission = useCallback((permission: Permission): boolean => {
        if (!currentUser) return false;
        if (currentUser.role === UserRole.ADMIN) return true;
        return currentUser.permissions.includes(permission);
    }, [currentUser]);
    
    const hasFeature = useCallback((feature: SubscriptionPlan['features'][0]): boolean => {
        if (!currentOrganization) return false;

        // Check for manually assigned features first
        if (currentOrganization.manuallyAssignedFeatures?.includes(feature)) {
            return true;
        }

        const plan = subscriptionPlans.find(p => p.id === currentOrganization.subscriptionPlanId);
        return plan?.features.includes(feature) ?? false;
    }, [currentOrganization, subscriptionPlans]);
    
    // Data filtering based on current user
    const userLeads = useMemo(() => leads.filter(l => l.organizationId === currentOrganization?.id), [leads, currentOrganization]);
    const userTasks = useMemo(() => tasks.filter(t => t.organizationId === currentOrganization?.id), [tasks, currentOrganization]);
    const userUsers = useMemo(() => users.filter(u => u.organizationId === currentOrganization?.id), [users, currentOrganization]);
    const userTeams = useMemo(() => teams.filter(t => t.organizationId === currentOrganization?.id), [teams, currentOrganization]);
    const userStages = useMemo(() => stages.filter(s => s.organizationId === currentOrganization?.id), [stages, currentOrganization]);
    const userIntegrationLogs = useMemo(() => integrationLogs.filter(l => l.organizationId === currentOrganization?.id), [integrationLogs, currentOrganization]);
    const userAutomationRules = useMemo(() => automationRules.filter(r => r.organizationId === currentOrganization?.id), [automationRules, currentOrganization]);
    const userCustomFieldDefs = useMemo(() => customFieldDefs.filter(d => d.organizationId === currentOrganization?.id), [customFieldDefs, currentOrganization]);
    const userWhatsAppTemplates = useMemo(() => whatsAppTemplates.filter(t => t.organizationId === currentOrganization?.id), [whatsAppTemplates, currentOrganization]);
    const userSmsTemplates = useMemo(() => smsTemplates.filter(t => t.organizationId === currentOrganization?.id), [smsTemplates, currentOrganization]);
    const userChatbotConfig = useMemo(() => chatbotConfig.find(c => c.organizationId === currentOrganization?.id), [chatbotConfig, currentOrganization]);
    const currentUserSessionLogs = useMemo(() => userSessionLogs.filter(l => l.organizationId === currentOrganization?.id), [userSessionLogs, currentOrganization]);
    const userIntegrationSettings = useMemo(() => integrationSettings.filter(s => s.organizationId === currentOrganization?.id), [integrationSettings, currentOrganization]);
    const userWebhooks = useMemo(() => webhooks.filter(w => w.organizationId === currentOrganization?.id), [webhooks, currentOrganization]);
    const userEmailTemplates = useMemo(() => emailTemplates.filter(t => t.organizationId === currentOrganization?.id), [emailTemplates, currentOrganization]);
    const userEmailCampaigns = useMemo(() => emailCampaigns.filter(c => c.organizationId === currentOrganization?.id), [emailCampaigns, currentOrganization]);
    const userSmsCampaigns = useMemo(() => smsCampaigns.filter(c => c.organizationId === currentOrganization?.id), [smsCampaigns, currentOrganization]);
    const userWhatsAppCampaigns = useMemo(() => whatsAppCampaigns.filter(c => c.organizationId === currentOrganization?.id), [whatsAppCampaigns, currentOrganization]);
    const userCallScripts = useMemo(() => callScripts.filter(s => s.organizationId === currentOrganization?.id), [callScripts, currentOrganization]);
    const userCallCampaigns = useMemo(() => callCampaigns.filter(c => c.organizationId === currentOrganization?.id), [callCampaigns, currentOrganization]);
    const userLeadScoreRules = useMemo(() => leadScoreRules.filter(r => r.organizationId === currentOrganization?.id), [leadScoreRules, currentOrganization]);
    const userSavedFilters = useMemo(() => savedFilters.filter(f => f.organizationId === currentOrganization?.id), [savedFilters, currentOrganization]);
    const userBillingHistory = useMemo(() => billingHistory.filter(h => h.organizationId === currentOrganization?.id), [billingHistory, currentOrganization]);
    const userCustomDomains = useMemo(() => customDomains.filter(d => d.organizationId === currentOrganization?.id), [customDomains, currentOrganization]);
    
    // Data mutation functions
    const addLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'activities' | 'score' | 'closeDate'>) => {
        const newLead: Lead = {
            id: faker.string.uuid(),
            ...leadData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            organizationId: currentOrganization!.id,
            activities: [],
            score: 0,
            closeDate: faker.date.future().toISOString(),
        };
        setLeads(prev => [newLead, ...prev]);
    };
    const deleteLead = (leadId: string) => setLeads(prev => prev.filter(l => l.id !== leadId));
    const onUpdateLead = (updatedLead: Lead) => setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    const onUpdateTask = (updatedTask: Task) => setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    const onAddTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'organizationId' | 'isCompleted' | 'assignedToId' | 'createdById'>, assignment?: { type: 'user' | 'team' | 'all'; id?: string | number }) => {
        if (assignment && currentUser && currentOrganization) {
            const usersToAssign: User[] = [];
            let batchId: string | undefined = undefined;

            if (assignment.type === 'user') {
                const user = userUsers.find(u => u.id === assignment.id);
                if (user) usersToAssign.push(user);
            } else if (assignment.type === 'all') {
                batchId = faker.string.uuid();
                usersToAssign.push(...userUsers.filter(u => u.role !== UserRole.ADMIN && u.role !== UserRole.SUPER_ADMIN));
            } else if (assignment.type === 'team') {
                batchId = faker.string.uuid();
                const team = userTeams.find(t => t.id === assignment.id);
                if (team) {
                    const memberUsers = userUsers.filter(u => team.memberIds.includes(u.id) || u.id === team.leadId);
                    usersToAssign.push(...memberUsers);
                }
            }

            const newTasks: Task[] = usersToAssign.map(user => ({
                ...(taskData as any),
                id: faker.string.uuid(),
                createdAt: new Date().toISOString(),
                organizationId: currentOrganization.id,
                isCompleted: false,
                assignedToId: user.id,
                createdById: currentUser.id,
                batchId: batchId,
            }));
            
            setTasks(prev => [...prev, ...newTasks]);
        } else { // Fallback for single task creation from other pages
            const newTask: Task = {
                ...(taskData as any),
                id: faker.string.uuid(),
                createdAt: new Date().toISOString(),
                organizationId: currentOrganization!.id,
                createdById: currentUser!.id,
            };
            setTasks(prev => [newTask, ...prev]);
        }
    };

    const onDeleteTask = (taskId: string) => {
        setTasks(prev => prev.filter(task => task.id !== taskId));
    };
    const onScheduleMessage = (msgData: Omit<ScheduledMessage, 'id'|'organizationId'>) => {
        const newMsg: ScheduledMessage = {...msgData, id: faker.string.uuid(), organizationId: currentOrganization!.id };
        setLeads(prev => prev.map(l => l.id === newMsg.leadId ? {...l, scheduledMessages: [...(l.scheduledMessages || []), newMsg] } : l));
    }

    // --- Other CRUD functions for settings etc. ---
    const onSaveUser = (user: User) => setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    const onAddStage = () => setStages(prev => [...prev, {id: faker.string.uuid(), name: 'New Stage', color: '#cccccc', organizationId: currentOrganization!.id }]);
    const onUpdateStage = (id: string, field: 'name'|'color', value: string) => setStages(prev => prev.map(s => s.id === id ? {...s, [field]: value} : s));
    const onDeleteStage = (id: string) => setStages(prev => prev.filter(s => s.id !== id));
    const onAddCustomField = (type: CustomFieldDefinition['type']) => setCustomFieldDefs(prev => [...prev, { id: faker.string.uuid(), name: 'New Field', type, isMappable: true, isRequired: false, organizationId: currentOrganization!.id }]);
    const onUpdateCustomField = (id: string, data: Partial<CustomFieldDefinition>) => setCustomFieldDefs(prev => prev.map(f => f.id === id ? {...f, ...data} : f));
    const onDeleteCustomField = (id: string) => setCustomFieldDefs(prev => prev.filter(f => f.id !== id));
    const onSaveLeadScoreRule = (rule: LeadScoreRule) => {
        if(rule.id.startsWith('new_')) { // It's a new rule
             setLeadScoreRules(prev => [...prev, {...rule, id: faker.string.uuid()}]);
        } else {
             setLeadScoreRules(prev => prev.map(r => r.id === rule.id ? rule : r));
        }
    }
    const onDeleteLeadScoreRule = (id: string) => setLeadScoreRules(prev => prev.filter(r => r.id !== id));
    const onSaveGlobalRule = (rule: GlobalAutomationRule) => {
        setGlobalAutomationRules(prev => {
            const exists = prev.some(r => r.id === rule.id);
            if (exists) {
                return prev.map(r => (r.id === rule.id ? rule : r));
            }
            return [...prev, { ...rule, id: faker.string.uuid() }];
        });
    };

    const onDeleteGlobalRule = (ruleId: string) => {
        setGlobalAutomationRules(prev => prev.filter(r => r.id !== ruleId));
    };
    
    // ... many more CRUD functions would go here ...
    const onSaveAddon = (addon: Addon) => {
        setAddons(prev => {
            const exists = prev.some(a => a.id === addon.id);
            if (exists) {
                return prev.map(a => (a.id === addon.id ? addon : a));
            }
            return [...prev, { ...addon, id: addon.id || faker.string.uuid() }];
        });
    };

    const onDeleteAddon = (addonId: string) => {
        setAddons(prev => prev.filter(a => a.id !== addonId));
    };

    const onUpdateCurrentOrganization = (updatedFields: Partial<Organization>) => {
        if (currentOrganization) {
            const updatedOrg = { ...currentOrganization, ...updatedFields };
            setOrganizations(prev => prev.map(o => o.id === updatedOrg.id ? updatedOrg : o));
        }
    };


    const onSaveFilter = (filter: Omit<SavedFilter, 'id' | 'organizationId'>) => {
        const newFilter: SavedFilter = { id: faker.string.uuid(), ...filter, organizationId: currentOrganization!.id };
        setSavedFilters(prev => [...prev, newFilter]);
    }
    const onBulkAssign = (leadIds: string[], assignedToId: number) => {
        setLeads(prev => prev.map(l => leadIds.includes(l.id) ? {...l, assignedToId} : l));
    };
    const onBulkDelete = (leadIds: string[]) => {
        setLeads(prev => prev.filter(l => !leadIds.includes(l.id)));
    };
    const onSaveRule = (rule: AutomationRule) => {
        if(rule.id) {
            setAutomationRules(prev => prev.map(r => r.id === rule.id ? rule : r));
        } else {
            setAutomationRules(prev => [...prev, {...rule, id: faker.string.uuid(), organizationId: currentOrganization!.id }]);
        }
    }
    const onDeleteRule = (id: string) => setAutomationRules(prev => prev.filter(r => r.id !== id));
    const onSaveTeam = (team: Team) => {
         if(teams.some(t => t.id === team.id)) {
            setTeams(prev => prev.map(t => t.id === team.id ? team : t));
        } else {
            setTeams(prev => [...prev, {...team, organizationId: currentOrganization!.id }]);
        }
    }
    const onDeleteTeam = (id: string) => setTeams(prev => prev.filter(t => t.id !== id));
    const onSaveWhatsAppTemplate = (template: WhatsAppTemplate) => {
         if(template.id) {
            setWhatsAppTemplates(prev => prev.map(t => t.id === template.id ? template : t));
        } else {
            setWhatsAppTemplates(prev => [...prev, {...template, id: faker.string.uuid(), organizationId: currentOrganization!.id }]);
        }
    }
    const onDeleteWhatsAppTemplate = (id: string) => setWhatsAppTemplates(prev => prev.filter(t => t.id !== id));
    const onSaveChatbotConfig = (config: ChatbotConfig) => setChatbotConfig(prev => prev.map(c => c.organizationId === config.organizationId ? config : c));
    const onToggleTracking = (userId: number) => setUsers(prev => prev.map(u => u.id === userId ? {...u, isTrackingEnabled: !u.isTrackingEnabled} : u));
    
    const onSaveCallCampaign = (c: CallCampaign) => c.id ? setCallCampaigns(p => p.map(i => i.id === c.id ? {...i, ...c} : i)) : setCallCampaigns(p => [...p, {...c, id: faker.string.uuid(), organizationId: currentOrganization!.id, recipientCount: 0, connectionRate: 0 } as CallCampaign]);
    const onDeleteCallCampaign = (id: string) => setCallCampaigns(p => p.filter(i => i.id !== id));
    const onSaveCallScript = (s: CallScript) => s.id ? setCallScripts(p => p.map(i => i.id === s.id ? s : i)) : setCallScripts(p => [...p, {...s, id: faker.string.uuid(), organizationId: currentOrganization!.id}]);
    const onDeleteCallScript = (id: string) => setCallScripts(p => p.filter(i => i.id !== id));

    const handleAddDomain = (domain: string) => setCustomDomains(p => [...p, { id: faker.string.uuid(), domain, status: 'pending', organizationId: currentOrganization!.id }]);
    const handleDeleteDomain = (id: string) => setCustomDomains(p => p.filter(d => d.id !== id));
    const handleVerifyDomain = (id: string) => setCustomDomains(p => p.map(d => d.id === id ? {...d, status: 'verified'} : d));
    
    const handleSaveCustomWidget = (widget: CustomDashboardWidget) => {
        setCustomDashboardWidgets(prev => {
            const index = prev.findIndex(w => w.id === widget.id);
            if (index > -1) {
                const newWidgets = [...prev];
                newWidgets[index] = widget;
                return newWidgets;
            } else {
                return [...prev, widget];
            }
        });
    };

    const handleDeleteCustomWidget = (widgetId: string) => {
        setCustomDashboardWidgets(prev => prev.filter(w => w.id !== widgetId));
    };

    // FIX: Define onSaveBlogPost and onDeleteBlogPost to resolve missing property errors.
    const onSaveBlogPost = (post: BlogPost) => {
        setBlogPosts(prev => {
            const exists = prev.some(p => p.id === post.id);
            if (exists) {
                return prev.map(p => p.id === post.id ? post : p);
            }
            return [{...post, id: post.id || faker.string.uuid() }, ...prev];
        });
    };
    
    const onDeleteBlogPost = (postId: string) => {
        setBlogPosts(prev => prev.filter(p => p.id !== postId));
    };

    const onSaveCoupon = (coupon: Coupon) => {
        setCoupons(prev => {
            const exists = prev.some(c => c.id === coupon.id);
            if (exists) {
                return prev.map(c => c.id === coupon.id ? coupon : c);
            }
            return [...prev, { ...coupon, id: coupon.id || faker.string.uuid() }];
        });
    };
    const onDeleteCoupon = (couponId: string) => {
        setCoupons(prev => prev.filter(c => c.id !== couponId));
    };
    const onUpdateOfferStrip = (strip: OfferStrip) => {
        setOfferStrip(strip);
    };

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    if (isAuthenticating) {
        return <div className="h-screen w-screen flex items-center justify-center bg-background text-on-surface">Authenticating...</div>;
    }

    // Render loading/login/app states
    if (!currentUser) {
        return (
            <Routes>
                <Route element={<PublicLayout theme={theme} toggleTheme={toggleTheme} content={homepageContent} offerStrip={offerStrip} />}>
                    <Route index element={<HomePage content={homepageContent} blogPosts={blogPosts} />} />
                    <Route path="/pricing" element={<PricingPage content={homepageContent.pricing} comparisonData={pricingComparisonData} />} />
                    <Route path="/blog" element={<BlogListPage blogPosts={blogPosts} users={users} />} />
                    <Route path="/blog/:slug" element={<BlogPostPage blogPosts={blogPosts} users={users} />} />
                </Route>
                <Route path="/login" element={<LoginPage onLogin={handleLogin} content={homepageContent.loginPage} features={homepageContent.features.items} />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        );
    }
    if (currentUser.role === UserRole.SUPER_ADMIN) {
        return <SuperAdminDashboard {...{ organizations, users, leads, tasks, subscriptionPlans, supportTickets, auditLogs, globalAnnouncement, addons, systemHealthData, apiUsageLogs, errorLogs, globalAutomationRules, onSaveGlobalRule, onDeleteGlobalRule, globalEmailTemplates, homepageContent, customDomains, blogPosts, inquiries, setInquiries, setLeads, onSaveBlogPost, onDeleteBlogPost, onLogout: handleLogout, onAddOrganization: (org) => setOrganizations(prev => [...prev, { ...org, id: faker.string.uuid(), apiKey: faker.string.uuid(), isEnabled: true, subscriptionPlanId: 'plan_free', subscriptionExpiresAt: faker.date.future().toISOString()}]), onUpdateOrganization: (org) => setOrganizations(prev => prev.map(o => o.id === org.id ? org : o)), onDeleteOrganization: (id) => setOrganizations(prev => prev.filter(o => o.id !== id)), onSaveSubscriptionPlan: (plan) => setSubscriptionPlans(prev => prev.map(p => p.id === plan.id ? plan : p)), onDeleteSubscriptionPlan: (id) => setSubscriptionPlans(prev => prev.filter(p => p.id !== id)), onUpdateTicketStatus: (id, status) => setSupportTickets(prev => prev.map(t => t.id === id ? {...t, status} : t)), onSaveAnnouncement: setGlobalAnnouncement, onSaveUser, globalIntegrationStatus, onUpdateGlobalIntegrationStatus: setGlobalIntegrationStatus, localizationSettings, onUpdateLocalizationSettings: setLocalizationSettings, onUpdateHomepageContent: setHomepageContent, onDeleteCustomDomain: handleDeleteDomain, onVerifyCustomDomain: handleVerifyDomain, paymentGatewaySettings, onUpdatePaymentGatewaySettings: setPaymentGatewaySettings, coupons, onSaveCoupon, onDeleteCoupon, offerStrip, onUpdateOfferStrip, onSaveAddon, onDeleteAddon, pricingComparisonData, onUpdatePricingComparisonData: setPricingComparisonData }} />
    }

    if (!currentOrganization) {
        return <div className="h-screen w-screen flex items-center justify-center bg-background text-on-surface">Loading organization...</div>;
    }

    const mainContent = (
        <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard 
                leads={userLeads} 
                users={userUsers} 
                pipelineStages={userStages}
                customWidgets={customDashboardWidgets} 
                onSaveWidget={handleSaveCustomWidget} 
                onDeleteWidget={handleDeleteCustomWidget}
            />} />
            <Route path="/leads" element={<LeadListPage 
                leads={userLeads} users={userUsers} pipelineStages={userStages} customFieldDefs={userCustomFieldDefs}
                tasks={userTasks} whatsAppTemplates={userWhatsAppTemplates} smsTemplates={userSmsTemplates}
                addLead={addLead} deleteLead={deleteLead} currentUser={currentUser} hasPermission={hasPermission} 
                savedFilters={userSavedFilters} onSaveFilter={onSaveFilter} onDeleteFilter={(id) => setSavedFilters(p => p.filter(f => f.id !== id))}
                onBulkAssign={onBulkAssign} onBulkDelete={onBulkDelete}
                onUpdateLead={(lead) => onUpdateLead(lead)} onUpdateTask={onUpdateTask} onAddTask={onAddTask} onScheduleMessage={onScheduleMessage}
                onImportLeads={(imported) => { console.log('Imported leads (simulated)', imported); setLeads(p => [...p, ...faker.helpers.multiple(() => ({...LEADS[0], id: faker.string.uuid(), organizationId: currentOrganization.id}), {count: 5})])}}
            />} />
            <Route path="/leads/:leadId" element={<LeadDetailPage 
                 leads={userLeads} users={userUsers} pipelineStages={userStages} customFieldDefs={userCustomFieldDefs}
                tasks={userTasks} whatsAppTemplates={userWhatsAppTemplates} smsTemplates={userSmsTemplates}
                 currentUser={currentUser}
                onUpdateLead={(lead) => onUpdateLead(lead)} onUpdateTask={onUpdateTask} onAddTask={onAddTask} onScheduleMessage={onScheduleMessage}
            />} />
            <Route path="/tasks" element={<TasksPage tasks={userTasks} users={userUsers} leads={userLeads} teams={userTeams} currentUser={currentUser} updateTask={onUpdateTask} onAddTask={onAddTask} onDeleteTask={onDeleteTask} />} />
            <Route path="/reports" element={<ReportsPage leads={userLeads} users={userUsers} pipelineStages={userStages} teams={userTeams} />} />
            <Route path="/tracking" element={hasPermission(Permission.VIEW_TRACKING_DASHBOARD) ? <TrackingDashboard users={userUsers} sessionLogs={currentUserSessionLogs} teams={userTeams} onToggleTracking={onToggleTracking} currentUser={currentUser} /> : <Navigate to="/dashboard" />} />
            <Route path="/marketing" element={<MarketingLayout />}>
                 <Route path="email" element={<EmailPage templates={userEmailTemplates} campaigns={userEmailCampaigns} onSaveTemplate={(t) => t.id ? setEmailTemplates(p => p.map(i => i.id === t.id ? t : i)) : setEmailTemplates(p => [...p, {...t, id: faker.string.uuid(), organizationId: currentOrganization.id}])} onDeleteTemplate={(id) => setEmailTemplates(p => p.filter(i => i.id !== id))} onSaveCampaign={(c) => c.id ? setEmailCampaigns(p => p.map(i => i.id === c.id ? {...i, ...c} : i)) : setEmailCampaigns(p => [...p, {...c, id: faker.string.uuid(), organizationId: currentOrganization.id, recipientCount: 0, openRate: 0 } as EmailCampaign])} onDeleteCampaign={(id) => setEmailCampaigns(p => p.filter(i => i.id !== id))} users={userUsers} pipelineStages={userStages} customFieldDefs={userCustomFieldDefs} />} />
                <Route path="sms" element={<SMSPage templates={userSmsTemplates} campaigns={userSmsCampaigns} onSaveTemplate={(t) => t.id ? setSmsTemplates(p => p.map(i => i.id === t.id ? t : i)) : setSmsTemplates(p => [...p, {...t, id: faker.string.uuid(), organizationId: currentOrganization.id}])} onDeleteTemplate={(id) => setSmsTemplates(p => p.filter(i => i.id !== id))} onSaveCampaign={(c) => c.id ? setSmsCampaigns(p => p.map(i => i.id === c.id ? {...i, ...c} : i)) : setSmsCampaigns(p => [...p, {...c, id: faker.string.uuid(), organizationId: currentOrganization.id, recipientCount: 0, deliveryRate: 0 } as SMSCampaign])} onDeleteCampaign={(id) => setSmsCampaigns(p => p.filter(i => i.id !== id))} users={userUsers} pipelineStages={userStages} customFieldDefs={userCustomFieldDefs} />} />
                {userChatbotConfig && <Route path="whatsapp" element={<WhatsAppPage 
                    templates={userWhatsAppTemplates} 
                    onSaveTemplate={onSaveWhatsAppTemplate} 
                    onDeleteTemplate={onDeleteWhatsAppTemplate} 
                    chatbotConfig={userChatbotConfig} 
                    onSaveChatbotConfig={onSaveChatbotConfig} 
                    customFieldDefs={userCustomFieldDefs} 
                    campaigns={userWhatsAppCampaigns}
                    onSaveCampaign={(c) => c.id ? setWhatsAppCampaigns(p => p.map(i => i.id === c.id ? {...i, ...c} : i)) : setWhatsAppCampaigns(p => [...p, {...c, id: faker.string.uuid(), organizationId: currentOrganization.id, recipientCount: 0, deliveryRate: 0 } as WhatsAppCampaign])}
                    onDeleteCampaign={(id) => setWhatsAppCampaigns(p => p.filter(i => i.id !== id))}
                    users={userUsers}
                    pipelineStages={userStages}
                />} />}
                <Route path="call" element={<CallPage 
                    scripts={userCallScripts} 
                    campaigns={userCallCampaigns} 
                    onSaveScript={onSaveCallScript} 
                    onDeleteScript={onDeleteCallScript} 
                    onSaveCampaign={onSaveCallCampaign} 
                    onDeleteCampaign={onDeleteCallCampaign} 
                    users={userUsers} 
                    pipelineStages={userStages} 
                    customFieldDefs={userCustomFieldDefs} 
                />} />
            </Route>
            <Route path="/blog" element={<BlogListPage blogPosts={blogPosts} users={users} />} />
            <Route path="/blog/:slug" element={<BlogPostPage blogPosts={blogPosts} users={users} />} />
            <Route path="/settings" element={<SettingsLayout />}>
                <Route index element={<SettingsPage pipelineStages={userStages} onAddStage={onAddStage} onUpdateStage={onUpdateStage} onDeleteStage={onDeleteStage} customFieldDefs={userCustomFieldDefs} onAddCustomField={onAddCustomField} onUpdateCustomField={onUpdateCustomField} onDeleteCustomField={onDeleteCustomField} leadScoreRules={userLeadScoreRules} onSaveLeadScoreRule={onSaveLeadScoreRule} onDeleteLeadScoreRule={onDeleteLeadScoreRule} theme={theme} toggleTheme={toggleTheme} currentUser={currentUser} hasPermission={hasPermission} currentOrganization={currentOrganization} subscriptionPlans={subscriptionPlans} billingHistory={userBillingHistory} onUpdateProfile={(data) => setCurrentUser(p => p ? {...p, ...data} : null)} addons={addons} onUpdateOrganization={onUpdateCurrentOrganization} />} />
                <Route path="users" element={<UserManagementPage users={userUsers} teams={userTeams} onSaveUser={onSaveUser} onDeleteUser={(id) => setUsers(p => p.filter(u => u.id !== id))} />} />
                <Route path="teams" element={<TeamsPage teams={userTeams} users={userUsers} onSaveTeam={onSaveTeam} onDeleteTeam={onDeleteTeam} />} />
                <Route path="integrations" element={<IntegrationsPage logs={userIntegrationLogs} settings={userIntegrationSettings} setSettings={setIntegrationSettings} customFieldDefs={userCustomFieldDefs} currentOrganization={currentOrganization} webhooks={userWebhooks} onAddWebhook={(name) => setWebhooks(p => [...p, {id: faker.string.uuid(), name, url: `https://api.example.com/wh/${faker.string.uuid()}`, isEnabled: true, organizationId: currentOrganization.id}])} onDeleteWebhook={(id) => setWebhooks(p => p.filter(w => w.id !== id))} onUpdateWebhook={(wh) => setWebhooks(p => p.map(w => w.id === wh.id ? wh : w))} onSendTestLead={(source, form) => alert(`Test lead sent from ${source}: ${form}`)} syncFacebookLeads={() => alert('Syncing recent leads...')} />} />
                <Route path="automation" element={<AutomationPage rules={userAutomationRules} users={userUsers} teams={userTeams} customFieldDefs={userCustomFieldDefs} pipelineStages={userStages} onSaveRule={onSaveRule} onDeleteRule={onDeleteRule} />} />
                <Route path="domains" element={<CustomDomainsPage domains={userCustomDomains} onAddDomain={handleAddDomain} onDeleteDomain={handleDeleteDomain} onVerifyDomain={handleVerifyDomain} />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
    );

    return (
        <div className="h-screen w-screen bg-background text-on-surface flex flex-col md:flex-row">
             <div className="hidden md:flex">
                 <Sidebar
                    currentUser={currentUser}
                    currentOrganization={currentOrganization}
                    hasPermission={hasPermission}
                    hasFeature={hasFeature}
                    onLogout={handleLogout}
                />
            </div>
            
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="absolute top-0 left-0 h-full" onClick={e => e.stopPropagation()}>
                        <Sidebar
                            currentUser={currentUser}
                            currentOrganization={currentOrganization}
                            hasPermission={hasPermission}
                            hasFeature={hasFeature}
                            onLogout={handleLogout}
                            onLinkClick={() => setIsMobileMenuOpen(false)}
                        />
                    </div>
                </div>
            )}
            
            <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                {mainContent}
            </main>
        </div>
    );
};
export default App;



