import React from 'react';

export interface BlogPost {
  _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Plain text content
  authorId: number;
  publishedAt: string;
  tags: string[];
  featuredImage: {
    src: string;
    alt: string;
  };
  seo: {
    title: string;
    description: string;
  };
  focusKeyword?: string;
  views?: number;
  comments?: number;
}

export interface HomepageContent {
  hero: {
    title: string;
    gradientTitle: string;
    subtitle: string;
    cta1: string;
    cta2: string;
  };
  loginPage: {
    title: string;
    subtitle: string;
    cta: string;
    image: {
      src: string;
      alt: string;
    }
  };
  trustedBy: {
    title:string;
    logos: {
        src: string;
        alt: string;
        name: string;
    }[];
  };
  howItWorks: {
    title: string;
    subtitle: string;
    steps: {
      id: string;
      icon: 'Connect' | 'AutomateSteps' | 'Grow';
      title: string;
      description: string;
    }[];
  };
  integrations: {
    title: string;
    subtitle: string;
    logos: {
      src: string;
      alt: string;
      name: string;
    }[];
  };
  features: {
    title: string;
    subtitle: string;
    items: {
      id: string;
      title: string;
      description: string;
      image: {
        src: string;
        alt: string;
      }
    }[];
  };
  growthChart: {
    title: string;
    subtitle: string;
    chartData: { month: string; value: number }[];
    stat: {
      value: number;
      label: string;
    }
  };
  funnel: {
    title: string;
    subtitle: string;
    stages: {
      name: string;
      value: number;
    }[];
  };
  pricing: {
    title: string;
    subtitle: string;
    monthlyPlans: PlanContent[];
    yearlyPlans: PlanContent[];
  };
  testimonials: {
    title: string;
    items: {
      id: string;
      quote: string;
      author: string;
      company: string;
      avatar: {
        src: string;
        alt: string;
      };
    }[];
  };
  faq: {
    title: string;
    subtitle: string;
    items: {
      id: string;
      q: string;
      a: string;
    }[];
  };
  contactForm: {
    title: string;
    subtitle: string;
    webhookUrl: string;
    address: string;
    email: string;
    phone: string;
    mapSrc: string;
    fields: {
      id: string;
      label: string;
      type: 'text' | 'email' | 'textarea';
      required: boolean;
    }[];
  };
  chatbot: {
    enabled: boolean;
    welcomeMessage: string;
    questions: {
      id: string;
      question: string;
      crmField: string;
    }[];
    thankYouMessage: string;
    color: string;
    style: 'icon' | 'button';
  };
  blog: {
    title: string;
    subtitle: string;
  };
  footer: {
    description: string;
    address: string;
    columns: {
      title: string;
      links: { text: string; url: string; }[];
    }[];
    socialLinks: {
      name: 'LinkedIn' | 'Twitter' | 'Facebook' | 'Youtube' | 'Instagram';
      url: string;
    }[];
    legal: {
      copyright: string;
      links: { text: string; url: string; }[];
    };
  };
  finalCta: {
    title: string;
    subtitle: string;
    cta: string;
  };
}

export interface PlanContent {
  name: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
}

export interface PricingFeature {
  id: string;
  name: string;
  description?: string; // For tooltips
  values: {
    free: string | boolean;
    basic: string | boolean;
    pro: string | boolean;
    enterprise: string | boolean;
  };
}

export interface PricingCategory {
  id: string;
  category: string;
  features: PricingFeature[];
}

export interface SubscriptionPlan {
  _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
  id: string;
  name: string;
  price: number; // Monthly price
  userLimit: number;
  features: ('DASHBOARD' | 'REPORTS' | 'TRACKING' | 'LEADS' | 'TASKS' | 'EMAIL' | 'WHATSAPP' | 'SMS' | 'CALLS' | 'AUTOMATION' | 'INTEGRATIONS' | 'USERS' | 'TEAMS' | 'SETTINGS' | 'API_ACCESS')[];
}

