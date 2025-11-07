import Call from '../models/Call.js';

// @desc    Create a new call log
// @route   POST /api/calls
// @access  Protected
const createCall = async (req, res) => {
    try {
        const { leadId, outcome, notes, duration, callType } = req.body;

        if (!leadId || !outcome) {
            return res.status(400).json({
                success: false,
                message: 'LeadId and outcome are required'
            });
        }

        const call = new Call({
            leadId,
            outcome,
            notes,
            duration,
            callType: callType || 'outbound',
            authorId: req.user.id,
            organizationId: req.user.organizationId
        });

        const savedCall = await call.save();

        res.status(201).json({
            success: true,
            data: savedCall
        });
    } catch (error) {
        console.error('Error creating call log:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get call logs for a lead
// @route   GET /api/calls/:leadId
// @access  Protected
const getCallsByLead = async (req, res) => {
    try {
        const { leadId } = req.params;

        const calls = await Call.find({
            leadId,
            organizationId: req.user.organizationId
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            data: calls
        });
    } catch (error) {
        console.error('Error fetching call logs:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Delete a call log
// @route   DELETE /api/calls/:id
// @access  Protected
const deleteCall = async (req, res) => {
    try {
        const call = await Call.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!call) {
            return res.status(404).json({
                success: false,
                message: 'Call log not found'
            });
        }

        await Call.deleteOne({ _id: req.params.id });

        res.json({
            success: true,
            message: 'Call log deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting call log:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

export { createCall, getCallsByLead, deleteCall };


