const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');

router.get('/', participantController.getAllParticipants);
router.post('/:mindmapId/:userId', participantController.addParticipant);

router.route('/:mindmapId/:userId')
    .get(participantController.getParticipant)
    .patch(participantController.updateParticipant)
    .delete(participantController.deleteParticipant);

module.exports = router;