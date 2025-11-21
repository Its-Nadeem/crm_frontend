import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import UserSessionLog from '../models/UserSessionLog.js';

// Login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user by email (case-insensitive) - normalize to lowercase for comparison
        const normalizedInputEmail = email.toLowerCase().trim();
        console.log('🔍 Login attempt for email:', email, '(normalized:', normalizedInputEmail, ')');

        // Find user with case-insensitive search
        const user = await User.findOne({
            email: { $regex: new RegExp(`^${normalizedInputEmail}$`, 'i') }
        });

        if (user) {
            console.log('✅ User found with case-insensitive search:', user.email);
        } else {
            console.log('❌ User not found with case-insensitive search');
        }
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate access token
        const token = jwt.sign(
            {
                id: user.id || user._id,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId
            },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: process.env.JWT_EXPIRE || '1h' }
        );

        // Generate refresh token
        const refreshToken = jwt.sign(
            { id: user.id || user._id },
            process.env.JWT_REFRESH_SECRET || 'refresh_secret',
            { expiresIn: '7d' }
        );

        // Get organization data
        const organizationId = user.organizationId;
        let organization = null;
        try {
            organization = await Organization.findOne({ id: organizationId });
        } catch (orgError) {
            console.error('Failed to fetch organization:', orgError);
            // Continue with defaults
        }

        const subscriptionPlan = {
            code: organization?.subscriptionPlanId || 'plan_free',
            features: organization?.manuallyAssignedFeatures || ['LEADS', 'USERS'],
            expiresAt: organization?.subscriptionExpiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
        };

        // Special case for org-1 - always Enterprise
        if (organizationId === 'org-1') {
            subscriptionPlan.code = 'plan_enterprise';
            subscriptionPlan.features = [
                'DASHBOARD', 'LEADS', 'USERS', 'TEAMS', 'TASKS', 'INTEGRATIONS',
                'AUTOMATION', 'EMAIL', 'SMS', 'WHATSAPP', 'CALLS', 'REPORTS',
                'TRACKING', 'SETTINGS', 'BLOG', 'CUSTOM_FIELDS', 'WEBHOOKS'
            ];
        }

        // Log session start
        try {
            const sessionLog = new UserSessionLog({
                id: `session_${Date.now()}_${user.id}`,
                userId: user.id,
                loginTime: new Date().toISOString(),
                organizationId: organizationId,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                checkpoints: [{
                    timestamp: new Date().toISOString(),
                    event: 'login',
                    details: { method: 'password' }
                }]
            });
            await sessionLog.save();
            console.log(`📊 Session logged for user ${user.email}`);
        } catch (logError) {
            console.error('Failed to log session:', logError);
            // Don't fail login if logging fails
        }

        const tenantContext = {
            orgId: organization?.id || organizationId,
            orgName: organization?.name || 'Default Organization',
            plan: subscriptionPlan,
            role: user.role,
            permissions: user.permissions || [],
            userId: user.id || user._id?.toString(),
            userName: user.name,
            userEmail: user.email
        };

        res.json({
            success: true,
            token,
            refreshToken,
            user: {
                id: user.id || user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId
            },
            tenantContext
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
};

// Get tenant context (organization + subscription data)
export const getTenantContext = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get organization data
        const organization = await Organization.findOne({ id: user.organizationId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        // Get subscription plan details
        const subscriptionPlan = {
            code: organization.subscriptionPlanId || 'plan_free',
            features: organization.manuallyAssignedFeatures || ['LEADS', 'USERS'],
            expiresAt: organization.subscriptionExpiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
        };

        // Special case for org-1 - always Enterprise
        if (organization.id === 'org-1') {
            subscriptionPlan.code = 'plan_enterprise';
            subscriptionPlan.features = [
                'DASHBOARD', 'LEADS', 'USERS', 'TEAMS', 'TASKS', 'INTEGRATIONS',
                'AUTOMATION', 'EMAIL', 'SMS', 'WHATSAPP', 'CALLS', 'REPORTS',
                'TRACKING', 'SETTINGS', 'BLOG', 'CUSTOM_FIELDS', 'WEBHOOKS'
            ];
        }

        const tenantContext = {
            orgId: organization.id || organization._id?.toString(),
            orgName: organization.name,
            plan: subscriptionPlan,
            role: user.role,
            permissions: user.permissions || [],
            userId: user.id || user._id?.toString(),
            userName: user.name,
            userEmail: user.email
        };

        res.json({
            success: true,
            data: tenantContext
        });

    } catch (error) {
        console.error('Error getting tenant context:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get tenant context'
        });
    }
};

// Refresh access token
export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token required'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret');

        // Get user
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate new access token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId
            },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '1h' }
        );

        // Generate new refresh token
        const newRefreshToken = jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET || 'refresh_secret',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            refreshToken: newRefreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId
            }
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid refresh token'
        });
    }
};

// Middleware to attach tenant context to request
export const attachTenantContext = async (req, res, next) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get organization data
        const organization = await Organization.findOne({ id: user.organizationId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        // Attach to request for use in other middleware/controllers
        req.tenantContext = {
            orgId: organization.id || organization._id?.toString(),
            orgName: organization.name,
            subscriptionPlanId: organization.subscriptionPlanId,
            subscriptionExpiresAt: organization.subscriptionExpiresAt,
            manuallyAssignedFeatures: organization.manuallyAssignedFeatures,
            userRole: user.role,
            userPermissions: user.permissions || []
        };

        next();
    } catch (error) {
        console.error('Error attaching tenant context:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to attach tenant context'
        });
    }
};


