import Organization from '../models/Organization.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Addon from '../models/Addon.js';
import Coupon from '../models/Coupon.js';
import BlogPost from '../models/BlogPost.js';
import SupportTicket from '../models/SupportTicket.js';

// Generic handler factory
const createOrUpdateHandler = (Model) => async (req, res) => {
    try {
        const { id } = req.params;
        const item = id
            ? await Model.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
            : await Model.create(req.body);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.status(id ? 200 : 201).json(item);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

const deleteHandler = (Model) => async (req, res) => {
    try {
        const item = await Model.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Organizations
export const createOrUpdateOrganization = createOrUpdateHandler(Organization);
export const deleteOrganization = deleteHandler(Organization);

// Plans
export const createOrUpdatePlan = createOrUpdateHandler(SubscriptionPlan);
export const deletePlan = deleteHandler(SubscriptionPlan);

// Addons
export const createOrUpdateAddon = createOrUpdateHandler(Addon);
export const deleteAddon = deleteHandler(Addon);

// Coupons
export const createOrUpdateCoupon = createOrUpdateHandler(Coupon);
export const deleteCoupon = deleteHandler(Coupon);

// Blog Posts
export const createOrUpdateBlogPost = createOrUpdateHandler(BlogPost);
export const deleteBlogPost = deleteHandler(BlogPost);

// Specific handler for ticket status
export const updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const ticket = await SupportTicket.findByIdAndUpdate(
            req.params.id, 
            { status, lastReplyAt: new Date() },
            { new: true }
        );
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};



