import SMSMarketingIntegration from '../models/SMSMarketingIntegration.js';
import SMSService from '../services/smsService.js';

// @desc    Send SMS to a lead
// @route   POST /api/sms/send
// @access  Protected
const sendSMS = async (req, res) => {
    try {
        const { leadId, to, message, isUnicode = false } = req.body;

        if (!to || !message) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and message are required'
            });
        }

        // Get active SMS integration for the organization
        const smsIntegration = await SMSMarketingIntegration.findOne({
            organizationId: req.user.organizationId,
            isActive: true
        });

        if (!smsIntegration) {
            return res.status(400).json({
                success: false,
                message: 'No active SMS integration found. Please configure SMS settings first.'
            });
        }

        // Create SMS service instance
        const smsService = new SMSService(smsIntegration.provider, {
            apiKey: smsIntegration.apiKey,
            apiSecret: smsIntegration.apiSecret,
            accountSid: smsIntegration.accountSid,
            authToken: smsIntegration.authToken,
            senderId: smsIntegration.senderId
        });

        // Send SMS
        const result = await smsService.sendSMS(to, message, smsIntegration.senderId);

        // Create activity record for the lead if leadId provided
        if (leadId) {
            const Lead = (await import('../models/Lead.js')).default;
            const lead = await Lead.findOne({ id: leadId, organizationId: req.user.organizationId });

            if (lead) {
                // Update lead with SMS activity
                const activities = lead.activities || [];
                activities.unshift({
                    type: 'SMS',
                    content: `SMS sent: <i class="whitespace-pre-wrap">"${message}"</i>`,
                    timestamp: new Date().toISOString(),
                    authorId: req.user.id,
                    status: result.success ? 'sent' : 'failed',
                    metadata: {
                        messageId: result.messageId,
                        provider: smsIntegration.provider
                    }
                });

                await Lead.updateOne(
                    { id: leadId, organizationId: req.user.organizationId },
                    { activities }
                );
            }
        }

        res.json({
            success: true,
            message: 'SMS sent successfully',
            data: {
                messageId: result.messageId,
                status: result.status,
                provider: smsIntegration.provider
            }
        });

    } catch (error) {
        console.error('Error sending SMS:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send SMS',
            error: error.message
        });
    }
};

// @desc    Get SMS delivery status
// @route   GET /api/sms/status/:messageId
// @access  Protected
const getSMSDeliveryStatus = async (req, res) => {
    try {
        const { messageId } = req.params;

        // Get active SMS integration for the organization
        const smsIntegration = await SMSMarketingIntegration.findOne({
            organizationId: req.user.organizationId,
            isActive: true
        });

        if (!smsIntegration) {
            return res.status(400).json({
                success: false,
                message: 'No active SMS integration found'
            });
        }

        // Create SMS service instance
        const smsService = new SMSService(smsIntegration.provider, {
            apiKey: smsIntegration.apiKey,
            apiSecret: smsIntegration.apiSecret,
            accountSid: smsIntegration.accountSid,
            authToken: smsIntegration.authToken,
            senderId: smsIntegration.senderId
        });

        // Get delivery status
        const status = await smsService.getDeliveryStatus(messageId);

        res.json({
            success: true,
            data: status
        });

    } catch (error) {
        console.error('Error getting SMS delivery status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get SMS delivery status',
            error: error.message
        });
    }
};

export { sendSMS, getSMSDeliveryStatus };


