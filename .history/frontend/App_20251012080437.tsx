import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate, Outlet } from 'react-router-dom';
import { User, Lead, Task, UserRole, IntegrationLog, Activity, Stage, AutomationRule, CustomFieldDefinition, FollowUpStatus, Permission, Team, IntegrationSettings, IntegrationSource, WhatsAppTemplate, SavedFilter, ChatbotConfig, UserSessionLog, LeadSource, Organization, WebhookConfig, ScheduledMessage, EmailTemplate, EmailCampaign, ConnectedFacebookAccount, SMSTemplate, SMSCampaign, LeadScoreRule, SubscriptionPlan, SupportTicket, AuditLog, GlobalAnnouncement, Addon, SystemHealthMetric, ApiUsageLog, ErrorLog, GlobalAutomationRule, GlobalIntegrationStatus, LocalizationSettings, HomepageContent, BillingHistory, WhatsAppCampaign, CallScript, CallCampaign, CustomDashboardWidget, BlogPost, PaymentGatewaySetting, Inquiry, GlobalEmailTemplate, Coupon, OfferStrip, PricingCategory } from './types';
import { HOMEPAGE_CONTENT, HOMEPAGE_BLOG_POSTS, HOMEPAGE_PRICING_DATA, DEFAULT_OFFER_STRIP } from './homepage-content';
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
import HomePage from './components/pages/HomePage';
import LeadDetailPage from './components/pages/LeadDetailPage';
import SettingsLayout from './components/layouts/SettingsLayout';
import MarketingLayout from './components/layouts/CampaignsLayout';
import PublicLayout from './components/layouts/PublicLayout';
import BlogListPage from './components/pages/BlogListPage';
import BlogPostPage from './components/pages/BlogPostPage';
import { faker } from '@faker-js/faker';
import PricingPage from './components/pages/PricingPage';

const API_BASE_URL = 'http://localhost:5000/api';


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

    const navItems: { path: string; icon?: React.ReactElement<{ className?: string }>; name: string; permission?: Permission; feature?: SubscriptionPlan['features'][0]; subItems?: { path: string; name: string; feature?: SubscriptionPlan['features'][0] }[]; isOrgFeature?: boolean }[] = [
        { path: '/dashboard', icon: <AppIcons.Dashboard />, name: 'Leads Dashboard', feature: 'DASHBOARD' },
        { path: '/reports', icon: <AppIcons.Reports />, name: 'Reports', feature: 'REPORTS' },
// FIX: AppIcons.Activity was not found, added to Icons.tsx.
        { path: '/tracking', icon: <AppIcons.Activity />, name: 'Tracking Dashboard', permission: Permission.VIEW_TRACKING_DASHBOARD, feature: 'TRACKING' },
        { path: '/leads', icon: <AppIcons.Leads />, name: 'Leads', feature: 'LEADS' },
        { path: '/tasks', icon: <AppIcons.Tasks />, name: 'Tasks', feature: 'TASKS' },
        {
// FIX: AppIcons.Marketing was not found, added to Icons.tsx.
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
// FIX: AppIcons.Note was not found, replaced with AppIcons.Blog.
        { path: '/blog', icon: <AppIcons.Blog />, name: 'Blog', isOrgFeature: true },
    ];

    const visibleNavItems = navItems.filter(item => {
        if (item.isOrgFeature) {
            return !!currentOrganization?.hasBlogAccess;
        }
        return true;
    });

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
                        {/* FIX: AppIcons.Logout was not found, added to Icons.tsx. */}
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
        {/* FIX: AppIcons.Menu was not found, added to Icons.tsx. */}
        <button onClick={onMenuClick}><AppIcons.Menu className="h-6 w-6" /></button>
    </div>
);

