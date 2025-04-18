const express = require("express");
const router = express.Router();

// IMPORT DEI CONTROLLER
// const tempTeamupController = require ("../controllers/temp_TeamupController"); // temp
const apiKeyController = require("../controllers/apiKeyController");
const appointmentsController = require("../controllers/appointmentsController");
const authController = require("../controllers/authController");
const clientsController = require("../controllers/clientsController");
const contractsController = require("../controllers/contractsController");
const editTablesController = require("../controllers/editTablesController");
const logsController = require('../controllers/logsController');
const commissioningController = require("../controllers/commissioningController");
const astConfigController = require("../controllers/astConfigController");
const settingsController = require("../controllers/settingsController");
const operatorsController = require("../controllers/operatorsController");
const notificationsController = require("../controllers/notificationsController");
const dashboardController = require("../controllers/dashboardController");
const reportsController = require("../controllers/reportsController");
const planningController = require("../controllers/planningController");


// IMPORT DEI MIDDLEWARE
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const apiKeyMidleware = require("../middleware/apiKeyMiddleware");
const apiKeyMiddleware = require("../middleware/apiKeyMiddleware");

// AUTH & USERS
router.post("/register", authMiddleware, authController.register);
router.post("/login", authController.login);
router.get("/users", authMiddleware, authController.getUsers);
router.put("/users/:id", authMiddleware, authController.updateUser);
router.delete("/users/:id", authMiddleware, roleMiddleware(4, 5), authController.deleteUser);
router.get("/roles", authMiddleware, roleMiddleware(4, 5), authController.getRoles);
router.get("/users/:id", authMiddleware, roleMiddleware(4, 5), authController.getUserById);
router.post("/logout", authMiddleware, authController.logout);
router.post("/verify-login-otp", authController.verifyLoginOTP);

// SETTINGS
router.get("/settings/get", authMiddleware, roleMiddleware(4, 5), settingsController.getSetting);
router.post("/settings/update", authMiddleware, roleMiddleware(4, 5), settingsController.updateSetting);

// EMAIL & AUTENTICAZIONE
router.get("/settings/smtp", authMiddleware, roleMiddleware(4, 5), settingsController.getSmtpSettings);
router.post("/settings/smtp", authMiddleware, roleMiddleware(4, 5), settingsController.saveSmtpSettings);
router.post("/send-email", authMiddleware, roleMiddleware(4, 5), settingsController.sendTestEmail);

// API KEYS 
router.post("/generate-api-key", authMiddleware, roleMiddleware(4, 5), apiKeyController.generateApiKey);
router.get("/api-keys", authMiddleware, roleMiddleware(4, 5), apiKeyController.getApiKeys);
router.delete("/api-keys/:id", authMiddleware, roleMiddleware(4, 5), apiKeyController.deleteApiKey);

// APPOINTMENTS (in list & drop)
router.get('/appointments', authMiddleware, roleMiddleware(4, 5), appointmentsController.getAllAppointments);
router.get('/appointments/with-clients', authMiddleware, roleMiddleware(4, 5), appointmentsController.getAppointmentsWithDetails);
router.get('/appointments/export', authMiddleware, roleMiddleware(4, 5), appointmentsController.exportAppointmentsCSV);
router.get("/appointment-status", authMiddleware, roleMiddleware(4, 5), appointmentsController.getAppointmentStatuses);
router.post('/appointments', authMiddleware, roleMiddleware(4, 5), appointmentsController.createAppointment);
router.post('/appointments-from-source', apiKeyMiddleware, appointmentsController.createAppointment);
router.put('/appointments/:id', authMiddleware, roleMiddleware(4, 5), appointmentsController.updateAppointment);
router.put('/appointments-clickfc/:id', authMiddleware, roleMiddleware(4, 5), appointmentsController.updateAppointmentClickFC);
router.put('/appointments-drop/:id', authMiddleware, roleMiddleware(4, 5), appointmentsController.updateAppointmentDrop);
router.delete('/appointments/:id', authMiddleware, roleMiddleware(4, 5), appointmentsController.deleteAppointment);

// PLANNING AGENTI
router.get('/agents-planning', authMiddleware, roleMiddleware(4, 5), planningController.getAllPlannings);
router.post('/agents-planning', authMiddleware, roleMiddleware(4, 5), planningController.createPlanning);
router.put('/agents-planning/:id', authMiddleware, roleMiddleware(4, 5), planningController.updatePlanning);
router.delete('/agents-planning/:id', authMiddleware, roleMiddleware(4, 5), planningController.deletePlanning);
router.get("/calendar-agents-planning", authMiddleware, planningController.getPlanningsForCalendar);



