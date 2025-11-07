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
  { id: 1, name: 'Nadeem Jabir', email: 'nadeemjabir1@gmail.com', password: 'Nadeem@0331', avatar: `https://i.pravatar.cc/150?u=1`, phone: faker.phone.number(), role: USER_ROLES.SUPER_ADMIN, permissions: [], isTrackingEnabled: true, organizationId: '', superAdminRole: 'Co-Owner' },
  { id: 8, name: 'Support Admin', email: 'support@super.io', password: 'password123', avatar: `https://i.pravatar.cc/150?u=8`, phone: faker.phone.number(), role: USER_ROLES.SUPER_ADMIN, permissions: [], isTrackingEnabled: true, organizationId: '', superAdminRole: 'Support Admin' },
  // Org 1 Users
  { id: 2, name: 'Samantha Carter (Admin)', email: 'sam@edtech.io', password: 'password123', avatar: `https://i.pravatar.cc/150?u=2`, phone: faker.phone.number(), role: USER_ROLES.ADMIN, teamId: 'team-edtech', permissions: [PERMISSIONS.VIEW_ALL_LEADS, PERMISSIONS.ASSIGN_LEADS, PERMISSIONS.MANAGE_USERS, PERMISSIONS.MANAGE_TEAMS, PERMISSIONS.MANAGE_SETTINGS, PERMISSIONS.MANAGE_AUTOMATION, PERMISSIONS.MANAGE_INTEGRATIONS, PERMISSIONS.DELETE_LEADS], isTrackingEnabled: true, organizationId: 'org-1' },
  { id: 3, name: 'John Doe (Rep)', email: 'john@edtech.io', password: 'password123', avatar: `https://i.pravatar.cc/150?u=3`, phone: faker.phone.number(), role: USER_ROLES.SALES_REP, teamId: 'team-edtech', permissions: [], isTrackingEnabled: true, organizationId: 'org-1' },
  { id: 4, name: 'Jane Smith (Rep)', email: 'jane@edtech.io', password: 'password123', avatar: `https://i.pravatar.cc/150?u=4`, phone: faker.phone.number(), role: USER_ROLES.SALES_REP, teamId: 'team-edtech', permissions: [], isTrackingEnabled: false, organizationId: 'org-1' },
  { id: 7, name: 'Chris Green (Admin)', email: 'chris@edtech.io', password: 'password123', avatar: `https://i.pravatar.cc/150?u=7`, phone: faker.phone.number(), role: USER_ROLES.ADMIN, permissions: [PERMISSIONS.MANAGE_USERS, PERMISSIONS.MANAGE_SETTINGS, PERMISSIONS.MANAGE_TEAMS, PERMISSIONS.ASSIGN_LEADS, PERMISSIONS.VIEW_TRACKING_DASHBOARD], isTrackingEnabled: true, organizationId: 'org-1' },
  // Org 2 Users
  { id: 6, name: 'Jessica Williams (Mgr)', email: 'jessica@realty.io', password: 'password123', avatar: `https://i.pravatar.cc/150?u=6`, phone: faker.phone.number(), role: USER_ROLES.MANAGER, teamId: 'team-realestate', permissions: [], isTrackingEnabled: false, organizationId: 'org-2' },
  { id: 5, name: 'Mike Brown (Rep)', email: 'mike@realty.io', password: 'password123', avatar: `https://i.pravatar.cc/150?u=5`, phone: faker.phone.number(), role: USER_ROLES.SALES_REP, teamId: 'team-realestate', permissions: [], isTrackingEnabled: true, organizationId: 'org-2' },
];

