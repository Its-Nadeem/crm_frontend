import express from 'express';
import { verifyWebhook, receiveLeads } from '../controllers/facebookController.js';

const router = express.Router();

// Facebook webhook routes (no auth required for webhooks)
router.route('/facebook')
    .get(verifyWebhook)  // Facebook verification
    .post(receiveLeads); // Receive Facebook leads

export default router;


