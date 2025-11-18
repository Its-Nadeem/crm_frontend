import axios from 'axios';

class SendGridService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.sendgrid.com/v3';
        this.headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };
    }

    // Test connection to SendGrid API
    async testConnection() {
        try {
            const startTime = Date.now();
            const response = await axios.get(`${this.baseURL}/user/account`, {
                headers: this.headers,
                timeout: 10000
            });
            const responseTime = Date.now() - startTime;

            return {
                success: true,
                status: 'healthy',
                responseTime,
                data: {
                    type: response.data.type,
                    reputation: response.data.reputation
                }
            };
        } catch (error) {
            return {
                success: false,
                status: 'unhealthy',
                error: error.response?.data?.errors?.[0]?.message || error.message,
                code: error.response?.status || error.code
            };
        }
    }

    // Send email
    async sendEmail(to, from, subject, htmlContent, textContent = null) {
        try {
            const emailData = {
                personalizations: [{
                    to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }]
                }],
                from: { email: from },
                subject: subject,
                content: [
                    { type: 'text/plain', value: textContent || htmlContent.replace(/<[^>]*>/g, '') },
                    { type: 'text/html', value: htmlContent }
                ]
            };

            const response = await axios.post(`${this.baseURL}/mail/send`, emailData, {
                headers: this.headers,
                timeout: 30000
            });

            return {
                success: true,
                messageId: response.headers['x-message-id'],
                statusCode: response.status,
                data: response.data
            };
        } catch (error) {
            throw new Error(`Failed to send email: ${error.response?.data?.errors?.[0]?.message || error.message}`);
        }
    }

    // Get account statistics
    async getAccountStats(startDate = null, endDate = null) {
        try {
            const params = {};
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const response = await axios.get(`${this.baseURL}/stats`, {
                headers: this.headers,
                params,
                timeout: 15000
            });

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            throw new Error(`Failed to get account stats: ${error.response?.data?.errors?.[0]?.message || error.message}`);
        }
    }

    // Get suppression list (bounces, unsubscribes, spam reports)
    async getSuppressions(type = 'bounces') {
        try {
            const response = await axios.get(`${this.baseURL}/suppression/${type}`, {
                headers: this.headers,
                timeout: 15000
            });

            return {
                success: true,
                data: response.data,
                count: response.data.length
            };
        } catch (error) {
            throw new Error(`Failed to get suppressions: ${error.response?.data?.errors?.[0]?.message || error.message}`);
        }
    }

    // Create contact list
    async createList(name) {
        try {
            const response = await axios.post(`${this.baseURL}/marketing/lists`, {
                name: name
            }, {
                headers: this.headers,
                timeout: 10000
            });

            return {
                success: true,
                listId: response.data.id,
                data: response.data
            };
        } catch (error) {
            throw new Error(`Failed to create list: ${error.response?.data?.errors?.[0]?.message || error.message}`);
        }
    }

    // Add contacts to list
    async addContactsToList(listId, contacts) {
        try {
            const response = await axios.post(`${this.baseURL}/marketing/contacts`,
                {
                    list_ids: [listId],
                    contacts: contacts.map(contact => ({
                        email: contact.email,
                        first_name: contact.firstName,
                        last_name: contact.lastName,
                        custom_fields: contact.customFields || {}
                    }))
                },
                {
                    headers: this.headers,
                    timeout: 30000
                }
            );

            return {
                success: true,
                jobId: response.data.job_id,
                data: response.data
            };
        } catch (error) {
            throw new Error(`Failed to add contacts: ${error.response?.data?.errors?.[0]?.message || error.message}`);
        }
    }

    // Get lists
    async getLists() {
        try {
            const response = await axios.get(`${this.baseURL}/marketing/lists`, {
                headers: this.headers,
                timeout: 15000
            });

            return {
                success: true,
                data: response.data.result.map(list => ({
                    listId: list.id,
                    name: list.name,
                    contactCount: list.contact_count
                }))
            };
        } catch (error) {
            throw new Error(`Failed to get lists: ${error.response?.data?.errors?.[0]?.message || error.message}`);
        }
    }

    // Get sender identities
    async getSenders() {
        try {
            const response = await axios.get(`${this.baseURL}/senders`, {
                headers: this.headers,
                timeout: 15000
            });

            return {
                success: true,
                data: response.data.map(sender => ({
                    id: sender.id,
                    nickname: sender.nickname,
                    from: sender.from,
                    verified: sender.verified
                }))
            };
        } catch (error) {
            throw new Error(`Failed to get senders: ${error.response?.data?.errors?.[0]?.message || error.message}`);
        }
    }
}

export default SendGridService;