// Custom Field Definitions
export const CUSTOM_FIELD_DEFS = [
    { id: 'cf_1', name: 'Project Start Date', type: 'date', isRequired: false, organizationId: 'org-1', isMappable: true },
    { id: 'cf_2', name: 'Primary Need', type: 'text', isRequired: true, organizationId: 'org-1', isMappable: true },
    { id: 'cf_3', name: 'Company Size', type: 'number', isRequired: false, organizationId: 'org-1', isMappable: false },
    { id: 'cf_6', name: 'Enquiry Type', type: 'dropdown', options: ['Sales', 'Support', 'General'], isRequired: false, organizationId: 'org-1', isMappable: true },
    { id: 'cf_4', name: 'Budget', type: 'number', isRequired: true, organizationId: 'org-2', isMappable: true },
    { id: 'cf_5', name: 'Property Type', type: 'text', isRequired: false, organizationId: 'org-2', isMappable: true },
];

// Generate activities for leads
const generateActivities = (authorId, leadCreationTime) => {
    const activities = [];
    const count = faker.number.int({ min: 3, max: 8 });

    activities.push({
        id: faker.string.uuid(),
        type: 'LEAD_CREATED',
        content: `Lead created from ${faker.helpers.arrayElement(Object.values(LEAD_SOURCES))}.`,
        timestamp: leadCreationTime.toISOString(),
        authorId: authorId
    });

    for (let i = 0; i < count; i++) {
        const type = faker.helpers.arrayElement(['NOTE', 'EMAIL', 'CALL', 'STATUS_CHANGE']);
        let content = '';
        switch(type) {
            case 'NOTE': content = faker.lorem.sentence(); break;
            case 'EMAIL': content = `Sent email: ${faker.lorem.words(3)}`; break;
            case 'CALL': content = `Called and discussed: ${faker.lorem.words(4)}`; break;
            case 'STATUS_CHANGE': content = `Status changed to ${faker.helpers.arrayElement(Object.values(FOLLOW_UP_STATUSES))}`; break;
        }
        activities.push({
            id: faker.string.uuid(),
            type,
            content,
            timestamp: faker.date.between({ from: leadCreationTime, to: new Date() }).toISOString(),
            authorId: authorId,
        });
    }
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Constants for lead generation
const CAMPAIGNS = ['EdTech Conf 2024', 'RealEstate Expo Q2', 'Summer Digital Push', 'Website Inbound Q3', 'Referral Program'];
const COURSES = ['Full Stack Development', 'Data Science & AI', 'Digital Marketing Pro', 'Cloud Computing', 'Cyber Security'];
const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];

// Leads
export const LEADS = Array.from({ length: 50 }, (_, i) => {
  const org = i % 2 === 0 ? ORGANIZATIONS[0] : ORGANIZATIONS[1];
  const orgUsers = USERS.filter(u => u.organizationId === org.id && (u.role === USER_ROLES.SALES_REP || u.role === USER_ROLES.MANAGER));
  const orgStages = STAGES.filter(s => s.organizationId === org.id);
  const orgCustomFields = CUSTOM_FIELD_DEFS.filter(cf => cf.organizationId === org.id);

  const assignedTo = faker.helpers.arrayElement(orgUsers);
  const createdAt = faker.date.past({ years: 1 });
  const source = faker.helpers.arrayElement(Object.values(LEAD_SOURCES));

  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    alternatePhone: faker.phone.number(),
    city: faker.helpers.arrayElement(CITIES),
    course: faker.helpers.arrayElement(COURSES),
    company: faker.company.name(),
    source: source,
    stage: faker.helpers.arrayElement(orgStages).id,
    followUpStatus: faker.helpers.arrayElement(Object.values(FOLLOW_UP_STATUSES)),
    score: faker.number.int({ min: 20, max: 100 }),
    tags: faker.helpers.arrayElements(['hot-lead', 'requires-demo', 'b2b', 'enterprise', 'smb'], {min: 1, max: 3}),
    assignedToId: assignedTo.id,
    createdAt: createdAt.toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    dealValue: faker.number.int({ min: 500, max: 50000 }),
    closeDate: faker.date.soon({ days: 365 }).toISOString(),
    activities: generateActivities(assignedTo.id, createdAt),
    scheduledMessages: [],
    campaign: faker.helpers.arrayElement(CAMPAIGNS),
    facebookCampaign: source === LEAD_SOURCES.FACEBOOK ? `FB-Campaign-${faker.lorem.word()}` : undefined,
    facebookAdset: source === LEAD_SOURCES.FACEBOOK ? `FB-AdSet-${faker.number.int(100)}` : undefined,
    facebookAd: source === LEAD_SOURCES.FACEBOOK ? `FB-Ad-${faker.color.human()}` : undefined,
    customFields: orgCustomFields.reduce((acc, def) => {
        let value;
        if (def.type === 'date') value = faker.date.soon({ days: 90 }).toISOString().split('T')[0];
        if (def.type === 'text') value = faker.lorem.words(3);
        if (def.type === 'number') value = faker.number.int({ min: 10, max: 500 });
        if (def.type === 'dropdown' && def.options) value = faker.helpers.arrayElement(def.options);
        acc[def.id] = value;
        return acc;
    }, {}),
    organizationId: org.id,
  };
});