export interface Organization {
  _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
  id: string;
  name: string;
  code: string; // The unique code for login
  apiKey: string;
  isEnabled: boolean;
  subscriptionPlanId: string;
  subscriptionExpiresAt: string;
  logoUrl?: string;
  themeColor?: string;
  // New Fields
  storageUsedGb?: number;
  storageQuotaGb?: number;
  purchasedAddonIds?: string[];
  whiteLabelConfig?: {
    customDomain?: string;
    primaryColor?: string;
    logoUrl?: string;
  };
  securityConfig?: {
    isMfaEnforced?: boolean;
    ipWhitelist?: string[];
    ssoProvider?: 'google' | 'microsoft' | null;
  };
  manuallyAssignedFeatures?: SubscriptionPlan['features'];
  hasBlogAccess?: boolean;
}

export enum LeadSource {
  WEBSITE = "Website",
  FACEBOOK = "Facebook",
  GOOGLE_ADS = "Google Ads",
  REFERRAL = "Referral",
  COLD_CALL = "Cold Call",
  CHATBOT = "Chatbot",
}

export interface Stage {
    _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
    id: string;
    name: string;
    color: string;
    organizationId: string;
}

export enum FollowUpStatus {
    PENDING = "Pending",
    INTERESTED = "Interested",
    CALL_LATER = "Call Later",
    NOT_INTERESTED = "Not Interested",
    CONVERTED = "Converted",
}

export enum UserRole {
    SUPER_ADMIN = "Super Admin",
    ADMIN = "Admin",
    MANAGER = "Manager",
    SALES_REP = "Sales Rep",
}

export enum Permission {
    VIEW_ALL_LEADS = 'view:all_leads',
    DELETE_LEADS = 'delete:leads',
    ASSIGN_LEADS = 'assign:leads',
    MANAGE_USERS = 'manage:users',
    MANAGE_TEAMS = 'manage:teams',
    MANAGE_SETTINGS = 'manage:settings',
    MANAGE_AUTOMATION = 'manage:automation',
    MANAGE_INTEGRATIONS = 'manage:integrations',
    VIEW_TRACKING_DASHBOARD = 'view:tracking_dashboard',
}

export interface Team {
    _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
    id: string;
    name: string;
    leadId: number;
    memberIds: number[];
    organizationId: string;
}

export interface Activity {
  id: string;
  type: "NOTE" | "EMAIL" | "WHATSAPP" | "CALL" | "STATUS_CHANGE" | "LEAD_CREATED" | "TASK_CREATED" | "TASK_COMPLETED" | "FIELD_UPDATE" | "MESSAGE_SCHEDULED" | "SMS";
  content: string;
  timestamp: string;
  authorId: number;
}

export interface Task {
    _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
    id: string;
    title: string;
    dueDate: string;
    isCompleted: boolean;
    assignedToId: number;
    leadId?: string; // Can be a general task not tied to a lead
    createdAt: string;
    createdById: number; // Who created the task
    organizationId: string;
    batchId?: string; // To group tasks assigned to multiple users
}

export interface CustomFieldDefinition {
    _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'dropdown';
    options?: string[];
    isMappable: boolean;
    isRequired: boolean;
    organizationId: string;
}

export type LeadField = keyof Omit<Lead, 'id' | 'activities' | 'customFields' | 'tags' | 'scheduledMessages' | 'scoreBreakdown'>;

export interface Lead {
  // FIX: Add optional `_id` for MongoDB compatibility
  _id?: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone: string;
  city: string;
  course: string;
  company: string;
  source: LeadSource;
  stage: string; // Corresponds to Stage['id']
  followUpStatus: FollowUpStatus;
  score: number;
  scoreBreakdown?: { ruleId: string; description: string; points: number }[];
  tags: string[];
  assignedToId: number;
  createdAt: string;
  updatedAt: string;
  dealValue: number;
  closeDate: string;
  activities: Activity[];
  scheduledMessages?: ScheduledMessage[];
  campaign: string;
  facebookCampaign?: string;
  facebookAdset?: string;
  facebookAd?: string;
  customFields?: Record<string, string | number | null>;
  organizationId: string;
}

