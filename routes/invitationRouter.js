const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');

router.get('/', invitationController.getAllInvitations);
router.post('/', invitationController.sendInvitation);

router
	.route('/:id')
	.get(invitationController.getInvitation)
	.patch(invitationController.updateInvitation)
	.delete(invitationController.deleteInvitation);

module.exports = router;
