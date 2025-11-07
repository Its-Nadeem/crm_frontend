

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate, Outlet } from 'react-router-dom';
import { User, Lead, Task, UserRole, IntegrationLog, Activity, Stage, AutomationRule, CustomFieldDefinition, FollowUpStatus, Permission, Team, IntegrationSettings, IntegrationSource, WhatsAppTemplate, SavedFilter, ChatbotConfig, UserSessionLog, LeadSource, Organization, WebhookConfig, ScheduledMessage, EmailTemplate, EmailCampaign, ConnectedFacebookAccount, SMSTemplate, SMSCampaign, LeadScoreRule, SubscriptionPlan, SupportTicket, AuditLog, GlobalAnnouncement, Addon, SystemHealthMetric, ApiUsageLog, ErrorLog, GlobalAutomationRule, GlobalIntegrationStatus, LocalizationSettings, HomepageContent, BillingHistory, WhatsAppCampaign, CallScript, CallCampaign, CustomDashboardWidget, BlogPost, PaymentGatewaySetting, Inquiry, GlobalEmailTemplate, Coupon, OfferStrip, PricingCategory } from './types';
import { apiService } from './services/api';
import Dashboard from '../components/pages/Dashboard';
import LeadListPage from '../components/pages/LeadListPage';
import UserManagementPage from '../components/pages/UserManagementPage';
import IntegrationsPage from '../components/pages/IntegrationsPage';
import TasksPage from '../components/pages/TasksPage';
import SettingsPage from '../components/pages/SettingsPage';
import AutomationPage from '../components/pages/AutomationPage';
import TeamsPage from '../components/pages/TeamsPage';
import WhatsAppPage from '../components/pages/WhatsAppPage';
import LoginPage from './components/pages/LoginPage';
import TrackingDashboard from '../components/pages/TrackingDashboard';
import SuperAdminDashboard from '../components/pages/SuperAdminDashboard';
import EmailPage from '../components/pages/EmailPage';
import SMSPage from './components/pages/SMSPage';
import ReportsPage from '../components/pages/ReportsPage';
import CallPage from '../components/pages/CallPage';
import { AppIcons } from './components/ui/Icons';
import HomePage from '../components/pages/HomePage';
import LeadDetailPage from '../components/pages/LeadDetailPage';
import SettingsLayout from '../components/layouts/SettingsLayout';
import MarketingLayout from '../components/layouts/CampaignsLayout';
import PublicLayout from '../components/layouts/PublicLayout';
import BlogListPage from '../components/pages/BlogListPage';
import BlogPostPage from '../components/pages/BlogPostPage';
import PricingPage from '../components/pages/PricingPage';

