const express = require('express');
const router = express.Router();
const mindmapController = require('../controllers/mindmapController');
const { checkPermission } = require('../middlewares/middleware');

router.get('/', mindmapController.getAllMindmaps);
router.post('/', mindmapController.addMindmap);

router
	.route('/:id')
	.get(checkPermission, mindmapController.getMindmap)
	.patch(checkPermission, mindmapController.updateMindmap)
	.delete(checkPermission, mindmapController.deleteMindmap);

module.exports = router;
