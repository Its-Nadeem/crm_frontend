import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

// Import controllers
import {
    getCloudTelephonyIntegrations,
    getCloudTelephonyIntegration,
    createCloudTelephonyIntegration,
    updateCloudTelephonyIntegration,
    deleteCloudTelephonyIntegration,
    testCloudTelephonyIntegration,
    activateCloudTelephonyIntegration,
    deactivateCloudTelephonyIntegration
} from '../controllers/cloudTelephonyController.js';

import {
    getEmailMarketingIntegrations,
    getEmailMarketingIntegration,
    createEmailMarketingIntegration,
    updateEmailMarketingIntegration,
    deleteEmailMarketingIntegration,
    testEmailMarketingIntegration,
    activateEmailMarketingIntegration,
    deactivateEmailMarketingIntegration,
    addEmailTemplate,
    addMailingList
} from '../controllers/emailMarketingController.js';

import {
    getSMSMarketingIntegrations,
    getSMSMarketingIntegration,
    createSMSMarketingIntegration,
    updateSMSMarketingIntegration,
    deleteSMSMarketingIntegration,
    testSMSMarketingIntegration,
    activateSMSMarketingIntegration,
    deactivateSMSMarketingIntegration,
    addPhoneNumberToPool,
    addSMSTemplate
} from '../controllers/smsMarketingController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Cloud Telephony Integration Routes
router.route('/cloud-telephony')
    .get(getCloudTelephonyIntegrations)
    .post(createCloudTelephonyIntegration);

router.route('/cloud-telephony/:id')
    .get(getCloudTelephonyIntegration)
    .put(updateCloudTelephonyIntegration)
    .delete(deleteCloudTelephonyIntegration);

router.post('/cloud-telephony/:id/test', testCloudTelephonyIntegration);
router.post('/cloud-telephony/:id/activate', activateCloudTelephonyIntegration);
router.post('/cloud-telephony/:id/deactivate', deactivateCloudTelephonyIntegration);

// Email Marketing Integration Routes
router.route('/email-marketing')
    .get(getEmailMarketingIntegrations)
    .post(createEmailMarketingIntegration);

router.route('/email-marketing/:id')
    .get(getEmailMarketingIntegration)
    .put(updateEmailMarketingIntegration)
    .delete(deleteEmailMarketingIntegration);

router.post('/email-marketing/:id/test', testEmailMarketingIntegration);
router.post('/email-marketing/:id/activate', activateEmailMarketingIntegration);
router.post('/email-marketing/:id/deactivate', deactivateEmailMarketingIntegration);
router.post('/email-marketing/:id/templates', addEmailTemplate);
router.post('/email-marketing/:id/lists', addMailingList);

// SMS Marketing Integration Routes
router.route('/sms-marketing')
    .get(getSMSMarketingIntegrations)
    .post(createSMSMarketingIntegration);

router.route('/sms-marketing/:id')
    .get(getSMSMarketingIntegration)
    .put(updateSMSMarketingIntegration)
    .delete(deleteSMSMarketingIntegration);

router.post('/sms-marketing/:id/test', testSMSMarketingIntegration);
router.post('/sms-marketing/:id/activate', activateSMSMarketingIntegration);
router.post('/sms-marketing/:id/deactivate', deactivateSMSMarketingIntegration);
router.post('/sms-marketing/:id/templates', addSMSTemplate);
router.post('/sms-marketing/:id/phone-pools/:poolName/numbers', addPhoneNumberToPool);

export default router;