const App: React.FC = () => {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(true);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
    const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('authToken'));

    // All app data state, initialized empty
    const [users, setUsers] = useState<User[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [stages, setStages] = useState<Stage[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [integrationLogs, setIntegrationLogs] = useState<IntegrationLog[]>([]);
    const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
    const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDefinition[]>([]);
    const [whatsAppTemplates, setWhatsAppTemplates] = useState<WhatsAppTemplate[]>([]);
    const [smsTemplates, setSmsTemplates] = useState<SMSTemplate[]>([]);
    const [chatbotConfig, setChatbotConfig] = useState<ChatbotConfig | null>(null);
    const [userSessionLogs, setUserSessionLogs] = useState<UserSessionLog[]>([]);
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
    const [homepageContent, setHomepageContent] = useState<HomepageContent>(HOMEPAGE_CONTENT);
    const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
    const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>(HOMEPAGE_BLOG_POSTS);
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [offerStrip, setOfferStrip] = useState<OfferStrip | null>(null);
    const [pricingComparisonData, setPricingComparisonData] = useState<PricingCategory[]>(HOMEPAGE_PRICING_DATA);
    const [customDashboardWidgets, setCustomDashboardWidgets] = useState<CustomDashboardWidget[]>([]);
    
    const navigate = useNavigate();
    
    // Centralized API request function
    const apiRequest = useCallback(async (url: string, method = 'GET', body: any = null) => {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        const options: RequestInit = { method, headers };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(url, options);
        if (response.status === 401) {
             // Token is invalid or expired, log out the user
            handleLogout();
        }
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }
        if (response.status === 204) { // No Content
            return null;
        }
        return response.json();
    }, [authToken]);

    // Check for existing session on initial load
    useEffect(() => {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser && authToken) {
            setCurrentUser(JSON.parse(savedUser));
        }
        setIsAuthenticating(false);
    }, [authToken]);
    
    // Fetch all application data after login
    useEffect(() => {
        const fetchData = async () => {
            if (currentUser && authToken) {
                try {
                    setIsDataLoading(true);
                    let dataUrl = '/api/data/app-data';
                    if (currentUser.role === UserRole.SUPER_ADMIN) {
                        dataUrl = '/api/data/super-admin-data';
                    }
                    
                    const appData = await apiRequest(dataUrl);

                    // Set all state from fetched data
                    setOrganizations(appData.organizations || []);
                    setUsers(appData.users || []);
                    setLeads(appData.leads || []);
                    setTasks(appData.tasks || []);
                    setTeams(appData.teams || []);
                    setStages(appData.stages || []);
                    setIntegrationLogs(appData.integrationLogs || []);
                    setAutomationRules(appData.automationRules || []);
                    setCustomFieldDefs(appData.customFieldDefs || []);
                    setWhatsAppTemplates(appData.whatsAppTemplates || []);
                    setSmsTemplates(appData.smsTemplates || []);
                    setChatbotConfig(appData.chatbotConfig || null);
                    setUserSessionLogs(appData.userSessionLogs || []);
                    setIntegrationSettings(appData.integrationSettings || []);
                    setWebhooks(appData.webhooks || []);
                    setEmailTemplates(appData.emailTemplates || []);
                    setEmailCampaigns(appData.emailCampaigns || []);
                    setSmsCampaigns(appData.smsCampaigns || []);
                    setWhatsAppCampaigns(appData.whatsAppCampaigns || []);
                    setCallScripts(appData.callScripts || []);
                    setCallCampaigns(appData.callCampaigns || []);
                    setLeadScoreRules(appData.leadScoreRules || []);
                    setSupportTickets(appData.supportTickets || []);
                    setAuditLogs(appData.auditLogs || []);
                    setBillingHistory(appData.billingHistory || []);
                    setSavedFilters(appData.savedFilters || []);

                    // Load subscription plans for all users (needed for feature checking)
                    setSubscriptionPlans(appData.subscriptionPlans || []);

                    // Super Admin specific data
                    if (currentUser.role === UserRole.SUPER_ADMIN) {
                        setSystemHealthData(appData.systemHealthData || []);
                        setApiUsageLogs(appData.apiUsageLogs || []);
                        setErrorLogs(appData.errorLogs || []);
                        setGlobalAutomationRules(appData.globalAutomationRules || []);
                        setGlobalEmailTemplates(appData.globalEmailTemplates || []);
                        setGlobalIntegrationStatus(appData.globalIntegrationStatus || []);
                        setLocalizationSettings(appData.localizationSettings || null);
                        setPaymentGatewaySettings(appData.paymentGatewaySettings || []);
                        setInquiries(appData.inquiries || []);
                        setBlogPosts(appData.blogPosts || []);
                        setCoupons(appData.coupons || []);
                        setOfferStrip(appData.offerStrip || DEFAULT_OFFER_STRIP);
                        setPricingComparisonData(appData.pricingComparisonData || []);
                        setAddons(appData.addons || []);
                    }

                } catch (error) {
                    console.error("Failed to fetch app data:", error);
                    handleLogout();
                } finally {
                    setIsDataLoading(false);
                }
            } else if (!authToken) {
                setIsDataLoading(false);
                setIsAuthenticating(false);
            }
        };
        fetchData();
    }, [currentUser, authToken, apiRequest]);


    useEffect(() => {
        document.documentElement.className = theme;
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        if(currentUser && organizations.length > 0) {
            const org = organizations.find(o => o.id === currentUser.organizationId);
            if (org) {
                console.log('Organization found and loaded:', org);
                setCurrentOrganization(org);
            } else {
                console.warn('Organization not found for user:', {
                    userId: currentUser.id,
                    userOrgId: currentUser.organizationId,
                    availableOrgs: organizations.map(o => ({ id: o.id, name: o.name }))
                });
                setCurrentOrganization(null);
            }
        } else if (!currentUser) {
            setCurrentOrganization(null);
        }
    }, [currentUser, organizations]);

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

