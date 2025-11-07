import Lead from '../models/Lead.js';

// @desc    Get all leads for the logged-in user's organization
 // @route   GET /api/leads
 // @access  Protected
 const getLeads = async (req, res) => {
   try {
     const leads = await Lead.find({ organizationId: req.user.organizationId })
       .populate('assignedToId', 'name email')
       .sort({ updatedAt: -1, createdAt: -1 });
     res.json({ success: true, data: leads });
   } catch (error) {
     res.status(500).json({ success: false, message: 'Server Error' });
   }
 };

// @desc    Create a new lead
// @route   POST /api/leads
// @access  Protected
const createLead = async (req, res) => {
   try {
     const leadData = req.body;

     // Check for duplicate leads based on email or phone
     const existingLead = await Lead.findOne({
       organizationId: req.user.organizationId,
       $or: [
         { email: leadData.email },
         { phone: leadData.phone }
       ]
     });

     if (existingLead) {
       // Update existing lead with new information
       const updatedLeadData = {
         ...existingLead.toObject(),
         ...leadData,
         // Preserve existing activities and add new activity for duplicate
         activities: [
           {
             type: 'LEAD_CREATED',
             content: `Lead received again with updated information`,
             timestamp: new Date(),
             authorId: req.user.id
           },
           ...(existingLead.activities || [])
         ]
       };

       const updatedLead = await Lead.findByIdAndUpdate(existingLead._id, updatedLeadData, { new: true })
         .populate('assignedToId', 'name email');

       res.status(200).json({
         success: true,
         data: updatedLead,
         message: 'Existing lead updated with new information'
       });
     } else {
       // Create new lead
       const lead = new Lead({
         ...leadData,
         organizationId: req.user.organizationId,
         activities: [{
           type: 'LEAD_CREATED',
           content: 'Lead created',
           timestamp: new Date(),
           authorId: req.user.id
         }]
       });
       const createdLead = await lead.save();
       const populatedLead = await Lead.findById(createdLead._id).populate('assignedToId', 'name email');
       res.status(201).json({ success: true, data: populatedLead });
     }
   } catch (error) {
     res.status(500).json({ success: false, message: 'Server Error' });
   }
};

// @desc    Update a lead
// @route   PUT /api/leads/:id
// @access  Protected
const updateLead = async (req, res) => {
    try {
        console.log('Update lead request:', {
            leadId: req.params.id,
            userId: req.user?.id,
            userOrg: req.user?.organizationId,
            requestBody: req.body
        });

        // Use findOne with string ID instead of findById
        const lead = await Lead.findOne({ id: req.params.id });

        if (!lead) {
            console.log('Lead not found:', req.params.id);
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        console.log('Found lead:', {
            leadId: lead.id,
            leadMongoId: lead._id,
            leadOrg: lead.organizationId,
            userOrg: req.user.organizationId
        });

        if (lead.organizationId.toString() !== req.user.organizationId.toString()) {
            console.log('Organization mismatch');
            return res.status(404).json({ success: false, message: 'Lead not found or not authorized' });
        }

        // Use findOneAndUpdate with string ID
        const updatedLead = await Lead.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate('assignedToId', 'name email');

        console.log('Lead updated successfully:', updatedLead.id);
        res.json({ success: true, data: updatedLead });
    } catch (error) {
        console.error('Error updating lead:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Delete a lead
// @route   DELETE /api/leads/:id
// @access  Protected
const deleteLead = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);

        if (lead && lead.organizationId === req.user.organizationId) {
            await lead.deleteOne();
            res.json({ success: true, message: 'Lead removed' });
        } else {
            res.status(404).json({ success: false, message: 'Lead not found or not authorized' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


// @desc    Bulk update leads
// @route   PUT /api/leads/bulk
// @access  Protected
const bulkUpdateLeads = async (req, res) => {
    try {
        const { leadIds, updates } = req.body;

        if (!Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Lead IDs array is required' });
        }

        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'Updates object is required' });
        }

        // Verify all leads belong to the user's organization
        const leads = await Lead.find({
            _id: { $in: leadIds },
            organizationId: req.user.organizationId
        });

        if (leads.length !== leadIds.length) {
            return res.status(404).json({ success: false, message: 'Some leads not found or not authorized' });
        }

        // Update all leads with the provided updates
        const updatedLeads = await Lead.updateMany(
            { _id: { $in: leadIds }, organizationId: req.user.organizationId },
            { $set: updates },
            { new: true }
        );

        res.json({
            success: true,
            message: `Successfully updated ${updatedLeads.modifiedCount} leads`,
            data: updatedLeads
        });
    } catch (error) {
        console.error('Bulk update error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Bulk delete leads
// @route   DELETE /api/leads/bulk
// @access  Protected
const bulkDeleteLeads = async (req, res) => {
    try {
        const { leadIds } = req.body;

        if (!Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Lead IDs array is required' });
        }

        // Verify all leads belong to the user's organization
        const leads = await Lead.find({
            _id: { $in: leadIds },
            organizationId: req.user.organizationId
        });

        if (leads.length !== leadIds.length) {
            return res.status(404).json({ success: false, message: 'Some leads not found or not authorized' });
        }

        // Delete all leads
        const deletedLeads = await Lead.deleteMany({
            _id: { $in: leadIds },
            organizationId: req.user.organizationId
        });

        res.json({
            success: true,
            message: `Successfully deleted ${deletedLeads.deletedCount} leads`,
            data: deletedLeads
        });
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export { getLeads, createLead, updateLead, deleteLead, bulkUpdateLeads, bulkDeleteLeads };



