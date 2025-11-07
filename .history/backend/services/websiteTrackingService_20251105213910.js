import crypto from 'crypto';
import axios from 'axios';

class WebsiteTrackingService {
    constructor() {
        this.trackedForms = new Map();
        this.leadQueue = [];
        this.isProcessingQueue = false;
    }

    /**
     * Generate unique tracking script for a website
     * @param {string} organizationId - Organization ID
     * @param {string} apiEndpoint - CRM API endpoint
     * @returns {string} Tracking script code
     */
    generateTrackingScript(organizationId, apiEndpoint) {
        const scriptId = this.generateScriptId(organizationId);

        return `<!-- Clienn CRM Website Tracking Code -->
<script>
(function(w, d, s, o, f, js, fjs) {
    w[o] = w[o] || function() {
        (w[o].q = w[o].q || []).push(arguments)
    };
    js = d.createElement(s), fjs = d.getElementsByTagName(s)[0];
    js.id = o; js.src = f; js.async = 1;
    fjs.parentNode.insertBefore(js, fjs);
}(window, document, 'script', 'Clienn CRM', '${apiEndpoint}/track/${scriptId}'));

<!-- Initialize Clienn CRM -->
Clienn CRM('init', {
    organizationId: '${organizationId}',
    autoTrackForms: true,
    trackClicks: true,
    trackPageViews: true
});
</script>`;
    }

    /**
     * Generate unique script ID for organization
     * @param {string} organizationId - Organization ID
     * @returns {string} Script ID
     */
    generateScriptId(organizationId) {
        return crypto.createHash('md5').update(organizationId).digest('hex').substring(0, 16);
    }