export interface User {
  _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
  id: number;
  name: string;
  email: string;
  password?: string;
  avatar: string;
  phone?: string;
  role: UserRole;
  teamId?: string;
  permissions: Permission[];
  isTrackingEnabled: boolean;
  organizationId: string;
  superAdminRole?: 'Co-Owner' | 'Finance Admin' | 'Support Admin';
}

export interface UserSessionLog {
  id: string;
  userId: number;
  loginTime: string;
  logoutTime: string | null;
  durationMs: number | null;
  organizationId: string;
}

export type IntegrationSource = 'Facebook' | 'Google Ads' | 'Website' | 'Cloud Telephony' | 'Email Marketing' | 'SMS Marketing';
export interface FieldMapping {
    sourceField: string;
    crmField: string;
}

export interface ConnectedFacebookPage {
    id: string;
    name: string;
    forms: { id: string; name: string }[];
}

export interface ConnectedFacebookAccount {
    id: string;
    name: string;
    accessToken: string;
    pages: ConnectedFacebookPage[];
}

export interface ConnectedGoogleAccount {
    id: string;
    name: string;
}

export interface ConnectedWebsite {
    id: string;
    url: string;
}

export interface IntegrationSettings {
    source: IntegrationSource;
    isConnected: boolean;
    fieldMappings: FieldMapping[];
    // Add specific connection details
    connectedAccounts?: (ConnectedGoogleAccount | ConnectedFacebookAccount)[]; // Generic container
    connectedWebsites?: ConnectedWebsite[];
    organizationId: string;
}


export interface IntegrationLog {
    id: string;
    source: IntegrationSource;
    payload: Record<string, any>;
    status: 'SUCCESS' | 'FAILED';
    reason?: {
        code: 'DUPLICATE_EMAIL' | 'INVALID_FORMAT' | 'MISSING_MANDATORY_FIELD' | 'UNMAPPED_FIELD';
        message: string;
    };
    timestamp: string;
    organizationId: string;
}

export type FilterOperator = 'contains' | 'equals' | 'not_equals' | 'gt' | 'lt' | 'gte' | 'lte' | 'is_between';
export interface FilterCondition {
    field: string;
    operator: FilterOperator;
    value: any;
    logic: 'AND' | 'OR';
}

export type AutomationTrigger = {
    type: 'NEW_LEAD';
} | {
    type: 'LEAD_UNTOUCHED';
    hours: number;
} | {
    type: 'STAGE_CHANGED';
    toStage: string;
} | {
    type: 'TASK_COMPLETED';
} | {
    type: 'LEAD_SCORE_REACHES';
    score: number;
};


export type AutomationAction = {
    type: 'ASSIGN_TO_USER';
    userId: number;
} | {
    type: 'ASSIGN_ROUND_ROBIN';
    teamId: string;
} | {
    type: 'ADD_TAG';
    tag: string;
} | {
    type: 'ASSIGN_TO_TEAM';
    teamId: string;
} | {
    type: 'SEND_WEBHOOK';
    url: string;
} | {
    type: 'CREATE_TASK';
    title: string;
    dueDays: number;
};

export interface AutomationRule {
    _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
    id: string;
    name: string;
    description: string;
    isEnabled: boolean;
    trigger: AutomationTrigger;
    conditions: FilterCondition[];
    action: AutomationAction;
    organizationId: string;
}

export interface WhatsAppTemplate {
    _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
    id: string;
    name: string;
    body: string;
    organizationId: string;
}

export interface SavedFilter {
    _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
    id: string;
    name: string;
    logic: 'AND' | 'OR';
    conditions: FilterCondition[];
    organizationId: string;
}


export interface ChatbotQuestion {
    id: string;
    question: string;
    crmField: LeadField | `customFields.${string}`;
    type: 'text' | 'email' | 'phone';
}

export interface ChatbotKeywordRule {
    id: string;
    keyword: string;
    response: string;
}

