import AutomationRule from '../models/AutomationRule.js';

const createOrUpdateRule = async (req, res) => {
    try {
        const { id } = req.params;
        const data = { ...req.body, organizationId: req.user.organizationId };
        
        const rule = id
            ? await AutomationRule.findOneAndUpdate({ _id: id, organizationId: req.user.organizationId }, data, { new: true })
            : await AutomationRule.create(data);

        if (!rule) return res.status(404).json({ message: 'Rule not found' });
        res.status(id ? 200 : 201).json(rule);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

const deleteRule = async (req, res) => {
    try {
        const { id } = req.params;
        const rule = await AutomationRule.findOne({ _id: id, organizationId: req.user.organizationId });
        if (!rule) return res.status(404).json({ message: 'Rule not found' });
        await rule.deleteOne();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export { createOrUpdateRule, deleteRule };



