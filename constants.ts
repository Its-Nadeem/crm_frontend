import { Stage, LeadSource, FollowUpStatus, UserRole, Permission } from './types';

export const LEAD_SOURCES: LeadSource[] = [
    LeadSource.WEBSITE,
    LeadSource.FACEBOOK,
    LeadSource.GOOGLE_ADS,
    LeadSource.REFERRAL,
    LeadSource.COLD_CALL,
];

export const FOLLOW_UP_STATUSES: FollowUpStatus[] = [
    FollowUpStatus.PENDING,
    FollowUpStatus.INTERESTED,
    FollowUpStatus.CALL_LATER,
    FollowUpStatus.NOT_INTERESTED,
    FollowUpStatus.CONVERTED,
];

export const USER_ROLES: UserRole[] = [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SALES_REP,
];

export const PERMISSIONS: { id: Permission; name: string; description: string }[] = [
    { id: Permission.VIEW_ALL_LEADS, name: 'View All Leads', description: 'Can see all leads, not just their own or their team\'s.' },
    { id: Permission.DELETE_LEADS, name: 'Delete Leads', description: 'Can delete leads from the system.' },
    { id: Permission.ASSIGN_LEADS, name: 'Assign & Re-assign Leads', description: 'Can change the owner of any lead.'},
    { id: Permission.MANAGE_USERS, name: 'Manage Users & Permissions', description: 'Can add, edit, and delete users and their permissions.' },
    { id: Permission.MANAGE_TEAMS, name: 'Manage Teams', description: 'Can create and manage sales teams.' },
    { id: Permission.MANAGE_SETTINGS, name: 'Manage Workspace Settings', description: 'Can edit pipeline stages and custom fields.' },
    { id: Permission.MANAGE_AUTOMATION, name: 'Manage Automation Rules', description: 'Can create, edit, and delete automation rules.' },
    { id: Permission.MANAGE_INTEGRATIONS, name: 'Manage Integrations', description: 'Can connect/disconnect sources and map fields.' },
    { id: Permission.VIEW_TRACKING_DASHBOARD, name: 'View Tracking Dashboard', description: 'Can view employee productivity and session reports.' },
];