export interface ChatbotConfig {
    isEnabled: boolean;
    welcomeMessage: string;
    questions: ChatbotQuestion[];
    aiSystemPrompt: string;
    keywordRules: ChatbotKeywordRule[];
    thankYouMessage: string;
    widgetColor: string;
    widgetPosition: 'bottom-right' | 'bottom-left';
    widgetStyle: 'icon' | 'button';
    organizationId: string;
}

export interface ScheduledMessage {
    id: string;
    type: 'EMAIL' | 'WHATSAPP' | 'SMS';
    content: string;
    scheduledAt: string;
    status: 'PENDING' | 'SENT';
    leadId: string;
    organizationId: string;
}

export interface WebhookConfig {
    _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
    id: string;
    name: string;
    url: string;
    isEnabled: boolean;
    organizationId: string;
    events?: string[];
    lastTriggered?: string;
    triggerCount?: number;
    secret?: string;
    maskedSecret?: string;
    lastDelivery?: {
        timestamp: string;
        statusCode: number;
        responseTime: number;
        event: string;
    };
}

export interface EmailTemplate {
    _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
    id: string;
    name: string;
    subject: string;
    body: string; // Will be HTML/rich text
    organizationId: string;
}

export interface EmailCampaign {
    _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
    id: string;
    name: string;
    templateId: string;
    status: 'DRAFT' | 'SENT' | 'SCHEDULED';
    sentAt: string | null;
    scheduledAt: string | null;
    recipientCount: number;
    openRate: number; // Percentage
    organizationId: string;
    conditions: FilterCondition[];
}

export interface SMSTemplate {
    _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
    id: string;
    name: string;
    body: string;
    organizationId: string;
}

export interface SMSCampaign {
    _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
    id: string;
    name: string;
    templateId: string;
    status: 'DRAFT' | 'SENT' | 'SCHEDULED';
    sentAt: string | null;
    scheduledAt: string | null;
    recipientCount: number;
    deliveryRate: number; // Percentage
    organizationId: string;
    conditions: FilterCondition[];
}

export interface WhatsAppCampaign {
    _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
    id: string;
    name: string;
    templateId: string;
    status: 'DRAFT' | 'SENT' | 'SCHEDULED';
    sentAt: string | null;
    scheduledAt: string | null;
    recipientCount: number;
    deliveryRate: number; // Percentage
    organizationId: string;
    conditions: FilterCondition[];
}

export interface CallScript {
    _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
    id: string;
    name: string;
    body: string; // The call script text
    organizationId: string;
}

export interface CallCampaign {
    _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
    id: string;
    name: string;
    scriptId: string;
    status: 'DRAFT' | 'SENT' | 'SCHEDULED';
    sentAt: string | null;
    scheduledAt: string | null;
    recipientCount: number;
    connectionRate: number; // Percentage of calls that connected
    organizationId: string;
    conditions: FilterCondition[];
}

export type LeadScoreOperator = 'equals' | 'contains' | 'not_equals' | 'is_set' | 'is_not_set';

export interface LeadScoreRule {
    _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
    id: string;
    field: LeadField | `customFields.${string}`;
    operator: LeadScoreOperator;
    value?: string; // Not needed for is_set/is_not_set
    points: number;
    organizationId: string;
}

export interface SupportTicket {
    _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
    id: string;
    subject: string;
    organizationId: string;
    userId: number;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
    createdAt: string;
    lastReplyAt: string;
    replies?: {
        authorId: number;
        message: string;
        timestamp: string;
    }[];
}

export interface AuditLog {
    id: string;
    actorId: number; // Super Admin ID
    action: string;
    targetId?: string; // e.g., orgId, planId
    details: string;
    timestamp: string;
}

export interface GlobalAnnouncement {
    id: string;
    message: string;
    isActive: boolean;
    type: 'info' | 'warning' | 'critical';
}

// Super Admin Specific Types
export interface Addon {
    _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
    id: string;
    name: string;
    description: string;
    monthlyPrice: number;
    featureTag: string; // e.g., 'AI_CHATBOT'
}

