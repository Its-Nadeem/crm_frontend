

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate, Outlet } from 'react-router-dom';
import { User, Lead, Task, UserRole, IntegrationLog, Activity, Stage, AutomationRule, CustomFieldDefinition, FollowUpStatus, Permission, Team, IntegrationSettings, IntegrationSource, WhatsAppTemplate, SavedFilter, ChatbotConfig, UserSessionLog, LeadSource, Organization, WebhookConfig, ScheduledMessage, EmailTemplate, EmailCampaign, ConnectedFacebookAccount, SMSTemplate, SMSCampaign, LeadScoreRule, SubscriptionPlan, SupportTicket, AuditLog, GlobalAnnouncement, Addon, SystemHealthMetric, ApiUsageLog, ErrorLog, GlobalAutomationRule, GlobalIntegrationStatus, LocalizationSettings, HomepageContent, BillingHistory, CustomDomain, WhatsAppCampaign, CallScript, CallCampaign, CustomDashboardWidget, BlogPost, PaymentGatewaySetting, Inquiry, GlobalEmailTemplate, Coupon, OfferStrip, PricingCategory } from './types';
import { apiService } from './services/api';
import Dashboard from '../components/pages/Dashboard';
import LeadListPage from '../components/pages/LeadListPage';
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

    // All data is managed at the top level here - initialized as empty arrays
    const [users, setUsers] = useState<User[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [stages, setStages] = useState<Stage[]>([]);
    const [integrationLogs, setIntegrationLogs] = useState<IntegrationLog[]>([]);
    const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
    const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDefinition[]>([]);
    const [whatsAppTemplates, setWhatsAppTemplates] = useState<WhatsAppTemplate[]>([]);
    const [smsTemplates, setSmsTemplates] = useState<SMSTemplate[]>([]);
    const [chatbotConfig, setChatbotConfig] = useState<ChatbotConfig[]>([]);
    const [userSessionLogs, setUserSessionLogs] = useState<UserSessionLog[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings[]>([]);
    const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
    const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
    const [emailCampaigns, setEmailCampaigns] = useState<EmailCampaign[]>([]);
    const [smsCampaigns, setSmsCampaigns] = useState<SMSCampaign[]>([]);
    const [whatsAppCampaigns, setWhatsAppCampaigns] = useState<WhatsAppCampaign[]>([]);
    const [callScripts, setCallScripts] = useState<CallScript[]>([]);
    const [callCampaigns, setCallCampaigns] = useState<CallCampaign[]>([]);
    const [leadScoreRules, setLeadScoreRules] = useState<LeadScoreRule[]>([]);
    const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [globalAnnouncement, setGlobalAnnouncement] = useState<GlobalAnnouncement | null>(null);
    const [addons, setAddons] = useState<Addon[]>([]);
    const [systemHealthData, setSystemHealthData] = useState<SystemHealthMetric[]>([]);
    const [apiUsageLogs, setApiUsageLogs] = useState<ApiUsageLog[]>([]);
    const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
    const [globalAutomationRules, setGlobalAutomationRules] = useState<GlobalAutomationRule[]>([]);
    const [globalEmailTemplates, setGlobalEmailTemplates] = useState<GlobalEmailTemplate[]>([]);
    const [globalIntegrationStatus, setGlobalIntegrationStatus] = useState<GlobalIntegrationStatus[]>([]);
    const [localizationSettings, setLocalizationSettings] = useState<LocalizationSettings | null>(null);
    const [paymentGatewaySettings, setPaymentGatewaySettings] = useState<PaymentGatewaySetting[]>([]);
    const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null);
    const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
    const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
    const [customDomains, setCustomDomains] = useState<CustomDomain[]>([]);
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [offerStrip, setOfferStrip] = useState<OfferStrip | null>(null);
    const [pricingComparisonData, setPricingComparisonData] = useState<PricingCategory[]>([]);
    const [customDashboardWidgets, setCustomDashboardWidgets] = useState<CustomDashboardWidget[]>(() => {
        const saved = localStorage.getItem('customDashboardWidgets');
        return saved ? JSON.parse(saved) : [];
    });
    
    const navigate = useNavigate();

    // API data fetching functions
    const fetchLeads = useCallback(async () => {
        if (currentOrganization) {
            try {
                const data = await apiService.getLeads(currentOrganization.id);
                setLeads(data);
            } catch (error) {
                console.error('Failed to fetch leads:', error);
            }
        }
    }, [currentOrganization]);

    const fetchUsers = useCallback(async () => {
        if (currentOrganization) {
            try {
                const data = await apiService.getUsers(currentOrganization.id);
                setUsers(data);
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        }
    }, [currentOrganization]);

    const fetchStages = useCallback(async () => {
        if (currentOrganization) {
            try {
                const data = await apiService.getStages(currentOrganization.id);
                setStages(data);
            } catch (error) {
                console.error('Failed to fetch stages:', error);
            }
        }
    }, [currentOrganization]);

    const fetchTasks = useCallback(async () => {
        if (currentOrganization) {
            try {
                const data = await apiService.getTasks(currentOrganization.id);
                setTasks(data);
            } catch (error) {
                console.error('Failed to fetch tasks:', error);
            }
        }
    }, [currentOrganization]);

    const fetchCustomFields = useCallback(async () => {
        if (currentOrganization) {
            try {
                const data = await apiService.getCustomFields(currentOrganization.id);
                setCustomFieldDefs(data);
            } catch (error) {
                console.error('Failed to fetch custom fields:', error);
            }
        }
    }, [currentOrganization]);

    // Fetch data when organization changes
    useEffect(() => {
        if (currentOrganization && currentUser) {
            fetchLeads();
            fetchUsers();
            fetchStages();
            fetchTasks();
            fetchCustomFields();
        }
    }, [currentOrganization, currentUser, fetchLeads, fetchUsers, fetchStages, fetchTasks, fetchCustomFields]);

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
        try {
            const response = await apiService.login(email, pass);

            if (response.success && response.token) {
                const user = response;
                const sessionId = crypto.randomUUID();
                const activeSessions: Record<number, string> = JSON.parse(localStorage.getItem('activeSessions') || '{}');

                activeSessions[user.id] = sessionId;
                localStorage.setItem('activeSessions', JSON.stringify(activeSessions));
                localStorage.setItem('currentUser', JSON.stringify(user));
                localStorage.setItem('sessionId', sessionId);
                localStorage.setItem('token', response.token);

                setCurrentUser(user);

                if (user.role === UserRole.SUPER_ADMIN) {
                    navigate('/super-admin');
                } else {
                    navigate('/dashboard');
                }
                return undefined;
            } else {
                return response.message || "Invalid email or password.";
            }
        } catch (error) {
            return "Login failed. Please check your credentials.";
        }
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
    const addLead = useCallback(async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'activities' | 'score' | 'closeDate'>) => {
        try {
            const newLeadData = {
                ...leadData,
                organizationId: currentOrganization!.id,
                activities: [],
                score: 0,
            };
            const newLead = await apiService.createLead(newLeadData);
            setLeads(prev => [newLead, ...prev]);
        } catch (error) {
            console.error('Failed to create lead:', error);
        }
    }, [currentOrganization]);
    const deleteLead = useCallback(async (leadId: string) => {
        try {
            await apiService.deleteLead(leadId);
            setLeads(prev => prev.filter(l => l.id !== leadId));
        } catch (error) {
            console.error('Failed to delete lead:', error);
        }
    }, []);

    const onUpdateLead = useCallback(async (updatedLead: Lead) => {
        try {
            const updated = await apiService.updateLead(updatedLead.id, updatedLead);
            setLeads(prev => prev.map(l => l.id === updatedLead.id ? updated : l));
        } catch (error) {
            console.error('Failed to update lead:', error);
        }
    }, []);

    const onUpdateTask = useCallback(async (updatedTask: Task) => {
        try {
            const updated = await apiService.updateTask(updatedTask.id, updatedTask);
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? updated : t));
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    }, []);

    const onAddTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'organizationId' | 'isCompleted' | 'assignedToId' | 'createdById'>, assignment?: { type: 'user' | 'team' | 'all'; id?: string | number }) => {
        if (assignment && currentUser && currentOrganization) {
            const usersToAssign: User[] = [];
            let batchId: string | undefined = undefined;

            if (assignment.type === 'user') {
                const user = userUsers.find(u => u.id === assignment.id);
                if (user) usersToAssign.push(user);
            } else if (assignment.type === 'all') {
                batchId = crypto.randomUUID();
                usersToAssign.push(...userUsers.filter(u => u.role !== UserRole.ADMIN && u.role !== UserRole.SUPER_ADMIN));
            } else if (assignment.type === 'team') {
                batchId = crypto.randomUUID();
                const team = userTeams.find(t => t.id === assignment.id);
                if (team) {
                    const memberUsers = userUsers.filter(u => team.memberIds.includes(u.id) || u.id === team.leadId);
                    usersToAssign.push(...memberUsers);
                }
            }

            const newTasks: Task[] = usersToAssign.map(user => ({
                ...(taskData as any),
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                organizationId: currentOrganization.id,
                isCompleted: false,
                assignedToId: user.id,
                createdById: currentUser.id,
                batchId: batchId,
            }));

            // Create tasks in backend
            for (const task of newTasks) {
                try {
                    await apiService.createTask(task);
                } catch (error) {
                    console.error('Failed to create task:', error);
                }
            }

            setTasks(prev => [...prev, ...newTasks]);
        } else { // Fallback for single task creation from other pages
            const newTask: Task = {
                ...(taskData as any),
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                organizationId: currentOrganization!.id,
                createdById: currentUser!.id,
            };

            try {
                await apiService.createTask(newTask);
                setTasks(prev => [newTask, ...prev]);
            } catch (error) {
                console.error('Failed to create task:', error);
            }
        }
    }, [currentUser, currentOrganization, userUsers, userTeams]);

    const onDeleteTask = useCallback(async (taskId: string) => {
        try {
            await apiService.deleteTask(taskId);
            setTasks(prev => prev.filter(task => task.id !== taskId));
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    }, []);

    const onScheduleMessage = useCallback(async (msgData: Omit<ScheduledMessage, 'id'|'organizationId'>) => {
        try {
            const newMsg: ScheduledMessage = {...msgData, id: crypto.randomUUID(), organizationId: currentOrganization!.id };
            // Update the lead with the scheduled message
            const lead = leads.find(l => l.id === newMsg.leadId);
            if (lead) {
                const updatedLead = {
                    ...lead,
                    scheduledMessages: [...(lead.scheduledMessages || []), newMsg]
                };
                await apiService.updateLead(lead.id, updatedLead);
                setLeads(prev => prev.map(l => l.id === newMsg.leadId ? updatedLead : l));
            }
        } catch (error) {
            console.error('Failed to schedule message:', error);
        }
    }, [currentOrganization, leads]);

    // --- Other CRUD functions for settings etc. ---
    const onSaveUser = useCallback(async (user: User) => {
        try {
            await apiService.updateUser(user.id.toString(), user);
            setUsers(prev => prev.map(u => u.id === user.id ? user : u));
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    }, []);

    const onAddStage = useCallback(async () => {
        try {
            const newStage = {
                id: crypto.randomUUID(),
                name: 'New Stage',
                color: '#cccccc',
                organizationId: currentOrganization!.id
            };
            await apiService.createStage(newStage);
            setStages(prev => [...prev, newStage]);
        } catch (error) {
            console.error('Failed to create stage:', error);
        }
    }, [currentOrganization]);

    const onUpdateStage = useCallback(async (id: string, field: 'name'|'color', value: string) => {
        try {
            const stage = stages.find(s => s.id === id);
            if (stage) {
                const updatedStage = { ...stage, [field]: value };
                await apiService.updateStage(id, updatedStage);
                setStages(prev => prev.map(s => s.id === id ? updatedStage : s));
            }
        } catch (error) {
            console.error('Failed to update stage:', error);
        }
    }, [stages]);

    const onDeleteStage = useCallback(async (id: string) => {
        try {
            await apiService.deleteStage(id);
            setStages(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            console.error('Failed to delete stage:', error);
        }
    }, []);

    const onAddCustomField = useCallback(async (type: CustomFieldDefinition['type']) => {
        try {
            const newField = {
                id: crypto.randomUUID(),
                name: 'New Field',
                type,
                isMappable: true,
                isRequired: false,
                organizationId: currentOrganization!.id
            };
            await apiService.createCustomField(newField);
            setCustomFieldDefs(prev => [...prev, newField]);
        } catch (error) {
            console.error('Failed to create custom field:', error);
        }
    }, [currentOrganization]);

    const onUpdateCustomField = useCallback(async (id: string, data: Partial<CustomFieldDefinition>) => {
        try {
            const field = customFieldDefs.find(f => f.id === id);
            if (field) {
                const updatedField = { ...field, ...data };
                await apiService.updateCustomField(id, updatedField);
                setCustomFieldDefs(prev => prev.map(f => f.id === id ? updatedField : f));
            }
        } catch (error) {
            console.error('Failed to update custom field:', error);
        }
    }, [customFieldDefs]);

    const onDeleteCustomField = useCallback(async (id: string) => {
        try {
            await apiService.deleteCustomField(id);
            setCustomFieldDefs(prev => prev.filter(f => f.id !== id));
        } catch (error) {
            console.error('Failed to delete custom field:', error);
        }
    }, []);

    const onSaveLeadScoreRule = useCallback(async (rule: LeadScoreRule) => {
        try {
            if(rule.id.startsWith('new_')) { // It's a new rule
                const newRule = {...rule, id: crypto.randomUUID()};
                await apiService.createLeadScoreRule(newRule);
                setLeadScoreRules(prev => [...prev, newRule]);
            } else {
                await apiService.createLeadScoreRule(rule); // This should be update, but API needs fixing
                setLeadScoreRules(prev => prev.map(r => r.id === rule.id ? rule : r));
            }
        } catch (error) {
            console.error('Failed to save lead score rule:', error);
        }
    }, []);

    const onDeleteLeadScoreRule = useCallback(async (id: string) => {
        try {
            // API doesn't have delete for lead score rules yet
            setLeadScoreRules(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error('Failed to delete lead score rule:', error);
        }
    }, []);

    const onSaveGlobalRule = useCallback(async (rule: GlobalAutomationRule) => {
        try {
            const exists = globalAutomationRules.some(r => r.id === rule.id);
            if (exists) {
                // API doesn't have update for global rules yet
                setGlobalAutomationRules(prev => prev.map(r => (r.id === rule.id ? rule : r)));
            } else {
                const newRule = { ...rule, id: crypto.randomUUID() };
                setGlobalAutomationRules(prev => [...prev, newRule]);
            }
        } catch (error) {
            console.error('Failed to save global rule:', error);
        }
    }, [globalAutomationRules]);

    const onDeleteGlobalRule = useCallback(async (ruleId: string) => {
        try {
            setGlobalAutomationRules(prev => prev.filter(r => r.id !== ruleId));
        } catch (error) {
            console.error('Failed to delete global rule:', error);
        }
    }, []);

    // ... many more CRUD functions would go here ...
    const onSaveAddon = useCallback(async (addon: Addon) => {
        try {
            const exists = addons.some(a => a.id === addon.id);
            if (exists) {
                setAddons(prev => prev.map(a => (a.id === addon.id ? addon : a)));
            } else {
                const newAddon = { ...addon, id: addon.id || crypto.randomUUID() };
                setAddons(prev => [...prev, newAddon]);
            }
        } catch (error) {
            console.error('Failed to save addon:', error);
        }
    }, [addons]);

    const onDeleteAddon = useCallback(async (addonId: string) => {
        try {
            setAddons(prev => prev.filter(a => a.id !== addonId));
        } catch (error) {
            console.error('Failed to delete addon:', error);
        }
    }, []);

    const onUpdateCurrentOrganization = useCallback(async (updatedFields: Partial<Organization>) => {
        if (currentOrganization) {
            try {
                const updatedOrg = { ...currentOrganization, ...updatedFields };
                await apiService.updateOrganization(currentOrganization.id, updatedOrg);
                setOrganizations(prev => prev.map(o => o.id === updatedOrg.id ? updatedOrg : o));
            } catch (error) {
                console.error('Failed to update organization:', error);
            }
        }
    }, [currentOrganization]);

    const onSaveFilter = useCallback(async (filter: Omit<SavedFilter, 'id' | 'organizationId'>) => {
        try {
            const newFilter: SavedFilter = { id: crypto.randomUUID(), ...filter, organizationId: currentOrganization!.id };
            setSavedFilters(prev => [...prev, newFilter]);
        } catch (error) {
            console.error('Failed to save filter:', error);
        }
    }, [currentOrganization]);

    const onBulkAssign = useCallback(async (leadIds: string[], assignedToId: number) => {
        try {
            // Update leads in backend
            for (const leadId of leadIds) {
                const lead = leads.find(l => l.id === leadId);
                if (lead) {
                    await apiService.updateLead(leadId, { ...lead, assignedToId });
                }
            }
            setLeads(prev => prev.map(l => leadIds.includes(l.id) ? {...l, assignedToId} : l));
        } catch (error) {
            console.error('Failed to bulk assign leads:', error);
        }
    }, [leads]);

    const onBulkDelete = useCallback(async (leadIds: string[]) => {
        try {
            // Delete leads from backend
            for (const leadId of leadIds) {
                await apiService.deleteLead(leadId);
            }
            setLeads(prev => prev.filter(l => !leadIds.includes(l.id)));
        } catch (error) {
            console.error('Failed to bulk delete leads:', error);
        }
    }, []);

    const onSaveRule = useCallback(async (rule: AutomationRule) => {
        try {
            if(rule.id) {
                setAutomationRules(prev => prev.map(r => r.id === rule.id ? rule : r));
            } else {
                const newRule = {...rule, id: crypto.randomUUID(), organizationId: currentOrganization!.id };
                setAutomationRules(prev => [...prev, newRule]);
            }
        } catch (error) {
            console.error('Failed to save automation rule:', error);
        }
    }, [currentOrganization]);

    const onDeleteRule = useCallback(async (id: string) => {
        try {
            setAutomationRules(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error('Failed to delete automation rule:', error);
        }
    }, []);

    const onSaveTeam = useCallback(async (team: Team) => {
        try {
            if(teams.some(t => t.id === team.id)) {
                setTeams(prev => prev.map(t => t.id === team.id ? team : t));
            } else {
                const newTeam = {...team, organizationId: currentOrganization!.id };
                setTeams(prev => [...prev, newTeam]);
            }
        } catch (error) {
            console.error('Failed to save team:', error);
        }
    }, [teams, currentOrganization]);

    const onDeleteTeam = useCallback(async (id: string) => {
        try {
            setTeams(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error('Failed to delete team:', error);
        }
    }, []);

    const onSaveWhatsAppTemplate = useCallback(async (template: WhatsAppTemplate) => {
        try {
            if(template.id) {
                setWhatsAppTemplates(prev => prev.map(t => t.id === template.id ? template : t));
            } else {
                const newTemplate = {...template, id: crypto.randomUUID(), organizationId: currentOrganization!.id };
                setWhatsAppTemplates(prev => [...prev, newTemplate]);
            }
        } catch (error) {
            console.error('Failed to save WhatsApp template:', error);
        }
    }, [currentOrganization]);

    const onDeleteWhatsAppTemplate = useCallback(async (id: string) => {
        try {
            setWhatsAppTemplates(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error('Failed to delete WhatsApp template:', error);
        }
    }, []);

    const onSaveChatbotConfig = useCallback(async (config: ChatbotConfig) => {
        try {
            setChatbotConfig(prev => prev.map(c => c.organizationId === config.organizationId ? config : c));
        } catch (error) {
            console.error('Failed to save chatbot config:', error);
        }
    }, []);

    const onToggleTracking = useCallback(async (userId: number) => {
        try {
            const user = users.find(u => u.id === userId);
            if (user) {
                const updatedUser = {...user, isTrackingEnabled: !user.isTrackingEnabled};
                await apiService.updateUser(userId.toString(), updatedUser);
                setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
            }
        } catch (error) {
            console.error('Failed to toggle tracking:', error);
        }
    }, [users]);

    const onSaveCallCampaign = useCallback(async (c: CallCampaign) => {
        try {
            if (c.id) {
                setCallCampaigns(p => p.map(i => i.id === c.id ? {...i, ...c} : i));
            } else {
                const newCampaign = {...c, id: crypto.randomUUID(), organizationId: currentOrganization!.id, recipientCount: 0, connectionRate: 0 } as CallCampaign;
                setCallCampaigns(p => [...p, newCampaign]);
            }
        } catch (error) {
            console.error('Failed to save call campaign:', error);
        }
    }, [currentOrganization]);

    const onDeleteCallCampaign = useCallback(async (id: string) => {
        try {
            setCallCampaigns(p => p.filter(i => i.id !== id));
        } catch (error) {
            console.error('Failed to delete call campaign:', error);
        }
    }, []);

    const onSaveCallScript = useCallback(async (s: CallScript) => {
        try {
            if (s.id) {
                setCallScripts(p => p.map(i => i.id === s.id ? s : i));
            } else {
                const newScript = {...s, id: crypto.randomUUID(), organizationId: currentOrganization!.id};
                setCallScripts(p => [...p, newScript]);
            }
        } catch (error) {
            console.error('Failed to save call script:', error);
        }
    }, [currentOrganization]);

    const onDeleteCallScript = useCallback(async (id: string) => {
        try {
            setCallScripts(p => p.filter(i => i.id !== id));
        } catch (error) {
            console.error('Failed to delete call script:', error);
        }
    }, []);

    const handleAddDomain = useCallback(async (domain: string) => {
        try {
            const newDomain = { id: crypto.randomUUID(), domain, status: 'pending' as const, organizationId: currentOrganization!.id };
            await apiService.createCustomDomain(newDomain);
            setCustomDomains(p => [...p, newDomain]);
        } catch (error) {
            console.error('Failed to add domain:', error);
        }
    }, [currentOrganization]);

    const handleDeleteDomain = useCallback(async (id: string) => {
        try {
            setCustomDomains(p => p.filter(d => d.id !== id));
        } catch (error) {
            console.error('Failed to delete domain:', error);
        }
    }, []);

    const handleVerifyDomain = useCallback(async (id: string) => {
        try {
            setCustomDomains(p => p.map(d => d.id === id ? {...d, status: 'verified'} : d));
        } catch (error) {
            console.error('Failed to verify domain:', error);
        }
    }, []);
    
    const handleSaveCustomWidget = useCallback(async (widget: CustomDashboardWidget) => {
        try {
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
        } catch (error) {
            console.error('Failed to save custom widget:', error);
        }
    }, []);

    const handleDeleteCustomWidget = useCallback(async (widgetId: string) => {
        try {
            setCustomDashboardWidgets(prev => prev.filter(w => w.id !== widgetId));
        } catch (error) {
            console.error('Failed to delete custom widget:', error);
        }
    }, []);

    // FIX: Define onSaveBlogPost and onDeleteBlogPost to resolve missing property errors.
    const onSaveBlogPost = useCallback(async (post: BlogPost) => {
        try {
            const exists = blogPosts.some(p => p.id === post.id);
            if (exists) {
                await apiService.updateBlogPost(post.id, post);
                setBlogPosts(prev => prev.map(p => p.id === post.id ? post : p));
            } else {
                const newPost = {...post, id: post.id || crypto.randomUUID() };
                await apiService.createBlogPost(newPost);
                setBlogPosts(prev => [newPost, ...prev]);
            }
        } catch (error) {
            console.error('Failed to save blog post:', error);
        }
    }, [blogPosts]);

    const onDeleteBlogPost = useCallback(async (postId: string) => {
        try {
            await apiService.deleteBlogPost(postId);
            setBlogPosts(prev => prev.filter(p => p.id !== postId));
        } catch (error) {
            console.error('Failed to delete blog post:', error);
        }
    }, []);

    const onSaveCoupon = useCallback(async (coupon: Coupon) => {
        try {
            const exists = coupons.some(c => c.id === coupon.id);
            if (exists) {
                setCoupons(prev => prev.map(c => c.id === coupon.id ? coupon : c));
            } else {
                const newCoupon = { ...coupon, id: coupon.id || crypto.randomUUID() };
                setCoupons(prev => [...prev, newCoupon]);
            }
        } catch (error) {
            console.error('Failed to save coupon:', error);
        }
    }, [coupons]);

    const onDeleteCoupon = useCallback(async (couponId: string) => {
        try {
            setCoupons(prev => prev.filter(c => c.id !== couponId));
        } catch (error) {
            console.error('Failed to delete coupon:', error);
        }
    }, []);

    const onUpdateOfferStrip = useCallback(async (strip: OfferStrip) => {
        try {
            setOfferStrip(strip);
        } catch (error) {
            console.error('Failed to update offer strip:', error);
        }
    }, []);

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
        return <SuperAdminDashboard {...{ organizations, users, leads, tasks, subscriptionPlans, supportTickets, auditLogs, globalAnnouncement, addons, systemHealthData, apiUsageLogs, errorLogs, globalAutomationRules, onSaveGlobalRule, onDeleteGlobalRule, globalEmailTemplates, homepageContent, customDomains, blogPosts, inquiries, setInquiries, setLeads, onSaveBlogPost, onDeleteBlogPost, onLogout: handleLogout, onAddOrganization: (org) => setOrganizations(prev => [...prev, { ...org, id: crypto.randomUUID(), apiKey: crypto.randomUUID(), isEnabled: true, subscriptionPlanId: 'plan_free', subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}]), onUpdateOrganization: (org) => setOrganizations(prev => prev.map(o => o.id === org.id ? org : o)), onDeleteOrganization: (id) => setOrganizations(prev => prev.filter(o => o.id !== id)), onSaveSubscriptionPlan: (plan) => setSubscriptionPlans(prev => prev.map(p => p.id === plan.id ? plan : p)), onDeleteSubscriptionPlan: (id) => setSubscriptionPlans(prev => prev.filter(p => p.id !== id)), onUpdateTicketStatus: (id, status) => setSupportTickets(prev => prev.map(t => t.id === id ? {...t, status} : t)), onSaveAnnouncement: setGlobalAnnouncement, onSaveUser, globalIntegrationStatus, onUpdateGlobalIntegrationStatus: setGlobalIntegrationStatus, localizationSettings, onUpdateLocalizationSettings: setLocalizationSettings, onUpdateHomepageContent: setHomepageContent, onDeleteCustomDomain: handleDeleteDomain, onVerifyCustomDomain: handleVerifyDomain, paymentGatewaySettings, onUpdatePaymentGatewaySettings: setPaymentGatewaySettings, coupons, onSaveCoupon, onDeleteCoupon, offerStrip, onUpdateOfferStrip, onSaveAddon, onDeleteAddon, pricingComparisonData, onUpdatePricingComparisonData: setPricingComparisonData }} />
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
                onImportLeads={async (imported) => { console.log('Imported leads (simulated)', imported); const fakeLeads = Array.from({length: 5}, () => ({...leads[0], id: crypto.randomUUID(), organizationId: currentOrganization.id})); setLeads(p => [...p, ...fakeLeads]); }}
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
                 <Route path="email" element={<EmailPage templates={userEmailTemplates} campaigns={userEmailCampaigns} onSaveTemplate={async (t) => { if (t.id) { setEmailTemplates(p => p.map(i => i.id === t.id ? t : i)); } else { const newTemplate = {...t, id: crypto.randomUUID(), organizationId: currentOrganization.id}; setEmailTemplates(p => [...p, newTemplate]); } }} onDeleteTemplate={(id) => setEmailTemplates(p => p.filter(i => i.id !== id))} onSaveCampaign={async (c) => { if (c.id) { setEmailCampaigns(p => p.map(i => i.id === c.id ? {...i, ...c} : i)); } else { const newCampaign = {...c, id: crypto.randomUUID(), organizationId: currentOrganization.id, recipientCount: 0, openRate: 0 } as EmailCampaign; setEmailCampaigns(p => [...p, newCampaign]); } }} onDeleteCampaign={(id) => setEmailCampaigns(p => p.filter(i => i.id !== id))} users={userUsers} pipelineStages={userStages} customFieldDefs={userCustomFieldDefs} />} />
                 <Route path="sms" element={<SMSPage templates={userSmsTemplates} campaigns={userSmsCampaigns} onSaveTemplate={async (t) => { if (t.id) { setSmsTemplates(p => p.map(i => i.id === t.id ? t : i)); } else { const newTemplate = {...t, id: crypto.randomUUID(), organizationId: currentOrganization.id}; setSmsTemplates(p => [...p, newTemplate]); } }} onDeleteTemplate={(id) => setSmsTemplates(p => p.filter(i => i.id !== id))} onSaveCampaign={async (c) => { if (c.id) { setSmsCampaigns(p => p.map(i => i.id === c.id ? {...i, ...c} : i)); } else { const newCampaign = {...c, id: crypto.randomUUID(), organizationId: currentOrganization.id, recipientCount: 0, deliveryRate: 0 } as SMSCampaign; setSmsCampaigns(p => [...p, newCampaign]); } }} onDeleteCampaign={(id) => setSmsCampaigns(p => p.filter(i => i.id !== id))} users={userUsers} pipelineStages={userStages} customFieldDefs={userCustomFieldDefs} />} />
                {userChatbotConfig && <Route path="whatsapp" element={<WhatsAppPage 
                    templates={userWhatsAppTemplates} 
                    onSaveTemplate={onSaveWhatsAppTemplate} 
                    onDeleteTemplate={onDeleteWhatsAppTemplate} 
                    chatbotConfig={userChatbotConfig} 
                    onSaveChatbotConfig={onSaveChatbotConfig} 
                    customFieldDefs={userCustomFieldDefs} 
                    campaigns={userWhatsAppCampaigns}
                    onSaveCampaign={async (c) => { if (c.id) { setWhatsAppCampaigns(p => p.map(i => i.id === c.id ? {...i, ...c} : i)); } else { const newCampaign = {...c, id: crypto.randomUUID(), organizationId: currentOrganization.id, recipientCount: 0, deliveryRate: 0 } as WhatsAppCampaign; setWhatsAppCampaigns(p => [...p, newCampaign]); } }}
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
                <Route path="integrations" element={<IntegrationsPage logs={userIntegrationLogs} settings={userIntegrationSettings} setSettings={setIntegrationSettings} customFieldDefs={userCustomFieldDefs} currentOrganization={currentOrganization} webhooks={userWebhooks} onAddWebhook={async (name) => { const newWebhook = {id: crypto.randomUUID(), name, url: `https://api.example.com/wh/${crypto.randomUUID()}`, isEnabled: true, organizationId: currentOrganization.id}; setWebhooks(p => [...p, newWebhook]); }} onDeleteWebhook={(id) => setWebhooks(p => p.filter(w => w.id !== id))} onUpdateWebhook={(wh) => setWebhooks(p => p.map(w => w.id === wh.id ? wh : w))} onSendTestLead={(source, form) => alert(`Test lead sent from ${source}: ${form}`)} syncFacebookLeads={() => alert('Syncing recent leads...')} />} />
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



