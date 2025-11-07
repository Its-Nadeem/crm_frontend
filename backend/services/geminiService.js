import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI (for future use)
let genAI = null;
let model = null;

export const initializeGemini = (apiKey) => {
  try {
    if (!apiKey || apiKey === 'placeholder-for-future-use') {
      console.log('🤖 Gemini API key not provided, service disabled');
      return false;
    }

    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    console.log('✅ Gemini AI service initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Gemini AI:', error.message);
    return false;
  }
};

// Generate lead summary (for future use)
export const generateLeadSummary = async (leadData) => {
  try {
    if (!model) {
      return {
        success: false,
        message: 'Gemini AI service not initialized'
      };
    }

    const prompt = `
      Analyze this lead data and provide a concise summary with next best action:

      Lead Information:
      - Name: ${leadData.name}
      - Email: ${leadData.email}
      - Company: ${leadData.company}
      - Source: ${leadData.source}
      - Current Stage: ${leadData.stage}
      - Deal Value: ${leadData.dealValue}
      - Activities: ${leadData.activities?.length || 0} interactions

      Please provide:
      1. A brief summary of the lead's journey
      2. Recommended next action
      3. Priority level (High/Medium/Low)
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      summary: text,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Gemini API error:', error.message);
    return {
      success: false,
      message: 'Failed to generate summary',
      error: error.message
    };
  }
};

// Generate AI-powered insights (for future use)
export const generateInsights = async (leadsData) => {
  try {
    if (!model) {
      return {
        success: false,
        message: 'Gemini AI service not initialized'
      };
    }

    const prompt = `
      Analyze these ${leadsData.length} leads and provide business insights:

      Lead Statistics:
      - Total leads: ${leadsData.length}
      - Average deal value: ${leadsData.reduce((sum, lead) => sum + (lead.dealValue || 0), 0) / leadsData.length}
      - Top sources: ${leadsData.reduce((acc, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1;
        return acc;
      }, {})}

      Please provide:
      1. Key trends and patterns
      2. Recommendations for improvement
      3. Predicted conversion opportunities
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      insights: text,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Gemini insights error:', error.message);
    return {
      success: false,
      message: 'Failed to generate insights',
      error: error.message
    };
  }
};

export default {
  initializeGemini,
  generateLeadSummary,
  generateInsights
};


