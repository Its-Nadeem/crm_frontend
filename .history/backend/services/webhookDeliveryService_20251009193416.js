import WebhookDeliveryLog from '../models/WebhookDeliveryLog.js';
import WebhookConfig from '../models/WebhookConfig.js';
import crypto from 'crypto';

// Process pending webhook deliveries
export const processPendingDeliveries = async () => {
    try {
        const pendingDeliveries = await WebhookDeliveryLog.getPendingRetries();

        for (const delivery of pendingDeliveries) {
            await retryDelivery(delivery);
        }

        return { processed: pendingDeliveries.length };
    } catch (error) {
        console.error('Error processing pending deliveries:', error);
        throw error;
    }
};

// Retry a single delivery
export const retryDelivery = async (deliveryLog) => {
    try {
        // Get the webhook config
        const webhook = await WebhookConfig.findById(deliveryLog.webhookId);
        if (!webhook || !webhook.isEnabled) {
            // Mark as permanently failed if webhook no longer exists or is disabled
            deliveryLog.status = 'failed';
            deliveryLog.errorMessage = 'Webhook no longer exists or is disabled';
            await deliveryLog.save();
            return;
        }

        // Check if we've exceeded max attempts
        if (deliveryLog.attemptNumber >= deliveryLog.maxAttempts) {
            deliveryLog.status = 'failed';
            deliveryLog.errorMessage = 'Max retry attempts exceeded';
            await deliveryLog.save();
            return;
        }

        // Increment attempt number
        deliveryLog.incrementAttempt();
        await deliveryLog.save();

        // Attempt delivery
        const startTime = Date.now();
        const response = await fetch(deliveryLog.url, {
            method: 'POST',
            headers: deliveryLog.headers,
            body: JSON.stringify(deliveryLog.payload)
        });
        const responseTime = Date.now() - startTime;

        const responseBody = await response.text();

        if (response.ok) {
            deliveryLog.markSuccess(response.status, responseBody, responseTime);
        } else {
            deliveryLog.markFailed(response.status, `HTTP ${response.status}: ${responseBody}`, responseTime);
        }

        await deliveryLog.save();

        // Update webhook stats if successful
        if (response.ok) {
            webhook.lastTriggered = new Date();
            webhook.triggerCount += 1;
            await webhook.save();
        }

    } catch (error) {
        const responseTime = Date.now() - (deliveryLog.createdAt?.getTime() || Date.now());

        deliveryLog.markFailed(0, error.message, responseTime);
        await deliveryLog.save();
    }
};

// Get delivery logs for a webhook
export const getDeliveryLogs = async (webhookId, limit = 50) => {
    console.log('getDeliveryLogs called with webhookId:', webhookId);

    // First verify the webhook exists
    const webhook = await WebhookConfig.findById(webhookId);
    if (!webhook) {
        console.log('Webhook not found:', webhookId);
        return [];
    }

    console.log('Webhook found, fetching logs...');
    return await WebhookDeliveryLog.getRecentLogs(webhookId, limit);
};

// Get delivery logs for an organization
export const getOrganizationDeliveryLogs = async (organizationId, limit = 100) => {
    return await WebhookDeliveryLog.find({ organizationId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('webhookId', 'name')
        .lean();
};

// Manual retry of a specific delivery
export const retrySpecificDelivery = async (deliveryId) => {
    const delivery = await WebhookDeliveryLog.findOne({ deliveryId });

    if (!delivery) {
        throw new Error('Delivery not found');
    }

    if (delivery.status !== 'failed') {
        throw new Error('Can only retry failed deliveries');
    }

    await retryDelivery(delivery);
    return delivery;
};

// Clean up old delivery logs (older than 30 days)
export const cleanupOldLogs = async (daysOld = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await WebhookDeliveryLog.deleteMany({
        createdAt: { $lt: cutoffDate }
    });

    return { deletedCount: result.deletedCount };
};