// Tasks
export const TASKS = LEADS.slice(0, 15).map(lead => ({
    id: faker.string.uuid(),
    title: faker.helpers.arrayElement(['Follow up call', 'Send proposal', 'Schedule demo', 'Check in via email']),
    dueDate: faker.date.soon({ days: 14 }).toISOString(),
    isCompleted: faker.datatype.boolean(),
    assignedToId: lead.assignedToId,
    leadId: lead.id,
    createdAt: faker.date.recent({ days: 7 }).toISOString(),
    createdById: USERS.find(u => u.organizationId === lead.organizationId && u.role === USER_ROLES.ADMIN)?.id || 0,
    organizationId: lead.organizationId,
}));

// Automation Rules
export const AUTOMATION_RULES = [
    {
        id: 'rule-2',
        name: 'Round-Robin EdTech Leads',
        description: 'Distributes new EdTech leads evenly among the Ed-Tech Warriors team.',
        isEnabled: true,
        trigger: { type: 'NEW_LEAD' },
        conditions: [{ field: 'campaign', operator: 'equals', value: 'EdTech Conf 2024', logic: 'AND' }],
        action: { type: 'ASSIGN_ROUND_ROBIN', teamId: 'team-edtech' },
        organizationId: 'org-1',
    },
    {
        id: 'rule-5',
        name: 'Re-assign Untouched Leads',
        description: 'If a new lead is not updated in 24 hours, re-assign it to the manager.',
        isEnabled: true,
        trigger: { type: 'LEAD_UNTOUCHED', hours: 24 },
        conditions: [{ field: 'stage', operator: 'equals', value: 'new-lead', logic: 'AND' }],
        action: { type: 'ASSIGN_TO_USER', userId: 2 },
        organizationId: 'org-1',
    },
    {
        id: 'rule-1',
        name: 'Assign Real Estate Leads to RE Team',
        description: 'Automatically assigns all new leads from the RealEstate campaign to the Real Estate Sharks team.',
        isEnabled: true,
        trigger: { type: 'NEW_LEAD' },
        conditions: [{ field: 'campaign', operator: 'equals', value: 'RealEstate Expo Q2', logic: 'AND' }],
        action: { type: 'ASSIGN_TO_TEAM', teamId: 'team-realestate' },
        organizationId: 'org-2',
    },
    {
        id: 'rule-6',
        name: 'Send Won Deals to Analytics',
        description: 'Pings an external webhook with lead data when a deal is moved to Closed-Won.',
        isEnabled: false,
        trigger: { type: 'STAGE_CHANGED', toStage: 'closed-won' },
        conditions: [],
        action: { type: 'SEND_WEBHOOK', url: 'https://hooks.example.com/analytics' },
        organizationId: 'org-1',
    }
];

