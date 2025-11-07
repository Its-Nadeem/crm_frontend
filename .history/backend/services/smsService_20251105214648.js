import twilio from 'twilio';
import axios from 'axios';
import SMSMessage from '../models/SMSMessage.js';
import SMSIntegration from '../models/SMSIntegration.js';

class SMSService {
    constructor(provider, credentials, integrationId = null, organizationId = null) {
        this.provider = provider;
        this.credentials = credentials;
        this.integrationId = integrationId;
        this.organizationId = organizationId;

        switch (provider) {
            case 'twilio':
                this.client = twilio(credentials.accountSid, credentials.authToken);
                break;
            case 'msg91':
                this.apiKey = credentials.apiKey;
                this.senderId = credentials.senderId;
                break;
            case 'textlocal':
                this.apiKey = credentials.apiKey;
                this.senderId = credentials.senderId;
                break;
            default:
                throw new Error(`Unsupported SMS provider: ${provider}`);
        }
    }

    // Test connection to SMS provider
    async testConnection() {
        try {
            const startTime = Date.now();

            switch (this.provider) {
                case 'twilio':
                    const response = await this.client.api.accounts(this.credentials.accountSid).fetch();
                    const responseTime = Date.now() - startTime;
                    return {
                        success: true,
                        status: 'healthy',
                        responseTime,
                        data: {
                            accountSid: response.sid,
                            status: response.status,
                            type: response.type
                        }
                    };

                case 'msg91':
                case 'textlocal':
                    // Test with balance check or account info
                    const testResponse = await this._makeGenericRequest();
                    const genericResponseTime = Date.now() - startTime;
                    return {
                        success: true,
                        status: 'healthy',
                        responseTime: genericResponseTime,
                        data: testResponse
                    };

                default:
                    throw new Error(`Test not implemented for provider: ${this.provider}`);
            }
        } catch (error) {
            return {
                success: false,
                status: 'unhealthy',
                error: error.message,
                code: error.code
            };
        }
    }

