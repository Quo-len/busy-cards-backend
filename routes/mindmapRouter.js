const express = require('express');
const router = express.Router();
const mindmapController = require('../controllers/mindmapController');

router.get('/', mindmapController.getAllUsers);
router.post('/', mindmapController.addUser);

router.route('/:id')
    .get(mindmapController.getUser)
    .patch(mindmapController.updateUser)
    .delete(mindmapController.deleteUser);

module.exports = router;