// Templates
export const EMAIL_TEMPLATES = [
    { id: 'et_1', name: 'Welcome Email', subject: 'Welcome to Ed-Tech Global!', body: '<h1>Hi {{name}}!</h1><p>Thanks for joining us. We are excited to have you on board. Here are some resources to get you started.</p>', organizationId: 'org-1', type: 'Email' },
    { id: 'et_2', name: 'Q2 Promo', subject: 'Don\'t miss our Q2 promotions!', body: '<p>Huge discounts on our most popular courses for a limited time! Check them out now.</p>', organizationId: 'org-1', type: 'Email' },
    { id: 'et_3', name: 'New Property Alert', subject: 'New Properties in your Area!', body: 'Hi {{name}}, we have new listings that match your criteria. Would you like to schedule a visit?', organizationId: 'org-2', type: 'Email' },
];

export const SMS_TEMPLATES = [
    {
        id: 'sms_tmpl_1',
        name: 'Initial SMS Intro',
        body: 'Hi {{name}}, this is {{user_name}} from Ed-Tech Global. Thanks for your interest!',
        organizationId: 'org-1',
        type: 'SMS',
    },
    {
        id: 'sms_tmpl_2',
        name: 'Property SMS Follow-up',
        body: 'Hello {{name}}. This is {{user_name}} from Realty Kings. Just following up on your property inquiry.',
        organizationId: 'org-2',
        type: 'SMS',
    }
];

export const WHATSAPP_TEMPLATES = [
    {
        id: 'tmpl_1',
        name: 'Initial Introduction',
        body: 'Hi {{name}}, this is {{user_name}} from Ed-Tech Global. Thanks for your interest in {{course}}! Would you be free for a quick call this week?',
        organizationId: 'org-1',
        type: 'WhatsApp',
    },
    {
        id: 'tmpl_2',
        name: 'Demo Follow-up',
        body: 'Hi {{name}}, it was great showing you the demo. Let me know if you have any questions. You can find the proposal attached to the email we sent.',
        organizationId: 'org-1',
        type: 'WhatsApp',
    },
    {
        id: 'tmpl_3',
        name: 'Property Inquiry',
        body: 'Hello {{name}}. This is {{user_name}} from Realty Kings regarding your property inquiry. Are you available for a brief chat?',
        organizationId: 'org-2',
        type: 'WhatsApp',
    }
];

export const CALL_SCRIPTS = [
    {
        id: 'cs_1',
        name: 'Initial Inquiry Follow-up',
        body: 'Hi {{name}}, this is {{user_name}} from Ed-Tech Global calling about your recent interest in our {{course}} program. I just wanted to see if you had a few minutes to chat about how we can help you achieve your career goals. Is now a good time?',
        organizationId: 'org-1',
        type: 'Call',
    },
    {
        id: 'cs_2',
        name: 'Post-Demo Feedback Call',
        body: 'Hello {{name}}, I\'m calling from Ed-Tech Global. I hope you found the recent demo helpful. I wanted to quickly follow up to see if you had any questions and gather your feedback. What were your initial thoughts?',
        organizationId: 'org-1',
        type: 'Call',
    },
    {
        id: 'cs_3',
        name: 'Real Estate Site Visit Confirmation',
        body: 'Hi {{name}}, it\'s {{user_name}} from Realty Kings. I\'m just calling to confirm your site visit scheduled for tomorrow. We look forward to showing you the property!',
        organizationId: 'org-2',
        type: 'Call',
    }
];

// Campaigns
export const EMAIL_CAMPAIGNS = [
    { id: 'ec_1', name: 'New User Welcome Series', templateId: 'et_1', status: 'SENT', sentAt: faker.date.recent().toISOString(), scheduledAt: null, recipientCount: 150, openRate: 25.5, organizationId: 'org-1', type: 'Email' },
    { id: 'ec_2', name: 'Q2 Promotion Blast', templateId: 'et_2', status: 'DRAFT', sentAt: null, scheduledAt: null, recipientCount: 0, openRate: 0, organizationId: 'org-1', type: 'Email' },
    { id: 'ec_3', name: 'Weekly Property Digest', templateId: 'et_3', status: 'SCHEDULED', sentAt: null, scheduledAt: faker.date.soon({ days: 3 }).toISOString(), recipientCount: 340, openRate: 0, organizationId: 'org-2', type: 'Email' },
];