// PROFILE & 2FA
router.get("/user/me", authMiddleware, authController.getUserProfile);
router.put("/user/update", authMiddleware, authController.updateProfile);
router.post("/user/change-password", authMiddleware, authController.changePassword);
router.post("/user/enable-2fa", authMiddleware, authController.enable2FA);
router.post("/user/verify-2fa", authMiddleware, authController.verify2FA);
router.post("/user/disable-2fa", authMiddleware, authController.disable2FA);

// CLIENTS
router.post('/clients', authMiddleware, roleMiddleware(4, 5), clientsController.createClient);
router.get('/clients', authMiddleware, roleMiddleware(4, 5), clientsController.getAllClients);
router.get('/appointments/client/:clientId', authMiddleware, roleMiddleware(4, 5), clientsController.getAppointmentsByClient);
router.get('/contracts/client/:clientId', authMiddleware, roleMiddleware(4, 5), clientsController.getContractsByClient);
router.put('/clients/:id', authMiddleware, roleMiddleware(4, 5), clientsController.updateClient);
router.get("/clients/:id", authMiddleware, roleMiddleware(4, 5), clientsController.getClientById);
router.get('/legal-forms', authMiddleware, roleMiddleware(4, 5), clientsController.getAllLegalForms);

// DOCUMENTS
router.get("/documents/:id/presigned-url", authMiddleware, roleMiddleware(4, 5), contractsController.getPresignedUrl);

// CONTRACTS
router.post("/contracts", authMiddleware, roleMiddleware(4, 5), contractsController.createContract);
router.get("/contracts", authMiddleware, roleMiddleware(4, 5), contractsController.getAllContracts);
router.get("/contracts/:id/products-with-details", authMiddleware, roleMiddleware(4, 5), contractsController.getContractProductsWithDetails);
router.get("/contracts/:id", authMiddleware, roleMiddleware(4, 5), contractsController.getContractById);
router.get("/contract-status", authMiddleware, roleMiddleware(4, 5), contractsController.getContractStatuses);
router.put("/contracts/:id", authMiddleware, roleMiddleware(4, 5), contractsController.updateContract);
router.get("/contracts/:contract_id/documents", authMiddleware, roleMiddleware(4, 5), contractsController.getContractDocuments);
router.delete("/contracts/:contractId/products/:productId", authMiddleware, roleMiddleware(4, 5), contractsController.deleteContractProduct);
router.post("/contracts/upload", authMiddleware, roleMiddleware(4, 5), contractsController.uploadContractDocuments);
router.get("/appointments/positive", authMiddleware, roleMiddleware(4, 5), contractsController.getPositiveAppointments);
router.delete("/contracts/:id", authMiddleware, roleMiddleware(4, 5), contractsController.deleteContract);
router.get("/vendors", authMiddleware, roleMiddleware(4, 5), contractsController.getVendors);
router.get("/products", authMiddleware, roleMiddleware(4, 5), contractsController.getProductsByVendor);
router.get("/document-types", authMiddleware, roleMiddleware(4, 5), contractsController.getDocumentTypes);
router.post("/contracts/:id/products", authMiddleware, roleMiddleware(4, 5), contractsController.addProductToContract);
router.put("/contracts/:id/confirm", authMiddleware, roleMiddleware(4, 5), contractsController.confirmContract);
router.put("/appointments/:id/status", authMiddleware, roleMiddleware(4, 5), contractsController.updateAppointmentStatus);
router.get("/contracts/:id/products", authMiddleware, roleMiddleware(4, 5), contractsController.getContractProducts);
router.delete("/contracts/:contract_id/documents/:document_id", authMiddleware, roleMiddleware(4, 5), contractsController.deleteContractDocument);



// TABLES EDIT
router.post('/legal-forms-table', authMiddleware, roleMiddleware(4, 5), editTablesController.createLegalFormTable);
router.get('/legal-forms-table', authMiddleware, roleMiddleware(4, 5), editTablesController.getAllLegalFormsTable);
router.put('/legal-forms-table/:id', authMiddleware, roleMiddleware(4, 5), editTablesController.updateLegalFormTable);
router.delete('/legal-forms-table/:id', authMiddleware, roleMiddleware(4, 5), editTablesController.deleteLegalFormTable);

