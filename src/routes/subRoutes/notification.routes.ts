import express from "express";
import * as notificationControler from "../../controller/notificationController";
import * as  authService from '../../middleware/authService'
const router = express.Router();

router.post("/api/notification/add", authService.authenticate, notificationControler.notificationCreate);
router.post("/api/notification/update", authService.authenticate, notificationControler.notificationUpdate);
router.post("/api/notification/delete", authService.authenticate, notificationControler.deleteNotification);
router.get('/api/notification/get-by-id', authService.authenticate, notificationControler.getNotificationListById);
router.get('/api/notification/list', authService.authenticate, notificationControler.getNotificationList);
router.get('/api/notification/get-all-alerts', authService.authenticate, notificationControler.getAllAlerts);

router.get('/api/notification/get-table-name-by-transaction-type', authService.authenticate, notificationControler.fetchTablesUsingTransactiontype);
router.get('/api/notification/get-column-names-by-table-names', authService.authenticate, notificationControler.fetchColumnsUsingTableNames);
router.get('/api/notification/get-sms-config-dropdown', authService.authenticate, notificationControler.getSMSTemplateDropDown);
router.get('/api/notification/get-whatsapp-config-dropdown', authService.authenticate, notificationControler.getWhatsappTemplateDropDown);

router.get('/api/notification/get-sms-whatsapp-templates', authService.authenticate, notificationControler.fetchSmsWhatsappTemplateUsingConfigId);
router.get('/api/notification/get-all-event-names', authService.authenticate, notificationControler.getAllEventNames);

export default router;
