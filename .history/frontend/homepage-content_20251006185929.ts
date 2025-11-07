import { HomepageContent, PricingCategory, OfferStrip } from './types';

import { BlogPost } from './types';

export const HOMEPAGE_BLOG_POSTS: BlogPost[] = Array.from({ length: 5 }, (_, i) => {
    const titles = [
        "10 Proven Strategies to Boost Your Sales Conversion Rate",
        "How AI is Revolutionizing Lead Management in 2024",
        "The Ultimate Guide to Sales Automation for Growing Teams",
        "Building High-Performing Sales Teams: Best Practices",
        "CRM Integration: Connecting Your Favorite Tools Seamlessly"
    ];
    const title = titles[i] || `Blog Post ${i + 1}`;
    const focusKeyword = title.split(' ').slice(0, 2).join(' ').toLowerCase();

    return {
        _id: `blog-${i + 1}`,
        id: `blog-${i + 1}`,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        title: title,
        excerpt: "Discover actionable insights and proven strategies to supercharge your sales performance and grow your business with Clienn CRM's comprehensive platform.",
        content: `Detailed content for ${title} covering industry best practices, actionable tips, and real-world examples to help you optimize your sales process and achieve better results.`,
        authorId: 2,
        publishedAt: new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000)).toISOString(),
        tags: ['Sales', 'Marketing', 'CRM', 'Growth Hacking', 'AI'].slice(0, 3),
        featuredImage: {
            src: `https://picsum.photos/seed/${i + 1}/800/400`,
            alt: `Blog post image for ${title}`,
        },
        seo: {
            title: `${title} | Clienn CRM Blog`,
            description: `Learn ${title.toLowerCase()} with expert insights and practical tips.`,
        },
        focusKeyword,
        views: Math.floor(Math.random() * 10000) + 150,
        comments: Math.floor(Math.random() * 50),
    };
});

