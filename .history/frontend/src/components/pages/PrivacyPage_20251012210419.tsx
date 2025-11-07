
import React from 'react';
import { Link } from 'react-router-dom';
import { AppIcons } from '../../components/ui/Icons';

const PrivacyPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-background text-on-surface">
            {/* Header */}
            <header className="bg-surface border-b border-muted">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-3">
                            <AppIcons.Logo className="h-8 w-8 text-primary-500" />
                            <span className="text-xl font-bold">Clienn CRM</span>
                        </Link>
                        <Link to="/" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                            &larr; Back to Home
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-12">
                        <h1 className="text-4xl font-bold text-on-surface mb-4">Privacy Policy</h1>
                        <p className="text-lg text-subtle">
                            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    <div className="prose prose-lg max-w-none text-on-surface">
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold mb-6 text-on-surface">1. Introduction</h2>
                            <p className="text-subtle mb-4">
                                Welcome to Clienn CRM ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our customer relationship management (CRM) platform and related services.
                            </p>
                            <p className="text-subtle mb-4">
                                By using Clienn CRM, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold mb-6 text-on-surface">2. Information We Collect</h2>

                            <h3 className="text-xl font-medium mb-4 text-on-surface">2.1 Personal Information</h3>
                            <p className="text-subtle mb-4">
                                We may collect personal information that you provide directly to us, including:
                            </p>
                            <ul className="list-disc pl-6 mb-6 text-subtle">
                                <li>Name, email address, phone number, and other contact information</li>
                                <li>Account credentials (username, password)</li>
                                <li>Billing and payment information</li>
                                <li>Company information and job title</li>
                                <li>Profile picture or avatar</li>
                                <li>Communication preferences</li>
                            </ul>

                            <h3 className="text-xl font-medium mb-4 text-on-surface">2.2 Customer Data</h3>
                            <p className="text-subtle mb-4">
                                As a CRM platform, we process customer data on your behalf, which may include:
                            </p>
                            <ul className="list-disc pl-6 mb-6 text-subtle">
                                <li>Customer names, email addresses, phone numbers</li>
                                <li>Lead information and interaction history</li>
                                <li>Communication records (emails, calls, notes)</li>
                                <li>Deal and pipeline information</li>
                                <li>Custom fields and tags you create</li>
                                <li>File attachments and documents</li>
                            </ul>

                            <h3 className="text-xl font-medium mb-4 text-on-surface">2.3 Usage Data</h3>
                            <p className="text-subtle mb-4">
                                We automatically collect certain information about your use of our services:
                            </p>
                            <ul className="list-disc pl-6 mb-6 text-subtle">
                                <li>IP address and device information</li>
                                <li>Browser type and version</li>
                                <li>Pages visited and time spent on our platform</li>
                                <li>Click patterns and user interactions</li>
                                <li>Error logs and performance metrics</li>
                                <li>Session recordings (with your consent)</li>
                            </ul>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold mb-6 text-on-surface">3. How We Use Your Information</h2>
                            <p className="text-subtle mb-4">
                                We use the collected information for various purposes, including:
                            </p>
                            <ul className="list-disc pl-6 mb-6 text-subtle">
                                <li><strong>Service Provision:</strong> To provide, maintain, and improve our CRM services</li>
                                <li><strong>Account Management:</strong> To create and manage your account</li>
                                <li><strong>Communication:</strong> To send you important updates, security alerts, and support messages</li>
                                <li><strong>Billing:</strong> To process payments and manage subscriptions</li>
                                <li><strong>Analytics:</strong> To analyze usage patterns and improve our platform</li>
                                <li><strong>Security:</strong> To detect and prevent fraud, abuse, and security threats</li>
                                <li><strong>Legal Compliance:</strong> To comply with legal obligations and enforce our terms</li>
                                <li><strong>Customer Support:</strong> To provide technical support and respond to inquiries</li>
                            </ul>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold mb-6 text-on-surface">4. Information Sharing and Disclosure</h2>
                            <p className="text-subtle mb-4">
                                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
                            </p>
                            <ul className="list-disc pl-6 mb-6 text-subtle">
                                <li><strong>Service Providers:</strong> With trusted third-party vendors who assist in operating our platform (payment processors, cloud hosting, analytics)</li>
                                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                                <li><strong>Consent:</strong> With your explicit consent for specific purposes</li>
                                <li><strong>Aggregated Data:</strong> Anonymous, aggregated data for research and analytics</li>
                            </ul>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold mb-6 text-on-surface">5. Data Security</h2>
                            <p className="text-subtle mb-4">
                                We implement robust security measures to protect your information:
                            </p>
                            <ul className="list-disc pl-6 mb-6 text-subtle">
                                <li>End-to-end encryption for data in transit and at rest</li>
                                <li>Regular security audits and vulnerability assessments</li>
                                <li>Multi-factor authentication (MFA) support</li>
                                <li>Role-based access controls</li>
                                <li>Secure data centers with SOC 2 compliance</li>
                                <li>Regular backups and disaster recovery procedures</li>
                                <li>Employee access controls and security training</li>
                            </ul>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold mb-6 text-on-surface">6. Cookies and Tracking Technologies</h2>
                            <p className="text-subtle mb-4">
                                We use cookies and similar technologies to enhance your experience:
                            </p>
                            <ul className="list-disc pl-6 mb-6 text-subtle">
                                <li><strong>Essential Cookies:</strong> Required for basic platform functionality</li>
                                <li><strong>Analytics Cookies:</strong> Help us understand how you use our services</li>
                                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                                <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements (with consent)</li>
                            </ul>
                            <p className="text-subtle mb-4">
                                You can control cookie settings through your browser preferences. Note that disabling certain cookies may affect platform functionality.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold mb-6 text-on-surface">7. Data Retention</h2>
                            <p className="text-subtle mb-4">
                                We retain your information for as long as necessary to provide our services and fulfill the purposes outlined in this policy:
                            </p>
                            <ul className="list-disc pl-6 mb-6 text-subtle">
                                <li>Account data is retained while your account is active</li>
                                <li>Customer data is retained according to your subscription and data retention preferences</li>
                                <li>Usage data is typically retained for 24-36 months for analytics purposes</li>
                                <li>Legal and regulatory data may be retained longer as required by law</li>
                                <li>You can request data deletion at any time (subject to legal requirements)</li>
                            </ul>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold mb-6 text-on-surface">8. Your Rights and Choices</h2>
                            <p className="text-subtle mb-4">
                                Depending on your location, you may have the following rights:
                            </p>
                            <ul className="list-disc pl-6 mb-6 text-subtle">
                                <li><strong>Access:</strong> Request information about the personal data we hold about you</li>
                                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                                <li><strong>Deletion:</strong> Request deletion of your personal data (right to be forgotten)</li>
                                <li><strong>Portability:</strong> Request a copy of your data in a machine-readable format</li>
                                <li><strong>Restriction:</strong> Request limitation of processing under certain circumstances</li>