export const SMS_CAMPAIGNS = [
    {
        id: 'smsc_1',
        name: 'Welcome SMS Series',
        templateId: 'sms_tmpl_1',
        status: 'SENT',
        sentAt: faker.date.recent().toISOString(),
        scheduledAt: null,
        recipientCount: 120,
        deliveryRate: 98.5,
        organizationId: 'org-1',
        type: 'SMS',
    },
    {
        id: 'smsc_2',
        name: 'Property Follow-up Blast',
        templateId: 'sms_tmpl_2',
        status: 'DRAFT',
        sentAt: null,
        scheduledAt: null,
        recipientCount: 0,
        deliveryRate: 0,
        organizationId: 'org-2',
        type: 'SMS',
    },
];

export const WHATSAPP_CAMPAIGNS = [
    {
        id: 'wac_1',
        name: 'Initial Welcome Follow-up',
        templateId: 'tmpl_1',
        status: 'SENT',
        sentAt: faker.date.recent().toISOString(),
        scheduledAt: null,
        recipientCount: 85,
        deliveryRate: 95.2,
        organizationId: 'org-1',
        type: 'WhatsApp',
    },
    {
        id: 'wac_2',
        name: 'Q2 Promo WhatsApp Blast',
        templateId: 'tmpl_2',
        status: 'DRAFT',
        sentAt: null,
        scheduledAt: null,
        recipientCount: 0,
        deliveryRate: 0,
        organizationId: 'org-1',
        type: 'WhatsApp',
    },
    {
        id: 'wac_3',
        name: 'Realty Inquiry Follow-up (Scheduled)',
        templateId: 'tmpl_3',
        status: 'SCHEDULED',
        sentAt: null,
        scheduledAt: faker.date.soon({ days: 5 }).toISOString(),
        recipientCount: 210,
        deliveryRate: 0,
        organizationId: 'org-2',
        type: 'WhatsApp',
    }
];

export const CALL_CAMPAIGNS = [
    {
        id: 'cc_1',
        name: 'Q3 Inquiry Follow-up Calls',
        scriptId: 'cs_1',
        status: 'SENT',
        sentAt: faker.date.recent().toISOString(),
        scheduledAt: null,
        recipientCount: 75,
        connectionRate: 45.5,
        organizationId: 'org-1',
        type: 'Call',
    },
    {
        id: 'cc_2',
        name: 'Post-Demo Feedback Initiative',
        scriptId: 'cs_2',
        status: 'DRAFT',
        sentAt: null,
        scheduledAt: null,
        recipientCount: 0,
        connectionRate: 0,
        organizationId: 'org-1',
        type: 'Call',
    },
    {
        id: 'cc_3',
        name: 'July Site Visit Confirmations',
        scriptId: 'cs_3',
        status: 'SCHEDULED',
        sentAt: null,
        scheduledAt: faker.date.soon({ days: 2 }).toISOString(),
        recipientCount: 40,
        connectionRate: 0,
        organizationId: 'org-2',
        type: 'Call',
    }
];

// Lead Score Rules
export const LEAD_SCORE_RULES = [
    { id: 'lsr_1', field: 'source', operator: 'equals', value: 'Website', points: 10, organizationId: 'org-1' },
    { id: 'lsr_2', field: 'course', operator: 'contains', value: 'Data Science', points: 20, organizationId: 'org-1' },
    { id: 'lsr_3', field: 'email', operator: 'is_not_set', points: -15, organizationId: 'org-1' },
    { id: 'lsr_4', field: 'customFields.cf_4', operator: 'is_set', points: 15, organizationId: 'org-2' },
];

