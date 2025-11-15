# Facebook Lead Ads Integration - Backend Only

This implementation provides a complete backend-only Facebook Lead Ads integration for your multi-tenant CRM system.

## Features Implemented

✅ **OAuth Flow**: Complete Facebook OAuth integration with long-lived tokens
✅ **Webhook Handler**: Real-time lead capture with idempotency
✅ **Multi-tenant Storage**: Per-tenant Facebook pages, forms, and mappings
✅ **Page Subscription**: Subscribe pages to webhooks for lead notifications
✅ **Form Mapping**: Map Facebook form fields to CRM fields
✅ **Lead Sync**: Manual backfill of historical leads
✅ **Debug Endpoints**: Helper endpoints for testing and verification

## Setup Instructions

### 1. Facebook App Configuration

1. **Create/Edit Facebook App**:
   - Go to [Facebook Developers](https://developers.facebook.com)
   - Create a new app or edit existing app (ID: `1426664171873898`)
   - Add **Facebook Login** product
   - Configure OAuth redirect URI: `https://crm.clienn.com/api/fb/auth/callback`

2. **Required Permissions**:
   Configure these scopes in your Facebook app:
   ```
   pages_read_engagement
   pages_show_list
   pages_manage_metadata
   leads_retrieval
   read_insights
   ```

3. **Webhook Setup**:
   - In your Facebook app, go to Webhooks section
   - Add webhook with these settings:
     - **Callback URL**: `https://YOUR_NGROK_HOST/webhook/facebook`
     - **Verify Token**: `fb_webhook_verify_token_2024_Clienn CRM_secure`
   - Subscribe to: **leadgen** events

### 2. Ngrok Setup

Install and configure ngrok for webhook testing:

```bash
# Install ngrok (if not already installed)
npm install -g ngrok

# Add your authtoken
ngrok config add-authtoken 33kJxYNrxBZbzQVDaovniHTPEKt_3c4dGhU2E8abRH32wnMdH

# Start ngrok tunnel
ngrok http --domain=YOUR_NGROK_DOMAIN 5000
# OR (if no custom domain):
npx ngrok http 5000
```

### 3. Backend Setup

The backend is already configured with your Facebook credentials:

```bash
# Terminal 1 (inside /backend)
cd backend
echo FB_VERIFY_TOKEN=fb_webhook_verify_token_2024_Clienn CRM_secure >> .env
npm install
npm run dev
```

## API Endpoints

### OAuth Flow
```bash
# 1. Start OAuth (get authorization URL)
GET /api/fb/auth/start?tenantId=org-1

# 2. User authorizes on Facebook, gets redirected to:
GET /api/fb/auth/callback?code=...&state=org-1

# 3. Check connected pages
GET /api/fb/pages?tenantId=org-1
```

### Webhook Testing
```bash
# Test webhook verification
GET /webhook/facebook?hub.mode=subscribe&hub.verify_token=fb_webhook_verify_token_2024_Clienn CRM_secure&hub.challenge=test123
# Should return: test123
```

### Page Management
```bash
# Subscribe page to webhook
POST /api/fb/pages/PAGE_ID/subscribe
{
  "tenantId": "org-1"
}

# Get lead forms for a page
GET /api/fb/forms?pageId=PAGE_ID&tenantId=org-1

# Map form fields to CRM
POST /api/fb/forms/FORM_ID/map
{
  "pageId": "PAGE_ID",
  "tenantId": "org-1",
  "fieldMapping": {
    "full_name": "name",
    "email": "email",
    "phone_number": "phone"
  }
}
```

### Lead Sync
```bash
# Backfill historical leads
POST /api/fb/sync/backfill
{
  "formId": "FORM_ID",
  "pageId": "PAGE_ID",
  "tenantId": "org-1",
  "since": "2024-01-01T00:00:00Z",
  "until": "2024-12-31T23:59:59Z"
}
```

### Debug
```bash
# Check recent Facebook leads
GET /api/fb/debug/leads?tenantId=org-1&limit=10
```

## Testing with Facebook Lead Ads Testing Tool

1. **Create a Lead Form**:
   - Go to your Facebook Page
   - Create a new Lead Ad campaign
   - Set up a lead form with test fields

2. **Use Facebook's Testing Tool**:
   - Go to [Facebook Lead Ads Testing Tool](https://developers.facebook.com/tools/lead-ads-testing/)
   - Select your Page and Form
   - Fill out the test form
   - The lead should appear in your CRM automatically

3. **Verify Integration**:
   ```bash
   # Check if lead was captured
   GET /api/fb/debug/leads?tenantId=org-1
   ```

## Environment Variables (Already Configured)

```env
FB_APP_ID=1426664171873898
FB_APP_SECRET=1cd03dd632cc094eae1ef80115938ac5
FB_REDIRECT_URI=https://crm.clienn.com/api/fb/auth/callback
FB_VERIFY_TOKEN=fb_webhook_verify_token_2024_Clienn CRM_secure
CLIENT_URL=https://crm.clienn.com
```

## Security Notes

- ✅ **Multi-tenant**: All data stored with `tenantId`
- ✅ **No Token Exposure**: Tokens never returned in API responses
- ✅ **Idempotency**: Duplicate leads prevented by `lead_id`
- ✅ **Secure Storage**: Tokens encrypted in database
- ✅ **CORS Protected**: API endpoints properly secured

## Troubleshooting

### Common Issues:

1. **"Cannot read properties of undefined (reading 'join')"**
   - MongoDB connection issue - check `.env` file
   - Restart backend server

2. **Webhook verification fails**
   - Check verify token matches exactly
   - Ensure ngrok tunnel is active

3. **OAuth fails**
   - Verify Facebook app permissions
   - Check redirect URI matches exactly

4. **No leads received**
   - Verify page is subscribed to webhooks
   - Check Facebook app has `leads_retrieval` permission
   - Test with Facebook Lead Ads Testing Tool

## Production Deployment

For production:
1. Update `FB_REDIRECT_URI` to your production domain
2. Use a custom ngrok domain or production webhook URL
3. Set `NODE_ENV=production` in environment
4. Configure proper SSL certificates
5. Set up monitoring for webhook health

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Facebook      │    │   Backend        │    │   MongoDB       │
│   Lead Ads      │◄──►│   Webhook        │◄──►│   Atlas         │
│                 │    │   Handler        │    │                 │
│ - OAuth Flow    │    │                  │    │ - Users         │
│ - Webhooks      │    │ - Facebook API   │    │ - Organizations │
│ - Lead Forms    │    │ - Lead Storage   │    │ - Leads         │
│                 │    │ - Multi-tenant   │    │ - FB Integration│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

The integration is now ready for testing! 🚀


