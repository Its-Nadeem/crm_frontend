import twilio from 'twilio';
import axios from 'axios';

class TwilioService {
    constructor(accountSid, authToken) {
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.client = twilio(accountSid, authToken);
    }

    // Test connection to Twilio API
    async testConnection() {
        try {
            const response = await this.client.api.accounts(this.accountSid).fetch();
            return {
                success: true,
                status: 'healthy',
                responseTime: response.responseTime || 0,
                data: {
                    accountSid: response.sid,
                    status: response.status,
                    type: response.type
                }
            };
        } catch (error) {
            return {
                success: false,
                status: 'unhealthy',
                error: error.message,
                code: error.code
            };
        }
    }

    // Get all phone numbers
    async getPhoneNumbers() {
        try {
            const numbers = await this.client.incomingPhoneNumbers.list();
            return {
                success: true,
                data: numbers.map(number => ({
                    number: number.phoneNumber,
                    friendlyName: number.friendlyName,
                    capabilities: {
                        sms: number.capabilities.sms,
                        voice: number.capabilities.voice,
                        mms: number.capabilities.mms
                    },
                    isActive: true
                }))
            };
        } catch (error) {
            throw new Error(`Failed to fetch phone numbers: ${error.message}`);
        }
    }

    // Make a voice call
    async makeCall(to, from, url = null) {
        try {
            const call = await this.client.calls.create({
                to,
                from,
                url: url || 'http://demo.twilio.com/docs/voice.xml' // Default TwiML
            });

            return {
                success: true,
                callSid: call.sid,
                status: call.status,
                data: call
            };
        } catch (error) {
            throw new Error(`Failed to make call: ${error.message}`);
        }
    }

    // Send SMS
    async sendSMS(to, from, body) {
        try {
            const message = await this.client.messages.create({
                body,
                to,
                from
            });

            return {
                success: true,
                messageSid: message.sid,
                status: message.status,
                data: message
            };
        } catch (error) {
            throw new Error(`Failed to send SMS: ${error.message}`);
        }
    }

    // Get call details
    async getCallDetails(callSid) {
        try {
            const call = await this.client.calls(callSid).fetch();
            return {
                success: true,
                data: {
                    sid: call.sid,
                    status: call.status,
                    duration: call.duration,
                    price: call.price,
                    from: call.from,
                    to: call.to,
                    startTime: call.startTime,
                    endTime: call.endTime
                }
            };
        } catch (error) {
            throw new Error(`Failed to get call details: ${error.message}`);
        }
    }

    // Get message details
    async getMessageDetails(messageSid) {
        try {
            const message = await this.client.messages(messageSid).fetch();
            return {
                success: true,
                data: {
                    sid: message.sid,
                    status: message.status,
                    price: message.price,
                    from: message.from,
                    to: message.to,
                    body: message.body,
                    dateSent: message.dateSent
                }
            };
        } catch (error) {
            throw new Error(`Failed to get message details: ${error.message}`);
        }
    }

    // Get account balance/usage
    async getAccountUsage() {
        try {
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

            const usage = await this.client.usage.records.list({
                category: 'totalprice',
                startDate: firstDay,
                endDate: lastDay
            });

            return {
                success: true,
                data: {
                    totalUsage: usage.reduce((sum, record) => sum + parseFloat(record.price), 0),
                    records: usage.length,
                    period: {
                        start: firstDay,
                        end: lastDay
                    }
                }
            };
        } catch (error) {
            throw new Error(`Failed to get account usage: ${error.message}`);
        }
    }
}

export default TwilioService;


