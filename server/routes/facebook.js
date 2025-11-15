import express from 'express';
import { 
    redirectToFacebookAuth, 
    handleFacebookCallback,
    getFacebookPages,
    getPageForms
} from '../controllers/facebookController.js';

const router = express.Router();

// Redirects user to Facebook for authentication
router.get('/auth', redirectToFacebookAuth);

// Handles the callback from Facebook after authentication
router.get('/callback', handleFacebookCallback);

// Fetches the user's pages using their long-lived token
router.get('/pages', getFacebookPages);

// Fetches forms for a specific page using a page access token
router.get('/pages/:pageId/forms', getPageForms);

export default router;



