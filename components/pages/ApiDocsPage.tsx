import React from 'react';
import { AppIcons } from '../ui/Icons';

const ApiDocsPage: React.FC = () => {
    const availableEvents = [
        { value: 'lead.created', label: 'Lead Created' },
        { value: 'lead.updated', label: 'Lead Updated' },
        { value: 'lead.deleted', label: 'Lead Deleted' },
        { value: 'lead.stage_changed', label: 'Stage Changed' },
        { value: 'lead.assigned', label: 'Lead Assigned' },
        { value: 'lead.received', label: 'Lead Received' }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4">
                        <div className="text-blue-600 bg-blue-50 p-3 rounded-xl">
                            <AppIcons.Code className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900">API Documentation</h1>
                            <p className="text-xl text-gray-600 mt-2">Integrate with Clienn CRM using our REST API and webhooks</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="space-y-12">

                    {/* Quick Start */}
                    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Quick Start</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="p-6 border border-gray-200 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-3">Authentication</h3>
                                <p className="text-gray-600 text-sm mb-4">Use your API key in the Authorization header</p>
                                <code className="text-xs bg-gray-100 p-3 rounded block text-gray-800">
                                    Authorization: Bearer YOUR_API_KEY
                                </code>
                                <button
                                    onClick={() => navigator.clipboard.writeText('Authorization: Bearer YOUR_API_KEY')}
                                    className="mt-3 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded"
                                >
                                    Copy Header
                                </button>
                            </div>
                            <div className="p-6 border border-gray-200 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-3">Base URL</h3>
                                <p className="text-gray-600 text-sm mb-4">All API requests should use this base URL</p>
                                <code className="text-xs bg-gray-100 p-3 rounded block text-gray-800">
                                    https://crm.clienn.com/api
                                </code>
                                <button
                                    onClick={() => navigator.clipboard.writeText('https://crm.clienn.com/api')}
                                    className="mt-3 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded"
                                >
                                    Copy Base URL
                                </button>
                            </div>
                            <div className="p-6 border border-gray-200 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-3">Rate Limits</h3>
                                <p className="text-gray-600 text-sm mb-4">API rate limiting information</p>
                                <div className="text-xs text-gray-600 space-y-1">
                                    <p>• 1000 requests per hour</p>
                                    <p>• 100 requests per minute</p>
                                </div>
                            </div>
                            <div className="p-6 border border-gray-200 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-3">Content Type</h3>
                                <p className="text-gray-600 text-sm mb-4">Use JSON for request bodies</p>
                                <code className="text-xs bg-gray-100 p-3 rounded block text-gray-800">
                                    Content-Type: application/json
                                </code>
                                <button
                                    onClick={() => navigator.clipboard.writeText('Content-Type: application/json')}
                                    className="mt-3 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded"
                                >
                                    Copy Header
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* API Endpoints */}
                    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">API Endpoints</h2>
                        <div className="space-y-6">
                            {/* Leads Endpoints */}
                            <div>
                                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Leads</h3>
                                <div className="space-y-4">
                                    <div className="border border-gray-200 rounded-lg p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-lg font-semibold text-gray-900">GET /api/leads</h4>
                                            <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">GET</span>
                                        </div>
                                        <p className="text-gray-600 mb-4">Retrieve all leads with optional filtering</p>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <code className="text-sm text-gray-800">GET https://crm.clienn.com/api/leads</code>
                                        </div>
                                        <div className="mt-4">
                                            <h5 className="font-medium text-gray-900 mb-2">Query Parameters:</h5>
                                            <ul className="text-sm text-gray-600 space-y-1">
                                                <li><code>limit</code> - Number of leads to return (default: 50)</li>
                                                <li><code>offset</code> - Number of leads to skip (default: 0)</li>
                                                <li><code>stage</code> - Filter by lead stage</li>
                                                <li><code>assignedTo</code> - Filter by assigned user ID</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="border border-gray-200 rounded-lg p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-lg font-semibold text-gray-900">POST /api/leads</h4>
                                            <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">POST</span>
                                        </div>
                                        <p className="text-gray-600 mb-4">Create a new lead</p>
                                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                            <code className="text-sm text-gray-800">POST https://crm.clienn.com/api/leads</code>
                                        </div>
                                        <div>
                                            <h5 className="font-medium text-gray-900 mb-2">Request Body:</h5>
                                            <pre className="text-xs bg-gray-100 p-3 rounded text-gray-800 overflow-x-auto">{`{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "source": "website",
  "notes": "Interested in our services"
}`}</pre>
                                        </div>
                                    </div>

                                    <div className="border border-gray-200 rounded-lg p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-lg font-semibold text-gray-900">PUT /api/leads/{'{id}'}</h4>
                                            <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium">PUT</span>
                                        </div>
                                        <p className="text-gray-600 mb-4">Update an existing lead</p>
                                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                            <code className="text-sm text-gray-800">PUT https://crm.clienn.com/api/leads/123</code>
                                        </div>
                                        <div>
                                            <h5 className="font-medium text-gray-900 mb-2">Request Body:</h5>
                                            <pre className="text-xs bg-gray-100 p-3 rounded text-gray-800 overflow-x-auto">{`{
  "stage": "Contacted",
  "notes": "Updated contact information"
}`}</pre>
                                        </div>
                                    </div>

                                    <div className="border border-gray-200 rounded-lg p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-lg font-semibold text-gray-900">DELETE /api/leads/{'{id}'}</h4>
                                            <span className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium">DELETE</span>
                                        </div>
                                        <p className="text-gray-600 mb-4">Delete a lead</p>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <code className="text-sm text-gray-800">DELETE https://crm.clienn.com/api/leads/123</code>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Webhooks Endpoints */}
                            <div>
                                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Webhooks</h3>
                                <div className="space-y-4">
                                    <div className="border border-gray-200 rounded-lg p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-lg font-semibold text-gray-900">GET /api/webhooks</h4>
                                            <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">GET</span>
                                        </div>
                                        <p className="text-gray-600 mb-4">List all webhooks</p>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <code className="text-sm text-gray-800">GET https://crm.clienn.com/api/webhooks</code>
                                        </div>
                                    </div>

                                    <div className="border border-gray-200 rounded-lg p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-lg font-semibold text-gray-900">POST /api/webhooks</h4>
                                            <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">POST</span>
                                        </div>
                                        <p className="text-gray-600 mb-4">Create a new webhook</p>
                                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                            <code className="text-sm text-gray-800">POST https://crm.clienn.com/api/webhooks</code>
                                        </div>
                                        <div>
                                            <h5 className="font-medium text-gray-900 mb-2">Request Body:</h5>
                                            <pre className="text-xs bg-gray-100 p-3 rounded text-gray-800 overflow-x-auto">{`{
  "name": "My Webhook",
  "url": "https://myapp.com/webhook",
  "events": ["lead.created", "lead.updated"],
  "isEnabled": true
}`}</pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Webhook Events */}
                    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Webhook Events</h2>
                        <p className="text-gray-600 mb-8">Webhooks are sent as POST requests to your configured URLs with JSON payloads. Each webhook includes an HMAC signature for verification.</p>

                        <div className="space-y-6">
                            {availableEvents.map(event => (
                                <div key={event.value} className="border border-gray-200 rounded-lg p-6">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{event.label}</h3>
                                    <p className="text-gray-600 mb-4">
                                        {event.value === 'lead.created' && 'Triggered when a new lead is created in the CRM'}
                                        {event.value === 'lead.updated' && 'Triggered when a lead\'s information is updated'}
                                        {event.value === 'lead.deleted' && 'Triggered when a lead is deleted from the CRM'}
                                        {event.value === 'lead.stage_changed' && 'Triggered when a lead moves to a different stage'}
                                        {event.value === 'lead.assigned' && 'Triggered when a lead is assigned to a user'}
                                        {event.value === 'lead.received' && 'Triggered when a lead is received from an external source'}
                                    </p>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-gray-900 mb-2">Sample Payload:</h4>
                                        <pre className="text-xs text-gray-800 overflow-x-auto">{`{
  "event": "${event.value}",
  "data": {
    "id": "lead_123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "source": "website",
    "createdAt": "2025-01-23T10:30:00Z",
    "organizationId": "org_456"
  },
  "timestamp": "2025-01-23T10:30:00Z",
  "webhookId": "webhook_789"
}`}</pre>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Authentication & Security */}
                    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Authentication & Security</h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">API Key Security</h3>
                                <ul className="text-gray-600 space-y-2">
                                    <li>• Keep your API keys secure and never share them publicly</li>
                                    <li>• Use HTTPS for all API requests</li>
                                    <li>• Rotate your keys regularly for security</li>
                                    <li>• Monitor your API usage for unusual activity</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Webhook Verification</h3>
                                <p className="text-gray-600 mb-4">Each webhook request includes an X-Webhook-Signature header containing an HMAC-SHA256 signature of the payload.</p>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium text-gray-900 mb-2">Verification Example:</h4>
                                    <pre className="text-xs text-gray-800 overflow-x-auto">{`const crypto = require('crypto');

const signature = req.headers['x-webhook-signature'];
const payload = JSON.stringify(req.body);
const expectedSignature = crypto
  .createHmac('sha256', 'your_webhook_secret')
  .update(payload)
  .digest('hex');

if (signature === expectedSignature) {
  // Webhook is authentic
}`}</pre>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Support */}
                    <section className="bg-blue-50 border border-blue-200 rounded-xl p-8">
                        <div className="flex items-center gap-4">
                            <div className="text-blue-600 bg-blue-100 p-3 rounded-xl">
                                <AppIcons.Support className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-blue-900 mb-2">Need Help?</h3>
                                <p className="text-blue-800 mb-4">Our developer community and support team are here to help you integrate with Clienn CRM.</p>
                                <div className="flex gap-4">
                                    <a href="mailto:support@clienn.com" className="text-blue-600 hover:text-blue-700 font-medium">
                                        Contact Support →
                                    </a>
                                    <a href="https://docs.clienn.com" className="text-blue-600 hover:text-blue-700 font-medium">
                                        Full Documentation →
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ApiDocsPage;


