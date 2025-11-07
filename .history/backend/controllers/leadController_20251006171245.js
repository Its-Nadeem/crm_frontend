import Lead from '../models/Lead.js';

// @desc    Get all leads for the logged-in user's organization
// @route   GET /api/leads
// @access  Protected
const getLeads = async (req, res) => {
  try {
    const leads = await Lead.find({ organizationId: req.user.organizationId }).sort({ createdAt: -1 });
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
    const lead = new Lead({
        ...leadData,
        organizationId: req.user.organizationId // Ensure lead is tied to the user's org
    });
    const createdLead = await lead.save();
    res.status(201).json({ success: true, data: createdLead });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update a lead
// @route   PUT /api/leads/:id
// @access  Protected
const updateLead = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);

        if (lead && lead.organizationId === req.user.organizationId) {
            const updatedLead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json({ success: true, data: updatedLead });
        } else {
            res.status(404).json({ success: false, message: 'Lead not found or not authorized' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
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


export { getLeads, createLead, updateLead, deleteLead };



