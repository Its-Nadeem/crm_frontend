import fetch from 'node-fetch';

const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, FACEBOOK_REDIRECT_URI, FRONTEND_URL } = process.env;

// Step 1: Redirect user to Facebook's login dialog
export const redirectToFacebookAuth = (req, res) => {
    const scope = 'pages_show_list,leads_retrieval,pages_read_engagement,business_management';
    const url = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_REDIRECT_URI}&scope=${scope}&response_type=code`;
    res.redirect(url);
};

// Step 2 & 3: Handle the callback from Facebook, exchange code for a long-lived token
export const handleFacebookCallback = async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('Error: Code not provided');
    }

    try {
        // Step 2: Exchange code for a short-lived access token
        const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_REDIRECT_URI}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`;
        const tokenResponse = await fetch(tokenUrl);
        const tokenData = await tokenResponse.json();
        
        if (tokenData.error) {
            throw new Error(tokenData.error.message);
        }
        
        const shortLivedToken = tokenData.access_token;

        // Step 3: Exchange short-lived token for a long-lived token
        const longLivedTokenUrl = `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${shortLivedToken}`;
        const longLivedTokenResponse = await fetch(longLivedTokenUrl);
        const longLivedTokenData = await longLivedTokenResponse.json();
        
        if (longLivedTokenData.error) {
            throw new Error(longLivedTokenData.error.message);
        }

        const longLivedToken = longLivedTokenData.access_token;
        
        // Redirect back to the frontend with the token so it can be stored in the app's state.
        // In a production app with a database, you'd save this to the DB and use a session cookie.
        res.redirect(`${FRONTEND_URL}/#/integrations?status=fb_success&token=${longLivedToken}`);

    } catch (error) {
        console.error('Facebook OAuth Error:', error);
        res.redirect(`${FRONTEND_URL}/#/integrations?status=fb_error&message=${encodeURIComponent(error.message)}`);
    }
};

// Step 4: Use the user's access token to get their pages
export const getFacebookPages = async (req, res) => {
    const { authorization } = req.headers; // Expecting "Bearer <USER_TOKEN>"
    
    if (!authorization) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }
    const accessToken = authorization.split(' ')[1];
    
    if (!accessToken) {
        return res.status(401).json({ error: 'Access token missing' });
    }

    try {
        const url = `https://graph.facebook.com/me/accounts?fields=id,name,access_token&access_token=${accessToken}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) throw new Error(data.error.message);

        // We need page ID, name, and the page-specific access token
        const pages = data.data.map(page => ({
            id: page.id,
            name: page.name,
            accessToken: page.access_token
        }));
        
        res.json(pages);

    } catch (error) {
        console.error('Error fetching Facebook pages:', error);
        res.status(500).json({ error: error.message });
    }
};

// Step 5: Get forms for a specific page using a page access token
export const getPageForms = async (req, res) => {
    const { pageId } = req.params;
    const { authorization } = req.headers; // Expecting "Bearer <PAGE_ACCESS_TOKEN>"
     
    if (!authorization) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }
    const pageAccessToken = authorization.split(' ')[1];

    if (!pageAccessToken) {
        return res.status(401).json({ error: 'Page access token missing' });
    }

    try {
        const url = `https://graph.facebook.com/${pageId}/leadgen_forms?access_token=${pageAccessToken}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) throw new Error(data.error.message);
        
        const forms = data.data.map(form => ({
            id: form.id,
            name: form.name
        }));
        
        res.json(forms);

    } catch (error) {
        console.error(`Error fetching forms for page ${pageId}:`, error);
        res.status(500).json({ error: error.message });
    }
}