// Integration Settings
export const INTEGRATION_SETTINGS = [
    {
        source: 'Facebook',
        isConnected: true,
        fieldMappings: [{sourceField: 'full_name', crmField: 'name'}, {sourceField: 'email_address', crmField: 'email'}, {sourceField: 'phone_number', crmField: 'phone'}],
        organizationId: 'org-1',
        connectedAccounts: [
            {
                id: 'fb-acc-1',
                name: 'Ed-Tech Main Account',
                accessToken: faker.string.uuid(),
                pages: [
                    {id: 'fb-page-1', name: 'Ed-Tech Global Page', forms: [{id: 'form-1', name: 'Course Inquiry Form'}, {id: 'form-2', name: 'Ebook Download Form'}]},
                    {id: 'fb-page-2', name: 'Digital Marketing Courses Page', forms: [{id: 'form-3', name: 'Free Webinar Signup'}]}
                ]
            }
        ]
    },
    { source: 'Google Ads', isConnected: false, fieldMappings: [], organizationId: 'org-1' },
    {
        source: 'Website',
        isConnected: true,
        fieldMappings: [],
        organizationId: 'org-1',
        connectedWebsites: [{id: 'web-1', url: 'https://edtechglobal.io'}]
    },
    { source: 'Cloud Telephony', isConnected: false, fieldMappings: [], organizationId: 'org-1' },
    { source: 'Email Marketing', isConnected: false, fieldMappings: [], organizationId: 'org-1' },
    { source: 'SMS Marketing', isConnected: false, fieldMappings: [], organizationId: 'org-1' },
    { source: 'Facebook', isConnected: false, fieldMappings: [], organizationId: 'org-2' },
    {
        source: 'Google Ads',
        isConnected: true,
        fieldMappings: [],
        organizationId: 'org-2',
        connectedAccounts: [{id: 'g-acc-1', name: 'Realty Kings Ads'}]
    },
    { source: 'Website', isConnected: false, fieldMappings: [], organizationId: 'org-2' },
    { source: 'Cloud Telephony', isConnected: false, fieldMappings: [], organizationId: 'org-2' },
    { source: 'Email Marketing', isConnected: false, fieldMappings: [], organizationId: 'org-2' },
    { source: 'SMS Marketing', isConnected: false, fieldMappings: [], organizationId: 'org-2' },
];

// Webhooks
export const WEBHOOKS = [
    { id: faker.string.uuid(), name: 'Default Webhook', url: `https://api.Clienn CRM.io/v1/webhooks/leads/${faker.string.uuid()}`, isEnabled: true, organizationId: 'org-1' },
    { id: faker.string.uuid(), name: 'Zapier Integration', url: `https://api.Clienn CRM.io/v1/webhooks/leads/${faker.string.uuid()}`, isEnabled: false, organizationId: 'org-1' },
];

// Support Tickets
export const SUPPORT_TICKETS = [
    { id: faker.string.uuid(), subject: 'Cannot connect Facebook account', organizationId: 'org-1', userId: 2, status: 'OPEN', createdAt: faker.date.recent({ days: 2 }).toISOString(), lastReplyAt: faker.date.recent({ days: 1 }).toISOString(), replies: [
        { authorId: 2, message: "I'm trying to connect my Facebook page but it keeps failing. Can you help?", timestamp: faker.date.recent({ days: 2 }).toISOString() },
        { authorId: 8, message: "Hi Samantha, thanks for reaching out. Could you please confirm if you have admin permissions on the Facebook page you're trying to connect?", timestamp: faker.date.recent({ days: 1 }).toISOString() }
    ]},
    { id: faker.string.uuid(), subject: 'Billing question for next cycle', organizationId: 'org-2', userId: 6, status: 'IN_PROGRESS', createdAt: faker.date.recent({ days: 3 }).toISOString(), lastReplyAt: faker.date.recent({ days: 1 }).toISOString(), replies: [
        { authorId: 6, message: "I have a question about our upcoming invoice.", timestamp: faker.date.recent({ days: 3 }).toISOString() },
    ]},
    { id: faker.string.uuid(), subject: 'How to use automation rules?', organizationId: 'org-1', userId: 3, status: 'RESOLVED', createdAt: faker.date.recent({ days: 5 }).toISOString(), lastReplyAt: faker.date.recent({ days: 4 }).toISOString(), replies: [
        { authorId: 3, message: "Where can I find documentation on automation rules?", timestamp: faker.date.recent({ days: 5 }).toISOString() },
        { authorId: 8, message: "Hi John, you can find our help docs at help.Clienn CRM.app. I've also sent you a link via email. This ticket is now resolved.", timestamp: faker.date.recent({ days: 4 }).toISOString() },
    ]},
];

