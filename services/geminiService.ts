

import { Lead, Task, Stage, HomepageContent, BlogPost } from '../types';

export const generateLeadSummary = async (lead: Lead, tasks: Task[], pipelineStages: Stage[]): Promise<string> => {
  // Simulate API call
  return new Promise(resolve => setTimeout(() => resolve(`This is a simulated AI summary for ${lead.name}. They seem interested in our products and were last contacted recently. Suggested next step: Schedule a demo call.`), 1500));
};

export interface SeoAnalysisCheck {
    category: 'Basic SEO' | 'Title Readability' | 'Content Readability' | 'Advanced SEO';
    checkName: string;
    status: 'pass' | 'fail' | 'warn';
    recommendation: string;
}
export interface SeoAnalysisResult {
    seoScore: number;
    readabilityScore: number;
    analysis: SeoAnalysisCheck[];
    generatedSchema: {
        type: string;
        jsonLd: string;
    }
}


export const analyzeBlogPostSEO = async (
    post: Partial<BlogPost>
): Promise<SeoAnalysisResult | null> => {
    // Simulate for environments without a key
    return new Promise(resolve => setTimeout(() => resolve({
        seoScore: 78,
        readabilityScore: 65,
        analysis: [
            { category: 'Basic SEO', checkName: 'Focus Keyword in SEO Title', status: 'pass', recommendation: 'Great! The focus keyword is in the SEO title.' },
            { category: 'Basic SEO', checkName: 'Focus Keyword Density', status: 'fail', recommendation: 'The keyword density is a bit low. Try to use the keyword a few more times naturally in your content.' },
            { category: 'Content Readability', checkName: 'Content-Length', status: 'pass', recommendation: 'The content length is good. Well done!' },
            { category: 'Advanced SEO', checkName: 'Internal Links', status: 'fail', recommendation: 'You are not using any internal links. Add some!' },
        ],
        generatedSchema: {
            type: 'Article',
            jsonLd: `{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "headline": "${post.title}",\n  "description": "${post.seo?.description}"\n}`
        }
    }), 1500));
};


export const generateBlogPostTitle = async (content: string): Promise<string[] | null> => {
    return new Promise(resolve => setTimeout(() => resolve(["Simulated AI Title 1", "Simulated AI Title 2", "Simulated AI Title 3"]), 1000));
}

export const generateBlogPostExcerpt = async (content: string): Promise<string | null> => {
    return new Promise(resolve => setTimeout(() => resolve("This is a simulated AI-generated excerpt based on the provided content, designed to be concise and engaging."), 1000));
}

export const generateBlogPostTags = async (content: string): Promise<string[] | null> => {
    return new Promise(resolve => setTimeout(() => resolve(["simulated", "ai", "tags"]), 1000));
}


export const answerChatbotQuery = async (
    query: string, 
    features: HomepageContent['features'], 
    pricing: HomepageContent['pricing']
): Promise<string> => {
    // Simulate API call
    return new Promise(resolve => setTimeout(() => {
        if (query.toLowerCase().includes('price') || query.toLowerCase().includes('pricing')) {
            resolve("We have flexible pricing plans! The Basic plan is $49/month, and the Pro plan is $99/month. We also have a Free and an Enterprise plan. You can find more details on our pricing section.");
        } else if (query.toLowerCase().includes('feature')) {
             resolve("Our CRM has many great features, including a Unified Leads Dashboard, AI-Powered Lead Summaries, and Effortless Sales Automation. What feature are you most interested in?");
        } else if (['thanks', 'bye', 'ok', 'that\'s all'].some(term => query.toLowerCase().includes(term))) {
            resolve("Great! Have a wonderful day.");
        }
        else {
            resolve("That's a great question. A member of our team will get back to you with an answer shortly.");
        }
    }, 1500));
};



