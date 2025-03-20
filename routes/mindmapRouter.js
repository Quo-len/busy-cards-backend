const express = require('express');
const router = express.Router();
const mindmapController = require('../controllers/mindmapController');

router.get('/', mindmapController.getAllMindmaps);
router.post('/', mindmapController.addMindmap);

router.route('/:id')
    .get(mindmapController.getMindmap)
    .patch(mindmapController.updateMindmap)
    .delete(mindmapController.deleteMindmap);

module.exports = router;