import React from 'react';

const PrivacyPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-30"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-30"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-4 mb-6">
                        <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg">
                            <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Privacy Policy</h1>
                    </div>
                    <p className="text-lg text-gray-300">Last updated: 13 October 2025</p>
                </div>

                {/* Content Container */}
                <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8 md:p-12">
                    <div className="prose prose-lg max-w-none text-white">
                        <p className="mb-8 text-lg text-gray-200 leading-relaxed">
                            At <strong className="text-blue-400">Clienn CRM</strong>, your privacy and data protection are our highest priorities.
                            This Privacy Policy explains how we collect, use, store, and protect your personal and organizational data when you use our CRM, LMS, and integrated marketing services.
                        </p>

                        <p className="mb-8 text-lg text-gray-200 leading-relaxed">
                            By using Clienn CRM, you agree to this Privacy Policy. If you do not agree, please stop using the platform immediately.
                        </p>

                        <h2 className="text-2xl font-semibold mb-6 text-blue-400 border-b border-blue-400 pb-3">1. Overview</h2>

                        <h2 className="text-2xl font-semibold mb-6 text-blue-400 border-b border-blue-400 pb-3">2. What Information We Collect</h2>

                        <h3 className="text-xl font-semibold mb-4 text-blue-300">2.1 Account Information</h3>
                        <ul className="list-disc pl-8 mb-6 text-gray-200 leading-relaxed space-y-2">
                            <li>Name, email address, phone number</li>
                            <li>Organization details, designation, and team role</li>
                            <li>Billing and subscription information</li>
                        </ul>

                        <h3 className="text-xl font-semibold mb-4 text-blue-300">2.2 Usage Data</h3>
                        <ul className="list-disc pl-8 mb-6 text-gray-200 leading-relaxed space-y-2">
                            <li>Actions you take within the CRM (lead creation, task updates, note additions)</li>
                            <li>Feature usage metrics (e.g., campaigns, imports, communication logs)</li>
                            <li>Device details (browser type, OS, IP address, time zone)</li>
                        </ul>

                        <h3 className="text-xl font-semibold mb-4 text-blue-300">2.3 Leads and Contacts</h3>
                        <ul className="list-disc pl-8 mb-6 text-gray-200 leading-relaxed space-y-2">
                            <li>Lead name, email, phone number, and any notes or interactions logged by your team</li>
                            <li>Source information (e.g., Facebook Lead Ads, Google Forms, or manual entries)</li>
                        </ul>

                        <h3 className="text-xl font-semibold mb-4 text-blue-300">2.4 Integrations</h3>
                        <ul className="list-disc pl-8 mb-6 text-gray-200 leading-relaxed space-y-2">
                            <li>API keys and tokens from third-party services (e.g., Meta, Google, WhatsApp, Zoom)</li>
                            <li>Consent-based data sharing for leads and campaigns</li>
                        </ul>

                        <h3 className="text-xl font-semibold mb-4 text-blue-300">2.5 Cookies and Tracking</h3>
                        <p className="mb-6 text-gray-200 leading-relaxed">We use cookies for session management, analytics, and feature optimization.</p>
                        <p className="mb-8 text-gray-200 leading-relaxed">You can control cookie preferences in your browser.</p>

                        <h2 className="text-2xl font-semibold mb-6 text-blue-400 border-b border-blue-400 pb-3">3. How We Use the Data</h2>

                        <p className="mb-6 text-gray-200 leading-relaxed">We process your data for the following purposes:</p>

                        <div className="overflow-x-auto mb-8">
                            <table className="w-full text-sm border-collapse border border-slate-600 bg-slate-800/50 rounded-lg">
                                <thead>
                                    <tr>
                                        <th className="border border-slate-600 p-4 text-left font-semibold text-blue-400">Purpose</th>
                                        <th className="border border-slate-600 p-4 text-left font-semibold text-blue-400">Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-slate-600 p-4 text-gray-200">Account Management</td>
                                        <td className="border border-slate-600 p-4 text-gray-200">To create, manage, and authenticate user accounts</td>
                                    </tr>
                                    <tr className="bg-slate-700/30">
                                        <td className="border border-slate-600 p-4 text-gray-200">Service Delivery</td>
                                        <td className="border border-slate-600 p-4 text-gray-200">To provide CRM/LMS features, integrations, and dashboards</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-slate-600 p-4 text-gray-200">Communication</td>
                                        <td className="border border-slate-600 p-4 text-gray-200">To send updates, notifications, and support messages</td>
                                    </tr>
                                    <tr className="bg-slate-700/30">
                                        <td className="border border-slate-600 p-4 text-gray-200">AI Recommendations</td>
                                        <td className="border border-slate-600 p-4 text-gray-200">To improve lead scoring, engagement prediction, and campaign optimization</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-slate-600 p-4 text-gray-200">Compliance & Security</td>
                                        <td className="border border-slate-600 p-4 text-gray-200">To prevent fraud, unauthorized access, and misuse of the system</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <h2 className="text-2xl font-semibold mb-6 text-blue-400 border-b border-blue-400 pb-3">4. AI-Driven Processing</h2>

                        <p className="mb-6 text-gray-200 leading-relaxed">
                            Our platform uses AI models to recommend actions (e.g., lead priority, follow-up timing, and communication templates).
                            These recommendations are based on anonymized and aggregated data.
                        </p>

                        <p className="mb-6 text-gray-200 leading-relaxed">
                            We do not use your private lead data for any external AI model training.
                            You can request opt-out of AI-based insights anytime.
                        </p>

                        <h2 className="text-2xl font-semibold mb-6 text-blue-400 border-b border-blue-400 pb-3">5. Data Sharing & Third-Party Services</h2>

                        <p className="mb-6 text-lg font-semibold text-white">We never sell your data.</p>
                        <p className="mb-6 text-gray-200 leading-relaxed">We may share limited information only under these conditions:</p>

                        <div className="overflow-x-auto mb-8">
                            <table className="w-full text-sm border-collapse border border-slate-600 bg-slate-800/50 rounded-lg">
                                <thead>
                                    <tr>
                                        <th className="border border-slate-600 p-4 text-left font-semibold text-blue-400">Type</th>
                                        <th className="border border-slate-600 p-4 text-left font-semibold text-blue-400">Shared With</th>
                                        <th className="border border-slate-600 p-4 text-left font-semibold text-blue-400">Purpose</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-slate-600 p-4 text-gray-200">Analytics</td>
                                        <td className="border border-slate-600 p-4 text-gray-200">Google Analytics, Mixpanel</td>
                                        <td className="border border-slate-600 p-4 text-gray-200">To understand feature usage</td>
                                    </tr>
                                    <tr className="bg-slate-700/30">
                                        <td className="border border-slate-600 p-4 text-gray-200">Integrations</td>
                                        <td className="border border-slate-600 p-4 text-gray-200">Meta, Google, WhatsApp API</td>
                                        <td className="border border-slate-600 p-4 text-gray-200">To sync leads and send communications</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-slate-600 p-4 text-gray-200">Payment Gateways</td>
                                        <td className="border border-slate-600 p-4 text-gray-200">Razorpay, Stripe</td>
                                        <td className="border border-slate-600 p-4 text-gray-200">For subscription and plan renewals</td>
                                    </tr>
                                    <tr className="bg-slate-700/30">
                                        <td className="border border-slate-600 p-4 text-gray-200">Cloud Services</td>
                                        <td className="border border-slate-600 p-4 text-gray-200">AWS, MongoDB Atlas, Neon PostgreSQL</td>
                                        <td className="border border-slate-600 p-4 text-gray-200">For secure hosting and data storage</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <p className="mb-8 text-gray-200 leading-relaxed">
                            All third parties comply with strict contractual obligations and data protection standards.
                        </p>

                        <h2 className="text-2xl font-semibold mb-6 text-blue-400 border-b border-blue-400 pb-3">6. Organization-Level Privacy</h2>

                        <p className="mb-6 text-gray-200 leading-relaxed">
                            Clienn CRM operates in a multi-tenant architecture:
                        </p>

                        <ul className="list-disc pl-8 mb-8 text-gray-200 leading-relaxed space-y-2">
                            <li>Each organization's data is logically and physically isolated.</li>
                            <li>Super Admins can view only their organization's users and leads.</li>
                            <li>No cross-organization data access is permitted.</li>
                        </ul>

                        <h2 className="text-2xl font-semibold mb-6 text-blue-400 border-b border-blue-400 pb-3">7. Data Retention Policy</h2>

                        <div className="overflow-x-auto mb-8">
                            <table className="w-full text-sm border-collapse border border-slate-600 bg-slate-800/50 rounded-lg">
                                <thead>
                                    <tr>
                                        <th className="border border-slate-600 p-4 text-left font-semibold text-blue-400">Data Type</th>
                                        <th className="border border-slate-600 p-4 text-left font-semibold text-blue-400">Retention Period</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-slate-600 p-4 text-gray-200">Account and organization data</td>
                                        <td className="border border-slate-600 p-4 text-gray-200">Until account deletion</td>
                                    </tr>
                                    <tr className="bg-slate-700/30">
                                        <td className="border border-slate-600 p-4 text-gray-200">Leads and communications</td>
                                        <td className="border border-slate-600 p-4 text-gray-200">As long as your subscription is active</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-slate-600 p-4 text-gray-200">Billing records</td>
                                        <td className="border border-slate-600 p-4 text-gray-200">7 years (as required by law)</td>
                                    </tr>
                                    <tr className="bg-slate-700/30">
                                        <td className="border border-slate-600 p-4 text-gray-200">Logs and backups</td>
                                        <td className="border border-slate-600 p-4 text-gray-200">Up to 90 days</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <p className="mb-8 text-gray-200 leading-relaxed">
                            You can request data deletion via email or the in-app Support section.
                        </p>

                        <h2 className="text-2xl font-semibold mb-6 text-blue-400 border-b border-blue-400 pb-3">8. Data Security</h2>

                        <p className="mb-6 text-gray-200 leading-relaxed">We implement multiple layers of protection:</p>

                        <ul className="list-disc pl-8 mb-8 text-gray-200 leading-relaxed space-y-2">
                            <li>SSL/TLS encryption for all data in transit</li>
                            <li>Role-based access control (RBAC)</li>
                            <li>Encrypted passwords and tokens (bcrypt + JWT)</li>
                            <li>Regular security audits and vulnerability scans</li>
                            <li>Geo-redundant backups and uptime monitoring</li>
                        </ul>

                        <h2 className="text-2xl font-semibold mb-6 text-blue-400 border-b border-blue-400 pb-3">9. Your Rights</h2>

                        <p className="mb-6 text-gray-200 leading-relaxed">You have full control over your data:</p>

                        <ul className="list-disc pl-8 mb-8 text-gray-200 leading-relaxed space-y-2">
                            <li><strong className="text-blue-300">Access</strong> – Request a copy of your data</li>
                            <li><strong className="text-blue-300">Correction</strong> – Update inaccurate information</li>
                            <li><strong className="text-blue-300">Deletion</strong> – Request permanent deletion</li>
                            <li><strong className="text-blue-300">Portability</strong> – Export your CRM data in structured format</li>
                            <li><strong className="text-blue-300">Consent Withdrawal</strong> – Opt-out of marketing or data sharing</li>
                        </ul>

                        <p className="mb-8 text-gray-200 leading-relaxed">
                            To exercise any of these rights, contact us via the in-app support form or email below.
                        </p>

                        <h2 className="text-2xl font-semibold mb-6 text-blue-400 border-b border-blue-400 pb-3">10. International Data Transfer</h2>

                        <p className="mb-8 text-gray-200 leading-relaxed">
                            If you are located outside India, your data may be processed in India or other countries where our servers and partners are located.
                            We ensure equivalent data protection measures in compliance with GDPR and DPDP (India).
                        </p>

                        <h2 className="text-2xl font-semibold mb-6 text-blue-400 border-b border-blue-400 pb-3">11. Children's Privacy</h2>

                        <p className="mb-8 text-gray-200 leading-relaxed">
                            Our services are not directed to individuals under the age of 18.
                            We do not knowingly collect personal data from minors.
                        </p>

                        <h2 className="text-2xl font-semibold mb-6 text-blue-400 border-b border-blue-400 pb-3">12. Policy Updates</h2>

                        <p className="mb-6 text-gray-200 leading-relaxed">We may update this Privacy Policy periodically.</p>
                        <p className="mb-6 text-gray-200 leading-relaxed">When changes are made, we will:</p>

                        <ul className="list-disc pl-8 mb-8 text-gray-200 leading-relaxed space-y-2">
                            <li>Update the "Last Updated" date, and</li>
                            <li>Notify all users via dashboard or email.</li>
                        </ul>

                        <h2 className="text-2xl font-semibold mb-6 text-blue-400 border-b border-blue-400 pb-3">13. Contact Us</h2>

                        <p className="mb-6 text-gray-200 leading-relaxed">
                            If you have any questions, concerns, or complaints about privacy or data usage:
                        </p>

                        <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-600">
                            <p className="text-lg font-semibold text-white mb-4">Data Protection Officer (DPO)</p>
                            <p className="text-lg font-semibold text-white mb-4">Clienn CRM | Zetta Edutech Private Limited</p>
                            <div className="space-y-3">
                                <p className="text-gray-200">
                                    📧 Email: <a href="mailto:support@Clienn CRM.io" className="text-blue-400 hover:text-blue-300 transition-colors font-semibold">support@Clienn CRM.io</a>
                                </p>
                                <p className="text-gray-200">🏢 Address: New Delhi, India</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPage;