    /**
     * Track form submission
     * @param {Object} formData - Form submission data
     * @param {string} scriptId - Tracking script ID
     * @param {Object} metadata - Additional metadata
     * @returns {Object} Tracking result
     */
    async trackFormSubmission(formData, scriptId, metadata = {}) {
        try {
            const leadData = {
                id: crypto.randomUUID(),
                source: 'website',
                scriptId: scriptId,
                formData: this.sanitizeFormData(formData),
                metadata: {
                    ...metadata,
                    userAgent: metadata.userAgent || '',
                    ipAddress: metadata.ipAddress || '',
                    referrer: metadata.referrer || '',
                    timestamp: new Date().toISOString(),
                    url: metadata.url || '',
                    formName: metadata.formName || 'Unknown Form',
                    formId: metadata.formId || ''
                },
                status: 'new',
                createdAt: new Date(),
                organizationId: metadata.organizationId || scriptId
            };

            // Add to processing queue
            this.leadQueue.push(leadData);
            
            // Process queue if not already processing
            if (!this.isProcessingQueue) {
                this.processLeadQueue();
            }

            return {
                success: true,
                leadId: leadData.id,
                message: 'Form submission tracked successfully'
            };
        } catch (error) {
            console.error('Failed to track form submission:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Track page views
     * @param {string} scriptId - Tracking script ID
     * @param {Object} pageData - Page view data
     * @param {Object} metadata - Additional metadata
     * @returns {Object} Tracking result
     */
    async trackPageView(scriptId, pageData, metadata = {}) {
        try {
            const pageViewData = {
                id: crypto.randomUUID(),
                type: 'page_view',
                scriptId: scriptId,
                pageData: {
                    url: pageData.url || '',
                    title: pageData.title || '',
                    referrer: pageData.referrer || ''
                },
                metadata: {
                    ...metadata,
                    userAgent: metadata.userAgent || '',
                    ipAddress: metadata.ipAddress || '',
                    timestamp: new Date().toISOString(),
                    sessionId: metadata.sessionId || this.generateSessionId()
                },
                organizationId: metadata.organizationId || scriptId,
                createdAt: new Date()
            };

            // Store page view data (you might want to save this to database)
            console.log('Page view tracked:', pageViewData);

            return {
                success: true,
                pageViewId: pageViewData.id
            };
        } catch (error) {
            console.error('Failed to track page view:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Track custom events
     * @param {string} scriptId - Tracking script ID
     * @param {string} eventName - Event name
     * @param {Object} eventData - Event data
     * @param {Object} metadata - Additional metadata
     * @returns {Object} Tracking result
     */
    async trackCustomEvent(scriptId, eventName, eventData, metadata = {}) {
        try {
            const event = {
                id: crypto.randomUUID(),
                type: 'custom_event',
                scriptId: scriptId,
                eventName: eventName,
                eventData: eventData,
                metadata: {
                    ...metadata,
                    userAgent: metadata.userAgent || '',
                    ipAddress: metadata.ipAddress || '',
                    timestamp: new Date().toISOString(),
                    url: metadata.url || ''
                },
                organizationId: metadata.organizationId || scriptId,
                createdAt: new Date()
            };

            // Store custom event data
            console.log('Custom event tracked:', event);

            return {
                success: true,
                eventId: event.id
            };
        } catch (error) {
            console.error('Failed to track custom event:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Process lead queue and save to database
     * @private
     */
    async processLeadQueue() {
        if (this.isProcessingQueue || this.leadQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        try {
            // Process leads in batches
            while (this.leadQueue.length > 0) {
                const lead = this.leadQueue.shift();
                
                // Here you would save the lead to your database
                // For now, we'll just log it
                console.log('Processing lead:', lead);
                
                // Simulate database save
                await this.saveLeadToDatabase(lead);
                
                // Add delay to avoid overwhelming the system
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (error) {
            console.error('Error processing lead queue:', error);
        } finally {
            this.isProcessingQueue = false;
        }
    }

    /**
     * Save lead to database (placeholder - implement based on your database schema)
     * @param {Object} leadData - Lead data to save
     * @private
     */
    async saveLeadToDatabase(leadData) {
        try {
            // Import Lead model dynamically to avoid circular dependencies
            const { default: Lead } = await import('../models/Lead.js');

            // Create lead in database
            const lead = new Lead({
                id: leadData.id,
                name: leadData.formData.name || leadData.formData.fullName || 'Unknown',
                email: leadData.formData.email || '',
                phone: leadData.formData.phone || leadData.formData.tel || '',
                source: 'website',
                stage: 'New',
                followUpStatus: 'Pending',
                score: 0,
                tags: ['Website Form'],
                assignedToId: 1, // Default assignment
                dealValue: 0,
                closeDate: new Date(),
                activities: [{
                    type: 'LEAD_CREATED',
                    content: `Lead created from website form submission`,
                    timestamp: new Date(),
                    authorId: 1
                }],
                organizationId: leadData.organizationId,
                customFields: {
                    ...leadData.formData,
                    formId: leadData.formId,
                    submissionId: leadData.id,
                    userAgent: leadData.metadata.userAgent,
                    ipAddress: leadData.metadata.ipAddress,
                    referrer: leadData.metadata.referrer,
                    url: leadData.metadata.url
                }
            });

            const savedLead = await lead.save();
            console.log('Lead saved to database:', savedLead.id);

            // Update website form statistics if formId is provided
            if (leadData.formId) {
                await this.updateFormStatistics(leadData.organizationId, leadData.formId, leadData);
            }

            // You might also want to trigger workflows, send notifications, etc.
            await this.triggerLeadWorkflows(savedLead);

        } catch (error) {
            console.error('Failed to save lead to database:', error);
            throw error;
        }
    }

    /**
     * Trigger lead workflows and automations
     * @param {Object} leadData - Lead data
     * @private
     */
    async triggerLeadWorkflows(leadData) {
        try {
            // This would integrate with your automation system
            // - Send welcome emails
            // - Assign to sales team
            // - Update lead score
            // - Trigger follow-up sequences
            
            console.log('Lead workflows triggered for:', leadData.id);
        } catch (error) {
            console.error('Failed to trigger lead workflows:', error);
        }
    }

    /**
     * Get website analytics data
     * @param {string} organizationId - Organization ID
     * @param {Object} dateRange - Date range for analytics
     * @returns {Object} Analytics data
     */
    async getWebsiteAnalytics(organizationId, dateRange = {}) {
        try {
            const { startDate, endDate } = dateRange;
            const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const end = endDate ? new Date(endDate) : new Date();

            // Import WebsiteForm model dynamically
            const { default: WebsiteForm } = await import('../models/WebsiteForm.js');

            // Query real analytics data from database
            const forms = await WebsiteForm.find({
                organizationId,
                status: 'Active'
            });

            const totalForms = forms.length;
            const activeForms = forms.filter(form => form.totalSubmissions > 0).length;
            const totalSubmissions = forms.reduce((sum, form) => sum + form.totalSubmissions, 0);

            // Get top performing forms
            const topPerformingForms = forms
                .sort((a, b) => b.totalSubmissions - a.totalSubmissions)
                .slice(0, 5)
                .map(form => ({
                    id: form.formId,
                    name: form.name,
                    submissions: form.totalSubmissions,
                    conversionRate: form.conversionRate,
                    lastSubmission: form.lastSubmission
                }));

            // Calculate overall conversion rate
            const conversionRate = totalForms > 0 ? totalSubmissions / totalForms : 0;

            return {
                totalForms,
                totalSubmissions,
                activeForms,
                conversionRate,
                topPerformingForms,
                trafficSources: [], // Would need additional tracking implementation
                pageViews: 0, // Would need page view tracking implementation
                uniqueVisitors: 0, // Would need visitor tracking implementation
                bounceRate: 0, // Would need session tracking implementation
                averageSessionDuration: 0, // Would need session tracking implementation
                period: {
                    start: start.toISOString(),
                    end: end.toISOString()
                }
            };
        } catch (error) {
            console.error('Failed to get website analytics:', error);
            throw error;
        }
    }

    /**
     * Get form performance data
     * @param {string} organizationId - Organization ID
     * @param {Object} options - Query options
     * @returns {Array} Form performance data
     */
    async getFormPerformance(organizationId, options = {}) {
        try {
            // Import WebsiteForm model dynamically
            const { default: WebsiteForm } = await import('../models/WebsiteForm.js');

            const { limit = 50, sortBy = 'totalSubmissions', sortOrder = -1 } = options;

            // Query real form performance data from database
            const forms = await WebsiteForm.find({
                organizationId,
                status: 'Active'
            })
            .sort({ [sortBy]: sortOrder })
            .limit(limit)
            .select('formId name url totalSubmissions uniqueSubmissions conversionRate lastSubmission customEvents recentSubmissions');

            // Format the data for frontend consumption
            return forms.map(form => ({
                id: form.formId,
                name: form.name,
                url: form.url,
                totalSubmissions: form.totalSubmissions,
                uniqueSubmissions: form.uniqueSubmissions,
                conversionRate: form.conversionRate,
                lastSubmission: form.lastSubmission,
                customEvents: form.customEvents.length,
                recentActivity: form.recentSubmissions.slice(0, 5).map(sub => ({
                    id: sub.id,
                    timestamp: sub.timestamp,
                    formData: sub.formData
                }))
            }));
        } catch (error) {
            console.error('Failed to get form performance:', error);
            throw error;
        }
    }

    /**
     * Sanitize form data to prevent XSS and ensure data integrity
     * @param {Object} formData - Raw form data
     * @returns {Object} Sanitized form data
     * @private
     */
    sanitizeFormData(formData) {
        const sanitized = {};
        
        for (const [key, value] of Object.entries(formData)) {
            if (typeof value === 'string') {
                // Basic sanitization - remove HTML tags and encode special characters
                sanitized[key] = value
                    .replace(/<[^>]*>/g, '') // Remove HTML tags
                    .replace(/[<>]/g, '') // Remove angle brackets
                    .trim()
                    .substring(0, 1000); // Limit length
            } else {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    }

    /**
     * Generate session ID for tracking
     * @returns {string} Session ID
     * @private
     */
    generateSessionId() {
        return crypto.randomBytes(16).toString('hex');
    }

    /**
     * Validate tracking script ID
     * @param {string} scriptId - Script ID to validate
     * @param {string} organizationId - Organization ID
     * @returns {boolean} Validation result
     */
    validateScriptId(scriptId, organizationId) {
        try {
            const expectedScriptId = this.generateScriptId(organizationId);
            return scriptId === expectedScriptId;
        } catch (error) {
            console.error('Failed to validate script ID:', error);
            return false;
        }
    }

    /**
     * Get real-time website statistics
     * @param {string} organizationId - Organization ID
     * @returns {Object} Real-time stats
     */
    async getRealTimeStats(organizationId) {
        try {
            // This would get real-time data from your tracking database
            return {
                activeVisitors: 0,
                currentPageViews: 0,
                recentSubmissions: 0,
                topPages: [],
                topReferrers: []
            };
        } catch (error) {
            console.error('Failed to get real-time stats:', error);
            throw error;
        }
    }
}

export default new WebsiteTrackingService();