router.post("/roles-table", authMiddleware, roleMiddleware(4, 5), editTablesController.createRoleTable);
router.get("/roles-table", authMiddleware, roleMiddleware(4, 5), editTablesController.getAllRolesTable);
router.put("/roles-table/:id", authMiddleware, roleMiddleware(4, 5), editTablesController.updateRoleTable);
router.delete("/roles-table/:id", authMiddleware, roleMiddleware(4, 5), editTablesController.deleteRoleTable);

router.post("/documents-template-table", authMiddleware, roleMiddleware(4, 5), editTablesController.createDocumentTable);
router.get("/documents-template-table", authMiddleware, roleMiddleware(4, 5), editTablesController.getAllDocumentsTable);
router.put("/documents-template-table/:id", authMiddleware, roleMiddleware(4, 5), editTablesController.updateDocumentTable);
router.delete("/documents-template-table/:id", authMiddleware, roleMiddleware(4, 5), editTablesController.deleteDocumentTable);

router.post("/appointment-status-table", authMiddleware, roleMiddleware(4, 5), editTablesController.createAppointmentStatusTable);
router.get("/appointment-status-table", authMiddleware, roleMiddleware(4, 5), editTablesController.getAllAppointmentStatusesTable);
router.put("/appointment-status-table/:id", authMiddleware, roleMiddleware(4, 5), editTablesController.updateAppointmentStatusTable);
router.delete("/appointment-status-table/:id", authMiddleware, roleMiddleware(4, 5), editTablesController.deleteAppointmentStatusTable);

router.post("/contract-status-table", authMiddleware, roleMiddleware(4, 5), editTablesController.createContractStatusTable);
router.get("/contract-status-table", authMiddleware, roleMiddleware(4, 5), editTablesController.getAllContractStatusTable);
router.put("/contract-status-table/:id", authMiddleware, roleMiddleware(4, 5), editTablesController.updateContractStatusTable);
router.delete("/contract-status-table/:id", authMiddleware, roleMiddleware(4, 5), editTablesController.deleteContractStatusTable);

router.get("/adjustment-types-table", authMiddleware, roleMiddleware(4, 5), editTablesController.getAllAdjustmentTypes);
router.get("/adjustment-types-table/:id", authMiddleware, roleMiddleware(4, 5), editTablesController.getAdjustmentTypeById);
router.post("/adjustment-types-table", authMiddleware, roleMiddleware(4, 5), editTablesController.createAdjustmentType);
router.put("/adjustment-types-table/:id", authMiddleware, roleMiddleware(4, 5), editTablesController.updateAdjustmentType);
router.delete("/adjustment-types-table/:id", authMiddleware, roleMiddleware(4, 5), editTablesController.deleteAdjustmentType);

router.get("/locations-table", authMiddleware, roleMiddleware(4, 5), editTablesController.getAllLocations);
router.get("/locations-table/:id", authMiddleware, roleMiddleware(4, 5), editTablesController.getLocationById);
router.post("/locations-table", authMiddleware, roleMiddleware(4, 5), editTablesController.createLocation);
router.put("/locations-table/:id", authMiddleware, roleMiddleware(4, 5), editTablesController.updateLocation);
router.delete("/locations-table/:id", authMiddleware, roleMiddleware(4, 5), editTablesController.deleteLocation);

router.get("/hourly-payments-table", authMiddleware, roleMiddleware(4, 5), editTablesController.getAllHourlyPayments);
router.get("/hourly-payments-table/:id", authMiddleware, roleMiddleware(4, 5), editTablesController.getHourlyPaymentById);
router.post("/hourly-payments-table", authMiddleware, roleMiddleware(4, 5), editTablesController.createHourlyPayment);
router.put("/hourly-payments-table/:id", authMiddleware, roleMiddleware(4, 5), editTablesController.updateHourlyPayment);
router.delete("/hourly-payments-table/:id", authMiddleware, roleMiddleware(4, 5), editTablesController.deleteHourlyPayment);

// LOGS
router.get('/logs', logsController.getLogs);

// COMMISSIONS
router.get("/products_commissioning", authMiddleware, roleMiddleware(4, 5), commissioningController.getAllCommissions);
router.get("/products_commissioning/:id", authMiddleware, roleMiddleware(4, 5), commissioningController.getCommissionById);
router.post("/products_commissioning", authMiddleware, roleMiddleware(4, 5), commissioningController.createCommission);
router.put("/products_commissioning/:id", authMiddleware, roleMiddleware(4, 5), commissioningController.updateCommission);
router.delete("/products_commissioning/:id", authMiddleware, roleMiddleware(4, 5), commissioningController.deleteCommission);
router.put("/products_commissioning/:id/archive", authMiddleware, roleMiddleware(4, 5), commissioningController.toggleArchiveCommission);

