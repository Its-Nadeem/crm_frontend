import twilio from 'twilio';
import axios from 'axios';

class SMSService {
    constructor(provider, credentials) {
        this.provider = provider;
        this.credentials = credentials;

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

    // Send SMS
    async sendSMS(to, message, senderId = null) {
        try {
            switch (this.provider) {
                case 'twilio':
                    const twilioMessage = await this.client.messages.create({
                        body: message,
                        to: to,
                        from: senderId || this.credentials.fromNumber
                    });

                    return {
                        success: true,
                        messageId: twilioMessage.sid,
                        status: twilioMessage.status,
                        provider: 'twilio',
                        data: twilioMessage
                    };

                case 'msg91':
                    return await this._sendMSG91SMS(to, message, senderId);

                case 'textlocal':
                    return await this._sendTextLocalSMS(to, message, senderId);

                default:
                    throw new Error(`SMS sending not implemented for provider: ${this.provider}`);
            }
        } catch (error) {
            throw new Error(`Failed to send SMS via ${this.provider}: ${error.message}`);
        }
    }

    // Send bulk SMS
    async sendBulkSMS(recipients, message, senderId = null) {
        try {
            const results = [];

            for (const recipient of recipients) {
                try {
                    const result = await this.sendSMS(recipient.phone, message, senderId);
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
                total: recipients.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                results
            };
        } catch (error) {
            throw new Error(`Failed to send bulk SMS: ${error.message}`);
        }
    }

    // Get delivery status
    async getDeliveryStatus(messageId) {
        try {
            switch (this.provider) {
                case 'twilio':
                    const message = await this.client.messages(messageId).fetch();
                    return {
                        success: true,
                        messageId,
                        status: message.status,
                        price: message.price,
                        dateSent: message.dateSent,
                        errorCode: message.errorCode,
                        errorMessage: message.errorMessage
                    };

                case 'msg91':
                case 'textlocal':
                    // Generic status check
                    return await this._getGenericDeliveryStatus(messageId);

                default:
                    throw new Error(`Status check not implemented for provider: ${this.provider}`);
            }
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