export const HOMEPAGE_PRICING_DATA: PricingCategory[] = [
  {
    id: 'core-crm',
    category: 'Core CRM',
    features: [
      { id: 'users', name: 'Users Included', description: 'Number of users that can access the CRM.', values: { free: '1', basic: '5', pro: '20', enterprise: 'Custom' } },
      { id: 'leads', name: 'Lead Capacity', description: 'Total number of leads you can store.', values: { free: '500', basic: '5,000', pro: 'Unlimited', enterprise: 'Unlimited' } },
      { id: 'contacts', name: 'Contact Management', description: 'Store and manage all your customer and lead information.', values: { free: true, basic: true, pro: true, enterprise: true } },
      { id: 'pipelines', name: 'Deal Pipelines', description: 'Visual sales pipelines to track deals.', values: { free: '1', basic: '2', pro: 'Unlimited', enterprise: 'Unlimited' } },
      { id: 'tasks', name: 'Task Management', description: 'Create and assign tasks to yourself or team members.', values: { free: true, basic: true, pro: true, enterprise: true } },
      { id: 'custom-fields', name: 'Custom Fields', description: 'Create custom data fields to store specific information on your leads.', values: { free: '5 Fields', basic: '25 Fields', pro: '100 Fields', enterprise: 'Unlimited' } },
      { id: 'tagging', name: 'Lead Tagging', description: 'Organize your leads with custom tags.', values: { free: true, basic: true, pro: true, enterprise: true } },
      { id: 'storage', name: 'File Storage', description: 'Storage space for attachments and files.', values: { free: '100 MB', basic: '5 GB', pro: '50 GB', enterprise: 'Custom' } },
    ]
  },
  {
    id: 'communication',
    category: 'Communication',
    features: [
      { id: 'email-sync', name: 'Email Integration (Gmail/Outlook)', description: 'Sync your email conversations with leads.', values: { free: false, basic: true, pro: true, enterprise: true } },
      { id: 'email-campaigns', name: 'Email Campaigns', description: 'Send bulk email campaigns to your leads.', values: { free: false, basic: '500 sends/mo', pro: '10,000 sends/mo', enterprise: 'Custom' } },
      { id: 'sms-campaigns', name: 'SMS Campaigns', description: 'Send bulk SMS campaigns. Credits sold separately.', values: { free: false, basic: false, pro: true, enterprise: true } },
      { id: 'whatsapp', name: 'WhatsApp Integration', description: 'Communicate with leads directly via WhatsApp.', values: { free: false, basic: true, pro: true, enterprise: true } },
      { id: 'call-campaigns', name: 'Call Campaigns & Logging', description: 'Run call campaigns and automatically log call activities.', values: { free: false, basic: false, pro: true, enterprise: true } },
      { id: 'email-templates', name: 'Email Templates', description: 'Create and reuse email templates for quick communication.', values: { free: '3 Templates', basic: '10 Templates', pro: 'Unlimited', enterprise: 'Unlimited' } },
      { id: 'whatsapp-templates', name: 'WhatsApp Templates', description: 'Create and use approved WhatsApp message templates.', values: { free: false, basic: '5 Templates', pro: 'Unlimited', enterprise: 'Unlimited' } },
    ]
  },
  {
    id: 'automation-ai',
    category: 'Automation & AI',
    features: [
      { id: 'automation-rules', name: 'Automation Rules', description: 'Build "if-this-then-that" rules to automate your workflows.', values: { free: '3 Rules', basic: '10 Rules', pro: 'Unlimited', enterprise: 'Unlimited' } },
      { id: 'lead-assignment', name: 'Lead Assignment Rules', description: 'Automatically assign new leads to users or teams.', values: { free: false, basic: true, pro: true, enterprise: true } },
      { id: 'ai-summaries', name: 'AI-Powered Lead Summaries', description: 'Get instant summaries of lead activities and history with one click.', values: { free: '10/mo', basic: '50/mo', pro: '500/mo', enterprise: 'Unlimited' } },
      { id: 'lead-scoring', name: 'Lead Scoring', description: 'Automatically score leads based on their properties and actions.', values: { free: false, basic: false, pro: true, enterprise: true } },
      { id: 'chatbot', name: 'Website Chatbot', description: 'Capture leads from your website with an automated chatbot.', values: { free: false, basic: true, pro: true, enterprise: true } },
    ]
  },
  {
    id: 'integrations',
    category: 'Integrations',
    features: [
      { id: 'facebook', name: 'Facebook Lead Ads', description: 'Sync leads directly from your Facebook campaigns.', values: { free: false, basic: true, pro: true, enterprise: true } },
      { id: 'google-ads', name: 'Google Ads', description: 'Track leads from your Google Ads campaigns.', values: { free: false, basic: true, pro: true, enterprise: true } },
      { id: 'website-forms', name: 'Website Forms', description: 'Capture leads from any form on your website.', values: { free: false, basic: true, pro: true, enterprise: true } },
      { id: 'api-access', name: 'API Access', description: 'Build custom integrations with our REST API.', values: { free: false, basic: false, pro: false, enterprise: true } },
      { id: 'webhooks', name: 'Webhook Triggers', description: 'Send data to other applications when events happen in the CRM.', values: { free: false, basic: '1 Webhook', pro: '10 Webhooks', enterprise: 'Unlimited' } },
    ]
  },
  {
    id: 'reporting',
    category: 'Reporting & Analytics',
    features: [
      { id: 'standard-dashboards', name: 'Standard Dashboards', description: 'Get an overview of your sales performance.', values: { free: true, basic: true, pro: true, enterprise: true } },
      { id: 'custom-reports', name: 'Custom Reports', description: 'Build reports tailored to your business needs.', values: { free: false, basic: '5 Reports', pro: '25 Reports', enterprise: 'Unlimited' } },
      { id: 'sales-forecasting', name: 'Sales Forecasting', description: 'Forecast future sales based on your pipeline data.', values: { free: false, basic: false, pro: true, enterprise: true } },
      { id: 'activity-tracking', name: 'Employee Tracking', description: 'Monitor user activity and session logs.', values: { free: false, basic: false, pro: true, enterprise: true } },
      { id: 'goal-setting', name: 'Goal Setting', description: 'Set and track sales goals for your team and individual reps.', values: { free: false, basic: true, pro: true, enterprise: true } },
    ]
  },
  {
    id: 'support',
    category: 'Support & Security',
    features: [
      { id: 'email-support', name: 'Email Support', description: 'Get help from our support team via email.', values: { free: false, basic: true, pro: true, enterprise: true } },
      { id: 'priority-support', name: 'Priority Phone & Chat Support', description: 'Get faster support via phone and live chat.', values: { free: false, basic: false, pro: true, enterprise: true } },
      { id: 'dedicated-manager', name: 'Dedicated Support Manager', description: 'A dedicated manager to help you succeed.', values: { free: false, basic: false, pro: false, enterprise: true } },
      { id: 'mfa', name: 'Two-Factor Authentication (2FA)', description: 'Secure your account with two-factor authentication.', values: { free: true, basic: true, pro: true, enterprise: true } },
      { id: 'permissions', name: 'User Roles & Permissions', description: 'Control what your users can see and do.', values: { free: false, basic: true, pro: true, enterprise: true } },
      { id: 'sso', name: 'SSO & White-Labeling', description: 'Use your own branding and single sign-on.', values: { free: false, basic: false, pro: false, enterprise: true } },
      { id: 'sla', name: 'Uptime SLA', description: 'Service Level Agreement for platform uptime.', values: { free: false, basic: false, pro: '99.9%', enterprise: '99.99%' } },
    ]
  }
];