// PRODUCTS
router.get("/productsComm", authMiddleware, roleMiddleware(4, 5), commissioningController.getAllProducts);
router.get("/products/:id", authMiddleware, roleMiddleware(4, 5), commissioningController.getProductById);
router.post("/products", authMiddleware, roleMiddleware(4, 5), commissioningController.createProduct);
router.put("/products/:id", authMiddleware, roleMiddleware(4, 5), commissioningController.updateProduct);
router.delete("/products/:id", authMiddleware, roleMiddleware(4, 5), commissioningController.deleteProduct);
router.put("/products/:id/archive", authMiddleware, roleMiddleware(4, 5), commissioningController.toggleArchiveProduct);

// VENDORS
router.get("/vendors", authMiddleware, roleMiddleware(4, 5), commissioningController.getAllVendors);
router.get("/vendors/:id", authMiddleware, roleMiddleware(4, 5), commissioningController.getVendorById);
router.post("/vendors", authMiddleware, roleMiddleware(4, 5), commissioningController.createVendor);
router.put("/vendors/:id", authMiddleware, roleMiddleware(4, 5), commissioningController.updateVendor);
router.delete("/vendors/:id", authMiddleware, roleMiddleware(4, 5), commissioningController.deleteVendor);
router.put("/vendors/:id/archive", authMiddleware, roleMiddleware(4, 5), commissioningController.toggleArchiveVendor);

// ADJUSTMENTS - AGGIUSTAMENTI MANUALI (manual_adjustments)
router.get("/manual-adjustments", authMiddleware, roleMiddleware(4, 5), commissioningController.getAllManualAdjustments);
router.get("/manual-adjustments/:id", authMiddleware, roleMiddleware(4, 5), commissioningController.getManualAdjustmentById);
router.post("/manual-adjustments", authMiddleware, roleMiddleware(4, 5), commissioningController.createManualAdjustment);
router.put("/manual-adjustments/:id", authMiddleware, roleMiddleware(4, 5), commissioningController.updateManualAdjustment);
router.delete("/manual-adjustments/:id", authMiddleware, roleMiddleware(4, 5), commissioningController.deleteManualAdjustment);
router.put("/manual-adjustments/:id/archive", authMiddleware, roleMiddleware(4, 5), commissioningController.toggleArchiveManualAdjustment);

// CALCOLI COMMISSIONS, GENERAZIONE ANTEPRIME, SALVATAGGIO, EXPORT
router.get("/calculate-commissions", authMiddleware, roleMiddleware(4, 5), commissioningController.calculateCommissions);
router.get("/preview-commissions", authMiddleware, roleMiddleware(4, 5), commissioningController.previewCommissions);
router.post("/save-commissions", authMiddleware, roleMiddleware(4, 5), commissioningController.saveCommissions);
router.get("/get-commissions", authMiddleware, roleMiddleware(4, 5), commissioningController.getCommissions);
router.get("/get-archived-commissions", authMiddleware, roleMiddleware(4, 5), commissioningController.getArchivedCommissions);
router.get("/get-contract-details", authMiddleware, roleMiddleware(4, 5), commissioningController.getContractDetails);
router.delete("/delete-commission-month/:year/:month", authMiddleware, roleMiddleware(4, 5), commissioningController.deleteCommissionMonth);
router.get("/get-agents-by-month", authMiddleware, roleMiddleware(4, 5), commissioningController.getAgentsByMonth);
router.get("/get-contracts-by-agent", authMiddleware, roleMiddleware(4, 5), commissioningController.getContractsByAgentComm);
router.get("/export-detailed-pdf", authMiddleware, roleMiddleware(4, 5), commissioningController.exportToPDF);
router.get("/contractscomm/:contract_id", authMiddleware, roleMiddleware(4, 5), commissioningController.getContractDetailsForCommissions);