export enum InquiryStatus {
  NEW = "New",
  CONTACTED = "Contacted",
  DNP = "DNP",
  CALL_BACK_LATER = "Call Back Later",
  INTERESTED = "Interested",
  NOT_INTERESTED = "Not Interested",
  JUNK = "Junk",
  INVALID = "Invalid",
  CLOSED = "Closed",
  CONVERTED = "Converted",
}


export interface Inquiry {
  _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
  id: string;
  type: 'Contact Form' | 'Chatbot';
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  createdAt: string;
  status: InquiryStatus;
}

export type PaymentGatewayProvider = 'stripe' | 'razorpay' | 'paypal';

export interface PaymentGatewaySetting {
    provider: PaymentGatewayProvider;
    name: string;
    apiKey: string;
    apiSecret: string;
    isEnabled: boolean;
}

export interface SystemHealthMetric {
    timestamp: string;
    cpuLoad: number; // percentage
    memoryUsage: number; // percentage
    responseTime: number; // ms
    uptime: number; // percentage
}

export interface ApiUsageLog {
    id: string;
    organizationId: string;
    timestamp: string;
    endpoint: string;
    statusCode: number;
}

export interface ErrorLog {
    id: string;
    timestamp: string;
    service: string; // e.g., 'frontend', 'api', 'facebook-sync'
    message: string;
    stackTrace?: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
}

export type GlobalAutomationTrigger = {
    type: 'TRIAL_EXPIRING';
    daysBefore: number;
} | {
    type: 'SUBSCRIPTION_PAYMENT_FAILED';
} | {
    type: 'TRIAL_STARTED'
} | {
    type: 'SUBSCRIPTION_CANCELED'
} | {
    type: 'ORGANIZATION_CREATED'
};

export type GlobalAutomationAction = {
    type: 'SEND_EMAIL_TO_ADMIN';
    templateId: string;
} | {
    type: 'SEND_EMAIL_TO_SUPER_ADMIN';
    recipientId: number; // super admin user id
};

export interface GlobalAutomationRule {
    _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
    id: string;
    name: string;
    description: string;
    isEnabled: boolean;
    trigger: GlobalAutomationTrigger;
    action: GlobalAutomationAction;
}

export interface GlobalEmailTemplate {
    id: string;
    name: string;
    subject: string;
}

export interface GlobalIntegrationStatus {
    source: IntegrationSource;
    isEnabled: boolean;
}

export interface LocalizationSettings {
    defaultLanguage: 'en' | 'es' | 'fr' | 'de';
    supportedLanguages: ('en' | 'es' | 'fr' | 'de')[];
    defaultTimezone: string;
    defaultCurrency: 'USD' | 'EUR' | 'GBP' | 'INR';
}

export interface BillingHistory {
    id: string;
    date: string;
    amount: number;
    planName: string;
    status: 'Paid' | 'Failed';
    invoiceUrl: string;
    organizationId: string;
}

export interface CustomDomain {
    _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
    id: string;
    domain: string;
    status: 'pending' | 'verified';
    organizationId: string;
}

export interface CustomDashboardWidget {
  id: string;
  title: string;
  chartType: 'bar' | 'pie' | 'line' | 'stat';
  metric: 'lead_count' | 'deal_value_sum' | 'deal_value_avg';
  dimension: 'source' | 'assignedToId' | 'stage' | 'createdAt_month' | 'campaign';
}

export interface Coupon {
    _id?: string; // FIX: Add optional `_id` for MongoDB compatibility
    id: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    expiresAt?: string;
    isActive: boolean;
}

export interface OfferStrip {
    isEnabled: boolean;
    text: string;
    ctaText?: string;
    ctaLink?: string;
    autoDisableAt?: string; // ISO string
}

export interface OrganizationApiKeyData {
    apiKey?: string;
    status: 'active' | 'revoked';
    lastUsed?: string;
    hasApiKey: boolean;
}

export interface WebhookTestResult {
    success: boolean;
    status?: number;
    responseTime?: number;
    response?: string;
    error?: string;
}


