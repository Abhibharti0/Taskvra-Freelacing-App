const express = require('express');
const router = express.Router();

const protect = require('../middleware/authMiddleware');
const { requireAdmin, requireAdminOrModerator } = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');

router.use(protect);
router.use(requireAdminOrModerator);

router.get('/me', adminController.getMe);
router.get('/dashboard', adminController.getDashboard);

router.get('/users', adminController.getUsers);
router.post('/users', requireAdmin, adminController.createUser);
router.post('/users/admin', requireAdmin, adminController.createAdminUser);
router.get('/users/:id/activity', adminController.getUserActivity);
router.patch('/users/:id', requireAdmin, adminController.updateUserProfile);
router.patch('/users/:id/role', requireAdmin, adminController.changeUserRole);
router.patch('/users/:id/approve-freelancer', adminController.approveFreelancer);
router.patch('/users/:id/reject-freelancer', adminController.rejectFreelancer);
router.patch('/users/:id/ban', adminController.banUser);
router.patch('/users/:id/unban', adminController.unbanUser);
router.delete('/users/:id', requireAdmin, adminController.deleteUser);

router.get('/projects', adminController.getProjects);
router.post('/gigs', requireAdmin, adminController.createGigAsClient);
router.patch('/projects/:id', adminController.updateProject);
router.delete('/projects/:id', adminController.deleteProject);

router.get('/bids', adminController.getBids);

router.get('/transactions', adminController.getTransactions);
router.patch('/transactions/:id/escrow', adminController.updateEscrow);
router.get('/withdrawals', adminController.getWithdrawals);
router.patch('/withdrawals/:id', adminController.updateWithdrawal);

router.get('/disputes', adminController.getDisputes);
router.patch('/disputes/:id/resolve', adminController.resolveDispute);

router.get('/reviews', adminController.getReviews);
router.delete('/reviews/:id', adminController.deleteReview);

router.post('/announcements', requireAdmin, adminController.sendAnnouncement);

router.get('/reports', adminController.getReports);
router.get('/settings', requireAdmin, adminController.getSettings);
router.put('/settings', requireAdmin, adminController.updateSettings);
router.put('/security/password', requireAdmin, adminController.updateAdminPassword);

router.get('/activity-logs', requireAdmin, adminController.getActivityLogs);

module.exports = router;