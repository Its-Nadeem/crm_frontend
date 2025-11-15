import Chatbot from '../models/Chatbot.js';

// Get chatbot settings for the organization
const getChatbotSettings = async (req, res) => {
    try {
        let chatbot = await Chatbot.findOne({ organizationId: req.user.organizationId });

        // If no chatbot settings exist, create default ones
        if (!chatbot) {
            chatbot = await Chatbot.create({
                organizationId: req.user.organizationId,
            });
        }

        res.json({ success: true, data: chatbot });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Create or update chatbot settings
const createOrUpdateChatbotSettings = async (req, res) => {
    try {
        const chatbotData = { ...req.body, organizationId: req.user.organizationId };

        const chatbot = await Chatbot.findOneAndUpdate(
            { organizationId: req.user.organizationId },
            chatbotData,
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({ success: true, data: chatbot });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Update specific chatbot settings
const updateChatbotSettings = async (req, res) => {
    try {
        const chatbot = await Chatbot.findOneAndUpdate(
            { organizationId: req.user.organizationId },
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!chatbot) {
            return res.status(404).json({ message: 'Chatbot settings not found' });
        }

        res.json({ success: true, data: chatbot });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Delete chatbot settings
const deleteChatbotSettings = async (req, res) => {
    try {
        const chatbot = await Chatbot.findOneAndDelete({ organizationId: req.user.organizationId });

        if (!chatbot) {
            return res.status(404).json({ message: 'Chatbot settings not found' });
        }

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Test chatbot configuration
const testChatbot = async (req, res) => {
    try {
        const chatbot = await Chatbot.findOne({ organizationId: req.user.organizationId });

        if (!chatbot) {
            return res.status(404).json({ message: 'Chatbot settings not found' });
        }

        // Here you would implement actual chatbot testing logic
        // For now, just return success with configuration summary
        res.json({
            success: true,
            message: 'Chatbot configuration is valid',
            data: {
                isEnabled: chatbot.isEnabled,
                hasWelcomeMessage: !!chatbot.welcomeMessage,
                hasIntegrations: chatbot.integrations?.whatsapp?.isEnabled || chatbot.integrations?.facebook?.isEnabled,
            }
        });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export {
    getChatbotSettings,
    createOrUpdateChatbotSettings,
    updateChatbotSettings,
    deleteChatbotSettings,
    testChatbot,
};


