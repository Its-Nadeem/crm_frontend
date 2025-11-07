import Lead from '../models/Lead.js';
import User from '../models/User.js';
import Stage from '../models/Stage.js';
import { triggerLeadWebhooks } from '../controllers/webhookController.js';

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

       const updatedLead = await Lead.findOneAndUpdate({ _id: existingLead._id }, updatedLeadData, { new: true })
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
       const populatedLead = await Lead.findOne({ id: createdLead.id }).populate('assignedToId', 'name email');

       // Trigger webhooks for lead creation
       await triggerLeadWebhooks(req.user.organizationId, 'lead.created', {
           lead: {
               id: populatedLead.id,
               name: populatedLead.name,
               email: populatedLead.email,
               phone: populatedLead.phone,
               stage: populatedLead.stage,
               source: populatedLead.source,
               assignedTo: populatedLead.assignedToId ? {
                   id: populatedLead.assignedToId.id,
                   name: populatedLead.assignedToId.name,
                   email: populatedLead.assignedToId.email
               } : null,
               createdAt: populatedLead.createdAt,
               updatedAt: populatedLead.updatedAt
           }
       });

       res.status(201).json({ success: true, data: populatedLead });
     }
   } catch (error) {
     res.status(500).json({ success: false, message: 'Server Error' });
   }
};

// Helper function to get user name by ID
const getUserName = (userId, users) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : `User ${userId}`;
};

