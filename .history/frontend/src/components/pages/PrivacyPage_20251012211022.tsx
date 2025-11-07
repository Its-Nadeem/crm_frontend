import React from 'react';

const PrivacyPage: React.FC = () => {
    return (
        <div className="py-12 sm:py-16 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-on-surface mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-lg text-subtle">
                        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Content */}
                <div className="prose prose-lg max-w-none text-on-surface prose-invert dark:prose-invert">
                    <div className="bg-surface border border-muted rounded-xl p-8 mb-8">
                        <p className="text-base text-subtle leading-relaxed">
                            At Clienn CRM, we are committed to protecting your privacy and ensuring the security of your personal information.
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our CRM platform.
                        </p>
                    </div>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center">
                            <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                            Information We Collect
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-muted/30 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-on-surface mb-3">Personal Information</h3>
                                <p className="text-subtle mb-3">We may collect personal information that you provide directly to us, including:</p>
                                <ul className="list-disc list-inside text-subtle space-y-1 ml-4">
                                    <li>Name, email address, and contact information</li>
                                    <li>Account credentials and profile information</li>
                                    <li>Payment and billing information</li>
                                    <li>Communication preferences</li>
                                </ul>
                            </div>

                            <div className="bg-muted/30 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-on-surface mb-3">Usage Data</h3>
                                <p className="text-subtle mb-3">We automatically collect certain information about your use of our services:</p>
                                <ul className="list-disc list-inside text-subtle space-y-1 ml-4">
                                    <li>Device information and browser type</li>
                                    <li>IP address and location data</li>
                                    <li>Pages visited and features used</li>
                                    <li>Time spent on the platform</li>
                                    <li>Error logs and performance data</li>
                                </ul>
                            </div>

                            <div className="bg-muted/30 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-on-surface mb-3">Customer Data</h3>
                                <p className="text-subtle mb-3">Data you store in our platform about your customers and leads:</p>
                                <ul className="list-disc list-inside text-subtle space-y-1 ml-4">
                                    <li>Contact information and profiles</li>
                                    <li>Communication history</li>
                                    <li>Lead scoring and analytics data</li>
                                    <li>Custom fields and notes</li>
                                    <li>File attachments and documents</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center">
                            <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                            How We Use Your Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-surface border border-muted rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-on-surface mb-3">Service Provision</h3>
                                <ul className="text-subtle space-y-2">
                                    <li>• Provide and maintain our CRM services</li>
                                    <li>• Process transactions and manage accounts</li>
                                    <li>• Send service-related communications</li>
                                    <li>• Provide customer support</li>
                                </ul>
                            </div>

                            <div className="bg-surface border border-muted rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-on-surface mb-3">Platform Improvement</h3>
                                <ul className="text-subtle space-y-2">
                                    <li>• Analyze usage patterns and trends</li>
                                    <li>• Develop new features and functionality</li>
                                    <li>• Improve user experience</li>
                                    <li>• Ensure platform security</li>
                                </ul>
                            </div>

                            <div className="bg-surface border border-muted rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-on-surface mb-3">Communication</h3>
                                <ul className="text-subtle space-y-2">
                                    <li>• Send product updates and newsletters</li>
                                    <li>• Provide training and educational content</li>
                                    <li>• Share relevant industry insights</li>
                                    <li>• Conduct surveys and feedback requests</li>
                                </ul>
                            </div>

                            <div className="bg-surface border border-muted rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-on-surface mb-3">Legal Compliance</h3>
                                <ul className="text-subtle space-y-2">
                                    <li>• Comply with legal obligations</li>
                                    <li>• Protect against fraud and abuse</li>
                                    <li>• Enforce our terms of service</li>
                                    <li>• Protect intellectual property rights</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center">
                            <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                            Information Sharing and Disclosure
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-3">Third-Party Service Providers</h3>
                                <p className="text-amber-700 dark:text-amber-300">
                                    We may share your information with trusted third-party service providers who assist us in operating our platform,
                                    including cloud hosting, payment processing, analytics, and customer support services. These providers are
                                    contractually obligated to protect your information.
                                </p>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">Business Transfers</h3>
                                <p className="text-blue-700 dark:text-blue-300">
                                    In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the transaction.
                                    We will notify you of any such change in ownership or control.
                                </p>
                            </div>

                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">Legal Requirements</h3>
                                <p className="text-green-700 dark:text-green-300">
                                    We may disclose your information if required by law, legal process, or government request, or to protect our rights,
                                    property, or safety, or that of our users or the public.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center">
                            <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
                            Data Security
                        </h2>

                        <div className="bg-surface border border-muted rounded-lg p-8">
                            <p className="text-subtle mb-6 leading-relaxed">
                                We implement industry-standard security measures to protect your information against unauthorized access,
                                alteration, disclosure, or destruction. These measures include:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center text-subtle">
                                        <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                                        <span>End-to-end encryption for data in transit</span>
                                    </div>
                                    <div className="flex items-center text-subtle">
                                        <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                                        <span>Encrypted storage with AES-256 encryption</span>
                                    </div>
                                    <div className="flex items-center text-subtle">
                                        <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                                        <span>Regular security audits and penetration testing</span>
                                    </div>
                                    <div className="flex items-center text-subtle">
                                        <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                                        <span>Multi-factor authentication (MFA) support</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center text-subtle">
                                        <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                                        <span>Role-based access controls</span>
                                    </div>
                                    <div className="flex items-center text-subtle">
                                        <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                                        <span>Automated backup and disaster recovery</span>
                                    </div>
                                    <div className="flex items-center text-subtle">
                                        <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                                        <span>24/7 security monitoring</span>
                                    </div>
                                    <div className="flex items-center text-subtle">
                                        <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                                        <span>GDPR and SOC 2 compliance</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center">
                            <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">5</span>
                            Your Rights and Choices
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-surface border border-muted rounded-lg p-6 text-center">
                                <h3 className="text-lg font-semibold text-on-surface mb-3">Access</h3>
                                <p className="text-subtle text-sm">
                                    Request a copy of the personal information we hold about you
                                </p>
                            </div>

                            <div className="bg-surface border border-muted rounded-lg p-6 text-center">
                                <h3 className="text-lg font-semibold text-on-surface mb-3">Correction</h3>
                                <p className="text-subtle text-sm">
                                    Request correction of inaccurate or incomplete information
                                </p>
                            </div>

                            <div className="bg-surface border border-muted rounded-lg p-6 text-center">
                                <h3 className="text-lg font-semibold text-on-surface mb-3">Deletion</h3>
                                <p className="text-subtle text-sm">
                                    Request deletion of your personal information (subject to legal requirements)
                                </p>
                            </div>

                            <div className="bg-surface border border-muted rounded-lg p-6 text-center">
                                <h3 className="text-lg font-semibold text-on-surface mb-3">Portability</h3>
                                <p className="text-subtle text-sm">
                                    Request a copy of your data in a machine-readable format
                                </p>
                            </div>

                            <div className="bg-surface border border-muted rounded-lg p-6 text-center">
                                <h3 className="text-lg font-semibold text-on-surface mb-3">Opt-out</h3>
                                <p className="text-subtle text-sm">
                                    Unsubscribe from marketing communications at any time
                                </p>
                            </div>

                            <div className="bg-surface border border-muted rounded-lg p-6 text-center">
                                <h3 className="text-lg font-semibold text-on-surface mb-3">Restriction</h3>
                                <p className="text-subtle text-sm">
                                    Request limitation of processing in certain circumstances
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center">
                            <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">6</span>
                            Cookies and Tracking
                        </h2>

                        <div className="bg-surface border border-muted rounded-lg p-6">
                            <p className="text-subtle mb-4 leading-relaxed">
                                We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns,
                                and provide personalized content. You can control cookie settings through your browser preferences.
                            </p>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-muted last:border-b-0">
                                    <span className="font-medium text-on-surface">Essential Cookies</span>
                                    <span className="text-sm text-subtle">Required for platform functionality</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-muted last:border-b-0">
                                    <span className="font-medium text-on-surface">Analytics Cookies</span>
                                    <span className="text-sm text-subtle">Help us understand usage patterns</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-muted last:border-b-0">
                                    <span className="font-medium text-on-surface">Marketing Cookies</span>
                                    <span className="text-sm text-subtle">Used for targeted advertising</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center">
                            <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">7</span>
                            Data Retention
                        </h2>

                        <div className="bg-surface border border-muted rounded-lg p-6">
                            <p className="text-subtle mb-4 leading-relaxed">
                                We retain your information for as long as necessary to provide our services and fulfill the purposes
                                outlined in this Privacy Policy. Data retention periods vary depending on the type of information:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-muted/30 rounded p-4">
                                    <h4 className="font-semibold text-on-surface mb-2">Account Data</h4>
                                    <p className="text-sm text-subtle">Retained while account is active and for 3 years after account closure</p>
                                </div>
                                <div className="bg-muted/30 rounded p-4">
                                    <h4 className="font-semibold text-on-surface mb-2">Customer Data</h4>
                                    <p className="text-sm text-subtle">Retained while account is active; deleted within 90 days of account closure</p>
                                </div>
                                <div className="bg-muted/30 rounded p-4">
                                    <h4 className="font-semibold text-on-surface mb-2">Usage Analytics</h4>
                                    <p className="text-sm text-subtle">Retained for 2 years for platform improvement</p>
                                </div>
                                <div className="bg-muted/30 rounded p-4">
                                    <h4 className="font-semibold text-on-surface mb-2">Legal Compliance</h4>
                                    <p className="text-sm text-subtle">Retained as required by applicable laws and regulations</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center">
                            <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">8</span>
                            International Data Transfers
                        </h2>

                        <div className="bg-surface border border-muted rounded-lg p-6">
                            <p className="text-subtle leading-relaxed">
                                Your information may be transferred to and processed in countries other than your own.
                                We ensure that such transfers comply with applicable data protection laws and implement
                                appropriate safeguards to protect your information.
                            </p>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center">
                            <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">9</span>
                            Children's Privacy
                        </h2>

                        <div className="bg-surface border border-muted rounded-lg p-6">
                            <p className="text-subtle leading-relaxed">
                                Our services are not intended for children under 13 years of age. We do not knowingly collect
                                personal information from children under 13. If you are a parent or guardian and believe your
                                child has provided us with personal information, please contact us immediately.
                            </p>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center">
                            <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">10</span>
                            Changes to This Policy
                        </h2>

                        <div className="bg-surface border border-muted rounded-lg p-6">
                            <p className="text-subtle leading-relaxed mb-4">
                                We may update this Privacy Policy from time to time. We will notify you of any material changes
                                by posting the new Privacy Policy on this page and updating the "Last updated" date.
                            </p>
                            <p className="text-subtle leading-relaxed">
                                We encourage you to review this Privacy Policy periodically to stay informed about our privacy practices.
                            </p>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center">
                            <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">11</span>
                            Contact Us
                        </h2>

                        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-8">
                            <p className="text-primary-800 dark:text-primary-200 mb-4 leading-relaxed">
                                If you have any questions about this Privacy Policy or our privacy practices, please contact us:
                            </p>

                            <div className="space-y-3 text-primary-700 dark:text-primary-300">
                                <div className="flex items-center">
                                    <span className="font-semibold mr-3">Email:</span>
                                    <a href="mailto:privacy@Clienn CRM.app" className="hover:underline">
                                        privacy@Clienn CRM.app
                                    </a>
                                </div>
                                <div className="flex items-center">
                                    <span className="font-semibold mr-3">Address:</span>
                                    <span>123 Innovation Drive, Suite 456, Tech City, 78910</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="font-semibold mr-3">Phone:</span>
                                    <a href="tel:+15551234567" className="hover:underline">
                                        +1 (555) 123-4567
                                    </a>
                                </div>
                            </div>

                            <p className="text-primary-800 dark:text-primary-200 mt-6 leading-relaxed">
                                We will respond to your inquiry within 30 days.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPage;