// FIX: Made handleLogin async to match the prop type required by LoginPage.
    const handleLogin = useCallback(async (email: string, pass: string): Promise<string | undefined> => {
        try {
            // Use the apiService.login method instead of apiRequest for proper response handling
            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password: pass }),
            });

            if (!response.ok) {
                let errorText = 'Unknown error';
                try {
                    errorText = await response.text();
                } catch (e) {
                    errorText = 'Failed to read error response';
                }

                let errorMessage = 'Login failed';
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    if (errorText && errorText.length > 0 && errorText !== 'Failed to read error response') {
                        errorMessage = errorText;
                    }
                }

                if (response.status === 401) {
                    throw new Error('Invalid email or password');
                }
                if (response.status >= 500) {
                    throw new Error('Server error. Please check if the backend server is running.');
                }
                throw new Error(errorMessage);
            }

            let result;
            try {
                const responseText = await response.text();
                if (!responseText.trim()) {
                    throw new Error('Empty response from server');
                }
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Login JSON Parse Error:', parseError);
                throw new Error(`Invalid response from server: ${parseError.message}`);
            }

            if (!result.success) {
                throw new Error(result.message || 'Login failed');
            }

            // Handle both old format (direct user data) and new format ({ success: true, data: userData })
            const userData = result.data || result;

            localStorage.setItem('currentUser', JSON.stringify(userData));
            localStorage.setItem('authToken', userData.token);
            setAuthToken(userData.token);
            setCurrentUser(userData);

            if (userData.role === UserRole.SUPER_ADMIN) {
                navigate('/super-admin');
            } else {
                navigate('/dashboard');
            }
            return undefined;
        } catch (error: any) {
            return error.message || "An unknown error occurred.";
        }
    }, [navigate]);

    const handleLogout = useCallback(() => {
        setCurrentUser(null);
        setAuthToken(null);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        navigate('/login');
    }, [navigate]);

    const hasPermission = useCallback((permission: Permission): boolean => {
        if (!currentUser) return false;
        if (currentUser.role === UserRole.ADMIN) return true;
        return currentUser.permissions.includes(permission);
    }, [currentUser]);
    
    const hasFeature = useCallback((feature: SubscriptionPlan['features'][0]): boolean => {
        if (!currentOrganization) {
            console.warn('hasFeature called but no current organization');
            return false;
        }

        // Check for manually assigned features first
        if (currentOrganization.manuallyAssignedFeatures?.includes(feature)) {
            console.log(`Feature ${feature} granted via manual assignment`);
            return true;
        }

        // Find the subscription plan
        const plan = subscriptionPlans.find(p => p.id === currentOrganization.subscriptionPlanId);

        if (!plan) {
            console.warn('No subscription plan found for organization:', {
                orgId: currentOrganization.id,
                orgPlanId: currentOrganization.subscriptionPlanId,
                availablePlans: subscriptionPlans.map(p => ({ id: p.id, name: p.name }))
            });
            return false;
        }

        const hasFeatureAccess = plan.features.includes(feature);
        console.log(`Feature check for ${feature}:`, {
            organization: currentOrganization.name,
            plan: plan.name,
            planFeatures: plan.features,
            hasAccess: hasFeatureAccess
        });

        return hasFeatureAccess;
    }, [currentOrganization, subscriptionPlans]);
    
    const createOrUpdateItem = async <T extends { _id?: string; id?: string | number }>(endpoint: string, item: Partial<T>, setItems: React.Dispatch<React.SetStateAction<T[]>>) => {
        // Check for either _id or id to determine if it's an update or create operation
        const isUpdate = item._id || item.id;
        const method = isUpdate ? 'PUT' : 'POST';
        const identifier = item._id || item.id;
        const url = isUpdate ? `${endpoint}/${identifier}` : endpoint;

        console.log('createOrUpdateItem Debug:', {
            endpoint,
            isUpdate,
            method,
            identifier,
            url,
            itemId: item.id,
            item_id: item._id
        });

        const savedItem: T = await apiRequest(url, method, item);
        setItems(prev => {
            if (method === 'PUT') {
                // For leads, try both _id and id matching
                return prev.map(i => {
                    if (i._id === savedItem._id || (i as any).id === (savedItem as any).id) {
                        return savedItem;
                    }
                    return i;
                });
            }
            return [savedItem, ...prev];
        });
        return savedItem;
    };

    const deleteItem = async <T extends { _id?: string }>(endpoint: string, itemId: string, setItems: React.Dispatch<React.SetStateAction<T[]>>) => {
        await apiRequest(`${endpoint}/${itemId}`, 'DELETE');
        setItems(prev => prev.filter(i => i._id !== itemId));
    };
    
    const addLead = (leadData: Omit<Lead, 'id' | '_id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'activities' | 'score' | 'closeDate'>) => createOrUpdateItem('/api/leads', leadData, setLeads);
    const onUpdateLead = async (updatedLead: Lead, oldLead?: Lead) => {
        console.log('App.tsx - onUpdateLead called:', {
            updatedLeadId: updatedLead.id,
            updatedLead_id: updatedLead._id,
            hasId: !!(updatedLead.id || updatedLead._id)
        });
        const result = await createOrUpdateItem('/api/leads', updatedLead, setLeads);
        console.log('App.tsx - onUpdateLead result:', result);
        return result;
    };
    const deleteLead = (leadId: string) => deleteItem('/api/leads', leadId, setLeads);

    // Refresh leads data from backend
    const refreshLeads = async () => {
        if (currentUser && authToken) {
            try {
                const freshLeads = await apiRequest('/api/leads');
                setLeads(freshLeads);
            } catch (error) {
                console.error('Failed to refresh leads:', error);
                throw error;
            }
        }
    };

    // Refresh specific lead data from backend
    const refreshLeadById = async (leadId: string) => {
        if (currentUser && authToken) {
            try {
                const updatedLead = await apiRequest(`/api/leads/${leadId}`);
                setLeads(prev => {
                    // Check if lead already exists in array
                    const leadExists = prev.some(lead => lead.id === leadId || lead._id === leadId);

                    if (leadExists) {
                        // Update existing lead
                        return prev.map(lead =>
                            lead.id === leadId || lead._id === leadId ? updatedLead : lead
                        );
                    } else {
                        // Add new lead to array
                        console.log('Adding refreshed lead to array:', updatedLead);
                        return [...prev, updatedLead];
                    }
                });
                return updatedLead;
            } catch (error) {
                console.error('Failed to refresh lead:', error);
                throw error;
            }
        }
    };

    const onUpdateTask = (updatedTask: Task) => createOrUpdateItem('/api/tasks', updatedTask, setTasks);
    const onDeleteTask = (taskId: string) => deleteItem('/api/tasks', taskId, setTasks);
    const onAddTask = async (taskData: any, assignment?: any) => {
        try {
            if (assignment) {
                console.log('Creating batch tasks:', { taskData, assignment });
                const newTasks = await apiRequest('/api/tasks/batch', 'POST', { taskData, assignment });
                console.log('Batch tasks created:', newTasks);
                setTasks(prev => [...prev, ...newTasks]);
            } else {
                // Handle single task creation (from LeadDetailPage)
                if (taskData.title && taskData.leadId) {
                    console.log('Creating single task:', taskData);
                    const newTask = await apiRequest('/api/tasks', 'POST', taskData);
                    console.log('Single task created:', newTask);
                    setTasks(prev => [...prev, newTask]);
                } else {
                    console.error('Invalid task data:', taskData);
                }
            }
        } catch (error) {
            console.error('Failed to create task:', error);
            throw error; // Re-throw to show error in UI
        }
    };

    const onAddNote = async (noteData: { content: string; leadId: string }) => {
        try {
            await apiRequest('/api/notes', 'POST', noteData);
            // Refresh leads to get updated activities
            const lead = leads.find(l => l.id === noteData.leadId);
            if (lead) {
                const refreshedLead = await apiRequest(`/api/leads/${noteData.leadId}`);
                if (refreshedLead) {
                    setLeads(prev => prev.map(l => l.id === noteData.leadId ? refreshedLead : l));
                }
            }
        } catch (error) {
            console.error('Failed to create note:', error);
        }
    };
    
    const onSaveUser = (user: User) => createOrUpdateItem('/api/settings/users', user, setUsers);
    const onDeleteUser = (userId: string) => deleteItem('/api/settings/users', userId, setUsers);
    
    const onAddStage = async (name: string, color: string) => {
        const newStage = { name, color, organizationId: currentOrganization?.id };
        const savedStage = await apiRequest('/api/settings/stages', 'POST', newStage);
        setStages(prev => [...prev, savedStage]);
    };
    const onUpdateStage = (id: string, field: 'name'|'color', value: string) => {
        const stage = stages.find(s => s._id === id);
        if (stage) createOrUpdateItem('/api/settings/stages', {...stage, [field]: value}, setStages);
    }
    const onDeleteStage = async (id: string) => {
        try {
            await apiRequest(`/api/settings/stages/${id}`, 'DELETE');
            // Update local state immediately
            setStages(prev => prev.filter(stage => stage.id !== id && stage._id !== id));
        } catch (error) {
            console.error('Failed to delete stage:', error);
            throw error;
        }
    };

    const onSaveRule = (rule: AutomationRule) => createOrUpdateItem('/api/automation/rules', rule, setAutomationRules);
    const onDeleteRule = (ruleId: string) => deleteItem('/api/automation/rules', ruleId, setAutomationRules);

    const onSaveTeam = (team: Team) => createOrUpdateItem('/api/settings/teams', team, setTeams);
    const onDeleteTeam = (teamId: string) => deleteItem('/api/settings/teams', teamId, setTeams);
    
    const onSaveSubscriptionPlan = (plan: SubscriptionPlan) => createOrUpdateItem('/api/super-admin/plans', plan, setSubscriptionPlans);
    const onDeleteSubscriptionPlan = (planId: string) => deleteItem('/api/super-admin/plans', planId, setSubscriptionPlans);

    const onSaveAddon = (addon: Addon) => createOrUpdateItem('/api/super-admin/addons', addon, setAddons);
    const onDeleteAddon = (addonId: string) => deleteItem('/api/super-admin/addons', addonId, setAddons);

    const onSaveCoupon = (coupon: Coupon) => createOrUpdateItem('/api/super-admin/coupons', coupon, setCoupons);
    const onDeleteCoupon = (couponId: string) => deleteItem('/api/super-admin/coupons', couponId, setCoupons);

    const onSaveBlogPost = (post: BlogPost) => createOrUpdateItem('/api/super-admin/blog', post, setBlogPosts);
    const onDeleteBlogPost = (postId: string) => deleteItem('/api/super-admin/blog', postId, setBlogPosts);
    const onSaveGlobalRule = (rule: GlobalAutomationRule) => createOrUpdateItem('/api/super-admin/automation-rules', rule, setGlobalAutomationRules);
    const onDeleteGlobalRule = (ruleId: string) => deleteItem('/api/super-admin/automation-rules', ruleId, setGlobalAutomationRules);
    const onUpdateOfferStrip = async (strip: OfferStrip) => {
        const updatedStrip = await apiRequest('/api/super-admin/offer-strip', 'PUT', strip);
        setOfferStrip(updatedStrip);
    };
    const onUpdatePricingComparisonData = async (data: PricingCategory[]) => {
        const updatedData = await apiRequest('/api/super-admin/pricing-data', 'PUT', data);
        setPricingComparisonData(updatedData);
    };
    
    const onScheduleMessage = async (msgData: Omit<ScheduledMessage, 'id' | 'organizationId'>) => {
        const updatedLead = await apiRequest(`/api/leads/${msgData.leadId}/schedule-message`, 'POST', msgData);
        setLeads(prev => prev.map(l => l._id === updatedLead._id ? updatedLead : l));
    };
    const onBulkAssign = async (leadIds: string[], assignedToId: number) => {
        const { updatedLeads } = await apiRequest('/api/leads/bulk-assign', 'POST', { leadIds, assignedToId });
        setLeads(prev => prev.map(l => updatedLeads.find((u: Lead) => u._id === l._id) || l));
    };
    const onBulkDelete = async (leadIds: string[]) => {
        await apiRequest('/api/leads/bulk-delete', 'POST', { leadIds });
        setLeads(prev => prev.filter(l => !leadIds.includes(l._id!)));
    };
    
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    if (isAuthenticating || (currentUser && isDataLoading)) {
        return <div className="h-screen w-screen flex items-center justify-center bg-background text-on-surface">Loading Application...</div>;
    }

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
        return <SuperAdminDashboard {...{ organizations, users, leads, tasks, subscriptionPlans, supportTickets, auditLogs, globalAnnouncement, addons, systemHealthData, apiUsageLogs, errorLogs, globalAutomationRules, onSaveGlobalRule, onDeleteGlobalRule, globalEmailTemplates, homepageContent, blogPosts, inquiries, setInquiries, setLeads, onSaveBlogPost, onDeleteBlogPost, onLogout: handleLogout, onAddOrganization: (org) => createOrUpdateItem('/api/super-admin/organizations', org, setOrganizations), onUpdateOrganization: (org) => createOrUpdateItem('/api/super-admin/organizations', org, setOrganizations), onDeleteOrganization: (id) => deleteItem('/api/super-admin/organizations', id, setOrganizations), onSaveSubscriptionPlan, onDeleteSubscriptionPlan, onUpdateTicketStatus: (id, status) => createOrUpdateItem('/api/super-admin/support-tickets', { _id: id, status }, setSupportTickets), onSaveAnnouncement: setGlobalAnnouncement, onSaveUser, globalIntegrationStatus, onUpdateGlobalIntegrationStatus: setGlobalIntegrationStatus, localizationSettings, onUpdateLocalizationSettings: setLocalizationSettings, onUpdateHomepageContent: setHomepageContent, paymentGatewaySettings, onUpdatePaymentGatewaySettings: setPaymentGatewaySettings, coupons, onSaveCoupon, onDeleteCoupon, offerStrip, onUpdateOfferStrip, onSaveAddon, onDeleteAddon, pricingComparisonData, onUpdatePricingComparisonData }} />
    }

    if (!currentOrganization) {
        return <div className="h-screen w-screen flex items-center justify-center bg-background text-on-surface">Loading organization... If this persists, please log out and log back in.</div>;
    }

    const mainContent = (
        <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard leads={leads} users={users} pipelineStages={stages} customWidgets={customDashboardWidgets} onSaveWidget={(w) => {}} onDeleteWidget={(id) => {}} />} />
            <Route path="/leads" element={<LeadListPage leads={leads} users={users} pipelineStages={stages} customFieldDefs={customFieldDefs} tasks={tasks} whatsAppTemplates={whatsAppTemplates} smsTemplates={smsTemplates} addLead={addLead} deleteLead={deleteLead} currentUser={currentUser} hasPermission={hasPermission} savedFilters={savedFilters} onSaveFilter={(f) => createOrUpdateItem('/api/settings/filters', f, setSavedFilters)} onDeleteFilter={(id) => deleteItem('/api/settings/filters', id, setSavedFilters)} onBulkAssign={onBulkAssign} onBulkDelete={onBulkDelete} onUpdateLead={onUpdateLead} onUpdateTask={onUpdateTask} onAddTask={onAddTask} onScheduleMessage={onScheduleMessage} onImportLeads={() => {}} />} />
            <Route path="/leads/:leadId" element={<LeadDetailPage leads={leads} users={users} pipelineStages={stages} customFieldDefs={customFieldDefs} tasks={tasks} whatsAppTemplates={whatsAppTemplates} smsTemplates={smsTemplates} currentUser={currentUser} onUpdateLead={onUpdateLead} onUpdateTask={onUpdateTask} onAddTask={onAddTask} onAddNote={onAddNote} onScheduleMessage={onScheduleMessage} onRefreshLeadById={refreshLeadById} />} />
            <Route path="/tasks" element={<TasksPage tasks={tasks} users={users} leads={leads} teams={teams} currentUser={currentUser} updateTask={onUpdateTask} onAddTask={onAddTask} onDeleteTask={onDeleteTask} />} />
            <Route path="/reports" element={<ReportsPage leads={leads} users={users} pipelineStages={stages} teams={teams} />} />
            <Route path="/tracking" element={hasPermission(Permission.VIEW_TRACKING_DASHBOARD) ? <TrackingDashboard users={users} sessionLogs={userSessionLogs} teams={teams} onToggleTracking={(userId) => onSaveUser({ ...users.find(u => u.id === userId)!, isTrackingEnabled: !users.find(u => u.id === userId)!.isTrackingEnabled })} currentUser={currentUser} /> : <Navigate to="/dashboard" />} />
            <Route path="/marketing" element={<MarketingLayout />}>
                <Route path="email" element={<EmailPage templates={emailTemplates} campaigns={emailCampaigns} onSaveTemplate={(t) => createOrUpdateItem('/api/marketing/templates/email', t, setEmailTemplates)} onDeleteTemplate={(id) => deleteItem('/api/marketing/templates/email', id, setEmailTemplates)} onSaveCampaign={(c) => createOrUpdateItem('/api/marketing/campaigns/email', c, setEmailCampaigns)} onDeleteCampaign={(id) => deleteItem('/api/marketing/campaigns/email', id, setEmailCampaigns)} users={users} pipelineStages={stages} customFieldDefs={customFieldDefs} />} />
                <Route path="sms" element={<SMSPage templates={smsTemplates} campaigns={smsCampaigns} onSaveTemplate={(t) => createOrUpdateItem('/api/marketing/templates/sms', t, setSmsTemplates)} onDeleteTemplate={(id) => deleteItem('/api/marketing/templates/sms', id, setSmsTemplates)} onSaveCampaign={(c) => createOrUpdateItem('/api/marketing/campaigns/sms', c, setSmsCampaigns)} onDeleteCampaign={(id) => deleteItem('/api/marketing/campaigns/sms', id, setSmsCampaigns)} users={users} pipelineStages={stages} customFieldDefs={customFieldDefs} />} />
                <Route path="whatsapp" element={<WhatsAppPage templates={whatsAppTemplates} onSaveTemplate={(t) => createOrUpdateItem('/api/marketing/templates/whatsapp', t, setWhatsAppTemplates)} onDeleteTemplate={(id) => deleteItem('/api/marketing/templates/whatsapp', id, setWhatsAppTemplates)} chatbotConfig={chatbotConfig} onSaveChatbotConfig={(c) => apiRequest('/api/settings/chatbot', 'PUT', c).then(setChatbotConfig)} customFieldDefs={customFieldDefs} campaigns={whatsAppCampaigns} onSaveCampaign={(c) => createOrUpdateItem('/api/marketing/campaigns/whatsapp', c, setWhatsAppCampaigns)} onDeleteCampaign={(id) => deleteItem('/api/marketing/campaigns/whatsapp', id, setWhatsAppCampaigns)} users={users} pipelineStages={stages} />} />
                <Route path="call" element={<CallPage scripts={callScripts} campaigns={callCampaigns} onSaveScript={(s) => createOrUpdateItem('/api/marketing/scripts/call', s, setCallScripts)} onDeleteScript={(id) => deleteItem('/api/marketing/scripts/call', id, setCallScripts)} onSaveCampaign={(c) => createOrUpdateItem('/api/marketing/campaigns/call', c, setCallCampaigns)} onDeleteCampaign={(id) => deleteItem('/api/marketing/campaigns/call', id, setCallCampaigns)} users={users} pipelineStages={stages} customFieldDefs={customFieldDefs} />} />
            </Route>
            <Route path="/blog" element={<BlogListPage blogPosts={blogPosts} users={users} />} />
            <Route path="/blog/:slug" element={<BlogPostPage blogPosts={blogPosts} users={users} />} />
            <Route path="/settings" element={<SettingsLayout />}>
                <Route index element={<SettingsPage pipelineStages={stages} onAddStage={onAddStage} onUpdateStage={onUpdateStage} onDeleteStage={onDeleteStage} customFieldDefs={customFieldDefs} onAddCustomField={(type) => createOrUpdateItem('/api/settings/custom-fields', {name: 'New Field', type, isMappable: true, isRequired: false}, setCustomFieldDefs)} onUpdateCustomField={(id, data) => createOrUpdateItem('/api/settings/custom-fields', {_id: id, ...data}, setCustomFieldDefs)} onDeleteCustomField={(id) => deleteItem('/api/settings/custom-fields', id, setCustomFieldDefs)} leadScoreRules={leadScoreRules} onSaveLeadScoreRule={(r) => createOrUpdateItem('/api/settings/score-rules', r, setLeadScoreRules)} onDeleteLeadScoreRule={(id) => deleteItem('/api/settings/score-rules', id, setLeadScoreRules)} theme={theme} toggleTheme={toggleTheme} currentUser={currentUser} hasPermission={hasPermission} currentOrganization={currentOrganization} subscriptionPlans={subscriptionPlans} billingHistory={billingHistory} onUpdateProfile={(data) => createOrUpdateItem('/api/users/profile', { ...currentUser, ...data }, (updatedUsers) => setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUsers[0] : u))).then(() => setCurrentUser(p => p ? {...p, ...data} : null))} addons={addons} onUpdateOrganization={(data) => apiRequest(`/api/organizations/${currentOrganization._id}`, 'PUT', data).then(setOrganizations)} />} />
                <Route path="users" element={<UserManagementPage users={users} teams={teams} onSaveUser={onSaveUser} onDeleteUser={(id) => onDeleteUser(id.toString())} />} />
                <Route path="teams" element={<TeamsPage teams={teams} users={users} onSaveTeam={onSaveTeam} onDeleteTeam={onDeleteTeam} />} />
                <Route path="integrations" element={<IntegrationsPage logs={integrationLogs} settings={integrationSettings} setSettings={setIntegrationSettings} customFieldDefs={customFieldDefs} currentOrganization={currentOrganization} webhooks={webhooks} onAddWebhook={(webhookData) => createOrUpdateItem('/api/webhooks', webhookData, setWebhooks)} onDeleteWebhook={(id) => deleteItem('/api/webhooks', id, setWebhooks)} onUpdateWebhook={(wh) => createOrUpdateItem('/api/webhooks', wh, setWebhooks)} onSendTestLead={() => {}} syncFacebookLeads={() => {}} />} />
                <Route path="automation" element={<AutomationPage rules={automationRules} users={users} teams={teams} customFieldDefs={customFieldDefs} pipelineStages={stages} onSaveRule={onSaveRule} onDeleteRule={onDeleteRule} />} />
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


