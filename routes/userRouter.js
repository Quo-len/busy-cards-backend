const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, authorize } = require('../middlewares/middleware');

router.get('/', userController.getAllUsers);
router.post('/', userController.addUser);

router
	.route('/:userId')
	.get(userController.getUser)
	.patch(verifyToken, authorize(['admin']), userController.updateUser)
	.delete(verifyToken, authorize(['admin']), userController.deleteUser);

module.exports = router;
