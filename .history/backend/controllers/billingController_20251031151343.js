import Organization from '../models/Organization.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import BillingHistory from '../models/BillingHistory.js';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

// @desc    Get billing history for organization
// @route   GET /api/billing/history
// @access  Protected
export const getBillingHistory = async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        if (!orgId) {
            return res.status(400).json({ message: 'No organization found for this user.' });
        }

        const billingHistory = await BillingHistory.find({ organizationId: orgId })
            .sort({ date: -1 })
            .limit(50);

        res.json({
            success: true,
            data: billingHistory
        });
    } catch (error) {
        console.error('Error fetching billing history:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get available subscription plans
// @route   GET /api/billing/plans
// @access  Protected
export const getSubscriptionPlans = async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find({ isActive: true });
        res.json({
            success: true,
            data: plans
        });
    } catch (error) {
        console.error('Error fetching subscription plans:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Upgrade/Downgrade subscription
// @route   POST /api/billing/subscription/change
// @access  Protected (Admin only)
export const changeSubscription = async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        const { newPlanId, billingCycle = 'monthly' } = req.body;

        if (!orgId) {
            return res.status(400).json({ message: 'No organization found for this user.' });
        }

        // Check if user has admin permissions
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Insufficient permissions to change subscription.' });
        }

        // Find the organization
        const organization = await Organization.findOne({ id: orgId });
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found.' });
        }

        // Find the new plan
        const newPlan = await SubscriptionPlan.findOne({ id: newPlanId });
        if (!newPlan) {
            return res.status(404).json({ message: 'Subscription plan not found.' });
        }

        // Calculate new expiration date based on billing cycle
        const now = new Date();
        let newExpirationDate = new Date(now);

        if (billingCycle === 'monthly') {
            newExpirationDate.setMonth(now.getMonth() + 1);
        } else if (billingCycle === 'yearly') {
            newExpirationDate.setFullYear(now.getFullYear() + 1);
        }

        // Update organization subscription
        organization.subscriptionPlanId = newPlanId;
        organization.subscriptionExpiresAt = newExpirationDate;
        await organization.save();

        // Create billing history record
        const billingRecord = new BillingHistory({
            id: `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            organizationId: orgId,
            planName: newPlan.name,
            amount: newPlan.price,
            status: 'completed',
            date: now,
            billingCycle,
            description: `Subscription changed to ${newPlan.name}`,
            invoiceUrl: null // In a real app, this would be a link to the actual invoice
        });

        await billingRecord.save();

        res.json({
            success: true,
            message: 'Subscription updated successfully',
            data: {
                organization: {
                    subscriptionPlanId: organization.subscriptionPlanId,
                    subscriptionExpiresAt: organization.subscriptionExpiresAt
                },
                billingRecord
            }
        });

    } catch (error) {
        console.error('Error changing subscription:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get current subscription details
// @route   GET /api/billing/subscription/current
// @access  Protected
export const getCurrentSubscription = async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        if (!orgId) {
            return res.status(400).json({ message: 'No organization found for this user.' });
        }

        const organization = await Organization.findOne({ id: orgId });
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found.' });
        }

        const currentPlan = await SubscriptionPlan.findOne({ id: organization.subscriptionPlanId });
        const allPlans = await SubscriptionPlan.find({ isActive: true });

        res.json({
            success: true,
            data: {
                currentPlan,
                allPlans,
                subscriptionDetails: {
                    planId: organization.subscriptionPlanId,
                    expiresAt: organization.subscriptionExpiresAt,
                    isActive: new Date(organization.subscriptionExpiresAt) > new Date()
                }
            }
        });

    } catch (error) {
        console.error('Error fetching current subscription:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};


