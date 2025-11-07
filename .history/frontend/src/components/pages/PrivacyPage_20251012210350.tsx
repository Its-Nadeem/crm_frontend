
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