// CONFIGURAZIONI ASTERISK
router.post("/ast/fetch-timelogs", authMiddleware, astConfigController.fetchAndStoreTimelogs);
router.get("/ast/config", authMiddleware, astConfigController.getConfig);
router.post("/ast/config", authMiddleware, astConfigController.updateConfig);
router.post("/ast/save-hours", authMiddleware, astConfigController.saveHours);
router.get("/ast/timelogs", authMiddleware, astConfigController.getTimelogs);
router.put("/ast/timelogs/:id", authMiddleware, astConfigController.updateTimelog);
router.get("/ast/timelogs/summary", authMiddleware, astConfigController.getAggregatedTimelogs);
router.get("/ast/check-timelog", astConfigController.checkTimelogExists); +

    // BONUS & PAGHE OPERATORI
    router.get("/operators/bonus", authMiddleware, operatorsController.getBonuses);
router.post("/operators/bonus", authMiddleware, roleMiddleware(4, 5), operatorsController.setBonus);
router.put("/operators/bonus/:id/archive", authMiddleware, roleMiddleware(4, 5), operatorsController.archiveBonus);
router.put("/operators/bonus/:id", authMiddleware, roleMiddleware(4, 5), operatorsController.updateBonus);
router.delete("/operators/bonus/:id", authMiddleware, roleMiddleware(4, 5), operatorsController.deleteBonus);
router.get("/operators/payments", authMiddleware, roleMiddleware(4, 5), operatorsController.generateOperatorPayroll);

// NOTIFICHE DI SISTEMA E SCHEDULAZIONI INVIO AGENDE
router.get("/notifications/schedule", authMiddleware, roleMiddleware(4, 5), notificationsController.getNotifications);
router.post("/notifications/create", authMiddleware, roleMiddleware(4, 5), notificationsController.createNotification);
router.delete("/notifications/schedule/:id", authMiddleware, roleMiddleware(4, 5), notificationsController.deleteNotification);
router.post("/notifications/send-agenda", authMiddleware, roleMiddleware(4, 5), notificationsController.sendAgendaNow);
router.get("/notifications/send-scheduled", authMiddleware, roleMiddleware(4, 5), notificationsController.sendNextWorkdayAgenda);
router.put("/notifications/update/:id", authMiddleware, roleMiddleware(4, 5), notificationsController.updateNotification);

// API PER LA DASHBOARD
router.get("/db/ast/login-summary", authMiddleware, roleMiddleware(4, 5), dashboardController.getLoginSummary);
router.get("/db/appointments/daily-summary", authMiddleware, roleMiddleware(4, 5), dashboardController.getDailyAppointmentsSummary);
router.get("/db/positive-appointments/daily-summary", authMiddleware, roleMiddleware(4, 5), dashboardController.getMonthlyPositiveAppointmentsSummary);
router.get("/db/appointments/conversions-summary", authMiddleware, roleMiddleware(4, 5), dashboardController.getMonthlyConversionsSummary);
router.get("/db/users/active-summary", authMiddleware, roleMiddleware(4, 5), dashboardController.getActiveUsersByLocationAndRole);
router.get("/db/contracts/weekly-agent-summary", authMiddleware, roleMiddleware(4, 5), dashboardController.getContractsByAgentPerWeek);
router.get("/db/contracts/monthly-vendor-summary", authMiddleware, roleMiddleware(4, 5), dashboardController.getContractsByVendorMonthly);
router.get("/db/contracts/sphbylocation", authMiddleware, roleMiddleware(4, 5), dashboardController.getSPHByLocation);
router.get('/db/contracts/monthly-by-location', authMiddleware, roleMiddleware(4, 5), dashboardController.getMonthlyFinalizedContractsByLocation);
router.get("/db/appointments/conversion-rate-by-location-vendor", authMiddleware, roleMiddleware(4, 5), dashboardController.getConversionRateByLocation);

// REPORTS
router.get("/reports/:type", authMiddleware, roleMiddleware(4, 5), reportsController.getReportByType);
router.post("/reports/send-email", authMiddleware, roleMiddleware(4, 5), reportsController.sendAppointmentsReportEmail);
router.get("/reports/email-logs", authMiddleware, roleMiddleware(4, 5), settingsController.getEmailLogs);






// ROTTE TEMPORANEE PER TEAMUP
/* router.post("/teamup/save-events", authMiddleware, roleMiddleware(4, 5), tempTeamupController.saveTeamupEvents);
router.get("/teamup/restore-event/:eventId", authMiddleware, roleMiddleware(4, 5), tempTeamupController.restoreEventNotes);
router.get("/teamup/saved-events", authMiddleware, roleMiddleware(4, 5), tempTeamupController.getSavedEventsByDate); */

module.exports = router;