// Helper function to get stage name by ID
const getStageName = (stageId, stages) => {
    const stage = stages.find(s => s.id === stageId);
    return stage ? stage.name : `Stage ${stageId}`;
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

         // Try to find lead by string ID first, then by MongoDB ObjectId
         let lead = await Lead.findOne({ id: req.params.id });

         // If not found by string ID, try MongoDB ObjectId
         if (!lead) {
             // Check if the provided ID is a valid MongoDB ObjectId
             if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
                 lead = await Lead.findById(req.params.id);
             }
         }

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

         // Create activity records for field changes
         const fieldNames = {
             name: 'Name',
             email: 'Email',
             phone: 'Phone',
             alternatePhone: 'Alternate Phone',
             city: 'City',
             course: 'Course',
             company: 'Company',
             source: 'Source',
             stage: 'Stage',
             followUpStatus: 'Follow Up Status',
             score: 'Score',
             tags: 'Tags',
             assignedToId: 'Assigned To',
             dealValue: 'Deal Value',
             closeDate: 'Close Date',
             campaign: 'Campaign',
             facebookCampaign: 'Facebook Campaign',
             facebookAdset: 'Facebook Adset',
             facebookAd: 'Facebook Ad'
         };

         // System fields that should not create activities
         const systemFields = [
             'updatedAt', 'createdAt', '_id', '__v', 'id', 'organizationId',
             'activities', 'scheduledMessages'
         ];

         let newActivities = [];
         const updateData = { ...req.body };

         // Clean updateData to remove any MongoDB internal fields
         Object.keys(updateData).forEach(key => {
             if (key.startsWith('$__') || key.startsWith('_') ||
                 (typeof updateData[key] === 'string' && updateData[key].includes('new ObjectId'))) {
                 delete updateData[key];
             }
         });

         // Helper function to check if a field value is a MongoDB internal field
         const isInternalField = (key, value) => {
             return key.startsWith('$__') ||
                    key.startsWith('_') ||
                    (typeof value === 'string' && value.includes('new ObjectId'));
         };

         // Get users and stages for name lookups
         const users = await User.find({ organizationId: req.user.organizationId });
         const stages = await Stage.find({ organizationId: req.user.organizationId });

         // Helper function to format values for display
         const formatValue = (value) => {
             if (value === null || value === undefined) return 'empty';
             if (typeof value === 'string') {
                 const trimmed = value.trim();
                 // Handle date strings
                 if (trimmed.includes('T') && trimmed.includes('-')) {
                     try {
                         return new Date(trimmed).toLocaleDateString();
                     } catch {
                         return trimmed || 'empty';
                     }
                 }
                 return trimmed || 'empty';
             }
             if (typeof value === 'object') return JSON.stringify(value).slice(0, 50);
             return String(value);
         };

         // Check for field changes and create activities
         const fieldChanges = [];

         for (const field of Object.keys(fieldNames)) {
             if (updateData.hasOwnProperty(field)) {
                 const oldValue = lead[field];
                 const newValue = updateData[field];

                 // Skip if either value is an internal MongoDB field
                 if (isInternalField(field, oldValue) || isInternalField(field, newValue)) {
                     continue;
                 }

                 // Handle different data types for comparison
                 let oldVal = oldValue;
                 let newVal = newValue;

                 if (Array.isArray(oldValue) && Array.isArray(newValue)) {
                     // For arrays (like tags), check if they're different
                     oldVal = JSON.stringify(oldValue.sort());
                     newVal = JSON.stringify(newValue.sort());
                 } else {
                     // For other fields, convert to string for comparison
                     oldVal = String(oldValue || '');
                     newVal = String(newValue || '');

                     // Special handling for date fields
                     if ((oldVal.includes('T') && oldVal.includes('-')) || (newVal.includes('T') && newVal.includes('-'))) {
                         try {
                             const oldDate = oldVal.includes('T') ? new Date(oldVal).toISOString() : oldVal;
                             const newDate = newVal.includes('T') ? new Date(newVal).toISOString() : newVal;
                             oldVal = oldDate;
                             newVal = newDate;
                         } catch {
                             // Keep original values if date parsing fails
                         }
                     }

                 // Only create activity if value actually changed and both values are meaningful
                 if (oldVal !== newVal && oldValue !== newValue && !(oldValue === null && newValue === null) && !(oldValue === undefined && newValue === undefined) && !(oldValue === '' && newValue === '')) {
                     let displayOldValue = oldValue;
                     let displayNewValue = newValue;

                     // Get human-readable names for specific fields
                     if (field === 'assignedToId' && (oldValue || newValue)) {
                         if (oldValue) {
                             displayOldValue = getUserName(oldValue, users);
                         }
                         if (newValue) {
                             displayNewValue = getUserName(newValue, users);
                         }
                     } else if (field === 'stage' && (oldValue || newValue)) {
                         if (oldValue) {
                             displayOldValue = getStageName(oldValue, stages);
                         }
                         if (newValue) {
                             displayNewValue = getStageName(newValue, stages);
                         }
                     }

                     fieldChanges.push({
                         field: fieldNames[field],
                         oldValue: displayOldValue,
                         newValue: displayNewValue,
                         rawOldValue: oldValue,
                         rawNewValue: newValue
                     });
                 }
             }

         // Create a single activity for all field changes (only if there are actual changes)
         if (fieldChanges.length > 0) {
             const changesText = fieldChanges
                 .map(change => {
                     const oldVal = formatValue(change.oldValue);
                     const newVal = formatValue(change.newValue);
                     return `${change.field}: "${oldVal}" → "${newVal}"`;
                 })
                 .join(', ');

             // Use the lead's current owner for activity attribution, not the person making the request
             const leadOwner = users.find(u => u.id === lead.assignedToId);
             const leadOwnerName = leadOwner ? leadOwner.name : 'Unassigned';

             const newActivityContent = `${leadOwnerName} updated - ${changesText}`;

             // Check for recent duplicate activities (within last minute)
             const isRecentDuplicate = (lead.activities || []).some(existing =>
                 existing.content === newActivityContent &&
                 existing.authorId === req.user.id &&
                 Math.abs(new Date(existing.timestamp).getTime() - new Date().getTime()) < 60000 // 1 minute
             );

             if (!isRecentDuplicate) {
                 newActivities.push({
                     type: 'FIELD_UPDATE',
                     content: newActivityContent,
                     timestamp: new Date(),
                     authorId: req.user.id // Use the actual user who made the request
                 });
             }
         }
         }
         }

         // Filter out existing problematic activities and add new ones
         let filteredActivities = (lead.activities || []).filter(activity => {
             // Remove activities that contain MongoDB internal fields or are too verbose
             return !activity.content.includes('$__') &&
                    !activity.content.includes('new ObjectId') &&
                    !activity.content.includes('[object Object]') &&
                    !activity.content.includes('[object Map]') &&
                    !activity.content.includes('ObjectId(') &&
                    !activity.content.includes('_id: new ObjectId') &&
                    !activity.content.includes('update close date form') && // Remove malformed activities
                    activity.content.length < 300 && // Increased limit for better formatted content
                    activity.content.trim().length > 0; // Remove empty activities
         });

         // Remove duplicate activities (same content and timestamp within 1 minute)
         const uniqueActivities = [];
         for (const activity of filteredActivities) {
             const isDuplicate = uniqueActivities.some(existing =>
                 existing.content === activity.content &&
                 Math.abs(new Date(existing.timestamp).getTime() - new Date(activity.timestamp).getTime()) < 60000 // 1 minute
             );
             if (!isDuplicate) {
                 uniqueActivities.push(activity);
             }
         }

         // Add new activities to the update data
         if (newActivities.length > 0) {
             updateData.activities = [
                 ...newActivities,
                 ...uniqueActivities
             ];
         } else {
             updateData.activities = uniqueActivities;
         }

         // Use findOneAndUpdate with the same logic as findOne above
         let query;
         if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
             // If it's a valid MongoDB ObjectId, try both _id and id fields
             query = {
                 $or: [
                     { _id: req.params.id },
                     { id: req.params.id }
                 ]
             };
         } else {
             // Otherwise, just use the string id field
             query = { id: req.params.id };
         }

         const updatedLead = await Lead.findOneAndUpdate(
             query,
             updateData,
             {
                 new: true,
                 runValidators: true
             }
         ).populate('assignedToId', 'name email');

         if (!updatedLead) {
             console.log('Failed to update lead - no document returned');
             return res.status(404).json({ success: false, message: 'Lead not found or update failed' });
         }

         console.log('Lead updated successfully:', updatedLead.id || updatedLead._id);
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
         const lead = await Lead.findOne({ id: req.params.id });

         if (lead && lead.organizationId === req.user.organizationId) {
             await Lead.deleteOne({ id: req.params.id });
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
            id: { $in: leadIds },
            organizationId: req.user.organizationId
        });

        if (leads.length !== leadIds.length) {
            return res.status(404).json({ success: false, message: 'Some leads not found or not authorized' });
        }

        // Update all leads with the provided updates
        const updatedLeads = await Lead.updateMany(
            { id: { $in: leadIds }, organizationId: req.user.organizationId },
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
            id: { $in: leadIds },
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

// @desc    Clean problematic activities from all leads
// @route   POST /api/leads/clean-activities
// @access  Protected
const cleanAllProblematicActivities = async (req, res) => {
    try {
        const leads = await Lead.find({ organizationId: req.user.organizationId });
        let totalCleaned = 0;

        for (const lead of leads) {
            if (lead.activities && lead.activities.length > 0) {
                const originalCount = lead.activities.length;

                // Filter out problematic activities
                lead.activities = lead.activities.filter(activity => {
                    return !activity.content.includes('$__') &&
                           !activity.content.includes('new ObjectId') &&
                           !activity.content.includes('[object Object]') &&
                           !activity.content.includes('[object Map]') &&
                           !activity.content.includes('ObjectId(') &&
                           !activity.content.includes('_id: new ObjectId') &&
                           activity.content.length < 200;
                });

                const removedCount = originalCount - lead.activities.length;
                if (removedCount > 0) {
                    await lead.save();
                    totalCleaned += removedCount;
                }
            }
        }

        res.json({
            success: true,
            message: `Successfully cleaned ${totalCleaned} problematic activities from ${leads.length} leads`
        });
    } catch (error) {
        console.error('Error cleaning activities:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export { getLeads, createLead, updateLead, deleteLead, bulkUpdateLeads, bulkDeleteLeads, cleanAllProblematicActivities };