// Standalone layout for lead detail pages (no sidebar)
const StandaloneLeadLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen bg-background text-on-surface">
            <div className="flex justify-between items-center p-4 border-b border-muted bg-surface">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
                    <h1 className="text-xl font-bold">Lead Details</h1>
                </div>
                <button
                    onClick={() => window.close()}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Close Tab
                </button>
            </div>
            <main className="flex-1 p-4 md:p-8">
                {children}
            </main>
        </div>
    );
};


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
    const [tenantContext, setTenantContext] = useState<any>(null);
    const [isLoadingContext, setIsLoadingContext] = useState(false);

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
                console.log('Fetched tasks:', data);
                // Ensure _id field is preserved if it exists
                setTasks(data.map((task: any) => ({ ...task, _id: task._id })));
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

    // Load tenant context from backend
    const loadTenantContext = useCallback(async () => {
        if (!currentUser) return;

        setIsLoadingContext(true);
        try {
            const context = await apiService.getTenantContext();
            setTenantContext(context);

            // Update organization from context
            if (context.orgId) {
                const org = organizations.find(o => o.id === context.orgId);
                if (org) {
                    setCurrentOrganization(org);
                }
            }
        } catch (error) {
            console.error('Failed to load tenant context:', error);
            // If context fails, try to fall back to local organization data
            if (currentUser) {
                const org = organizations.find(o => o.id === currentUser.organizationId);
                setCurrentOrganization(org || null);
            }
        } finally {
            setIsLoadingContext(false);
        }
    }, [currentUser, organizations]);

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

    // Load tenant context when user is set
    useEffect(() => {
        if (currentUser && organizations.length > 0) {
            loadTenantContext();
        }
    }, [currentUser, organizations.length, loadTenantContext]);

    useEffect(() => {
        localStorage.setItem('customDashboardWidgets', JSON.stringify(customDashboardWidgets));
    }, [customDashboardWidgets]);

    useEffect(() => {
        document.documentElement.className = theme;
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        if(currentUser && !tenantContext) {
            // Only set organization from local data if we don't have tenant context
            const org = organizations.find(o => o.id === currentUser.organizationId);
            console.log('Setting current organization from local data:', {
                userOrgId: currentUser.organizationId,
                foundOrg: org ? {
                    id: org.id,
                    name: org.name,
                    subscriptionPlanId: org.subscriptionPlanId,
                    subscriptionExpiresAt: org.subscriptionExpiresAt
                } : null,
                allOrgs: organizations.map(o => ({ id: o.id, plan: o.subscriptionPlanId }))
            });
            setCurrentOrganization(org || null);
        } else if (tenantContext) {
            // Use organization from tenant context (server-side source of truth)
            const org = organizations.find(o => o.id === tenantContext.orgId);
            if (org) {
                console.log('Setting current organization from tenant context:', {
                    orgId: tenantContext.orgId,
                    orgName: tenantContext.orgName,
                    plan: tenantContext.plan
                });
                setCurrentOrganization(org);
            }
        } else {
            setCurrentOrganization(null);
        }
    }, [currentUser, organizations, tenantContext]);

    // Load organizations from API when user logs in
    useEffect(() => {
        if (currentUser && currentUser.role !== UserRole.SUPER_ADMIN) {
            const loadOrganizations = async () => {
                try {
                    console.log('Loading organization data for user:', currentUser.id);
                    const orgsData = await apiService.getOrganizations();
                    console.log('Raw organizations data:', orgsData);
                    setOrganizations(orgsData);
                    console.log('Organizations loaded:', orgsData.length, 'organizations');

                    // Debug: Check org-1 specifically
                    const org1 = orgsData.find((org: Organization) => org.id === 'org-1');
                    if (org1) {
                        console.log('org-1 details:', {
                            id: org1.id,
                            name: org1.name,
                            subscriptionPlanId: org1.subscriptionPlanId,
                            subscriptionExpiresAt: org1.subscriptionExpiresAt,
                            manuallyAssignedFeatures: org1.manuallyAssignedFeatures
                        });
                    } else {
                        console.warn('org-1 not found in loaded organizations');
                    }
                } catch (error) {
                    console.error('Failed to load organization data:', error);
                }
            };
            loadOrganizations();
        }
    }, [currentUser]);

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    // FIX: Made handleLogin async to match the prop type required by LoginPage.
    const handleLogin = useCallback(async (email: string, pass: string): Promise<string | undefined> => {
        try {
            const response = await apiService.login(email, pass);

            if (response.token) {
                const user = response;
                const sessionId = crypto.randomUUID();
                const activeSessions: Record<number, string> = JSON.parse(localStorage.getItem('activeSessions') || '{}');

                activeSessions[user.id] = sessionId;
                localStorage.setItem('activeSessions', JSON.stringify(activeSessions));
                localStorage.setItem('currentUser', JSON.stringify(user));
                localStorage.setItem('sessionId', sessionId);
                localStorage.setItem('token', response.token);

                // Store refresh token if provided
                if (response.refreshToken) {
                    localStorage.setItem('refreshToken', response.refreshToken);
                }

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
        // Use tenant context if available (server-side source of truth)
        if (tenantContext?.plan?.features) {
            // Check subscription expiration from tenant context
            const now = new Date();
            const expirationDate = new Date(tenantContext.plan.expiresAt);
            if (now > expirationDate) {
                console.warn('Subscription expired for organization:', tenantContext.orgId);
                return false; // Subscription expired
            }

            return tenantContext.plan.features.includes(feature);
        }

        // Fallback to local organization data if tenant context not loaded yet
        if (!currentOrganization) return false;

        // Special case: org-1 always has enterprise features
        if (currentOrganization.id === 'org-1') {
            return true; // Enterprise plan has all features
        }

        // Check for manually assigned features first
        if (currentOrganization.manuallyAssignedFeatures?.includes(feature)) {
            return true;
        }

        // Check subscription expiration
        const now = new Date();
        const expirationDate = new Date(currentOrganization.subscriptionExpiresAt);
        if (now > expirationDate) {
            console.warn('Subscription expired for organization:', currentOrganization.id);
            return false; // Subscription expired
        }

        const plan = subscriptionPlans.find(p => p.id === currentOrganization.subscriptionPlanId);
        return plan?.features.includes(feature) ?? false;
    }, [tenantContext, currentOrganization, subscriptionPlans]);
    
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

    const onUpdateLead = useCallback(async (updatedLead: Lead, oldLead?: Lead) => {
        try {
            // If this lead has _id and it's different from the original, it's from API
            if (updatedLead._id && oldLead) {
                // This is an API response with changes, just update local state
                console.log('Updating lead in local state only (API response with changes)');
                setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
            } else if (updatedLead._id && !oldLead) {
                // This is likely already a complete API response, just update local state
                console.log('Updating lead in local state only (complete API response)');
                setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
            } else {
                // This is a local update that needs API call
                console.log('Making API call to update lead:', updatedLead.id);
                const updated = await apiService.updateLead(updatedLead.id, updatedLead);
                setLeads(prev => prev.map(l => l.id === updatedLead.id ? updated : l));
                return true; // Indicate success
            }
        } catch (error) {
            console.error('Failed to update lead:', error);
            // Fallback: just update local state even if API fails
            setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
            throw error; // Re-throw to allow component to handle error
        }
        return true;
    }, []);

    const onRefreshLeadById = useCallback(async (leadId: string): Promise<Lead | undefined> => {
        try {
            console.log('Refreshing lead from backend:', leadId);
            const refreshedLead = await apiService.getLeadById(leadId);
            if (refreshedLead) {
                console.log('Successfully refreshed lead:', refreshedLead.id);
                setLeads(prev => {
                    const existingIndex = prev.findIndex(l => l.id === leadId);
                    if (existingIndex >= 0) {
                        // Update existing lead
                        const updated = [...prev];
                        updated[existingIndex] = refreshedLead;
                        console.log('Updated existing lead in state');
                        return updated;
                    } else {
                        // Add new lead if it doesn't exist
                        console.log('Adding new lead to state');
                        return [refreshedLead, ...prev];
                    }
                });
                return refreshedLead;
            } else {
                console.log('Lead not found in backend:', leadId);
                return undefined;
            }
        } catch (error) {
            console.error('Failed to refresh lead:', error);
            return undefined;
        }
    }, []);

    const onUpdateTask = useCallback(async (updatedTask: Task) => {
        try {
            console.log('Updating task:', updatedTask);
            // Use _id (MongoDB ID) for the API call, but fall back to id if _id is not available
            const taskId = updatedTask._id || updatedTask.id;
            console.log('Using taskId for API call:', taskId, '(_id:', updatedTask._id, ', id:', updatedTask.id, ')');

            // Optimistically update the UI first
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? { ...updatedTask, _id: updatedTask._id } : t));
            console.log('Optimistically updated local state');

            const updated = await apiService.updateTask(taskId, updatedTask);
            console.log('Task updated successfully:', updated);

            // Update with server response
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? updated : t));
            console.log('Updated with server response');
        } catch (error) {
            console.error('Failed to update task:', error);
            // Revert optimistic update on error
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? { ...t, isCompleted: !t.isCompleted } : t));
            console.log('Reverted optimistic update due to error');
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

    const onAddNote = useCallback(async (noteData: { content: string; leadId: string }) => {
        try {
            await apiService.createNote(noteData);
            // Refresh leads to get updated activities
            const lead = leads.find(l => l.id === noteData.leadId);
            if (lead) {
                const refreshedLead = await apiService.getLeadById(noteData.leadId);
                if (refreshedLead) {
                    setLeads(prev => prev.map(l => l.id === noteData.leadId ? refreshedLead : l));
                }
            }
        } catch (error) {
            console.error('Failed to create note:', error);
        }
    }, [leads]);

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

    if (isAuthenticating || (currentUser && isLoadingContext)) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-on-surface">
                <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-lg font-medium">
                    {isAuthenticating ? 'Authenticating...' : 'Loading workspace...'}
                </p>
                <p className="text-sm text-subtle mt-2">
                    {isAuthenticating ? 'Please wait while we verify your session' : 'Setting up your workspace'}
                </p>
            </div>
        );
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
        return <SuperAdminDashboard {...{ organizations, users, leads, tasks, subscriptionPlans, supportTickets, auditLogs, globalAnnouncement, addons, systemHealthData, apiUsageLogs, errorLogs, globalAutomationRules, onSaveGlobalRule, onDeleteGlobalRule, globalEmailTemplates, homepageContent, blogPosts, inquiries, setInquiries, setLeads, onSaveBlogPost, onDeleteBlogPost, onLogout: handleLogout, onAddOrganization: (org) => setOrganizations(prev => [...prev, { ...org, id: crypto.randomUUID(), apiKey: crypto.randomUUID(), isEnabled: true, subscriptionPlanId: 'plan_free', subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}]), onUpdateOrganization: (org) => setOrganizations(prev => prev.map(o => o.id === org.id ? org : o)), onDeleteOrganization: (id) => setOrganizations(prev => prev.filter(o => o.id !== id)), onSaveSubscriptionPlan: (plan) => setSubscriptionPlans(prev => prev.map(p => p.id === plan.id ? plan : p)), onDeleteSubscriptionPlan: (id) => setSubscriptionPlans(prev => prev.filter(p => p.id !== id)), onUpdateTicketStatus: (id, status) => setSupportTickets(prev => prev.map(t => t.id === id ? {...t, status} : t)), onSaveAnnouncement: setGlobalAnnouncement, onSaveUser, globalIntegrationStatus, onUpdateGlobalIntegrationStatus: setGlobalIntegrationStatus, localizationSettings, onUpdateLocalizationSettings: setLocalizationSettings, onUpdateHomepageContent: setHomepageContent, paymentGatewaySettings, onUpdatePaymentGatewaySettings: setPaymentGatewaySettings, coupons, onSaveCoupon, onDeleteCoupon, offerStrip, onUpdateOfferStrip, onSaveAddon, onDeleteAddon, pricingComparisonData, onUpdatePricingComparisonData: setPricingComparisonData }} />
    }

    if (!currentOrganization && !isLoadingContext) {
        return <div className="h-screen w-screen flex items-center justify-center bg-background text-on-surface">Loading workspace...</div>;
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
            <Route path="/leads/:leadId" element={
                <StandaloneLeadLayout>
                    <LeadDetailPage
                        leads={userLeads} users={userUsers} pipelineStages={userStages} customFieldDefs={userCustomFieldDefs}
                        tasks={userTasks} whatsAppTemplates={userWhatsAppTemplates} smsTemplates={userSmsTemplates}
                        currentUser={currentUser}
                        onUpdateLead={(lead) => onUpdateLead(lead)} onUpdateTask={onUpdateTask} onAddTask={onAddTask} onAddNote={onAddNote} onScheduleMessage={onScheduleMessage}
                        onRefreshLeadById={onRefreshLeadById}
                        isDedicatedPage={true}
                    />
                </StandaloneLeadLayout>
            } />
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
                <Route path="integrations" element={<IntegrationsPage logs={userIntegrationLogs} settings={userIntegrationSettings} setSettings={setIntegrationSettings} customFieldDefs={userCustomFieldDefs} currentOrganization={currentOrganization} webhooks={userWebhooks} onAddWebhook={async (webhookData: Partial<WebhookConfig>) => { const newWebhook = {id: crypto.randomUUID(), name: webhookData.name || 'New Webhook', url: `https://api.example.com/wh/${crypto.randomUUID()}`, isEnabled: true, organizationId: currentOrganization.id, events: ['lead.created']} as unknown as WebhookConfig; setWebhooks(p => [...p, newWebhook as any]); }} onDeleteWebhook={(id) => setWebhooks(p => p.filter(w => w.id !== id))} onUpdateWebhook={(wh) => setWebhooks(p => p.map(w => w.id === wh.id ? wh : w))} onSendTestLead={(source, form) => alert(`Test lead sent from ${source}: ${form}`)} syncFacebookLeads={() => alert('Syncing recent leads...')} />} />
                <Route path="automation" element={<AutomationPage rules={userAutomationRules} users={userUsers} teams={userTeams} customFieldDefs={userCustomFieldDefs} pipelineStages={userStages} onSaveRule={onSaveRule} onDeleteRule={onDeleteRule} />} />
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