    // Send SMS with database tracking
    async sendSMS(to, message, senderId = null, options = {}) {
        const messageId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            // Create SMS message record in database
            const smsMessage = new SMSMessage({
                messageId,
                organizationId: this.organizationId,
                integrationId: this.integrationId,
                to,
                from: senderId || this.credentials.fromNumber || this.senderId,
                message,
                provider: this.provider,
                type: options.type || 'single',
                listId: options.listId,
                campaignId: options.campaignId,
                metadata: {
                    source: options.source || 'api',
                    tags: options.tags || [],
                    customData: options.customData || {},
                    userAgent: options.userAgent,
                    ipAddress: options.ipAddress
                }
            });

            await smsMessage.save();

            // Send via provider
            let providerResult;
            switch (this.provider) {
                case 'twilio':
                    providerResult = await this._sendTwilioSMS(to, message, senderId);
                    break;
                case 'msg91':
                    providerResult = await this._sendMSG91SMS(to, message, senderId);
                    break;
                case 'textlocal':
                    providerResult = await this._sendTextLocalSMS(to, message, senderId);
                    break;
                default:
                    throw new Error(`SMS sending not implemented for provider: ${this.provider}`);
            }

            // Update message with provider response
            smsMessage.providerMessageId = providerResult.messageId;
            smsMessage.status = 'sent';
            smsMessage.delivery.sentAt = new Date();
            smsMessage.cost = providerResult.cost || 0.05; // Default cost
            smsMessage.segments = providerResult.segments || 1;

            await smsMessage.save();

            // Update integration usage
            if (this.integrationId) {
                await SMSIntegration.findByIdAndUpdate(this.integrationId, {
                    $inc: {
                        'usage.messagesSentToday': 1,
                        'usage.messagesSentThisMonth': 1,
                        'usage.totalCreditsUsed': 1
                    }
                });
            }

            return {
                success: true,
                messageId,
                providerMessageId: providerResult.messageId,
                status: 'sent',
                provider: this.provider,
                cost: smsMessage.cost,
                segments: smsMessage.segments
            };

        } catch (error) {
            // Update message with failure
            if (this.organizationId) {
                await SMSMessage.findOneAndUpdate(
                    { messageId },
                    {
                        status: 'failed',
                        'delivery.failedAt': new Date(),
                        'delivery.errorCode': error.code || 'UNKNOWN_ERROR',
                        'delivery.errorMessage': error.message
                    }
                );
            }

            throw new Error(`Failed to send SMS via ${this.provider}: ${error.message}`);
        }
    }

    // Send bulk SMS with database tracking
    async sendBulkSMS(recipients, message, senderId = null, options = {}) {
        try {
            const results = [];
            const batchId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            for (const recipient of recipients) {
                try {
                    const result = await this.sendSMS(recipient.phone, message, senderId, {
                        ...options,
                        type: 'bulk',
                        listId: options.listId,
                        campaignId: batchId
                    });
                    results.push({
                        phone: recipient.phone,
                        success: true,
                        messageId: result.messageId,
                        status: result.status
                    });
                } catch (error) {
                    results.push({
                        phone: recipient.phone,
                        success: false,
                        error: error.message
                    });
                }
            }

            return {
                success: true,
                batchId,
                total: recipients.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                results
            };
        } catch (error) {
            throw new Error(`Failed to send bulk SMS: ${error.message}`);
        }
    }

    // Get delivery status with database update
    async getDeliveryStatus(messageId) {
        try {
            // First check database for our internal message
            const smsMessage = await SMSMessage.findOne({ messageId });
            if (!smsMessage) {
                throw new Error('Message not found in database');
            }

            // Get status from provider
            let providerStatus;
            switch (this.provider) {
                case 'twilio':
                    providerStatus = await this._getTwilioDeliveryStatus(smsMessage.providerMessageId || messageId);
                    break;
                case 'msg91':
                case 'textlocal':
                    providerStatus = await this._getGenericDeliveryStatus(messageId);
                    break;
                default:
                    throw new Error(`Status check not implemented for provider: ${this.provider}`);
            }

            // Update database with latest status
            if (providerStatus.status !== smsMessage.status) {
                const updateData = {
                    status: providerStatus.status,
                    'delivery.errorCode': providerStatus.errorCode,
                    'delivery.errorMessage': providerStatus.errorMessage
                };

                if (providerStatus.status === 'delivered' && !smsMessage.delivery.deliveredAt) {
                    updateData['delivery.deliveredAt'] = new Date();
                } else if (providerStatus.status === 'failed' && !smsMessage.delivery.failedAt) {
                    updateData['delivery.failedAt'] = new Date();
                }

                await SMSMessage.findOneAndUpdate({ messageId }, updateData);
            }

            return {
                success: true,
                messageId,
                status: providerStatus.status,
                cost: smsMessage.cost,
                segments: smsMessage.segments,
                sentAt: smsMessage.delivery.sentAt,
                deliveredAt: smsMessage.delivery.deliveredAt,
                errorCode: providerStatus.errorCode,
                errorMessage: providerStatus.errorMessage
            };

        } catch (error) {
            throw new Error(`Failed to get delivery status: ${error.message}`);
        }
    }

    // MSG91 SMS sending
    async _sendMSG91SMS(to, message, senderId) {
        const url = 'https://api.msg91.com/api/v2/sendsms';
        const data = {
            sender: senderId || this.senderId,
            route: '4',
            country: '91',
            sms: [{
                message: message,
                to: [to]
            }]
        };

        const headers = {
            'authkey': this.apiKey,
            'Content-Type': 'application/json'
        };

        const response = await axios.post(url, data, { headers, timeout: 30000 });

        if (response.data.type === 'success') {
            return {
                success: true,
                messageId: response.data.message[0]['message-id'],
                status: 'sent',
                provider: 'msg91',
                data: response.data
            };
        } else {
            throw new Error(response.data.message || 'MSG91 SMS failed');
        }
    }

    // TextLocal SMS sending
    async _sendTextLocalSMS(to, message, senderId) {
        const url = 'https://api.textlocal.in/send/';
        const data = {
            apiKey: this.apiKey,
            sender: senderId || this.senderId,
            numbers: to,
            message: message
        };

        const response = await axios.post(url, data, { timeout: 30000 });

        if (response.data.status === 'success') {
            return {
                success: true,
                messageId: response.data.messages[0].id,
                status: 'sent',
                provider: 'textlocal',
                data: response.data
            };
        } else {
            throw new Error(response.data.errors?.[0]?.message || 'TextLocal SMS failed');
        }
    }

    // Generic delivery status check
    async _getGenericDeliveryStatus(messageId) {
        // This would need to be implemented based on the specific provider's API
        return {
            success: true,
            messageId,
            status: 'unknown',
            note: 'Status checking requires provider-specific implementation'
        };
    }

    // Generic request for testing
    async _makeGenericRequest() {
        switch (this.provider) {
            case 'msg91':
                const msg91Response = await axios.get('https://api.msg91.com/api/balance.php', {
                    params: { authkey: this.apiKey },
                    timeout: 10000
                });
                return { balance: msg91Response.data };

            case 'textlocal':
                const textlocalResponse = await axios.get('https://api.textlocal.in/balance', {
                    params: { apiKey: this.apiKey },
                    timeout: 10000
                });
                return { balance: textlocalResponse.data.balance };

            default:
                return { status: 'connected' };
        }
    }
}

export default SMSService;


