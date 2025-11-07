import EmailMarketingIntegration from '../models/EmailMarketingIntegration.js';
import SendGridService from '../services/sendGridService.js';

// @desc    Send email to a lead
// @route   POST /api/email/send
// @access  Protected
const sendEmail = async (req, res) => {
    try {
        const { leadId, to, cc, bcc, subject, body } = req.body;

        if (!to || !subject || !body) {
            return res.status(400).json({
                success: false,
                message: 'To, subject, and body are required'
            });
        }

        // Get active email integration for the organization
        const emailIntegration = await EmailMarketingIntegration.findOne({
            organizationId: req.user.organizationId,
            isActive: true
        });

        if (!emailIntegration) {
            return res.status(400).json({
                success: false,
                message: 'No active email integration found. Please configure email settings first.'
            });
        }

        // Create SendGrid service instance
        const sendGridService = new SendGridService(emailIntegration.apiKey);

        // Get verified sender identity
        const senders = await sendGridService.getSenders();
        const verifiedSender = senders.data.find(sender => sender.verified);

        if (!verifiedSender) {
            return res.status(400).json({
                success: false,
                message: 'No verified sender identity found. Please verify a sender in SendGrid.'
            });
        }

        // Send email
        const result = await sendGridService.sendEmail(
            to,
            verifiedSender.from,
            subject,
            body
        );

        // Create activity record for the lead if leadId provided
        if (leadId) {
            const Lead = (await import('../models/Lead.js')).default;
            const lead = await Lead.findOne({ id: leadId, organizationId: req.user.organizationId });

            if (lead) {
                // Update lead with email activity
                const activities = lead.activities || [];
                activities.unshift({
                    type: 'EMAIL',
                    content: `Email sent to ${to}. Subject: <strong>${subject}</strong>`,
                    timestamp: new Date().toISOString(),
                    authorId: req.user.id,
                    status: result.success ? 'sent' : 'failed',
                    metadata: {
                        messageId: result.messageId,
                        provider: 'sendgrid',
                        to,
                        cc,
                        bcc
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
            message: 'Email sent successfully',
            data: {
                messageId: result.messageId,
                statusCode: result.statusCode,
                provider: 'sendgrid'
            }
        });

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send email',
            error: error.message
        });
    }
};

// @desc    Get email delivery status
// @route   GET /api/email/status/:messageId
// @access  Protected
const getEmailDeliveryStatus = async (req, res) => {
    try {
        const { messageId } = req.params;

        // Get active email integration for the organization
        const emailIntegration = await EmailMarketingIntegration.findOne({
            organizationId: req.user.organizationId,
            isActive: true
        });

        if (!emailIntegration) {
            return res.status(400).json({
                success: false,
                message: 'No active email integration found'
            });
        }

        // Create SendGrid service instance
        const sendGridService = new SendGridService(emailIntegration.apiKey);

        // Note: SendGrid doesn't provide real-time delivery status for individual emails
        // This would need to be implemented using webhooks for actual delivery tracking
        res.json({
            success: true,
            data: {
                messageId,
                status: 'sent',
                note: 'SendGrid delivery status requires webhook configuration for real-time updates'
            }
        });

    } catch (error) {
        console.error('Error getting email delivery status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get email delivery status',
            error: error.message
        });
    }
};

export { sendEmail, getEmailDeliveryStatus };