export const DEFAULT_OFFER_STRIP: OfferStrip = {
    isEnabled: false,
    text: '',
    ctaText: '',
    ctaLink: '',
    autoDisableAt: ''
};

export const HOMEPAGE_CONTENT: HomepageContent = {
  hero: {
    title: "The Smarter Way to Manage",
    gradientTitle: "Leads, Sales & Growth",
    subtitle: "Boost sales, automate workflows, and manage your entire business from one powerful CRM platform. Designed for growing teams, trusted by businesses everywhere.",
    cta1: "Start 14-Day Free Trial",
    cta2: "Book a Demo"
  },
  loginPage: {
    title: "Make conversations that convert students",
    subtitle: "Know how Echo, a WhatsApp live chat platform, can streamline communication and make engagement personal, immediate, and more effective.",
    cta: "Schedule a Demo",
    image: {
      src: "https://uploads-ssl.webflow.com/62a86551224472314601183b/6475d19a4e062227289f8263_Group%2018260.webp",
      alt: "Screenshot of the Echo WhatsApp live chat platform dashboard."
    }
  },
  trustedBy: {
    title: "TRUSTED BY HIGH-PERFORMING TEAMS WORLDWIDE",
    logos: [
        { name: "Google", src: "https://logo.clearbit.com/google.com", alt: "Google Logo" },
        { name: "Microsoft", src: "https://logo.clearbit.com/microsoft.com", alt: "Microsoft Logo" },
        { name: "Slack", src: "https://logo.clearbit.com/slack.com", alt: "Slack Logo" },
        { name: "Salesforce", src: "https://logo.clearbit.com/salesforce.com", alt: "Salesforce Logo" },
        { name: "Hubspot", src: "https://logo.clearbit.com/hubspot.com", alt: "Hubspot Logo" },
        { name: "Stripe", src: "https://logo.clearbit.com/stripe.com", alt: "Stripe Logo" },
        { name: "Notion", src: "https://logo.clearbit.com/notion.so", alt: "Notion Logo" },
        { name: "Figma", src: "https://logo.clearbit.com/figma.com", alt: "Figma Logo" },
    ]
  },
  howItWorks: {
    title: "Get Started in 3 Simple Steps",
    subtitle: "Clienn CRM is designed to be powerful yet easy to use.",
    steps: [
      { id: 'hw1', icon: 'Connect', title: "Connect Your Sources", description: "Integrate your website forms, social media ads, and other lead sources in minutes with our one-click integrations." },
      { id: 'hw2', icon: 'AutomateSteps', title: "Automate Your Workflow", description: "Set up powerful rules to automatically assign leads, send follow-ups, and update stages so you can focus on selling." },
      { id: 'hw3', icon: 'Grow', title: "Grow Your Business", description: "Use our analytics and AI-powered insights to understand your pipeline, improve conversion rates, and close more deals." },
    ]
  },
  integrations: {
    title: "Connect to the Tools You Already Use",
    subtitle: "Clienn CRM plays well with others. Integrate seamlessly with your favorite apps.",
    logos: [
        { name: "Facebook", src: "https://logo.clearbit.com/facebook.com", alt: "Facebook Logo" },
        { name: "Google", src: "https://logo.clearbit.com/google.com", alt: "Google Logo" },
        { name: "Zapier", src: "https://logo.clearbit.com/zapier.com", alt: "Zapier Logo" },
        { name: "Twilio", src: "https://logo.clearbit.com/twilio.com", alt: "Twilio Logo" },
        { name: "Mailchimp", src: "https://logo.clearbit.com/mailchimp.com", alt: "Mailchimp Logo" },
        { name: "WordPress", src: "https://logo.clearbit.com/wordpress.com", alt: "WordPress Logo" },
    ]
  },
  features: {
    title: "Everything You Need, All in One Place",
    subtitle: "Powerful features to supercharge your sales team.",
    items: [
      {
        id: 'dashboard',
        title: 'Unified Leads Dashboard',
        description: 'Get a bird\'s-eye view of your entire sales pipeline. Track leads through every stage, monitor team performance, and visualize your sales data with beautiful, easy-to-understand charts.',
        image: {
          src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
          alt: 'A modern analytics dashboard with various charts and graphs on a dark background.'
        }
      },
      {
        id: 'summary',
        title: 'AI-Powered Lead Summaries',
        description: 'Stop wasting time digging through activity logs. With a single click, our Gemini-powered AI analyzes all communication, notes, and lead data to give you a concise summary and suggest the next best action.',
        image: {
          src: 'https://images.unsplash.com/photo-1674027444485-cec3da58eef4?q=80&w=1932&auto=format&fit=crop',
          alt: 'Abstract image representing artificial intelligence with glowing neural network connections.'
        }
      },
      {
        id: 'automation',
        title: 'Effortless Sales Automation',
        description: 'Build powerful "if-this-then-that" automation rules with a simple visual editor. Assign new leads, send follow-up emails, add tags, and more—all on autopilot, so you can focus on selling.',
        image: {
          src: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2070&auto=format&fit=crop',
          alt: 'A team collaborating on a glass wall with sticky notes, representing workflow automation.'
        }
      },
      {
        id: 'reporting',
        title: 'Comprehensive Reporting',
        description: 'Gain deep insights into your sales performance with customizable reports. Track key metrics, identify trends, and make data-driven decisions to optimize your sales process.',
        image: {
          src: 'https://images.unsplash.com/photo-1608421448635-c21406691c25?q=80&w=2070&auto=format&fit=crop',
          alt: 'A detailed financial report with colorful charts and graphs laid out on a table.'
        }
      },
    ]
  },
  growthChart: {
    title: "Watch Your Conversion Rate Soar",
    subtitle: "Our customers see a significant increase in their lead-to-conversion rate within the first three months of using Clienn CRM. The chart below represents a typical growth trajectory.",
    chartData: [
      { month: 'Jan', value: 8 }, { month: 'Feb', value: 9 }, { month: 'Mar', value: 12 },
      { month: 'Apr', value: 15 }, { month: 'May', value: 22 }, { month: 'Jun', value: 32 }
    ],
    stat: {
        value: 32,
        label: "Average Conversion Rate Increase"
    }
  },
  funnel: {
    title: "Visualize Your Sales Pipeline",
    subtitle: "Track leads as they move from initial contact to a closed deal. Our visual funnel helps you identify bottlenecks and optimize your sales process for higher conversion rates.",
    stages: [
      { name: 'Leads', value: 1000 },
      { name: 'Contacted', value: 800 },
      { name: 'Demo Scheduled', value: 500 },
      { name: 'Proposal Sent', value: 300 },
      { name: 'Closed-Won', value: 150 },
    ]
  },
  pricing: {
    title: "Flexible Pricing for Teams of All Sizes",
    subtitle: "Choose the plan that's right for you. No hidden fees.",
    monthlyPlans: [
      { name: "Free", price: "$0", description: "For individuals & small teams.", features: ['1 User Limit', '500 Leads', 'Core CRM tools'] },
      { name: "Basic", price: "$49", description: "For growing teams.", features: ['5 User Limit', '5,000 Leads', 'Basic Integrations', 'Team Management'] },
      { name: "Pro", price: "$99", description: "For scaling businesses.", features: ['20 User Limit', 'Unlimited Leads', 'Advanced Automation', 'Reporting & Analytics'], isPopular: true },
      { name: "Enterprise", price: "Contact Us", description: "For large organizations.", features: ['Unlimited Users', 'White-Labeling & SSO', 'Dedicated Support', 'API Access'] }
    ],
    yearlyPlans: [
      { name: "Free", price: "$0", description: "For individuals & small teams.", features: ['1 User Limit', '500 Leads', 'Core CRM tools'] },
      { name: "Basic", price: "$39", description: "For growing teams.", features: ['5 User Limit', '5,000 Leads', 'Basic Integrations', 'Team Management'] },
      { name: "Pro", price: "$79", description: "For scaling businesses.", features: ['20 User Limit', 'Unlimited Leads', 'Advanced Automation', 'Reporting & Analytics'], isPopular: true },
      { name: "Enterprise", price: "Contact Us", description: "For large organizations.", features: ['Unlimited Users', 'White-Labeling & SSO', 'Dedicated Support', 'API Access'] }
    ]
  },
  testimonials: {
    title: "What Our Customers Say",
    items: [
      { id: 't1', quote: 'With Clienn CRM, our conversion rate improved by 32% in 3 months. The AI summaries save my sales team hours every week!', author: 'Sarah Johnson', company: 'Marketing Manager, TechStart Inc.', avatar: { src: `https://i.pravatar.cc/150?u=sarah`, alt: 'Avatar of Sarah Johnson' } },
      { id: 't2', quote: 'The ability to manage leads from Facebook, our website, and calls all in one place has been a total game-changer for our team\'s efficiency.', author: 'David Lee', company: 'Sales Director, Realty Kings', avatar: { src: `https://i.pravatar.cc/150?u=david`, alt: 'Avatar of David Lee' } },
      { id: 't3', quote: 'Finally, a CRM that is both powerful and easy to use. The learning curve was minimal, and the impact on our productivity was immediate.', author: 'Maria Garcia', company: 'Founder, Ed-Tech Global', avatar: { src: `https://i.pravatar.cc/150?u=maria`, alt: 'Avatar of Maria Garcia' } },
      { id: 't4', quote: 'The automation features are a dream. We now have a consistent follow-up process that runs on autopilot, ensuring no lead falls through the cracks.', author: 'Chris Evans', company: 'Operations Head, Innovate Solutions', avatar: { src: `https://i.pravatar.cc/150?u=chris`, alt: 'Avatar of Chris Evans' } },
      { id: 't5', quote: 'As a manager, the reporting dashboard is invaluable. I can see team performance at a glance and make data-driven decisions on the fly.', author: 'Emily White', company: 'VP of Sales, Growth Co.', avatar: { src: `https://i.pravatar.cc/150?u=emily`, alt: 'Avatar of Emily White' } },
      { id: 't6', quote: 'The customer support is top-notch. They are responsive, helpful, and genuinely care about our success. Highly recommend!', author: 'Michael Brown', company: 'CEO, Bright Ideas Agency', avatar: { src: `https://i.pravatar.cc/150?u=michael`, alt: 'Avatar of Michael Brown' } }
    ]
  },
  faq: {
    title: "Frequently Asked Questions",
    subtitle: "Have questions? We've got answers.",
    items: [
      { id: 'f1', q: 'Is there a free trial available?', a: 'Yes! You can try our Pro plan for 14 days, no credit card required. Get full access to all features and see how Clienn CRM can transform your sales process.' },
      { id: 'f2', q: 'Can I change my plan later?', a: 'Absolutely. You can upgrade, downgrade, or cancel your plan at any time directly from your billing settings. Changes will be prorated.' },
      { id: 'f3', q: 'What integrations do you support?', a: 'We offer native integrations with Facebook Lead Ads, Google Ads, and any website form. You can also connect to thousands of other apps via our API and webhooks.' },
      { id: 'f4', q: 'Is my data secure?', a: 'Security is our top priority. We use industry-standard encryption, offer multi-factor authentication (MFA), and are fully compliant with GDPR. Your data is safe with us.' },
      { id: 'f5', q: 'Do you offer support?', a: 'Yes, all our paid plans come with email support. Our Enterprise plan includes a dedicated account manager and priority support.' },
      { id: 'f6', q: 'Can I import my existing leads?', a: 'Of course! You can easily import your existing leads via a CSV file. Our importer will help you map your data to the correct fields in Clienn CRM.' }
    ]
  },
  contactForm: {
    title: "Get in Touch",
    subtitle: "Have a question or want to see a personalized demo? Fill out the form below and we'll get back to you.",
    webhookUrl: "https://hooks.example.com/contact-form",
    address: "123 Innovation Drive, Suite 456, Tech City, 78910",
    email: "support@Clienn CRM.app",
    phone: "+1 (555) 123-4567",
    mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.617141569737!2d-73.987846684594!3d40.748440979327!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a9b3117469%3A0xd134e199a405a163!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1675281728271!5m2!1sen!2sus",
    fields: [
      { id: 'f_name', label: 'Full Name', type: 'text', required: true },
      { id: 'f_email', label: 'Work Email', type: 'email', required: true },
      { id: 'f_company', label: 'Company Name', type: 'text', required: false },
      { id: 'f_message', label: 'Your Message', type: 'textarea', required: true },
    ]
  },
  chatbot: {
    enabled: true,
    welcomeMessage: "Hi there! I'm the Clienn CRM assistant. I can help answer questions or get you connected with our team. What can I help you with?",
    questions: [
        { id: 'cq1', question: "To get started, what's your name?", crmField: 'name' },
        { id: 'cq2', question: "Great, {{name}}! What's your work email?", crmField: 'email' },
        { id: 'cq3', question: "And what's your company's name?", crmField: 'company' },
    ],
    thankYouMessage: "Thanks! Someone from our team will be in touch shortly.",
    color: "#2563eb",
    style: 'button'
  },
  blog: {
    title: "From Our Blog",
    subtitle: "Get the latest insights on sales, marketing, and growth.",
  },
  footer: {
    description: "Clienn CRM is the all-in-one platform for growing businesses to manage their sales, marketing, and customer relationships with the power of AI.",
    address: "123 Innovation Drive, Suite 456, Tech City, 78910",
    columns: [
        { title: 'Product', links: [{ text: 'Features', url: '#features' }, { text: 'Pricing', url: '/#/pricing' }, { text: 'Integrations', url: '#integrations' }, { text: 'Updates', url: '#' }] },
        { title: 'Company', links: [{ text: 'About', url: '#' }, { text: 'Blog', url: '/#/blog' }, { text: 'Careers', url: '#' }, { text: 'Contact Us', url: '#contact' }] },
        { title: 'Resources', links: [{ text: 'Help Center', url: '#' }, { text: 'API Docs', url: '#' }, { text: 'Case Studies', url: '#' }, { text: 'Webinars', url: '#' }] },
    ],
    socialLinks: [
        { name: 'LinkedIn', url: '#' }, { name: 'Twitter', url: '#' }, { name: 'Facebook', url: '#' }
    ],
    legal: {
        copyright: `© ${new Date().getFullYear()} Clienn CRM. All rights reserved.`,
        links: [{ text: 'Privacy Policy', url: '#' }, { text: 'Terms of Service', url: '#' }]
    }
  },
  finalCta: {
    title: "Ready to Grow Smarter?",
    subtitle: "Join thousands of businesses who have transformed their sales process with Clienn CRM. Get started today and see the difference.",
    cta: "Start Free Trial Now"
  }
};