// Addons
export const ADDONS = [
    { id: 'addon_ai', name: 'AI Power-Up', description: 'Unlock AI lead summaries, predictive analytics, and an AI chatbot.', monthlyPrice: 50, featureTag: 'AI_FEATURES' },
    { id: 'addon_whatsapp', name: 'WhatsApp Business', description: 'Integrate WhatsApp for direct communication with leads.', monthlyPrice: 25, featureTag: 'WHATSAPP' },
    { id: 'addon_advanced_analytics', name: 'Advanced Analytics', description: 'Get deeper insights with custom reports and dashboards.', monthlyPrice: 40, featureTag: 'ADVANCED_ANALYTICS' },
    { id: 'addon_whitelabel', name: 'White-Labeling', description: 'Remove Clienn CRM branding and use your own domain.', monthlyPrice: 150, featureTag: 'WHITE_LABEL' },
];

// Inquiries
export const INQUIRIES = Array.from({ length: 25 }, () => {
    const type = faker.helpers.arrayElement(['Contact Form', 'Chatbot']);
    return {
        id: faker.string.uuid(),
        type,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        company: type === 'Contact Form' ? faker.company.name() : undefined,
        message: faker.lorem.sentence(),
        createdAt: faker.date.recent({ days: 10 }).toISOString(),
        status: faker.helpers.arrayElement(['New', 'In Progress', 'Resolved', 'Closed']),
    };
});

// Coupons
export const COUPONS = [
    { id: faker.string.uuid(), code: 'SUMMER20', type: 'percentage', value: 20, expiresAt: faker.date.soon({ days: 60 }).toISOString(), isActive: true },
    { id: faker.string.uuid(), code: 'WELCOME50', type: 'fixed', value: 50, isActive: true },
    { id: faker.string.uuid(), code: 'EXPIRED', type: 'percentage', value: 10, expiresAt: faker.date.recent({ days: 30 }).toISOString(), isActive: false },
];

// Custom Domains
export const CUSTOM_DOMAINS = [
    { id: 'cd-1', domain: 'crm.edtechglobal.io', status: 'verified', organizationId: 'org-1' }
];

// Blog Posts
export const BLOG_POSTS = Array.from({ length: 5 }, (_, i) => {
    const title = faker.lorem.sentence({ min: 5, max: 8 });
    const focusKeyword = faker.lorem.words(2);
    return {
        id: faker.string.uuid(),
        slug: faker.helpers.slugify(title).toLowerCase(),
        title: title,
        excerpt: faker.lorem.paragraph(2),
        content: faker.lorem.paragraphs(10),
        authorId: faker.helpers.arrayElement([2, 3, 4, 5, 6, 7]),
        publishedAt: faker.date.past({ years: 1 }).toISOString(),
        tags: faker.helpers.arrayElements(['Sales', 'Marketing', 'CRM', 'Growth Hacking', 'AI'], { min: 2, max: 3 }),
        featuredImage: {
            src: `https://picsum.photos/seed/${faker.string.uuid()}/800/400`,
            alt: `Blog post image for ${title}`,
        },
        seo: {
            title: `${title} | Clienn CRM Blog`,
            description: faker.lorem.paragraph(1),
        },
        focusKeyword,
        views: faker.number.int({ min: 150, max: 10000 }),
        comments: faker.number.int({ min: 0, max: 50 }),
    };
});


