import FacebookActivityLog from '../models/FacebookActivityLog.js';
import FacebookIntegration from '../models/FacebookIntegration.js';

class FacebookActivityController {
    /**
     * Get Facebook activity logs with filtering and pagination
     */
    async getActivityLogs(req, res) {
        try {
            const {
                organizationId = 'org-1',
                activityType,
                status,
                formId,
                formName,
                campaignId,
                campaignName,
                leadId,
                startDate,
                endDate,
                page = 1,
                limit = 50,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            // Build filters object
            const filters = {
                organizationId,
                activityType,
                status,
                formId,
                formName,
                campaignId,
                campaignName,
                leadId,
                startDate,
                endDate
            };

            // Remove undefined filters
            Object.keys(filters).forEach(key => {
                if (filters[key] === undefined || filters[key] === '') {
                    delete filters[key];
                }
            });

            // Build options object
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy,
                sortOrder
            };

            // Get activity logs
            const logs = await FacebookActivityLog.getActivityLogs(filters, options);

            // Get total count for pagination
            const totalCount = await FacebookActivityLog.countDocuments(filters);

            // Get activity summary
            const summary = await FacebookActivityLog.getActivitySummary(organizationId, startDate, endDate);

            res.json({
                success: true,
                logs,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCount / limit),
                    totalCount,
                    hasNext: page * limit < totalCount,
                    hasPrev: page > 1
                },
                summary,
                filters: {
                    activityType,
                    status,
                    formId,
                    formName,
                    campaignId,
                    campaignName,
                    leadId,
                    startDate,
                    endDate
                }
            });

        } catch (error) {
            console.error('Error fetching Facebook activity logs:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Get available filter options for activity logs
     */
    async getFilterOptions(req, res) {
        try {
            const { organizationId = 'org-1' } = req.query;

            // Get distinct values for filter dropdowns
            const [
                activityTypes,
                statuses,
                formIds,
                formNames,
                campaignIds,
                campaignNames,
                leadIds
            ] = await Promise.all([
                FacebookActivityLog.distinct('activityType', { organizationId }),
                FacebookActivityLog.distinct('status', { organizationId }),
                FacebookActivityLog.distinct('formId', { organizationId }),
                FacebookActivityLog.distinct('formName', { organizationId }),
                FacebookActivityLog.distinct('campaignId', { organizationId }),
                FacebookActivityLog.distinct('campaignName', { organizationId }),
                FacebookActivityLog.distinct('leadId', { organizationId })
            ]);

            res.json({
                success: true,
                filterOptions: {
                    activityTypes,
                    statuses,
                    formIds,
                    formNames,
                    campaignIds,
                    campaignNames,
                    leadIds
                }
            });

        } catch (error) {
            console.error('Error fetching filter options:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Create a new activity log entry
     */
    async createActivityLog(req, res) {
        try {
            const {
                organizationId = 'org-1',
                accountId,
                pageId,
                formId,
                formName,
                campaignId,
                campaignName,
                leadId,
                leadData,
                activityType,
                description,
                details,
                status = 'success',
                errorMessage,
                metadata
            } = req.body;

            const activityLog = new FacebookActivityLog({
                organizationId,
                accountId,
                pageId,
                formId,
                formName,
                campaignId,
                campaignName,
                leadId,
                leadData,
                activityType,
                description,
                details,
                status,
                errorMessage,
                metadata: {
                    ...metadata,
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('User-Agent')
                }
            });

            const savedLog = await activityLog.save();

            res.status(201).json({
                success: true,
                log: savedLog
            });

        } catch (error) {
            console.error('Error creating activity log:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Update activity log status
     */
    async updateActivityStatus(req, res) {
        try {
            const { logId } = req.params;
            const { status, errorMessage } = req.body;

            const log = await FacebookActivityLog.findById(logId);
            if (!log) {
                return res.status(404).json({
                    success: false,
                    message: 'Activity log not found'
                });
            }

            log.updateStatus(status, errorMessage);
            await log.save();

            res.json({
                success: true,
                log
            });

        } catch (error) {
            console.error('Error updating activity status:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Delete activity logs (with optional filters)
     */
    async deleteActivityLogs(req, res) {
        try {
            const {
                organizationId = 'org-1',
                olderThan, // Delete logs older than X days
                activityType,
                status
            } = req.body;

            let query = { organizationId };

            if (olderThan) {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThan));
                query.createdAt = { $lt: cutoffDate };
            }

            if (activityType) query.activityType = activityType;
            if (status) query.status = status;

            const result = await FacebookActivityLog.deleteMany(query);

            res.json({
                success: true,
                message: `Deleted ${result.deletedCount} activity logs`
            });

        } catch (error) {
            console.error('Error deleting activity logs:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Get activity log statistics
     */
    async getActivityStats(req, res) {
        try {
            const { organizationId = 'org-1', startDate, endDate } = req.query;

            const summary = await FacebookActivityLog.getActivitySummary(organizationId, startDate, endDate);

            // Get additional stats
            const totalLogs = await FacebookActivityLog.countDocuments({ organizationId });
            const successRate = totalLogs > 0 ?
                await FacebookActivityLog.countDocuments({ organizationId, status: 'success' }) / totalLogs * 100 : 0;

            res.json({
                success: true,
                stats: {
                    summary,
                    totalLogs,
                    successRate: Math.round(successRate * 100) / 100
                }
            });

        } catch (error) {
            console.error('Error fetching activity stats:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

export default new FacebookActivityController();


