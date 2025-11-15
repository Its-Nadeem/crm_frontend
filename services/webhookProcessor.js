import { processPendingDeliveries } from './webhookDeliveryService.js';

// Process webhook retries every minute
export const startWebhookProcessor = () => {
    console.log('🚀 Starting webhook delivery processor...');

    // Process immediately on startup
    processPendingDeliveries().catch(error => {
        console.error('Error in initial webhook processing:', error);
    });

    // Set up interval for continuous processing
    const interval = setInterval(async () => {
        try {
            const result = await processPendingDeliveries();
            if (result.processed > 0) {
                console.log(`✅ Processed ${result.processed} pending webhook deliveries`);
            }
        } catch (error) {
            console.error('Error processing webhook deliveries:', error);
        }
    }, 60000); // Every minute

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('🛑 Stopping webhook processor...');
        clearInterval(interval);
    });

    process.on('SIGINT', () => {
        console.log('🛑 Stopping webhook processor...');
        clearInterval(interval);
    });

    return interval;
};


