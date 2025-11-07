
import { faker } from '@faker-js/faker';

// Constants
export const LEAD_SOURCES = {
  WEBSITE: "Website",
  FACEBOOK: "Facebook",
  GOOGLE_ADS: "Google Ads",
  REFERRAL: "Referral",
  COLD_CALL: "Cold Call",
  CHATBOT: "Chatbot",
};

export const FOLLOW_UP_STATUSES = {
    PENDING: "Pending",
    INTERESTED: "Interested",
    CALL_LATER: "Call Later",
    NOT_INTERESTED: "Not Interested",
    CONVERTED: "Converted",
};

export const USER_ROLES = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    MANAGER: "Manager",
    SALES_REP: "Sales Rep",
};

export const PERMISSIONS = {
    VIEW_ALL_LEADS: 'view:all_leads',
    DELETE_LEADS: 'delete:leads',
    ASSIGN_LEADS: 'assign:leads',
    MANAGE_USERS: 'manage:users',
    MANAGE_TEAMS: 'manage:teams',
    MANAGE_SETTINGS: 'manage:settings',
    MANAGE_AUTOMATION: 'manage:automation',
    MANAGE_INTEGRATIONS: 'manage:integrations',
    VIEW_TRACKING_DASHBOARD: 'view:tracking_dashboard',
};

// Organizations
export const ORGANIZATIONS = [
    {
        id: 'org-1',
        name: 'Ed-Tech Global',
        code: 'EDTECH',
        apiKey: faker.string.uuid(),
        isEnabled: true,
        subscriptionPlanId: 'plan_pro',
        subscriptionExpiresAt: faker.date.soon({ days: 365 }).toISOString(),
        logoUrl: 'https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600',
        themeColor: '#4f46e5',
        storageUsedGb: 78,
        storageQuotaGb: 100,
        purchasedAddonIds: ['addon_ai'],
        whiteLabelConfig: { customDomain: 'crm.edtechglobal.io' },
        securityConfig: { isMfaEnforced: true, ipWhitelist: ['203.0.113.0/24'], ssoProvider: 'google' },
        hasBlogAccess: true,
    },
    {
        id: 'org-2',
        name: 'Realty Kings',
        code: 'REALTY',
        apiKey: faker.string.uuid(),
        isEnabled: true,
        subscriptionPlanId: 'plan_basic',
        subscriptionExpiresAt: faker.date.past({ years: 1 }).toISOString(),
        logoUrl: 'https://tailwindui.com/img/logos/mark.svg?color=orange&shade=500',
        themeColor: '#f97316',
        storageUsedGb: 8,
        storageQuotaGb: 10,
        purchasedAddonIds: [],
        securityConfig: { isMfaEnforced: false },
        hasBlogAccess: false,
        manuallyAssignedFeatures: ['AUTOMATION'],
    },
];

// Subscription Plans
export const SUBSCRIPTION_PLANS = [
    { id: 'plan_free', name: 'Free', price: 0, userLimit: 1, features: ['DASHBOARD', 'LEADS', 'TASKS'] },
    { id: 'plan_basic', name: 'Basic', price: 49, userLimit: 5, features: ['DASHBOARD', 'LEADS', 'TASKS', 'TEAMS', 'SETTINGS', 'INTEGRATIONS', 'WHATSAPP', 'USERS'] },
    { id: 'plan_pro', name: 'Pro', price: 99, userLimit: 20, features: ['DASHBOARD', 'LEADS', 'TASKS', 'TEAMS', 'SETTINGS', 'INTEGRATIONS', 'WHATSAPP', 'SMS', 'CALLS', 'AUTOMATION', 'REPORTS', 'EMAIL', 'TRACKING', 'USERS'] },
    { id: 'plan_enterprise', name: 'Enterprise', price: 249, userLimit: 100, features: ['DASHBOARD', 'LEADS', 'TASKS', 'TEAMS', 'SETTINGS', 'INTEGRATIONS', 'WHATSAPP', 'SMS', 'CALLS', 'AUTOMATION', 'REPORTS', 'EMAIL', 'TRACKING', 'API_ACCESS', 'USERS'] },
];

// Stages
export const STAGES = [
    { id: 'new-lead', name: 'New Lead', color: '#3b82f6', organizationId: 'org-1' },
    { id: 'contacted', name: 'Contacted', color: '#6366f1', organizationId: 'org-1' },
    { id: 'proposal-sent', name: 'Proposal Sent', color: '#8b5cf6', organizationId: 'org-1' },
    { id: 'negotiation', name: 'Negotiation', color: '#a855f7', organizationId: 'org-1' },
    { id: 'closed-won', name: 'Closed-Won', color: '#22c55e', organizationId: 'org-1' },
    { id: 'closed-lost', name: 'Closed-Lost', color: '#ef4444', organizationId: 'org-1' },
    { id: 'new-inquiry', name: 'New Inquiry', color: '#10b981', organizationId: 'org-2' },
    { id: 'site-visit', name: 'Site Visit Scheduled', color: '#0ea5e9', organizationId: 'org-2' },
    { id: 'token-received', name: 'Token Received', color: '#f97316', organizationId: 'org-2' },
    { id: 'sold', name: 'Sold', color: '#16a34a', organizationId: 'org-2' },
    { id: 'lost', name: 'Lost', color: '#dc2626', organizationId: 'org-2' },
];

// Teams
export const TEAMS = [
    { id: 'team-edtech', name: 'Ed-Tech Warriors', leadId: 2, memberIds: [3, 4], organizationId: 'org-1' },
    { id: 'team-realestate', name: 'Real Estate sharks', leadId: 6, memberIds: [5], organizationId: 'org-2' }
];

// Users
export const USERS = [
  // Super Admin - no org



